import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/data/stat";
import { cn } from "@/lib/utils";

// components-spec §21 ReportCard
//   share 화면 후보 카드. 헤더(name + score) + 2×2 stats grid.
//   preview=true 시 ok pill "무료 미리보기".
//   <article><h3>name</h3>... aria-label="매칭 점수 92점"

interface ReportCardProps {
  name: string;
  score?: number;
  stats: { label: string; value: string }[];
  preview?: boolean;
  className?: string;
}

export function ReportCard({
  name,
  score,
  stats,
  preview,
  className,
}: ReportCardProps) {
  return (
    <article
      className={cn(
        "rounded-lg border border-card-border bg-surface p-s-4 shadow-card",
        "space-y-s-3",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-s-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-title font-bold text-ink">{name}</h3>
          {score !== undefined && (
            <p
              aria-label={`매칭 점수 ${score}점`}
              className="mt-0.5"
            >
              <span className="text-caption text-ink-3">매칭 점수 </span>
              <span className="tabular text-title-lg font-extrabold text-primary">
                {score}
              </span>
              <span className="text-caption text-ink-3">점</span>
            </p>
          )}
        </div>
        {preview && (
          <Badge variant="ok" size="xs">
            무료 미리보기
          </Badge>
        )}
      </header>

      <div className="grid grid-cols-2 gap-1.5">
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
    </article>
  );
}
