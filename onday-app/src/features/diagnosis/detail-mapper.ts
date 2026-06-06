import { MODE_LABELS, type CommuteMode as ChipMode } from "@/components/data/commute-chip";
import type { BadgeProps } from "@/components/ui/badge";
import { toChipMode, formatWolse } from "@/features/diagnosis/result-utils";
import type { CandidateArea, CommuteInfo } from "@/lib/types";

interface PillItem {
  variant: BadgeProps["variant"];
  label: string;
}

interface CommuteRowItem {
  tag: "A" | "B";
  dest: string;
  mode: ChipMode;
  modeLabel: string;
  detail?: string;
  minutes: number;
}

interface MetricItem {
  label: string;
  value: string;
  sub?: string;
}

export function buildPills(c: CandidateArea, isBest: boolean): PillItem[] {
  const pills: PillItem[] = [];
  if (isBest) pills.push({ variant: "solid", label: "BEST 매칭" });
  if (c.listingsCount != null)
    pills.push({ variant: "neutral", label: `매물 ${c.listingsCount}건` });
  return pills;
}

export function buildLines(c: CandidateArea): string {
  return c.lines ?? "노선 정보 곧 추가";
}

function toCommuteRow(
  tag: "A" | "B",
  dest: string,
  info: CommuteInfo,
): CommuteRowItem {
  const mode = toChipMode(info.mode);
  return {
    tag,
    dest,
    mode,
    modeLabel: MODE_LABELS[mode],
    detail: info.transfers != null ? `환승 ${info.transfers}회` : undefined,
    minutes: info.time,
  };
}

// ★ W2B: 직장 경로마다 대중교통 + 자차(있으면) 행 — REQ-FUNC-004 "탭했을 때 대중교통·자차".
//   순서: A 대중교통 / A 차량 / B 대중교통 / B 차량 (자차는 옵셔널 best-effort).
export function buildCommuteRows(
  c: CandidateArea,
  destA: string,
  destB?: string,
): CommuteRowItem[] {
  const da = destA || "직장 A";
  const db = destB || "직장 B";
  const rows: CommuteRowItem[] = [toCommuteRow("A", da, c.commuteA)];
  if (c.commuteACar) rows.push(toCommuteRow("A", da, c.commuteACar));
  if (c.commuteB) {
    rows.push(toCommuteRow("B", db, c.commuteB));
    if (c.commuteBCar) rows.push(toCommuteRow("B", db, c.commuteBCar));
  }
  return rows;
}

export function buildMetrics(c: CandidateArea): MetricItem[] {
  const metrics: MetricItem[] = [];
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
  const total = c.commuteA.time + (c.commuteB?.time ?? 0);
  metrics.push({
    label: "동선 합계",
    value: `${total}분`,
    sub: c.commuteB ? "A+B" : "A",
  });
  const transfersA = c.commuteA.transfers ?? 0;
  const transfersB = c.commuteB?.transfers ?? 0;
  metrics.push({
    label: "환승",
    value: `${transfersA + transfersB}회`,
    sub: c.commuteB ? `A ${transfersA} · B ${transfersB}` : `A ${transfersA}`,
  });
  return metrics;
}
