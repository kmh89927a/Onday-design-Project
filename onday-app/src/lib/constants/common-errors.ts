// ──────────────────────────────────────────────
// API-006 Common 에러 매핑 — 5 키 (CommonErrorCode 전수).
//
// ★ sentryLevel 명시 (★ Mismatch ① 보정 base) — 4 도메인 기존 errors.ts 는 미포함 (adaptLegacyMap 어댑터로 자동 추론).
//
// HTTP 상태: 504(NETWORK_TIMEOUT) / 400(INVALID_INPUT) / 429(RATE_LIMITED) / 500(INTERNAL_SERVER_ERROR) / 503(MAINTENANCE_MODE).
// ──────────────────────────────────────────────

import { CommonErrorCode, type CommonErrorMapEntry } from '@/lib/types/errors/common';

export const COMMON_ERROR_MAP: Record<CommonErrorCode, CommonErrorMapEntry> = {
  [CommonErrorCode.NETWORK_TIMEOUT]: {
    message: '네트워크 연결 시간이 초과되었어요. 잠시 후 다시 시도해 주세요.',
    httpStatus: 504,
    sentryLevel: 'warning',
  },
  [CommonErrorCode.INVALID_INPUT]: {
    message: '입력값이 올바르지 않아요. 확인 후 다시 시도해 주세요.',
    httpStatus: 400,
    sentryLevel: 'info',
  },
  [CommonErrorCode.RATE_LIMITED]: {
    message: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
    httpStatus: 429,
    sentryLevel: 'warning',
  },
  [CommonErrorCode.INTERNAL_SERVER_ERROR]: {
    message: '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
    httpStatus: 500,
    sentryLevel: 'error',
  },
  [CommonErrorCode.MAINTENANCE_MODE]: {
    message: '서비스 점검 중이에요. 잠시 후 다시 방문해 주세요.',
    httpStatus: 503,
    sentryLevel: 'info',
  },
};
