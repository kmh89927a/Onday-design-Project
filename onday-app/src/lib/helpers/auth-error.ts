import { AuthErrorCode, type AuthErrorDTO } from '@/lib/types/auth';
import { AUTH_ERROR_MAP } from '@/lib/constants/auth-errors';

/**
 * AuthErrorDTO 생성 헬퍼.
 * AUTH_ERROR_MAP 에서 사용자 메시지·HTTP 상태를 lookup 한 뒤 originalError 를 합쳐 반환.
 * Sentry catch 와 연계 가능 (REQ-NF-035) — originalError 필드로 원본 에러 메시지 전달.
 */
export function createAuthError(
  code: AuthErrorCode,
  originalError?: string,
): AuthErrorDTO {
  const mapped = AUTH_ERROR_MAP[code];
  return {
    code,
    message: mapped.message,
    httpStatus: mapped.httpStatus,
    originalError,
  };
}
