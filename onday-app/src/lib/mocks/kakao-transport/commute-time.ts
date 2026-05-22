// ──────────────────────────────────────────────
// MOCK-004 출퇴근 정보 조회 fixture — ★ Mismatch ⑥ 보정 핵심 위치.
//
// ★ Mismatch ⑥ 자동 보정 (adaptive § 외부 도메인+mock 차원 풍부 적용):
//   명세 v1.0: Record<string, number> (분 단위 단순 lookup)
//   → API-007 IKakaoTransportClient.getCommuteTime: Promise<CommuteInfo> 정합
//   → 본 fixture: Record<string, CommuteInfo> ({time, mode, transfers?})
//
// ★ types.ts CommuteInfo import = 15 칸 누적 가드 정합 (Wave 2 체인 9 회째 추가 입증).
//
// ★ 결정론 가드 (Math.random / Date.now / new Date 0 건 = MOCK-001 / MOCK-002 표준 답습 3 회째).
// ──────────────────────────────────────────────

import type { CommuteInfo } from '@/lib/types';

export const MOCK_COMMUTE_INFOS: Record<string, CommuteInfo> = {
  'gangnam-to-hapjeong': { time: 26, mode: 'transit', transfers: 1 },
  'jamsil-to-cityhall': { time: 28, mode: 'transit', transfers: 0 },
  'pangyo-to-gangnam': { time: 40, mode: 'driving' },
  'noryangjin-to-guro': { time: 42, mode: 'transit', transfers: 2 },
} satisfies Record<string, CommuteInfo>;
