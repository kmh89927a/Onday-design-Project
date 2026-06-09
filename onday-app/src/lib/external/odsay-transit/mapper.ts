import type { Coordinate, CommuteInfo, RouteLine, RouteSegment } from "@/lib/types";
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

// ── 스트레스 지수 P1 — 룰 엔진(후속 P3)용 파생 데이터 추출. 전부 additive. ──

/** 도보 구간(trafficType===3)의 distance 합 → 환승 도보 총거리(m). 없으면 0. */
function sumTransferWalkMeters(path: OdsayPath): number {
  let m = 0;
  for (const sp of path.subPath ?? []) {
    if (sp.trafficType === 3 && typeof sp.distance === "number") m += sp.distance;
  }
  return m;
}

/** 탑승 구간(지하철=1/버스=2)의 노선 목록 → RouteLine[] (쾌적도 룰 입력). */
function extractRouteLines(path: OdsayPath): RouteLine[] {
  const out: RouteLine[] = [];
  for (const sp of path.subPath ?? []) {
    if (sp.trafficType !== 1 && sp.trafficType !== 2) continue;
    const lane = sp.lane?.[0];
    const name = lane?.name ?? lane?.busNo;
    if (name) out.push({ type: sp.trafficType === 1 ? "subway" : "bus", name });
  }
  return out;
}

/** 탑승 구간 거쳐가는 역 이름 목록(순서대로) — 착석확률/혼잡도 매칭 입력. */
function extractRouteStations(path: OdsayPath): string[] {
  const out: string[] = [];
  for (const sp of path.subPath ?? []) {
    if (sp.trafficType !== 1 && sp.trafficType !== 2) continue;
    for (const st of sp.passStopList?.stations ?? []) {
      if (st.stationName) out.push(st.stationName);
    }
  }
  return out;
}

/**
 * P1.5 — 탑승 구간(지하철=1/버스=2) 1개 = RouteSegment 1개. (역+호선) 묶음 보존.
 *   routeStations(flat)와 달리 구간 경계 유지 → 환승 경로 혼잡도 매칭(어느 역이 어느 호선).
 */
function extractRouteSegments(path: OdsayPath): RouteSegment[] {
  const out: RouteSegment[] = [];
  for (const sp of path.subPath ?? []) {
    if (sp.trafficType !== 1 && sp.trafficType !== 2) continue;
    const lane = sp.lane?.[0];
    const name = lane?.name ?? lane?.busNo;
    if (!name) continue;
    const stations: string[] = [];
    for (const st of sp.passStopList?.stations ?? []) {
      if (st.stationName) stations.push(st.stationName);
    }
    out.push({
      line: { type: sp.trafficType === 1 ? "subway" : "bus", name },
      ...(sp.startName ? { from: sp.startName } : {}),
      ...(sp.endName ? { to: sp.endName } : {}),
      stations,
    });
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

  const { totalTime, subwayTransitCount, busTransitCount, firstStartStation } =
    path.info;
  const transfers = Math.max(0, subwayTransitCount + busTransitCount - 1);
  const stationPath = extractStationPath(path);

  // 스트레스 지수 P1 — 룰 입력 파생 데이터(있을 때만 부착, 거짓값 금지).
  const transferWalkMeters = sumTransferWalkMeters(path);
  const routeLines = extractRouteLines(path);
  const routeStations = extractRouteStations(path);
  const routeSegments = extractRouteSegments(path); // P1.5 — (역+호선) 묶음

  return {
    time: totalTime,
    mode: "transit",
    transfers,
    // A-3 — 거쳐가는 정거장 좌표 (2개 이상일 때만). 출발·도착 연결은 화면단에서 보강.
    ...(stationPath.length >= 2 ? { routePath: stationPath } : {}),
    // 하루 미리보기 — 첫 탑승역 이름(있을 때만, 거짓값 금지). 기존 로직 무영향(필드 추가만).
    ...(firstStartStation ? { departureStation: firstStartStation } : {}),
    // 스트레스 지수 P1 — 환승 도보거리/노선/역 목록(있을 때만). 룰·표시는 후속 P2~P4.
    ...(transferWalkMeters > 0 ? { transferWalkMeters } : {}),
    ...(routeLines.length ? { routeLines } : {}),
    ...(routeStations.length ? { routeStations } : {}),
    ...(routeSegments.length ? { routeSegments } : {}),
    // totalWalk / payment 는 현재 CommuteInfo 미보유 — 정보 손실 수용 (차후 모델 확장 시).
  } satisfies CommuteInfo;
}
