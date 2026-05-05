---
name: Feature Task
title: "[Test] TEST-002: 교통 API 타임아웃 핸들링 — 5초 타임아웃 재시도 성공/실패, 무한 로딩 0건 검증"
labels: ['test', 'priority:M', 'epic:Test-Diagnosis', 'wave:6']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-002] 교통 API 타임아웃 핸들링 — Playwright E2E + Vitest 단위 통합 테스트
- **목적:** CMD-DIAG-006(callWithTimeout, callWithRetry)의 5초 타임아웃 + 1회 재시도 정책을 GWT 패턴으로 검증한다. 재시도 성공/실패 시나리오를 분리하고, 무한 로딩 0건을 보장한다. TEST-001(배치 13)에서 확립한 Playwright E2E 패턴을 계승한다.
- **범위:**
  - ✅ Playwright E2E 4개 시나리오 (5초 타임아웃 발동, 재시도 성공, 재시도 실패 + Sentry, 무한 로딩 0건), Vitest 단위 테스트 (callWithTimeout/callWithRetry 통합), MSW Mock 핸들러 (카카오 API 타임아웃 시뮬레이션), Mock 모드 / 실제 모드 분기 (NEXT_PUBLIC_USE_MOCK)
  - ❌ CI 통합 (별도 INFRA 태스크), 결제, NextAuth.js, AES-256
- **복잡도:** M | **Wave:** 6 (Test Wave 1)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-007** (§4.1.1): "시스템은 교통 API 타임아웃(5초 이상 무응답) 발생 시 '일시적 오류' 토스트를 표시하고 자동 재시도 1회를 수행해야 한다. 재시도 실패 시 '잠시 후 다시 시도해 주세요' 안내를 표시하고 실패 로그를 전송해야 한다. 재시도 포함 총 응답은 10초 이내이며, 무한 로딩 노출은 0건이어야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §6.3.1 진단 시퀀스 — 타임아웃 에러 핸들링 (SRS 원문)

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

### 검증 대상 ISSUE 표 (배치 1~13 산출물)

| Task ID | 산출물 | import 경로 | TEST-002 검증 항목 |
|---|---|---|---|
| CMD-DIAG-006 ✅ | `callWithTimeout`, `callWithRetry`, `TimeoutError` | `@/lib/external/kakao-transport` | 5초 타임아웃 + 1회 재시도 동작 검증 |
| CMD-DIAG-002 ✅ | `calculateIntersection` (Promise.allSettled) | `@/lib/diagnosis/intersection` | 부분 실패 허용 패턴 통합 |
| MON-001 ✅ | `reportErrorToSentry` | `@/lib/monitoring/sentry-reporter` | 재시도 실패 시 Sentry 이벤트 검증 |
| API-007 ✅ | `IKakaoTransportClient`, `DEFAULT_KAKAO_CONFIG` | `@/lib/external/kakao-transport` | 타임아웃 설정값 참조 |
| MOCK-004 ✅ | Mock 카카오 API 응답 | `@/lib/mocks/kakao-transport` | 타임아웃 시뮬레이션 Mock |
| UI-003 ✅ | MapCanvas + 에러 토스트 | — | E2E 토스트 검증 대상 |

### TEST-001 Playwright 패턴 인용 (배치 13)

> TEST-001에서 확립한 패턴: `playwright.config.ts` (testDir: './tests/e2e', retries: 1), GWT 패턴 코드 예시, Mock/실제 모드 분기 (`NEXT_PUBLIC_USE_MOCK`), `package.json` scripts (`test:e2e`).

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Playwright 설치 확인 (TEST-001에서 설치 완료 시 생략)
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```

- [ ] **3.2** MSW Mock 핸들러 작성 — `tests/mocks/kakao-transport.ts`
  ```typescript
  import { http, HttpResponse, delay } from 'msw';
  import { setupServer } from 'msw/node';

  const KAKAO_API_BASE = 'https://apis-navi.kakaomobility.com';

  // 시나리오 1: 1차 타임아웃 (6초) → 재시도 성공
  let callCount = 0;
  export const retrySuccessHandlers = [
    http.get(`${KAKAO_API_BASE}/*`, async () => {
      callCount++;
      if (callCount === 1) {
        await delay(6000); // 5초 초과 → timeout
        return HttpResponse.json({});
      }
      return HttpResponse.json({ routes: [{ summary: { duration: 1800 } }] });
    }),
  ];

  // 시나리오 2: 2회 모두 실패 (500)
  export const retryFailHandlers = [
    http.get(`${KAKAO_API_BASE}/*`, async () => {
      await delay(6000);
      return new HttpResponse(null, { status: 500 });
    }),
  ];

  // 시나리오 3: 정상 응답 (재시도 0회)
  export const normalHandlers = [
    http.get(`${KAKAO_API_BASE}/*`, () => {
      return HttpResponse.json({ routes: [{ summary: { duration: 1800 } }] });
    }),
  ];

  export const mockServer = setupServer();
  ```

- [ ] **3.3** `tests/e2e/transport-timeout.spec.ts` — AC-1: 5초 타임아웃 발동 검증
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('교통 API 타임아웃 핸들링 (TEST-002)', () => {
    test('AC-1: 5초 타임아웃 발동 후 재시도 성공', async ({ page }) => {
      // Given: Mock 모드 + 1차 타임아웃 시나리오
      await page.goto('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');

      // When: 진단 시작 (1차 API 호출 5초 초과 → 재시도)
      const startTime = Date.now();
      await page.getByRole('button', { name: '진단 시작' }).click();

      // Then: 재시도 성공 → 정상 결과 표시
      await page.waitForURL(/\/diagnosis\/[a-z0-9-]+/, { timeout: 15000 });
      const elapsed = Date.now() - startTime;

      // 5초 타임아웃 + 0.5초 대기 + 재시도 응답 → 최소 5.5초 이상
      expect(elapsed).toBeGreaterThanOrEqual(5000);
      // 총 응답 10초 이내 (REQ-FUNC-007)
      expect(elapsed).toBeLessThanOrEqual(15000);

      const markers = page.locator('[data-marker]');
      await expect(markers).toHaveCount({ min: 1 });
    });
  });
  ```

- [ ] **3.4** `tests/e2e/transport-timeout.spec.ts` — AC-2: 재시도 실패 시나리오
  ```typescript
    test('AC-2: 재시도 실패 → 에러 토스트 표시', async ({ page }) => {
      // Given: 2회 모두 타임아웃 시나리오
      await page.goto('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');

      // When: 진단 시작 (2회 모두 실패)
      await page.getByRole('button', { name: '진단 시작' }).click();

      // Then: 에러 안내 표시 (REQ-FUNC-007)
      await expect(
        page.getByText(/잠시 후 다시 시도해 주세요|일시적 오류/)
      ).toBeVisible({ timeout: 15000 });
    });
  ```

- [ ] **3.5** `tests/e2e/transport-timeout.spec.ts` — AC-3: 무한 로딩 0건 검증
  ```typescript
    test('AC-3: 무한 로딩 0건 — 최대 10.5초 이내 완료', async ({ page }) => {
      // Given: 최악 시나리오 (2회 타임아웃)
      await page.goto('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');

      // When: 진단 시작
      const startTime = Date.now();
      await page.getByRole('button', { name: '진단 시작' }).click();

      // Then: 에러 또는 결과 중 하나가 반드시 표시 (무한 로딩 0건)
      const resultOrError = page.getByText(/잠시 후 다시 시도|교집합/).or(
        page.locator('[data-marker]')
      );
      await expect(resultOrError.first()).toBeVisible({ timeout: 15000 });

      const elapsed = Date.now() - startTime;
      // 무한 로딩 방지: 최대 10.5초 (5s + 0.5s + 5s) 이내
      expect(elapsed).toBeLessThanOrEqual(15000);

      // 로딩 스피너가 남아있지 않아야 함
      const spinner = page.locator('[data-loading-spinner]');
      await expect(spinner).toHaveCount(0, { timeout: 2000 });
    });
  ```

- [ ] **3.6** `tests/e2e/transport-timeout.spec.ts` — AC-4: 정상 응답 시 재시도 0회
  ```typescript
    test('AC-4: 정상 응답 시 재시도 0회', async ({ page }) => {
      // Given: 정상 응답 시나리오
      await page.goto('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');

      // When: 진단 시작 (정상 응답)
      const startTime = Date.now();
      await page.getByRole('button', { name: '진단 시작' }).click();

      // Then: 정상 결과 ≤8초 (REQ-NF-001), 에러 토스트 0건
      await page.waitForURL(/\/diagnosis\/[a-z0-9-]+/, { timeout: 10000 });
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThanOrEqual(8000);

      // 에러 토스트 미표시
      await expect(page.getByText('일시적 오류')).toHaveCount(0);
      await expect(page.getByText('잠시 후 다시 시도해 주세요')).toHaveCount(0);
    });
  ```

- [ ] **3.7** `tests/unit/timeout-handler.spec.ts` — callWithTimeout 단위 테스트 (Vitest)
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { callWithTimeout, TimeoutError } from '@/lib/external/kakao-transport/with-timeout';

  describe('callWithTimeout (CMD-DIAG-006 → TEST-002)', () => {
    it('정상 응답 시 결과 반환', async () => {
      const result = await callWithTimeout(() => Promise.resolve('ok'), 5000);
      expect(result).toBe('ok');
    });

    it('5초 후 TimeoutError throw', async () => {
      const slowFn = () => new Promise(r => setTimeout(r, 6000));
      await expect(callWithTimeout(slowFn, 5000)).rejects.toThrow(TimeoutError);
    }, 10000);

    it('타임아웃 전 완료 시 정상 반환', async () => {
      const fastFn = () => new Promise<string>(r => setTimeout(() => r('fast'), 100));
      const result = await callWithTimeout(fastFn, 5000);
      expect(result).toBe('fast');
    });
  });
  ```

- [ ] **3.8** `tests/unit/retry-handler.spec.ts` — callWithRetry 단위 테스트 (Vitest)
  ```typescript
  import { describe, it, expect, vi } from 'vitest';
  import { callWithRetry } from '@/lib/external/kakao-transport/with-retry';
  import { reportErrorToSentry } from '@/lib/monitoring/sentry-reporter';

  vi.mock('@/lib/monitoring/sentry-reporter');

  describe('callWithRetry (CMD-DIAG-006 → TEST-002)', () => {
    it('정상 응답 시 재시도 0회 — 1회만 호출', async () => {
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

    it('2회 모두 실패 → Sentry 이벤트 + 에러 throw', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      await expect(callWithRetry(fn)).rejects.toThrow('fail');
      expect(reportErrorToSentry).toHaveBeenCalledWith(
        expect.any(String), expect.any(Error),
        expect.objectContaining({ domain: 'kakao-transport', retried: true })
      );
    });

    it('재시도 간 ≥500ms 대기', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('ok');
      const start = performance.now();
      await callWithRetry(fn, { retryDelayMs: 500 });
      expect(performance.now() - start).toBeGreaterThanOrEqual(450);
    });
  });
  ```

- [ ] **3.9** Mock 모드 / 실제 모드 분기 설정
  ```typescript
  // tests/e2e/transport-timeout.spec.ts 상단
  test.beforeEach(async ({ page }) => {
    // Mock 모드: NEXT_PUBLIC_USE_MOCK=true → MSW 핸들러 활용
    // 실제 모드: 환경변수 미설정 → 실제 카카오 API 호출
  });
  ```

- [ ] **3.10** `package.json`에 테스트 스크립트 추가 확인
  ```json
  {
    "scripts": {
      "test:e2e:timeout": "npx playwright test tests/e2e/transport-timeout.spec.ts",
      "test:unit:timeout": "npx vitest run tests/unit/timeout-handler.spec.ts tests/unit/retry-handler.spec.ts"
    }
  }
  ```

- [ ] **3.11** Sentry breadcrumb 검증 테스트
  ```typescript
  it('재시도 실패 시 Sentry breadcrumb에 domain, retried 포함', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(callWithRetry(fn)).rejects.toThrow();
    expect(reportErrorToSentry).toHaveBeenCalledWith(
      expect.any(String), expect.any(Error),
      expect.objectContaining({ domain: 'kakao-transport', retried: true, maxRetries: 1 })
    );
  });
  ```

- [ ] **3.12** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|replaySearch" tests/e2e/transport-timeout.spec.ts` → 0건

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (예외):** 5초 타임아웃 발동 후 재시도 성공
- **Given** 카카오 API 1차 호출이 5초 무응답 (Mock: 6초 delay)
- **When** 진단 시작 → `callWithTimeout` 5초 발동 → `callWithRetry` 재시도 1회
- **Then** 재시도에서 정상 응답 → 결과 표시. 총 소요 ≥5초, ≤15초

**AC-2 (예외):** 재시도 실패 → 에러 토스트 + Sentry 이벤트
- **Given** 1차 + 재시도 모두 5초 타임아웃
- **When** `callWithRetry` 2회 모두 실패
- **Then** "잠시 후 다시 시도해 주세요" 토스트 표시. `reportErrorToSentry` 호출 (tags: `{ domain: 'kakao-transport', retried: true }`)

**AC-3 (경계):** 무한 로딩 0건 검증
- **Given** 최악 시나리오 (2회 모두 타임아웃 + 0.5초 대기)
- **When** 진단 시작 → 전체 소요 시간 측정
- **Then** 최대 10.5초 이내 완료. 로딩 스피너 잔류 0건. 에러 또는 결과 중 하나 반드시 표시

**AC-4 (정상):** 정상 응답 시 재시도 0회
- **Given** 카카오 API가 3초 이내 정상 응답
- **When** `callWithRetry(() => client.getRoute(req))` 호출
- **Then** 결과 반환, 호출 횟수 1회. 에러 토스트 0건. 응답 ≤8초 (REQ-NF-001)

**AC-5 (도메인 핵심):** CMD-DIAG-006 통합 검증
- **Given** callWithTimeout + callWithRetry 모듈 존재
- **When** `npm run test:unit:timeout` 실행
- **Then** callWithTimeout 3개 + callWithRetry 4개 + Sentry breadcrumb 1개 = 총 8개 PASS

**AC-6 (보안):** Sentry 에러 로그에 사용자 개인정보 미포함
- **Given** 재시도 실패 시 Sentry 이벤트
- **When** `reportErrorToSentry` 호출 데이터 확인
- **Then** tags에 `domain`, `retried`, `maxRetries`, `timeoutMs`만 포함. 사용자 주소/이메일 0건

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | AC-4: 정상 응답 시 ≤8초. Playwright `waitForURL` timeout 검증 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | AC-2: 재시도 실패 시 `reportErrorToSentry` 호출. Vitest mock 검증 |
| REQ-FUNC-007 | "재시도 포함 총 응답 10초 이내, 무한 로딩 0건" (§4.1.1) | AC-3: 최대 10.5초 이내 완료, 로딩 스피너 잔류 0건 |

---

## 6. 📦 Deliverables (산출물 명시)

- `tests/e2e/transport-timeout.spec.ts` (4개 E2E 시나리오 — 타임아웃 발동/재시도 성공/재시도 실패/무한 로딩 0건)
- `tests/unit/timeout-handler.spec.ts` (3개 — callWithTimeout 단위)
- `tests/unit/retry-handler.spec.ts` (4개 — callWithRetry 단위 + Sentry 검증)
- `tests/mocks/kakao-transport.ts` (MSW Mock 핸들러 — 타임아웃 시뮬레이션)
- `package.json` scripts 추가 (test:e2e:timeout, test:unit:timeout)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (검증 대상):
- **CMD-DIAG-006 ✅:** `callWithTimeout`, `callWithRetry` — 타임아웃 + 재시도 로직
- **CMD-DIAG-002 ✅:** `calculateIntersection` (Promise.allSettled) — 부분 실패 허용
- **MON-001 ✅:** `reportErrorToSentry` — Sentry 이벤트 검증
- **MOCK-004 ✅:** Mock 카카오 API 응답 — 타임아웃 시뮬레이션
- **UI-003 ✅:** MapCanvas + 에러 토스트 — E2E 토스트 검증
- **TEST-001 ✅:** Playwright 패턴 — playwright.config.ts 재사용

### 후행:
- **TEST-010:** E2E 통합 시나리오 — TEST-002 포함 전체 플로우

---

## 8. 🧪 Test Plan (검증 절차 — "테스트의 테스트")

- **E2E (Playwright):** `tests/e2e/transport-timeout.spec.ts` — 4개 시나리오
  - AC-1: 타임아웃 발동 + 재시도 성공
  - AC-2: 재시도 실패 + 에러 토스트
  - AC-3: 무한 로딩 0건
  - AC-4: 정상 응답 재시도 0회
- **단위 (Vitest):**
  - `tests/unit/timeout-handler.spec.ts` — 3개 (callWithTimeout)
  - `tests/unit/retry-handler.spec.ts` — 4개 (callWithRetry + Sentry)
  - 총 단위 7개
- **테스트 자체 검증:**
  - MSW Mock 핸들러가 올바른 delay 생성 확인 (6초 delay → TimeoutError)
  - Playwright timeout 값이 시나리오별 적절한지 확인 (15초 max)
  - `grep -ri "NextAuth\|payment\|AES" tests/` → 0건
- **Mock / 실제 분기:** `NEXT_PUBLIC_USE_MOCK=true` 시 MSW Mock, 미설정 시 실제 백엔드
- **성능 검증:** AC-4 정상 응답 ≤8초 (REQ-NF-001)

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **MSW와 Playwright 통합:** MSW는 Node.js 환경에서 동작. Playwright E2E에서는 Next.js 서버의 API 라우트를 MSW로 가로채야 하는데, 브라우저 ↔ 서버 경계에서 MSW 설정이 복잡할 수 있음. 대안: `NEXT_PUBLIC_USE_MOCK=true` 환경변수 기반 Mock 모드로 우회.
2. **타임아웃 시뮬레이션 정확도:** 실제 네트워크 지연 vs setTimeout 기반 시뮬레이션의 차이. CI 환경에서는 시스템 부하로 인해 타이밍 테스트가 flaky할 수 있음. ±1초 허용 범위 설정 권장.
3. **Sentry E2E 검증 한계:** Playwright에서 Sentry 이벤트 전송을 직접 검증하기 어려움. Vitest 단위 테스트에서 `reportErrorToSentry` mock 검증으로 대체. E2E에서는 에러 토스트 표시 여부로 간접 검증.
4. **AbortController 통합:** CMD-DIAG-006이 Promise.race 기반인지 AbortController 기반인지에 따라 테스트 구조가 달라질 수 있음. 현재 구현은 Promise.race 기반.
5. **CI 통합 follow-up:** GitHub Actions에서 MSW + Playwright 실행 파이프라인은 별도 INFRA 태스크로 분리.
