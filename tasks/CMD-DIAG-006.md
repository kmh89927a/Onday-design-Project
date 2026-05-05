---
name: Feature Task
title: "[Feature] CMD-DIAG-006: 교통 API 타임아웃 핸들링 (5초 + 재시도 1회 + Sentry, CMD-DIAG-002 패턴 보강)"
labels: ['feature', 'priority:M', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DIAG-006] 교통 API 타임아웃 핸들링 — 5초 타임아웃 + 자동 재시도 1회 + Sentry 로그
- **목적 (Why):**
  - **비즈니스:** 카카오 모빌리티 API 장애/지연 시 사용자가 무한 로딩에 빠지지 않도록 보호한다.
  - **사용자 가치:** 5초 타임아웃 + 1회 재시도로 투명한 에러 안내를 제공하여, "앱이 멈춤" 경험을 0건으로 만든다.
- **범위 (What):**
  - ✅ 만드는 것: `lib/external/kakao-transport/with-timeout.ts` (callWithTimeout), `lib/external/kakao-transport/with-retry.ts` (callWithRetry), Sentry 에러 리포팅 통합
  - ❌ 만들지 않는 것: 카카오 API 클라이언트 구현(API-007), 교집합 산출(CMD-DIAG-002), UI 에러 토스트(UI-003)
- **복잡도:** M
- **Wave:** 3 (Diagnosis 트랙)
- **⚠️ CMD-DIAG-002와의 관계 (충돌 방지 — 핵심):** CMD-DIAG-002는 여러 후보 동네에 동시 호출 → Promise.allSettled로 부분 실패 허용. CMD-DIAG-006은 **단일 호출 단위의 타임아웃 + 재시도 정책**을 정의. 두 ISSUE는 통합 동작한다.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-007** (§4.1.1): "시스템은 교통 API 타임아웃(5초 이상 무응답) 발생 시 \"일시적 오류\" 토스트를 표시하고 자동 재시도 1회를 수행해야 한다. 재시도 실패 시 \"잠시 후 다시 시도해 주세요\" 안내를 표시하고 실패 로그를 전송해야 한다. 재시도 포함 총 응답은 10초 이내이며, 무한 로딩 노출은 0건이어야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §6.3.1 진단 시퀀스 (타임아웃 부분)

```
alt 카카오 API 타임아웃 (5초)
    Web→Kakao: 자동 재시도 1회
    alt 재시도 성공
        Kakao→Web: 경로 응답
    else 재시도 실패
        Web→Sentry: API 실패 로그 전송
        Web→User: "잠시 후 다시 시도해 주세요" 안내 (총 ≤ 10초)
    end
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| CMD-DIAG-002 ✅ | `calculateIntersection()` — Promise.allSettled 패턴 | `@/lib/diagnosis/intersection` | 본 ISSUE의 타임아웃·재시도가 내부 단위 호출에 적용 |
| API-007 ✅ | `IKakaoTransportClient`, `KakaoTransportClientConfig`, `DEFAULT_KAKAO_CONFIG` | `@/lib/external/kakao-transport` | 타임아웃·재시도 설정값 참조 |
| MON-001 ✅ | `reportErrorToSentry` | `@/lib/monitoring/sentry-reporter` | 재시도 실패 시 Sentry 리포팅 |
| API-002 ✅ | `DiagnosisErrorCode` | `@/lib/types/diagnosis` | `TRANSPORT_API_TIMEOUT`, `TRANSPORT_API_RETRY_FAILED` |
| MOCK-004 ✅ | 카카오 Mock 응답 | `@/lib/mocks/kakao-transport` | 테스트 시 타임아웃 시뮬레이션 |

### CMD-DIAG-002와의 통합 관계

> 본 ISSUE의 타임아웃·재시도 로직은 CMD-DIAG-002의 Promise.allSettled **내부 단위 호출**에 적용된다. CMD-DIAG-002는 여러 후보 동네에 동시 호출 → 일부 실패 허용. CMD-DIAG-006은 단일 API 호출의 5초 타임아웃 + 1회 재시도를 정의. 두 ISSUE는 **통합 동작**한다.

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/external/kakao-transport/with-timeout.ts`에 타임아웃 래퍼 구현
  ```typescript
  export class TimeoutError extends Error {
    constructor(public readonly timeoutMs: number) {
      super(`Request timed out after ${timeoutMs}ms`);
      this.name = 'TimeoutError';
    }
  }

  export async function callWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number = 5000
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new TimeoutError(timeoutMs)), timeoutMs)
        ),
      ]);
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }
  ```

- [ ] **3.2** `lib/external/kakao-transport/with-retry.ts`에 재시도 래퍼 구현
  ```typescript
  import { callWithTimeout, TimeoutError } from './with-timeout';
  import { reportErrorToSentry } from '@/lib/monitoring/sentry-reporter';
  import { DiagnosisErrorCode } from '@/lib/types/diagnosis';

  export async function callWithRetry<T>(
    fn: () => Promise<T>,
    options: { timeoutMs?: number; maxRetries?: number; retryDelayMs?: number } = {}
  ): Promise<T> {
    const { timeoutMs = 5000, maxRetries = 1, retryDelayMs = 500 } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await callWithTimeout(fn, timeoutMs);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    // 재시도 실패 → Sentry 로깅
    reportErrorToSentry(
      DiagnosisErrorCode.TRANSPORT_API_RETRY_FAILED as any,
      lastError!,
      { domain: 'kakao-transport', retried: true, maxRetries, timeoutMs }
    );
    throw lastError;
  }
  ```

- [ ] **3.3** `lib/external/kakao-transport/index.ts` 배럴 export 업데이트
  ```typescript
  export * from './with-timeout';
  export * from './with-retry';
  ```

- [ ] **3.4** CMD-DIAG-002 `intersection.ts` 통합 가이드 문서화
  ```typescript
  // CMD-DIAG-002의 intersection.ts에서의 사용 예시 (통합 가이드):
  import { callWithRetry } from '@/lib/external/kakao-transport';
  // Promise.allSettled 내부 단위 호출에 callWithRetry 적용
  const promises = pool.map(async (entry) => {
    const [routeA, routeB] = await Promise.all([
      callWithRetry(() => transportClient.getRoute({ origin: coordA, destination: entry.coord })),
      callWithRetry(() => transportClient.getRoute({ origin: coordB, destination: entry.coord })),
    ]);
    // ...
  });
  const results = await Promise.allSettled(promises);
  ```

- [ ] **3.5** `__tests__/external/with-timeout.spec.ts`에 타임아웃 테스트 (4개 케이스)
  ```typescript
  import { callWithTimeout, TimeoutError } from '@/lib/external/kakao-transport/with-timeout';

  describe('callWithTimeout', () => {
    it('정상 응답 시 결과 반환', async () => {
      const result = await callWithTimeout(() => Promise.resolve('ok'), 5000);
      expect(result).toBe('ok');
    });

    it('5초 후 TimeoutError throw', async () => {
      const slowFn = () => new Promise(r => setTimeout(r, 6000));
      await expect(callWithTimeout(slowFn, 5000)).rejects.toThrow(TimeoutError);
    });

    it('타임아웃 전 완료 시 정상 반환', async () => {
      const fastFn = () => new Promise<string>(r => setTimeout(() => r('fast'), 100));
      const result = await callWithTimeout(fastFn, 5000);
      expect(result).toBe('fast');
    });

    it('커스텀 timeoutMs 적용', async () => {
      const slowFn = () => new Promise(r => setTimeout(r, 2000));
      await expect(callWithTimeout(slowFn, 1000)).rejects.toThrow(TimeoutError);
    });
  });
  ```

- [ ] **3.6** `__tests__/external/with-retry.spec.ts`에 재시도 테스트 (5개 케이스)
  ```typescript
  import { callWithRetry } from '@/lib/external/kakao-transport/with-retry';
  import { reportErrorToSentry } from '@/lib/monitoring/sentry-reporter';

  vi.mock('@/lib/monitoring/sentry-reporter');

  describe('callWithRetry', () => {
    it('정상 응답 시 재시도 X — 1회만 호출', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const result = await callWithRetry(fn);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('1회 실패 + 재시도 성공 — 총 2회 호출', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('ok');
      const result = await callWithRetry(fn);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('2회 모두 실패 — Sentry 이벤트 발생 + 에러 throw', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      await expect(callWithRetry(fn)).rejects.toThrow('fail');
      expect(reportErrorToSentry).toHaveBeenCalledWith(
        expect.any(String), expect.any(Error),
        expect.objectContaining({ domain: 'kakao-transport', retried: true })
      );
    });

    it('재시도 간 0.5초 대기', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('ok');
      const start = performance.now();
      await callWithRetry(fn, { retryDelayMs: 500 });
      expect(performance.now() - start).toBeGreaterThanOrEqual(450);
    });

    it('재시도 실패 시 tags에 domain, retried 포함', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      await expect(callWithRetry(fn)).rejects.toThrow();
      expect(reportErrorToSentry).toHaveBeenCalledWith(
        expect.any(String), expect.any(Error),
        expect.objectContaining({ domain: 'kakao-transport', retried: true, maxRetries: 1 })
      );
    });
  });
  ```

- [ ] **3.7** `__tests__/external/timeout-integration.spec.ts`에 CMD-DIAG-002 통합 시뮬레이션
  ```typescript
  describe('CMD-DIAG-002 + CMD-DIAG-006 통합', () => {
    it('Promise.allSettled 내부에서 callWithRetry 적용 시 부분 실패 허용', async () => { /* ... */ });
    it('무한 로딩 0건 — 최대 5s + retry 5s + delay 0.5s = 10.5s 이내 완료', async () => { /* ... */ });
  });
  ```

- [ ] **3.8** MOCK-004 활용 테스트 데이터 — 타임아웃 시뮬레이션 Mock 작성
  ```typescript
  const delayedMockClient: IKakaoTransportClient = {
    getRoute: async () => {
      await new Promise(r => setTimeout(r, 6000)); // 6초 → 타임아웃 발동
      return MOCK_ROUTE_RESPONSES.normal;
    },
    getCommuteTime: async () => { /* ... */ },
  };
  ```

- [ ] **3.9** 정적 분석 + v1.3 정합성 검증
  ```bash
  grep -ri "NextAuth\|payment\|AES\|bcrypt" lib/external/kakao-transport/with-*.ts  # → 0건
  ```

- [ ] **3.10** TypeScript 타입 호환성: `npx tsc --noEmit`

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 정상 응답 시 재시도 없음
- **Given** 카카오 API가 3초 이내 정상 응답
- **When** `callWithRetry(() => client.getRoute(req))` 호출
- **Then** 결과 반환, 호출 횟수 1회, 재시도 0회

**AC-2 (예외):** 5초 타임아웃 후 자동 재시도 1회
- **Given** 카카오 API 1차 호출이 5초 무응답
- **When** `callWithTimeout` 발동 → `callWithRetry` 재시도 1회
- **Then** 재시도에서 정상 응답 시 결과 반환 (총 2회 호출)

**AC-3 (예외):** 재시도 실패 시 Sentry 이벤트 발생
- **Given** 1차 호출 5초 타임아웃, 재시도도 5초 타임아웃
- **When** `callWithRetry` 2회 모두 실패
- **Then** `reportErrorToSentry` 호출 (tags: `{ domain: 'kakao-transport', retried: true }`), 에러 throw

**AC-4 (경계):** 재시도 간 0.5초 대기
- **Given** 1차 실패 후 재시도 대기
- **When** 타이밍 측정
- **Then** 재시도 시작까지 ≥ 500ms 대기 (서버 부하 완화)

**AC-5 (도메인 핵심):** 무한 로딩 0건
- **Given** 최악의 경우 (2회 모두 5초 타임아웃 + 0.5초 대기)
- **When** 전체 소요 시간 계산
- **Then** 최대 10.5초 이내 완료. 무한 로딩 발생 0건

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | 단일 호출 5초 타임아웃. 재시도 포함 총 10초 이내. CMD-DIAG-002 전체 시퀀스 내 p95 호환 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 재시도 실패 시 `reportErrorToSentry` 호출. tags에 domain/retried 포함 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/external/kakao-transport/with-timeout.ts` (callWithTimeout + TimeoutError)
- `lib/external/kakao-transport/with-retry.ts` (callWithRetry — 5초 + 1회 재시도)
- `__tests__/external/with-timeout.spec.ts` (4개 케이스)
- `__tests__/external/with-retry.spec.ts` (5개 케이스)
- `__tests__/external/timeout-integration.spec.ts` (2개 케이스 — CMD-DIAG-002 통합)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **CMD-DIAG-002 ✅:** Promise.allSettled 패턴 — 본 ISSUE의 재시도 로직이 내부 호출에 적용
- **API-007 ✅:** `IKakaoTransportClient`, `DEFAULT_KAKAO_CONFIG` (timeoutMs: 5000, maxRetries: 1)
- **MON-001 ✅:** `reportErrorToSentry` — 재시도 실패 시 Sentry 리포팅

### 후행:
- **TEST-002:** 교통 API 타임아웃 GWT 시나리오 — 본 ISSUE의 callWithRetry 활용
- **UI-003:** 지도 시각화 — 에러 시 토스트 트리거

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/external/with-timeout.spec.ts` — 4개 케이스 (정상, 타임아웃, 경계, 커스텀)
- **단위 테스트:** `__tests__/external/with-retry.spec.ts` — 5개 케이스 (정상, 재시도 성공, 재시도 실패, 대기 시간, Sentry tags)
- **통합 테스트:** `__tests__/external/timeout-integration.spec.ts` — 2개 케이스 (Promise.allSettled 통합, 무한 로딩 0건)
- **정적 검증:** v1.3 정합성 grep → 0건
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **재시도 backoff 정책:** 현재 0.5초 고정 대기. 지수 백오프(exponential backoff) 도입은 v1.5+에서 검토.
2. **CMD-DIAG-002 ISSUE 갱신 권장:** 본 ISSUE의 5s 타임아웃·재시도 1회 정책이 CMD-DIAG-002의 Promise.allSettled 내부 호출에 적용됨을 CMD-DIAG-002 ISSUE에도 cross-reference로 추가.
3. **AbortController 통합:** 현재 Promise.race 기반. fetch의 AbortController signal과 통합 시 브라우저 리소스 해제 개선 가능.
4. **타임아웃 값 환경변수화:** 현재 5000ms 하드코딩. `KAKAO_TIMEOUT_MS` 환경변수로 전환 검토.
