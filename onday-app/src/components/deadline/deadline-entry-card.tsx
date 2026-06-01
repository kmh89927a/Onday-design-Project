"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";

import { useDiagnosisStore } from "@/stores/diagnosis-store";

// 결과 페이지 데드라인 모드 진입 카드 — 마감일 미설정 시에만 표시.
// 설정 후엔 DeadlineBanner(활성 단계 알림)가 대신 표시되므로 여기선 숨김 (중복 방지).
export function DeadlineEntryCard() {
  const deadlineDate = useDiagnosisStore((s) => s.deadlineDate);
  if (deadlineDate) return null;

  return (
    <Link
      href="/deadline"
      aria-label="이사 데드라인 모드 — 계약 역산 타임라인과 교집합 급매 매물 보기"
      className="flex items-center gap-s-3 rounded-lg border border-primary/30 bg-primary-soft px-s-4 py-s-3 transition-colors hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface">
        <CalendarClock aria-hidden className="size-5 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-bold text-ink">
          ⏰ 이사 마감일이 정해졌나요?
        </p>
        <p className="text-caption text-ink-2">
          계약 역산 타임라인 + 교집합 급매 매물 보기
        </p>
      </div>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-primary" />
    </Link>
  );
}
