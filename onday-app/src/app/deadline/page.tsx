"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Sparkles } from "lucide-react";

import { DDayCounter } from "@/components/deadline/dday-counter";
import { ListingCard } from "@/components/deadline/listing-card";
import { MiniCalendar } from "@/components/deadline/mini-calendar";
import { SummaryCardGrid } from "@/components/deadline/summary-card-grid";
import { TimelineStep } from "@/components/deadline/timeline-step";
import { AppHeader } from "@/components/layout/app-header";
import { MapCanvas } from "@/components/map/map-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildTimeline,
  daysFromNow,
  deadlineUrgency,
  formatTargetDate,
} from "@/features/deadline/timeline-builder";
import { markerLabel } from "@/features/diagnosis/result-utils";
import { latLngToPixel } from "@/lib/coordinate-transform";
import { buildMockListings } from "@/lib/mocks/deadline/listings";
import {
  buildSummaryCardBase,
  extractSummaryFacts,
  selectTopCandidates,
} from "@/lib/summary/extract-summary";
import { generateFallbackRationale } from "@/lib/summary/rationale";
import type { RationaleResponse, SummaryCardDTO } from "@/lib/types/deadline";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useUIStore } from "@/stores/ui";

type SummaryStatus = "idle" | "loading" | "error";

const MIN_DAYS_FROM_NOW = 7; // wiki/concepts/deadline-mode.md — D+7 미만 차단

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// #52 v1.4 — REQ-FUNC-020 + ㊧ Mismatch 6번째 영역 분기 (SRS "오늘 이후" vs 본 프로젝트 D+7).
//   ★ 과거(days<0): SRS REQ-FUNC-020 정합 문구
//   ★ 오늘~+6일(0≤days<7): 본 프로젝트 wiki/concepts/deadline-mode.md D+7 정책 문구
//   ★ +7일 이상: null (통과)
function validateDeadline(draftYmd: string): string | null {
  const target = new Date(`${draftYmd}T00:00:00`);
  const days = daysFromNow(target.toISOString());
  if (days < 0) {
    return "마감일은 오늘 이후여야 합니다";
  }
  if (days < MIN_DAYS_FROM_NOW) {
    return `최소 ${MIN_DAYS_FROM_NOW}일 후 날짜를 선택해주세요`;
  }
  return null;
}

export default function DeadlinePage() {
  const router = useRouter();
  const deadlineDate = useDiagnosisStore((s) => s.deadlineDate);
  const setDeadlineDate = useDiagnosisStore((s) => s.setDeadlineDate);
  const candidates = useDiagnosisStore((s) => s.candidates);
  const mode = useDiagnosisStore((s) => s.mode);
  const filters = useDiagnosisStore((s) => s.filters);
  // ★ 30분 요약 세션 캐시 — 생성한 Top3 요약 보관(재클릭/탭 재방문 시 재호출 0, day-preview stories 답습).
  const summary = useDiagnosisStore((s) => s.summary);
  const setSummary = useDiagnosisStore((s) => s.setSummary);
  const pushToast = useUIStore((s) => s.pushToast);

  // 생성 중 전이(loading/error)는 로컬, done 데이터(summary)는 store 캐시 — day-preview 패턴.
  const [summaryStatus, setSummaryStatus] =
    React.useState<SummaryStatus>("idle");

  // "30분 요약" — Top3 후보별 rationale 을 /api/summary 병렬 호출(route 방식, CLAUDE.md 10초 한도).
  //   ★ 카드 결정값(시세·통근·네이버URL)은 클라에서 결정(buildSummaryCardBase), route 는 AI rationale 만.
  //   ★ route/네트워크 실패해도 룰 fallback 으로 대체 → 빈 카드 0.
  const generateSummary = React.useCallback(async () => {
    setSummaryStatus("loading");
    try {
      const dealType = filters.dealType;
      const top3 = selectTopCandidates(candidates);
      const cards: SummaryCardDTO[] = await Promise.all(
        top3.map(async (c, i) => {
          const facts = extractSummaryFacts(c, mode, dealType);
          let rationale: string;
          try {
            const res = await fetch("/api/summary", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(facts),
            });
            if (!res.ok) throw new Error(String(res.status));
            rationale = ((await res.json()) as RationaleResponse).rationale;
          } catch {
            // route 미도달/네트워크 실패 → 클라 룰 fallback(빈 카드 방지).
            rationale = generateFallbackRationale(facts);
          }
          return { ...buildSummaryCardBase(c, i + 1, dealType), rationale };
        }),
      );
      setSummary({
        cards,
        generatedAt: new Date().toISOString(),
        totalCandidates: candidates.length,
      });
      setSummaryStatus("idle");
    } catch {
      // 예기치 못한 전체 실패만 error(개별 카드는 위에서 fallback 처리).
      setSummaryStatus("error");
    }
  }, [candidates, mode, filters.dealType, setSummary]);

  const [draft, setDraft] = React.useState<string>(
    deadlineDate ? deadlineDate.slice(0, 10) : todayPlus(30),
  );
  // #52 v1.4 — AC-FUNC-020-A (인라인 에러 ≤100ms 클라이언트 검증 only).
  //   ★ onChange 즉시 검증 = 네트워크 X = 100ms 자동 정합.
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  const handleDraftChange = (next: string) => {
    setDraft(next);
    setInlineError(validateDeadline(next));
  };

  const handleSave = () => {
    const err = validateDeadline(draft);
    if (err) {
      setInlineError(err);
      pushToast({ variant: "danger", message: err });
      return;
    }
    const target = new Date(`${draft}T00:00:00`);
    setDeadlineDate(target.toISOString());
    setInlineError(null);
    pushToast({ variant: "ok", message: "데드라인을 저장했어요" });
  };

  if (!deadlineDate) {
    return (
      <main className="flex min-h-screen flex-col bg-bg">
        <AppHeader title="이사 데드라인" />
        <div className="flex-1 px-s-5 pt-s-5 space-y-s-4">
          <header className="space-y-s-2">
            <p className="text-caption-xs font-bold tracking-wider text-primary">
              MOVE-IN COUNTDOWN
            </p>
            <h1 className="text-h3 font-extrabold leading-tight tracking-[-0.03em] text-ink">
              이사 마감일을
              <br />
              알려주세요
            </h1>
            <p className="text-body-sm text-ink-3">
              5단계 체크리스트가 자동으로 생성되어요. 최소 7일 후부터 가능해요.
            </p>
          </header>

          <section className="space-y-s-2">
            <Label htmlFor="deadline-input">이사 마감일</Label>
            {/*
              #52 v1.4 — PR #130 버그 1+2 수정 (★ Phase B 한계 § 진짜 본질 입증 정점 NEW).
                ★ 시각 검증 발견: min={today+7} 가 너무 강해서 사용자가 어제 입력 시도 시
                  브라우저 native clamp 가 input.value 를 today+6 같은 valid 값으로 자동 강제
                  → onChange 가 강제된 값으로 발화 → days ∈ [0, 6] → SRS 문구 박힘 X (D+7 문구만 박힘).
                ★ 해결: min={today} 로 약화 → 어제 이전만 native 차단 + 오늘~+6일 input 자유
                  → onChange 가 사용자 진짜 입력으로 발화 → validateDeadline 분기 정확 박힘
                  → SRS "마감일은 오늘 이후" 문구 (DevTools 우회 시) + D+7 문구 양쪽 모두 박힘.
            */}
            <Input
              id="deadline-input"
              type="date"
              value={draft}
              min={todayPlus(0)}
              onChange={(e) => handleDraftChange(e.target.value)}
              aria-invalid={inlineError !== null}
              aria-describedby={inlineError ? "deadline-input-error" : undefined}
            />
            {inlineError ? (
              <p
                id="deadline-input-error"
                role="alert"
                aria-live="polite"
                className="text-body-sm text-danger"
              >
                {inlineError}
              </p>
            ) : null}
          </section>

          <Button
            fullWidth
            onClick={handleSave}
            leading={<CalendarIcon />}
            disabled={Boolean(inlineError)}
          >
            데드라인 저장
          </Button>
          <Button
            fullWidth
            variant="outline"
            onClick={() => router.back()}
          >
            뒤로 가기
          </Button>
        </div>
      </main>
    );
  }

  const days = daysFromNow(deadlineDate);
  const urgency = deadlineUrgency(days);
  const targetText = formatTargetDate(deadlineDate);
  const target = new Date(deadlineDate);
  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth() + 1;
  const targetDay = target.getDate();
  const inRange = Array.from({ length: targetDay - 1 }, (_, i) => i + 1);
  const timeline = buildTimeline(days);

  // 급매 매물 — 진단 후보 동네 기반 (mock). 후보 없으면 안내만.
  const listings = buildMockListings(candidates);
  const markers = candidates.map((c, i) => ({
    id: c.id,
    label: markerLabel(c.dong),
    position: latLngToPixel(c.coordinate),
    coordinate: c.coordinate,
    rank: i + 1,
  }));

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <AppHeader
        title="이사 데드라인"
        trailing={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeadlineDate(null)}
          >
            재설정
          </Button>
        }
      />
      <div className="flex-1 px-s-5 pt-s-3 pb-s-8 space-y-s-4">
        <DDayCounter
          daysLeft={days}
          targetDate={targetText}
          urgency={urgency}
        />
        <MiniCalendar
          year={targetYear}
          month={targetMonth}
          inRange={inRange}
          target={targetDay}
        />
        <section className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
          <h2 className="mb-s-3 text-title font-bold text-ink">
            이사 체크리스트
          </h2>
          <ol role="list" aria-label="이사 체크리스트" className="space-y-0">
            {timeline.map((row, i) => (
              <TimelineStep
                key={row.stage}
                status={row.status}
                stage={row.stage}
                label={row.label}
                sub={row.sub}
                pill={row.pill}
                position={
                  i === 0
                    ? "first"
                    : i === timeline.length - 1
                      ? "last"
                      : "middle"
                }
              />
            ))}
          </ol>
        </section>

        {/* REQ-FUNC-016 — 교집합 급매 매물 + 지도 (네이버 부동산 아웃링크 위임). */}
        <section
          aria-label="교집합 급매 매물"
          className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card"
        >
          <div className="mb-s-3 flex items-center justify-between">
            <h2 className="text-title font-bold text-ink">교집합 급매 매물</h2>
            {listings.length > 0 && (
              <span className="text-caption text-ink-3">
                {listings.length}건 · 네이버 연동
              </span>
            )}
          </div>

          {candidates.length === 0 ? (
            <p className="py-s-4 text-center text-body-sm text-ink-3">
              진단을 먼저 하면 교집합 동네의 급매 매물이 표시돼요.
            </p>
          ) : (
            <div className="space-y-s-3">
              <MapCanvas markers={markers} height={200} />
              <ul className="space-y-s-2">
                {listings.map((listing) => (
                  <li key={listing.id}>
                    <ListingCard listing={listing} />
                  </li>
                ))}
              </ul>
              <p className="text-caption-xs text-ink-3">
                매물 정보는 예시이며, 클릭 시 네이버 부동산 검색으로 이동해요.
              </p>
            </div>
          )}
        </section>

        {/* REQ-FUNC-018 — 30분 요약(Top3 동네 비교). 기존 타임라인·급매 매물과 별도 섹션. */}
        <section
          aria-label="30분 요약"
          className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card"
        >
          <div className="mb-s-3 flex items-center justify-between">
            <h2 className="text-title font-bold text-ink">30분 요약</h2>
            {summary && (
              <span className="text-caption text-ink-3">
                Top {summary.cards.length} 동네
              </span>
            )}
          </div>

          {candidates.length === 0 ? (
            <p className="py-s-4 text-center text-body-sm text-ink-3">
              진단을 먼저 하면 Top 3 동네를 30분 만에 비교할 수 있어요.
            </p>
          ) : !summary && summaryStatus === "idle" ? (
            <Button
              fullWidth
              variant="outline"
              onClick={generateSummary}
              leading={<Sparkles />}
            >
              AI로 Top 3 동네 30분 요약 보기
            </Button>
          ) : (
            <SummaryCardGrid
              cards={summary?.cards ?? []}
              isLoading={summaryStatus === "loading"}
              error={summaryStatus === "error"}
              onRetry={generateSummary}
            />
          )}
        </section>
      </div>
    </main>
  );
}
