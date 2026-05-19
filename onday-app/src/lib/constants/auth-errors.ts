import { AuthErrorCode, type AuthErrorDTO } from '@/lib/types/auth';

/** AuthErrorCode → 사용자 메시지·HTTP 상태 매핑 (9 키 — code/originalError 는 createAuthError 가 채움) */
export const AUTH_ERROR_MAP: Record<AuthErrorCode, Omit<AuthErrorDTO, 'code' | 'originalError'>> = {
  [AuthErrorCode.OAUTH_CALLBACK_FAILED]: {
    message: '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
    httpStatus: 500,
  },
  [AuthErrorCode.OAUTH_PROVIDER_ERROR]: {
    message: '소셜 로그인 서비스에 일시적 장애가 있습니다.',
    httpStatus: 502,
  },
  [AuthErrorCode.OAUTH_CODE_MISSING]: {
    message: '인증 코드가 누락되었습니다. 다시 로그인해 주세요.',
    httpStatus: 400,
  },
  [AuthErrorCode.SESSION_EXPIRED]: {
    message: '세션이 만료되었습니다. 다시 로그인해 주세요.',
    httpStatus: 401,
  },
  [AuthErrorCode.SESSION_INVALID]: {
    message: '유효하지 않은 세션입니다. 다시 로그인해 주세요.',
    httpStatus: 401,
  },
  [AuthErrorCode.SESSION_REFRESH_FAILED]: {
    message: '세션 갱신에 실패했습니다. 다시 로그인해 주세요.',
    httpStatus: 401,
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    message: '사용자 정보를 찾을 수 없습니다.',
    httpStatus: 404,
  },
  [AuthErrorCode.USER_SYNC_FAILED]: {
    message: '사용자 정보 동기화에 실패했습니다.',
    httpStatus: 500,
  },
  [AuthErrorCode.GUEST_MODE_ACTIVATED]: {
    message: '게스트 모드로 전환되었습니다. 일부 기능이 제한됩니다.',
    httpStatus: 200,
  },
};
