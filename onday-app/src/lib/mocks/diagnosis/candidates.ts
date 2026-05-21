// ──────────────────────────────────────────────
// MOCK-001 Diagnosis 도메인 — 재사용 fixture base (★ Wave 2 트랙 E 첫 코드 입증).
//
// ★ API-002 (P1) `CandidateAreaDTO = CandidateArea` re-export 첫 fixture 활용
//   = ★ Wave 2 체인 작동 5회째 (DB-003 → API-002 → API-003 → API-005 → 본 ISSUE MOCK 차원).
//   이 한 줄(import)이 본 ISSUE 진짜 가치 — API → MOCK 차원 첫 외부 활용.
//
// ★ Q2 (가) 책임 분리 가드:
//   - M1 `MOCK_NEIGHBORHOODS` (src/mocks/neighborhoods.ts, Neighborhood 타입) import 절대 0
//     ↳ 다른 타입(Neighborhood ≠ CandidateAreaDTO) + 다른 사용처(진단 input vs UI fixture)
//   - Prisma model import 0 (관심사 분리, API-001/002/003/005 일관)
//   - types.ts DiagnosisMode/DiagnosisStatus/CandidateArea 직접 import 0 (Q2 가드 4회째 사수)
//
// ★ 결정론적 가드 (AC-5): Math.random / Date.now / new Date 0건. 모든 id/coordinate/통계 고정값.
// ──────────────────────────────────────────────

import type { CandidateAreaDTO } from '@/lib/types/diagnosis';

// ──────────────────────────────────────────────
// 1. CandidateAreaDTO 4 개 — 수도권 실재 행정동 좌표 기반
//    (역삼/안국/이태원/성수 — 다양한 권역 + 통근 시나리오)
// ──────────────────────────────────────────────

/** 강남구 역삼동 — 강남 업무지구 핵심 */
export const MOCK_CANDIDATE_YEOKSAM = {
  id: 'mock-cand-001',
  dong: '역삼동',
  gu: '강남구',
  coordinate: { lat: 37.5006, lng: 127.0364 },
  commuteA: { time: 35, mode: 'transit', transfers: 1 },
  commuteB: { time: 42, mode: 'transit', transfers: 2 },
  score: 92,
  safetyGrade: 'A',
  priceRange: { min: 12000, max: 18000 },
  facilities: { convenience: 18, cafes: 32, schools: 6 },
  lines: '2호선·분당선·신분당선',
  listingsCount: 142,
  avgArea: 24,
} satisfies CandidateAreaDTO;

/** 종로구 안국동 — 광화문·종로 도심 */
export const MOCK_CANDIDATE_ANGUK = {
  id: 'mock-cand-002',
  dong: '안국동',
  gu: '종로구',
  coordinate: { lat: 37.5759, lng: 126.9854 },
  commuteA: { time: 28, mode: 'transit', transfers: 0 },
  commuteB: { time: 38, mode: 'transit', transfers: 1 },
  score: 85,
  safetyGrade: 'A',
  priceRange: { min: 9000, max: 14000 },
  facilities: { convenience: 14, cafes: 28, schools: 4 },
  lines: '3호선·5호선',
  listingsCount: 86,
  avgArea: 22,
} satisfies CandidateAreaDTO;

/** 용산구 이태원동 — 한강 이남·강북 연결 */
export const MOCK_CANDIDATE_ITAEWON = {
  id: 'mock-cand-003',
  dong: '이태원동',
  gu: '용산구',
  coordinate: { lat: 37.5345, lng: 126.9947 },
  commuteA: { time: 32, mode: 'transit', transfers: 1 },
  commuteB: { time: 36, mode: 'transit', transfers: 1 },
  score: 88,
  safetyGrade: 'B',
  priceRange: { min: 11000, max: 16000 },
  facilities: { convenience: 22, cafes: 45, schools: 3 },
  lines: '6호선·경의중앙선',
  listingsCount: 104,
  avgArea: 25,
} satisfies CandidateAreaDTO;

/** 성동구 성수동 — 동부 신흥 업무지구 */
export const MOCK_CANDIDATE_SUNGSU = {
  id: 'mock-cand-004',
  dong: '성수동',
  gu: '성동구',
  coordinate: { lat: 37.5447, lng: 127.0557 },
  commuteA: { time: 40, mode: 'transit', transfers: 1 },
  commuteB: { time: 30, mode: 'transit', transfers: 0 },
  score: 78,
  safetyGrade: 'B',
  priceRange: { min: 8000, max: 12000 },
  facilities: { convenience: 16, cafes: 38, schools: 5 },
  lines: '2호선·수인분당선',
  listingsCount: 78,
  avgArea: 26,
} satisfies CandidateAreaDTO;

// ──────────────────────────────────────────────
// 2. 배열 const — 시나리오 + GET response 가 재사용
// ──────────────────────────────────────────────

/** 정상 진단 결과 4 후보 — scenarios.ts / get-diagnosis.ts 양쪽 재사용 base */
export const MOCK_CANDIDATES_NORMAL = [
  MOCK_CANDIDATE_YEOKSAM,
  MOCK_CANDIDATE_ANGUK,
  MOCK_CANDIDATE_ITAEWON,
  MOCK_CANDIDATE_SUNGSU,
] as const satisfies readonly CandidateAreaDTO[];
