import type { DealType } from "@/lib/types";

// 전세가율 추정치 — 매매가 ≈ 전세 ÷ 0.55 (서울 아파트 대략치).
//   동네 데이터는 avgPrice(전세 추정 보증금) 단일값만 보유 → 매매 시세를 보유하지 않아
//   이 상수로 파생(추정)한다. 표시 시 "추정" 명시 필수(날조 금지). 월세는 Stage 2.
export const JEONSE_RATIO = 0.55;

/**
 * 동네 avgPrice(전세 추정 보증금, 만원) → 거래유형별 비교가(만원).
 *   - jeonse: 그대로 (전세 보증금)
 *   - maemae: 전세가율로 환산한 매매가(추정)
 * dealType 미지정 시 전세로 간주 — 기존 budget({min,max}) 하위호환.
 */
export function comparablePrice(
  avgPrice: number,
  dealType: DealType = "jeonse",
): number {
  if (dealType === "maemae") return Math.round(avgPrice / JEONSE_RATIO);
  return avgPrice;
}
