// ──────────────────────────────────────────────
// MOCK-005 OAuth 소셜 로그인 세션 fixture — 카카오 + 네이버 + 만료 (★ Foundation 도메인 첫 mock).
//
// ★ API-001 AuthUserDTO / AuthSessionDTO satisfies = Wave 2 체인 10 회째 입증
//   (★ API → MOCK Foundation 차원 신규 — Wave 2 첫 Foundation 도메인 fixture 활용).
//
// ★ Mismatch ①②③ 자동 검증 (satisfies = adaptive § Foundation+mock 차원 첫 적용):
//   ① AuthUserDTO 5 필드 매치 (id/email/provider/avatarUrl?/lastSignInAt?)
//   ② provider 'kakao'/'naver' satisfies OAuthProvider (= AuthProviderType, DB-007 (P1) 추인)
//   ③ MIDDLEWARE_RESULT_VALID.user 5 필드 매치 (avatarUrl/lastSignInAt optional)
//
// ★ 결정론 가드 § 정립 단계 답습 (Math.random / Date.now / new Date 호출 0 건).
//   lastSignInAt = ISO 8601 string (AuthUserDTO 시그니처 정합 — Date 객체 아님).
// ──────────────────────────────────────────────

import type { AuthUserDTO, AuthSessionDTO, OAuthProvider } from '@/lib/types/auth';

// === AuthUserDTO ===

export const MOCK_AUTH_USER_KAKAO = {
  id: 'mock-user-kakao-001',
  email: 'jiyoung.kim@example.com',
  provider: 'kakao' satisfies OAuthProvider,
  avatarUrl: 'https://k.kakaocdn.net/mock/profile_kakao_001.jpg',
  lastSignInAt: '2026-04-25T09:00:00.000Z',
} satisfies AuthUserDTO;

export const MOCK_AUTH_USER_NAVER = {
  id: 'mock-user-naver-001',
  email: 'sangmin.park@example.com',
  provider: 'naver' satisfies OAuthProvider,
  avatarUrl: 'https://phinf.pstatic.net/mock/profile_naver_001.jpg',
  lastSignInAt: '2026-04-25T09:30:00.000Z',
} satisfies AuthUserDTO;

// === AuthSessionDTO ===

export const MOCK_AUTH_SESSION_KAKAO = {
  accessToken: 'mock-access-token-kakao-eyJhbGciOiJIUzI1NiJ9',
  refreshToken: 'mock-refresh-token-kakao-dGhpcyBpcyBhIG1vY2s',
  expiresAt: 1777305600,
  user: MOCK_AUTH_USER_KAKAO,
} satisfies AuthSessionDTO;

export const MOCK_AUTH_SESSION_NAVER = {
  accessToken: 'mock-access-token-naver-eyJhbGciOiJIUzI1NiJ9',
  refreshToken: 'mock-refresh-token-naver-bmF2ZXIgbW9jaw',
  expiresAt: 1777305600,
  user: MOCK_AUTH_USER_NAVER,
} satisfies AuthSessionDTO;

export const MOCK_AUTH_SESSION_EXPIRED = {
  accessToken: 'mock-access-token-expired',
  refreshToken: 'mock-refresh-token-expired',
  expiresAt: 1672531200,
  user: MOCK_AUTH_USER_KAKAO,
} satisfies AuthSessionDTO;
