// ──────────────────────────────────────────────
// MOCK-005 Auth 에러 fixture — AuthErrorDTO 3 + MiddlewareAuthResult 2.
//
// ★ AuthErrorCode enum (API-001 정합):
//   OAUTH_CALLBACK_FAILED / SESSION_EXPIRED / OAUTH_PROVIDER_ERROR
//
// ★ MiddlewareAuthResult 정확 시그니처 (API-001 정합):
//   authenticated: boolean (★ NOT isAuthenticated)
//   user: AuthUserDTO | null
//   error?: AuthErrorCode
//
// ★ adaptLegacyMap § 위임 트리거 — CMD-AUTH-001~004 AUTH_ERROR_MAP 신설 시
//   sentryLevel 자동 추론 (≥500 error / ≥400 warning / 그 외 info) 자동 작동.
//   본 ISSUE 범위 외 (★ Q2 정신 답습 정직 기록 + 위임 트리거).
//
// ★ 결정론 가드 § 정립 단계 답습 (Math.random / Date.now / new Date 호출 0 건).
// ──────────────────────────────────────────────

import { AuthErrorCode, type AuthErrorDTO, type MiddlewareAuthResult } from '@/lib/types/auth';

// === AuthErrorDTO ===

export const MOCK_AUTH_ERROR_CALLBACK_FAILED = {
  code: AuthErrorCode.OAUTH_CALLBACK_FAILED,
  message: '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
  httpStatus: 500,
  originalError: 'Supabase exchangeCodeForSession failed: invalid_grant',
} satisfies AuthErrorDTO;

export const MOCK_AUTH_ERROR_SESSION_EXPIRED = {
  code: AuthErrorCode.SESSION_EXPIRED,
  message: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  httpStatus: 401,
} satisfies AuthErrorDTO;

export const MOCK_AUTH_ERROR_PROVIDER_DOWN = {
  code: AuthErrorCode.OAUTH_PROVIDER_ERROR,
  message: '소셜 로그인 서비스에 일시적 장애가 있습니다.',
  httpStatus: 502,
  originalError: 'Kakao OAuth: Connection refused',
} satisfies AuthErrorDTO;

// === MiddlewareAuthResult ===

export const MOCK_MIDDLEWARE_RESULT_VALID = {
  authenticated: true,
  user: {
    id: 'mock-user-kakao-001',
    email: 'jiyoung.kim@example.com',
    provider: 'kakao',
  },
} satisfies MiddlewareAuthResult;

export const MOCK_MIDDLEWARE_RESULT_EXPIRED = {
  authenticated: false,
  user: null,
  error: AuthErrorCode.SESSION_EXPIRED,
} satisfies MiddlewareAuthResult;
