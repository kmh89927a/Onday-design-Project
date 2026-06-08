"use client";

import * as React from "react";
import { RotateCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { extractDayData } from "@/lib/insight/extract-day-data";
import type { DayStory, StorySlot } from "@/lib/insight/story";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import type { CandidateArea, DiagnosisMode } from "@/lib/types";

// 동네 하루 미리보기 (Phase 4 UI) — 버튼 클릭 시 extractDayData → /api/insight → story 렌더.
//   클릭 전엔 호출 안 함(비용·속도).
//   ★ Phase 5 세션 캐시 — 생성한 story 는 diagnosis-store 에 보관(candidate.id 키). 시트 close/reopen·
//     탭 이동에도 재호출 0(Gemini 절약). 진단 스코프라 setResult/reset 시 비워짐(다른 통근데이터 → 재생성).
//   ★ key={candidate.id} 유지(방어) — 캐시는 store 가 담당, 새로고침 시 소멸(의도).

const SLOTS = [
  { key: "morning", emoji: "🚌", label: "아침" },
  { key: "evening", emoji: "🍽️", label: "저녁" },
  { key: "night", emoji: "🌙", label: "밤" },
] as const;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// keywords 강조 — text 를 keyword 부분문자열 경계로 쪼개 브랜드 컬러+볼드.
//   ★ cn 드롭 회피: 색 강조는 자식 <strong> 에만(부모 <p> 의 fontSize 토큰과 cn 병합 안 함).
//   Phase 3 에서 keywords ⊆ text 보장되나 방어적으로 포함 확인 + 긴 것 우선(부분겹침 방지).
function highlightKeywords(
  text: string,
  keywords: string[],
): React.ReactNode {
  const valid = [...new Set(keywords)]
    .filter((k) => k.length > 0 && text.includes(k))
    .sort((a, b) => b.length - a.length);
  if (valid.length === 0) return text;
  const re = new RegExp(`(${valid.map(escapeRegExp).join("|")})`, "g");
  return text.split(re).map((part, i) =>
    valid.includes(part) ? (
      <strong key={i} className="font-bold text-primary">
        {part}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

function DayPreviewSkeleton() {
  return (
    <div
      role="status"
      aria-label="하루 미리보기 생성 중"
      className="space-y-s-3"
    >
      <p className="text-center text-caption text-ink-3">
        AI가 이 동네에서의 완벽한 하루를 스케치하고 있어요 ✍️
      </p>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="space-y-s-2 rounded-lg border border-card-border bg-surface px-s-4 py-s-3"
        >
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

// done 데이터(story)는 store, 생성 중 전이(loading/error)는 로컬. story 캐시 있으면 status 무관하게 표시.
type Status = "idle" | "loading" | "error";

interface DayPreviewProps {
  candidate: CandidateArea;
  mode: DiagnosisMode;
}

export function DayPreview({ candidate, mode }: DayPreviewProps) {
  const [status, setStatus] = React.useState<Status>("idle");
  // ★ 세션 캐시 — 캐시된 story 가 있으면 재호출 없이 바로 렌더(시트 close/reopen 비용 0).
  const story = useDiagnosisStore((s) => s.stories[candidate.id]) ?? null;
  const setStory = useDiagnosisStore((s) => s.setStory);

  const generate = React.useCallback(async () => {
    setStatus("loading");
    try {
      const data = extractDayData(candidate, mode);
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { story?: DayStory };
      if (!json.story) throw new Error("no story");
      setStory(candidate.id, json.story); // store 보관 → 캐시 hit 시 idle 스킵.
      setStatus("idle"); // story 존재가 done 표시를 주도(아래 렌더 우선순위).
    } catch {
      setStatus("error"); // 503/502/400/네트워크 모두 graceful (크래시·빈 화면 금지).
    }
  }, [candidate, mode, setStory]);

  return (
    <section aria-label="동네 하루 미리보기" className="space-y-s-3">
      <div className="flex items-center gap-s-1">
        <Sparkles aria-hidden className="size-4 text-primary" />
        <p className="text-caption font-bold text-ink-2">동네 하루 미리보기</p>
      </div>

      {!story && status === "idle" && (
        <Button variant="outline" fullWidth onClick={generate}>
          AI로 이 동네 하루 미리보기 ✨
        </Button>
      )}

      {status === "loading" && <DayPreviewSkeleton />}

      {!story && status === "error" && (
        <div className="space-y-s-2 rounded-lg border border-card-border bg-surface px-s-4 py-s-3 text-center">
          <p className="text-body-sm text-ink-3">
            지금은 미리보기를 불러올 수 없어요
          </p>
          <Button variant="outline" size="sm" onClick={generate}>
            <RotateCw aria-hidden className="size-3.5" />
            다시 시도
          </Button>
        </div>
      )}

      {story && (
        <ol className="space-y-s-3">
          {SLOTS.map(({ key, emoji, label }) => {
            const slot = story[key] as StorySlot | null;
            if (!slot) return null; // evening null(부부·여가 없음) → 저녁 카드 생략.
            return (
              <li
                key={key}
                className="rounded-lg border border-card-border bg-surface px-s-4 py-s-3 shadow-card"
              >
                <p className="flex items-center gap-s-1 text-caption font-bold text-ink-2">
                  <span aria-hidden>{emoji}</span>
                  {label}
                </p>
                <p className="mt-1 text-body-sm leading-relaxed text-ink">
                  {highlightKeywords(slot.text, slot.keywords)}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
