// ──────────────────────────────────────────────
// MOCK-002 ShareLink 도메인 — 4 에러 시나리오.
//
// ★ MOCK-001 Mismatch ④ 보정 패턴 답습 — `as const` 가 아닌 `satisfies ShareLinkErrorDTO` 사용 (API-003 산출물 정확 활용).
//   에러 모델 분리 패턴: ShareLinkErrorCode (enum) + ShareLinkErrorDTO (DTO) 활용.
//
// 한국어 message — ShareLink 도메인 톤 (배우자 안내 + 보안 안내).
// ──────────────────────────────────────────────

import { ShareLinkErrorCode, type ShareLinkErrorDTO } from '@/lib/types/share-link';

/** 만료 링크 접근 — REQ-FUNC-010 "이 링크는 만료되었습니다" 1초 안내 */
export const MOCK_SHARE_ERROR_EXPIRED = {
  code: ShareLinkErrorCode.LINK_EXPIRED,
  message: '이 링크는 만료되었어요. 진단을 공유한 분께 새 링크를 요청해 주세요.',
  httpStatus: 410,
} satisfies ShareLinkErrorDTO;

/** 비밀번호 불일치 — REQ-NF-020 bcrypt 검증 실패 (CMD-SHARE-004) */
export const MOCK_SHARE_ERROR_PASSWORD_MISMATCH = {
  code: ShareLinkErrorCode.PASSWORD_MISMATCH,
  message: '비밀번호가 일치하지 않아요. 다시 확인해 주세요.',
  httpStatus: 401,
} satisfies ShareLinkErrorDTO;

/** 공유 링크 미존재 — 잘못된 URL 또는 삭제된 링크 */
export const MOCK_SHARE_ERROR_NOT_FOUND = {
  code: ShareLinkErrorCode.LINK_NOT_FOUND,
  message: '공유 링크를 찾을 수 없어요. 링크가 올바른지 확인해 주세요.',
  httpStatus: 404,
} satisfies ShareLinkErrorDTO;

/** 비인가 접근 — REQ-NF-021 개인정보 노출 0건 (TEST-004 보안 케이스) */
export const MOCK_SHARE_ERROR_UNAUTHORIZED = {
  code: ShareLinkErrorCode.UNAUTHORIZED_ACCESS,
  message: '이 리포트를 열람할 권한이 없어요.',
  httpStatus: 403,
} satisfies ShareLinkErrorDTO;
