import type { Session } from '@supabase/supabase-js';
import type { UserDTO, AuthProviderType } from './user';

// ──────────────────────────────────────────────
// 1. OAuth Provider 설정
// ──────────────────────────────────────────────

/**
 * Supabase 대시보드에 등록된 OAuth Provider.
 * (P1) DB-007 §3.8 UserDTO 추인 패턴 일관 — user.ts AuthProviderType 재사용.
 * 신규 type alias 정의 금지 (3 중복 회피: types.ts AuthProvider / user.ts AuthProviderType / 본 ISSUE — 본 ISSUE 는 신규 정의 안 함).
 */
export type OAuthProvider = AuthProviderType;

/** OAuth 로그인 요청 시 signInWithOAuth() 에 전달하는 옵션 */
export interface OAuthSignInOptions {
  provider: OAuthProvider;
  redirectTo: string;
  scopes?: string;
}

// ──────────────────────────────────────────────
// 2. Auth Session DTO
// ──────────────────────────────────────────────

/** 서버 사이드에서 사용하는 인증 세션 (Supabase Session 래핑) */
export interface AuthSessionDTO {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUserDTO;
}

/** Supabase User 에서 애플리케이션에 필요한 필드만 추출 */
export interface AuthUserDTO {
  id: string;
  email: string;
  provider: OAuthProvider;
  avatarUrl?: string;
  lastSignInAt?: string;
}

// ──────────────────────────────────────────────
// 3. Auth Callback DTO
// ──────────────────────────────────────────────

/** /auth/callback Route Handler 요청 파라미터 */
export interface AuthCallbackRequest {
  code: string;
  next?: string;
}

/** /auth/callback Route Handler 응답 결과 */
export interface AuthCallbackResult {
  success: boolean;
  session: AuthSessionDTO | null;
  redirectTo: string;
  error?: AuthErrorDTO;
}

// ──────────────────────────────────────────────
// 4. Auth Error DTO
// ──────────────────────────────────────────────

/** Auth 에러 코드 체계 (9 종) */
export enum AuthErrorCode {
  // OAuth 에러
  OAUTH_CALLBACK_FAILED = 'AUTH_OAUTH_CALLBACK_FAILED',
  OAUTH_PROVIDER_ERROR = 'AUTH_OAUTH_PROVIDER_ERROR',
  OAUTH_CODE_MISSING = 'AUTH_OAUTH_CODE_MISSING',

  // 세션 에러
  SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  SESSION_INVALID = 'AUTH_SESSION_INVALID',
  SESSION_REFRESH_FAILED = 'AUTH_SESSION_REFRESH_FAILED',

  // 사용자 에러
  USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  USER_SYNC_FAILED = 'AUTH_USER_SYNC_FAILED',

  // 게스트 모드
  GUEST_MODE_ACTIVATED = 'AUTH_GUEST_MODE_ACTIVATED',
}

/** Auth 에러 응답 DTO */
export interface AuthErrorDTO {
  code: AuthErrorCode;
  message: string;
  httpStatus: number;
  originalError?: string;
}

// ──────────────────────────────────────────────
// 5. Middleware 인증 검증 타입
// ──────────────────────────────────────────────

/** Middleware 에서 세션 검증 후 반환하는 결과 */
export interface MiddlewareAuthResult {
  authenticated: boolean;
  user: AuthUserDTO | null;
  error?: AuthErrorCode;
}

// ──────────────────────────────────────────────
// 6. 게스트 모드 타입
// ──────────────────────────────────────────────

/** OAuth 장애 시 게스트 임시 체험 모드 */
export interface GuestSession {
  isGuest: true;
  guestId: string;
  createdAt: string;
  limitations: GuestLimitation[];
}

export type GuestLimitation =
  | 'no_save'
  | 'no_share'
  | 'no_history';

// ──────────────────────────────────────────────
// 7. 유니온 타입 (인증/게스트 통합)
// ──────────────────────────────────────────────

export type CurrentUser =
  | { type: 'authenticated'; session: AuthSessionDTO; user: UserDTO }
  | { type: 'guest'; session: GuestSession }
  | { type: 'unauthenticated' };

// ──────────────────────────────────────────────
// §3.3 SessionMapper 타입 시그니처 (구현은 CMD-AUTH-001/003 위임 — 호출처 0건 dead file 회피)
// ──────────────────────────────────────────────

/** Supabase Session → AuthSessionDTO 변환 유틸리티 시그니처 */
export type SessionMapper = (session: Session) => AuthSessionDTO;
