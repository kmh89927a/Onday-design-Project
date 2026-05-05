"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { FilterChip } from "@/components/form/filter-chip";
import { TimeTabs } from "@/components/form/time-tabs";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

// components-spec §12 FilterPanel
//   TimeTabs(time bucket) + FilterChip 가로 + 우측 고급필터 IconButton
//   <section aria-label="후보 필터">

interface FilterPanelFilter {
  label: string;
  value: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

interface FilterPanelProps<T extends string> {
  time: T;
  onTimeChange: (next: T) => void;
  timeOptions: { value: T; label: string }[];
  filters: FilterPanelFilter[];
  onOpenAdvanced?: () => void;
  className?: string;
}

export function FilterPanel<T extends string>({
  time,
  onTimeChange,
  timeOptions,
  filters,
  onOpenAdvanced,
  className,
}: FilterPanelProps<T>) {
  return (
    <section aria-label="후보 필터" className={cn("space-y-s-3", className)}>
      <TimeTabs
        value={time}
        onChange={onTimeChange}
        options={timeOptions}
        ariaLabel="출근 시간대"
      />
      <div className="flex items-center gap-s-2">
        <div className="flex flex-1 gap-s-2">
          {filters.map((f) => (
            <FilterChip key={f.value} {...f} />
          ))}
        </div>
        {onOpenAdvanced && (
          <IconButton
            variant="bordered"
            icon={<SlidersHorizontal />}
            ariaLabel="고급 필터"
            onClick={onOpenAdvanced}
          />
        )}
      </div>
    </section>
  );
}
