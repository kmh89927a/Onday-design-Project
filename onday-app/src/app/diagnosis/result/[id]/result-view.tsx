"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  Share2,
} from "lucide-react";

import { DeadlineBanner } from "@/components/deadline/deadline-banner";
import { DeadlineBell } from "@/components/deadline/deadline-bell";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiagnosis } from "@/features/diagnosis/use-diagnosis";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useUIStore } from "@/stores/ui";

import { ResultContent } from "./result-content";

interface ResultViewProps {
  id: string;
}

export function ResultView({ id }: ResultViewProps) {
  const storeId = useDiagnosisStore((s) => s.diagnosisId);
  const storeCandidates = useDiagnosisStore((s) => s.candidates);
  const filters = useDiagnosisStore((s) => s.filters);
  const setResult = useDiagnosisStore((s) => s.setResult);
  const pushToast = useUIStore((s) => s.pushToast);

  const inSync = storeId === id && storeCandidates.length > 0;
  const query = useDiagnosis(inSync ? null : id);

  React.useEffect(() => {
    if (!inSync && query.data) {
      setResult(query.data.id, query.data.candidates);
    }
  }, [inSync, query.data, setResult]);

  const candidates = inSync ? storeCandidates : query.data?.candidates ?? [];
  const isLoading = !inSync && query.isLoading;
  const error = !inSync ? query.error : null;
  const showEmpty = !isLoading && !error && candidates.length === 0;

  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async () => {
    if (isSharing) return;
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
        <div className="mb-s-3">
          <DeadlineBanner />
        </div>
        {isLoading ? (
          <ResultSkeleton />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : showEmpty ? (
          <EmptyState />
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

function EmptyState() {
  return (
    <div className="rounded-lg border border-card-border bg-bg p-s-6 text-center">
      <p className="text-body font-bold text-ink">
        조건을 만족하는 동네가 없습니다
      </p>
      <ul className="mt-s-3 space-y-1 text-body-sm text-ink-3">
        <li>· 최대 통근 시간을 늘려보세요</li>
        <li>· 예산 범위를 조정해보세요</li>
      </ul>
      <Link href="/diagnosis" className="mt-s-4 inline-block">
        <Button variant="outline" leading={<ChevronLeft />}>
          진단 다시 입력
        </Button>
      </Link>
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
