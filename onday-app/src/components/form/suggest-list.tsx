"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

// components-spec §08 SuggestList
//   AddressInput 하단 자동완성 드롭다운
//   role=listbox + row role=option + aria-selected (highlighted)
//   키보드: ↑↓ 이동, Enter 선택, Esc 닫기 — AddressInput 측에서 처리

export interface AddressSuggestion {
  id: string;
  title: string;
  sub: string;
  kind: "지하철역" | "지역" | "회사" | "도로명" | "지번";
  /** 좌표 — 지오코딩 결과가 있을 때 onSelect 콜백을 통해 전달 */
  coordinate?: { lat: number; lng: number };
}

interface SuggestListProps {
  items: AddressSuggestion[];
  highlightedId?: string;
  onSelect: (item: AddressSuggestion) => void;
  onHighlight?: (id: string) => void;
  className?: string;
  id?: string;
}

export function SuggestList({
  items,
  highlightedId,
  onSelect,
  onHighlight,
  className,
  id,
}: SuggestListProps) {
  if (!items.length) return null;
  return (
    <ul
      id={id}
      role="listbox"
      className={cn(
        "mt-s-2 overflow-hidden rounded-lg border border-card-border bg-surface shadow-card",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === highlightedId;
        return (
          <li key={item.id}>
            <button
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelect(item)}
              onMouseEnter={() => onHighlight?.(item.id)}
              className={cn(
                "flex w-full items-center gap-s-3 px-s-4 py-s-3 text-left transition-colors",
                "hover:bg-bg",
                isActive && "bg-bg",
              )}
            >
              <MapPin aria-hidden className="size-4 shrink-0 text-ink-3" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-bold text-ink">
                  {item.title}
                </p>
                <p className="truncate text-caption text-ink-3">{item.sub}</p>
              </div>
              <span className="rounded-sm bg-bg px-1.5 py-0.5 text-caption-xs font-bold text-ink-3">
                {item.kind}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
