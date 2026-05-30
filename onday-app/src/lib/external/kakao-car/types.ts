// ──────────────────────────────────────────────
// 카카오 모빌리티 자동차 길찾기 도메인 — DTO + interface + config.
// ★ W2B: car=카카오 (transit=ODsay 는 odsay-transit/). 실 /v1/directions 응답 정합.
//   (기존 kakao-transport/ 는 가상 transit 형태 + dead 소비자(intersection/mocks)라
//    재작성 대신 본 신규 모듈로 분리 — ODsay 답습. LOG §35.)
// ★ 카카오 모빌리티 = 브라우저 직접 호출 OK (CORS 허용, 도메인 제한). 서버 프록시 불필요.
// ──────────────────────────────────────────────

import type { CommuteInfo } from "@/lib/types";

/** 카카오 좌표계 — x=경도(lng), y=위도(lat). 앱 Coordinate {lat,lng} 와 독립. */
export interface KakaoCarCoord {
  x: number; // 경도 (lng)
  y: number; // 위도 (lat)
}

export interface KakaoCarFare {
  taxi: number;
  toll: number;
}

/** routes[].summary — 실 응답 필드(snake_case). 자동차라 환승 개념 없음. */
export interface KakaoCarSummary {
  duration: number; // 초
  distance: number; // 미터
  fare: KakaoCarFare;
}

export interface KakaoCarRoute {
  result_code: number; // 0 = 성공
  result_msg: string;
  summary: KakaoCarSummary;
  // sections(roads/guides)는 현재 CommuteInfo 미사용.
}

export interface KakaoCarResponse {
  routes: KakaoCarRoute[];
}

export interface KakaoCarClientConfig {
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

export const DEFAULT_KAKAO_CAR_CONFIG: Omit<KakaoCarClientConfig, "apiKey"> = {
  baseUrl: "https://apis-navi.kakaomobility.com",
  timeoutMs: 5000, // REQ-FUNC-007 정합
  maxRetries: 1,
  retryDelayMs: 500,
};

export interface IKakaoCarClient {
  /** 출발→도착 자동차 통근 정보 (mode='driving'). */
  getCarCommute(
    origin: KakaoCarCoord,
    destination: KakaoCarCoord,
  ): Promise<CommuteInfo>;
}

export class KakaoCarError extends Error {
  readonly code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "KakaoCarError";
    this.code = code;
  }
}
