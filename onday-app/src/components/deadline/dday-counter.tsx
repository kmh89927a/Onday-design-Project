import * as React from "react";

import { cn } from "@/lib/utils";

// components-spec §26 DDayCounter
//   카운트다운 hero 카드. urgency normal/soon/critical
//   role=timer + aria-live="polite" + aria-label 종합
//   gradient: normal primary-deep→primary / soon + glow / critical danger

interface DDayCounterProps {
  daysLeft: number;
  targetDate: string;
  caption?: string;
  urgency?: "normal" | "soon" | "critical";
  className?: string;
}

export function DDayCounter({
  daysLeft,
  targetDate,
  caption = "MOVE-IN COUNTDOWN",
  urgency = "normal",
  className,
}: DDayCounterProps) {
  const isDDay = daysLeft <= 0;
  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`이사까지 ${
        isDDay ? "0일 (오늘)" : `${daysLeft}일 남음`
      }, 마감일 ${targetDate}`}
      className={cn(
        "relative overflow-hidden rounded-3xl px-s-5 py-s-6 shadow-card",
        // normal: 파스텔 + 좌측 4px primary accent line + deep 텍스트 (큰 면적 톤다운)
        urgency === "normal" &&
          "border border-primary/15 bg-gradient-to-br from-primary-pastel to-primary-soft text-primary-deep",
        // soon: 솔리드 그라디언트 + 흰 텍스트 + pulse (의도된 강조)
        urgency === "soon" &&
          "animate-pulse-soft bg-gradient-to-br from-primary-deep to-primary text-white",
        // critical: danger 그라디언트 + 흰 텍스트 (의도된 위급)
        urgency === "critical" &&
          "bg-gradient-to-br from-[hsl(0_84%_55%)] to-[hsl(0_74%_42%)] text-white",
        className,
      )}
    >
      {urgency === "normal" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary"
        />
      )}
      {urgency === "soon" && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-4 rounded-3xl bg-white/10 blur-xl"
        />
      )}
      <p
        aria-hidden
        className="text-caption-xs font-bold tracking-[0.2em] opacity-70"
      >
        {caption}
      </p>
      <div aria-hidden className="mt-s-2 flex items-baseline gap-s-2">
        <span className="text-caption-xs font-extrabold opacity-80">D-</span>
        <span className="tabular text-display-1 font-extrabold leading-none tracking-[-0.04em]">
          {isDDay ? "DAY" : Math.max(daysLeft, 0)}
        </span>
      </div>
      <p aria-hidden className="mt-s-3 text-body-sm font-bold opacity-90">
        마감일 · {targetDate}
      </p>
    </div>
  );
}
