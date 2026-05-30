// ──────────────────────────────────────────────
// CMD-DIAG-001 카카오 Local API Geocoding — DTO 3종.
//
// ★ Coordinate 재사용 (★ Mismatch ⑦, ★ 결정론 가드 § 진화 MOCK-005 § 후행 실전 = 단일 진리).
// ★ Mismatch ① KakaoCoord (모빌리티 {x:number, y:number}) ≠ GeocodeResult (Local API {x:string, y:string})
//   = 자체 정의 정당화 (다른 외부 API — Local vs Mobility, ★ 외부 도메인 매트릭스 § 정밀화).
// ──────────────────────────────────────────────

import type { Coordinate } from "@/lib/types";

/**
 * 카카오 Local API 키워드(장소) 검색 응답 document 원본.
 * ★ W2 정정: address.json(주소) → keyword.json(장소) 전환 — 사용자가 치는 역/장소
 *   이름("강남역")을 매칭하기 위함. 실 응답은 snake_case + 평면 구조.
 *   (기존 camelCase/nested 가정은 실 응답과 불일치 = production 미실행 잠복 버그였음.)
 */
export interface GeocodeResult {
  place_name: string; // 장소명 (예: "강남역 2호선")
  address_name: string; // 지번 주소 (예: "서울 강남구 역삼동 858")
  road_address_name: string; // 도로명 주소
  x: string; // 경도 (lng)
  y: string; // 위도 (lat)
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
