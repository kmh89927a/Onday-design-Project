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
import { latLngToPixel } from "@/lib/coordinate-transform";
import type { CandidateArea, DiagnosisFilters } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useFavoritesStore } from "@/stores/favorites";
import { useUIStore } from "@/stores/ui";

import { SortControl } from "./sort-control";
import { TimeSlotSelector, type TimeSlot } from "./time-slot-selector";

const TIME_OPTIONS: { value: string; label: string }[] = [
  { value: "07:00", label: "07:00" },
  { value: "08:00", label: "08:00" },
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
];

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

  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const sorted = React.useMemo(
    () => sortCandidates(candidates, sort),
    [candidates, sort],
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [timeSlot, setTimeSlot] = React.useState<TimeSlot>("08:00");

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
        time="08:00"
        onTimeChange={() => notifyComingSoon("출근 시간대")}
        timeOptions={TIME_OPTIONS}
        filters={[
          {
            label: "통근시간",
            value: formatCommuteFilter(filters.maxCommuteTime),
            onClick: () => notifyComingSoon("통근시간 필터"),
          },
          {
            label: "예산",
            value: formatBudgetFilter(filters.budget),
            onClick: () => notifyComingSoon("예산 필터"),
          },
        ]}
      />

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
