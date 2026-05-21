// ──────────────────────────────────────────────
// API-007 카카오 모빌리티 도메인 — DTO + interface + config 통합 (★ 외부 도메인 첫 ISSUE).
//
// ★ Q3 (가) 4 파일 분리 + §3.2/§3.3 통합 strategy § 적용 실전 2 회째 — DTO 8 + interface 1 + config 1 단일 책임 (외부 API 계약).
//
// ★ KakaoCoord = (x, y) 카카오 좌표계 — types.ts Coordinate (lat, lng) 와 독립 정의 (★ Phase C Mismatch 정직 기록 대상).
//
// ★ Q6 satisfies 대상 — IKakaoTransportClient.getCommuteTime 반환 CommuteInfo (★ Q4 Mismatch ② 보정 — Promise<number> 가 아닌 풍부한 Promise<CommuteInfo>).
// ──────────────────────────────────────────────

import type { CommuteInfo } from '@/lib/types';

// ──────────────────────────────────────────────
// 1. KakaoCoord — 카카오 좌표계 (x: 경도, y: 위도)
//    ★ types.ts Coordinate (lat, lng) 와 독립 정의 (혼동 방지)
// ──────────────────────────────────────────────

export interface KakaoCoord {
  x: number;   // 경도 (longitude) — 카카오 좌표계
  y: number;   // 위도 (latitude) — 카카오 좌표계
  name?: string;
}

// ──────────────────────────────────────────────
// 2. KakaoRouteRequest — 경로 탐색 요청
// ──────────────────────────────────────────────

export interface KakaoRouteRequest {
  origin: KakaoCoord;
  destination: KakaoCoord;
  departureTime?: string;              // ISO 8601 (기본: 현재 시각)
  transportType?: 'transit' | 'car';
}

// ──────────────────────────────────────────────
// 3. KakaoRouteSummary — 경로 요약 (단위 박힘: Seconds / Meters)
// ──────────────────────────────────────────────

export interface KakaoRouteSummary {
  origin: KakaoCoord;
  destination: KakaoCoord;
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  totalTransfers: number;
  totalWalkingSeconds: number;
  departureTime: string;                // ISO 8601
}

// ──────────────────────────────────────────────
// 4. KakaoRouteSection — 구간 단위 (transportMode 3 종: transit / car / walk)
// ──────────────────────────────────────────────

export interface KakaoRouteSection {
  transportMode: 'transit' | 'car' | 'walk';
  durationSeconds: number;
  distanceMeters: number;
  route?: string;                       // 버스 번호 또는 지하철 노선
  startStation?: string;
  endStation?: string;
}

// ──────────────────────────────────────────────
// 5. KakaoRoute — 단일 경로 (resultCode 0 = 성공)
// ──────────────────────────────────────────────

export interface KakaoRoute {
  resultCode: number;
  resultMsg: string;
  summary: KakaoRouteSummary;
  sections: KakaoRouteSection[];
}

// ──────────────────────────────────────────────
// 6. KakaoTransportResponse — 경로 응답 (routes 배열, 다중 경로 가능)
// ──────────────────────────────────────────────

export interface KakaoTransportResponse {
  routes: KakaoRoute[];
}

// ──────────────────────────────────────────────
// 7. KakaoTransportError — 에러 응답 (statusCode 포함, REQ-NF-035 Sentry 연계)
// ──────────────────────────────────────────────

export interface KakaoTransportError {
  code: number;
  message: string;
  statusCode: number;
}

// ──────────────────────────────────────────────
// 8. KakaoTransportClientConfig — 클라이언트 설정 (REQ-FUNC-007 타임아웃 5초 + 재시도 1 회)
// ──────────────────────────────────────────────

export interface KakaoTransportClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs?: number;
}

/** apiKey 제외 기본값 (Omit pattern) — REQ-FUNC-007 정합 */
export const DEFAULT_KAKAO_CONFIG: Omit<KakaoTransportClientConfig, 'apiKey'> = {
  baseUrl: 'https://apis-navi.kakaomobility.com',
  timeoutMs: 5000,
  maxRetries: 1,
  retryDelayMs: 500,
};

// ──────────────────────────────────────────────
// 9. IKakaoTransportClient — DI 가능 인터페이스 (구현체: client.ts 스텁 + MOCK-004 후행)
//    ★ Q4 Mismatch ② 보정: getCommuteTime 반환 Promise<CommuteInfo> (명세 v1.0 Promise<number> 보다 풍부).
// ──────────────────────────────────────────────

export interface IKakaoTransportClient {
  /**
   * 출발지 → 도착지 경로 탐색.
   * @throws KakaoTransportError 타임아웃 또는 API 에러 시
   */
  getRoute(request: KakaoRouteRequest): Promise<KakaoTransportResponse>;

  /**
   * 출퇴근 정보 조회 (getRoute 의 편의 메서드).
   * 반환: CommuteInfo (time / mode / transfers?) — mapper.ts mapKakaoResponseToCommuteInfo 활용.
   */
  getCommuteTime(
    origin: KakaoCoord,
    destination: KakaoCoord,
    departureTime?: string,
  ): Promise<CommuteInfo>;
}
