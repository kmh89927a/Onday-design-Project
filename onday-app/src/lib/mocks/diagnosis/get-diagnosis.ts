// ──────────────────────────────────────────────
// MOCK-001 Diagnosis 도메인 — GET /api/diagnosis/[id] 응답 (POST 와 다른 contract).
//
// ★ ServiceModeType 재사용 5 회째 — DiagnosisDTO.mode = ServiceModeType (API-002 산출물 자동 타입 체크).
//   user.ts 정의 + diagnosis.ts (API-002) + share-link.ts (API-003) + saved-search.ts (API-005) + ★ 본 ISSUE = 5 회 일관.
//
// ★ 결정론적 가드 (AC-5): Math.random / Date.now / new Date 0건. createdAt 고정 ISO 8601.
// ──────────────────────────────────────────────

import type { DiagnosisDTO, GetDiagnosisResponse } from '@/lib/types/diagnosis';
import { MOCK_CANDIDATES_NORMAL } from './candidates';

// ──────────────────────────────────────────────
// 1. DiagnosisDTO — Prisma row 의 TS DTO (mode = ServiceModeType 5 회째 활용)
// ──────────────────────────────────────────────

export const MOCK_DIAGNOSIS_ENTITY = {
  id: 'mock-diag-001',
  userId: 'mock-user-001',
  addressA: '서울 강남구 테헤란로 152',
  addressB: '서울 중구 세종대로 110',
  filters: {
    maxCommuteTime: 60,
    budget: { min: 8000, max: 15000 },
    commuteSchedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], departureTime: '08:00' },
    priorities: ['safety', 'commute'],
  },
  mode: 'couple',
  deadlineMode: false,
  status: 'completed',
  createdAt: '2026-05-21T10:00:00.000Z',
} satisfies DiagnosisDTO;

// ──────────────────────────────────────────────
// 2. GetDiagnosisResponse — diagnosis + candidates 평면 구조 (timeline 부재 — POST 와 다른 contract)
// ──────────────────────────────────────────────

export const MOCK_GET_DIAGNOSIS_RESPONSE = {
  diagnosis: MOCK_DIAGNOSIS_ENTITY,
  candidates: [...MOCK_CANDIDATES_NORMAL],
} satisfies GetDiagnosisResponse;
