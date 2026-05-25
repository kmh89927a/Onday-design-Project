"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Issue #111 β — what-if 시뮬레이션 입력 (★ <input type="time"> 직접 박힘).
//   사용자 자유 HH:MM 입력 → onChange(time) (★ 부모 영역 setFilters + runMockDiagnosis 호출).
//   disabled = 시나리오 B (페이지 reload / 직접 URL) fallback 영역 — store coordinateA null 시 박힘.
interface TimeChipOptionsProps {
  baseTime: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}

export function TimeChipOptions({
  baseTime,
  onChange,
  disabled,
}: TimeChipOptionsProps) {
  return (
    <div className="pt-s-2" role="group" aria-label="다른 시간대 입력">
      <label className="flex items-center gap-s-2 text-caption font-bold text-ink-2">
        시간대 변경
        <input
          type="time"
          value={baseTime}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "rounded-sm border border-card-border bg-surface px-s-2 py-s-1",
            "text-body-sm font-bold text-ink tabular",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
      </label>
    </div>
  );
}
