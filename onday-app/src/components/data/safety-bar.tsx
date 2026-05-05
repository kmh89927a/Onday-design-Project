"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { type SafetyGrade } from "./safety-grade-badge";

// components-spec §30 SafetyBar
//   값 + 4분위 tick 가로 막대. height 6px 고정.
//   role=progressbar + aria-valuenow/min/max + aria-label
//   애니메이션: IntersectionObserver 진입 시 380ms ease-out (--bar-target CSS var)

// step-11.9 — onday 디자인 시스템 정렬:
//   A·B = primary 톤 (조화), C·D = warning/danger 톤다운
//   bar는 가독성 위해 opacity로 강도 조정 (badge보다 진한 톤)
const FILL_COLORS: Record<SafetyGrade, string> = {
  A: "bg-primary",
  B: "bg-primary/55",
  C: "bg-warning/70",
  D: "bg-danger/70",
};

interface SafetyBarProps {
  value: number;
  unit: string;
  label: string;
  percent: number;
  grade: SafetyGrade;
  showQuartiles?: boolean;
  className?: string;
}

export function SafetyBar({
  value,
  unit,
  label,
  percent,
  grade,
  showQuartiles = true,
  className,
}: SafetyBarProps) {
  const barRef = React.useRef<HTMLDivElement>(null);
  const [filled, setFilled] = React.useState(false);

  React.useEffect(() => {
    if (!barRef.current) return;
    const el = barRef.current;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFilled(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const target = Math.max(0, Math.min(100, percent));

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-s-2">
        <span className="text-caption text-ink-3">{label}</span>
        <span className="tabular text-body-sm font-bold text-ink">
          {value}
          <span className="ml-0.5 text-caption text-ink-3">{unit}</span>
        </span>
      </div>
      <div
        ref={barRef}
        role="progressbar"
        aria-valuenow={target}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} ${value}${unit}, ${grade}등급`}
        className="relative h-1.5 overflow-hidden rounded-xs bg-bg"
      >
        <div
          className={cn(
            "h-full rounded-xs transition-[width] duration-380 ease-out",
            FILL_COLORS[grade],
          )}
          style={{ width: filled ? `${target}%` : "0%" }}
        />
        {showQuartiles && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {[25, 50, 75].map((q) => (
              <span
                key={q}
                className="absolute top-0 h-full w-px bg-line-2"
                style={{ left: `${q}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
