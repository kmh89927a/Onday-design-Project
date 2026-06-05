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
  /** null = no_data(미수집 시군구) → 등급 날조 대신 중립 "준비중" 배지 (#59, E-2 합의). */
  grade: SafetyGrade | null;
  label?: string;
  className?: string;
}

export function SafetyGradeBadge({
  grade,
  label,
  className,
}: SafetyGradeBadgeProps) {
  // no_data → 중립 회색 "준비중" (letter 자리 "—"). letter+label+색 3중 표기 유지.
  if (grade === null) {
    return (
      <span
        role="img"
        aria-label="야간 안전 데이터 준비중"
        className={cn(
          "grade-badge inline-flex w-fit items-center gap-1 rounded-sm px-s-2 py-1 text-caption-xs font-extrabold bg-bg text-ink-3",
          className,
        )}
      >
        <span aria-hidden className="font-black tracking-tight">
          —
        </span>
        <span aria-hidden>·</span>
        <span aria-hidden>준비중</span>
      </span>
    );
  }
  const text = label ?? GRADE_LABELS[grade];
  return (
    <span
      role="img"
      aria-label={`야간 안전 등급 ${grade}, ${text}`}
      className={cn(
        // grade-badge: globals.css @media print 흑백 인쇄 시 border + color #000 (UI-013 AC-7)
        "grade-badge inline-flex w-fit items-center gap-1 rounded-sm px-s-2 py-1 text-caption-xs font-extrabold",
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
