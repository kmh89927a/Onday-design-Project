// 시세 4-A — 국토부 실거래 median(price-index.json) 접근자.
//   예산 필터·priceRange 가 mock avgPrice 추정 환산(price.ts) 대신 실거래 median 을 쓰도록 배선.
//   단위는 전부 만원(budget.min/max, median 모두) — 변환 없음.
//   결측(id 없음/해당 dealType median null)은 null 반환 → 호출부가 "임의 통과" 금지(가짜 결과 방지).

import type { DealType } from "@/lib/types";
import priceIndex from "@/lib/data/price-index.json";

interface MedianCount {
  median: number;
  count: number;
}
interface WolseMedian {
  depositMedian: number;
  monthlyMedian: number;
  count: number;
}
export interface PriceEntry {
  maemae: MedianCount | null;
  jeonse: MedianCount | null;
  wolse: WolseMedian | null;
  source: "legalDong" | "sigungu-fallback";
  matchedSigungu: string;
  matchedLegalDong: string[];
}

const BY_ID = (priceIndex as { byId: Record<string, PriceEntry> }).byId;

export function getPriceEntry(id: string): PriceEntry | null {
  return BY_ID[id] ?? null;
}

/**
 * 전세/매매 비교 점값(만원). dealType 미지정·wolse → 전세 median(기존 avgPrice 자리 대체).
 *   결측(id 없음 / 해당 median null)이면 null — 호출부는 예산 필터에서 통과시키지 말 것.
 */
export function comparableMedian(id: string, dealType?: DealType): number | null {
  const e = BY_ID[id];
  if (!e) return null;
  if (dealType === "maemae") return e.maemae?.median ?? null;
  return e.jeonse?.median ?? null;
}

/** 월세 {deposit, monthly} 중앙값(만원). 결측 null. */
export function wolseMedian(id: string): { deposit: number; monthly: number } | null {
  const w = BY_ID[id]?.wolse;
  return w ? { deposit: w.depositMedian, monthly: w.monthlyMedian } : null;
}

/** priceRange 표시·정렬용 ±15% 밴드(만원). median 결측이면 undefined(분위수 p25/p75 미보유 → 밴드 유지). */
export function priceRangeFor(
  id: string,
  dealType?: DealType,
): { min: number; max: number } | undefined {
  // 월세는 priceRange 를 전세 scale 로 표기(기존 동작 보존 — 월세 표시는 wolseEstimate 사용).
  const base = comparableMedian(id, dealType === "wolse" ? "jeonse" : dealType);
  if (base == null) return undefined;
  return { min: Math.round(base * 0.85), max: Math.round(base * 1.15) };
}
