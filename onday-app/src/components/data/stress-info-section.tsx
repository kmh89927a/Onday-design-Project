"use client";

import * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  computeTransferFatigue,
  type TransferFatigue,
} from "@/features/stress/transfer-fatigue";
import {
  computeRouteCongestion,
  type CongestionLevel,
  type RouteCongestion,
} from "@/features/stress/route-congestion";
import type { CommuteInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

// 스트레스 지수 2-C — 환승 피로도(지표1) + 출근길 혼잡도(지표2) 통합 표시.
//   detail-sheet commuteExtra slot 에 inject(부부/싱글 공용). 두 지표 동일 위계:
//   라벨(옅게·작게, 뒤로) + 결괏값(진하게, 앞으로). 색 배지는 fatigue-* 토큰 공용(이모지 X).

const FATIGUE_VARIANT: Record<
  TransferFatigue["tone"],
  Extract<BadgeProps["variant"], `fatigue-${string}`>
> = {
  success: "fatigue-low",
  warning: "fatigue-medium",
  danger: "fatigue-high",
};

// 혼잡도 레벨 → 배지(색 체계는 지표1 fatigue 토큰 재사용, 텍스트만·이모지 X).
const CONGESTION_BADGE: Record<
  CongestionLevel,
  { variant: BadgeProps["variant"]; word: string }
> = {
  low: { variant: "fatigue-low", word: "여유" },
  medium: { variant: "fatigue-medium", word: "꽤 붐빔" },
  high: { variant: "fatigue-high", word: "혼잡" },
  veryHigh: { variant: "fatigue-high", word: "매우 혼잡" },
};

interface StressItem {
  tag: "A" | "B";
  commute: CommuteInfo | undefined;
}

interface Row {
  tag: "A" | "B";
  fatigue: TransferFatigue | null;
  congestion: RouteCongestion | null;
}

/** 라벨(옅게) + 값(진하게) 위계 한 줄. */
function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // 라벨(옅게·작게, 고정폭 좌측) + 값(진하게, 우측 컬럼). 좁으면 값이 컬럼 안에서 wrap → 묶음 유지.
    <div className="flex gap-s-2">
      <p className="w-[4.75rem] shrink-0 pt-0.5 text-caption-xs text-ink-3">
        {label}
      </p>
      <div className="min-w-0 flex-1 text-body-sm text-ink">{children}</div>
    </div>
  );
}

function FatigueValue({ f }: { f: TransferFatigue }) {
  return (
    <>
      {f.level === "none" ? (
        <Badge variant={FATIGUE_VARIANT[f.tone]} size="xs">
          {f.label}
        </Badge>
      ) : (
        <p className="flex flex-wrap items-center gap-s-2">
          <span className="font-bold">{f.label}</span>
          {f.levelLabel && (
            <Badge variant={FATIGUE_VARIANT[f.tone]} size="xs">
              피로도 {f.levelLabel}
            </Badge>
          )}
        </p>
      )}
      {f.quip && <p className="mt-s-1 text-caption text-ink-2">{f.quip}</p>}
    </>
  );
}

function CongestionValue({ c }: { c: RouteCongestion }) {
  if (c.status === "no_data") {
    return (
      <>
        <Badge variant="neutral" size="xs">
          혼잡도 정보 미제공
        </Badge>
        <p className="mt-s-1 text-caption text-ink-3">
          아침 출근 시간대 · 1~8호선만 제공
        </p>
      </>
    );
  }

  const badge = CONGESTION_BADGE[c.level];
  const partial = c.coveredSegments < c.totalSubwaySegments;
  return (
    <>
      <p className="flex flex-wrap items-center gap-s-2">
        <span className="tabular font-bold">{c.percent}%</span>
        <Badge variant={badge.variant} size="xs">
          {badge.word}
        </Badge>
        {partial && (
          <Badge variant="neutral" size="xs">
            일부 구간 미제공
          </Badge>
        )}
      </p>
      <p className="mt-s-1 text-caption text-ink-2">{c.label}</p>
      {/* basisNote — 부가설명 위계: 연한 회색 박스 + 더 옅은 작은 글씨(본문/멘트와 구분). */}
      <p className="mt-s-1 w-fit max-w-full rounded-sm bg-muted px-s-2 py-0.5 text-caption-xs text-ink-3">
        {c.basisNote}
      </p>
    </>
  );
}

export function StressInfoSection({
  items,
  departureTime,
}: {
  items: StressItem[];
  departureTime?: string;
}) {
  const rows: Row[] = items
    .map((it) => ({
      tag: it.tag,
      fatigue: computeTransferFatigue(it.commute),
      congestion: computeRouteCongestion(it.commute, departureTime),
    }))
    .filter((r) => r.fatigue !== null || r.congestion !== null);

  if (rows.length === 0) return null;
  const showTag = rows.length > 1; // 부부 모드(A/B 둘 다)일 때만 태그

  return (
    <section aria-label="통근 스트레스" className="space-y-s-2">
      <p className="text-caption font-bold text-ink-2">통근 스트레스</p>
      {rows.map(({ tag, fatigue, congestion }) => (
        <div
          key={tag}
          className="flex items-start gap-s-2 rounded-lg border border-card-border bg-surface px-s-4 py-s-3 shadow-card"
        >
          {showTag && (
            <span
              aria-hidden
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-caption-xs font-extrabold text-white",
                tag === "A" ? "bg-primary" : "bg-secondary",
              )}
            >
              {tag}
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-s-3">
            {fatigue && (
              <Metric label="환승 피로도">
                <FatigueValue f={fatigue} />
              </Metric>
            )}
            {congestion && (
              <Metric label="출근길 혼잡도">
                <CongestionValue c={congestion} />
              </Metric>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
