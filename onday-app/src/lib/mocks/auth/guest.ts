// ──────────────────────────────────────────────
// MOCK-005 게스트 모드 fixture — GuestSession + CurrentUser 2 분기 (★ OAuth 장애 시 임시 체험).
//
// ★ GuestSession 정확 시그니처 (API-001 정합):
//   isGuest: true (literal) — mode/expiresAt 필드 없음.
//   limitations: ('no_save' | 'no_share' | 'no_history')[] 3 종.
//
// ★ 결정론 가드 § 정립 단계 답습 (createdAt = ISO 8601 string, Date 객체 아님).
// ──────────────────────────────────────────────

import type { GuestSession, GuestLimitation, CurrentUser } from '@/lib/types/auth';

export const MOCK_GUEST_SESSION = {
  isGuest: true,
  guestId: 'mock-guest-001',
  createdAt: '2026-04-25T10:00:00.000Z',
  limitations: ['no_save', 'no_share', 'no_history'] satisfies GuestLimitation[],
} satisfies GuestSession;

export const MOCK_CURRENT_USER_GUEST = {
  type: 'guest',
  session: MOCK_GUEST_SESSION,
} satisfies CurrentUser;

export const MOCK_CURRENT_USER_UNAUTHENTICATED = {
  type: 'unauthenticated',
} satisfies CurrentUser;
