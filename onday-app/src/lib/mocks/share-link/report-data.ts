// ──────────────────────────────────────────────
// MOCK-002 ShareLink 도메인 — 공통 base (★ Wave 2 체인 6 회째 첫 코드 입증).
//
// ★ API-003 ReportDTO 첫 fixture 활용 = ★ Wave 2 체인 작동 6 회째
//   (DB-003 → API-002 → API-003 → API-005 → MOCK-001 → MOCK-002,
//    ★ API → MOCK 차원 2 번째 + ★ MOCK → MOCK 차원 신규 = MOCK_CANDIDATES_NORMAL 재사용).
//
// ★ ServiceModeType 재사용 6 회째 — ReportDTO.mode = ServiceModeType (API-003 산출물 자동 타입 체크, import 불필요).
//   SMT6 mock 차원 2 번째 (SMT5 MOCK-001 답습).
//
// ★ Q2 (가) 책임 분리 가드:
//   - S1~S6 ShareLink 현실 코드 (validators/diagnosis.ts + api/share/* + app/share/* + features/share/ + components/share/) import 절대 0
//     ↳ 다른 책임 (CRUD 영역 vs UI prop fixture)
//   - M1~M3 mock (neighborhoods + users + mock-calculator) import 절대 0 (MOCK-001 Q2 (가) 답습)
//   - Prisma model import 0 (관심사 분리, API-001/002/003/005/MOCK-001 일관)
//
// ★ 결정론적 가드 (AC-5, MOCK-001 표준 답습): Math.random / Date.now / new Date 0건. 모든 id/createdAt 고정값.
// ──────────────────────────────────────────────

import type { ReportDTO, DataSourceDTO } from '@/lib/types/share-link';
import { MOCK_CANDIDATES_NORMAL } from '@/lib/mocks/diagnosis';

// ──────────────────────────────────────────────
// 1. DataSourceDTO 3 — 공유 리포트 데이터 출처 배지 (UI-007 영역)
//    명세 §3.2 정확 답습 (카카오 모빌리티 + 국토교통부 + 경찰청 — 'api' 1 / 'public_data' 2)
// ──────────────────────────────────────────────

export const MOCK_DATA_SOURCES = [
  { name: '카카오 모빌리티 API', type: 'api', lastUpdated: '2026-04-20T00:00:00.000Z' },
  { name: '국토교통부 실거래가', type: 'public_data', lastUpdated: '2026-04-15T00:00:00.000Z' },
  { name: '경찰청 범죄 통계', type: 'public_data', lastUpdated: '2026-01-01T00:00:00.000Z' },
] as const satisfies readonly DataSourceDTO[];

// ──────────────────────────────────────────────
// 2. ReportDTO — 공유 리포트 본체 (★ Wave 2 체인 6 회째 입증 + ★ MOCK → MOCK 차원 신규)
//    mode='couple' = ServiceModeType 6 회째 satisfies 자동 + previewCandidateId='mock-cand-001' = MOCK_CANDIDATE_YEOKSAM.id 정합
// ──────────────────────────────────────────────

/** 정상 리포트 — 무료 미리보기 미사용 (배우자 첫 열람 시점) */
export const MOCK_REPORT_NORMAL = {
  diagnosisId: 'mock-diag-001',
  candidates: [...MOCK_CANDIDATES_NORMAL],
  mode: 'couple',
  createdAt: '2026-05-21T10:00:00.000Z',
  freePreviewUsed: false,
  previewCandidateId: 'mock-cand-001',
} satisfies ReportDTO;

/** 무료 미리보기 1 곳 소진 — 유료 전환 유도 시점 (REQ-FUNC-014) */
export const MOCK_REPORT_PREVIEW_USED = {
  ...MOCK_REPORT_NORMAL,
  freePreviewUsed: true,
} satisfies ReportDTO;
