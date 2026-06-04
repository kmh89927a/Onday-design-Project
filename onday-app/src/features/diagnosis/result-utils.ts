import type { CommuteMode as ChipMode } from "@/components/data/commute-chip";
import type { CandidateArea, CommuteMode, DealType } from "@/lib/types";

export type SortKey = "score" | "commute" | "price";

// 거래유형 표시 라벨 — undefined(레거시 데이터)는 전세로 간주(avgPrice=전세 추정).
const DEAL_LABEL: Record<DealType, string> = {
  jeonse: "전세",
  maemae: "매매",
  wolse: "월세",
};

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

// priceRange (단위 만원) → "평균 9.2억" / 매매는 "평균 9.2억 (추정)"
//   priceRange 는 dealType scale 로 계산됨(comparablePrice). 매매는 전세가율 환산이라 "추정" 명시.
export function formatPrice(
  range: { min: number; max: number } | undefined,
  dealType?: DealType,
): string {
  if (!range) return "시세 미공개";
  const avg = (range.min + range.max) / 2;
  const suffix = dealType === "maemae" ? " (추정)" : "";
  return `평균 ${(avg / 10000).toFixed(1)}억${suffix}`;
}

// 월세 추정 { deposit, monthly }(만원) → "보증금 X억 / 월 Y만 (추정)"
//   동네 데이터는 전세 추정뿐 → 전월세전환율 환산값이라 "추정" 명시(날조 X).
export function formatWolse(
  estimate: { deposit: number; monthly: number } | undefined,
): string {
  if (!estimate) return "시세 미공개";
  const deposit = (estimate.deposit / 10000).toFixed(1);
  return `보증금 ${deposit}억 / 월 ${estimate.monthly}만 (추정)`;
}

export function formatCommuteFilter(maxMinutes: number | undefined): string {
  return maxMinutes ? `≤ ${maxMinutes}분` : "제한 없음";
}

export function formatBudgetFilter(
  budget:
    | {
        dealType?: DealType;
        min: number;
        max: number;
        depositMin?: number;
        depositMax?: number;
      }
    | undefined,
): string {
  if (!budget) return "전체";
  if (budget.dealType === "wolse") {
    // 월세 — 보증금 상한(억) + 월세 상한(만원).
    const dep = ((budget.depositMax ?? 0) / 10000).toFixed(1);
    return `월세 보증금 ${dep}억↓ / 월 ${budget.max}만↓`;
  }
  const min = (budget.min / 10000).toFixed(0);
  const max = (budget.max / 10000).toFixed(0);
  const label = DEAL_LABEL[budget.dealType ?? "jeonse"];
  return `${label} ${min}-${max}억`;
}

export function markerLabel(dong: string): string {
  return dong.replace(/동$/, "").slice(0, 4);
}
