import type { Coordinate, CommuteInfo } from "@/lib/types";
import type { KakaoCarResponse, KakaoCarRoute } from "./types";
import { KakaoCarError } from "./types";

/**
 * A-2 (#졸업 지도) — routes[].sections[].roads[].vertexes(평면 [lng,lat,…]) → Coordinate[].
 * 실 도로 경로 폴리라인. 빈 배열이면 화면에서 직선 추정으로 fallback.
 */
function extractRoutePath(route: KakaoCarRoute): Coordinate[] {
  const path: Coordinate[] = [];
  for (const section of route.sections ?? []) {
    for (const road of section.roads ?? []) {
      const v = road.vertexes ?? [];
      for (let i = 0; i + 1 < v.length; i += 2) {
        path.push({ lng: v[i], lat: v[i + 1] });
      }
    }
  }
  return path;
}

/**
 * 카카오 자동차 길찾기 응답 → CommuteInfo (mode='driving', 환승 없음).
 * - routes[0] (추천 경로) 사용.
 * - duration(초) → time(분).
 * - A-2: sections.roads.vertexes → routePath (실 도로 경로).
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

  const routePath = extractRoutePath(route);
  return {
    time: Math.round(route.summary.duration / 60),
    mode: "driving",
    // 자동차 = 환승 없음 (transfers 미설정). fare/distance 는 현재 CommuteInfo 미보유.
    ...(routePath.length >= 2 ? { routePath } : {}),
  } satisfies CommuteInfo;
}
