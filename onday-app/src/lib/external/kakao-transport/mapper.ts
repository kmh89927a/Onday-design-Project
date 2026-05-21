// ──────────────────────────────────────────────
// API-007 카카오 모빌리티 — 응답 → CommuteInfoDTO 변환 mapper.
//
// ★ Wave 2 체인 7 회째 입증 위치 — API-002 (P1) `CommuteInfoDTO = CommuteInfo` re-export 첫 활용
//   (DB-003 → API-002 → API-003 → API-005 → MOCK-001 → MOCK-002 → ★ API-007,
//    ★ API → API 차원 2 번째 = Wave 1 내부 체인).
//
// ★ Q4 Mismatch ② 4 필드 보정 — MOCK-001 ② 보정 답습 + 사전 발견 진화:
//   ① durationMinutes → time (필드명)
//   ② transportType ('transit' | 'car') → mode ('transit' | 'driving') (★ enum 'car' → 'driving')
//   ③ transfers (required) → transfers? (optional, undefined 처리)
//   ④ walkingMinutes (필수) → ★ 정보 손실 수용 (반환 객체에서 제외, ★ REFACTOR-L6 cleanup 트리거 5차 확장 — CommuteInfo + DiagnosisFilters 동시 정정 미래 cleanup 신설 시)
// ──────────────────────────────────────────────

import type { KakaoTransportResponse } from './types';
import type { CommuteInfoDTO } from '@/lib/types/diagnosis';

/**
 * 카카오 모빌리티 응답을 CommuteInfoDTO 로 변환.
 * @param response 카카오 API 원본 응답 (routes 배열)
 * @returns CommuteInfoDTO (API-002 (P1) re-export = CommuteInfo 정확)
 * @throws Error 경로 없음 (resultCode !== 0) 또는 빈 routes 배열
 */
export function mapKakaoResponseToCommuteInfo(
  response: KakaoTransportResponse,
): CommuteInfoDTO {
  const route = response.routes[0];
  if (!route || route.resultCode !== 0) {
    throw new Error(`Kakao route error: ${route?.resultMsg ?? 'No route'}`);
  }

  const summary = route.summary;
  const hasCarSection = route.sections.some(s => s.transportMode === 'car');

  return {
    time: Math.round(summary.totalDurationSeconds / 60),
    mode: hasCarSection ? 'driving' : 'transit',
    transfers: summary.totalTransfers,
    // ★ walkingMinutes 부재 — 실제 CommuteInfo 산출물 정확 채택 (정보 손실 수용)
  } satisfies CommuteInfoDTO;
}
