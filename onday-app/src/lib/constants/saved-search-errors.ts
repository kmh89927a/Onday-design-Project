import { SavedSearchErrorCode, type SavedSearchErrorDTO } from '@/lib/types/saved-search-api';

/** SavedSearchErrorCode → 사용자 메시지·HTTP 상태 매핑 (5 키 — code/originalError 는 createSavedSearchError 가 채움) */
export const SAVED_SEARCH_ERROR_MAP: Record<SavedSearchErrorCode, Omit<SavedSearchErrorDTO, 'code' | 'originalError'>> = {
  [SavedSearchErrorCode.SAVE_FAILED]: {
    message: '입력 조건을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    httpStatus: 500,
  },
  [SavedSearchErrorCode.NOT_FOUND]: {
    message: '저장된 입력 조건이 없어요. 진단을 새로 시작해 주세요.',
    httpStatus: 404,
  },
  [SavedSearchErrorCode.INVALID_PARAMS]: {
    message: '저장할 입력값이 올바르지 않아요. 항목을 다시 확인해 주세요.',
    httpStatus: 400,
  },
  [SavedSearchErrorCode.GEOCODING_FAILED]: {
    message: '주소 좌표 재확인에 실패했어요. 다음 진단에서 주소를 다시 확인해 주세요.',
    httpStatus: 200,
  },
  [SavedSearchErrorCode.SESSION_REQUIRED]: {
    message: '로그인이 필요해요. 다시 로그인 후 이용해 주세요.',
    httpStatus: 401,
  },
};
