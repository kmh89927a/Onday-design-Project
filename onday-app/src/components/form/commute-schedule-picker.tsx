"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { CommuteSchedule, DayOfWeek } from "@/lib/types";

// CommuteSchedulePicker — 요일 chip 다중 선택 + 출발 시간대 chip(일반/야간/유연)
// 사용자 멘탈 모델 정수 정점: "평일/주말" 카테고리 해방
// (교대 근무 + 새벽 + 야간 + 주말 근무 100% 해소)
// shadcn 디자인 토큰 톤 (border-card-border + bg-surface + text-ink) — Issue #102 단일 진리 도달.
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

// 출발 시간대 칩 — 대표 HH:MM 1개씩(러시아워 시뮬 rushHourFactor 가 앞 2자리=시만 파싱).
//   일반 08:00=×1.3(러시) / 야간 23:00=×0.9(심야) / 유연 14:00=×1.0(패널티 없음, 정직).
const TIME_CHIPS = [
  { key: "general", emoji: "☀️", label: "일반", sub: "07–09시", time: "08:00" },
  { key: "night", emoji: "🌙", label: "야간", sub: "심야", time: "23:00" },
  { key: "flexible", emoji: "⏰", label: "유연", sub: "자유", time: "14:00" },
] as const;

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
      <div
        role="radiogroup"
        aria-label="출발 시간대"
        className="grid grid-cols-3 gap-s-2"
      >
        {TIME_CHIPS.map((c) => {
          const active = localTime === c.time;
          return (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${c.label} (${c.sub})`}
              onClick={() => setTime(c.time)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md border px-s-2 py-s-2 transition-colors",
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-card-border bg-surface text-ink-2 hover:bg-bg",
                "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
              )}
            >
              <span aria-hidden className="text-body">
                {c.emoji}
              </span>
              <span className="text-caption font-bold">{c.label}</span>
              <span
                className={cn(
                  "text-[10px]",
                  active ? "text-primary/70" : "text-ink-3",
                )}
              >
                {c.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
