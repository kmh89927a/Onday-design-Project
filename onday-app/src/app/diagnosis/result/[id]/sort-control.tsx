"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseSortKey, type SortKey } from "@/features/diagnosis/result-utils";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "매칭점수" },
  { value: "commute", label: "통근" },
  { value: "price", label: "시세" },
];

interface SortControlProps {
  total: number;
  className?: string;
}

export function SortControl({ total, className }: SortControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = parseSortKey(searchParams.get("sort"));

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "score") params.delete("sort");
    else params.set("sort", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-s-3",
        className,
      )}
    >
      <p className="text-caption text-ink-3">
        총 <span className="tabular font-bold text-ink">{total}</span>개 결과
      </p>
      <Tabs value={sort} onValueChange={handleChange} aria-label="정렬 방식">
        <TabsList>
          {SORT_OPTIONS.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
