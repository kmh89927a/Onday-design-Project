import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  CommuteChip,
  MODE_LABELS,
  type CommuteMode,
} from "@/components/data/commute-chip";
import { cn } from "@/lib/utils";

// components-spec §20 CandidateCard
//   default 흰 카드 / best (rank=1 또는 best=true): primary-soft + border-primary + BEST 뱃지
//   hover translateY(-1px) + shadow-card-hover · focus-visible primary ring
//   aria-label 종합 ("마포구 공덕동, 매칭 점수 92점, 1위, A 통근 18분, B 통근 32분, 평균 시세 9.2억")
//   native <a> (href) 또는 <button> (onClick)

interface CommuteSummary {
  tag: "A" | "B";
  mode: CommuteMode;
  minutes: number;
}

interface CandidateCardProps {
  name: string;
  score: number;
  rank?: number;
  best?: boolean;
  commutes: CommuteSummary[];
  price: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function CandidateCard({
  name,
  score,
  rank,
  best,
  commutes,
  price,
  href,
  onClick,
  className,
}: CandidateCardProps) {
  const isBest = best ?? rank === 1;
  const commuteAria = commutes
    .map(
      (c) =>
        `${c.tag} ${MODE_LABELS[c.mode]} ${c.minutes}분`,
    )
    .join(", ");
  const ariaLabel = `${name}, 매칭 점수 ${score}점${
    rank ? `, ${rank}위` : ""
  }, ${commuteAria}, ${price}`;

  const inner = (
    <>
      <header className="flex items-start justify-between gap-s-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-s-2">
            <h3 className="text-title font-bold text-ink">{name}</h3>
            {isBest && <Badge variant="solid">BEST</Badge>}
          </div>
          <p className="mt-0.5 text-caption text-ink-3">
            매칭 점수{" "}
            <span
              className={cn(
                "tabular text-title-sm font-extrabold",
                isBest ? "text-primary" : "text-ink",
              )}
            >
              {score}
            </span>
            점
          </p>
        </div>
        {rank !== undefined && (
          <Badge variant={isBest ? "solid" : "neutral"} size="xs">
            {rank}위
          </Badge>
        )}
      </header>

      <div className="flex flex-wrap gap-s-2">
        {commutes.map((c) => (
          <CommuteChip
            key={c.tag}
            tag={c.tag}
            mode={c.mode}
            minutes={c.minutes}
          />
        ))}
      </div>

      <p className="text-body-sm font-bold text-ink-2">{price}</p>
    </>
  );

  const baseClass = cn(
    "block w-full rounded-lg border p-s-4 text-left transition-all",
    "shadow-card hover:-translate-y-px hover:shadow-card-hover",
    "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
    isBest
      ? "border-primary bg-primary-soft"
      : "border-card-border bg-surface",
    "space-y-s-3",
    className,
  );

  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} className={baseClass}>
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={baseClass}
    >
      {inner}
    </button>
  );
}
