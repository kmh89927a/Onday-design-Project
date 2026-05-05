import * as React from "react";

import { cn } from "@/lib/utils";
import {
  GRADE_LABELS,
  GRADE_STYLES,
  type SafetyGrade,
} from "./safety-grade-badge";

// components-spec §29 LegendBar
//   A~D 등급 가이드 칩 4개. 4-col flex 균등.
//   <section aria-label="등급 가이드">

interface LegendBarProps {
  title: string;
  meta?: string;
  grades?: SafetyGrade[];
  className?: string;
}

export function LegendBar({
  title,
  meta,
  grades = ["A", "B", "C", "D"],
  className,
}: LegendBarProps) {
  return (
    <section
      aria-label="등급 가이드"
      className={cn(
        "rounded-lg border border-card-border bg-surface p-s-3 shadow-card",
        className,
      )}
    >
      <header className="mb-s-3">
        <h3 className="text-body-sm font-bold text-ink">{title}</h3>
        {meta && <p className="text-caption text-ink-3">{meta}</p>}
      </header>
      <ul className="flex gap-s-2">
        {grades.map((g) => (
          <li key={g} className="flex-1">
            <span
              aria-label={`${g}등급, ${GRADE_LABELS[g]}`}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md py-1.5 text-caption-xs font-extrabold",
                GRADE_STYLES[g],
              )}
            >
              <span aria-hidden className="text-body font-black leading-none">
                {g}
              </span>
              <span aria-hidden>{GRADE_LABELS[g]}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
