"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// 입력 단계 timeRange 라디오 그룹 — 3 옵션 (morning/evening/flexible)
// (TimeTabs는 result 화면 출근시간대 미세 조정용 — 별도 컴포넌트 §10)
// 라벨: 평일 출근 · 평일 퇴근 · 주말

export type TimeRange = "morning" | "evening" | "flexible";

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "morning", label: "평일 출근" },
  { value: "evening", label: "평일 퇴근" },
  { value: "flexible", label: "주말" },
];

interface TimeRangeToggleProps {
  value: TimeRange;
  onChange: (next: TimeRange) => void;
  ariaLabel?: string;
  className?: string;
}

export function TimeRangeToggle({
  value,
  onChange,
  ariaLabel = "시간대 선택",
  className,
}: TimeRangeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex gap-s-2", className)}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-md border px-s-3 py-s-2 text-caption font-bold transition-colors",
              active
                ? "border-primary bg-primary-soft text-primary"
                : "border-card-border bg-surface text-ink-2 hover:bg-bg",
              "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
