"use client";

// ──────────────────────────────────────────────
// #125 FEAT-DIAGNOSIS-ZERO-CANDIDATES — EmptyState 분리 컴포넌트
//
// REQ-FUNC-008 (Story 3-1, AC-N3) — 진단 0곳 안내 + 조건 완화 제안 클릭 시 자동 반영 + 재계산.
//
// ★ Phase B 발견 ㊣ — 기존 EmptyState 는 result-view.tsx inner function 이어서
//   setFilters/runMockDiagnosis 접근 X 였음. 본 컴포넌트 = props injection 으로 분리.
// ★ what-if 답습 #5 — SuggestionButton 클릭 = handleTimeWhatIf 패턴 답습 (#111/#118/#120/#112).
// ──────────────────────────────────────────────

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DiagnosisFilters } from "@/lib/types";
import type { RelaxationSuggestion } from "@/lib/types/diagnosis";

interface EmptyStateProps {
  suggestions: RelaxationSuggestion[];
  onApply: (apply: Partial<DiagnosisFilters>) => void;
}

export function EmptyState({ suggestions, onApply }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-card-border bg-bg p-s-6 text-center">
      <p className="text-body font-bold text-ink">
        조건을 만족하는 동네가 없습니다
      </p>
      {suggestions.length > 0 ? (
        <ul className="mt-s-3 space-y-s-2">
          {suggestions.map((s, i) => (
            <li key={`${s.label}-${i}`}>
              <Button
                variant="outline"
                onClick={() => onApply(s.apply)}
                className="w-full justify-start text-body-sm"
              >
                {s.label}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-s-3 space-y-1 text-body-sm text-ink-3">
          <li>· 최대 통근 시간을 늘려보세요</li>
          <li>· 예산 범위를 조정해보세요</li>
        </ul>
      )}
      <Link href="/diagnosis" className="mt-s-4 inline-block">
        <Button variant="outline" leading={<ChevronLeft />}>
          진단 다시 입력
        </Button>
      </Link>
    </div>
  );
}
