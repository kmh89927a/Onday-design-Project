"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { CommuteSchedule, DayOfWeek } from "@/lib/types";

// CommuteSchedulePicker — 출발 시간대 chip(일반/야간/유연)만. 경량화 2단계: 요일 선택 숨김.
//   ★ 요일(days)은 어떤 진단 연산에도 안 쓰여(vestigial) UI 제거. days는 평일 기본값으로 채워
//     commuteSchedule DTO 유효성만 유지(migrateLegacyTimeRange 관례와 동일).
// useEffect + lastValueRef guard 패턴 — value 외부 변경("이전 조건 불러오기")만 동기화,
// emit 시 ref 동기 갱신으로 동기화→onChange→리렌더 무한 루프 방지(㊹).

// 숨긴 요일의 기본값 — 평일(월~금). 출퇴근 자연 가정 + 기존 legacy 마이그레이션과 동일.
const DEFAULT_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri"];

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
  ariaLabel = "출퇴근 시간대 선택",
  className,
}: CommuteSchedulePickerProps) {
  const [localTime, setLocalTime] = React.useState(
    () => value?.departureTime ?? "",
  );
  const lastValueRef = React.useRef(value);

  React.useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      setLocalTime(value?.departureTime ?? "");
    }
  }, [value]);

  // 시간만 고르면 emit (요일 숨김 → 가드 완화). days는 평일 기본으로 채워 DTO 유효성 유지.
  const setTime = (time: string) => {
    setLocalTime(time);
    const next = time
      ? { days: DEFAULT_DAYS, departureTime: time }
      : undefined;
    lastValueRef.current = next;
    onChange(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid grid-cols-3 gap-s-2", className)}
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
  );
}
