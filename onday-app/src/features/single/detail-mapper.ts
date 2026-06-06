import type { BadgeProps } from "@/components/ui/badge";
import type { CandidateArea, SafetyGrade, DealType } from "@/lib/types";
import {
  formatDealValue,
  priceFallbackCaption,
} from "@/features/diagnosis/result-utils";

import { getNightCrimeRate } from "./safety-stats";

interface PillItem {
  variant: BadgeProps["variant"];
  label: string;
}

interface MetricItem {
  label: string;
  value: string;
  sub?: string;
}

// 싱글 시트 pills — 왜 1위(순위) + 야간안전 등급 + 매물 수. 배우자(B) 없는 싱글 전용.
export function buildSinglePills(
  c: CandidateArea,
  rank: number,
  grade: SafetyGrade | null,
): PillItem[] {
  const pills: PillItem[] = [];
  if (rank === 1) pills.push({ variant: "solid", label: "BEST 매칭" });
  pills.push({
    variant: "neutral",
    label: grade ? `야간안전 ${grade}등급` : "야간안전 준비중",
  });
  if (c.listingsCount != null)
    pills.push({ variant: "neutral", label: `매물 ${c.listingsCount}건` });
  return pills;
}

// 싱글 metrics 3-col — 야간 범죄율(안전) / 평균 시세 / 여가거점(가장 가까운 곳).
//   여가거점 미입력 시 통근(직장A)로 대체 → 3칸 항상 채움.
export function buildSingleMetrics(
  c: CandidateArea,
  grade: SafetyGrade | null,
  dealType?: DealType,
): MetricItem[] {
  const metrics: MetricItem[] = [
    {
      label: "야간 범죄율",
      value: grade ? `${getNightCrimeRate(grade)}건` : "준비중",
      sub: grade ? "10만명당" : "데이터 준비중",
    },
  ];
  // 시세 — 거래유형 라벨 + 값(카드 요약과 동일 formatDealValue). 폴백 동네는 sub="구 평균".
  if (c.wolseEstimate || c.priceRange) {
    const cap = priceFallbackCaption(c.id);
    metrics.push({
      label: "시세",
      value: formatDealValue(c, dealType),
      sub: cap || (c.avgArea != null ? `${c.avgArea}평` : undefined),
    });
  }
  const leisureTimes = [c.leisureA?.time, c.leisureB?.time].filter(
    (t): t is number => t != null,
  );
  if (leisureTimes.length > 0) {
    metrics.push({
      label: "여가거점",
      value: `${Math.min(...leisureTimes)}분`,
      sub: leisureTimes.length > 1 ? "가장 가까운 곳" : "이동 시간",
    });
  } else {
    metrics.push({ label: "통근", value: `${c.commuteA.time}분`, sub: "직장A" });
  }
  return metrics;
}
