import type { CommuteMode as ChipMode } from "@/components/data/commute-chip";
import type { CandidateArea, CommuteMode } from "@/lib/types";

export type SortKey = "score" | "commute" | "price";

const SORT_KEYS: ReadonlySet<SortKey> = new Set(["score", "commute", "price"]);

export function parseSortKey(value: string | null | undefined): SortKey {
  return value && SORT_KEYS.has(value as SortKey) ? (value as SortKey) : "score";
}

export function avgCommute(c: CandidateArea): number {
  return c.commuteB ? (c.commuteA.time + c.commuteB.time) / 2 : c.commuteA.time;
}

export function sortCandidates(
  list: CandidateArea[],
  sort: SortKey,
): CandidateArea[] {
  const arr = [...list];
  switch (sort) {
    case "score":
      return arr.sort((a, b) => b.score - a.score);
    case "commute":
      return arr.sort((a, b) => avgCommute(a) - avgCommute(b));
    case "price":
      return arr.sort(
        (a, b) =>
          (a.priceRange?.min ?? Number.POSITIVE_INFINITY) -
          (b.priceRange?.min ?? Number.POSITIVE_INFINITY),
      );
  }
}

// CandidateArea.commute*.mode (transit|driving) → CommuteChip mode (subway|bus|car|walk)
export function toChipMode(mode: CommuteMode): ChipMode {
  return mode === "driving" ? "car" : "subway";
}

// priceRange (단위 만원) → "평균 9.2억"
export function formatPrice(
  range: { min: number; max: number } | undefined,
): string {
  if (!range) return "시세 미공개";
  const avg = (range.min + range.max) / 2;
  return `평균 ${(avg / 10000).toFixed(1)}억`;
}

export function formatCommuteFilter(maxMinutes: number | undefined): string {
  return maxMinutes ? `≤ ${maxMinutes}분` : "제한 없음";
}

export function formatBudgetFilter(
  budget: { min: number; max: number } | undefined,
): string {
  if (!budget) return "전체";
  const min = (budget.min / 10000).toFixed(0);
  const max = (budget.max / 10000).toFixed(0);
  return `${min}-${max}억`;
}

export function markerLabel(dong: string): string {
  return dong.replace(/동$/, "").slice(0, 4);
}
