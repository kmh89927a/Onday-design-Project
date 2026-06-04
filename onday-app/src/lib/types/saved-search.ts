// ──────────────────────────────────────────────
// DB-006 §7 위임 트리거 수신 — base type 정의 영역. API DTO 는 saved-search-api.ts (관심사 분리).
//
// ★ Q3 (가) 2 파일 분리 strategy — DB-006 영역 base (본 파일) + API-005 영역 (saved-search-api.ts).
//   DB-003 Q6 패턴 답습 (diagnosis.ts base + diagnosis-errors.ts API 영역 분리 평행).
//   본 파일에 Request/Response/Error 정의 절대 금지 — saved-search-api.ts 영역.
//
// ★ Q2 (A) — mode = user.ts ServiceModeType 재사용 (4 회째). DiagnosisMode (types.ts) 미사용 — 9칸 가드 보존.
//   Prisma model import 0 (관심사 분리, API-001/002/003 일관).
// ──────────────────────────────────────────────

import type { ServiceModeType } from './user';
import type { CommuteSchedule } from '@/lib/types';

// ──────────────────────────────────────────────
// 1. SearchParams — JSONB 직렬화 대상 (Figma 비전 leisure 4 필드 superset 포함)
// ──────────────────────────────────────────────

/**
 * SavedSearch.searchParams JSONB 의 TS 구조.
 * filters: DiagnosisFilters 와 동일 구조 (maxCommuteTime/budget 객체/commuteSchedule/priorities) — types.ts 가드 보존 위해 형태만 평행 정의.
 * mode: Q2 (A) ServiceModeType — DiagnosisMode 재사용 금지 (9칸 가드 ★ 11번째 사수).
 */
export interface SearchParams {
  addressA?: string;
  addressB?: string;
  coordinateA?: { lat: number; lng: number };
  coordinateB?: { lat: number; lng: number };
  filters?: {
    maxCommuteTime?: number;
    budget?: { dealType?: "jeonse" | "maemae"; min: number; max: number };
    commuteSchedule?: CommuteSchedule;
    priorities?: string[];
  };
  mode: ServiceModeType;
  deadlineDate?: string;

  // Figma 비전 leisure 4 필드 (single 모드 여가거점 superset)
  leisureA?: string;
  leisureCoordA?: { lat: number; lng: number };
  leisureB?: string;
  leisureCoordB?: { lat: number; lng: number };
}

// ──────────────────────────────────────────────
// 2. SavedSearchDTO — Prisma SavedSearch row 의 TS DTO
// ──────────────────────────────────────────────

/**
 * SavedSearch Prisma row 의 TS DTO (DB-006 영역, REQ-FUNC-025 1:0..1).
 * searchParams: JSONB 역직렬화 결과 (INFRA-002 Postgres 전환 시 Json @db.JsonB, 현 SQLite String mapper 영역 = QRY-SAVE-001 single owner).
 */
export interface SavedSearchDTO {
  userId: string;
  searchParams: SearchParams;
  savedAt: Date;
}
