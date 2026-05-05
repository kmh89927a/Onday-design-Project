"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

// components-spec §27 MiniCalendar
//   year/month + inRange[] + target + onPrev/onNext/onSelect
//   cell: default ink-2 / in-range primary-soft+primary / target primary+white
//   role=grid · weekday role=columnheader · cell role=gridcell + aria-selected
//   target은 aria-current="date"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const MONTH_NAMES = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

interface MiniCalendarProps {
  year: number;
  month: number; // 1–12
  inRange?: number[];
  target?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onSelect?: (day: number) => void;
  className?: string;
}

export function MiniCalendar({
  year,
  month,
  inRange = [],
  target,
  onPrev,
  onNext,
  onSelect,
  className,
}: MiniCalendarProps) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const inRangeSet = new Set(inRange);
  const interactive = Boolean(onSelect);

  return (
    <div
      role="grid"
      aria-label={`${year}년 ${MONTH_NAMES[month - 1]}`}
      className={cn(
        "rounded-lg border border-card-border bg-surface p-s-3 shadow-card",
        className,
      )}
    >
      <header className="mb-s-2 flex items-center justify-between">
        <IconButton
          icon={<ChevronLeft />}
          ariaLabel="이전 달"
          onClick={onPrev}
          disabled={!onPrev}
        />
        <p className="text-title font-bold text-ink">
          {year}.{String(month).padStart(2, "0")}
        </p>
        <IconButton
          icon={<ChevronRight />}
          ariaLabel="다음 달"
          onClick={onNext}
          disabled={!onNext}
        />
      </header>
      <div role="row" className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            role="columnheader"
            className="py-1 text-center text-caption-xs font-bold text-ink-3"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} aria-hidden />;
          const isTarget = day === target;
          const isInRange = inRangeSet.has(day);
          const Comp = interactive ? "button" : "div";
          return (
            <Comp
              key={day}
              role="gridcell"
              aria-selected={isTarget || isInRange}
              aria-current={isTarget ? "date" : undefined}
              type={interactive ? "button" : undefined}
              onClick={interactive ? () => onSelect?.(day) : undefined}
              className={cn(
                "flex h-7 items-center justify-center rounded-sm text-caption tabular text-ink-2 transition-colors",
                // target: pastel(90%) + deep 텍스트 + inset ring (큰 면적 강조)
                isTarget &&
                  "bg-primary-pastel text-primary-deep font-extrabold ring-2 ring-inset ring-primary",
                // in-range: soft(95%) — target보다 한 단계 옅음
                !isTarget && isInRange && "bg-primary-soft text-primary",
                interactive && !isTarget && "hover:bg-bg",
                interactive &&
                  "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1",
              )}
            >
              {day}
            </Comp>
          );
        })}
      </div>
    </div>
  );
}
