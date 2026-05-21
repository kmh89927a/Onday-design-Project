// ──────────────────────────────────────────────
// API-006 Common 에러 도메인 — 5 도메인 통합 base (★ Q4 adaptLegacyMap 어댑터의 sentryLevel 확장 source).
//
// ★ Q3 (가) 6 파일 분리 + "3-Layer 통합 차원" 신규 (API-005 § 4번째 후행 적용).
//   본 파일 = Common enum + Common entry interface 단일 책임 (다른 도메인 import 0).
//
// ★ Mismatch ① sentryLevel 누락 보정 = 본 파일 base — 4 도메인 errors.ts 의 Omit pattern 결과
//   `{ message, httpStatus }` + sentryLevel? 확장 = CommonErrorMapEntry.
// ──────────────────────────────────────────────

/** Common 도메인 에러 코드 (5 종, REQ-NF-035 Sentry 연계) */
export enum CommonErrorCode {
  /** 네트워크 타임아웃 (504, REQ-FUNC-007) */
  NETWORK_TIMEOUT = 'COMMON_NETWORK_TIMEOUT',
  /** 입력값 검증 실패 (400) */
  INVALID_INPUT = 'COMMON_INVALID_INPUT',
  /** Rate Limit 초과 (429, SEC-002 영역) */
  RATE_LIMITED = 'COMMON_RATE_LIMITED',
  /** 서버 내부 오류 (500, REQ-NF-012 5xx 모니터링) */
  INTERNAL_SERVER_ERROR = 'COMMON_INTERNAL_SERVER_ERROR',
  /** 서비스 점검 (503) */
  MAINTENANCE_MODE = 'COMMON_MAINTENANCE_MODE',
}

/**
 * 에러 매핑 엔트리 (★ AppErrorMapEntry base).
 * sentryLevel? = ★ Mismatch ① 보정 — 4 도메인 기존 errors.ts 는 미포함 (adaptLegacyMap 어댑터로 httpStatus 기반 자동 추론).
 */
export interface CommonErrorMapEntry {
  message: string;
  httpStatus: number;
  sentryLevel?: 'error' | 'warning' | 'info';
}
