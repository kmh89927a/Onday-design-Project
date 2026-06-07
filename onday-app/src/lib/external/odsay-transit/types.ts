// ──────────────────────────────────────────────
// ODsay 대중교통 길찾기 도메인 — DTO + interface + config.
// ★ transit=ODsay 신규 (car=kakao 는 kakao-transport/ 후속). W2 ODsay 슬라이스.
//   SRS EXT-01 "카카오 모빌리티 = 대중교통" 은 사실오류(카카오=car) → 대중교통은 ODsay.
// ──────────────────────────────────────────────

import type { CommuteInfo } from "@/lib/types";

/** ODsay 좌표 — SX/SY = 경도(lng)/위도(lat). */
export interface OdsayCoord {
  lng: number;
  lat: number;
}

/** result.path[].info — 필요 필드만. */
export interface OdsayPathInfo {
  totalTime: number; // 총 소요시간 (분)
  totalWalk: number; // 총 도보 거리 (미터)
  payment: number; // 총 요금
  busTransitCount: number; // 버스 환승 카운트
  subwayTransitCount: number; // 지하철 환승 카운트
}

/** subPath[].passStopList.stations[] — 거쳐가는 정거장 좌표 (x=lng, y=lat). */
export interface OdsayStation {
  x: number | string; // 경도(lng)
  y: number | string; // 위도(lat)
  stationName?: string;
}
export interface OdsaySubPath {
  trafficType: number; // 1=지하철, 2=버스, 3=도보
  passStopList?: { stations?: OdsayStation[] };
}

export interface OdsayPath {
  info: OdsayPathInfo;
  // A-3 (#졸업 지도) — 대중교통 정거장 선. 도보(3)는 좌표 없음, 지하철(1)/버스(2)만 정거장 보유.
  subPath?: OdsaySubPath[];
}

/** searchPubTransPathT 응답. 경로 없음/에러 시 result 부재 또는 error 객체. */
export interface OdsayTransitResponse {
  result?: { path?: OdsayPath[] };
  error?: { code?: string; message?: string; msg?: string };
}

export interface OdsayTransitClientConfig {
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

export const DEFAULT_ODSAY_CONFIG: Omit<OdsayTransitClientConfig, "apiKey"> = {
  baseUrl: "https://api.odsay.com/v1/api",
  timeoutMs: 5000, // REQ-FUNC-007 정합 (단일 호출 — B2 라 함수당 1회)
  // ★ 429(Too Many Requests) 대응 — ODsay 동시호출 한계가 낮아 재시도 필수.
  //   429 는 지수 backoff(600→1200→2400ms)로, 그 외 에러는 retryDelayMs 고정(client.ts).
  maxRetries: 3,
  retryDelayMs: 600,
};

export interface IOdsayTransitClient {
  /** 출발→도착 대중교통 통근 정보 (mapOdsayResponseToCommuteInfo 활용). */
  getTransitCommute(
    origin: OdsayCoord,
    destination: OdsayCoord,
  ): Promise<CommuteInfo>;
}

/** ODsay 호출/매핑 실패 표준 에러. */
export class OdsayTransitError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "OdsayTransitError";
    this.code = code;
  }
}
