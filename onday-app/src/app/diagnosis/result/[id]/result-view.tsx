"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  Home,
  Loader2,
  Share2,
} from "lucide-react";

import { DeadlineBanner } from "@/components/deadline/deadline-banner";
import { DeadlineBell } from "@/components/deadline/deadline-bell";
import { DeadlineEntryCard } from "@/components/deadline/deadline-entry-card";
import { FavoritesMenu } from "@/components/favorites/favorites-menu";
import { EmptyState } from "@/components/diagnosis/empty-state";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { runMockDiagnosis } from "@/features/diagnosis/mock-calculator";
import { liftLegacyDealType } from "@/features/diagnosis/result-utils";
import { useDiagnosis } from "@/features/diagnosis/use-diagnosis";
import { trackDiagnosisCompleted, trackShareLinkCreated } from "@/lib/analytics/mixpanel";
import { generateRelaxationSuggestions } from "@/lib/diagnosis/generate-suggestions";
import type { DiagnosisFilters } from "@/lib/types";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useUIStore } from "@/stores/ui";
import { useGuestGate } from "@/features/auth/use-guest-gate";

import { ResultContent } from "./result-content";

interface ResultViewProps {
  id: string;
}

export function ResultView({ id }: ResultViewProps) {
  const storeId = useDiagnosisStore((s) => s.diagnosisId);
  const storeCandidates = useDiagnosisStore((s) => s.candidates);
  const filters = useDiagnosisStore((s) => s.filters);
  const setResult = useDiagnosisStore((s) => s.setResult);
  // Issue #108 ㊙ — 시나리오 B (페이지 reload / 직접 URL 접속) filters store 박힘 (★ "사용자 입력 → 결과" 자연 흐름 양방향 정합).
  const setFilters = useDiagnosisStore((s) => s.setFilters);
  // Issue #125 — EmptyState SuggestionButton 클릭 시 runMockDiagnosis 재계산 (★ what-if 답습 #5).
  const coordinateA = useDiagnosisStore((s) => s.coordinateA);
  const coordinateB = useDiagnosisStore((s) => s.coordinateB);
  const mode = useDiagnosisStore((s) => s.mode);
  const leisureCoordA = useDiagnosisStore((s) => s.leisureCoordA);
  const leisureCoordB = useDiagnosisStore((s) => s.leisureCoordB);
  const pushToast = useUIStore((s) => s.pushToast);
  const guestGate = useGuestGate();

  // ★ 버그수정: length>0 제거 — 토글/필터로 결과가 0개가 돼도 "미로드"로 오판해 DB 원본을
  //   재로드(dealType 롤백)하던 것 방지. 정당한 0개 결과는 EmptyState(완화 제안)로 처리.
  const inSync = storeId === id;
  const query = useDiagnosis(inSync ? null : id);

  React.useEffect(() => {
    if (!inSync && query.data) {
      setResult(query.data.id, query.data.candidates);
      setFilters(liftLegacyDealType(query.data.filters));
    }
  }, [inSync, query.data, setResult, setFilters]);

  // MON-003 v1.4 부활 (Issue #127) — REQ-NF-008 funnel 완료점.
  //   ref 가드 = React Strict Mode 2회 실행 + 같은 id 재마운트 중복 방지.
  const trackedRef = React.useRef(false);
  React.useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackDiagnosisCompleted(id);
  }, [id]);

  const candidates = inSync ? storeCandidates : query.data?.candidates ?? [];
  const isLoading = !inSync && query.isLoading;
  const error = !inSync ? query.error : null;
  const showEmpty = !isLoading && !error && candidates.length === 0;

  // Issue #125 — REQ-FUNC-008 AC-4 본 ISSUE 진짜 본질 (★ Phase A 사전 박힘 80% 위에 박힘).
  //   ★ what-if 답습 패턴 정수 (#111/#118/#120/#112 → 본 ISSUE = 5번째 사례).
  const suggestions = React.useMemo(
    () => (showEmpty ? generateRelaxationSuggestions(filters) : []),
    [showEmpty, filters],
  );

  const handleApplyRelaxation = async (apply: Partial<DiagnosisFilters>) => {
    if (!coordinateA) {
      pushToast({
        variant: "default",
        message: "페이지 새로고침 후 다시 시도해주세요",
      });
      return;
    }
    const newFilters = { ...filters, ...apply };
    setFilters(newFilters);
    try {
      const next = await runMockDiagnosis(
        coordinateA,
        coordinateB,
        newFilters,
        mode,
        leisureCoordA,
        leisureCoordB,
      );
      setResult(id, next);
      pushToast({
        variant: "ok",
        message: "조건을 완화해서 다시 계산했어요",
      });
    } catch {
      pushToast({ variant: "danger", message: "재계산에 실패했습니다" });
    }
  };

  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    if (guestGate("share")) return;
    setIsSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosisId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "공유 링크 생성에 실패했습니다");
      }
      const data: { shareUrl: string } = await res.json();
      // ★ Referral 퍼널 — 생성 성공. diagnosis_id·mode 만(공유 토큰 shareUrl 미포함, PII 0).
      trackShareLinkCreated(id, mode);
      const absolute = `${window.location.origin}${data.shareUrl}`;
      await copyToClipboard(absolute);
      pushToast({
        variant: "ok",
        message: "공유 링크가 복사되었습니다",
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "공유 링크 생성에 실패했습니다";
      pushToast({ variant: "danger", message: msg });
    } finally {
      setIsSharing(false);
    }
  };

  const headerTitle =
    candidates.length > 0 ? `후보 ${candidates.length}개 동네` : "진단 결과";

  return (
    <main className="flex min-h-screen flex-col bg-surface">
      <AppHeader
        backHref="/diagnosis"
        title={headerTitle}
        trailing={
          <>
            {/* PR A — 홈(진단 시작 입력) 이동 버튼. 기존 헤더 아이콘과 동일 IconButton 스타일. */}
            <IconButton icon={<Home />} ariaLabel="진단 시작 화면으로" href="/diagnosis" />
            <FavoritesMenu />
            <DeadlineBell />
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
              aria-label="진단 결과 공유 링크 생성"
            >
              {isSharing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Share2 className="size-3.5" />
              )}
              {isSharing ? "생성중" : "공유"}
            </Button>
          </>
        }
      />

      <div className="flex-1 px-s-5 pb-s-8 pt-s-3">
        <div className="mb-s-3 space-y-s-3">
          <DeadlineBanner />
          {!isLoading && !error && !showEmpty && <DeadlineEntryCard />}
        </div>
        {isLoading ? (
          <ResultSkeleton />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : showEmpty ? (
          <EmptyState
            suggestions={suggestions}
            onApply={handleApplyRelaxation}
          />
        ) : (
          <ResultContent
            candidates={candidates}
            filters={filters}
            onShare={handleShare}
          />
        )}
      </div>
    </main>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-s-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-[320px] w-full" />
      <Skeleton className="h-6 w-32" />
      {["card-1", "card-2", "card-3"].map((id) => (
        <Skeleton key={id} className="h-[112px] w-full" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-s-3 rounded-lg border border-danger/40 bg-danger/5 p-s-6 text-center"
    >
      <AlertCircle aria-hidden className="size-8 text-danger" />
      <p className="text-body font-bold text-ink">진단 결과를 불러올 수 없습니다</p>
      <p className="text-body-sm text-ink-3">{message}</p>
      <Link href="/diagnosis" className="mt-s-2 inline-block">
        <Button variant="outline" leading={<ChevronLeft />}>
          진단 다시 입력
        </Button>
      </Link>
    </div>
  );
}
