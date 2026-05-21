// ──────────────────────────────────────────────
// API-006 APP_ERROR_MAP — 5 도메인 통합 (★ Q4 adaptLegacyMap 어댑터 + ★★ Wave 2 체인 8회째 입증 위치).
//
// ★★ adaptLegacyMap 어댑터 패턴 (★ 본 ISSUE 신규 메타 가치):
//   - 4 도메인 errors.ts 무수정 (★ Q2/Q8 가드 사수)
//   - Omit pattern 결과 `{message, httpStatus}` → CommonErrorMapEntry (sentryLevel? 자동 추론) 하위 호환
//   - Mismatch ① sentryLevel 누락 + ② Omit pattern 호환 + ③ DIAG_ERROR_MAP 변수명 정정 (3 건 자동 보정)
//
// ★ sentryLevel 자동 추론 규칙:
//   - httpStatus >= 500 → 'error' (REQ-NF-012 5xx 모니터링)
//   - httpStatus >= 400 → 'warning' (4xx 클라이언트 오류)
//   - 그 외 → 'info' (2xx best effort 등)
// ──────────────────────────────────────────────

import { AUTH_ERROR_MAP } from './auth-errors';
import { DIAG_ERROR_MAP } from './diagnosis-errors';
import { SHARE_LINK_ERROR_MAP } from './share-link-errors';
import { SAVED_SEARCH_ERROR_MAP } from './saved-search-errors';
import { COMMON_ERROR_MAP } from './common-errors';
import type { AppErrorCode, AppErrorMapEntry } from '@/lib/types/errors';

/**
 * 기존 4 도메인 errors.ts (`Record<T, {message, httpStatus}>`) → AppErrorMapEntry 변환 어댑터.
 * ★ 4 도메인 errors.ts 무수정 가드 보존 + sentryLevel 자동 추론 (httpStatus 기반).
 */
function adaptLegacyMap<T extends string>(
  legacyMap: Record<T, { message: string; httpStatus: number }>,
): Record<T, AppErrorMapEntry> {
  const adapted = {} as Record<T, AppErrorMapEntry>;
  for (const code in legacyMap) {
    const { message, httpStatus } = legacyMap[code];
    adapted[code] = {
      message,
      httpStatus,
      sentryLevel:
        httpStatus >= 500 ? 'error'
        : httpStatus >= 400 ? 'warning'
        : 'info',
    };
  }
  return adapted;
}

/**
 * 5 도메인 통합 에러 매핑 (★ Wave 2 체인 8회째 입증 — 5 회 누적 산출물 첫 통합).
 * Payment 절대 미포함 (Rev 1.6 정합).
 */
export const APP_ERROR_MAP = {
  ...adaptLegacyMap(AUTH_ERROR_MAP),
  ...adaptLegacyMap(DIAG_ERROR_MAP),
  ...adaptLegacyMap(SHARE_LINK_ERROR_MAP),
  ...adaptLegacyMap(SAVED_SEARCH_ERROR_MAP),
  ...COMMON_ERROR_MAP,
} satisfies Record<AppErrorCode, AppErrorMapEntry>;
