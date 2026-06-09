"use client";

import * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  computeTransferFatigue,
  type TransferFatigue,
} from "@/features/stress/transfer-fatigue";
import type { CommuteInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

// 스트레스 지수 지표1 — 환승 피로도 표시. detail-sheet commuteExtra slot 에 inject(부부/싱글 공용).
//   레벨은 라벨("낮음/보통/높음") 텍스트 + 색 배지 2중 표기(색 단독 의존 금지). "BEST 매칭" 배지 패턴 답습:
//   Badge size="xs"(헤더 pill 동일) + soft bg + deep 텍스트(fatigue-* variant). "환승 N회·도보 Nm"은 본문 텍스트.

const TONE_VARIANT: Record<
  TransferFatigue["tone"],
  Extract<BadgeProps["variant"], `fatigue-${string}`>
> = {
  success: "fatigue-low",
  warning: "fatigue-medium",
  danger: "fatigue-high",
};

interface FatigueItem {
  tag: "A" | "B";
  commute: CommuteInfo | undefined;
}

export function TransferFatigueSection({ items }: { items: FatigueItem[] }) {
  const rows = items
    .map((it) => ({ tag: it.tag, fatigue: computeTransferFatigue(it.commute) }))
    .filter(
      (r): r is { tag: "A" | "B"; fatigue: TransferFatigue } =>
        r.fatigue !== null,
    );

  if (rows.length === 0) return null;
  const showTag = rows.length > 1; // 부부 모드(A/B 둘 다)일 때만 태그 표시

  return (
    <section aria-label="환승 피로도" className="space-y-s-2">
      <p className="text-caption font-bold text-ink-2">환승 피로도</p>
      {rows.map(({ tag, fatigue }) => (
        <div
          key={tag}
          className="flex items-start gap-s-2 rounded-lg border border-card-border bg-surface px-s-4 py-s-3 shadow-card"
        >
          {showTag && (
            <span
              aria-hidden
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-caption-xs font-extrabold text-white",
                tag === "A" ? "bg-primary" : "bg-secondary",
              )}
            >
              {tag}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {fatigue.level === "none" ? (
              // 직통 — 긍정 강조를 배지 하나로.
              <Badge variant={TONE_VARIANT[fatigue.tone]} size="xs">
                {fatigue.label}
              </Badge>
            ) : (
              <p className="flex flex-wrap items-center gap-s-2 text-body-sm text-ink">
                <span className="font-bold">{fatigue.label}</span>
                {fatigue.levelLabel && (
                  <Badge variant={TONE_VARIANT[fatigue.tone]} size="xs">
                    피로도 {fatigue.levelLabel}
                  </Badge>
                )}
              </p>
            )}
            {fatigue.quip && (
              <p className="mt-s-1 text-caption text-ink-3">{fatigue.quip}</p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
