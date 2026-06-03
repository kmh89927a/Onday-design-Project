"use client";

import * as React from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Figma 비전 (single_mode_vision 메모리) + wiki/concepts/single-mode.md
// 야간치안 / 편의시설 / 공원·도서관 — 1인 가구 핵심 Layer
//   ★ B 정책: 카페(유흥·야간 변수) → 공원·공공도서관(안전 커뮤니티 시설)로 교체.
export type SingleLayer = "safety" | "convenience" | "community";

const LAYER_OPTIONS: { value: SingleLayer; label: string; meta: string }[] = [
  { value: "safety", label: "야간 안전", meta: "범죄율 (10만명당)" },
  { value: "convenience", label: "편의시설", meta: "편의점 밀집도" },
  { value: "community", label: "공원·도서관", meta: "구 전체 공원·도서관 수" },
];

export const LAYER_META: Record<SingleLayer, string> = LAYER_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.meta }),
  {} as Record<SingleLayer, string>,
);

interface LayerToggleProps {
  value: SingleLayer;
  onChange: (next: SingleLayer) => void;
  className?: string;
}

export function LayerToggle({ value, onChange, className }: LayerToggleProps) {
  return (
    <div className={cn("space-y-s-2", className)}>
      <p className="text-caption font-bold text-ink">강조 Layer</p>
      <Tabs
        value={value}
        onValueChange={(next) => onChange(next as SingleLayer)}
        aria-label="강조 Layer 선택"
      >
        <TabsList className="w-full">
          {LAYER_OPTIONS.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value} className="flex-1">
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
