import {
  MODE_LABELS,
  WORKPLACE_LABEL,
  type CommuteMode as ChipMode,
} from "@/components/data/commute-chip";
import type { BadgeProps } from "@/components/ui/badge";
import {
  toChipMode,
  formatDealValue,
  priceFallbackCaption,
} from "@/features/diagnosis/result-utils";
import type { CandidateArea, CommuteInfo, DealType } from "@/lib/types";

interface PillItem {
  variant: BadgeProps["variant"];
  label: string;
}

interface CommuteRowItem {
  tag: "A" | "B";
  dest: string;
  /** 부부 모드 — "내 직장"/"배우자 직장" 보조 라벨. 싱글(destB 없음)은 미설정. */
  who?: string;
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
  who?: string,
): CommuteRowItem {
  const mode = toChipMode(info.mode);
  return {
    tag,
    dest,
    who,
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
  // ★ 부부 여부는 구조(commuteB 유무)로 판정 — 주소(destA/B)는 in-memory store라
  //   새로고침·공유 시 비어 destB string 게이팅은 라벨이 사라졌음(스트레스 섹션과 불일치).
  const isCouple = c.commuteB != null;
  // 부부 = "내 직장"/"배우자 직장"이 제목, 실제 주소는 보조. 싱글 = 주소가 제목(없으면 "직장").
  const whoA = isCouple ? WORKPLACE_LABEL.A : undefined;
  const whoB = isCouple ? WORKPLACE_LABEL.B : undefined;
  const da = destA?.trim() || (isCouple ? "" : "직장");
  const db = destB?.trim() || (isCouple ? "" : "직장");
  const rows: CommuteRowItem[] = [toCommuteRow("A", da, c.commuteA, whoA)];
  if (c.commuteACar) rows.push(toCommuteRow("A", da, c.commuteACar, whoA));
  if (c.commuteB) {
    rows.push(toCommuteRow("B", db, c.commuteB, whoB));
    if (c.commuteBCar) rows.push(toCommuteRow("B", db, c.commuteBCar, whoB));
  }
  return rows;
}

export function buildMetrics(c: CandidateArea, dealType?: DealType): MetricItem[] {
  const metrics: MetricItem[] = [];
  // 시세 — 거래유형 라벨 + 값(카드 요약과 동일 formatDealValue 소스). 폴백 동네는 sub="구 평균".
  if (c.wolseEstimate || c.priceRange) {
    const cap = priceFallbackCaption(c.id);
    metrics.push({
      label: "시세",
      value: formatDealValue(c, dealType),
      sub: cap || (c.avgArea != null ? `${c.avgArea}평` : undefined),
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
