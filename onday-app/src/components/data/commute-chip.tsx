import * as React from "react";
import { Bus, Car, Footprints, TrainFront } from "lucide-react";

import { cn } from "@/lib/utils";

// components-spec §17 CommuteChip
//   tag A/B + mode icon + minutes
//   chip(result, 컴팩트) / row(detail, full width)
//   aria-label 종합 ("A 직장까지 지하철 18분, 환승 1회")

export type CommuteMode = "subway" | "bus" | "car" | "walk";

const MODE_ICONS: Record<CommuteMode, React.ComponentType<{ className?: string }>> = {
  subway: TrainFront,
  bus: Bus,
  car: Car,
  walk: Footprints,
};

const MODE_LABELS: Record<CommuteMode, string> = {
  subway: "지하철",
  bus: "버스",
  car: "차량",
  walk: "도보",
};

export interface CommuteChipProps {
  tag: "A" | "B";
  mode: CommuteMode;
  minutes: number;
  detail?: string;
  variant?: "chip" | "row";
  className?: string;
}

export function CommuteChip({
  tag,
  mode,
  minutes,
  detail,
  variant = "chip",
  className,
}: CommuteChipProps) {
  const Icon = MODE_ICONS[mode];
  const aria = `${tag} 직장까지 ${MODE_LABELS[mode]} ${minutes}분${
    detail ? `, ${detail}` : ""
  }`;
  return (
    <div
      role="group"
      aria-label={aria}
      className={cn(
        variant === "chip"
          ? "inline-flex items-center gap-s-2 rounded-md border border-line-2 bg-surface px-s-3 py-1.5"
          : "flex w-full items-center gap-s-3 rounded-lg border border-card-border bg-surface px-s-4 py-s-3 shadow-card",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-xs text-caption-xs font-extrabold text-white",
          tag === "A" ? "bg-primary" : "bg-secondary",
        )}
      >
        {tag}
      </span>
      <Icon
        aria-hidden
        className={cn(
          "shrink-0 text-ink-3",
          variant === "chip" ? "size-3.5" : "size-4",
        )}
      />
      <div
        className={cn(
          "flex min-w-0 flex-1 items-baseline gap-1",
          variant === "row" && "justify-between",
        )}
      >
        <span className="tabular text-body font-bold text-ink">
          {minutes}
          <span className="ml-0.5 text-caption font-normal text-ink-3">분</span>
        </span>
        {detail && variant === "row" && (
          <span className="text-caption text-ink-3">{detail}</span>
        )}
      </div>
    </div>
  );
}

export { MODE_LABELS };
