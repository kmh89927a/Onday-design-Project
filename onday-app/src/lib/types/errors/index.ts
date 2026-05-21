// ──────────────────────────────────────────────
// API-006 통합 에러 타입 — 5 도메인 enum union + AppErrorDTO.
//
// ★★ Wave 2 체인 8회째 입증 위치 — 5 도메인 enum 첫 통합 (Auth + Diagnosis + ShareLink + SavedSearch + Common)
//   = 5 회 누적 산출물 (API-001/002/003/005 + 본 ISSUE Common 신규) 첫 통합 활용.
//   (DB-003 → API-002 → API-003 → API-005 → MOCK-001 → MOCK-002 → API-007 → ★ API-006 5 도메인 통합).
//
// ★ Q3 (가) 6 파일 분리 + "3-Layer 통합 차원" 신규 — 본 파일 = type union + DTO 책임 단일.
// ──────────────────────────────────────────────

import type { AuthErrorCode } from '@/lib/types/auth';
import type { DiagnosisErrorCode } from '@/lib/types/diagnosis';
import type { ShareLinkErrorCode } from '@/lib/types/share-link';
import type { SavedSearchErrorCode } from '@/lib/types/saved-search-api';
import { CommonErrorCode, type CommonErrorMapEntry } from './common';

export { CommonErrorCode };

/**
 * 5 도메인 통합 에러 코드 union (Payment 절대 미포함, Rev 1.6).
 * ★ Wave 2 체인 8회째 입증 — 5 회 누적 산출물 첫 통합 활용.
 */
export type AppErrorCode =
  | AuthErrorCode
  | DiagnosisErrorCode
  | ShareLinkErrorCode
  | SavedSearchErrorCode
  | CommonErrorCode;

/**
 * 통합 에러 매핑 엔트리 (★ CommonErrorMapEntry re-export — 신규 type alias 정의 금지 가드).
 * 4 도메인 기존 errors.ts (Omit pattern 결과 `{message, httpStatus}`) + sentryLevel? = 호환.
 */
export type AppErrorMapEntry = CommonErrorMapEntry;

/**
 * 통합 에러 응답 DTO (★ 5 도메인 공통).
 * originalError: unknown — Sentry.captureException 호환 (Error / any 모두 허용).
 */
export interface AppErrorDTO {
  code: AppErrorCode;
  message: string;
  httpStatus: number;
  sentryLevel?: 'error' | 'warning' | 'info';
  originalError?: unknown;
}
