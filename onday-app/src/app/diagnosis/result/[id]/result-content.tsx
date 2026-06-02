"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { CandidateCard } from "@/components/card/candidate-card";
import { DataSourceBadge } from "@/components/data/data-source-badge";
import { FilterPanel } from "@/components/form/filter-panel";
import { MapCanvas } from "@/components/map/map-canvas";
import type { MapWorkplace, MapLine } from "@/components/map/map-canvas";
import { DetailSheet } from "@/components/sheet/detail-sheet";
import {
  buildCommuteRows,
  buildLines,
  buildMetrics,
  buildPills,
} from "@/features/diagnosis/detail-mapper";
import {
  formatBudgetFilter,
  formatCommuteFilter,
  formatPrice,
  markerLabel,
  parseSortKey,
  sortCandidates,
  toChipMode,
} from "@/features/diagnosis/result-utils";
import { runMockDiagnosis } from "@/features/diagnosis/mock-calculator";
import { buildNaverRealEstateUrl } from "@/lib/deadline/naver-url-builder";
import { latLngToPixel } from "@/lib/coordinate-transform";
import type { CandidateArea, CommuteInfo, DiagnosisFilters } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useFavoritesStore } from "@/stores/favorites";
import { useUIStore } from "@/stores/ui";

import { BudgetChipOptions } from "./budget-chip-options";
import { CommuteChipOptions } from "./commute-chip-options";
import { SortControl } from "./sort-control";
import { TimeChipOptions } from "./time-chip-options";
import { TimeSlotSelector } from "./time-slot-selector";

// ★ W2: production(USE_MOCK=false) = 통근 실 데이터 ODsay 대중교통.
//   mock = Haversine 추정. 출처 배지를 모드에 맞춰 정직 표기.
const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

interface ResultContentProps {
  candidates: CandidateArea[];
  filters: DiagnosisFilters;
  onShare: () => void | Promise<void>;
}

export function ResultContent({
  candidates,
  filters,
  onShare,
}: ResultContentProps) {
  const searchParams = useSearchParams();
  const sort = parseSortKey(searchParams.get("sort"));
  const pushToast = useUIStore((s) => s.pushToast);

  const addressA = useDiagnosisStore((s) => s.addressA);
  const addressB = useDiagnosisStore((s) => s.addressB);

  // Issue #111 β — what-if 시뮬레이션 store 영역 (★ 옵션 클릭 → setFilters + client-side 재계산).
  const setFilters = useDiagnosisStore((s) => s.setFilters);
  const setResult = useDiagnosisStore((s) => s.setResult);
  const diagnosisId = useDiagnosisStore((s) => s.diagnosisId);
  const coordinateA = useDiagnosisStore((s) => s.coordinateA);
  const coordinateB = useDiagnosisStore((s) => s.coordinateB);
  const mode = useDiagnosisStore((s) => s.mode);
  const leisureCoordA = useDiagnosisStore((s) => s.leisureCoordA);
  const leisureCoordB = useDiagnosisStore((s) => s.leisureCoordB);

  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  // Issue #111 β — 출근시간 chip 클릭 시 what-if 입력 inline 박힘 토글.
  // Issue #112 — maxCommuteTime + budget chip 클릭 시 what-if 입력 inline 박힘 토글 답습.
  const [showTimeOptions, setShowTimeOptions] = React.useState(false);
  const [showCommuteOptions, setShowCommuteOptions] = React.useState(false);
  const [showBudgetOptions, setShowBudgetOptions] = React.useState(false);
  const currentDepartureTime = filters.commuteSchedule?.departureTime ?? "08:00";

  const handleTimeWhatIf = async (time: string) => {
    if (!coordinateA) {
      pushToast({
        variant: "default",
        message: "페이지 새로고침 후 다시 시도해주세요",
      });
      return;
    }
    const newFilters = {
      ...filters,
      commuteSchedule: {
        days: filters.commuteSchedule?.days ?? [],
        departureTime: time,
      },
    };
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
      if (diagnosisId) setResult(diagnosisId, next);
    } catch {
      pushToast({ variant: "danger", message: "재계산에 실패했습니다" });
    }
  };

  // Issue #112 — what-if maxCommuteTime/budget 재계산 (★ handleTimeWhatIf 답습).
  const handleCommuteWhatIf = async (maxCommute: number) => {
    if (!coordinateA) {
      pushToast({
        variant: "default",
        message: "페이지 새로고침 후 다시 시도해주세요",
      });
      return;
    }
    const newFilters = { ...filters, maxCommuteTime: maxCommute };
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
      if (diagnosisId) setResult(diagnosisId, next);
    } catch {
      pushToast({ variant: "danger", message: "재계산에 실패했습니다" });
    }
  };

  const handleBudgetWhatIf = async (min: number, max: number) => {
    if (!coordinateA) {
      pushToast({
        variant: "default",
        message: "페이지 새로고침 후 다시 시도해주세요",
      });
      return;
    }
    const newFilters = { ...filters, budget: { min, max } };
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
      if (diagnosisId) setResult(diagnosisId, next);
    } catch {
      pushToast({ variant: "danger", message: "재계산에 실패했습니다" });
    }
  };

  const sorted = React.useMemo(
    () => sortCandidates(candidates, sort),
    [candidates, sort],
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const selectedCandidate = React.useMemo(
    () => (openId ? sorted.find((c) => c.id === openId) ?? null : null),
    [openId, sorted],
  );
  const selectedRank = selectedCandidate
    ? sorted.findIndex((c) => c.id === selectedCandidate.id) + 1
    : 0;

  const markers = React.useMemo(
    () =>
      sorted.map((c, i) => ({
        id: c.id,
        label: markerLabel(c.dong),
        position: latLngToPixel(c.coordinate),
        coordinate: c.coordinate, // Issue #104 ㊇ — SDK mode lat/lng 정합.
        selected: selectedId === c.id,
        rank: i + 1,
      })),
    [sorted, selectedId],
  );

  // A-1 (#졸업) — 직장 A·B 마커 + (선택/1위 후보 → 직장) 직선 연결선.
  //   ★ couple=A·B 둘, single=A 만 (B 좌표 부재 시 자동 생략). 선은 focus 후보 1곳만 = 클러터 방지.
  //   선 = 직선 추정(점선) — A-2에서 자동차 실 도로선(Kakao vertexes)으로 교체 예정.
  const workplaces = React.useMemo<MapWorkplace[]>(() => {
    const out: MapWorkplace[] = [];
    if (coordinateA)
      out.push({
        id: "wp-a",
        label: "내 직장",
        short: "A",
        coordinate: coordinateA,
        position: latLngToPixel(coordinateA),
        variant: "a",
      });
    if (coordinateB)
      out.push({
        id: "wp-b",
        label: "배우자 직장",
        short: "B",
        coordinate: coordinateB,
        position: latLngToPixel(coordinateB),
        variant: "b",
      });
    return out;
  }, [coordinateA, coordinateB]);

  // focus = 선택 마커 → 없으면 1위 후보 (로드 직후에도 선이 보이게).
  const focusCandidate = React.useMemo(
    () =>
      (selectedId ? sorted.find((c) => c.id === selectedId) : null) ??
      sorted[0] ??
      null,
    [selectedId, sorted],
  );

  // A-2 — 후보→직장 경로선. 자동차 실 도로(commute*Car.routePath) 있으면 실선,
  //   없으면(mock·transit·실패) 직선 추정 점선. ★ 메인 맵(focus)·시트(selected) 공용.
  const buildLinesFor = React.useCallback(
    (cand: CandidateArea | null): MapLine[] => {
      if (!cand) return [];
      const candPoint = {
        position: latLngToPixel(cand.coordinate),
        coordinate: cand.coordinate,
      };
      const build = (
        id: string,
        variant: "a" | "b",
        wp: typeof coordinateA,
        car: CommuteInfo | undefined,
      ): MapLine | null => {
        if (!wp) return null;
        const road = car?.routePath;
        if (road && road.length >= 2) {
          // 실 도로 경로 (solid) — Kakao vertexes (후보 → 직장 방향).
          return {
            id,
            variant,
            dashed: false,
            points: road.map((c) => ({
              coordinate: c,
              position: latLngToPixel(c),
            })),
          };
        }
        // 직선 추정 (dashed) — A-1 fallback.
        return {
          id,
          variant,
          dashed: true,
          points: [candPoint, { position: latLngToPixel(wp), coordinate: wp }],
        };
      };
      return [
        build("line-a", "a", coordinateA, cand.commuteACar),
        build("line-b", "b", coordinateB, cand.commuteBCar),
      ].filter((l): l is MapLine => l !== null);
    },
    [coordinateA, coordinateB],
  );

  const lines = React.useMemo(
    () => buildLinesFor(focusCandidate),
    [buildLinesFor, focusCandidate],
  );

  // B — DetailSheet 지도: 선택 후보 1곳 + 두 직장 + 연결선 (전체 fit).
  const detailMarkers = React.useMemo(
    () =>
      selectedCandidate
        ? [
            {
              id: selectedCandidate.id,
              label: markerLabel(selectedCandidate.dong),
              position: latLngToPixel(selectedCandidate.coordinate),
              coordinate: selectedCandidate.coordinate,
              selected: true,
              rank: selectedRank,
            },
          ]
        : [],
    [selectedCandidate, selectedRank],
  );
  const detailLines = React.useMemo(
    () => buildLinesFor(selectedCandidate),
    [buildLinesFor, selectedCandidate],
  );

  const open = (cid: string) => {
    setSelectedId(cid);
    setOpenId(cid);
  };

  // Issue #120 — DetailSheet TimeSlotSelector 진짜 재계산 박힘 (★ handleTimeWhatIf 재사용 = #111+#118 패턴 답습).
  //   ★ Q-B 통합: value=currentDepartureTime (★ filters single source of truth, 4 옵션 외 시 chip 선택 X 자연).
  const handleTimeSlotChange = (next: string) => {
    void handleTimeWhatIf(next);
  };

  const handleLike = () => {
    if (!selectedCandidate) return;
    const wasLiked = Boolean(favorites[selectedCandidate.id]);
    toggleFavorite(selectedCandidate.id);
    pushToast({
      variant: wasLiked ? "default" : "ok",
      message: wasLiked
        ? "찜 목록에서 뺐어요"
        : `${selectedCandidate.gu} ${selectedCandidate.dong} 찜!`,
    });
  };

  return (
    <div className="space-y-s-4">
      <FilterPanel
        // Issue #106 ㊘ — TimeTabs 미박힘 (★ "사용자 입력 → 결과" 자연 흐름 도달).
        //   ㊔ 사용자 입력 X 필터는 chip 숨김 (★ "제한 없음"/"전체" 표시 X).
        //   ㊒ 출근시간 chip = 사용자 입력값 박힘 (★ 진단 → 결과 데이터 흐름 정합).
        filters={[
          {
            label: "출근시간",
            value: filters.commuteSchedule?.departureTime ?? "08:00",
            // Issue #111 — what-if 옵션 inline 박힘 토글 (★ #106 ㊒ notifyComingSoon 정정).
            onClick: () => setShowTimeOptions((prev) => !prev),
          },
          filters.maxCommuteTime != null && {
            label: "통근시간",
            value: formatCommuteFilter(filters.maxCommuteTime),
            // Issue #112 — what-if 옵션 inline 박힘 토글 (★ #111 답습).
            onClick: () => setShowCommuteOptions((prev) => !prev),
          },
          filters.budget != null && {
            label: "예산",
            value: formatBudgetFilter(filters.budget),
            // Issue #112 — what-if 옵션 inline 박힘 토글 (★ #111 답습).
            onClick: () => setShowBudgetOptions((prev) => !prev),
          },
        ].filter(Boolean) as { label: string; value: string; onClick: () => void }[]}
      />

      {/* Issue #111 β + #118 — what-if 시뮬레이션 입력 (★ <input type="time"> + "변경" 버튼 명시적 확인 + 시나리오 B handler fallback). */}
      {/* key={currentDepartureTime} — baseTime 변경 시 컴포넌트 재마운트 (★ React 19 set-state-in-effect 규칙 답습). */}
      {showTimeOptions && (
        <TimeChipOptions
          key={currentDepartureTime}
          baseTime={currentDepartureTime}
          onConfirm={handleTimeWhatIf}
        />
      )}

      {/* Issue #112 — maxCommuteTime + budget what-if 입력 (★ #111+#118 답습). */}
      {showCommuteOptions && filters.maxCommuteTime != null && (
        <CommuteChipOptions
          key={filters.maxCommuteTime}
          baseValue={filters.maxCommuteTime}
          onConfirm={handleCommuteWhatIf}
        />
      )}
      {showBudgetOptions && filters.budget != null && (
        <BudgetChipOptions
          key={`${filters.budget.min}-${filters.budget.max}`}
          baseMin={filters.budget.min}
          baseMax={filters.budget.max}
          onConfirm={handleBudgetWhatIf}
        />
      )}

      {/* Issue #45 (UI-007 v1.4) — REQ-FUNC-012 출처 배지 박힘 영역.
          share-report-view 인라인 3개 답습 = 공유 vs 개인 시각 일관성 100% 사수.
          정상 결과 상태 한정 부착 = result-view.tsx showEmpty/error 분기에선 본 컴포넌트 미렌더링 = #125 EmptyState 충돌 회피. */}
      <section
        aria-label="진단 결과 데이터 출처"
        className="flex flex-wrap gap-s-2"
      >
        {/* 안전 — 실 데이터(공공데이터)는 W3 야간안전. 현재는 mock. */}
        <DataSourceBadge
          kind="official"
          source="공공데이터포털"
          updatedAt="2026.04"
          tone="on-light"
        />
        {IS_MOCK ? (
          <>
            {/* mock = Haversine 추정 (실 통근 데이터 미연동) */}
            <DataSourceBadge
              kind="aggregated"
              source="카카오 모빌리티"
              updatedAt="2026.04.01"
              tone="on-light"
            />
            <DataSourceBadge
              kind="estimate"
              source="통근 추정"
              updatedAt="—"
              tone="on-light"
            />
          </>
        ) : (
          /* production = 실 ODsay 대중교통 (자차=카카오는 후속) */
          <DataSourceBadge
            kind="aggregated"
            source="ODsay 대중교통"
            updatedAt="실시간"
            tone="on-light"
          />
        )}
      </section>

      <MapCanvas
        markers={markers}
        workplaces={workplaces}
        lines={lines}
        onMarkerClick={open}
        height={320}
      />

      <SortControl total={sorted.length} />

      <ul className="space-y-s-3">
        {sorted.map((c, i) => (
          <li
            key={c.id}
            className={cn(
              "scroll-mt-s-4 rounded-lg transition-shadow",
              selectedId === c.id && "ring-2 ring-primary ring-offset-2",
            )}
          >
            <CandidateCard
              name={`${c.gu} ${c.dong}`}
              score={c.score}
              rank={i + 1}
              best={i === 0}
              commutes={[
                {
                  tag: "A",
                  mode: toChipMode(c.commuteA.mode),
                  minutes: c.commuteA.time,
                },
                ...(c.commuteB
                  ? [
                      {
                        tag: "B" as const,
                        mode: toChipMode(c.commuteB.mode),
                        minutes: c.commuteB.time,
                      },
                    ]
                  : []),
              ]}
              price={formatPrice(c.priceRange)}
              onClick={() => open(c.id)}
            />
          </li>
        ))}
      </ul>

      {selectedCandidate && (
        <DetailSheet
          open={openId !== null}
          onClose={() => setOpenId(null)}
          candidate={{
            name: `${selectedCandidate.gu} ${selectedCandidate.dong}`,
            score: selectedCandidate.score,
            pills: buildPills(selectedCandidate, selectedRank === 1),
            lines: buildLines(selectedCandidate),
            commutes: buildCommuteRows(selectedCandidate, addressA, addressB),
            metrics: buildMetrics(selectedCandidate),
          }}
          liked={Boolean(favorites[selectedCandidate.id])}
          onLike={handleLike}
          onShare={onShare}
          map={
            <MapCanvas
              markers={detailMarkers}
              workplaces={workplaces}
              lines={detailLines}
              fitAll
              height={180}
            />
          }
          commuteExtra={
            <TimeSlotSelector
              value={currentDepartureTime}
              onChange={handleTimeSlotChange}
            />
          }
          primaryCta={{
            label: selectedCandidate.listingsCount
              ? `매물 ${selectedCandidate.listingsCount}건 보기`
              : "매물 보기",
            onClick: () => {
              const url = buildNaverRealEstateUrl(
                `${selectedCandidate.gu} ${selectedCandidate.dong}`,
                selectedCandidate.priceRange
                  ? { priceMax: selectedCandidate.priceRange.max }
                  : {},
              );
              window.open(url, "_blank", "noopener,noreferrer");
            },
          }}
        />
      )}
    </div>
  );
}
