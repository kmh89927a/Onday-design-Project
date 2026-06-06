import type { BadgeProps } from "@/components/ui/badge";
import type { CandidateArea, SafetyGrade } from "@/lib/types";
import { formatWolse } from "@/features/diagnosis/result-utils";

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
): MetricItem[] {
  const metrics: MetricItem[] = [
    {
      label: "야간 범죄율",
      value: grade ? `${getNightCrimeRate(grade)}건` : "준비중",
      sub: grade ? "10만명당" : "데이터 준비중",
    },
  ];
  // 월세 진단(wolseEstimate 채워짐)은 카드 요약과 동일하게 formatWolse(보증금/월) 표기.
  //   priceRange 는 월세 시 전세 scale 라 "평균 시세"로 쓰면 카드 요약과 불일치 → wolse 우선 분기.
  if (c.wolseEstimate) {
    metrics.push({
      label: "월세",
      value: formatWolse(c.wolseEstimate),
      sub: c.avgArea != null ? `${c.avgArea}평` : undefined,
    });
  } else if (c.priceRange) {
    const avg = (c.priceRange.min + c.priceRange.max) / 2;
    metrics.push({
      label: "평균 시세",
      value: `${(avg / 10000).toFixed(1)}억`,
      sub: c.avgArea != null ? `${c.avgArea}평` : undefined,
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
