import { ShareLinkErrorCode, type ShareLinkErrorDTO } from '@/lib/types/share-link';

/** ShareLinkErrorCode → 사용자 메시지·HTTP 상태 매핑 (7 키 — code/originalError 는 createShareLinkError 가 채움) */
export const SHARE_LINK_ERROR_MAP: Record<ShareLinkErrorCode, Omit<ShareLinkErrorDTO, 'code' | 'originalError'>> = {
  [ShareLinkErrorCode.LINK_EXPIRED]: {
    message: '이 링크는 만료되었습니다. 진단을 공유한 분께 새 링크를 요청해 주세요.',
    httpStatus: 410,
  },
  [ShareLinkErrorCode.LINK_NOT_FOUND]: {
    message: '공유 링크를 찾을 수 없어요. 링크가 올바른지 확인해 주세요.',
    httpStatus: 404,
  },
  [ShareLinkErrorCode.DIAGNOSIS_NOT_FOUND]: {
    message: '진단 결과를 찾을 수 없어요. 원본 진단이 삭제됐을 수 있어요.',
    httpStatus: 404,
  },
  [ShareLinkErrorCode.PASSWORD_REQUIRED]: {
    message: '이 공유 링크는 비밀번호로 보호돼 있어요. 비밀번호를 입력해 주세요.',
    httpStatus: 401,
  },
  [ShareLinkErrorCode.PASSWORD_MISMATCH]: {
    message: '비밀번호가 일치하지 않아요. 다시 확인해 주세요.',
    httpStatus: 401,
  },
  [ShareLinkErrorCode.PREVIEW_EXHAUSTED]: {
    message: '무료 미리보기 1곳을 모두 확인했어요. 전체 리포트는 진단을 공유한 분의 안내를 따라 주세요.',
    httpStatus: 403,
  },
  [ShareLinkErrorCode.UNAUTHORIZED_ACCESS]: {
    message: '이 리포트를 열람할 권한이 없어요.',
    httpStatus: 403,
  },
};
