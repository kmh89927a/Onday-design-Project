"use client";

import * as React from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TIME_SLOTS = ["07:00", "08:00", "09:00", "10:00"] as const;
// Issue #106 ㊗ — 사용자 입력 HH:MM 자유 허용 (★ TimeSlotSelector는 4 옵션 시뮬레이션, 사용자 입력은 외부 string).
export type TimeSlot = string;

interface TimeSlotSelectorProps {
  value: TimeSlot;
  onChange: (next: TimeSlot) => void;
  className?: string;
}

export function TimeSlotSelector({
  value,
  onChange,
  className,
}: TimeSlotSelectorProps) {
  return (
    <div className={cn("space-y-s-2", className)}>
      <p className="text-caption text-ink-3">출근 시간대 시뮬레이션</p>
      <Tabs
        value={value}
        onValueChange={(next) => onChange(next as TimeSlot)}
        aria-label="출근 시간대"
      >
        <TabsList>
          {TIME_SLOTS.map((slot) => (
            <TabsTrigger key={slot} value={slot}>
              {slot}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
