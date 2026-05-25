"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { CandidateCard } from "@/components/card/candidate-card";
import { FilterPanel } from "@/components/form/filter-panel";
import { MapCanvas } from "@/components/map/map-canvas";
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
import { latLngToPixel } from "@/lib/coordinate-transform";
import type { CandidateArea, DiagnosisFilters } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useFavoritesStore } from "@/stores/favorites";
import { useUIStore } from "@/stores/ui";

import { SortControl } from "./sort-control";
import { TimeChipOptions } from "./time-chip-options";
import { TimeSlotSelector, type TimeSlot } from "./time-slot-selector";

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
  const [showTimeOptions, setShowTimeOptions] = React.useState(false);
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

  const sorted = React.useMemo(
    () => sortCandidates(candidates, sort),
    [candidates, sort],
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  // Issue #106 ㊒ — 진단 입력 출근시간 → 결과 페이지 표시 (데이터 흐름 정합).
  const initialTime = (filters.commuteSchedule?.departureTime ?? "08:00") as TimeSlot;
  const [timeSlot, setTimeSlot] = React.useState<TimeSlot>(initialTime);

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

  const open = (cid: string) => {
    setSelectedId(cid);
    setOpenId(cid);
  };

  const notifyComingSoon = (label: string) =>
    pushToast({
      variant: "default",
      message: `${label} 변경은 다음 업데이트에 추가됩니다 ✨`,
    });

  const handleTimeSlotChange = (next: TimeSlot) => {
    setTimeSlot(next);
    pushToast({
      variant: "default",
      message: `${next} 시간대 시뮬레이션은 다음 업데이트에 추가됩니다 ✨`,
    });
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
            onClick: () => notifyComingSoon("통근시간 필터"),
          },
          filters.budget != null && {
            label: "예산",
            value: formatBudgetFilter(filters.budget),
            onClick: () => notifyComingSoon("예산 필터"),
          },
        ].filter(Boolean) as { label: string; value: string; onClick: () => void }[]}
      />

      {/* Issue #111 β — what-if 시뮬레이션 입력 (★ <input type="time"> + 시나리오 B handler fallback). */}
      {showTimeOptions && (
        <TimeChipOptions
          baseTime={currentDepartureTime}
          onChange={handleTimeWhatIf}
        />
      )}

      <MapCanvas markers={markers} onMarkerClick={open} height={320} />

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
          commuteExtra={
            <TimeSlotSelector value={timeSlot} onChange={handleTimeSlotChange} />
          }
          primaryCta={{
            label: selectedCandidate.listingsCount
              ? `매물 ${selectedCandidate.listingsCount}건 보기`
              : "매물 보기",
            onClick: () => {
              const query = encodeURIComponent(
                `${selectedCandidate.gu} ${selectedCandidate.dong}`,
              );
              window.open(
                `https://land.naver.com/?query=${query}`,
                "_blank",
                "noopener,noreferrer",
              );
            },
          }}
        />
      )}
    </div>
  );
}
