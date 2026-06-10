"use client";

import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiagnosisMode } from "@/lib/types";
import type { SummaryCardDTO } from "@/lib/types/deadline";

import { SummaryCard } from "./summary-card";

// UI-011 — 30분 요약 Top3 반응형 그리드. 모바일 1열 / 태블릿 2열 / 데스크탑 3열.
//   ★ 표시 전용 — 데이터 fetch·캐싱·"30분 요약" 버튼 연결은 Phase 3 (props 로 상태 주입).
//   ★ rationale 은 Phase 1 이 fallback 으로 비어있지 않음 보장 → SummaryCard 가 그대로 렌더(빈 카드 0).

const GRID_CLASS = "grid grid-cols-1 gap-s-3 md:grid-cols-2 lg:grid-cols-3";

// 로딩 스켈레톤 — SummaryCard 의 형태(헤더+행+버튼) 모사.
function SummaryCardSkeleton() {
  return (
    <div className="flex flex-col gap-s-3 rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
      <div className="flex items-start justify-between gap-s-2">
        <div className="flex-1 space-y-s-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-8 w-12" />
      </div>
      <div className="space-y-s-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

interface SummaryCardGridProps {
  cards: SummaryCardDTO[];
  mode: DiagnosisMode; // 싱글/부부 — 카드의 배우자 통근·학군 조건부 표시.
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function SummaryCardGrid({
  cards,
  mode,
  isLoading,
  error,
  onRetry,
}: SummaryCardGridProps) {
  if (isLoading) {
    return (
      <div className={GRID_CLASS} aria-busy="true" aria-label="30분 요약 불러오는 중">
        {[0, 1, 2].map((i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // 에러 + 표시할 카드 없음 → graceful 안내(크래시·빈 화면 금지).
  if (error && cards.length === 0) {
    return (
      <div className="space-y-s-2 rounded-lg border border-card-border bg-surface px-s-4 py-s-5 text-center">
        <p className="text-body-sm text-ink-3">지금은 요약을 불러올 수 없어요</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw aria-hidden className="size-3.5" />
            다시 시도
          </Button>
        )}
      </div>
    );
  }

  if (cards.length === 0) return null;

  return (
    <div className={GRID_CLASS}>
      {cards.map((card) => (
        <SummaryCard key={card.candidateId} card={card} mode={mode} />
      ))}
    </div>
  );
}
