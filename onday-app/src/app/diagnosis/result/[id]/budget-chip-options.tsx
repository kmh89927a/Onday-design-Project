"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Issue #112 — what-if 명시적 확인 UX (★ TimeChipOptions 답습 + 억 단위 2 number input + 내부 만원 변환).
//   사용자 억 입력 → pending 박힘 → "변경" 버튼 클릭 또는 Enter 키 → onConfirm(min만원, max만원).
//   pending == baseValue 시 버튼 disabled. min > max 또는 ≤ 0 시 invalid.
//   baseMin/baseMax 변경 시 컴포넌트 재마운트 = 부모 영역 `key={baseMin}-${baseMax}` 박힘.
interface BudgetChipOptionsProps {
  baseMin: number; // 만원 단위
  baseMax: number; // 만원 단위
  onConfirm: (min: number, max: number) => void; // 만원 단위
  disabled?: boolean;
}

export function BudgetChipOptions({
  baseMin,
  baseMax,
  onConfirm,
  disabled,
}: BudgetChipOptionsProps) {
  // 내부 영역 = 억 단위 (★ UX 직관).
  const [pendingMin, setPendingMin] = React.useState(baseMin / 10000);
  const [pendingMax, setPendingMax] = React.useState(baseMax / 10000);
  const isUnchanged =
    pendingMin * 10000 === baseMin && pendingMax * 10000 === baseMax;
  const isValid = pendingMin > 0 && pendingMax > 0 && pendingMin <= pendingMax;
  const canConfirm = !isUnchanged && !disabled && isValid;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(pendingMin * 10000, pendingMax * 10000);
    }
  };

  const inputClass = cn(
    "w-16 rounded-sm border border-card-border bg-surface px-s-2 py-s-1",
    "text-body-sm font-bold text-ink tabular",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  );

  return (
    <div className="pt-s-2" role="group" aria-label="예산 범위 변경 입력">
      <label className="flex flex-wrap items-center gap-s-2 text-caption font-bold text-ink-2">
        예산
        <input
          type="number"
          min={1}
          value={pendingMin}
          onChange={(e) => setPendingMin(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleConfirm();
            }
          }}
          disabled={disabled}
          className={inputClass}
        />
        억 ~
        <input
          type="number"
          min={1}
          value={pendingMax}
          onChange={(e) => setPendingMax(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleConfirm();
            }
          }}
          disabled={disabled}
          className={inputClass}
        />
        억
        <button
          type="button"
          onClick={handleConfirm}
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
