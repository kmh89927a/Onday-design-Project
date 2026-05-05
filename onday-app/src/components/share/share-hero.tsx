import * as React from "react";

import { DataSourceBadge } from "@/components/data/data-source-badge";
import { cn } from "@/lib/utils";

// components-spec §31 ShareHero
//   <header><h1>title</h1></header>
//   brand + expiryChip + DataSourceBadge[]
//   primary-deep → primary 그라디언트 hero

interface DataSourceBadgeInput {
  kind: "official" | "aggregated" | "estimate";
  source: string;
  updatedAt: string;
}

interface ShareHeroProps {
  brand: string;
  brandLogo?: React.ReactNode;
  expiryChip?: string;
  title: React.ReactNode;
  badges?: DataSourceBadgeInput[];
  className?: string;
}

export function ShareHero({
  brand,
  brandLogo,
  expiryChip,
  title,
  badges = [],
  className,
}: ShareHeroProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-deep to-primary px-s-5 py-s-6 text-white shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-s-2">
        <div className="flex min-w-0 items-center gap-s-2">
          {brandLogo && (
            <span aria-hidden className="shrink-0">
              {brandLogo}
            </span>
          )}
          <p className="truncate text-caption font-bold tracking-wider opacity-90">
            {brand}
          </p>
        </div>
        {expiryChip && (
          <span
            aria-label={`${expiryChip} 공유`}
            className="shrink-0 rounded-sm bg-white/15 px-s-2 py-1 text-caption-xs font-bold backdrop-blur-sm"
          >
            {expiryChip}
          </span>
        )}
      </div>
      <h1 className="mt-s-4 text-h2 font-extrabold leading-snug tracking-[-0.03em]">
        {title}
      </h1>
      {badges.length > 0 && (
        <div className="mt-s-4 flex flex-wrap gap-s-2">
          {badges.map((b) => (
            <DataSourceBadge
              key={`${b.kind}-${b.source}`}
              kind={b.kind}
              source={b.source}
              updatedAt={b.updatedAt}
              tone="on-dark"
            />
          ))}
        </div>
      )}
    </header>
  );
}
