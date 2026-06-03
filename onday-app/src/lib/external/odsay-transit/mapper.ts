import type { Coordinate, CommuteInfo } from "@/lib/types";
import type { OdsayPath, OdsayTransitResponse } from "./types";
import { OdsayTransitError } from "./types";

/**
 * A-3 (#졸업 지도) — subPath 의 지하철·버스 정거장 좌표를 순서대로 → Coordinate[].
 * "거쳐가는 역" 선용. 도보 구간은 좌표 없어 제외(출발·도착 연결은 화면단에서 보강).
 */
function extractStationPath(path: OdsayPath): Coordinate[] {
  const out: Coordinate[] = [];
  for (const sp of path.subPath ?? []) {
    for (const st of sp.passStopList?.stations ?? []) {
      out.push({ lat: Number(st.y), lng: Number(st.x) });
    }
  }
  return out;
}

/**
 * ODsay 대중교통 길찾기 응답 → CommuteInfo (앱 모델 무변경 — R2 transit-only).
 * - 추천 경로 result.path[0] 사용 (ODsay 정렬 = 최단/추천 우선).
 * - transfers = (지하철+버스 탑승 횟수) − 1 (첫 탑승은 환승 아님).
 * @throws OdsayTransitError 경로 없음 / 에러 응답.
 */
export function mapOdsayResponseToCommuteInfo(
  res: OdsayTransitResponse,
): CommuteInfo {
  if (res.error) {
    throw new OdsayTransitError(
      `ODsay error: ${res.error.message ?? res.error.msg ?? "unknown"}`,
      res.error.code,
    );
  }

  const path = res.result?.path?.[0];
  if (!path) {
    throw new OdsayTransitError("ODsay: 대중교통 경로 없음");
  }

  const { totalTime, subwayTransitCount, busTransitCount } = path.info;
  const transfers = Math.max(0, subwayTransitCount + busTransitCount - 1);
  const stationPath = extractStationPath(path);

  return {
    time: totalTime,
    mode: "transit",
    transfers,
    // A-3 — 거쳐가는 정거장 좌표 (2개 이상일 때만). 출발·도착 연결은 화면단에서 보강.
    ...(stationPath.length >= 2 ? { routePath: stationPath } : {}),
    // totalWalk / payment 는 현재 CommuteInfo 미보유 — 정보 손실 수용 (차후 모델 확장 시).
  } satisfies CommuteInfo;
}
