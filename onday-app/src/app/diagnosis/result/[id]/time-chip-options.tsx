"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Issue #118 — what-if 명시적 확인 UX (★ pending state 캡슐화 + "변경" 버튼 + Enter 키).
//   사용자 자유 HH:MM 입력 → pending 박힘 → "변경" 버튼 클릭 또는 Enter 키 → onConfirm(time).
//   pending == baseTime 시 버튼 disabled (★ "변경 없음" 명확 시각).
//   ★ baseTime 변경 시 컴포넌트 재마운트 = 부모 영역 `key={baseTime}` 박힘 (★ React 19 set-state-in-effect 규칙 답습).
interface TimeChipOptionsProps {
  baseTime: string;
  onConfirm: (time: string) => void;
  disabled?: boolean;
}

export function TimeChipOptions({
  baseTime,
  onConfirm,
  disabled,
}: TimeChipOptionsProps) {
  const [pending, setPending] = React.useState(baseTime);
  const isUnchanged = pending === baseTime;

  return (
    <div className="pt-s-2" role="group" aria-label="시간대 변경 입력">
      <label className="flex flex-wrap items-center gap-s-2 text-caption font-bold text-ink-2">
        시간대 변경
        <input
          type="time"
          value={pending}
          onChange={(e) => setPending(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isUnchanged && !disabled) {
              e.preventDefault();
              onConfirm(pending);
            }
          }}
          disabled={disabled}
          className={cn(
            "rounded-sm border border-card-border bg-surface px-s-2 py-s-1",
            "text-body-sm font-bold text-ink tabular",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
        <button
          type="button"
          onClick={() => onConfirm(pending)}
          disabled={disabled || isUnchanged}
          className={cn(
            "rounded-sm bg-primary px-s-3 py-s-1 text-body-sm font-bold text-primary-foreground",
            "transition-all hover:brightness-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          변경
        </button>
      </label>
    </div>
  );
}
