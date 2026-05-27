"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon } from "lucide-react";

import { DDayCounter } from "@/components/deadline/dday-counter";
import { MiniCalendar } from "@/components/deadline/mini-calendar";
import { TimelineStep } from "@/components/deadline/timeline-step";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildTimeline,
  daysFromNow,
  deadlineUrgency,
  formatTargetDate,
} from "@/features/deadline/timeline-builder";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useUIStore } from "@/stores/ui";

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
  const pushToast = useUIStore((s) => s.pushToast);

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
      </div>
    </main>
  );
}
