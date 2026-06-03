import type { CandidateArea } from "@/lib/types";

import { avgCommute } from "./result-utils";

// 시간 vs 비용 트레이드오프 — OnDay "타협 인사이트".
//   두 축이 직교(점수=통근·안전·편의·여가만, 시세는 점수 밖)라 비교가 의미 있음.
//   기준점=1위 후보, 대체안=나머지 중 한 방향으로 트레이드오프가 가장 효율적인 1곳.

// ★ 월 환산 가정 — 시세 차이를 대출로 가정한 연이자율(정직 표기: "금리 3.5% 가정").
//   priceDelta(만원) × 3.5% ÷ 12 = 월 부담 차이(만원). UI에 가정 라벨 필수 노출.
export const TRADE_OFF_ANNUAL_RATE = 0.035;

export function monthlyFromPriceDelta(priceDeltaManwon: number): number {
  return Math.round((priceDeltaManwon * TRADE_OFF_ANNUAL_RATE) / 12);
}

function avgPrice(c: CandidateArea): number | null {
  if (!c.priceRange) return null;
  return (c.priceRange.min + c.priceRange.max) / 2;
}

export interface TradeOffAlt {
  candidate: CandidateArea;
  timeDelta: number; // 분 (+ = 더 걸림 / - = 단축)
  priceDelta: number; // 만원 (+ = 더 비쌈 / - = 저렴)
  monthlyDelta: number; // 만원/월 (priceDelta 환산, 부호 동일)
}

export interface TradeOffResult {
  reference: CandidateArea;
  cheaper?: TradeOffAlt; // 더 싸지만 통근 더 걸림
  faster?: TradeOffAlt; // 통근 더 빠르지만 더 비쌈
}

function toAlt(c: CandidateArea, refTime: number, refPrice: number): TradeOffAlt {
  const priceDelta = Math.round((avgPrice(c) as number) - refPrice);
  return {
    candidate: c,
    timeDelta: Math.round(avgCommute(c) - refTime),
    priceDelta,
    monthlyDelta: monthlyFromPriceDelta(priceDelta),
  };
}

// 후보 목록(점수순) → 1위 기준 트레이드오프. 시세 없는 후보·1위는 비교에서 제외.
export function computeTradeOff(
  candidates: CandidateArea[],
): TradeOffResult | null {
  const reference = candidates[0];
  const refPrice = reference ? avgPrice(reference) : null;
  if (!reference || refPrice == null) return null;
  const refTime = avgCommute(reference);

  const pool = candidates.slice(1).filter((c) => avgPrice(c) != null);
  const alts = pool.map((c) => toAlt(c, refTime, refPrice));

  // 더 싸지만 먼 곳 — 추가 1분당 절감액(만원/분)이 큰 순. priceDelta<0·timeDelta>0.
  const cheaper = alts
    .filter((a) => a.priceDelta < 0 && a.timeDelta > 0)
    .sort((a, b) => -b.priceDelta / b.timeDelta - -a.priceDelta / a.timeDelta)[0];

  // 더 빠르지만 비싼 곳 — 추가 1만원당 단축 분(분/만원)이 큰 순. timeDelta<0·priceDelta>0.
  const faster = alts
    .filter((a) => a.timeDelta < 0 && a.priceDelta > 0)
    .sort((a, b) => -b.timeDelta / b.priceDelta - -a.timeDelta / a.priceDelta)[0];

  return { reference, cheaper, faster };
}
