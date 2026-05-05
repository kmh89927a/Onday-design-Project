"use client";

import * as React from "react";
import { Bell, CalendarDays } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { getActiveStage } from "@/features/deadline/use-active-stage";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/stores/diagnosis-store";

// 헤더 우측 단일 아이콘.
// deadline 미설정 → CalendarDays (설정 진입)
// deadline + active stage → Bell + 빨간(또는 단계별 톤) 점
export function DeadlineBell() {
  const deadlineDate = useDiagnosisStore((s) => s.deadlineDate);
  const stage = getActiveStage(deadlineDate);

  if (!stage) {
    return (
      <IconButton
        icon={<CalendarDays />}
        ariaLabel="이사 데드라인 설정"
        href="/deadline"
      />
    );
  }

  const dotTone =
    stage.urgency === "critical"
      ? "bg-danger"
      : stage.urgency === "soon"
        ? "bg-warning"
        : "bg-primary";

  return (
    <span className="relative inline-flex">
      <IconButton
        icon={<Bell />}
        ariaLabel={`이사 ${stage.stage}: ${stage.message}`}
        href="/deadline"
      />
      <span
        aria-hidden
        className={cn(
          "absolute right-1.5 top-1.5 size-2 rounded-full ring-2 ring-surface",
          dotTone,
        )}
      />
    </span>
  );
}
