import type { Coordinate } from "./types";

const EARTH_RADIUS_KM = 6371;

export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfLng * sinHalfLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * 출발 시각(HH:MM) → 혼잡 계수. mock 시간대 시뮬레이션 (실 시간대 통계 부재 → 근사).
 * - 출퇴근 피크(07~09, 17~19시) → ×1.3 (+30%, 지연·혼잡)
 * - 심야(22~06시) → ×0.9 (-10%, 한산)
 * - 그 외 → ×1.0
 */
export function rushHourFactor(departureTime?: string): number {
  if (!departureTime) return 1;
  const hour = Number.parseInt(departureTime.slice(0, 2), 10);
  if (Number.isNaN(hour)) return 1;
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) return 1.3;
  if (hour >= 22 || hour < 6) return 0.9;
  return 1;
}

/**
 * Estimate transit commute time from straight-line distance.
 * - Base speed: ~25 km/h (Seoul metro average including transfers)
 * - Walking overhead: +5 min (시간대 무관 — 고정)
 * - Transfer penalty: +3 min per transfer (estimated 1 per 5km)
 * - departureTime: 출퇴근 피크/심야 혼잡 계수 (이동 구간에만, 도보 제외).
 */
export function estimateCommuteMinutes(
  distanceKm: number,
  departureTime?: string,
): number {
  const baseMinutes = (distanceKm / 25) * 60;
  const walkingOverhead = 5;
  const transfers = Math.max(0, Math.floor(distanceKm / 5));
  const transferPenalty = transfers * 3;
  const travel =
    (baseMinutes + transferPenalty) * rushHourFactor(departureTime);
  return Math.round(travel + walkingOverhead);
}

export function estimateTransfers(distanceKm: number): number {
  // mock 데모 전용 거리 추정. 실 진단(run-real-diagnosis)은 ODsay 실 탑승 횟수 사용.
  // 상한 3 캡 — 거리만으로 추정해 장거리(예: 김포→강남 35km)에서 7회 같은
  // 비현실 값이 나오던 것 방지 (#37). 실 ODsay 동일 구간은 2회.
  return Math.min(3, Math.max(0, Math.floor(distanceKm / 5)));
}
