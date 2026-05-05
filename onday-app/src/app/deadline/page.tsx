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

export default function DeadlinePage() {
  const router = useRouter();
  const deadlineDate = useDiagnosisStore((s) => s.deadlineDate);
  const setDeadlineDate = useDiagnosisStore((s) => s.setDeadlineDate);
  const pushToast = useUIStore((s) => s.pushToast);

  const [draft, setDraft] = React.useState<string>(
    deadlineDate ? deadlineDate.slice(0, 10) : todayPlus(30),
  );

  const handleSave = () => {
    const target = new Date(`${draft}T00:00:00`);
    const days = daysFromNow(target.toISOString());
    if (days < MIN_DAYS_FROM_NOW) {
      pushToast({
        variant: "danger",
        message: `최소 ${MIN_DAYS_FROM_NOW}일 후 날짜를 선택해주세요`,
      });
      return;
    }
    setDeadlineDate(target.toISOString());
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
            <Input
              id="deadline-input"
              type="date"
              value={draft}
              min={todayPlus(MIN_DAYS_FROM_NOW)}
              onChange={(e) => setDraft(e.target.value)}
            />
          </section>

          <Button fullWidth onClick={handleSave} leading={<CalendarIcon />}>
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
