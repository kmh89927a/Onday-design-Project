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

// 거래유형별 예산 완화 천장/스텝 — price-index 실거래 median 분포 기준(만원 베이스).
//   매매 median 최대 32.7억 → 35억 천장·1억 스텝. 전세 median 최대 12억 → 15억 천장·5천만 스텝.
//   (4-A 이전 전세 추정 스케일 고정값 15억/5천만이 매매(최대 32.7억)에 안 맞던 것 정합.)
const BUDGET_CEIL_MAN = { jeonse: 150_000, maemae: 350_000 } as const; // 15억 / 35억
const BUDGET_STEP_MAN = { jeonse: 5_000, maemae: 10_000 } as const; // 5천만 / 1억
//   월세는 budget.max = 월세 상한(만원). 월세금 median 최대 290만 → 500만 천장·50만 스텝.
const WOLSE_MONTHLY_CEIL_MAN = 500;
const WOLSE_MONTHLY_STEP_MAN = 50;

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

  // 2. budget 완화 — 거래유형별 스케일(매매 35억/1억 · 전세 15억/5천만 · 월세 월500만/50만).
  //    dealType 은 filters 최상위(#171 분리). apply 는 budget(금액)만 바꿔 filters.dealType 보존.
  if (filters.budget) {
    const dealType = filters.dealType ?? "jeonse";
    if (dealType === "wolse") {
      // budget.max = 월세 상한(만원). 억 라벨 부적합 → "월 X만원" 라벨.
      if (filters.budget.max < WOLSE_MONTHLY_CEIL_MAN) {
        const newMax = filters.budget.max + WOLSE_MONTHLY_STEP_MAN;
        suggestions.push({
          label: `월세 상한을 ${newMax}만원으로 늘려보세요`,
          apply: { budget: { ...filters.budget, max: newMax } },
        });
      }
    } else {
      const ceil = BUDGET_CEIL_MAN[dealType];
      const step = BUDGET_STEP_MAN[dealType];
      if (filters.budget.max < ceil) {
        const newMax = filters.budget.max + step;
        suggestions.push({
          label: `예산 최대를 ${(newMax / 10_000).toFixed(1)}억원으로 늘려보세요`,
          apply: { budget: { ...filters.budget, max: newMax } },
        });
      }
    }
  }

  return suggestions;
}
