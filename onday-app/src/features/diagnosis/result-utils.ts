import type { CommuteMode as ChipMode } from "@/components/data/commute-chip";
import type {
  CandidateArea,
  CommuteMode,
  DealType,
  DiagnosisFilters,
} from "@/lib/types";
import { priceSource } from "@/lib/diagnosis/price-index";

export type SortKey = "score" | "commute" | "price";

// 거래유형 표시 라벨 — undefined(레거시/미선택)는 전세로 간주.
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

// priceRange (단위 만원) → "전세 7.2억" / "매매 12.8억" — 실거래 median 이라 "(추정)" 없음(5단계).
//   거래유형 라벨로 무슨 값인지 명확화(7.2억이 전세/매매 헷갈리던 문제 해소).
export function formatPrice(
  range: { min: number; max: number } | undefined,
  dealType?: DealType,
): string {
  if (!range) return "시세 미공개";
  const avg = (range.min + range.max) / 2;
  return `${DEAL_LABEL[dealType ?? "jeonse"]} ${(avg / 10000).toFixed(1)}억`;
}

// 월세 { deposit, monthly }(만원) → "월세 보증금 X억 · 월 Y만" — 실거래 median 이라 "(추정)" 없음.
export function formatWolse(
  estimate: { deposit: number; monthly: number } | undefined,
): string {
  if (!estimate) return "시세 미공개";
  const deposit = (estimate.deposit / 10000).toFixed(1);
  return `월세 보증금 ${deposit}억 · 월 ${estimate.monthly}만`;
}

// 거래유형 라벨 + 값(캡션 제외). 카드 요약·상세 공용 — 같은 함수라 표기 일치.
export function formatDealValue(
  c: {
    priceRange?: { min: number; max: number };
    wolseEstimate?: { deposit: number; monthly: number };
  },
  dealType?: DealType,
): string {
  return dealType === "wolse"
    ? formatWolse(c.wolseEstimate)
    : formatPrice(c.priceRange, dealType);
}

// 폴백(시군구 평균) 동네는 "구 평균" 캡션. 동 데이터(legalDong)는 빈 문자열.
export function priceFallbackCaption(id: string): string {
  return priceSource(id) === "sigungu-fallback" ? "구 평균" : "";
}

// 카드 요약용 단일 문자열 — 거래유형 값 + 폴백 캡션 결합.
export function formatCardPrice(
  c: {
    id: string;
    priceRange?: { min: number; max: number };
    wolseEstimate?: { deposit: number; monthly: number };
  },
  dealType?: DealType,
): string {
  const base = formatDealValue(c, dealType);
  const cap = priceFallbackCaption(c.id);
  return cap ? `${base} · ${cap}` : base;
}

export function formatCommuteFilter(maxMinutes: number | undefined): string {
  return maxMinutes ? `≤ ${maxMinutes}분` : "제한 없음";
}

export function formatBudgetFilter(
  budget:
    | {
        min: number;
        max: number;
        depositMin?: number;
        depositMax?: number;
      }
    | undefined,
  dealType?: DealType, // 거래유형은 filters.dealType(budget 과 독립) 에서 전달
): string {
  if (!budget) return "전체";
  if (dealType === "wolse") {
    // 월세 — 보증금 상한(억) + 월세 상한(만원).
    const dep = ((budget.depositMax ?? 0) / 10000).toFixed(1);
    return `월세 보증금 ${dep}억↓ / 월 ${budget.max}만↓`;
  }
  const min = (budget.min / 10000).toFixed(0);
  const max = (budget.max / 10000).toFixed(0);
  const label = DEAL_LABEL[dealType ?? "jeonse"];
  return `${label} ${min}-${max}억`;
}

// 레거시 자가치유 — 구 데이터(budget.dealType, top-level dealType 없음)를 filters.dealType 으로 승격.
//   localStorage '이전 조건'·기존 저장 진단 재오픈 시 거래유형 보존(읽기 단일 소스 = filters.dealType).
export function liftLegacyDealType(filters: DiagnosisFilters): DiagnosisFilters {
  if (filters.dealType) return filters;
  const legacy = (filters.budget as { dealType?: DealType } | undefined)?.dealType;
  return legacy ? { ...filters, dealType: legacy } : filters;
}

export function markerLabel(dong: string): string {
  return dong.replace(/동$/, "").slice(0, 4);
}
