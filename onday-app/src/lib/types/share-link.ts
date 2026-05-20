// ──────────────────────────────────────────────
// API-003 ShareLink 도메인 DTO (★ 신규 첫 owner — DB-002/003 와 다름, DB-004 base type 0)
//
// ★ Q3 (C) hybrid strategy:
//   - mode: ServiceModeType 재사용 (Q2 (A) — DiagnosisMode 미사용, 9칸 가드 보존)
//   - candidates: CandidateAreaDTO[] (★ API-002 (P1) 산출물 첫 외부 활용 = Wave 2 체인 작동 증거)
//   - Prisma model import 0 (관심사 분리, API-001/002 일관)
//   - (P1) re-export 패턴 적용 불가 (DB-004 base 0) — 자기 도메인 type 신규 정의 정상
// ──────────────────────────────────────────────

import type { ServiceModeType } from './user';
import type { CandidateAreaDTO } from './diagnosis';

// ──────────────────────────────────────────────
// 1. Request DTO
// ──────────────────────────────────────────────

/** POST /api/share — 공유 링크 생성 요청 */
export interface CreateShareLinkRequest {
  diagnosisId: string;
  password?: string;
}

/** POST /api/share/[uuid]/verify — 비밀번호 검증 요청 */
export interface VerifyPasswordRequest {
  token: string;
  password: string;
}

// ──────────────────────────────────────────────
// 2. Response DTO
// ──────────────────────────────────────────────

/** POST /api/share 응답 — shareUrl + 30일 만료 + 비밀번호 설정 여부 */
export interface CreateShareLinkResponse {
  shareUrl: string;
  expiresAt: string;
  hasPassword: boolean;
}

/** GET /api/diagnosis/[id]/report 응답 — 리포트 + 데이터 출처 + 공유 링크 메타 */
export interface GetReportResponse {
  report: ReportDTO;
  sources: DataSourceDTO[];
  shareLink: ShareLinkMetaDTO;
}

/** POST /api/share/[uuid]/verify 응답 */
export interface VerifyPasswordResponse {
  verified: boolean;
  error?: ShareLinkErrorCode;
}

// ──────────────────────────────────────────────
// 3. Report DTO (mode=ServiceModeType — Q2 (A), candidates=CandidateAreaDTO[] — API-002 (P1) 첫 외부 활용)
// ──────────────────────────────────────────────

/**
 * 공유 리포트 본체.
 * mode: Q2 (A) — types.ts DiagnosisMode 가 아니라 user.ts ServiceModeType 사용 (Q2 가드 보존).
 * candidates: API-002 (P1) `CandidateAreaDTO = CandidateArea` re-export 첫 외부 활용 (Wave 2 API-001→API-002→API-003 체인 작동 증거).
 * previewCandidateId: §9.1 follow-up — 선정 로직 CMD-SHARE/QRY-SHARE 위임 (스코어 1위 자동 vs 사용자 선택).
 */
export interface ReportDTO {
  diagnosisId: string;
  candidates: CandidateAreaDTO[];
  mode: ServiceModeType;
  createdAt: string;
  freePreviewUsed: boolean;
  previewCandidateId: string | null;
}

// ──────────────────────────────────────────────
// 4. Data Source DTO (§9.6 follow-up — 목록은 UI-007 영역)
// ──────────────────────────────────────────────

export interface DataSourceDTO {
  name: string;
  type: 'public_data' | 'api' | 'static';
  lastUpdated: string;
}

// ──────────────────────────────────────────────
// 5. ShareLink Meta DTO
// ──────────────────────────────────────────────

/**
 * 공유 링크 메타 정보.
 * isExpired: runtime 계산 필드 — mapper QRY-SHARE-001 위임 + DB-004 §9.1 isShareLinkExpired = CMD-SHARE-001 영역. 본 ISSUE = DTO contract only.
 */
export interface ShareLinkMetaDTO {
  id: string;
  uniqueUrl: string;
  viewCount: number;
  expiresAt: string;
  isExpired: boolean;
  hasPassword: boolean;
  freePreviewUsed: boolean;
}

// ──────────────────────────────────────────────
// 6. Error Code (7 종, API-001 9종 / API-002 8종 패턴 답습)
// ──────────────────────────────────────────────

/** 공유 링크 도메인 에러 코드 (7 종) */
export enum ShareLinkErrorCode {
  // 만료 1
  LINK_EXPIRED = 'SHARE_LINK_EXPIRED',

  // 조회 2
  LINK_NOT_FOUND = 'SHARE_LINK_NOT_FOUND',
  DIAGNOSIS_NOT_FOUND = 'SHARE_DIAGNOSIS_NOT_FOUND',

  // 비밀번호 2
  PASSWORD_REQUIRED = 'SHARE_PASSWORD_REQUIRED',
  PASSWORD_MISMATCH = 'SHARE_PASSWORD_MISMATCH',

  // 권한 2
  PREVIEW_EXHAUSTED = 'SHARE_PREVIEW_EXHAUSTED',
  UNAUTHORIZED_ACCESS = 'SHARE_UNAUTHORIZED_ACCESS',
}

/** 공유 링크 도메인 에러 응답 DTO */
export interface ShareLinkErrorDTO {
  code: ShareLinkErrorCode;
  message: string;
  httpStatus: number;
  originalError?: string;
}
