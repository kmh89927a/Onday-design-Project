"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// components-spec §11 FilterChip
//   label + value, active 시 border-primary
//   hover bg-bg, focus ring primary, disabled opacity 0.5
//   aria-label = "{label} 필터, 현재값 {value}"

interface FilterChipProps {
  label: string;
  value: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function FilterChip({
  label,
  value,
  onClick,
  active,
  disabled,
  ariaLabel,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? `${label} 필터, 현재값 ${value}`}
      className={cn(
        "flex flex-1 items-center justify-between gap-s-2 rounded-md border bg-surface px-s-3 py-s-2 text-left transition-colors",
        active ? "border-primary" : "border-card-border",
        "hover:bg-bg",
        "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <span className="text-caption text-ink-3">{label}</span>
      <span
        className={cn(
          "text-caption font-bold",
          active ? "text-primary" : "text-ink",
        )}
      >
        {value}
      </span>
    </button>
  );
}
