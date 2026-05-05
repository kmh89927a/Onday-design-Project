import * as React from "react";

import { cn } from "@/lib/utils";

// components-spec §15 SafetyGradeBadge
//   야간 안전 등급(A~D). letter + label + 색 3중 표기 (color 단독 금지)
//   onday 디자인 시스템 정렬 (step-11.9):
//     A·B = primary 파스텔/소프트 (메인 안전, primary 시스템과 조화)
//     C·D = warning/danger soft (경고/위험 인지, 톤다운)

export type SafetyGrade = "A" | "B" | "C" | "D";

const GRADE_STYLES: Record<SafetyGrade, string> = {
  A: "bg-primary-pastel text-primary-deep",
  B: "bg-primary-soft text-primary",
  C: "bg-warning-soft text-warning",
  D: "bg-danger-soft text-danger",
};

const GRADE_LABELS: Record<SafetyGrade, string> = {
  A: "매우 안전",
  B: "안전",
  C: "주의",
  D: "위험",
};

interface SafetyGradeBadgeProps {
  grade: SafetyGrade;
  label?: string;
  className?: string;
}

export function SafetyGradeBadge({
  grade,
  label,
  className,
}: SafetyGradeBadgeProps) {
  const text = label ?? GRADE_LABELS[grade];
  return (
    <span
      role="img"
      aria-label={`야간 안전 등급 ${grade}, ${text}`}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-sm px-s-2 py-1 text-caption-xs font-extrabold",
        GRADE_STYLES[grade],
        className,
      )}
    >
      <span aria-hidden className="font-black tracking-tight">
        {grade}
      </span>
      <span aria-hidden>·</span>
      <span aria-hidden>{text}</span>
    </span>
  );
}

export { GRADE_LABELS, GRADE_STYLES };
