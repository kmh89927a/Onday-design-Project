import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  SCREENS,
  USER_FLOWS,
  type ImplStatus,
} from "@/lib/playboard/registry";

// Playboard UX 흐름 상세 (Phase B-3) — 유형별 화면 여정을 캡처 + 화살표로.
// ★ 격리: registry.ts(flow/screen 메타)만 import — 진단·DB·API·use-diagnosis 미참조.
//   정적 렌더 + generateStaticParams 로 5개 유형 사전 생성(DB 미접근).

export function generateStaticParams() {
  return USER_FLOWS.map((f) => ({ type: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const flow = USER_FLOWS.find((f) => f.id === type);
  return {
    title: flow ? `${flow.label} 흐름 — Playboard` : "Playboard",
    description: flow?.persona,
  };
}

function thumbUrl(screenshot: string | null): string | null {
  if (!screenshot) return null;
  return `/playboard/screenshots/${screenshot.split("/").pop()}`;
}

const STATUS_BADGE: Record<ImplStatus, { label: string; cls: string }> = {
  implemented: { label: "구현됨", cls: "bg-success-soft text-success" },
  partial: { label: "부분", cls: "bg-warning-soft text-warning" },
  excluded: { label: "캡처 별도", cls: "bg-bg text-ink-3 border border-card-border" },
  gap: { label: "갭", cls: "bg-danger-soft text-danger" },
};

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const flow = USER_FLOWS.find((f) => f.id === type);
  if (!flow) notFound();

  const screenById = new Map(SCREENS.map((s) => [s.id, s]));
  const steps = flow.screens
    .map((sid) => screenById.get(sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-s-5 py-s-8 font-sans text-ink">
      {/* ── 브레드크럼 + 헤더 ── */}
      <nav className="text-caption">
        <Link href="/playboard" className="font-bold text-primary hover:underline">
          ← Playboard
        </Link>
        <span className="px-s-2 text-ink-3">/</span>
        <span className="text-ink-3">{flow.label} 흐름</span>
      </nav>

      <header className="mt-s-4 border-b border-card-border pb-s-5">
        <p className="text-caption-xs font-extrabold uppercase tracking-[0.16em] text-primary">UX 흐름</p>
        <h1 className="mt-s-2 text-h1 font-extrabold tracking-[-0.02em] text-ink">{flow.label}</h1>
        {/* 유형별 차이 한 줄 (registry persona) */}
        <p className="mt-s-2 max-w-2xl text-body text-ink-2">{flow.persona}</p>
        <p className="mt-s-2 text-caption text-ink-3">화면 {steps.length}개 흐름</p>
      </header>

      {/* ── 화면 순서: 캡처 + 화살표 ── */}
      <ol className="mt-s-6 flex flex-col gap-s-2 lg:flex-row lg:flex-wrap lg:items-stretch">
        {steps.map((s, i) => {
          const thumb = thumbUrl(s.screenshot);
          const badge = STATUS_BADGE[s.status];
          return (
            <li key={`${s.id}-${i}`} className="flex items-center gap-s-2 lg:flex-col">
              <Link
                href={`/playboard/${s.id}`}
                aria-label={`${i + 1}단계 ${s.title} 상세 보기`}
                className="group block w-full rounded-lg border border-card-border bg-surface shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:w-52"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-lg border-b border-card-border bg-bg">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 정적 스크린샷(상황판).
                    <img src={thumb} alt={`${s.title} 화면`} className="h-full w-full object-cover object-top" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-3">
                      <span className="text-h3">▦</span>
                      <span className="text-caption-xs">캡처 별도</span>
                    </div>
                  )}
                  <span className="absolute left-s-2 top-s-2 inline-flex size-5 items-center justify-center rounded-chip bg-primary text-caption-xs font-extrabold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-s-2 p-s-3">
                  <span className="truncate text-body-sm font-bold text-ink group-hover:text-primary">{s.title}</span>
                  <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-caption-xs font-bold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              </Link>

              {/* 다음 화살표 (마지막 제외) */}
              {i < steps.length - 1 ? (
                <span className="shrink-0 px-1 text-h3 font-bold text-ink-3 lg:px-0 lg:py-1" aria-hidden>
                  <span className="lg:hidden">↓</span>
                  <span className="hidden lg:inline">→</span>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* ── 다른 흐름으로 ── */}
      <section aria-label="다른 흐름" className="mt-s-9">
        <h2 className="text-body-sm font-bold text-ink-3">다른 유형 흐름</h2>
        <div className="mt-s-3 flex flex-wrap gap-s-2">
          {USER_FLOWS.filter((f) => f.id !== flow.id).map((f) => (
            <Link
              key={f.id}
              href={`/playboard/flow/${f.id}`}
              className="rounded-chip border border-card-border bg-surface px-s-3 py-1 text-caption-xs font-bold text-ink-2 shadow-card hover:text-primary"
            >
              {f.label} →
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-s-9 border-t border-card-border pt-s-5">
        <Link href="/playboard" className="text-body-sm font-bold text-primary hover:underline">
          ← Playboard 상황판으로
        </Link>
        <p className="mt-s-2 text-caption-xs text-ink-3">
          SoT: <code>src/lib/playboard/registry.ts</code> · 정적 렌더(DB 미접근) · 화면 클릭 → 상세(B-2).
        </p>
      </footer>
    </main>
  );
}
