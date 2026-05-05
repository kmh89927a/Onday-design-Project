"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

// components-spec §09 ModeSelector
//   role=radiogroup + cards role=radio + aria-checked
//   active: border-primary + bg-primary-soft + 우상단 18px 체크 뱃지
//   키보드: ←→ 이동, Space/Enter 선택

export type ModeKey = "couple" | "single" | "roommate";

export interface ModeOption {
  key: ModeKey;
  emoji: string;
  title: string;
  sub: string;
}

const DEFAULT_OPTIONS: ModeOption[] = [
  { key: "couple", emoji: "💑", title: "커플 모드", sub: "두 직장 동선 교집합" },
  { key: "single", emoji: "👤", title: "싱글 모드", sub: "야간 안전 등급 포함" },
];

interface ModeSelectorProps {
  value: ModeKey;
  onChange: (next: ModeKey) => void;
  options?: ModeOption[];
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function ModeSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  disabled,
  ariaLabel = "진단 모드",
  className,
}: ModeSelectorProps) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const handleKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (idx + 1) % options.length;
      refs.current[next]?.focus();
      onChange(options[next].key);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (idx - 1 + options.length) % options.length;
      refs.current[prev]?.focus();
      onChange(options[prev].key);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid grid-cols-2 gap-s-3", className)}
    >
      {options.map((opt, idx) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.key)}
            onKeyDown={(e) => handleKey(e, idx)}
            className={cn(
              "relative flex flex-col items-start gap-s-1 rounded-xl border-[1.5px] p-s-4 text-left transition-colors",
              active
                ? "border-primary bg-primary-soft"
                : "border-card-border bg-surface hover:border-[hsl(220_30%_84%)]",
              "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <span aria-hidden className="text-h2 leading-none">
              {opt.emoji}
            </span>
            <span className="text-title font-bold text-ink">{opt.title}</span>
            <span className="text-body-sm text-ink-3">{opt.sub}</span>
            {active && (
              <span
                aria-hidden
                className="absolute right-s-3 top-s-3 inline-flex size-[18px] items-center justify-center rounded-full bg-primary text-white"
              >
                <Check className="size-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
