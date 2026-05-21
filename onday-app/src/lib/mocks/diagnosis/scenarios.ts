// ──────────────────────────────────────────────
// MOCK-001 Diagnosis 도메인 — 시나리오 5 종 (정상 / 싱글 / 데드라인 / 빈 / 에러).
//
// candidates.ts 의 fixture 재사용 — CandidateAreaDTO 4 종 + 배열 const.
// CreateDiagnosisResponse / DiagnosisErrorDTO satisfies 검증.
//
// ★ 결정론적 가드 (AC-5): Math.random / Date.now / new Date 0건. 모든 id 고정값.
// ──────────────────────────────────────────────

import type { CreateDiagnosisResponse, DiagnosisErrorDTO } from '@/lib/types/diagnosis';
import { DiagnosisErrorCode } from '@/lib/types/diagnosis';
import {
  MOCK_CANDIDATE_YEOKSAM,
  MOCK_CANDIDATE_ANGUK,
  MOCK_CANDIDATE_ITAEWON,
  MOCK_CANDIDATES_NORMAL,
} from './candidates';

// ──────────────────────────────────────────────
// 1. 커플 모드 정상 결과 — REQ-FUNC-003 3 곳 이상 충족
// ──────────────────────────────────────────────

export const MOCK_CREATE_DIAGNOSIS_NORMAL = {
  diagnosisId: 'mock-diag-001',
  candidates: [...MOCK_CANDIDATES_NORMAL],
  timeline: null,
  status: 'completed',
} satisfies CreateDiagnosisResponse;

// ──────────────────────────────────────────────
// 2. 싱글 모드 — addressB 부재, commuteB optional (단일 직장 + 여가거점)
// ──────────────────────────────────────────────

export const MOCK_CREATE_DIAGNOSIS_SINGLE = {
  diagnosisId: 'mock-diag-002',
  candidates: [MOCK_CANDIDATE_YEOKSAM, MOCK_CANDIDATE_ANGUK, MOCK_CANDIDATE_ITAEWON],
  timeline: null,
  status: 'completed',
} satisfies CreateDiagnosisResponse;

// ──────────────────────────────────────────────
// 3. 데드라인 모드 — 5 단계 이상 타임라인 (REQ-FUNC-015)
// ──────────────────────────────────────────────

export const MOCK_CREATE_DIAGNOSIS_DEADLINE = {
  diagnosisId: 'mock-diag-003',
  candidates: [...MOCK_CANDIDATES_NORMAL],
  timeline: {
    steps: [
      { order: 1, title: '매물 탐색 완료', description: '교집합 후보 동네 급매 매물 확인', dueDate: '2026-06-01', completed: false },
      { order: 2, title: '집 방문·임장', description: '상위 3 곳 방문 일정 확보', dueDate: '2026-06-08', completed: false },
      { order: 3, title: '계약 협상', description: '중개사 연락 및 가격 협상', dueDate: '2026-06-15', completed: false },
      { order: 4, title: '계약서 작성', description: '전·월세 계약서 서명', dueDate: '2026-06-22', completed: false },
      { order: 5, title: '잔금·입주', description: '잔금 납부 및 이사 완료', dueDate: '2026-06-30', completed: false },
    ],
    deadlineDate: '2026-06-30',
  },
  status: 'completed',
} satisfies CreateDiagnosisResponse;

// ──────────────────────────────────────────────
// 4. 빈 결과 — REQ-FUNC-008 "조건을 만족하는 동네가 없습니다" 안내 base
//    status='completed' (정상 처리, candidates 0 = 비정상 아님)
// ──────────────────────────────────────────────

export const MOCK_CREATE_DIAGNOSIS_EMPTY = {
  diagnosisId: 'mock-diag-004',
  candidates: [],
  timeline: null,
  status: 'completed',
} satisfies CreateDiagnosisResponse;

// ──────────────────────────────────────────────
// 5. 에러 — 교통 API 타임아웃 (REQ-FUNC-006 + REQ-NF-035 Sentry 연계)
//    ★ CreateDiagnosisResponse 가 아닌 DiagnosisErrorDTO satisfies (API-002 산출물)
// ──────────────────────────────────────────────

export const MOCK_DIAGNOSIS_ERROR_TIMEOUT = {
  code: DiagnosisErrorCode.TRANSPORT_API_TIMEOUT,
  message: '교통 API 응답 지연이 발생했어요. 잠시 후 다시 시도해 주세요.',
  httpStatus: 504,
} satisfies DiagnosisErrorDTO;

/** 수도권 외 주소 — REQ-FUNC-008 보조 시나리오 */
export const MOCK_DIAGNOSIS_ERROR_OUT_OF_COVERAGE = {
  code: DiagnosisErrorCode.ADDRESS_OUT_OF_COVERAGE,
  message: '해당 지역은 현재 수도권만 지원돼요.',
  httpStatus: 400,
} satisfies DiagnosisErrorDTO;
