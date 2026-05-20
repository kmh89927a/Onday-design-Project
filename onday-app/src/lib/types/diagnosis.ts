// schema.prisma 의 status 는 SQLite enum 미지원으로 String 타입 (// processing | completed | expired 주석으로 가능값 명시).
// 본 파일은 TS union 으로 좁혀 타입 안전성 제공. 실 Prisma enum 강제는 INFRA-002 시점 (Postgres swap).
// 본 파일은 DIAGNOSIS 도메인 단일 진입점 — 후속 API-002 가 DiagnosisDTO / CandidateAreaDTO / CommuteInfoDTO 등 DTO 를 본 파일에 append 예정.
// mode 는 user.ts 의 ServiceModeType 재사용 — diagnosis.ts 에서 재정의 금지. API-002 가 DTO 정의 시 `import { ServiceModeType } from './user'` 패턴 사용.

export type DiagnosisStatusType = 'processing' | 'completed' | 'expired';

// ──────────────────────────────────────────────
// API-002 append (Q2 (b) types.ts 9칸 가드 보존 — DiagnosisMode 11/DiagnosisStatus 1 호출처 미수정,
//   Q3 (D) re-export 패턴 — 신규 type alias 정의 금지, Q5 §3.2 ErrorCode 8 종)
// ──────────────────────────────────────────────

import type { ServiceModeType } from './user';
import type {
  CandidateArea,
  CommuteInfo,
  DiagnosisFilters,
  DiagnosisInput,
} from '../types';

// ──────────────────────────────────────────────
// 1. (P1) re-export — 신규 type alias 정의 금지, 현실 entity 재사용
//    API-001 OAuthProvider=AuthProviderType 패턴 답습 (3 중복 회피)
// ──────────────────────────────────────────────

/** 후보 동네 — Step 10.5 풍부 필드 (lines/listingsCount/avgArea) 까지 노출 */
export type CandidateAreaDTO = CandidateArea;

/** 통근 정보 — 시간·수단·환승 */
export type CommuteInfoDTO = CommuteInfo;

/** 진단 생성 요청 — Figma 비전 leisure 4 필드 superset 노출 */
export type CreateDiagnosisRequest = DiagnosisInput;

// ──────────────────────────────────────────────
// 2. Diagnosis DTO 본체
// ──────────────────────────────────────────────

/**
 * 진단 결과 DTO.
 * mode: Q2 (b) — types.ts DiagnosisMode 가 아니라 user.ts ServiceModeType 사용 (11 호출처 일괄 치환은 cleanup ISSUE 위임).
 * status: DB-003 commit `2ea3a17` 산출물 DiagnosisStatusType 첫 활성 사용처.
 */
export interface DiagnosisDTO {
  id: string;
  userId: string;
  addressA: string;
  addressB?: string;
  filters: DiagnosisFilters;
  mode: ServiceModeType;
  deadlineMode: boolean;
  deadline?: string;
  status: DiagnosisStatusType;
  createdAt: string;
}

// ──────────────────────────────────────────────
// 3. Request / Response DTO (부재 신규)
// ──────────────────────────────────────────────

/** POST /api/diagnosis 응답 */
export interface CreateDiagnosisResponse {
  diagnosisId: string;
  candidates: CandidateAreaDTO[];
  timeline: TimelineDTO | null;
  status: DiagnosisStatusType;
}

/** GET /api/diagnosis/[id] 응답 */
export interface GetDiagnosisResponse {
  diagnosis: DiagnosisDTO;
  candidates: CandidateAreaDTO[];
}

// ──────────────────────────────────────────────
// 4. Timeline DTO (Deadline mode — 부재 신규)
// ──────────────────────────────────────────────

export interface TimelineDTO {
  steps: TimelineStepDTO[];
  deadlineDate: string;
}

export interface TimelineStepDTO {
  order: number;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
}

// ──────────────────────────────────────────────
// 5. Diagnosis Error DTO (§3.2 — 8 종, API-001 AuthErrorCode 패턴 답습)
// ──────────────────────────────────────────────

/** 진단 도메인 에러 코드 (8 종) */
export enum DiagnosisErrorCode {
  // 입력 검증
  ADDRESS_MISSING = 'DIAG_ADDRESS_MISSING',
  ADDRESS_OUT_OF_COVERAGE = 'DIAG_ADDRESS_OUT_OF_COVERAGE',
  DEADLINE_DATE_PAST = 'DIAG_DEADLINE_DATE_PAST',

  // 결과 처리
  NO_CANDIDATES_FOUND = 'DIAG_NO_CANDIDATES_FOUND',

  // 외부 API
  TRANSPORT_API_TIMEOUT = 'DIAG_TRANSPORT_API_TIMEOUT',
  TRANSPORT_API_RETRY_FAILED = 'DIAG_TRANSPORT_API_RETRY_FAILED',

  // 조회·권한
  DIAGNOSIS_NOT_FOUND = 'DIAG_NOT_FOUND',
  DIAGNOSIS_FORBIDDEN = 'DIAG_FORBIDDEN',
}

/** 진단 도메인 에러 응답 DTO */
export interface DiagnosisErrorDTO {
  code: DiagnosisErrorCode;
  message: string;
  httpStatus: number;
  originalError?: string;
}
