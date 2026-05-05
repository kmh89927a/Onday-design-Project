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
  return Math.max(0, Math.floor(distanceKm / 5));
}
