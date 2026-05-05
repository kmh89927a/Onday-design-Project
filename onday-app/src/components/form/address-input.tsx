"use client";

import * as React from "react";
import { Check, Search } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SuggestList, type AddressSuggestion } from "./suggest-list";

export type { AddressSuggestion };

// components-spec §07 AddressInput
//   tag A/B (A=primary, B=secondary) + L1/L2 (싱글 모드 여가거점, ink-3 톤)
//   suggestions 비면 SuggestList 미표시, verified=true → 우측 그린 체크
//   focus: border-primary + box-shadow 0 0 0 4px rgba(37,99,235,0.10)

type AddressInputTag = "A" | "B" | "L1" | "L2";

const TAG_BG: Record<AddressInputTag, string> = {
  A: "bg-primary",
  B: "bg-secondary",
  L1: "bg-ink-3",
  L2: "bg-ink-3",
};

interface AddressInputProps {
  tag: AddressInputTag;
  label: string;
  value: string;
  onChange: (next: string) => void;
  onSelect?: (item: AddressSuggestion) => void;
  placeholder?: string;
  suggestions?: AddressSuggestion[];
  loading?: boolean;
  verified?: boolean;
  disabled?: boolean;
  id?: string;
}

export function AddressInput({
  tag,
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  suggestions = [],
  verified,
  disabled,
  id,
}: AddressInputProps) {
  const inputId = React.useId();
  const listId = `${id ?? inputId}-list`;
  const [highlightedId, setHighlightedId] = React.useState<string>();
  const [isFocus, setIsFocus] = React.useState(false);
  const showList = isFocus && suggestions.length > 0;
  // derived: 사용자가 highlight한 항목이 현재 suggestions에 없으면 첫 번째로 폴백
  const effectiveHighlightedId =
    highlightedId && suggestions.some((s) => s.id === highlightedId)
      ? highlightedId
      : suggestions[0]?.id;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    const idx = suggestions.findIndex((s) => s.id === effectiveHighlightedId);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = suggestions[(idx + 1) % suggestions.length];
      setHighlightedId(next.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev =
        suggestions[(idx - 1 + suggestions.length) % suggestions.length];
      setHighlightedId(prev.id);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = suggestions[idx];
      if (sel) {
        onSelect?.(sel);
        onChange(sel.title);
        setIsFocus(false);
      }
    } else if (e.key === "Escape") {
      setIsFocus(false);
    }
  };

  return (
    <div className="space-y-s-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div
        className={cn(
          "rounded-lg border-[1.5px] bg-surface transition-colors",
          isFocus
            ? "border-primary ring-4 ring-primary/10"
            : "border-card-border",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div className="flex items-center gap-s-2 px-s-3 py-s-3">
          <span
            aria-hidden
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-sm text-caption-xs font-extrabold text-white",
              tag.length > 1 ? "px-1.5 h-6" : "size-6",
              TAG_BG[tag],
            )}
          >
            {tag}
          </span>
          <input
            id={inputId}
            role="combobox"
            aria-expanded={showList}
            aria-controls={showList ? listId : undefined}
            aria-autocomplete="list"
            inputMode="search"
            autoComplete="off"
            disabled={disabled}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setTimeout(() => setIsFocus(false), 150)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
          />
          {verified ? (
            <Check
              aria-label="확인됨"
              className="size-4 shrink-0 text-success"
            />
          ) : (
            <Search aria-hidden className="size-4 shrink-0 text-ink-3" />
          )}
        </div>
      </div>
      {showList && (
        <SuggestList
          id={listId}
          items={suggestions}
          highlightedId={effectiveHighlightedId}
          onHighlight={setHighlightedId}
          onSelect={(item) => {
            onSelect?.(item);
            onChange(item.title);
            setIsFocus(false);
          }}
        />
      )}
    </div>
  );
}
