// ──────────────────────────────────────────────
// API-006 createAppError + toErrorResponse — 통합 helper (★ Q8 공존 — 4 도메인 createXError 보존).
//
// ★ Q8 공존 strategy: 기존 4 createXError (createAuthError / createDiagnosisError / createShareLinkError / createSavedSearchError) 무수정 + createAppError 신규 추가.
//   adaptLegacyMap 어댑터 패턴 일관 = 가드 사수 8 회째.
// ──────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { APP_ERROR_MAP } from '@/lib/constants/app-error-map';
import type { AppErrorCode, AppErrorDTO } from '@/lib/types/errors';

/**
 * 5 도메인 통합 AppErrorDTO 생성 helper.
 * ★ 기존 4 createXError 보존 (Q8 공존). Sentry 연계 시 reportErrorToSentry(appError) 활용.
 */
export function createAppError(code: AppErrorCode, originalError?: unknown): AppErrorDTO {
  const entry = APP_ERROR_MAP[code];
  return {
    code,
    message: entry.message,
    httpStatus: entry.httpStatus,
    sentryLevel: entry.sentryLevel,
    originalError,
  };
}

/**
 * Next.js Route Handler 용 JSON Response 변환.
 * originalError 는 응답에 포함하지 않음 (개인정보 노출 방지, REQ-NF-021 정합).
 */
export function toErrorResponse(error: AppErrorDTO): NextResponse {
  return NextResponse.json(
    { code: error.code, message: error.message },
    { status: error.httpStatus },
  );
}
