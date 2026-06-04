"use client";

import * as React from "react";

import type { DealType } from "@/lib/types";
import { cn } from "@/lib/utils";

// Issue #112 — what-if 명시적 확인 UX (★ TimeChipOptions 답습 + 억 단위 2 number input + 내부 만원 변환).
//   사용자 억 입력 → pending 박힘 → "변경" 버튼 클릭 또는 Enter 키 → onConfirm(min만원, max만원).
//   pending == baseValue 시 버튼 disabled. min > max 또는 ≤ 0 시 invalid.
//   baseMin/baseMax 변경 시 컴포넌트 재마운트 = 부모 영역 `key=...` 박힘.
//   월세(Stage 2-B)는 보증금/월세 2축이라 WolseChipOptions 로 분기 — 전세/매매 코드 무변경.
interface BudgetChipOptionsProps {
  baseMin: number; // 만원 단위
  baseMax: number; // 만원 단위 (월세 시 = 월세 상한)
  baseDepositMax?: number; // 만원 단위 — 월세 전용 보증금 상한
  onConfirm: (min: number, max: number, depositMax?: number) => void; // 만원 단위
  disabled?: boolean;
  dealType?: DealType;
}

const INPUT_CLASS = cn(
  "w-16 rounded-sm border border-card-border bg-surface px-s-2 py-s-1",
  "text-body-sm font-bold text-ink tabular",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

const CONFIRM_BTN_CLASS = cn(
  "rounded-sm bg-primary px-s-3 py-s-1 text-body-sm font-bold text-primary-foreground",
  "transition-all hover:brightness-95",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export function BudgetChipOptions({
  baseMin,
  baseMax,
  baseDepositMax,
  onConfirm,
  disabled,
  dealType,
}: BudgetChipOptionsProps) {
  if (dealType === "wolse") {
    return (
      <WolseChipOptions
        baseMonthly={baseMax}
        baseDepositMax={baseDepositMax}
        onConfirm={onConfirm}
        disabled={disabled}
      />
    );
  }

  const budgetLabel = dealType === "maemae" ? "매매가" : "전세 보증금";
  return (
    <BudgetRangeChip
      baseMin={baseMin}
      baseMax={baseMax}
      label={budgetLabel}
      onConfirm={onConfirm}
      disabled={disabled}
    />
  );
}

// 전세/매매 — 억~억 단일 금액 범위 (기존 로직 보존).
function BudgetRangeChip({
  baseMin,
  baseMax,
  label,
  onConfirm,
  disabled,
}: {
  baseMin: number;
  baseMax: number;
  label: string;
  onConfirm: (min: number, max: number) => void;
  disabled?: boolean;
}) {
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

  return (
    <div className="pt-s-2" role="group" aria-label={`${label} 범위 변경 입력`}>
      <label className="flex flex-wrap items-center gap-s-2 text-caption font-bold text-ink-2">
        {label}
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
          className={INPUT_CLASS}
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
          className={INPUT_CLASS}
        />
        억
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={CONFIRM_BTN_CLASS}
        >
          변경
        </button>
      </label>
    </div>
  );
}

// 월세 — 보증금 상한(억) + 월세 상한(만원). 월세 상한이 主, 보증금 옵션(0=미설정).
function WolseChipOptions({
  baseMonthly,
  baseDepositMax,
  onConfirm,
  disabled,
}: {
  baseMonthly: number; // 만원
  baseDepositMax?: number; // 만원
  onConfirm: (min: number, max: number, depositMax?: number) => void;
  disabled?: boolean;
}) {
  const [pendingMonthly, setPendingMonthly] = React.useState(baseMonthly);
  const [pendingDeposit, setPendingDeposit] = React.useState(
    baseDepositMax ? baseDepositMax / 10000 : 0,
  ); // 억
  const isUnchanged =
    pendingMonthly === baseMonthly &&
    pendingDeposit * 10000 === (baseDepositMax ?? 0);
  const isValid = pendingMonthly > 0 && pendingDeposit >= 0;
  const canConfirm = !isUnchanged && !disabled && isValid;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(
        0,
        pendingMonthly,
        pendingDeposit > 0 ? pendingDeposit * 10000 : undefined,
      );
    }
  };
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div
      className="space-y-s-2 pt-s-2"
      role="group"
      aria-label="월세 조건 변경 입력"
    >
      <label className="flex flex-wrap items-center gap-s-2 text-caption font-bold text-ink-2">
        보증금
        <input
          type="number"
          min={0}
          value={pendingDeposit}
          onChange={(e) => setPendingDeposit(Number(e.target.value))}
          onKeyDown={onEnter}
          disabled={disabled}
          className={INPUT_CLASS}
        />
        억 이하
      </label>
      <label className="flex flex-wrap items-center gap-s-2 text-caption font-bold text-ink-2">
        월세
        <input
          type="number"
          min={1}
          value={pendingMonthly}
          onChange={(e) => setPendingMonthly(Number(e.target.value))}
          onKeyDown={onEnter}
          disabled={disabled}
          className={INPUT_CLASS}
        />
        만원 이하
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={CONFIRM_BTN_CLASS}
        >
          변경
        </button>
      </label>
    </div>
  );
}
