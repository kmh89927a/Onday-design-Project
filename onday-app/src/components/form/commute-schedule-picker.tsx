"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { CommuteSchedule, DayOfWeek } from "@/lib/types";

// CommuteSchedulePicker — 요일 chip 다중 선택 + HH:MM time input
// 사용자 멘탈 모델 정수 정점: "평일/주말" 카테고리 해방
// (교대 근무 + 새벽 + 야간 + 주말 근무 100% 해소)
// time-range-toggle.tsx 톤 답습 (★ 사전 작업 변경 0 보존, Mismatch ㉟+㊱).
// ★ 내부 state 분리 (Issue #100, Mismatch ㊵): emit 가드(둘 다 채워질 때만 onChange)는
// Phase A 사전 박힘 정수 유지하되, 부분 입력도 UI 즉시 피드백을 위해 내부 보존.
// useEffect + lastValueRef guard 패턴 — value 외부 변경("이전 조건 불러오기")만 동기화,
// emit 시 ref 동기 갱신으로 동기화→onChange→리렌더 무한 루프 방지(㊹).

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};
const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

interface CommuteSchedulePickerProps {
  value?: CommuteSchedule;
  onChange: (next: CommuteSchedule | undefined) => void;
  ariaLabel?: string;
  className?: string;
}

export function CommuteSchedulePicker({
  value,
  onChange,
  ariaLabel = "출퇴근 일정 선택",
  className,
}: CommuteSchedulePickerProps) {
  const [localDays, setLocalDays] = React.useState<Set<DayOfWeek>>(
    () => new Set(value?.days ?? []),
  );
  const [localTime, setLocalTime] = React.useState(
    () => value?.departureTime ?? "",
  );
  const lastValueRef = React.useRef(value);

  React.useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      setLocalDays(new Set(value?.days ?? []));
      setLocalTime(value?.departureTime ?? "");
    }
  }, [value]);

  const emit = (nextDays: DayOfWeek[], nextTime: string) => {
    const sortedDays = DAY_ORDER.filter((d) => nextDays.includes(d));
    const next =
      sortedDays.length === 0 || !nextTime
        ? undefined
        : { days: sortedDays, departureTime: nextTime };
    lastValueRef.current = next;
    onChange(next);
  };

  const toggleDay = (day: DayOfWeek) => {
    const next = new Set(localDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setLocalDays(next);
    emit(Array.from(next), localTime);
  };

  const setTime = (time: string) => {
    setLocalTime(time);
    emit(Array.from(localDays), time);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("space-y-s-3", className)}
    >
      <div className="flex gap-s-2" role="group" aria-label="요일 선택">
        {DAY_ORDER.map((day) => {
          const active = localDays.has(day);
          return (
            <button
              key={day}
              type="button"
              role="switch"
              aria-checked={active}
              aria-label={DAY_LABELS[day]}
              onClick={() => toggleDay(day)}
              className={cn(
                "flex h-10 flex-1 items-center justify-center rounded-md border text-caption font-bold transition-colors",
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-card-border bg-surface text-ink-2 hover:bg-bg",
                "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
              )}
            >
              {DAY_LABELS[day]}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-s-2">
        <label
          htmlFor="commute-departure-time"
          className="text-caption font-bold text-ink-2"
        >
          출발 시간
        </label>
        <input
          id="commute-departure-time"
          type="time"
          value={localTime}
          onChange={(e) => setTime(e.target.value)}
          className={cn(
            "rounded-md border border-card-border bg-surface px-s-3 py-s-2 text-body text-ink outline-none",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          )}
        />
      </div>
    </div>
  );
}
