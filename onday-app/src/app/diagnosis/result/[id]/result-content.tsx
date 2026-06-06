"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { CandidateCard } from "@/components/card/candidate-card";
import { DataSourceBadge } from "@/components/data/data-source-badge";
import { FilterPanel } from "@/components/form/filter-panel";
import { MapCanvas } from "@/components/map/map-canvas";
import type { MapWorkplace, MapLine } from "@/components/map/map-canvas";
import { DetailSheet } from "@/components/sheet/detail-sheet";
import { TradeOffSection } from "@/components/diagnosis/trade-off-section";
import { PreferenceBanner } from "@/components/diagnosis/preference-banner";
import { buildPreferenceReason } from "@/features/diagnosis/preference-reason";
import {
  buildCommuteRows,
  buildLines,
  buildMetrics,
  buildPills,
} from "@/features/diagnosis/detail-mapper";
import {
  formatBudgetFilter,
  formatCardPrice,
  formatCommuteFilter,
  markerLabel,
  parseSortKey,
  sortCandidates,
  toChipMode,
} from "@/features/diagnosis/result-utils";
import {
  estimateCommuteMinutes,
  haversineDistance,
  rushHourFactor,
} from "@/lib/haversine";
import { buildNaverRealEstateUrl } from "@/lib/deadline/naver-url-builder";
import { latLngToPixel } from "@/lib/coordinate-transform";
import type { CandidateArea, CommuteInfo, DiagnosisFilters } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useFavoritesStore, toFavoriteSnapshot } from "@/stores/favorites";
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

// what-if(시간/통근/예산) 재계산 — ★ 후보 재선정 대신 고정 baseline 세트를 in-place 갱신.
//   기존 runMockDiagnosis 는 풀에서 top-N 을 다시 뽑아(mock 점수) 세트가 바뀌고 → 새 후보엔
//   routePath/자동차 없음(버그1) + 자동차 시간 미반영(버그2). 본 함수는 세트·순위·routePath 고정,
//   통근 '분'만 재계산해 두 버그 동시 해소.
//   · 대중교통: estimateCommuteMinutes(거리, 출발시각) — 러시아워 계수 반영
//   · 자동차: 실 Kakao 기준시간 × rushHourFactor (거리추정은 도로보다 짧아 부정확 → 기준값 보존)
//   · routePath(정거장/도로선)·순위(점수)·여가는 baseline 그대로 유지, 필터만 재적용.
function recomputeWhatIf(
  baseline: CandidateArea[],
  filters: DiagnosisFilters,
  coordA: { lat: number; lng: number },
  coordB: { lat: number; lng: number } | null | undefined,
): CandidateArea[] {
  const depTime = filters.commuteSchedule?.departureTime;
  const carFactor = rushHourFactor(depTime);
  return baseline
    .map((c) => {
      const distA = haversineDistance(coordA, c.coordinate);
      const next: CandidateArea = {
        ...c,
        commuteA: { ...c.commuteA, time: estimateCommuteMinutes(distA, depTime) },
      };
      if (coordB && c.commuteB) {
        const distB = haversineDistance(coordB, c.coordinate);
        next.commuteB = {
          ...c.commuteB,
          time: estimateCommuteMinutes(distB, depTime),
        };
      }
      if (c.commuteACar) {
        next.commuteACar = {
          ...c.commuteACar,
          time: Math.round(c.commuteACar.time * carFactor),
        };
      }
      if (c.commuteBCar) {
        next.commuteBCar = {
          ...c.commuteBCar,
          time: Math.round(c.commuteBCar.time * carFactor),
        };
      }
      return next;
    })
    .filter((c) => {
      if (filters.maxCommuteTime) {
        const maxC = Math.max(c.commuteA.time, c.commuteB?.time ?? 0);
        if (maxC > filters.maxCommuteTime) return false;
      }
      if (filters.budget) {
        if (filters.dealType === "wolse") {
          // 월세 — 추정 보증금/월세로 재필터 (priceRange 는 전세 scale 라 부적합).
          const w = c.wolseEstimate;
          if (w) {
            if (w.monthly > filters.budget.max) return false;
            if (
              filters.budget.depositMax != null &&
              w.deposit > filters.budget.depositMax
            ) {
              return false;
            }
          }
        } else if (c.priceRange) {
          const avg = (c.priceRange.min + c.priceRange.max) / 2;
          if (avg < filters.budget.min || avg > filters.budget.max) return false;
        }
      }
      return true;
    });
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

  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  // ★ 첫 진단 결과를 baseline 으로 1회 캡처 — what-if 는 항상 이 고정 세트(routePath·자동차 보유)에서
  //   재계산해 세트 churn/데이터 소실 방지. setResult 로 store 가 바뀌어도 ref 는 원본 유지.
  //   (React 19 규칙 — 렌더 중 ref 접근 금지 → effect 에서 캡처. 핸들러는 이벤트라 ref 읽기 허용.)
  const baselineRef = React.useRef<CandidateArea[] | null>(null);
  React.useEffect(() => {
    if (baselineRef.current === null && candidates.length > 0) {
      baselineRef.current = candidates;
    }
  }, [candidates]);

  // Issue #111 β — 출근시간 chip 클릭 시 what-if 입력 inline 박힘 토글.
  // Issue #112 — maxCommuteTime + budget chip 클릭 시 what-if 입력 inline 박힘 토글 답습.
  const [showTimeOptions, setShowTimeOptions] = React.useState(false);
  const [showCommuteOptions, setShowCommuteOptions] = React.useState(false);
  const [showBudgetOptions, setShowBudgetOptions] = React.useState(false);
  const currentDepartureTime = filters.commuteSchedule?.departureTime ?? "08:00";

  const handleTimeWhatIf = (time: string) => {
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
    const next = recomputeWhatIf(
      baselineRef.current ?? candidates,
      newFilters,
      coordinateA,
      coordinateB,
    );
    if (diagnosisId) setResult(diagnosisId, next);
  };

  // Issue #112 — what-if maxCommuteTime/budget 재계산 (★ handleTimeWhatIf 답습).
  const handleCommuteWhatIf = (maxCommute: number) => {
    if (!coordinateA) {
      pushToast({
        variant: "default",
        message: "페이지 새로고침 후 다시 시도해주세요",
      });
      return;
    }
    const newFilters = { ...filters, maxCommuteTime: maxCommute };
    setFilters(newFilters);
    const next = recomputeWhatIf(
      baselineRef.current ?? candidates,
      newFilters,
      coordinateA,
      coordinateB,
    );
    if (diagnosisId) setResult(diagnosisId, next);
  };

  const handleBudgetWhatIf = (
    min: number,
    max: number,
    depositMax?: number,
  ) => {
    if (!coordinateA) {
      pushToast({
        variant: "default",
        message: "페이지 새로고침 후 다시 시도해주세요",
      });
      return;
    }
    // what-if 는 금액만 조정 — dealType(거래유형)은 filters.dealType 에 보존(...filters). budget 은 금액만.
    const newFilters = {
      ...filters,
      budget: { min, max, depositMax },
    };
    setFilters(newFilters);
    const next = recomputeWhatIf(
      baselineRef.current ?? candidates,
      newFilters,
      coordinateA,
      coordinateB,
    );
    if (diagnosisId) setResult(diagnosisId, next);
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

  // 지도 경로 표시 모드 — 🚇 대중교통(주 지표·정거장 선) / 🚗 자동차(실 도로). 기본=대중교통.
  const [mapMode, setMapMode] = React.useState<"transit" | "car">("transit");

  // 후보→직장 경로선. mode별 실 경로(routePath) 있으면 실선, 없으면(mock·실패) 직선 추정 점선.
  //   · transit = commuteA/B.routePath(정거장 좌표) — 출발(후보)·도착(직장) 보강
  //   · car     = commuteACar/BCar.routePath(도로 vertexes) — 이미 양끝 포함
  //   ★ 메인 맵(focus)·시트(selected) 공용.
  const buildLinesFor = React.useCallback(
    (cand: CandidateArea | null, mode: "transit" | "car"): MapLine[] => {
      if (!cand) return [];
      const candPoint = {
        position: latLngToPixel(cand.coordinate),
        coordinate: cand.coordinate,
      };
      const build = (
        id: string,
        variant: "a" | "b",
        wp: typeof coordinateA,
        commute: CommuteInfo | undefined,
      ): MapLine | null => {
        if (!wp) return null;
        const route = commute?.routePath;
        if (route && route.length >= 2) {
          // transit=정거장만 → 출발·도착 보강 / car=도로 vertexes는 이미 양끝 포함.
          const coords =
            mode === "transit" ? [cand.coordinate, ...route, wp] : route;
          return {
            id,
            variant,
            dashed: false,
            points: coords.map((c) => ({
              coordinate: c,
              position: latLngToPixel(c),
            })),
          };
        }
        // 직선 추정 (dashed) — 실 경로 없을 때(mock·실패) fallback.
        return {
          id,
          variant,
          dashed: true,
          points: [candPoint, { position: latLngToPixel(wp), coordinate: wp }],
        };
      };
      const aCommute = mode === "transit" ? cand.commuteA : cand.commuteACar;
      const bCommute = mode === "transit" ? cand.commuteB : cand.commuteBCar;
      return [
        build("line-a", "a", coordinateA, aCommute),
        build("line-b", "b", coordinateB, bCommute),
      ].filter((l): l is MapLine => l !== null);
    },
    [coordinateA, coordinateB],
  );

  const lines = React.useMemo(
    () => buildLinesFor(focusCandidate, mapMode),
    [buildLinesFor, focusCandidate, mapMode],
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
    () => buildLinesFor(selectedCandidate, mapMode),
    [buildLinesFor, selectedCandidate, mapMode],
  );

  // 🚇/🚗 경로 표시 모드 토글 (지도 위 우상단). 통근 정보 [대중교통]/[차량] 그룹과 일관.
  const mapModeToggle = (
    <div
      role="group"
      aria-label="경로 표시 모드"
      className="flex rounded-full bg-surface/90 p-0.5 shadow-card backdrop-blur"
    >
      {(
        [
          ["transit", "🚇 대중교통"],
          ["car", "🚗 자동차"],
        ] as const
      ).map(([m, label]) => (
        <button
          key={m}
          type="button"
          onClick={() => setMapMode(m)}
          aria-pressed={mapMode === m}
          className={cn(
            "rounded-full px-s-2 py-s-1 text-caption-xs font-bold transition-colors",
            mapMode === m
              ? "bg-primary text-primary-foreground"
              : "text-ink-3",
          )}
        >
          {label}
        </button>
      ))}
    </div>
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
    toggleFavorite(
      toFavoriteSnapshot(
        selectedCandidate,
        "couple",
        undefined,
        filters.dealType,
      ),
    );
    pushToast({
      variant: wasLiked ? "default" : "ok",
      message: wasLiked
        ? "찜 목록에서 뺐어요"
        : `${selectedCandidate.gu} ${selectedCandidate.dong} 찜!`,
    });
  };

  const priorityKey = filters.priorities?.[0];

  return (
    <div className="space-y-s-4">
      <PreferenceBanner priorityKey={priorityKey} />
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
            value: formatBudgetFilter(filters.budget, filters.dealType),
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
          key={`${filters.budget.min}-${filters.budget.max}-${filters.budget.depositMax ?? ""}`}
          baseMin={filters.budget.min}
          baseMax={filters.budget.max}
          baseDepositMax={filters.budget.depositMax}
          dealType={filters.dealType}
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
        {/* 시세 — 국토부 실거래 median(60~85㎡). 폴백 동네는 카드/상세에 "구 평균" 캡션 별도 표기. */}
        <DataSourceBadge
          kind="official"
          source="국토교통부 실거래가 · 60~85㎡"
          updatedAt="2025.12~2026.06"
          tone="on-light"
        />
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
          /* ★ "실시간" → "추정": ODsay 는 시간표 기반 평균(실시간 교통 아님) +
             시간대 혼잡은 계수 추정 → 실시간이라 표기하면 과장. */
          <DataSourceBadge
            kind="aggregated"
            source="ODsay 대중교통"
            updatedAt="추정"
            tone="on-light"
          />
        )}
      </section>

      <MapCanvas
        markers={markers}
        workplaces={workplaces}
        lines={lines}
        topRightSlot={mapModeToggle}
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
              price={formatCardPrice(c, filters.dealType)}
              tagReason={buildPreferenceReason(priorityKey, c) ?? undefined}
              onClick={() => open(c.id)}
            />
          </li>
        ))}
      </ul>

      <TradeOffSection candidates={sorted} onSelect={open} />

      {selectedCandidate && (
        <DetailSheet
          open={openId !== null}
          onClose={() => setOpenId(null)}
          candidate={{
            name: `${selectedCandidate.gu} ${selectedCandidate.dong}`,
            score: selectedCandidate.score,
            pills: [
              ...(priorityKey
                ? [
                    {
                      variant: "default" as const,
                      label: buildPreferenceReason(priorityKey, selectedCandidate) ?? "",
                    },
                  ]
                : []),
              ...buildPills(selectedCandidate, selectedRank === 1),
            ],
            lines: buildLines(selectedCandidate),
            commutes: buildCommuteRows(selectedCandidate, addressA, addressB),
            metrics: buildMetrics(selectedCandidate, filters.dealType),
          }}
          liked={Boolean(favorites[selectedCandidate.id])}
          onLike={handleLike}
          onShare={onShare}
          map={
            <MapCanvas
              markers={detailMarkers}
              workplaces={workplaces}
              lines={detailLines}
              topRightSlot={mapModeToggle}
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
