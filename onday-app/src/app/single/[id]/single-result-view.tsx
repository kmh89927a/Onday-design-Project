"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Filter, FileDown } from "lucide-react";

import { SafetyCard } from "@/components/card/safety-card";
import { LegendBar } from "@/components/data/legend-bar";
import { MapCanvas } from "@/components/map/map-canvas";
import type { MapWorkplace, MapLine } from "@/components/map/map-canvas";
import { DetailSheet } from "@/components/sheet/detail-sheet";
import { TradeOffSection } from "@/components/diagnosis/trade-off-section";
import { PreferenceBanner } from "@/components/diagnosis/preference-banner";
import { buildPreferenceReason } from "@/features/diagnosis/preference-reason";
import { DeadlineBanner } from "@/components/deadline/deadline-banner";
import { DeadlineBell } from "@/components/deadline/deadline-bell";
import { DeadlineEntryCard } from "@/components/deadline/deadline-entry-card";
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
import { getSafetyByGu } from "@/features/single/safety-index";
import { getCommunityByGu } from "@/lib/diagnosis/community-index";
import { buildSinglePills, buildSingleMetrics } from "@/features/single/detail-mapper";
import { markerLabel } from "@/features/diagnosis/result-utils";
import { buildCommuteRows, buildLines } from "@/features/diagnosis/detail-mapper";
import { latLngToPixel } from "@/lib/coordinate-transform";
import { buildNaverRealEstateUrl } from "@/lib/deadline/naver-url-builder";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils";
import type { CandidateArea, SafetyGrade } from "@/lib/types";
import { FavoritesMenu } from "@/components/favorites/favorites-menu";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useFavoritesStore, toFavoriteSnapshot } from "@/stores/favorites";
import { useUIStore } from "@/stores/ui";

import { LayerToggle, type SingleLayer } from "./layer-toggle";

interface SingleResultViewProps {
  id: string;
}

// #57 — 종합 야간안전 지수(getSafetyByGu)가 등급 소스.
//   ★ 랜덤 id-해시 날조 제거 (실 데이터 전환 의미 정면 위배 방지).
//   no_data(비수도권 or 미수집 시군구)는 등급 날조 대신 전환 브리지(기존 mock grade, 랜덤 아님).
//   TODO(#59 UI-013): no_data → "데이터 준비중" 배지/회색 처리로 표현 (표현은 #59 범위).
function resolveGrade(c: CandidateArea): SafetyGrade {
  const safety = getSafetyByGu(c.gu);
  if (safety.status === "ok") return safety.grade;
  return c.safetyGrade ?? "C";
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
        (a, b) => GRADE_ORDER[resolveGrade(a)] - GRADE_ORDER[resolveGrade(b)],
      );
    case "convenience":
      return arr.sort(
        (a, b) =>
          (b.facilities?.convenience ?? 0) - (a.facilities?.convenience ?? 0),
      );
    case "community":
      return arr.sort((a, b) => communityCount(b) - communityCount(a));
  }
}

// 공원+도서관 실데이터 합계 (미수집 시 0 = 정렬 후순위) — B 정책.
function communityCount(c: CandidateArea): number {
  const com = getCommunityByGu(c.gu);
  return com.status === "ok" ? com.total : 0;
}

function buildLayerStat(c: CandidateArea, layer: SingleLayer) {
  switch (layer) {
    case "safety": {
      const grade = resolveGrade(c);
      return { label: "범죄", value: `${getNightCrimeRate(grade)}건` };
    }
    case "convenience":
      return {
        label: "편의점",
        value: `${c.facilities?.convenience ?? 0}개`,
      };
    case "community": {
      const com = getCommunityByGu(c.gu);
      return {
        label: "공원·도서관",
        value: com.status === "ok" ? `${com.total}개` : "준비중",
      };
    }
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
  community: {
    title: "공원·공공도서관 (시군구 단위)",
    meta: "구 전체 등록 수 · data.go.kr 표준데이터",
  },
};

export function SingleResultView({ id }: SingleResultViewProps) {
  const pushToast = useUIStore((s) => s.pushToast);
  const storeId = useDiagnosisStore((s) => s.diagnosisId);
  const storeCandidates = useDiagnosisStore((s) => s.candidates);
  const storeAddressA = useDiagnosisStore((s) => s.addressA);
  const setResult = useDiagnosisStore((s) => s.setResult);
  // 지도 마커용 좌표 — 부부 모드와 동일하게 store 직접 참조(같은 세션에서만 표시).
  const coordinateA = useDiagnosisStore((s) => s.coordinateA);
  const leisureCoordA = useDiagnosisStore((s) => s.leisureCoordA);
  const leisureCoordB = useDiagnosisStore((s) => s.leisureCoordB);
  const priorityKey = useDiagnosisStore((s) => s.filters.priorities?.[0]);
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

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

  // 지도 마커: 직장 A(파랑) + 여가거점 1~2(녹색). 좌표 없으면 자동 생략(공유링크/새로고침).
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
    // 거점 2곳이면 "여가거점 1/2"로 번호 구분, 1곳이면 번호 생략.
    const twoLeisure = Boolean(leisureCoordA && leisureCoordB);
    if (leisureCoordA)
      out.push({
        id: "leisure-a",
        label: twoLeisure ? "여가거점 1" : "여가거점",
        short: "♥",
        coordinate: leisureCoordA,
        position: latLngToPixel(leisureCoordA),
        variant: "leisure",
      });
    if (leisureCoordB)
      out.push({
        id: "leisure-b",
        label: twoLeisure ? "여가거점 2" : "여가거점",
        short: "♥",
        coordinate: leisureCoordB,
        position: latLngToPixel(leisureCoordB),
        variant: "leisure",
      });
    return out;
  }, [coordinateA, leisureCoordA, leisureCoordB]);

  // 후보 마커 — 안전순 1위부터 회색 원+순위 (부부 모드 메인 맵과 동일).
  const markers = React.useMemo(
    () =>
      sorted.map((c, i) => ({
        id: c.id,
        label: markerLabel(c.dong),
        position: latLngToPixel(c.coordinate),
        coordinate: c.coordinate,
        rank: i + 1,
      })),
    [sorted],
  );

  // 지도 경로 표시 모드 — 🚇 대중교통(ODsay 정거장) / 🚗 자동차(Kakao 도로 vertexes). 부부와 일관.
  const [mapMode, setMapMode] = React.useState<"transit" | "car">("transit");

  // 후보 → 직장 A 연결선 1줄 (여가거점은 마커로 위치만). 메인 맵(focus)·시트(selected) 공용.
  //   · transit = commuteA.routePath(정거장) — 출발(후보)·도착(직장) 보강
  //   · car     = commuteACar.routePath(도로 vertexes) — 이미 양끝 포함
  //   실 경로 없으면(mock·실패) 직선 점선 fallback.
  const buildLineForMode = React.useCallback(
    (cand: CandidateArea | null, mode: "transit" | "car"): MapLine[] => {
      if (!cand || !coordinateA) return [];
      const commute = mode === "transit" ? cand.commuteA : cand.commuteACar;
      const route = commute?.routePath;
      if (route && route.length >= 2) {
        const coords =
          mode === "transit" ? [cand.coordinate, ...route, coordinateA] : route;
        return [
          {
            id: "line-a",
            variant: "a",
            dashed: false,
            points: coords.map((c) => ({
              coordinate: c,
              position: latLngToPixel(c),
            })),
          },
        ];
      }
      return [
        {
          id: "line-a",
          variant: "a",
          dashed: true,
          points: [
            {
              coordinate: cand.coordinate,
              position: latLngToPixel(cand.coordinate),
            },
            { coordinate: coordinateA, position: latLngToPixel(coordinateA) },
          ],
        },
      ];
    },
    [coordinateA],
  );

  const focusCandidate = sorted[0] ?? null;
  const lines = React.useMemo(
    () => buildLineForMode(focusCandidate, mapMode),
    [buildLineForMode, focusCandidate, mapMode],
  );

  // 카드 탭 → 상세 시트. 싱글은 배우자(B) 없음 → 직장A·여가거점·야간안전 중심.
  const [openId, setOpenId] = React.useState<string | null>(null);
  const selectedCandidate = React.useMemo(
    () => (openId ? sorted.find((c) => c.id === openId) ?? null : null),
    [openId, sorted],
  );
  const selectedRank = selectedCandidate
    ? sorted.findIndex((c) => c.id === selectedCandidate.id) + 1
    : 0;

  // 시트 지도 — 선택 후보 1곳 focus + 직장A·여가거점 + 연결선 (전체 fit).
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
    () => buildLineForMode(selectedCandidate, mapMode),
    [buildLineForMode, selectedCandidate, mapMode],
  );

  // 🚇/🚗 경로 표시 모드 토글 (지도 위 우상단). 시트 통근정보 [대중교통]/[차량] 그룹과 일관.
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
            mapMode === m ? "bg-primary text-primary-foreground" : "text-ink-3",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const open = (cid: string) => setOpenId(cid);

  const handleLike = () => {
    if (!selectedCandidate) return;
    const wasLiked = Boolean(favorites[selectedCandidate.id]);
    toggleFavorite(
      toFavoriteSnapshot(selectedCandidate, "single", resolveGrade(selectedCandidate)),
    );
    pushToast({
      variant: wasLiked ? "default" : "ok",
      message: wasLiked
        ? "찜 목록에서 뺐어요"
        : `${selectedCandidate.gu} ${selectedCandidate.dong} 찜!`,
    });
  };

  // 공유 — couple과 동일 흐름(/api/share POST → 링크 복사). 커플 브릿지(파트너 공유)의 기반.
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
      await copyToClipboard(`${window.location.origin}${data.shareUrl}`);
      pushToast({ variant: "ok", message: "공유 링크가 복사되었습니다" });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "공유 링크 생성에 실패했습니다";
      pushToast({ variant: "danger", message: msg });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <AppHeader
        backHref="/diagnosis"
        title="싱글 모드 결과"
        trailing={
          <>
            <FavoritesMenu />
            <DeadlineBell />
          </>
        }
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
            {/* 인쇄 시에만 보이는 리포트 헤더 (OnDay 로고 + 발행일) */}
            <div className="hidden print:block border-b border-line pb-s-3">
              <p className="text-caption font-extrabold tracking-wider text-ink">
                온데이 · 싱글 모드 리포트
              </p>
              <p className="mt-1 text-caption-xs text-ink-3">
                발행 {new Date().toLocaleDateString("ko-KR")} · {addressA} 기준
              </p>
            </div>
            <div className="print:hidden space-y-s-3">
              <DeadlineBanner />
              {/* 데드라인 미설정 시 진입 카드 (부부와 패리티) — 계약 역산 + 교집합 급매 보기 → /deadline.
                  급매 리스트·지도·네이버는 /deadline 공용 라우트가 store candidates로 이미 처리. */}
              <DeadlineEntryCard />
              <PreferenceBanner priorityKey={priorityKey} />
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

            {/* 지도 — 직장 A(파랑) + 여가거점(녹색) + 후보(회색·순위) + 1위→직장 연결선.
                SDK 캔버스는 인쇄 시 빈칸이라 print 숨김 (PDF 리포트는 카드 중심). */}
            <div className="print:hidden">
              <MapCanvas
                markers={markers}
                workplaces={workplaces}
                lines={lines}
                topRightSlot={mapModeToggle}
              />
            </div>

            <div className="print:hidden">
              <LayerToggle value={layer} onChange={setLayer} />
            </div>

            <LegendBar title={legend.title} meta={legend.meta} />

            <section aria-label="후보 동네" className="space-y-s-3">
              {sorted.map((c) => {
                const grade = resolveGrade(c);
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "scroll-mt-s-4 rounded-lg transition-shadow",
                      openId === c.id && "ring-2 ring-primary ring-offset-2",
                    )}
                  >
                    <SafetyCard
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
                      tagReason={buildPreferenceReason(priorityKey, c) ?? undefined}
                      onClick={() => open(c.id)}
                    />
                  </div>
                );
              })}
            </section>

            <div className="print:hidden">
              <TradeOffSection candidates={sorted} onSelect={open} />
            </div>

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
                            label:
                              buildPreferenceReason(priorityKey, selectedCandidate) ?? "",
                          },
                        ]
                      : []),
                    ...buildSinglePills(
                      selectedCandidate,
                      selectedRank,
                      resolveGrade(selectedCandidate),
                    ),
                  ],
                  lines: buildLines(selectedCandidate),
                  commutes: buildCommuteRows(selectedCandidate, addressA),
                  metrics: buildSingleMetrics(
                    selectedCandidate,
                    resolveGrade(selectedCandidate),
                  ),
                }}
                liked={Boolean(favorites[selectedCandidate.id])}
                onLike={handleLike}
                onShare={handleShare}
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
