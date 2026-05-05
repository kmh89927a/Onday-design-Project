"use client";

import * as React from "react";
import { Heart, Share2 } from "lucide-react";

import { type CommuteMode } from "@/components/data/commute-chip";
import { Stat } from "@/components/data/stat";
import { BottomSheet } from "@/components/sheet/bottom-sheet";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

// components-spec §25 DetailSheet
//   BottomSheet + 동네 상세 콘텐츠 composite
//   header(name + score + pills) + lines + commute rows + 3-col metrics + primary CTA
//   like/share IconButton 우상단

interface CommuteRowItem {
  tag: "A" | "B";
  dest: string;
  mode: CommuteMode;
  modeLabel: string;
  detail?: string;
  minutes: number;
}

interface DetailSheetCandidate {
  name: string;
  score: number;
  pills: { variant: BadgeProps["variant"]; label: string }[];
  lines: string;
  commutes: CommuteRowItem[];
  metrics: { label: string; value: string; sub?: string }[];
}

interface DetailSheetProps {
  open: boolean;
  onClose: () => void;
  candidate: DetailSheetCandidate;
  onLike?: () => void;
  liked?: boolean;
  onShare?: () => void;
  /** commute rows와 metrics 사이 inject (예: TimeSlotSelector) */
  commuteExtra?: React.ReactNode;
  primaryCta: {
    label: string;
    href?: string;
    onClick?: () => void;
    loading?: boolean;
  };
}

export function DetailSheet({
  open,
  onClose,
  candidate,
  onLike,
  liked,
  onShare,
  commuteExtra,
  primaryCta,
}: DetailSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel={`${candidate.name} 상세`}
      height="auto"
    >
      <section aria-label="동네 상세" className="space-y-s-4">
        <header className="space-y-s-2">
          <div className="flex items-start justify-between gap-s-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-h3 font-bold text-ink">{candidate.name}</h2>
              <p className="mt-1">
                <span className="text-caption text-ink-3">매칭 점수 </span>
                <span className="tabular text-h1 font-extrabold text-primary">
                  {candidate.score}
                </span>
                <span className="text-caption text-ink-3">점</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {onLike && (
                <IconButton
                  icon={
                    <Heart
                      className={cn(liked && "fill-danger text-danger")}
                    />
                  }
                  ariaLabel={liked ? "찜 해제" : "찜"}
                  aria-pressed={liked}
                  onClick={onLike}
                />
              )}
              {onShare && (
                <IconButton
                  icon={<Share2 />}
                  ariaLabel="공유"
                  onClick={onShare}
                />
              )}
            </div>
          </div>
          {candidate.pills.length > 0 && (
            <div className="flex flex-wrap gap-s-2">
              {candidate.pills.map((p) => (
                <Badge key={p.label} variant={p.variant} size="xs">
                  {p.label}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-caption text-ink-3">{candidate.lines}</p>
        </header>

        <section aria-label="통근 정보" className="space-y-s-2">
          {candidate.commutes.map((c) => (
            <div
              key={c.tag}
              role="group"
              aria-label={`${c.tag} 직장까지 ${c.modeLabel} ${c.minutes}분${
                c.detail ? `, ${c.detail}` : ""
              }`}
              className="flex items-center gap-s-3 rounded-lg border border-card-border bg-surface px-s-4 py-s-3 shadow-card"
            >
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-sm text-caption-xs font-extrabold text-white",
                  c.tag === "A" ? "bg-primary" : "bg-secondary",
                )}
              >
                {c.tag}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-bold text-ink">
                  {c.dest}
                </p>
                <p className="text-caption text-ink-3">
                  {c.modeLabel}
                  {c.detail ? ` · ${c.detail}` : ""}
                </p>
              </div>
              <span className="tabular text-title font-extrabold text-ink">
                {c.minutes}
                <span className="ml-0.5 text-caption font-normal text-ink-3">
                  분
                </span>
              </span>
            </div>
          ))}
        </section>

        {commuteExtra}

        {candidate.metrics.length > 0 && (
          <div className="flex rounded-lg border border-card-border bg-surface py-s-2 shadow-card">
            {candidate.metrics.map((m) => (
              <Stat
                key={m.label}
                variant="metric"
                label={m.label}
                value={m.value}
                sub={m.sub}
                className="flex-1"
              />
            ))}
          </div>
        )}

        {primaryCta.href ? (
          <Button
            fullWidth
            loading={primaryCta.loading}
            render={<a href={primaryCta.href} />}
          >
            {primaryCta.label}
          </Button>
        ) : (
          <Button
            fullWidth
            loading={primaryCta.loading}
            onClick={primaryCta.onClick}
          >
            {primaryCta.label}
          </Button>
        )}
      </section>
    </BottomSheet>
  );
}
