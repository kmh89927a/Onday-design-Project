"use client";

import * as React from "react";

import {
  computeTransferFatigue,
  type TransferFatigue,
} from "@/features/stress/transfer-fatigue";
import type { CommuteInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

// 스트레스 지수 지표1 — 환승 피로도 표시. detail-sheet commuteExtra slot 에 inject(부부/싱글 공용).
//   레벨은 라벨("낮음/보통/높음") + 색 토큰 + emoji 3중 표기(색 단독 의존 금지, 안전등급 규칙 답습).
//   색은 status 토큰보다 muted·deep 한 fatigue 전용 토큰(흰 카드 위 가독성·앱 톤 융화, dark lighten).

const TONE_CLASS: Record<TransferFatigue["tone"], string> = {
  success: "text-fatigue-low",
  warning: "text-fatigue-medium",
  danger: "text-fatigue-high",
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
            <p className="text-body-sm text-ink">
              <span className="font-bold">{fatigue.label}</span>
              {fatigue.levelLabel ? (
                <span
                  className={cn("ml-s-2 font-bold", TONE_CLASS[fatigue.tone])}
                >
                  피로도 {fatigue.levelLabel} {fatigue.emoji}
                </span>
              ) : (
                <span className="ml-s-2">{fatigue.emoji}</span>
              )}
            </p>
            {fatigue.quip && (
              <p className="text-caption text-ink-3">{fatigue.quip}</p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
