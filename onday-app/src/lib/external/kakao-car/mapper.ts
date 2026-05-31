import type { CommuteInfo } from "@/lib/types";
import type { KakaoCarResponse } from "./types";
import { KakaoCarError } from "./types";

/**
 * 카카오 자동차 길찾기 응답 → CommuteInfo (mode='driving', 환승 없음).
 * - routes[0] (추천 경로) 사용.
 * - duration(초) → time(분).
 * @throws KakaoCarError result_code !== 0 또는 빈 routes.
 */
export function mapKakaoCarResponseToCommuteInfo(
  res: KakaoCarResponse,
): CommuteInfo {
  const route = res.routes?.[0];
  if (!route) {
    throw new KakaoCarError("카카오 자동차 경로 없음");
  }
  if (route.result_code !== 0) {
    throw new KakaoCarError(
      `카카오 길찾기 실패: ${route.result_msg}`,
      route.result_code,
    );
  }

  return {
    time: Math.round(route.summary.duration / 60),
    mode: "driving",
    // 자동차 = 환승 없음 (transfers 미설정). fare/distance 는 현재 CommuteInfo 미보유.
  } satisfies CommuteInfo;
}
