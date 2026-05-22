// ──────────────────────────────────────────────
// MOCK-004 카카오 모빌리티 에러 fixture — 4 시나리오 (★ Mismatch ⑤ statusCode 보정).
//
// ★ API-007 KakaoTransportError satisfies = Wave 2 체인 9 회째 입증 추가 위치.
//   Mismatch ⑤: KakaoErrorResponse → KakaoTransportError + statusCode 추가 (REQ-NF-035 Sentry 연계).
//
// ★ adaptLegacyMap § 위임 트리거 — CMD-DIAG-006 KAKAO_ERROR_MAP 신설 시
//   sentryLevel 자동 추론 (≥500 error / ≥400 warning / 그 외 info) 자동 작동.
//   본 ISSUE 범위 외 (★ Q2 (B) 정직 기록 + 위임 트리거).
//
// ★ 결정론 가드 (Math.random / Date.now / new Date 0 건 = MOCK-001 / MOCK-002 표준 답습 3 회째).
// ──────────────────────────────────────────────

import type { KakaoTransportError } from '@/lib/external/kakao-transport';

export const MOCK_ERROR_TIMEOUT = {
  code: -1,
  message: 'Request timeout (5000ms exceeded)',
  statusCode: 408,
} satisfies KakaoTransportError;

export const MOCK_ERROR_RATE_LIMIT = {
  code: 429,
  message: 'Rate limit exceeded (daily quota: 500,000 requests)',
  statusCode: 429,
} satisfies KakaoTransportError;

export const MOCK_ERROR_INVALID_COORD = {
  code: 400,
  message: 'Invalid coordinate (out of service coverage area)',
  statusCode: 400,
} satisfies KakaoTransportError;

export const MOCK_ERROR_NO_ROUTE = {
  code: 404,
  message: 'No route found between the given coordinates',
  statusCode: 404,
} satisfies KakaoTransportError;
