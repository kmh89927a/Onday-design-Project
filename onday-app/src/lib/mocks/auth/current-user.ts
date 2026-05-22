// ──────────────────────────────────────────────
// MOCK-005 CurrentUser 통합 fixture — ★★★ 본 ISSUE 핵심 입증 위치.
//
// ★★★ 3종 동시 박힘 (★ 본 ISSUE 진짜 메타 핵심):
//   1. Mismatch ④ Date 자동 보정 — 명세 v1.0 string → UserDTO.createdAt: Date 정합
//   2. 결정론 가드 § 진화 새 차원 (★ NEW 본 ISSUE 신규 owner — 가이드 § 9 → 10 확장):
//      정립 단계 (MOCK-001/002/004): Math.random / Date.now / new Date 호출 0 건
//      진화 단계 (★ 본 ISSUE): 비결정 호출 0 건 = Math.random() + Date.now() + new Date() (인자 없음) 0 건.
//                              고정 인자 new Date('ISO 8601 리터럴') 허용 (결정론 유지).
//   3. adaptive § Foundation + mock 차원 첫 적용 — adaptive 모든 도메인 차원 작동 입증
//      (mock 차원 → 외부 도메인+mock → Foundation+mock 진화 정점)
//
// ★ DB-007 UserDTO satisfies = Wave 2 체인 10 회째 입증 추가 위치.
// ──────────────────────────────────────────────

import type { CurrentUser } from '@/lib/types/auth';
import type { UserDTO } from '@/lib/types/user';
import { MOCK_AUTH_SESSION_KAKAO } from './sessions';

export const MOCK_USER_DTO_KAKAO = {
  id: 'mock-user-kakao-001',
  email: 'jiyoung.kim@example.com',
  authProvider: 'kakao',
  mode: 'couple',
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
  updatedAt: new Date('2026-04-25T09:00:00.000Z'),
} satisfies UserDTO;

export const MOCK_CURRENT_USER_KAKAO = {
  type: 'authenticated',
  session: MOCK_AUTH_SESSION_KAKAO,
  user: MOCK_USER_DTO_KAKAO,
} satisfies CurrentUser;
