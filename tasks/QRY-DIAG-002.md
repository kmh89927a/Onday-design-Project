---
name: Feature Task
title: "[Feature] QRY-DIAG-002: 출퇴근 시간 조회 (후보 동네 탭 시 ±10% 오차 보장)"
labels: ['feature', 'priority:M', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [QRY-DIAG-002] 출퇴근 시간 조회 — 후보 동네 탭 시 양쪽 직장까지 예상 소요시간 반환 (±10% 오차)
- **목적 (Why):**
  - **비즈니스:** 후보 동네를 탭할 때 양쪽 출퇴근 시간을 즉시 표시하여 의사결정 근거를 제공한다.
  - **사용자 가치:** "이 동네에서 출퇴근하면 얼마나 걸리지?"에 대한 답을 카카오맵 대비 ±10% 오차 이내로 정확하게 제공한다.
- **범위 (What):**
  - ✅ 만드는 것: `lib/diagnosis/commute-query.ts` (getCommuteTime 함수), `GetCommuteTimeResponse` 타입, 캐시 조회 로직, ±10% 오차 검증 테스트
  - ❌ 만들지 않는 것: 교집합 산출(CMD-DIAG-002), 교통 API 호출(CMD-DIAG-002에서 이미 완료), UI 컴포넌트(UI-004)
- **복잡도:** M
- **Wave:** 3 (Diagnosis 트랙)
- **데이터 소스 전략 (MVP):** CMD-DIAG-002 결과 캐싱 → 재사용 (Option A). 카카오 모빌리티 재호출 없음 (비용↓, 정확도 일치).

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-004** (§4.1.1): "시스템은 각 후보 동네를 탭했을 때 양쪽 직장까지의 예상 출퇴근 시간(대중교통·자차)을 표시해야 한다. 카카오맵 API 대비 시간 오차는 ±10% 이내여야 한다."
- **REQ-FUNC-005** (§4.1.1): "시스템은 출근 시간대(오전 7~9시 범위)를 변경했을 때 해당 시간대 평균 소요시간으로 출퇴근 시뮬레이션을 재계산해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms"
- **REQ-NF-013** (§4.2.2): "데이터 정합성 (교통 시간 오차) — ≤ ±10% (카카오맵 기준 교차 검증)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §6.3.1 진단 시퀀스 (출퇴근 시간 조회)

```
User→Web: 후보 동네 탭
Web→Web: 캐싱된 통근 데이터 조회 (CMD-DIAG-002 결과 재사용)
Web→User: 양쪽 출퇴근 시간 표시
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| CMD-DIAG-002 ✅ | `CandidateAreaDTO[]` (commuteA, commuteB 포함) | `@/lib/diagnosis/intersection` | 통근 시간 데이터 원본 |
| API-002 ✅ | `CommuteInfoDTO`, `CandidateAreaDTO` | `@/lib/types/diagnosis` | 응답 타입 |
| API-007 ✅ | `IKakaoTransportClient`, `mapKakaoResponseToCommuteInfo` | `@/lib/external/kakao-transport` | 캐시 미스 시 폴백 호출 (Option B) |
| MOCK-004 ✅ | 카카오 Mock 응답 | `@/lib/mocks/kakao-transport` | ±10% 오차 검증 테스트 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/types/diagnosis.ts`에 GetCommuteTimeResponse 타입 추가 (API-002 확장)
  ```typescript
  export interface GetCommuteTimeResponse {
    candidateId: string;
    candidateName: string;
    commuteA: CommuteInfoDTO;
    commuteB: CommuteInfoDTO;
    retrievedAt: string;  // ISO 8601
    source: 'cache' | 'kakao-mobility';
  }
  ```

- [ ] **3.2** `lib/diagnosis/commute-query.ts`에 통근 시간 조회 함수 구현
  ```typescript
  import type { CandidateAreaDTO, CommuteInfoDTO, GetCommuteTimeResponse } from '@/lib/types/diagnosis';

  /**
   * 후보 동네 탭 시 출퇴근 시간 조회
   * MVP: CMD-DIAG-002 결과 캐싱 → 재사용 (Option A)
   */
  export function getCommuteTime(
    candidate: CandidateAreaDTO
  ): GetCommuteTimeResponse {
    return {
      candidateId: candidate.id,
      candidateName: candidate.name,
      commuteA: candidate.commuteA,
      commuteB: candidate.commuteB,
      retrievedAt: new Date().toISOString(),
      source: 'cache',
    };
  }

  /**
   * 여러 후보의 통근 시간 일괄 조회
   */
  export function getCommuteTimeBatch(
    candidates: CandidateAreaDTO[]
  ): GetCommuteTimeResponse[] {
    return candidates.map(getCommuteTime);
  }
  ```

- [ ] **3.3** `lib/diagnosis/commute-query.ts`에 시간대 변경 시 재계산 지원 (REQ-FUNC-005)
  ```typescript
  import type { IKakaoTransportClient, KakaoCoord } from '@/lib/external/kakao-transport';
  import { mapKakaoResponseToCommuteInfo } from '@/lib/external/kakao-transport';

  export async function getCommuteTimeForTimeSlot(
    candidate: CandidateAreaDTO,
    coordA: KakaoCoord,
    coordB: KakaoCoord,
    departureTime: string,  // ISO 8601 (예: "2026-04-25T08:00:00+09:00")
    transportClient: IKakaoTransportClient
  ): Promise<GetCommuteTimeResponse> {
    const [routeA, routeB] = await Promise.all([
      transportClient.getRoute({ origin: coordA, destination: candidate.coord, departureTime }),
      transportClient.getRoute({ origin: coordB, destination: candidate.coord, departureTime }),
    ]);
    return {
      candidateId: candidate.id,
      candidateName: candidate.name,
      commuteA: mapKakaoResponseToCommuteInfo(routeA),
      commuteB: mapKakaoResponseToCommuteInfo(routeB),
      retrievedAt: new Date().toISOString(),
      source: 'kakao-mobility',
    };
  }
  ```

- [ ] **3.4** `lib/diagnosis/use-commute-detail.ts`에 React Hook 구현 (`'use client'`)
  ```typescript
  'use client';
  import { useState, useCallback } from 'react';
  import { getCommuteTime, type GetCommuteTimeResponse } from './commute-query';
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';

  export function useCommuteDetail() {
    const [detail, setDetail] = useState<GetCommuteTimeResponse | null>(null);

    const selectCandidate = useCallback((candidate: CandidateAreaDTO) => {
      const result = getCommuteTime(candidate);
      setDetail(result);
    }, []);

    return { detail, selectCandidate };
  }
  ```

- [ ] **3.5** `lib/diagnosis/index.ts` 배럴 export 업데이트
  ```typescript
  export * from './commute-query';
  export * from './use-commute-detail';
  ```

- [ ] **3.6** `__tests__/diagnosis/commute-query.spec.ts`에 핵심 테스트 (5개 케이스)
  ```typescript
  describe('getCommuteTime', () => {
    it('캐시 히트 — CandidateAreaDTO에서 즉시 반환, source="cache"', () => { /* ... */ });
    it('commuteA, commuteB가 원본과 일치', () => { /* ... */ });
    it('retrievedAt이 유효한 ISO 8601', () => { /* ... */ });
  });
  describe('getCommuteTimeBatch', () => {
    it('5개 후보 일괄 조회 — 5개 결과 반환', () => { /* ... */ });
    it('빈 배열 → 빈 배열 반환', () => { /* ... */ });
  });
  ```

- [ ] **3.7** `__tests__/diagnosis/commute-accuracy.spec.ts`에 ±10% 오차 검증 테스트
  ```typescript
  describe('±10% 오차 검증 (REQ-FUNC-004)', () => {
    it('강남역→역삼역 카카오맵 5분 대비 ±10% 이내', () => {
      // Given 강남역(37.4979, 127.0276) → 역삼역(37.5006, 127.0364)
      // And 카카오맵 API 응답: durationMinutes = 5
      // When QRY-DIAG-002 호출
      // Then 응답의 durationMinutes ∈ [4.5, 5.5] (±10%)
      const kakaoMapDuration = 5;
      const result = getCommuteTime(mockCandidateWithDuration(5));
      expect(result.commuteA.durationMinutes).toBeGreaterThanOrEqual(kakaoMapDuration * 0.9);
      expect(result.commuteA.durationMinutes).toBeLessThanOrEqual(kakaoMapDuration * 1.1);
    });

    it('장거리 (60분) 대비 ±10% 이내', () => {
      const kakaoMapDuration = 60;
      const result = getCommuteTime(mockCandidateWithDuration(58));
      expect(result.commuteA.durationMinutes).toBeGreaterThanOrEqual(kakaoMapDuration * 0.9);
      expect(result.commuteA.durationMinutes).toBeLessThanOrEqual(kakaoMapDuration * 1.1);
    });
  });
  ```

- [ ] **3.8** `__tests__/diagnosis/commute-timeslot.spec.ts`에 시간대 변경 테스트 (2개 케이스)
  ```typescript
  describe('getCommuteTimeForTimeSlot', () => {
    it('오전 8시 시간대로 재계산 — source="kakao-mobility"', async () => { /* ... */ });
    it('API 실패 시 에러 throw', async () => { /* ... */ });
  });
  ```

- [ ] **3.9** `__tests__/diagnosis/use-commute-detail.spec.tsx`에 Hook 테스트 (2개 케이스)
  ```typescript
  describe('useCommuteDetail', () => {
    it('selectCandidate 호출 시 detail 상태 설정', () => { /* ... */ });
    it('초기 상태: detail === null', () => { /* ... */ });
  });
  ```

- [ ] **3.10** v1.3 정합성 검증
  ```bash
  grep -ri "NextAuth\|payment\|AES\|bcrypt" lib/diagnosis/commute-query.ts  # → 0건
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 캐시 히트 시 즉시 반환
- **Given** CMD-DIAG-002에서 산출한 `CandidateAreaDTO` (commuteA: 35분, commuteB: 42분)
- **When** `getCommuteTime(candidate)` 호출
- **Then** `commuteA.durationMinutes === 35`, `commuteB.durationMinutes === 42`, `source === 'cache'`

**AC-2 (도메인 핵심):** 카카오맵 대비 ±10% 오차 검증
- **Given** 강남역(37.4979, 127.0276) → 역삼역(37.5006, 127.0364)
- **And** 카카오맵 API 응답: durationMinutes = 5
- **When** QRY-DIAG-002 호출
- **Then** 응답의 durationMinutes ∈ [4.5, 5.5] (±10%)

**AC-3 (예외):** 캐시 미스 시 폴백
- **Given** 시간대 변경으로 캐시 데이터 미일치
- **When** `getCommuteTimeForTimeSlot` 호출 (카카오 API 재호출)
- **Then** 새로운 통근 시간 반환, `source === 'kakao-mobility'`

**AC-4 (경계):** 빈 후보 목록 처리
- **Given** 빈 `CandidateAreaDTO[]`
- **When** `getCommuteTimeBatch([])` 호출
- **Then** 빈 배열 `[]` 반환

**AC-5 (성능):** 캐시 히트 시 즉시 응답 (< 50ms)
- **Given** CMD-DIAG-002 결과 캐싱 완료
- **When** `getCommuteTime(candidate)` 호출
- **Then** 응답 시간 < 50ms (서버 호출 없음)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | 캐시 히트 시 < 50ms. 시간대 변경 시 카카오 API 호출 포함해도 8초 이내 |
| REQ-NF-013 | "데이터 정합성 (교통 시간 오차) — ≤ ±10% (카카오맵 기준)" (§4.2.2) | ±10% 오차 검증 테스트 강제 (commute-accuracy.spec.ts) |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 시간대 변경 API 실패 시 Sentry 에러 전송 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/diagnosis/commute-query.ts` (getCommuteTime, getCommuteTimeBatch, getCommuteTimeForTimeSlot)
- `lib/diagnosis/use-commute-detail.ts` (useCommuteDetail Hook — `'use client'`)
- `lib/types/diagnosis.ts` 확장 (GetCommuteTimeResponse 타입)
- `__tests__/diagnosis/commute-query.spec.ts` (5개 케이스)
- `__tests__/diagnosis/commute-accuracy.spec.ts` (2개 케이스 — ±10% 오차)
- `__tests__/diagnosis/commute-timeslot.spec.ts` (2개 케이스)
- `__tests__/diagnosis/use-commute-detail.spec.tsx` (2개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **CMD-DIAG-002 ✅:** `CandidateAreaDTO[]` (commuteA, commuteB 포함) — 캐시 데이터 원본
- **API-002 ✅:** `CommuteInfoDTO` 타입
- **API-007 ✅:** `IKakaoTransportClient`, `mapKakaoResponseToCommuteInfo` — 시간대 변경 시 재호출

### 후행:
- **UI-004:** 후보 동네 상세 정보 패널 — `useCommuteDetail` Hook 활용

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/diagnosis/commute-query.spec.ts` — 5개 케이스 (캐시 히트, 원본 일치, ISO 8601, 일괄 조회, 빈 배열)
- **정확도 테스트:** `__tests__/diagnosis/commute-accuracy.spec.ts` — 2개 케이스 (±10% 오차 단거리/장거리)
- **단위 테스트:** `__tests__/diagnosis/commute-timeslot.spec.ts` — 2개 케이스 (시간대 재계산, API 실패)
- **컴포넌트 테스트:** `__tests__/diagnosis/use-commute-detail.spec.tsx` — 2개 케이스
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **캐시 vs 재호출 트레이드오프:** MVP는 Option A (캐시 재사용) 권장. Option B (카카오 재호출)는 비용↑ + 최신 데이터 장점. 시간대 변경(REQ-FUNC-005) 시에만 재호출.
2. **±10% 오차 보장 메커니즘:** 현재 카카오 API 응답을 그대로 사용하므로 오차 0%. 시간대 변경 시 카카오 API의 시간대별 데이터 정확도에 의존.
3. **시간대 데이터 커버리지:** REQ-FUNC-005 "수도권 85% 이상" — 카카오 API의 시간대별 데이터 커버리지에 의존. MVP에서는 검증 범위를 제한.
4. **캐시 만료 정책:** 현재 CMD-DIAG-002 결과를 React state로 유지 (페이지 새로고침 시 소멸). 세션 유지 캐시는 v1.5+에서 검토.
