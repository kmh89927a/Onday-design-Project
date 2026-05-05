"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Filter, FileDown } from "lucide-react";

import { SafetyCard } from "@/components/card/safety-card";
import { LegendBar } from "@/components/data/legend-bar";
import { DeadlineBanner } from "@/components/deadline/deadline-banner";
import { DeadlineBell } from "@/components/deadline/deadline-bell";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiagnosis } from "@/features/diagnosis/use-diagnosis";
import {
  getCrimePercent,
  getNightCrimeRate,
  getNightGradeLabel,
  getRadiusSub,
} from "@/features/single/safety-stats";
import type { CandidateArea, SafetyGrade } from "@/lib/types";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useUIStore } from "@/stores/ui";

import { LayerToggle, type SingleLayer } from "./layer-toggle";

interface SingleResultViewProps {
  id: string;
}

function fallbackGrade(c: CandidateArea): SafetyGrade {
  if (c.safetyGrade) return c.safetyGrade;
  const sum = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return (["A", "B", "C", "D"] as const)[sum % 4];
}

function priceText(c: CandidateArea): string {
  if (!c.priceRange) return "—";
  const avg = (c.priceRange.min + c.priceRange.max) / 2;
  return `${(avg / 10000).toFixed(1)}억`;
}

const GRADE_ORDER: Record<SafetyGrade, number> = { A: 0, B: 1, C: 2, D: 3 };

function sortByLayer(
  list: CandidateArea[],
  layer: SingleLayer,
): CandidateArea[] {
  const arr = [...list];
  switch (layer) {
    case "safety":
      return arr.sort(
        (a, b) => GRADE_ORDER[fallbackGrade(a)] - GRADE_ORDER[fallbackGrade(b)],
      );
    case "convenience":
      return arr.sort(
        (a, b) =>
          (b.facilities?.convenience ?? 0) - (a.facilities?.convenience ?? 0),
      );
    case "cafes":
      return arr.sort(
        (a, b) => (b.facilities?.cafes ?? 0) - (a.facilities?.cafes ?? 0),
      );
  }
}

function buildLayerStat(c: CandidateArea, layer: SingleLayer) {
  switch (layer) {
    case "safety": {
      const grade = fallbackGrade(c);
      return { label: "범죄", value: `${getNightCrimeRate(grade)}건` };
    }
    case "convenience":
      return {
        label: "편의점",
        value: `${c.facilities?.convenience ?? 0}개`,
      };
    case "cafes":
      return { label: "카페", value: `${c.facilities?.cafes ?? 0}개` };
  }
}

const LEGEND_META: Record<SingleLayer, { title: string; meta: string }> = {
  safety: {
    title: "야간 안전 등급 기준",
    meta: "22:00–04:00 · 반경 1km",
  },
  convenience: {
    title: "편의시설 밀집도 기준",
    meta: "편의점 + 약국 + 24시간 매장 · 반경 1km",
  },
  cafes: {
    title: "카페 밀집도 기준",
    meta: "스타벅스급 + 개인 카페 · 반경 1km",
  },
};

export function SingleResultView({ id }: SingleResultViewProps) {
  const pushToast = useUIStore((s) => s.pushToast);
  const storeId = useDiagnosisStore((s) => s.diagnosisId);
  const storeCandidates = useDiagnosisStore((s) => s.candidates);
  const storeAddressA = useDiagnosisStore((s) => s.addressA);
  const setResult = useDiagnosisStore((s) => s.setResult);

  const inSync = storeId === id && storeCandidates.length > 0;
  const query = useDiagnosis(inSync ? null : id);

  React.useEffect(() => {
    if (!inSync && query.data) {
      setResult(query.data.id, query.data.candidates);
    }
  }, [inSync, query.data, setResult]);

  const candidates = React.useMemo<CandidateArea[]>(
    () => (inSync ? storeCandidates : query.data?.candidates ?? []),
    [inSync, storeCandidates, query.data?.candidates],
  );
  const addressA = inSync ? storeAddressA : query.data?.addressA ?? "";
  const isLoading = !inSync && query.isLoading;
  const error = !inSync ? query.error : null;
  const showEmpty = !isLoading && !error && candidates.length === 0;

  const [layer, setLayer] = React.useState<SingleLayer>("safety");

  const sorted = React.useMemo(
    () => sortByLayer(candidates, layer),
    [candidates, layer],
  );

  const legend = LEGEND_META[layer];

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <AppHeader
        backHref="/diagnosis"
        title="싱글 모드 결과"
        trailing={<DeadlineBell />}
      />

      <div className="flex-1 px-s-5 pt-s-3 pb-s-8 space-y-s-4">
        {isLoading ? (
          <SingleSkeleton />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : showEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* 인쇄 시에만 보이는 리포트 헤더 (Onday 로고 + 발행일) */}
            <div className="hidden print:block border-b border-line pb-s-3">
              <p className="text-caption font-extrabold tracking-wider text-ink">
                동네궁합 · 싱글 모드 리포트
              </p>
              <p className="mt-1 text-caption-xs text-ink-3">
                발행 {new Date().toLocaleDateString("ko-KR")} · {addressA} 기준
              </p>
            </div>
            <div className="print:hidden">
              <DeadlineBanner />
            </div>
            <header className="flex items-start justify-between gap-s-3 print:hidden">
              <div>
                <p className="text-caption-xs font-bold tracking-wider text-primary">
                  싱글 모드 · {sorted.length}개 후보
                </p>
                <h1 className="mt-s-2 text-h3 font-extrabold leading-tight tracking-[-0.03em] text-ink">
                  야간 안전이 기준이에요
                </h1>
                <p className="mt-s-1 text-caption text-ink-3">{addressA} 기준</p>
              </div>
              <IconButton
                variant="bordered"
                icon={<Filter />}
                ariaLabel="필터"
                onClick={() =>
                  pushToast({
                    variant: "default",
                    message: "고급 필터는 다음 업데이트에 추가됩니다 ✨",
                  })
                }
              />
            </header>

            <div className="print:hidden">
              <LayerToggle value={layer} onChange={setLayer} />
            </div>

            <LegendBar title={legend.title} meta={legend.meta} />

            <section aria-label="후보 동네" className="space-y-s-3">
              {sorted.map((c) => {
                const grade = fallbackGrade(c);
                return (
                  <SafetyCard
                    key={c.id}
                    name={`${c.gu} ${c.dong}`}
                    sub={getRadiusSub(c.facilities)}
                    grade={grade}
                    gradeLabel={getNightGradeLabel(grade)}
                    metric={{
                      label: "야간 범죄율 (10만명당)",
                      value: getNightCrimeRate(grade),
                      unit: "건",
                    }}
                    barPercent={getCrimePercent(grade)}
                    stats={[
                      { label: "통근", value: `${c.commuteA.time}분` },
                      { label: "시세", value: priceText(c) },
                      buildLayerStat(c, layer),
                    ]}
                  />
                );
              })}
            </section>

            <Button
              fullWidth
              variant="outline"
              leading={<FileDown />}
              onClick={() => {
                // wiki/concepts/single-mode.md — window.print() + @media print, 라이브러리 0건
                pushToast({
                  variant: "default",
                  message: "PDF로 저장하려면 인쇄 대화상자에서 'PDF로 저장' 선택",
                });
                window.requestAnimationFrame(() => window.print());
              }}
              className="print:hidden"
            >
              리포트 저장 (PDF)
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

function SingleSkeleton() {
  return (
    <div className="space-y-s-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-6 w-32" />
      {["card-1", "card-2", "card-3"].map((id) => (
        <Skeleton key={id} className="h-[140px] w-full" />
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
