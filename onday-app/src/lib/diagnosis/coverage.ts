// ──────────────────────────────────────────────
// CMD-DIAG-001 수도권 커버리지 검증 — 환경 중립 utility (CMD-DIAG-007 후행 재사용 owner).
// REQ-FUNC-031 § 4.1.6 — 수도권(서울·경기·인천) 외 주소 입력 차단 가드.
//
// ★ 환경 중립 (Server Action + Client 양쪽 import 가능) — "use client" 부재 가드 (★ Mismatch ④).
// ★ METRO_AREA_PREFIXES owner = geocoding.ts (★ 명세 §3.3 단일 진리) — 본 파일 isMetroArea 는 단순 위임.
// ──────────────────────────────────────────────

import type { Coordinate } from "@/lib/types";
import type { GeocodedAddress } from "./geocoding-types";

const METRO_AREA_BOUNDS = {
  latMin: 36.9,
  latMax: 38.0,
  lngMin: 126.5,
  lngMax: 127.9,
};

export function isMetroArea(address: GeocodedAddress): boolean {
  return address.isMetroArea;
}

export function isWithinMetroBounds(coord: Coordinate): boolean {
  return (
    coord.lat >= METRO_AREA_BOUNDS.latMin &&
    coord.lat <= METRO_AREA_BOUNDS.latMax &&
    coord.lng >= METRO_AREA_BOUNDS.lngMin &&
    coord.lng <= METRO_AREA_BOUNDS.lngMax
  );
}
