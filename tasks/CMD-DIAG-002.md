---
name: Feature Task
title: "[Feature] CMD-DIAG-002: 클라이언트 교집합 후보 동네 산출 — Promise.allSettled 병렬 카카오 API + 교차 연산"
labels: ['feature', 'priority:H', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DIAG-002] 클라이언트 교집합 후보 동네 산출 — Promise.allSettled 병렬 카카오 모빌리티 API 호출 + 교차 연산
- **목적 (Why):**
  - **비즈니스:** 두 직장 주소에서 동시 통근 가능한 후보 동네를 자동으로 산출하여 "수작업 탐색 2~3시간→10분" 목표를 실현한다.
  - **사용자 가치:** 두 직장 주소 입력 후 "진단 시작"만 클릭하면 교집합 후보 동네 ≥3곳이 지도에 표시된다.
- **범위 (What):**
  - ✅ 만드는 것: 후보 동네 풀 생성, Promise.allSettled 병렬 카카오 API 호출, 통근 시간 필터링, CandidateAreaDTO 배열 생성, 부분 실패 처리, 0곳 시나리오 처리
  - ❌ 만들지 않는 것: Geocoding(CMD-DIAG-001), 스코어링 엔진(CMD-DIAG-003), 서버 저장(CMD-DIAG-004), UI 컴포넌트, Server Action/Route Handler
- **복잡도:** H
- **Wave:** 3 (Diagnosis 트랙)
- **⚠️ 클라이언트 측 처리 (절대 준수):** REQ-FUNC-003 "Vercel 무료 티어의 10초 Timeout을 방지하기 위해, 외부 교통 API 반복 호출 연산과 교차 연산 로직은 사용자 브라우저(Client Component) 내부에서 비동기 병렬 구조(Promise.all)로 처리해야 한다." → Server Action 사용 금지.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-003** (§4.1.1): "시스템은 두 직장 주소를 기반으로 교집합 후보 동네를 3곳 이상 산출하고, 지도 위에 시각화해야 한다. Vercel 무료 티어의 10초 Timeout을 방지하기 위해, 외부 교통 API 반복 호출 연산과 교차 연산 로직은 Next.js 서버(Server Action)가 아닌, 사용자 브라우저(Client Component) 내부에서 비동기 병렬 구조(Promise.all)로 처리해야 한다."
- **REQ-FUNC-004** (§4.1.1): "시스템은 각 후보 동네를 탭했을 때 양쪽 직장까지의 예상 출퇴근 시간(대중교통·자차)을 표시해야 한다."
- **REQ-FUNC-007** (§4.1.1): "시스템은 교통 API 타임아웃(5초 이상 무응답) 발생 시 \"일시적 오류\" 토스트를 표시하고 자동 재시도 1회를 수행해야 한다."
- **REQ-FUNC-008** (§4.1.1): "시스템은 두 직장 간 거리로 인해 교집합 후보가 0곳인 경우 \"조건을 만족하는 동네가 없습니다. 최대 통근 시간을 늘려보세요\" 안내를 1초 이내에 표시하고, 조건 완화 제안을 2개 이상 제공해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.1 — 교차 연산 부분)

```
Web→Web: 수도권 커버리지 클라이언트 검증
Web→Web: 후보 동네 풀 생성 (두 좌표 중간 영역)
Web→Kakao: Promise.allSettled([좌표A→후보동네들, 좌표B→후보동네들]) — 병렬
Kakao→Web: 경로·소요시간·환승 횟수 응답
Web→Web: 교집합 후보 동네 산출 + 통근 시간 필터 적용
alt 후보 0곳: Web→User: "조건 완화 제안" 안내 (≤ 1초)
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| CMD-DIAG-001 | geocodeAddress, GeocodedAddress | `@/lib/diagnosis` | 좌표 변환 (이미 완료된 좌표를 입력으로 받음) |
| API-007 | IKakaoTransportClient, KakaoRouteRequest, KakaoTransportResponse, KakaoCoord, mapKakaoResponseToCommuteInfo | `@/lib/external/kakao-transport` | 카카오 모빌리티 API 호출 인터페이스 |
| API-002 | CandidateAreaDTO, CommuteInfoDTO, DiagnosisFilters | `@/lib/types/diagnosis` | 출력 타입 + 필터 타입 |
| MOCK-004 | MOCK_ROUTE_RESPONSES | `@/lib/mocks/kakao-transport` | 테스트 시 Mock 데이터 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/diagnosis/candidate-pool.ts`에 후보 동네 풀 생성 로직 작성 (환경 중립)
  ```typescript
  import type { KakaoCoord } from '@/lib/external/kakao-transport';

  export interface CandidatePoolEntry {
    name: string;
    coord: KakaoCoord;
    dongCode?: string;
  }

  /** 두 좌표의 중간 영역에서 통근 가능 반경 내 행정동 ≥10곳 추출 */
  export function generateCandidatePool(
    coordA: KakaoCoord,
    coordB: KakaoCoord,
    radiusKm: number = 15
  ): CandidatePoolEntry[] {
    const midLat = (coordA.lat + coordB.lat) / 2;
    const midLng = (coordA.lng + coordB.lng) / 2;
    // 중심점 기준 격자 포인트 생성 → 수도권 행정동 DB 매칭
    // MVP: 정적 수도권 행정동 JSON에서 반경 내 필터링
    // ...
    return candidates; // ≥10곳
  }
  ```

- [ ] **3.2** `lib/data/metro-dong.json`에 수도권 행정동 좌표 정적 데이터 작성
  - 서울·경기·인천 주요 행정동 ≥200곳의 `{ name, lat, lng }` 데이터
  - 출처: 행정안전부 행정동 좌표 공공데이터

- [ ] **3.3** `lib/diagnosis/intersection.ts`에 교집합 산출 핵심 함수 작성 (환경 중립)
  ```typescript
  import type { IKakaoTransportClient, KakaoCoord } from '@/lib/external/kakao-transport';
  import { mapKakaoResponseToCommuteInfo } from '@/lib/external/kakao-transport';
  import type { CandidateAreaDTO, CommuteInfoDTO, DiagnosisFilters } from '@/lib/types/diagnosis';
  import { generateCandidatePool, type CandidatePoolEntry } from './candidate-pool';
  import * as Sentry from '@sentry/nextjs';

  export interface IntersectionResult {
    candidates: CandidateAreaDTO[];
    failureRate: number;
    suggestions: string[];
  }

  export async function calculateIntersection(
    coordA: KakaoCoord,
    coordB: KakaoCoord,
    filters: DiagnosisFilters,
    transportClient: IKakaoTransportClient
  ): Promise<IntersectionResult> {
    // Step 1: 후보 동네 풀 생성
    const pool = generateCandidatePool(coordA, coordB);

    // Step 2: Promise.allSettled 병렬 호출
    const promises = pool.map(async (entry) => {
      const [routeA, routeB] = await Promise.all([
        transportClient.getRoute({ origin: coordA, destination: entry.coord }),
        transportClient.getRoute({ origin: coordB, destination: entry.coord }),
      ]);
      const commuteA = mapKakaoResponseToCommuteInfo(routeA);
      const commuteB = mapKakaoResponseToCommuteInfo(routeB);
      return { entry, commuteA, commuteB };
    });

    const results = await Promise.allSettled(promises);
    const succeeded = results.filter((r): r is PromiseFulfilledResult<{ entry: CandidatePoolEntry; commuteA: CommuteInfoDTO; commuteB: CommuteInfoDTO }> => r.status === 'fulfilled');
    const failureRate = (results.length - succeeded.length) / results.length;

    if (failureRate > 0.05) {
      Sentry.captureMessage(`Kakao API failure rate ${(failureRate * 100).toFixed(1)}%`, {
        level: 'warning',
        tags: { domain: 'diagnosis', task: 'CMD-DIAG-002' },
      });
    }

    // Step 3: 통근 시간 필터 적용
    let candidates = succeeded
      .map(r => r.value)
      .filter(({ commuteA, commuteB }) => {
        if (filters.maxCommuteTime) {
          return commuteA.durationMinutes <= filters.maxCommuteTime
              && commuteB.durationMinutes <= filters.maxCommuteTime;
        }
        return true;
      });

    // Step 4: 통근시간 기반 정렬 (CMD-DIAG-003 스코어링 전까지 임시)
    candidates.sort((a, b) => {
      const totalA = a.commuteA.durationMinutes + a.commuteB.durationMinutes;
      const totalB = b.commuteA.durationMinutes + b.commuteB.durationMinutes;
      return totalA - totalB;
    });

    // Step 5: CandidateAreaDTO 변환
    const candidateDTOs: CandidateAreaDTO[] = candidates.map(({ entry, commuteA, commuteB }, idx) => ({
      id: crypto.randomUUID(),
      name: entry.name,
      coord: { lat: entry.coord.lat, lng: entry.coord.lng },
      commuteA,
      commuteB,
      score: 0, // CMD-DIAG-003에서 산정
      rank: idx + 1,
    }));

    // Step 6: 0곳 시나리오 (REQ-FUNC-008)
    const suggestions: string[] = [];
    if (candidateDTOs.length === 0) {
      if (filters.maxCommuteTime && filters.maxCommuteTime < 60) {
        suggestions.push(`최대 통근 시간을 ${filters.maxCommuteTime + 15}분으로 늘려보세요`);
      }
      if (filters.maxCommuteTime && filters.maxCommuteTime < 90) {
        suggestions.push(`최대 통근 시간을 ${filters.maxCommuteTime + 30}분으로 늘려보세요`);
      }
      suggestions.push('자차 모드를 포함해 검색해 보세요');
    }

    return { candidates: candidateDTOs, failureRate, suggestions };
  }
  ```

- [ ] **3.4** `lib/diagnosis/use-intersection.ts`에 교집합 산출 React Hook 작성
  ```typescript
  'use client';
  import { useState, useCallback } from 'react';
  import { calculateIntersection, type IntersectionResult } from './intersection';
  import type { IKakaoTransportClient, KakaoCoord } from '@/lib/external/kakao-transport';
  import type { DiagnosisFilters } from '@/lib/types/diagnosis';
  import * as Sentry from '@sentry/nextjs';

  export function useIntersection(transportClient: IKakaoTransportClient) {
    const [result, setResult] = useState<IntersectionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calculate = useCallback(async (
      coordA: KakaoCoord,
      coordB: KakaoCoord,
      filters: DiagnosisFilters
    ) => {
      setIsLoading(true);
      setError(null);
      const startTime = performance.now();
      try {
        const res = await calculateIntersection(coordA, coordB, filters, transportClient);
        setResult(res);
      } catch (e) {
        Sentry.captureException(e, { tags: { domain: 'diagnosis', task: 'CMD-DIAG-002' } });
        setError('진단 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        const elapsed = performance.now() - startTime;
        if (elapsed > 8000) {
          Sentry.captureMessage(`Intersection calculation exceeded 8s: ${elapsed}ms`, 'warning');
        }
        setIsLoading(false);
      }
    }, [transportClient]);

    return { result, isLoading, error, calculate };
  }
  ```

- [ ] **3.5** `lib/diagnosis/index.ts` 배럴 export 업데이트
  ```typescript
  export * from './intersection';
  export * from './candidate-pool';
  export * from './use-intersection';
  ```

- [ ] **3.6** `__tests__/diagnosis/intersection.spec.ts`에 교집합 산출 핵심 테스트
  ```typescript
  import { calculateIntersection } from '@/lib/diagnosis/intersection';
  describe('calculateIntersection', () => {
    it('후보 동네 ≥3곳 산출 — 정상 시나리오', async () => { /* ... */ });
    it('Promise.allSettled 부분 실패 시 성공 항목만 결과에 포함', async () => { /* ... */ });
    it('failureRate > 5% 시 Sentry.captureMessage 호출', async () => { /* ... */ });
    it('maxCommuteTime 필터 적용 — 초과 후보 제외', async () => { /* ... */ });
    it('통근시간 기반 정렬 — 총 통근시간 짧은 순', async () => { /* ... */ });
    it('0곳 시나리오 — suggestions ≥2개 반환', async () => { /* ... */ });
    it('CandidateAreaDTO 변환 — id, name, coord, commuteA, commuteB, rank 포함', async () => { /* ... */ });
  });
  ```

- [ ] **3.7** `__tests__/diagnosis/intersection-e2e.spec.ts`에 Playwright E2E 테스트 스켈레톤
  ```typescript
  import { test, expect } from '@playwright/test';
  test.describe('교집합 산출 E2E', () => {
    test('두 주소 입력 → 진단 시작 → 후보 ≥3곳 표시', async ({ page }) => { /* ... */ });
    test('Server Action 호출 0건 (Network 탭 검증)', async ({ page }) => { /* ... */ });
    test('전체 소요시간 p95 ≤ 8,000ms', async ({ page }) => { /* ... */ });
  });
  ```

- [ ] **3.8** `__tests__/diagnosis/candidate-pool.spec.ts`에 후보 풀 생성 테스트
  ```typescript
  describe('generateCandidatePool', () => {
    it('두 좌표의 중간 영역에서 ≥10곳 추출', () => { /* ... */ });
    it('모든 후보가 수도권 범위 내 좌표', () => { /* ... */ });
    it('radiusKm 파라미터로 검색 반경 조절', () => { /* ... */ });
  });
  ```

- [ ] **3.9** 정적 분석: Server Action/Route Handler 미사용 검증
  ```bash
  grep -r "'use server'" lib/diagnosis/ | wc -l  # → 0
  grep -r "createSupabaseServerClient" lib/diagnosis/ | wc -l  # → 0
  grep -r "NextRequest\|NextResponse" lib/diagnosis/ | wc -l  # → 0
  ```

- [ ] **3.10** `__tests__/diagnosis/use-intersection.spec.tsx`에 Hook 테스트
  ```typescript
  describe('useIntersection Hook', () => {
    it('calculate 호출 시 isLoading → true → result 설정 → isLoading → false', async () => { /* ... */ });
    it('에러 발생 시 Sentry.captureException + error 상태 설정', async () => { /* ... */ });
    it('8초 초과 시 Sentry 경고 메시지 전송', async () => { /* ... */ });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 교집합 후보 동네 ≥3곳 산출
- **Given** 두 직장 좌표(수도권 내)와 유효한 DiagnosisFilters
- **When** `calculateIntersection(coordA, coordB, filters, mockClient)` 호출
- **Then** `result.candidates.length ≥ 3`, 각 항목에 `name`, `coord`, `commuteA`, `commuteB`, `rank` 포함

**AC-2 (예외):** Promise.allSettled 부분 실패 처리
- **Given** 10개 후보 중 3개 API 호출 실패 (failureRate = 30%)
- **When** `calculateIntersection()` 완료
- **Then** 성공한 7개만 결과에 포함, `Sentry.captureMessage` 호출 (failureRate > 5%)

**AC-3 (예외):** 0곳 시나리오 — 조건 완화 제안
- **Given** maxCommuteTime: 20분 (매우 짧은 조건)으로 모든 후보 필터링 아웃
- **When** `calculateIntersection()` 완료
- **Then** `candidates.length === 0`, `suggestions.length ≥ 2`, suggestions에 "통근 시간을 늘려보세요" 류 안내 포함

**AC-4 (경계):** maxCommuteTime 필터 정확 적용
- **Given** maxCommuteTime: 40분, 후보 중 commuteA=35분 commuteB=45분인 동네 존재
- **When** 필터 적용
- **Then** 해당 동네는 commuteB가 40분 초과이므로 결과에서 제외

**AC-5 (보안/성능):** Server Action 사용 0건 정적 검증
- **Given** `lib/diagnosis/` 디렉토리 전체
- **When** `grep -r "'use server'" lib/diagnosis/` 실행
- **Then** 매칭 0건 — Vercel 10초 timeout 우회 전략 준수 확인

**AC-6 (성능):** 교차 계산 p95 ≤ 8,000ms
- **Given** 수도권 내 두 직장 좌표, Mock 카카오 API 클라이언트
- **When** `calculateIntersection()` 100회 반복 측정
- **Then** p95 소요시간 ≤ 8,000ms

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)" (§4.2.1) | Playwright E2E로 실제 브라우저에서 측정. useIntersection Hook에서 performance.now() 계측 + 8초 초과 시 Sentry 경고 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | failureRate > 5% 시 `Sentry.captureMessage`, 전체 에러 시 `Sentry.captureException` 호출 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/diagnosis/candidate-pool.ts` (generateCandidatePool)
- `lib/data/metro-dong.json` (수도권 행정동 좌표 정적 데이터)
- `lib/diagnosis/intersection.ts` (calculateIntersection — 핵심 교차 연산)
- `lib/diagnosis/use-intersection.ts` (useIntersection React Hook — 'use client')
- `__tests__/diagnosis/intersection.spec.ts` (7개 케이스)
- `__tests__/diagnosis/intersection-e2e.spec.ts` (Playwright E2E 3개 케이스)
- `__tests__/diagnosis/candidate-pool.spec.ts` (3개 케이스)
- `__tests__/diagnosis/use-intersection.spec.tsx` (3개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **CMD-DIAG-001:** geocodeAddress, GeocodedAddress — 좌표 변환 결과
- **API-007:** IKakaoTransportClient, KakaoRouteRequest, mapKakaoResponseToCommuteInfo — 카카오 API 호출 인터페이스
- **API-002:** CandidateAreaDTO, CommuteInfoDTO, DiagnosisFilters — 출력·필터 타입

### 후행:
- **CMD-DIAG-003:** 스코어링 엔진 — 현재 score=0으로 반환, CMD-DIAG-003에서 실제 스코어 산정
- **CMD-DIAG-004:** 진단 결과 서버 저장 — calculateIntersection 결과를 Server Action으로 저장
- **CMD-DIAG-005:** 조건 필터 실시간 적용 — 클라이언트 캐싱 기반
- **CMD-DIAG-006:** 타임아웃 핸들링 — 5초 타임아웃 + 재시도 1회
- **UI-003:** 진단 결과 지도 시각화 — CandidateAreaDTO 기반

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/diagnosis/intersection.spec.ts` — 7개 케이스 (정상, 부분 실패, 0곳, 필터, 정렬, DTO 변환, Sentry)
- **E2E 테스트:** `__tests__/diagnosis/intersection-e2e.spec.ts` — Playwright 3개 케이스 (전체 흐름, Server Action 0건, p95 ≤8s)
- **단위 테스트:** `__tests__/diagnosis/candidate-pool.spec.ts` — 3개 케이스
- **컴포넌트 테스트:** `__tests__/diagnosis/use-intersection.spec.tsx` — 3개 케이스
- **정적 분석:** `grep -r "'use server'" lib/diagnosis/` 매칭 0건
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **CMD-DIAG-003 (스코어링 엔진):** SRS §6.7 CLD에 ScoringEngine.score/rank 기준이 상세 미정. 본 태스크는 스코어링 없이 통근시간 기반 정렬만 수행. CMD-DIAG-003은 SRS §6.7 보완 후 별도 배치로 작성 예정.
2. **수도권 행정동 정적 데이터 정확도:** `lib/data/metro-dong.json`의 행정동 좌표는 공공데이터 기반이지만, 행정동 경계 변경 시 업데이트 필요. MVP에서는 연 1회 수동 갱신.
3. **카카오 API 호출량 최적화:** 후보 10곳 × 2방향 = 20회 API 호출. 무료 tier 일 50만 건 제한 내에서 사용자 수 증가 시 초과 가능. API 키별 일일 호출량 모니터링 필요.
4. **API 키 브라우저 노출:** 클라이언트에서 직접 카카오 API 호출 시 API 키가 노출됨. 카카오 Developers Console 도메인 제한으로 악용 방지. 프록시는 Vercel timeout 제약으로 MVP 제외.
5. **부분 실패 임계값 5%:** 현재 failureRate > 5%에서 Sentry 경고. SRS에는 "실패율 < 1%" 목표(AC-1)이지만, 부분 실패는 허용하되 모니터링. 임계값은 운영 데이터 기반 조정.
