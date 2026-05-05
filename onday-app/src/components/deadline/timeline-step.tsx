import * as React from "react";
import { Check } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// components-spec §28 TimelineStep
//   status: done(✓ + 채움) / now(보더+글로우+카드 primary-soft) / todo(보더 line + 흰)
//   stage(D-30) + label(매물 탐색) + sub + pill
//   부모: <ol role="list" aria-label="이사 체크리스트">
//   position first/middle/last로 라인 마스킹

type StepStatus = "done" | "now" | "todo";

interface TimelineStepProps {
  status: StepStatus;
  stage: string;
  label: string;
  sub?: string;
  pill?: { variant: BadgeProps["variant"]; label: string };
  position?: "first" | "middle" | "last";
  className?: string;
}

export function TimelineStep({
  status,
  stage,
  label,
  sub,
  pill,
  position = "middle",
  className,
}: TimelineStepProps) {
  const statusLabel =
    status === "done" ? "완료" : status === "now" ? "진행 중" : "예정";
  return (
    <li
      role="listitem"
      aria-current={status === "now" ? "step" : undefined}
      aria-label={`${stage} ${label} — ${statusLabel}`}
      className={cn("relative flex gap-s-3 pb-s-4", className)}
    >
      {/* 좌측: 점 + 수직 라인 */}
      <div className="relative flex w-6 shrink-0 flex-col items-center">
        {/* 라인 */}
        <span
          aria-hidden
          className={cn(
            "absolute left-1/2 w-px -translate-x-1/2 bg-line-2",
            position === "first" ? "top-3 bottom-0" : "inset-y-0",
            position === "last" && "bottom-auto top-3 h-3",
          )}
        />
        {/* 점 */}
        <span
          aria-hidden
          className={cn(
            "relative z-10 mt-1 inline-flex size-6 items-center justify-center rounded-full border-2 transition-shadow",
            status === "done" && "border-primary bg-primary text-white",
            status === "now" &&
              "border-primary bg-surface text-primary shadow-marker",
            status === "todo" && "border-line bg-surface",
          )}
        >
          {status === "done" && <Check className="size-3.5" />}
          {status === "now" && (
            <span className="size-2 rounded-full bg-primary" />
          )}
        </span>
      </div>

      {/* 우측: 카드 */}
      <div
        className={cn(
          "min-w-0 flex-1 rounded-lg border p-s-3 transition-shadow",
          status === "now"
            ? "border-primary bg-primary-soft"
            : "border-card-border bg-surface shadow-card",
          "hover:shadow-card-hover",
        )}
      >
        <div className="flex items-center justify-between gap-s-2">
          <p
            className={cn(
              "text-caption-xs font-extrabold tracking-wider",
              status === "now" ? "text-primary" : "text-ink-3",
            )}
          >
            {stage}
          </p>
          {pill && (
            <Badge size="xs" variant={pill.variant}>
              {pill.label}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-title font-bold text-ink">{label}</p>
        {sub && <p className="mt-0.5 text-caption text-ink-3">{sub}</p>}
      </div>
    </li>
  );
}
