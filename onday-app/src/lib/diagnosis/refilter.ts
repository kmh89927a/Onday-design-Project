// 시세 5-1 — 거래유형/예산 토글 재필터 공용 로직.
//   real 진단의 prefilter 12개 풀(통근 캐시)에 거래유형/예산을 다시 적용해 추천 세트를 갱신한다.
//   ★ 통근은 캐시값 그대로(재계산 X, API 재호출 X). 점수는 가격 무관(scoring) → 통근 캐시면 불변.
//   ★ priceRange/wolseEstimate 는 새 거래유형 기준으로 price-index 에서 재계산.

import type { CandidateArea, DiagnosisFilters } from "@/lib/types";
import { comparableMedian, wolseMedian, priceRangeFor } from "./price-index";

const RESULT_TOP_N = 8;

// 통근 상한 + 예산(거래유형별) 필터 — mock-calculator / run-real 와 동일 의미론(price-index 기준).
export function passesFilters(c: CandidateArea, filters: DiagnosisFilters): boolean {
  if (filters.maxCommuteTime) {
    const maxCommute = Math.max(c.commuteA.time, c.commuteB?.time ?? 0);
    if (maxCommute > filters.maxCommuteTime) return false;
  }
  if (filters.budget) {
    const dealType = filters.dealType ?? "jeonse";
    if (dealType === "wolse") {
      const w = wolseMedian(c.id);
      if (!w) return false; // median 결측 → 제외(임의 통과 금지)
      if (w.deposit > (filters.budget.depositMax ?? Infinity)) return false;
      if (w.monthly < filters.budget.min || w.monthly > filters.budget.max) {
        return false;
      }
    } else {
      const price = comparableMedian(c.id, dealType);
      if (price == null) return false;
      if (price < filters.budget.min || price > filters.budget.max) return false;
    }
  }
  return true;
}

/**
 * 캐시 풀(통근 보존) → 거래유형/예산 재필터 + 거래유형별 시세 재계산 + 점수순 top N.
 * ★ 후보 우주 = prefilter 12개(거리 기준, 가격 무관) → 토글로 등장 가능한 모든 동네 포함.
 */
export function refilterPool(
  pool: CandidateArea[],
  filters: DiagnosisFilters,
): CandidateArea[] {
  const dealType = filters.dealType ?? "jeonse";
  return pool
    .map((c) => ({
      ...c,
      priceRange: priceRangeFor(c.id, dealType),
      wolseEstimate:
        dealType === "wolse" ? (wolseMedian(c.id) ?? undefined) : undefined,
    }))
    .filter((c) => passesFilters(c, filters))
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_TOP_N);
}
