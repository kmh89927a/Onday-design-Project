// ──────────────────────────────────────────────
// API-005 SavedSearch 도메인 — API Request/Response/Error DTO 영역.
//
// ★ Q3 (가) 2 파일 분리 strategy — DB-006 영역 base (saved-search.ts) + API 영역 (본 파일).
//   SearchParams / SavedSearchDTO 재정의 절대 금지 — saved-search.ts 에서 import 만.
//   DB-003 Q6 패턴 답습 (diagnosis.ts base + diagnosis-errors.ts API 분리 평행).
//
// ★ userId 클라이언트 전달 금지 (REQ-NF-021) — Supabase Auth 세션 서버 사이드 추출.
//   SaveSearchRequest 에 userId 필드 절대 금지 (CMD-SAVE-001 영역 추출 패턴).
//
// ★ Prisma model import 0 (관심사 분리, API-001/002/003 일관).
//   Zod schema/추출 본 ISSUE 미수정 (Q7 = CMD-SAVE-001 위임 + DB-006 §9.1 strict/passthrough).
// ──────────────────────────────────────────────

import type { SearchParams, SavedSearchDTO } from './saved-search';

// ──────────────────────────────────────────────
// 1. Request DTO
// ──────────────────────────────────────────────

/**
 * POST /api/save — 입력값 자동 저장 요청.
 * userId 는 Supabase Auth 세션 서버 사이드 추출 (클라이언트 전달 금지, REQ-NF-021).
 */
export interface SaveSearchRequest {
  searchParams: SearchParams;
}

// ──────────────────────────────────────────────
// 2. Response DTO
// ──────────────────────────────────────────────

/** POST /api/save 응답 — savedAt + best effort error 5종 */
export interface SaveSearchResponse {
  success: boolean;
  savedAt: string;
  error?: SavedSearchErrorCode;
}

/**
 * GET /api/save 응답 — 1:0..1 (found false 정상 케이스).
 * geocodingStatus: 재방문 시 주소 → 좌표 재검증 (QRY-SAVE-001 영역, 본 ISSUE = contract only).
 */
export interface GetSavedSearchResponse {
  found: boolean;
  savedSearch: SavedSearchDTO | null;
  geocodingStatus?: GeocodingValidationStatus;
}

// ──────────────────────────────────────────────
// 3. Geocoding 재검증 (QRY-SAVE-001 영역 contract)
// ──────────────────────────────────────────────

export interface GeocodingValidationStatus {
  addressAValid: boolean;
  addressBValid: boolean;
  message?: string;
}

// ──────────────────────────────────────────────
// 4. Error Code (5 종 — 도메인 단순성 반영, API-001 9 / API-002 8 / API-003 7 보다 적음)
// ──────────────────────────────────────────────

/** SavedSearch 도메인 에러 코드 (5 종) — 저장 1 / 조회 1 / 검증 1 / Geocoding 1 / 세션 1 */
export enum SavedSearchErrorCode {
  // 저장
  SAVE_FAILED = 'SAVED_SEARCH_SAVE_FAILED',

  // 조회
  NOT_FOUND = 'SAVED_SEARCH_NOT_FOUND',

  // 입력 검증
  INVALID_PARAMS = 'SAVED_SEARCH_INVALID_PARAMS',

  // Geocoding (best effort)
  GEOCODING_FAILED = 'SAVED_SEARCH_GEOCODING_FAILED',

  // 세션
  SESSION_REQUIRED = 'SAVED_SEARCH_SESSION_REQUIRED',
}

/** SavedSearch 도메인 에러 응답 DTO */
export interface SavedSearchErrorDTO {
  code: SavedSearchErrorCode;
  message: string;
  httpStatus: number;
  originalError?: string;
}
