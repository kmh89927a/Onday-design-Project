// ──────────────────────────────────────────────
// CMD-DIAG-001 카카오 Local API Geocoding — DTO 3종.
//
// ★ Coordinate 재사용 (★ Mismatch ⑦, ★ 결정론 가드 § 진화 MOCK-005 § 후행 실전 = 단일 진리).
// ★ Mismatch ① KakaoCoord (모빌리티 {x:number, y:number}) ≠ GeocodeResult (Local API {x:string, y:string})
//   = 자체 정의 정당화 (다른 외부 API — Local vs Mobility, ★ 외부 도메인 매트릭스 § 정밀화).
// ──────────────────────────────────────────────

import type { Coordinate } from "@/lib/types";

/** 카카오 Local API Geocoding 응답 원본 (★ Mismatch ② 자체 정의 — x/y 문자열). */
export interface GeocodeResult {
  addressName: string;
  roadAddressName: string;
  x: string;
  y: string;
  region1DepthName: string;
  region2DepthName: string;
  region3DepthName: string;
}

/** 변환된 주소 DTO (★ coord: Coordinate 재사용 = ★ Mismatch ⑦, 결정론 가드 § 진화 후행 실전). */
export interface GeocodedAddress {
  address: string;
  roadAddress: string;
  coord: Coordinate;
  region: string;
  isMetroArea: boolean;
}

/** Geocoding 에러 DTO — API-002 DiagnosisErrorDTO 패턴 답습 (code/message/httpStatus). */
export interface GeocodeError {
  code: string;
  message: string;
  httpStatus: number;
}
