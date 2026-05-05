"use client";

import * as React from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// components-spec §10 Tabs (TimeTabs)
//   세그먼트 컨트롤. options ≥5면 가로 스크롤 + scroll-snap.
//   기존 Tabs(ui/) 위에 도메인 wrapper.

interface TimeTabsOption<T extends string> {
  value: T;
  label: string;
}

interface TimeTabsProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: TimeTabsOption<T>[];
  ariaLabel: string;
  children?: React.ReactNode;
  className?: string;
}

export function TimeTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  children,
  className,
}: TimeTabsProps<T>) {
  const overflow = options.length >= 5;
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as T)}
      aria-label={ariaLabel}
      className={className}
    >
      <TabsList
        className={cn(
          "w-full",
          overflow && "snap-x snap-mandatory overflow-x-auto",
        )}
      >
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className={cn(overflow && "snap-start")}
          >
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children &&
        options.map((opt) => (
          <TabsContent key={opt.value} value={opt.value} className="pt-s-3">
            {value === opt.value ? children : null}
          </TabsContent>
        ))}
    </Tabs>
  );
}
