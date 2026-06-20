import type { Metadata } from "next";

import {
  SCREENS,
  USER_FLOWS,
  TECH_ITEMS,
  CRITICAL_AREAS,
  buildCoverageMatrix,
  type ImplStatus,
  type ScreenNode,
} from "@/lib/playboard/registry";

// Playboard 인덱스 상황판 (Phase B-1).
// ★ 격리: registry.ts(하드코딩 메타데이터)만 import — 진단·DB·API·use-diagnosis 미참조.
//   정적 렌더(서버 컴포넌트, DB 미접근). OnDay DESIGN.md 토큰으로 "서비스의 일부"처럼.
//   시그니처 = mission-critical 커버리지 매트릭스(빈 셀 = 갭을 시각적으로 드러냄).

export const metadata: Metadata = {
  title: "Playboard — OnDay 상황판",
  description: "OnDay 실제 구현 화면 + mission-critical 기술기획 상황판.",
};

// 스크린샷은 public/playboard/screenshots/ 에서 서빙(레지스트리는 e2e 경로 보유 → basename 매핑).
function thumbUrl(screenshot: string | null): string | null {
  if (!screenshot) return null;
  return `/playboard/screenshots/${screenshot.split("/").pop()}`;
}

// 매트릭스 열 라벨용 짧은 화면명(긴 title 축약).
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

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-surface px-s-4 py-s-4 shadow-card">
      <p className="text-h2 font-extrabold tracking-[-0.01em] text-primary tabular">{value}</p>
      <p className="mt-1 text-caption text-ink-3">{label}</p>
    </div>
  );
}

function ScreenCard({ s }: { s: ScreenNode }) {
  const thumb = thumbUrl(s.screenshot);
  const badge = STATUS_BADGE[s.status];
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-card-border bg-surface shadow-card">
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-card-border bg-bg">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- 정적 스크린샷, 최적화 불필요(상황판).
          <img src={thumb} alt={`${s.title} 화면`} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-3">
            <span className="text-h3">▦</span>
            <span className="text-caption">스크린샷 없음 (별도)</span>
          </div>
        )}
        <span className={`absolute right-s-2 top-s-2 rounded-sm px-s-2 py-0.5 text-caption-xs font-bold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-s-2 p-s-4">
        <div className="flex items-baseline justify-between gap-s-2">
          <h3 className="text-title font-bold text-ink">{s.title}</h3>
          <code className="shrink-0 text-caption-xs text-ink-3">{s.url}</code>
        </div>
        <p className="text-body-sm text-ink-2">{s.role}</p>
        {s.note ? <p className="text-caption-xs text-ink-3">※ {s.note}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-s-2">
          {s.userTypes.map((u) => (
            <span key={u} className="rounded-chip bg-primary-soft px-s-2 py-0.5 text-caption-xs font-bold text-primary">
              {USER_TYPE_LABEL[u] ?? u}
            </span>
          ))}
          <span className="ml-auto text-caption-xs text-ink-3" aria-hidden>
            상세 B-2 →
          </span>
        </div>
      </div>
    </article>
  );
}

export default function PlayboardPage() {
  const matrix = buildCoverageMatrix();
  const exercised = matrix.filter((c) => c.exercised).length;
  const total = matrix.length;
  const implementedTech = TECH_ITEMS.filter((t) => t.status === "implemented").length;

  // 매트릭스 빠른 조회 — `${area}|${screen}` → exercised.
  const cellMap = new Map(matrix.map((c) => [`${c.area}|${c.screen}`, c.exercised]));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-s-5 py-s-8 font-sans text-ink">
      {/* ── 헤더 ── */}
      <header className="border-b border-card-border pb-s-6">
        <p className="text-caption-xs font-extrabold uppercase tracking-[0.18em] text-primary">
          OnDay · 상황판
        </p>
        <h1 className="mt-s-2 text-display-2 font-extrabold tracking-[-0.02em] text-ink">
          Playboard
        </h1>
        <p className="mt-s-2 max-w-2xl text-body text-ink-2">
          OnDay의 실제 구현 화면과 mission-critical 기술기획을 한눈에 보는 상황판입니다.
          매트릭스의 <span className="font-bold text-danger">빈 셀이 곧 갭</span> — 미기획 영역을 숨기지 않습니다.
        </p>
      </header>

      {/* ── 진행률 요약 ── */}
      <section aria-label="진행률 요약" className="mt-s-6 grid grid-cols-2 gap-s-3 sm:grid-cols-4">
        <StatTile value={String(SCREENS.length)} label="화면 (8 + 공유 별도)" />
        <StatTile value={String(USER_FLOWS.length)} label="사용자 flow" />
        <StatTile value={`${implementedTech}`} label={`기술기획 (구현됨 / 총 ${TECH_ITEMS.length})`} />
        <StatTile value={`${exercised}·${total}`} label="커버리지 셀 (행사 · 전체)" />
      </section>

      {/* ── ★ 시그니처: mission-critical 커버리지 매트릭스 ── */}
      <section aria-label="mission-critical 커버리지 매트릭스" className="mt-s-9">
        <div className="flex items-baseline justify-between gap-s-3">
          <h2 className="text-h3 font-extrabold text-ink">커버리지 매트릭스</h2>
          <div className="flex items-center gap-s-3 text-caption-xs text-ink-3">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-3 rounded-xs bg-primary" /> 행사됨
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-3 rounded-xs border border-dashed border-ink-3 bg-bg" /> 갭(미행사)
            </span>
          </div>
        </div>

        <div className="mt-s-4 overflow-x-auto rounded-lg border border-card-border bg-surface shadow-card">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-card-border">
                <th className="sticky left-0 z-10 bg-surface px-s-4 py-s-3 text-caption font-bold text-ink-3">
                  영역 \ 화면
                </th>
                {SCREENS.map((s) => (
                  <th key={s.id} className="px-s-2 py-s-3 text-center text-caption-xs font-bold text-ink-2">
                    {SHORT_LABEL[s.id] ?? s.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRITICAL_AREAS.map((area) => (
                <tr key={area.id} className="border-b border-line-2 last:border-0">
                  <th className="sticky left-0 z-10 bg-surface px-s-4 py-s-3 text-left align-top">
                    <span className="block text-body-sm font-bold text-ink">{area.label}</span>
                    <span className={`mt-1 inline-block rounded-sm px-s-2 py-0.5 text-caption-xs font-bold ${STATUS_BADGE[area.status].cls}`}>
                      {STATUS_BADGE[area.status].label}
                    </span>
                  </th>
                  {SCREENS.map((s) => {
                    const on = cellMap.get(`${area.id}|${s.id}`);
                    return (
                      <td key={s.id} className="px-s-2 py-s-3 text-center">
                        {on ? (
                          <span
                            className="mx-auto inline-block size-5 rounded-xs bg-primary"
                            aria-label={`${area.label} × ${SHORT_LABEL[s.id]} 행사됨`}
                            title="행사됨"
                          />
                        ) : (
                          <span
                            className="mx-auto inline-block size-5 rounded-xs border border-dashed border-line bg-bg"
                            aria-label={`${area.label} × ${SHORT_LABEL[s.id]} 갭`}
                            title="갭(미행사)"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 영역별 구현/갭 정직 노출 */}
        <ul className="mt-s-4 grid gap-s-3 sm:grid-cols-2">
          {CRITICAL_AREAS.map((area) => (
            <li key={area.id} className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
              <div className="flex items-center gap-s-2">
                <h3 className="text-body font-bold text-ink">{area.label}</h3>
                <span className={`rounded-sm px-s-2 py-0.5 text-caption-xs font-bold ${STATUS_BADGE[area.status].cls}`}>
                  {STATUS_BADGE[area.status].label}
                </span>
                <span className="ml-auto text-caption-xs text-ink-3">{area.techItemIds.length}개 기술항목</span>
              </div>
              <p className="mt-s-2 text-body-sm leading-relaxed text-ink-2">{area.gapNote}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 화면맵 그리드 ── */}
      <section aria-label="화면맵" className="mt-s-9">
        <h2 className="text-h3 font-extrabold text-ink">화면맵</h2>
        <p className="mt-1 text-body-sm text-ink-3">실제 구현 화면 {SCREENS.length}개 (스크린샷은 E2E 캡처 #226·#228).</p>
        <div className="mt-s-4 grid gap-s-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCREENS.map((s) => (
            <ScreenCard key={s.id} s={s} />
          ))}
        </div>
      </section>

      {/* ── 사용자 flow 요약 ── */}
      <section aria-label="사용자 flow" className="mt-s-9 mb-s-10">
        <h2 className="text-h3 font-extrabold text-ink">사용자 flow</h2>
        <p className="mt-1 text-body-sm text-ink-3">유형별 화면 순서 (상세 다이어그램은 B-3).</p>
        <ul className="mt-s-4 grid gap-s-3">
          {USER_FLOWS.map((flow) => (
            <li key={flow.id} className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
              <div className="flex flex-wrap items-baseline gap-x-s-3 gap-y-1">
                <h3 className="text-body font-bold text-ink">{flow.label}</h3>
                <span className="text-caption text-ink-3">{flow.persona}</span>
              </div>
              <ol className="mt-s-3 flex flex-wrap items-center gap-x-1 gap-y-2">
                {flow.screens.map((sid, i) => (
                  <li key={sid} className="flex items-center">
                    <span className="rounded-chip bg-primary-soft px-s-3 py-1 text-caption-xs font-bold text-primary">
                      {SHORT_LABEL[sid] ?? sid}
                    </span>
                    {i < flow.screens.length - 1 ? (
                      <span className="px-1 text-ink-3" aria-hidden>→</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-card-border pt-s-5 text-caption-xs text-ink-3">
        SoT: <code>src/lib/playboard/registry.ts</code> · 정적 렌더(DB 미접근) · 화면 상세(B-2)·flow 다이어그램(B-3) 예정.
      </footer>
    </main>
  );
}
