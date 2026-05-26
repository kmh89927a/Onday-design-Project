"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Issue #112 — what-if 명시적 확인 UX (★ TimeChipOptions 답습 + 분 단위 number input).
//   사용자 분 입력 → pending 박힘 → "변경" 버튼 클릭 또는 Enter 키 → onConfirm(value).
//   pending == baseValue 시 버튼 disabled. 10~120 범위 외 시 invalid.
//   baseValue 변경 시 컴포넌트 재마운트 = 부모 영역 `key={baseValue}` 박힘.
interface CommuteChipOptionsProps {
  baseValue: number;
  onConfirm: (value: number) => void;
  disabled?: boolean;
}

export function CommuteChipOptions({
  baseValue,
  onConfirm,
  disabled,
}: CommuteChipOptionsProps) {
  const [pending, setPending] = React.useState(baseValue);
  const isUnchanged = pending === baseValue;
  const isValid = pending >= 10 && pending <= 120;
  const canConfirm = !isUnchanged && !disabled && isValid;

  return (
    <div className="pt-s-2" role="group" aria-label="최대 출퇴근 시간 변경 입력">
      <label className="flex flex-wrap items-center gap-s-2 text-caption font-bold text-ink-2">
        최대 출퇴근 시간
        <input
          type="number"
          min={10}
          max={120}
          value={pending}
          onChange={(e) => setPending(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canConfirm) {
              e.preventDefault();
              onConfirm(pending);
            }
          }}
          disabled={disabled}
          className={cn(
            "w-20 rounded-sm border border-card-border bg-surface px-s-2 py-s-1",
            "text-body-sm font-bold text-ink tabular",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
        분
        <button
          type="button"
          onClick={() => onConfirm(pending)}
          disabled={!canConfirm}
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
