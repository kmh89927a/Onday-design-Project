import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  SCREENS,
  USER_FLOWS,
  TECH_ITEMS,
  CRITICAL_AREAS,
  SCREEN_SPECS,
  AREA_SPECS,
  type ImplStatus,
  type SpecItem,
  type SpecStatus,
  type ControlStatus,
} from "@/lib/playboard/registry";

// 영역 제어 스펙 4-상태 배지 (Phase C). deferred = 의도적 이연(갭과 다른 색).
const CONTROL_STATUS: Record<ControlStatus, { label: string; cls: string }> = {
  implemented: { label: "구현됨", cls: "bg-success-soft text-success" },
  deferred: { label: "의도적 이연", cls: "bg-info-soft text-info" },
  unimplemented: { label: "미구현(요구 있음)", cls: "bg-warning-soft text-warning" },
  unplanned: { label: "순수 미기획", cls: "bg-danger-soft text-danger" },
};

// Playboard 화면 상세 (Phase B-2) — 목업 + 기술기획 패널 = "시각화된 기술기획서".
// ★ 격리: registry.ts(하드코딩 메타데이터)만 import — 진단·DB·API·use-diagnosis 미참조.
//   정적 렌더 + generateStaticParams 로 9개 화면 사전 생성(DB 미접근).

export function generateStaticParams() {
  return SCREENS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const screen = SCREENS.find((s) => s.id === id);
  return {
    title: screen ? `${screen.title} — Playboard` : "Playboard",
    description: screen?.role,
  };
}

function thumbUrl(screenshot: string | null): string | null {
  if (!screenshot) return null;
  return `/playboard/screenshots/${screenshot.split("/").pop()}`;
}

const SHORT_LABEL: Record<string, string> = {
  landing: "랜딩",
  login: "로그인",
  "diagnosis-input": "진단입력",
  "couple-result": "커플결과",
  "single-result": "싱글결과",
  "detail-sheet": "상세시트",
  "deadline-input": "데드라인입력",
  "deadline-timeline": "D-day",
  share: "공유",
};

const STATUS_BADGE: Record<ImplStatus, { label: string; cls: string }> = {
  implemented: { label: "구현됨", cls: "bg-success-soft text-success" },
  partial: { label: "부분", cls: "bg-warning-soft text-warning" },
  excluded: { label: "캡처 제외", cls: "bg-bg text-ink-3 border border-card-border" },
  gap: { label: "갭", cls: "bg-danger-soft text-danger" },
};

const USER_TYPE_LABEL: Record<string, string> = {
  couple: "커플",
  single: "싱글",
  guest: "게스트",
  reviewer: "심사관",
  "share-recipient": "공유수신",
};

// 스펙 항목 상태 배지 — 기본(implemented)은 배지 없음. na/gap/partial/out-of-scope만 표기.
const SPEC_STATUS: Record<SpecStatus, { label: string; cls: string } | null> = {
  implemented: null,
  partial: { label: "부분", cls: "bg-warning-soft text-warning" },
  gap: { label: "미기획 갭", cls: "bg-danger-soft text-danger" },
  na: { label: "해당 없음", cls: "bg-bg text-ink-3 border border-card-border" },
  "out-of-scope": { label: "MVP 범위 밖", cls: "bg-bg text-ink-3 border border-card-border" },
};

// 5종 패널 중 하나(요구사항/게이트/데이터계약/예외) 렌더.
function SpecPanel({ title, items }: { title: string; items: SpecItem[] }) {
  return (
    <section>
      <p className="mb-s-2 text-caption-xs font-extrabold uppercase tracking-[0.14em] text-ink-3">{title}</p>
      <ul className="flex flex-col gap-s-2">
        {items.map((item, i) => {
          const st = SPEC_STATUS[item.status ?? "implemented"];
          const muted = item.status === "na" || item.status === "out-of-scope";
          return (
            <li
              key={i}
              className={`rounded-lg border p-s-3 ${item.status === "gap" ? "border-dashed border-danger/40 bg-danger-soft" : "border-card-border bg-surface shadow-card"}`}
            >
              <div className="flex items-start gap-s-2">
                <p className={`flex-1 text-body-sm leading-relaxed ${muted ? "text-ink-3" : "text-ink"}`}>
                  {item.text}
                </p>
                {st ? (
                  <span className={`shrink-0 rounded-sm px-s-2 py-0.5 text-caption-xs font-bold ${st.cls}`}>
                    {st.label}
                  </span>
                ) : null}
              </div>
              {item.evidence.length > 0 ? (
                <div className="mt-s-2 flex flex-wrap gap-1">
                  {item.evidence.map((e) => (
                    <code key={e} className="rounded-xs bg-bg px-1.5 py-0.5 text-caption-xs text-ink-3">{e}</code>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function ScreenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const screen = SCREENS.find((s) => s.id === id);
  if (!screen) notFound();

  const thumb = thumbUrl(screen.screenshot);
  const badge = STATUS_BADGE[screen.status];
  const techById = new Map(TECH_ITEMS.map((t) => [t.id, t]));
  const spec = SCREEN_SPECS[screen.id];

  // 이 화면이 행사하는 mission-critical 영역(역인덱스) + 각 영역의 기술항목.
  const areas = CRITICAL_AREAS.filter((a) => a.exercisedOnScreens.includes(screen.id));

  // 이 화면이 속한 flow + 앞/뒤 단계.
  const flowContexts = USER_FLOWS.flatMap((f) => {
    const idx = f.screens.indexOf(screen.id);
    if (idx === -1) return [];
    return [{
      flow: f,
      prev: idx > 0 ? f.screens[idx - 1] : null,
      next: idx < f.screens.length - 1 ? f.screens[idx + 1] : null,
      step: idx + 1,
      total: f.screens.length,
    }];
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-s-5 py-s-8 font-sans text-ink">
      {/* ── 브레드크럼 + 헤더 ── */}
      <nav className="text-caption">
        <Link href="/playboard" className="font-bold text-primary hover:underline">
          ← Playboard
        </Link>
        <span className="px-s-2 text-ink-3">/</span>
        <span className="text-ink-3">{screen.title}</span>
      </nav>

      <header className="mt-s-4 border-b border-card-border pb-s-5">
        <div className="flex flex-wrap items-center gap-s-3">
          <h1 className="text-h1 font-extrabold tracking-[-0.02em] text-ink">{screen.title}</h1>
          <span className={`rounded-sm px-s-2 py-0.5 text-caption-xs font-bold ${badge.cls}`}>
            {badge.label}
          </span>
          <code className="text-body-sm text-ink-3">{screen.url}</code>
        </div>
        <p className="mt-s-2 max-w-2xl text-body text-ink-2">{screen.role}</p>
        <div className="mt-s-3 flex flex-wrap items-center gap-1">
          {screen.userTypes.map((u) => (
            <span key={u} className="rounded-chip bg-primary-soft px-s-2 py-0.5 text-caption-xs font-bold text-primary">
              {USER_TYPE_LABEL[u] ?? u}
            </span>
          ))}
        </div>
      </header>

      {/* ── 목업 ‖ 기술기획 (병치) ── */}
      <div className="mt-s-6 grid gap-s-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* 목업 */}
        <div className="lg:sticky lg:top-s-5 lg:self-start">
          <p className="mb-s-2 text-caption-xs font-extrabold uppercase tracking-[0.14em] text-ink-3">목업</p>
          <div className="overflow-hidden rounded-lg border border-card-border bg-bg shadow-card">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element -- 정적 스크린샷(상황판).
              <img src={thumb} alt={`${screen.title} 화면`} className="w-full" />
            ) : (
              <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-s-2 text-ink-3">
                <span className="text-display-2">▦</span>
                <span className="text-body-sm">스크린샷 없음</span>
                {screen.note ? <span className="max-w-xs px-s-5 text-center text-caption-xs">{screen.note}</span> : null}
              </div>
            )}
          </div>
        </div>

        {/* 기술기획 패널 — 5종(요구사항·게이트·데이터계약·예외·NFR) */}
        <div className="flex flex-col gap-s-6">
          {spec ? (
            <>
              <SpecPanel title="요구사항 (PRD/SRS)" items={spec.requirements} />
              <SpecPanel title="게이트 (진입·접근 조건)" items={spec.gates} />
              <SpecPanel title="데이터 계약 (API·props·DB)" items={spec.dataContracts} />
              <SpecPanel title="예외 (에러·엣지·fallback)" items={spec.exceptions} />
            </>
          ) : null}

          {/* NFR = mission-critical 영역 & 기술항목 */}
          <section>
            <p className="mb-s-2 text-caption-xs font-extrabold uppercase tracking-[0.14em] text-ink-3">
              NFR · mission-critical
            </p>
            {areas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-danger/40 bg-danger-soft p-s-4">
                <p className="text-body font-bold text-danger">커버리지 갭 — 매핑된 mission-critical 영역 없음</p>
                <p className="mt-1 text-body-sm text-ink-2">
                  이 화면은 현재 6개 mission-critical 영역 중 어디에도 행사되지 않습니다(매트릭스 빈 열).
                  화면 기능은 구현됐으나, 인증·접근제어·무결성·복구·관측성·성능 관점의 기술기획은 아직 미정 — 정직한 갭입니다.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-s-4">
                {areas.map((area) => {
                  const items = area.techItemIds
                    .map((tid) => techById.get(tid))
                    .filter((t): t is NonNullable<typeof t> => Boolean(t));
                  return (
                    <li key={area.id} className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
                      <div className="flex items-center gap-s-2">
                        <h3 className="text-body font-bold text-ink">{area.label}</h3>
                        <span className={`rounded-sm px-s-2 py-0.5 text-caption-xs font-bold ${STATUS_BADGE[area.status].cls}`}>
                          {STATUS_BADGE[area.status].label}
                        </span>
                      </div>
                      <ul className="mt-s-3 flex flex-col gap-s-3">
                        {items.map((t) => (
                          <li key={t.id} className="border-l-2 border-primary/30 pl-s-3">
                            <p className="text-body-sm font-bold text-ink">{t.title}</p>
                            <p className="mt-0.5 text-body-sm leading-relaxed text-ink-2">{t.point}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {t.evidence.map((e) => (
                                <code key={e} className="rounded-xs bg-bg px-1.5 py-0.5 text-caption-xs text-ink-3">
                                  {e}
                                </code>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {/* ★ Phase C — 영역 제어 스펙 4-상태(구현/이연/미구현/미기획) */}
                      <div className="mt-s-3 border-t border-line-2 pt-s-3">
                        <p className="mb-s-2 text-caption-xs font-bold text-ink-3">제어 스펙</p>
                        <ul className="flex flex-col gap-s-2">
                          {(AREA_SPECS[area.id]?.controls ?? []).map((c, ci) => {
                            const cst = CONTROL_STATUS[c.status];
                            return (
                              <li key={ci} className="rounded-sm border border-card-border bg-bg px-s-3 py-s-2">
                                <div className="flex items-start gap-s-2">
                                  <p className="flex-1 text-caption-xs leading-relaxed text-ink-2">{c.text}</p>
                                  <span className={`shrink-0 rounded-xs px-1.5 py-0.5 text-[10px] font-bold ${cst.cls}`}>{cst.label}</span>
                                </div>
                                {c.note ? <p className="mt-1 text-[11px] leading-relaxed text-ink-3">{c.note}</p> : null}
                                {c.evidence.length > 0 ? (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {c.evidence.map((e) => (
                                      <code key={e} className="rounded-xs bg-surface px-1 py-0.5 text-[10px] text-ink-3">{e}</code>
                                    ))}
                                  </div>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* flow 맥락 */}
          <section>
            <p className="mb-s-2 text-caption-xs font-extrabold uppercase tracking-[0.14em] text-ink-3">flow 맥락</p>
            {flowContexts.length === 0 ? (
              <p className="text-body-sm text-ink-3">연결된 사용자 flow 없음.</p>
            ) : (
              <ul className="flex flex-col gap-s-3">
                {flowContexts.map(({ flow, prev, next, step, total }) => (
                  <li key={flow.id} className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
                    <div className="flex items-baseline justify-between gap-s-2">
                      <h3 className="text-body-sm font-bold text-ink">{flow.label}</h3>
                      <span className="text-caption-xs text-ink-3">{step} / {total} 단계</span>
                    </div>
                    <div className="mt-s-2 flex items-center gap-s-2 text-caption-xs">
                      {prev ? (
                        <Link href={`/playboard/${prev}`} className="rounded-chip bg-bg px-s-2 py-0.5 font-bold text-ink-2 hover:text-primary">
                          ← {SHORT_LABEL[prev] ?? prev}
                        </Link>
                      ) : (
                        <span className="text-ink-3">시작</span>
                      )}
                      <span className="rounded-chip bg-primary px-s-3 py-0.5 font-bold text-primary-foreground">
                        {SHORT_LABEL[screen.id] ?? screen.id}
                      </span>
                      {next ? (
                        <Link href={`/playboard/${next}`} className="rounded-chip bg-bg px-s-2 py-0.5 font-bold text-ink-2 hover:text-primary">
                          {SHORT_LABEL[next] ?? next} →
                        </Link>
                      ) : (
                        <span className="text-ink-3">끝</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <footer className="mt-s-9 border-t border-card-border pt-s-5">
        <Link href="/playboard" className="text-body-sm font-bold text-primary hover:underline">
          ← Playboard 상황판으로
        </Link>
        <p className="mt-s-2 text-caption-xs text-ink-3">
          SoT: <code>src/lib/playboard/registry.ts</code> · 정적 렌더(DB 미접근). 기술기획은 registry 실 데이터(file:line)만.
        </p>
      </footer>
    </main>
  );
}
