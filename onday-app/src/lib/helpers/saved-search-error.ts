import { SavedSearchErrorCode, type SavedSearchErrorDTO } from '@/lib/types/saved-search-api';
import { SAVED_SEARCH_ERROR_MAP } from '@/lib/constants/saved-search-errors';

/**
 * SavedSearchErrorDTO 생성 헬퍼.
 * SAVED_SEARCH_ERROR_MAP 에서 사용자 메시지·HTTP 상태를 lookup 한 뒤 originalError 를 합쳐 반환.
 * Sentry catch 와 연계 가능 (REQ-NF-035) — originalError 필드로 원본 에러 메시지 전달.
 */
export function createSavedSearchError(
  code: SavedSearchErrorCode,
  originalError?: string,
): SavedSearchErrorDTO {
  const mapped = SAVED_SEARCH_ERROR_MAP[code];
  return {
    code,
    message: mapped.message,
    httpStatus: mapped.httpStatus,
    originalError,
  };
}
