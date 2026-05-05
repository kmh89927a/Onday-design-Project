"use client";

import { daysFromNow } from "./timeline-builder";

export type ActiveStage = "D-30" | "D-21" | "D-14" | "D-7" | "D-Day";

export interface ActiveStageInfo {
  stage: ActiveStage;
  daysLeft: number;
  message: string;
  urgency: "normal" | "soon" | "critical";
}

const STAGE_TEMPLATE: Record<
  ActiveStage,
  { message: string; urgency: ActiveStageInfo["urgency"] }
> = {
  "D-30": {
    message: "매물 탐색 시점이에요. 후보 동네를 압축해보세요.",
    urgency: "normal",
  },
  "D-21": {
    message: "가계약 시점입니다. 등기부 확인을 잊지 마세요.",
    urgency: "normal",
  },
  "D-14": {
    message: "본계약 준비 시점입니다. 확정일자·전입신고를 준비하세요.",
    urgency: "soon",
  },
  "D-7": {
    message: "잔금 준비 시점입니다. 대출 실행일을 확정하세요.",
    urgency: "soon",
  },
  "D-Day": {
    message: "이사일이에요! 위약금 위험에 주의하세요.",
    urgency: "critical",
  },
};

// timeline-builder.ts와 동일한 단계 분기 (now stage 매핑)
export function deriveActiveStage(daysLeft: number): ActiveStage {
  if (daysLeft >= 30) return "D-30";
  if (daysLeft >= 21) return "D-21";
  if (daysLeft >= 14) return "D-14";
  if (daysLeft >= 7) return "D-7";
  if (daysLeft > 0) return "D-7";
  return "D-Day";
}

export function getActiveStage(
  deadlineISO: string | null,
): ActiveStageInfo | null {
  if (!deadlineISO) return null;
  const days = daysFromNow(deadlineISO);
  if (days < -1) return null; // 이사 후 1일 이상 지나면 알림 종료
  const stage = deriveActiveStage(days);
  return { stage, daysLeft: days, ...STAGE_TEMPLATE[stage] };
}
