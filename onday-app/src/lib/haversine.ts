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
 * Estimate transit commute time from straight-line distance.
 * - Base speed: ~25 km/h (Seoul metro average including transfers)
 * - Walking overhead: +5 min
 * - Transfer penalty: +3 min per transfer (estimated 1 per 5km)
 */
export function estimateCommuteMinutes(distanceKm: number): number {
  const baseMinutes = (distanceKm / 25) * 60;
  const walkingOverhead = 5;
  const transfers = Math.max(0, Math.floor(distanceKm / 5));
  const transferPenalty = transfers * 3;
  return Math.round(baseMinutes + walkingOverhead + transferPenalty);
}

export function estimateTransfers(distanceKm: number): number {
  // mock 데모 전용 거리 추정. 실 진단(run-real-diagnosis)은 ODsay 실 탑승 횟수 사용.
  // 상한 3 캡 — 거리만으로 추정해 장거리(예: 김포→강남 35km)에서 7회 같은
  // 비현실 값이 나오던 것 방지 (#37). 실 ODsay 동일 구간은 2회.
  return Math.min(3, Math.max(0, Math.floor(distanceKm / 5)));
}
