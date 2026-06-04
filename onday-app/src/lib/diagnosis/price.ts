import type { DealType } from "@/lib/types";

// 전세가율 추정치 — 매매가 ≈ 전세 ÷ 0.55 (서울 아파트 대략치).
//   동네 데이터는 avgPrice(전세 추정 보증금) 단일값만 보유 → 매매 시세를 보유하지 않아
//   이 상수로 파생(추정)한다. 표시 시 "추정" 명시 필수(날조 금지).
export const JEONSE_RATIO = 0.55;

// 전월세전환율(연 5%) + 보증금 가정(전세 10% = 반전세) — 월세 추정용.
//   동네 데이터는 avgPrice(전세 추정)뿐 → 월세를 파생(추정). 보증금 10%면 90%를 월세로
//   전환해 월세가 다소 높게 나옴(현실 반전세는 보증금 비중↑). "추정" 명시 + 상수라 튜닝 용이.
export const WOLSE_CONVERSION_RATE = 0.05;
export const WOLSE_DEPOSIT_RATIO = 0.1;

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

/**
 * avgPrice(전세 추정 보증금, 만원) → 월세 추정 { deposit, monthly }(만원).
 *   보증금 = 전세 × 10%, 월세 = (전세 − 보증금) × 5% ÷ 12 (전월세전환율 환산, 추정).
 */
export function estimateWolse(avgPrice: number): {
  deposit: number;
  monthly: number;
} {
  const deposit = Math.round(avgPrice * WOLSE_DEPOSIT_RATIO);
  const monthly = Math.round(((avgPrice - deposit) * WOLSE_CONVERSION_RATE) / 12);
  return { deposit, monthly };
}
