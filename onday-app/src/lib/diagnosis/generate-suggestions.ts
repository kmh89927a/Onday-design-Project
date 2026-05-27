// ──────────────────────────────────────────────
// #125 FEAT-DIAGNOSIS-ZERO-CANDIDATES — 조건 완화 제안 공통 헬퍼
//
// REQ-FUNC-008 (Story 3-1, AC-N3): 진단 0곳 시 완화 제안 ≥2개.
// ★ Phase A 사전 박힘 발견 정수 — intersection.ts:128-136 에 maxCommuteTime 만 박혀있었고, budget 누락 + 프론트 연결 X였음.
// ★ 본 헬퍼 = 공통 진입점 → intersection.ts (실 API) + result-content.tsx (mock + what-if) 양쪽에서 호출.
// ──────────────────────────────────────────────

import type { DiagnosisFilters } from "@/lib/types";
import type { RelaxationSuggestion } from "@/lib/types/diagnosis";

const COMMUTE_STEP_MINOR = 15;
const COMMUTE_STEP_MAJOR = 30;
const COMMUTE_MAX_BASIC = 60;
const COMMUTE_MAX_EXTENDED = 90;

// 5천만원 단위 (만원 베이스 — DiagnosisFilters.budget 은 만원 단위)
const BUDGET_STEP_MAN = 5_000;
const BUDGET_MAX_CEIL_MAN = 150_000; // 15억원

/**
 * 현재 filters 기반으로 완화 제안 배열 반환.
 * candidates.length === 0 시점에 호출 (호출처에서 분기).
 *
 * ★ 빈 배열 반환 가능 = filters 가 이미 최대치인 경우 → fallback UI (정적 안내) 표시
 */
export function generateRelaxationSuggestions(
  filters: DiagnosisFilters,
): RelaxationSuggestion[] {
  const suggestions: RelaxationSuggestion[] = [];

  // 1. maxCommuteTime 완화 (#125 Phase A 발견 — intersection.ts 동적 박힘 답습)
  if (filters.maxCommuteTime !== undefined && filters.maxCommuteTime < COMMUTE_MAX_BASIC) {
    const next = filters.maxCommuteTime + COMMUTE_STEP_MINOR;
    suggestions.push({
      label: `최대 통근 시간을 ${next}분으로 늘려보세요`,
      apply: { maxCommuteTime: next },
    });
  }
  if (filters.maxCommuteTime !== undefined && filters.maxCommuteTime < COMMUTE_MAX_EXTENDED) {
    const next = filters.maxCommuteTime + COMMUTE_STEP_MAJOR;
    suggestions.push({
      label: `최대 통근 시간을 ${next}분으로 늘려보세요`,
      apply: { maxCommuteTime: next },
    });
  }

  // 2. budget 완화 (★ Q3 결정 — 본 ISSUE Phase A 사전 박힘 발견 2번째 = 백엔드 자체 누락)
  if (filters.budget && filters.budget.max < BUDGET_MAX_CEIL_MAN) {
    const newMax = filters.budget.max + BUDGET_STEP_MAN;
    const newMaxOk = newMax / 10_000; // 만원 → 억원 변환 (10,000만원 = 1억원)
    suggestions.push({
      label: `예산 최대를 ${newMaxOk.toFixed(1)}억원으로 늘려보세요`,
      apply: { budget: { min: filters.budget.min, max: newMax } },
    });
  }

  return suggestions;
}
