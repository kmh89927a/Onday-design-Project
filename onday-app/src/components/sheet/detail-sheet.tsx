"use client";

import * as React from "react";
import { Heart, Share2, TrainFront, Car } from "lucide-react";

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
  /** 부부 — "내 직장"/"배우자 직장" 보조 라벨. 싱글은 미설정. */
  who?: string;
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
  /** B (#졸업 지도) — header 아래 inject. 해당 추천지역 1곳 + 두 직장 + 연결선. */
  map?: React.ReactNode;
  /** commute rows와 metrics 사이 inject (예: TimeSlotSelector) */
  commuteExtra?: React.ReactNode;
  /** metrics와 primary CTA 사이 inject (예: 동네 하루 미리보기 AI 섹션) */
  dayPreview?: React.ReactNode;
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
  map,
  commuteExtra,
  dayPreview,
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

        {/* B (#졸업 지도) — 해당 추천지역 + 두 직장 + 연결선 (선택 후보 1곳 기준). */}
        {map && (
          <div className="overflow-hidden rounded-lg">{map}</div>
        )}

        {/* ★ W2B: 수단별 그룹 ([대중교통] A/B / [차량] A/B) + 방향 '동네→직장'.
            행 카드 디자인은 보존, 수단은 그룹 헤더 아이콘+라벨로 이동. */}
        <section aria-label="통근 정보" className="space-y-s-3">
          <div className="flex items-center justify-between">
            <p className="text-caption font-bold text-ink-2">통근 정보</p>
            <p className="text-caption-xs text-ink-3">동네 → 직장 기준</p>
          </div>
          {(
            [
              {
                key: "transit",
                icon: <TrainFront aria-hidden className="size-4 text-ink-3" />,
                label: "대중교통",
                rows: candidate.commutes.filter((c) => c.mode !== "car"),
              },
              {
                key: "car",
                icon: <Car aria-hidden className="size-4 text-ink-3" />,
                label: "차량",
                rows: candidate.commutes.filter((c) => c.mode === "car"),
              },
            ] as const
          ).map((group) =>
            group.rows.length === 0 ? null : (
              <div key={group.key} className="space-y-s-2">
                <p className="flex items-center gap-s-1 text-caption font-bold text-ink-2">
                  {group.icon}
                  {group.label}
                </p>
                {group.rows.map((c) => (
                  <div
                    key={`${c.tag}-${c.mode}`}
                    role="group"
                    aria-label={`${c.who ?? `${c.tag} 직장`}까지 ${group.label} ${c.minutes}분${
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
                      {/* 부부 — 누구 직장인지 보조 라벨(주소가 메인, 라벨은 보조). 싱글은 미설정. */}
                      {c.who && (
                        <p className="text-caption-xs font-bold text-ink-2">
                          {c.who}
                        </p>
                      )}
                      <p className="truncate text-body-sm font-bold text-ink">
                        {c.dest}
                      </p>
                      {c.detail && (
                        <p className="text-caption text-ink-3">{c.detail}</p>
                      )}
                    </div>
                    <span className="tabular text-title font-extrabold text-ink">
                      {c.minutes}
                      <span className="ml-0.5 text-caption font-normal text-ink-3">
                        분
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ),
          )}
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

        {dayPreview}

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
