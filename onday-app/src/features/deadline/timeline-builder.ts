// wiki/concepts/deadline-mode.md — 5단계 자동 생성 (계약 역산)
// 부동산 탐색 → 가계약 → 본계약 → 잔금 → 입주

export type StepStatus = "done" | "now" | "todo";

interface StageDef {
  stageDays: number; // D-N
  stage: string; // "D-30"
  label: string;
  sub: string;
}

const STAGES: StageDef[] = [
  {
    stageDays: 30,
    stage: "D-30",
    label: "매물 탐색",
    sub: "후보 동네 압축, 실거래 리뷰",
  },
  {
    stageDays: 21,
    stage: "D-21",
    label: "가계약",
    sub: "가계약금 입금 · 등기부 확인",
  },
  {
    stageDays: 14,
    stage: "D-14",
    label: "본계약",
    sub: "확정일자 · 전입신고 준비",
  },
  {
    stageDays: 7,
    stage: "D-7",
    label: "잔금 준비",
    sub: "대출 실행일 확정",
  },
  {
    stageDays: 0,
    stage: "D-Day",
    label: "이사",
    sub: "입주 청소 · 인터넷 이전",
  },
];

// 단계별 status 결정:
//   daysLeft가 [stageDays, 다음 단계의 stageDays) 범위면 now
//   daysLeft < stageDays면 done (지난 단계)
//   daysLeft가 그보다 크면 todo
function computeStatus(stageDays: number, nextStageDays: number, daysLeft: number): StepStatus {
  if (daysLeft < stageDays && stageDays !== 0) return "done";
  if (daysLeft >= stageDays && daysLeft < nextStageDays) return "now";
  return "todo";
}

export interface TimelineRow {
  status: StepStatus;
  stage: string;
  label: string;
  sub: string;
  pill?: { variant: "solid" | "danger" | "neutral" | "ok" | "warning"; label: string };
}

export function buildTimeline(daysLeft: number): TimelineRow[] {
  return STAGES.map((s, i) => {
    const next = i === 0 ? Number.POSITIVE_INFINITY : STAGES[i - 1].stageDays;
    const status = computeStatus(s.stageDays, next, daysLeft);
    let pill: TimelineRow["pill"];
    if (status === "now") pill = { variant: "solid", label: "진행 중" };
    else if (i === STAGES.length - 1 && status === "todo") {
      pill = { variant: "danger", label: "놓치면 위약금" };
    }
    return { status, stage: s.stage, label: s.label, sub: s.sub, pill };
  });
}

// daysLeft → urgency for DDayCounter
export function deadlineUrgency(daysLeft: number): "normal" | "soon" | "critical" {
  if (daysLeft <= 3) return "critical";
  if (daysLeft <= 14) return "soon";
  return "normal";
}

export function daysFromNow(targetIso: string): number {
  const ms = new Date(targetIso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export function formatTargetDate(iso: string): string {
  const d = new Date(iso);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${
    weekdays[d.getDay()]
  })`;
}
