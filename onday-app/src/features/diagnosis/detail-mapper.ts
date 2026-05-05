import { MODE_LABELS, type CommuteMode as ChipMode } from "@/components/data/commute-chip";
import type { BadgeProps } from "@/components/ui/badge";
import { toChipMode } from "@/features/diagnosis/result-utils";
import type { CandidateArea } from "@/lib/types";

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

export function buildCommuteRows(
  c: CandidateArea,
  destA: string,
  destB?: string,
): CommuteRowItem[] {
  const rows: CommuteRowItem[] = [
    {
      tag: "A",
      dest: destA || "직장 A",
      mode: toChipMode(c.commuteA.mode),
      modeLabel: MODE_LABELS[toChipMode(c.commuteA.mode)],
      detail:
        c.commuteA.transfers != null
          ? `환승 ${c.commuteA.transfers}회`
          : undefined,
      minutes: c.commuteA.time,
    },
  ];
  if (c.commuteB) {
    rows.push({
      tag: "B",
      dest: destB || "직장 B",
      mode: toChipMode(c.commuteB.mode),
      modeLabel: MODE_LABELS[toChipMode(c.commuteB.mode)],
      detail:
        c.commuteB.transfers != null
          ? `환승 ${c.commuteB.transfers}회`
          : undefined,
      minutes: c.commuteB.time,
    });
  }
  return rows;
}

export function buildMetrics(c: CandidateArea): MetricItem[] {
  const metrics: MetricItem[] = [];
  if (c.priceRange) {
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
