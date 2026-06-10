"use client";

import { ArrowUpRight, GraduationCap, Sparkles } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SummaryCardDTO } from "@/lib/types/deadline";

// UI-011 — 30분 요약 카드(동네 단위, Top3 비교). REQ-FUNC-018 — 항목 ≥6개/카드.
//   항목: ①동네명 ②예상 시세 ③직장A 통근 ④직장B 통근 ⑤생활 점수 ⑥추천 이유 ⑦네이버 버튼 (+⑧학교 선택)
//   ★ listing-card 네이버 아웃링크 + candidate-card 점수 tier(색 단독 금지 — 숫자+라벨 칩) 답습.
//   ★ rationale 은 Phase 1 이 비어있지 않음 보장(AI 또는 룰 fallback) → 빈 카드 0.

// 순위 배지 — #1 강조(best), #2·#3 은은하게.
const RANK_VARIANT: Record<number, BadgeProps["variant"]> = {
  1: "best",
  2: "secondary",
  3: "neutral",
};

// 생활 점수 → 라벨/색 (candidate-card scoreTier 답습 — 색 단독 금지 3중 표기).
function scoreTier(score: number): { label: string; text: string; chip: string } {
  if (score >= 90)
    return { label: "최상", text: "text-success", chip: "bg-success-soft text-success" };
  if (score >= 80)
    return { label: "우수", text: "text-primary", chip: "bg-primary-soft text-primary" };
  if (score >= 70)
    return { label: "양호", text: "text-warning", chip: "bg-warning-soft text-warning" };
  return { label: "보통", text: "text-ink-2", chip: "bg-bg text-ink-2" };
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-s-2 text-body-sm">
      <span className="shrink-0 text-ink-3">{label}</span>
      <span className="truncate font-bold text-ink">{value}</span>
    </div>
  );
}

interface SummaryCardProps {
  card: SummaryCardDTO;
}

export function SummaryCard({ card }: SummaryCardProps) {
  const tier = scoreTier(card.livingScore);
  const rankVariant = RANK_VARIANT[card.rank] ?? "neutral";
  const ariaLabel = `${card.rank}순위 추천 동네 ${card.candidateName}, 생활 점수 ${card.livingScore}점`;

  return (
    <article
      role="article"
      aria-label={ariaLabel}
      className="flex flex-col gap-s-3 rounded-lg border border-card-border bg-surface p-s-4 shadow-card"
    >
      <header className="flex items-start justify-between gap-s-2">
        <div className="min-w-0 flex-1">
          <Badge variant={rankVariant} size="xs">
            #{card.rank}
          </Badge>
          <h3 className="mt-s-1 truncate text-title font-bold text-ink">
            {card.candidateName}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-caption text-ink-3">생활 점수</p>
          <p className="text-ink-2">
            <span className={cn("tabular text-title-sm font-extrabold", tier.text)}>
              {card.livingScore}
            </span>
            점
            <span
              className={cn(
                "ml-s-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold",
                tier.chip,
              )}
            >
              {tier.label}
            </span>
          </p>
        </div>
      </header>

      <div className="space-y-s-1">
        <InfoRow label="예상 시세" value={card.estimatedPrice} />
        <InfoRow label="직장 A 통근" value={card.commuteToA} />
        <InfoRow label="직장 B 통근" value={card.commuteToB} />
        {card.schoolDistrict && (
          <div className="flex items-center justify-between gap-s-2 text-body-sm">
            <span className="flex shrink-0 items-center gap-1 text-ink-3">
              <GraduationCap aria-hidden className="size-3.5" />
              인근 학교
            </span>
            <span className="truncate font-bold text-ink">
              {card.schoolDistrict}
            </span>
          </div>
        )}
      </div>

      {/* 추천 이유 — AI(또는 룰 fallback). 따뜻한 한 줄. */}
      <div className="flex gap-s-1 rounded-md bg-bg px-s-3 py-s-2">
        <Sparkles aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-body-sm leading-relaxed text-ink-2">{card.rationale}</p>
      </div>

      <a
        href={card.naverSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${card.candidateName} 네이버 부동산에서 보기 (새 창)`}
        className="flex items-center justify-center gap-s-1 rounded-md border border-card-border py-s-2 text-body-sm font-bold text-primary transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        네이버 매물 보기
        <ArrowUpRight aria-hidden className="size-3.5" />
      </a>
    </article>
  );
}
