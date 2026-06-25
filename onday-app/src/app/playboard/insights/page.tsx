import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDeploymentEnv } from "@/lib/health";
import {
  getInsights,
  getActivity,
  getNsmTrend,
  getLoginMethods,
  getSegmentAnalytics,
  FUNNEL_STEPS,
  OTHER_EVENTS,
  type InsightsData,
  type ActivityData,
  type NsmTrend,
  type LoginMethods,
  type SegmentAnalytics,
  type SegLineSeries,
  type SegFunnelSeries,
  type InsightsSource,
  type ModeFilter,
} from "@/lib/playboard/insights";

// Insights 대시보드 — event_logs raw 직접 집계(크론 0). 운영자 도구.
// ★ production 차단(logging-test 패턴): 운영자만 보는 도구라 prod 에선 notFound().
//   force-dynamic 으로 요청 시점 env·데이터 평가.
// ★ 읽기 전용(SELECT만) · 기존 동작 무변경 · 데이터 0이어도 안전.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Insights — Playboard",
  description: "event_logs 기반 퍼널 + UTM 채널 전환율 (raw 직접 집계).",
  robots: { index: false, follow: false },
};

const STAGE_BAR: Record<string, string> = {
  Acquisition: "bg-info",
  Activation: "bg-success",
  Referral: "bg-primary",
  Retention: "bg-warning",
};

function fmtRate(r: number | null): string {
  return r === null ? "—" : `${r}%`;
}

// 로그인 방식 라벨·색 — reviewer 는 "채용담당자"로 한글 표기(이해 쉽게).
// ★ 색은 STAGE_BAR 와 동일한 정적 토큰 클래스 → JIT 누락 없음.
const LOGIN_METHODS = [
  { key: "kakao", label: "카카오", color: "bg-warning" },
  { key: "guest", label: "게스트", color: "bg-info" },
  { key: "reviewer", label: "채용담당자", color: "bg-primary" },
] as const;

// ── 세그먼트 차트 — 색/좌표/높이 전부 인라인(JIT 클래스 의존 0). ──
// 범례(선·막대 공용) — color swatch 는 인라인 backgroundColor.
function SegLegend({ series, unit }: { series: { key: string; label: string; color: string; total: number }[]; unit: string }) {
  return (
    <div className="mt-s-2 flex flex-wrap gap-s-3 text-caption-xs">
      {series.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-s-1">
          <span className="inline-block h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: s.color }} aria-hidden />
          <span className="text-ink-2">{s.label}</span>
          <span className="text-ink-3">
            ({s.total} {unit})
          </span>
        </span>
      ))}
    </div>
  );
}

// NSM 선차트 — viewBox 0~100 stretch + non-scaling-stroke(선폭 일정). 좌표 인라인(points).
// ★ 단일 주차(weeks<2)면 선이 안 그려짐 → 부모가 범례+안내로 대체(스파게티·빈선 방지).
function SegLineChart({ weeks, series }: { weeks: string[]; series: SegLineSeries[] }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = weeks.length;
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 96 - (v / max) * 92; // 4(상단)~96(하단) 패딩
  return (
    <div>
      <div className="border-b border-card-border">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: "150px" }}
          role="img"
          aria-label="세그먼트별 주간 진단 완료 추세"
        >
          {series.map((s) => (
            <polyline
              key={s.key}
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="mt-s-1 flex justify-between text-caption-xs text-ink-3">
        {weeks.map((w) => (
          <span key={w}>{w.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

// 퍼널 비교 막대 — 단계 그룹 × 세그먼트 막대. 높이 인라인 %, 색 인라인 backgroundColor.
function SegBarCompare({ steps, series }: { steps: { key: string; label: string }[]; series: SegFunnelSeries[] }) {
  const max = Math.max(1, ...series.flatMap((s) => s.counts));
  return (
    <div>
      <div className="flex items-end gap-s-3" style={{ height: "150px" }}>
        {steps.map((st, si) => (
          <div key={st.key} className="flex h-full flex-1 flex-col justify-end">
            <div className="flex h-full items-end justify-center gap-1">
              {series.map((s) => {
                const v = s.counts[si];
                const h = max > 0 ? Math.max((v / max) * 100, v > 0 ? 3 : 0) : 0;
                return (
                  <div
                    key={s.key}
                    className="w-3 rounded-t-xs"
                    style={{ height: `${h}%`, backgroundColor: s.color }}
                    title={`${s.label} · ${st.label}: ${v}`}
                    aria-hidden
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-s-1 flex gap-s-3">
        {steps.map((st) => (
          <span key={st.key} className="flex-1 text-center text-caption-xs text-ink-3">
            {st.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Bar({ count, max, stage }: { count: number; max: number; stage: string }) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0;
  return (
    <div className="h-6 w-full overflow-hidden rounded-sm bg-bg" aria-hidden>
      <div className={`h-full rounded-sm ${STAGE_BAR[stage] ?? "bg-ink-3"}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function FunnelRow({
  label,
  stage,
  count,
  max,
  topCount,
}: {
  label: string;
  stage: string;
  count: number;
  max: number;
  topCount: number;
}) {
  const ofTop = topCount > 0 ? Math.round((count / topCount) * 1000) / 10 : null;
  return (
    <div className="grid grid-cols-[10rem_1fr_5rem] items-center gap-s-3">
      <span className="text-caption text-ink-2">{label}</span>
      <Bar count={count} max={max} stage={stage} />
      <span className="text-right text-caption-xs text-ink-3">
        <strong className="text-ink">{count}</strong>
        {ofTop !== null ? <span className="ml-1 text-ink-3">({ofTop}%)</span> : null}
      </span>
    </div>
  );
}

function RateCard({
  title,
  rate,
  formula,
  note,
}: {
  title: string;
  rate: number | null;
  formula: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
      <p className="text-caption-xs font-bold text-ink-3">{title}</p>
      <p className="mt-s-1 text-h2 font-extrabold text-ink">{fmtRate(rate)}</p>
      <p className="mt-s-1 text-caption-xs leading-relaxed text-ink-3">{formula}</p>
      {note ? <p className="mt-s-2 text-caption-xs leading-relaxed text-warning">{note}</p> : null}
    </div>
  );
}

// UTC ISO → KST(UTC+9) "MM-DD HH:mm".
function toKST(iso: string): string {
  const k = new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString();
  return `${k.slice(5, 10)} ${k.slice(11, 16)}`;
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; mode?: string }>;
}) {
  if (getDeploymentEnv() === "production") notFound();

  // ★ 소스 토글 — ?source=preview 면 더미(preview_event_logs), 기본 prod(event_logs).
  const sp = await searchParams;
  const source: InsightsSource = sp.source === "preview" ? "preview" : "prod";
  // ★ 모드 필터(부부/싱글) — 없으면 전체(기존 동작). visitorId→mode 추론 기반.
  const mode: ModeFilter | undefined = sp.mode === "couple" || sp.mode === "single" ? sp.mode : undefined;
  // 토글 링크 — source 보존하며 mode 만 교체.
  const modeHref = (m?: ModeFilter) => {
    const q = new URLSearchParams();
    if (source === "preview") q.set("source", "preview");
    if (m) q.set("mode", m);
    const s = q.toString();
    return s ? `?${s}` : "/playboard/insights";
  };

  const d: InsightsData = await getInsights(source, mode);
  const act: ActivityData = await getActivity(source, mode);
  const dauMax = Math.max(1, ...act.dau.map((x) => x.visitors));
  const nsm: NsmTrend = await getNsmTrend(source, mode);
  const login: LoginMethods = await getLoginMethods(source, mode);
  // ★ 세그먼트 차트 — 소스만 연동(모드 필터 미적용: 차트 자체가 모드/방식으로 분해하므로).
  const seg: SegmentAnalytics = await getSegmentAnalytics(source);
  const nsmMax = Math.max(1, nsm.target3mo, ...nsm.weeks.map((w) => w.completed));
  const funnelCounts = FUNNEL_STEPS.map((s) => d.counts[s.key] ?? 0);
  const otherCounts = OTHER_EVENTS.map((s) => d.counts[s.key] ?? 0);
  const max = Math.max(1, ...funnelCounts, ...otherCounts);
  const topCount = d.counts["landing_viewed"] ?? 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-s-5 py-s-8 font-sans text-ink">
      <nav className="text-caption">
        <Link href="/playboard" className="font-bold text-primary hover:underline">
          ← Playboard
        </Link>
        <span className="px-s-2 text-ink-3">/</span>
        <span className="text-ink-3">Insights</span>
      </nav>

      <header className="mt-s-4 border-b border-card-border pb-s-5">
        <p className="text-caption-xs font-extrabold uppercase tracking-[0.16em] text-primary">운영자 도구 · dev 전용</p>
        <h1 className="mt-s-2 text-h1 font-extrabold tracking-[-0.02em] text-ink">Insights — 퍼널 · UTM 전환율</h1>
        <p className="mt-s-2 text-body text-ink-2">
          <code>event_logs</code> 를 <strong>요청 시점에 직접 집계</strong>(크론 없음). 이 페이지는{" "}
          <strong>production 에서 차단</strong>(404)되며 <strong>읽기 전용</strong>입니다.
        </p>
        <div className="mt-s-3 flex flex-wrap gap-s-2 text-caption-xs">
          <span
            className={`rounded-sm px-s-3 py-s-1 font-bold ${
              source === "preview" ? "bg-warning-soft text-warning" : "bg-bg text-ink-3"
            }`}
          >
            소스: {source === "preview" ? "preview(더미)" : "prod(실데이터)"}
          </span>
          <span className="rounded-sm bg-success-soft px-s-3 py-s-1 font-bold text-success">총 {d.total} 이벤트</span>
          <span className="rounded-sm bg-info-soft px-s-3 py-s-1 font-bold text-info">UTM 부착 {d.utmRows}</span>
          {d.span.first ? (
            <span className="rounded-sm bg-bg px-s-3 py-s-1 text-ink-3">
              {source === "preview" ? "더미 기간 " : "기간 "}
              {toKST(d.span.first)} ~ {d.span.last ? toKST(d.span.last) : ""} KST
            </span>
          ) : null}
        </div>

        {/* ★ 모드 토글(부부/싱글) — 전체 = 기존 통합 뷰 */}
        <div className="mt-s-3 flex items-center gap-s-2 text-caption-xs">
          <span className="text-ink-3">모드:</span>
          {(
            [
              { m: undefined, label: "전체" },
              { m: "couple" as const, label: "부부" },
              { m: "single" as const, label: "싱글" },
            ] satisfies { m: ModeFilter | undefined; label: string }[]
          ).map(({ m, label }) => {
            const active = mode === m;
            return (
              <Link
                key={label}
                href={modeHref(m)}
                className={`rounded-sm px-s-3 py-s-1 font-bold ${
                  active ? "bg-primary text-white" : "bg-bg text-ink-2 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
          {mode ? (
            <span className="text-ink-3">
              · {mode === "couple" ? "부부" : "싱글"} 방문자만(mode 이벤트로 추론). landing-only 이탈자는 제외.
            </span>
          ) : null}
        </div>
      </header>

      {d.total === 0 ? (
        <section className="mt-s-6 rounded-lg border border-card-border bg-surface p-s-6 text-center shadow-card">
          <p className="text-body font-bold text-ink">아직 적재된 이벤트가 없습니다.</p>
          <p className="mt-s-2 text-caption text-ink-2">
            라이브에서 진단 흐름을 한 번 돌면 <code>event_logs</code> 에 쌓이고, 이 화면에 즉시 반영됩니다.
          </p>
        </section>
      ) : null}

      {/* 활성 지표 (E1) — DAU/WAU/MAU */}
      <section aria-label="활성 지표" className="mt-s-6">
        <h2 className="text-h3 font-extrabold text-ink">서비스 활성 (DAU/WAU/MAU)</h2>
        <p className="mt-s-1 text-caption-xs text-ink-3">
          익명 <code>visitorId</code> distinct 기준. WAU=최근 7일·MAU=최근 30일 trailing.
        </p>
        <div className="mt-s-4 grid gap-s-3 sm:grid-cols-3">
          <div className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
            <p className="text-caption-xs font-bold text-ink-3">
              DAU{act.latestDau ? ` · ${act.latestDau.date}` : " (최근 활동일)"}
            </p>
            <p className="mt-s-1 text-h2 font-extrabold text-ink">{act.latestDau?.visitors ?? 0}</p>
            <p className="mt-s-1 text-caption-xs text-ink-3">최근 활동일 distinct 방문자</p>
          </div>
          <div className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
            <p className="text-caption-xs font-bold text-ink-3">WAU (7일)</p>
            <p className="mt-s-1 text-h2 font-extrabold text-ink">{act.wau}</p>
            <p className="mt-s-1 text-caption-xs text-ink-3">최근 7일 distinct 방문자</p>
          </div>
          <div className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
            <p className="text-caption-xs font-bold text-ink-3">MAU (30일)</p>
            <p className="mt-s-1 text-h2 font-extrabold text-ink">{act.mau}</p>
            <p className="mt-s-1 text-caption-xs text-ink-3">최근 30일 distinct 방문자</p>
          </div>
        </div>

        {act.dau.length > 0 ? (
          <div className="mt-s-4">
            <p className="text-caption-xs font-bold text-ink-3">일별 DAU (최근 {act.dau.length}일 · 데이터 있는 날)</p>
            <div className="mt-s-2 flex items-end gap-0.5" style={{ height: "112px" }}>
              {act.dau.map((x) => (
                <div key={x.date} className="flex h-full flex-1 flex-col items-center justify-end" title={`${x.date}: ${x.visitors}명`}>
                  <span className="mb-px text-[9px] font-bold leading-none text-ink-2">{x.visitors}</span>
                  <div
                    className="w-full rounded-t-xs bg-info"
                    style={{ height: `${Math.max((x.visitors / dauMax) * 100, 6)}%` }}
                    aria-hidden
                  />
                </div>
              ))}
            </div>
            <div className="mt-s-1 flex justify-between text-caption-xs text-ink-3">
              <span>{act.dau[0].date}</span>
              <span>최대 {dauMax}명/일</span>
              <span>{act.dau[act.dau.length - 1].date}</span>
            </div>
          </div>
        ) : null}

        {act.nullVisitorRows > 0 ? (
          <p className="mt-s-2 text-caption-xs text-warning">
            ※ visitorId 없는 {act.nullVisitorRows}행(시크릿/차단)은 distinct 제외 — 과소 집계 가능.
          </p>
        ) : null}
      </section>

      {/* NSM (E3) — 주간 진단 완료 추세 + 선행 지표 */}
      <section aria-label="NSM" className="mt-s-8 border-t border-card-border pt-s-6">
        <h2 className="text-h3 font-extrabold text-ink">🌟 NSM — 주간 진단 완료 수</h2>
        <p className="mt-s-1 text-caption-xs text-ink-3">
          주(월~일) 단위 <code>diagnosis_completed</code>. 목표 {nsm.target3mo}건/주(3개월) → {nsm.target6mo}건/주(6개월), REQ-NF-026.
        </p>

        {nsm.weeks.length > 0 ? (
          <div className="mt-s-4">
            <div className="relative" style={{ height: "120px" }}>
              {/* ★ 3개월 목표선(50/주) — 추세 대비 갭 가시화 */}
              <div
                className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-danger"
                style={{ bottom: `${Math.min((nsm.target3mo / nsmMax) * 100, 100)}%` }}
              >
                <span className="absolute -top-2.5 right-0 bg-bg px-1 text-[10px] font-bold text-danger">
                  목표 {nsm.target3mo}/주
                </span>
              </div>
              <div className="flex h-full items-end gap-s-2">
                {nsm.weeks.map((w) => (
                  <div
                    key={w.weekStart}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                    title={`${w.weekStart} 주: ${w.completed}건`}
                  >
                    <span className="mb-px text-caption-xs font-bold text-ink">{w.completed}</span>
                    <div
                      className="w-full rounded-t-xs bg-warning"
                      style={{ height: `${Math.max((w.completed / nsmMax) * 100, 4)}%` }}
                      aria-hidden
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-s-1 flex gap-s-2">
              {nsm.weeks.map((w) => (
                <span key={w.weekStart} className="flex-1 text-center text-caption-xs text-ink-3">
                  {w.weekStart.slice(5)}
                </span>
              ))}
            </div>
            <p className="mt-s-2 text-caption-xs text-ink-3">
              주별 추세 · 빨간 점선 = 3개월 목표({nsm.target3mo}/주), 6개월 {nsm.target6mo}/주. 최근 주 NSM:{" "}
              <strong className="text-ink">{nsm.latest?.completed ?? 0}</strong> / 목표 {nsm.target3mo}.
            </p>
          </div>
        ) : (
          <p className="mt-s-3 text-caption text-ink-2">아직 완료 이벤트가 없습니다.</p>
        )}

        {/* 선행 지표 3종 (getInsights.rates 재노출 — 상세는 핵심 전환율 섹션) */}
        <p className="mt-s-5 text-caption-xs font-bold text-ink-3">선행 지표 (NSM 인과)</p>
        <div className="mt-s-2 grid gap-s-3 sm:grid-cols-3">
          <div className="rounded-lg border border-card-border bg-surface p-s-3">
            <p className="text-caption-xs text-ink-3">주소 2건 입력 완료율</p>
            <p className="mt-s-1 text-h3 font-extrabold text-ink">{fmtRate(d.rates.inputCompletion)}</p>
          </div>
          <div className="rounded-lg border border-card-border bg-surface p-s-3">
            <p className="text-caption-xs text-ink-3">진단 제출 성공률</p>
            <p className="mt-s-1 text-h3 font-extrabold text-ink">{fmtRate(d.rates.submitSuccess)}</p>
          </div>
          <div className="rounded-lg border border-card-border bg-surface p-s-3">
            <p className="text-caption-xs text-ink-3">공유 링크 생성률</p>
            <p className="mt-s-1 text-h3 font-extrabold text-ink">{fmtRate(d.rates.shareCreation)}</p>
          </div>
        </div>

        {nsm.dedup.nullRows > 0 ? (
          <p className="mt-s-2 text-caption-xs text-warning">
            ※ diagnosisId 없는 {nsm.dedup.nullRows}건은 중복제거 불가 → 행 카운트 폴백(과다 집계 가능). distinct ID {nsm.dedup.distinctIds}건.
          </p>
        ) : null}
      </section>

      {/* 11종 퍼널 */}
      <section aria-label="퍼널" className="mt-s-8 border-t border-card-border pt-s-6">
        <h2 className="text-h3 font-extrabold text-ink">전환 퍼널 (11종)</h2>
        <p className="mt-s-1 text-caption-xs text-ink-3">% = 랜딩 노출 대비. 막대 색 = AARRR 단계.</p>
        <div className="mt-s-4 space-y-s-2">
          {FUNNEL_STEPS.map((s, i) => (
            <FunnelRow key={s.key} label={s.label} stage={s.stage} count={funnelCounts[i]} max={max} topCount={topCount} />
          ))}
        </div>
        <p className="mt-s-5 text-caption-xs font-bold text-ink-3">Referral · Retention</p>
        <div className="mt-s-2 space-y-s-2">
          {OTHER_EVENTS.map((s, i) => (
            <FunnelRow key={s.key} label={s.label} stage={s.stage} count={otherCounts[i]} max={max} topCount={topCount} />
          ))}
        </div>
      </section>

      {/* 로그인 방식 분류 (login_entered.method) */}
      <section aria-label="로그인 방식" className="mt-s-8 border-t border-card-border pt-s-6">
        <h2 className="text-h3 font-extrabold text-ink">로그인 방식 분류</h2>
        <p className="mt-s-1 text-caption-xs text-ink-3">
          <code>login_entered</code> 의 <code>method</code> 기준 분포. 총 {login.total}건의 로그인 진입.
        </p>
        {login.total === 0 ? (
          <p className="mt-s-3 text-caption text-ink-2">아직 로그인 진입 이벤트가 없습니다.</p>
        ) : (
          <div className="mt-s-4 grid gap-s-3 sm:grid-cols-3">
            {LOGIN_METHODS.map(({ key, label, color }) => {
              const count = login[key];
              const ratio = login.total > 0 ? Math.round((count / login.total) * 1000) / 10 : 0;
              return (
                <div key={key} className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
                  <p className="text-caption-xs font-bold text-ink-3">{label}</p>
                  <p className="mt-s-1 text-h2 font-extrabold text-ink">{count}</p>
                  {/* ★ 막대 너비 = 인라인 style(JIT 누락 방지). 색만 정적 토큰 클래스 */}
                  <div className="mt-s-2 h-2 w-full overflow-hidden rounded-sm bg-bg" aria-hidden>
                    <div className={`h-full rounded-sm ${color}`} style={{ width: `${ratio}%` }} />
                  </div>
                  <p className="mt-s-1 text-caption-xs text-ink-3">{ratio}% (전체 로그인 대비)</p>
                </div>
              );
            })}
          </div>
        )}
        {login.unknown > 0 ? (
          <p className="mt-s-2 text-caption-xs text-warning">
            ※ method 없는/기타 {login.unknown}건(과거 데이터·누락)은 분류에서 제외.
          </p>
        ) : null}
      </section>

      {/* 세그먼트 분석 — NSM 추세(선) 2 + 퍼널 비교(막대) 2. 목적별 분리(스파게티 방지). */}
      <section aria-label="세그먼트 분석" className="mt-s-8 border-t border-card-border pt-s-6">
        <h2 className="text-h3 font-extrabold text-ink">세그먼트 분석 — 로그인 방식 · 모드</h2>
        <p className="mt-s-1 text-caption-xs leading-relaxed text-ink-3">
          완료·단계 이벤트를 방문자의 로그인 방식·모드로 귀속(<code>diagnosis_completed</code> 엔 세그먼트 컬럼이 없어{" "}
          <code>visitorId</code> 로 추론). 소스 토글만 연동(모드 필터 미적용 — 차트가 직접 분해). 추세는 27일치 데이터(preview)에서 의미.
        </p>

        <div className="mt-s-4 grid gap-s-4 lg:grid-cols-2">
          {/* ① NSM 추세 — 로그인 방식별(선) */}
          <div className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
            <p className="text-caption-xs font-bold text-ink-3">① NSM 추세 — 로그인 방식별 (주간 완료)</p>
            {seg.weeks.length >= 2 ? (
              <div className="mt-s-3">
                <SegLineChart weeks={seg.weeks} series={seg.nsmByMethod} />
              </div>
            ) : (
              <p className="mt-s-2 text-caption-xs text-ink-2">추세선은 2주 이상 데이터 필요(현재 {seg.weeks.length}주) — 누적 합계만 표시.</p>
            )}
            <SegLegend series={seg.nsmByMethod} unit="건" />
            {seg.excluded.methodUnknown > 0 ? (
              <p className="mt-s-2 text-caption-xs text-warning">※ 로그인 방식 미상 방문자 {seg.excluded.methodUnknown}명 제외.</p>
            ) : null}
          </div>

          {/* ② NSM 추세 — 모드별(선) */}
          <div className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
            <p className="text-caption-xs font-bold text-ink-3">② NSM 추세 — 모드별 (주간 완료)</p>
            {seg.weeks.length >= 2 ? (
              <div className="mt-s-3">
                <SegLineChart weeks={seg.weeks} series={seg.nsmByMode} />
              </div>
            ) : (
              <p className="mt-s-2 text-caption-xs text-ink-2">추세선은 2주 이상 데이터 필요(현재 {seg.weeks.length}주) — 누적 합계만 표시.</p>
            )}
            <SegLegend series={seg.nsmByMode} unit="건" />
            {seg.excluded.modeUnknown > 0 ? (
              <p className="mt-s-2 text-caption-xs text-warning">※ 모드 미상 방문자 {seg.excluded.modeUnknown}명 제외(모드 선택 전 이탈 등).</p>
            ) : null}
          </div>

          {/* ③ 퍼널 비교 — 로그인 방식별(막대) */}
          <div className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
            <p className="text-caption-xs font-bold text-ink-3">③ 퍼널 비교 — 로그인 방식별 (핵심 5단계)</p>
            <div className="mt-s-3">
              <SegBarCompare steps={seg.funnelSteps} series={seg.funnelByMethod} />
            </div>
            <SegLegend series={seg.funnelByMethod} unit="이벤트" />
            {seg.excluded.methodUnknown > 0 ? (
              <p className="mt-s-2 text-caption-xs text-warning">※ 로그인 방식 미상 방문자 {seg.excluded.methodUnknown}명 제외.</p>
            ) : null}
          </div>

          {/* ④ 퍼널 비교 — 모드별(막대) */}
          <div className="rounded-lg border border-card-border bg-surface p-s-4 shadow-card">
            <p className="text-caption-xs font-bold text-ink-3">④ 퍼널 비교 — 모드별 (핵심 5단계)</p>
            <div className="mt-s-3">
              <SegBarCompare steps={seg.funnelSteps} series={seg.funnelByMode} />
            </div>
            <SegLegend series={seg.funnelByMode} unit="이벤트" />
            {seg.excluded.modeUnknown > 0 ? (
              <p className="mt-s-2 text-caption-xs text-warning">※ 모드 미상 방문자 {seg.excluded.modeUnknown}명 제외(모드 선택 전 이탈 등).</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* 핵심 전환율 3종 */}
      <section aria-label="핵심 전환율" className="mt-s-8">
        <h2 className="text-h3 font-extrabold text-ink">핵심 전환율 (NSM 선행 지표)</h2>
        <div className="mt-s-4 grid gap-s-3 sm:grid-cols-3">
          <RateCard
            title="주소 2건 입력 완료율"
            rate={d.rates.inputCompletion}
            formula={`address_verified(2) ${d.addressVerified2} ÷ input_viewed ${d.counts["diagnosis_input_viewed"] ?? 0}`}
            note="※ 분모(input_viewed) 다회 발화로 왜곡 가능 — distinct 정규화는 후속."
          />
          <RateCard
            title="진단 제출 성공률"
            rate={d.rates.submitSuccess}
            formula={`started ${d.counts["diagnosis_started"] ?? 0} ÷ submit_clicked ${d.counts["diagnosis_submit_clicked"] ?? 0}`}
          />
          <RateCard
            title="공유 링크 생성률"
            rate={d.rates.shareCreation}
            formula={`share_created ${d.counts["share_link_created"] ?? 0} ÷ completed ${d.counts["diagnosis_completed"] ?? 0}`}
          />
        </div>
      </section>

      {/* UTM 채널별 */}
      <section aria-label="UTM 채널" className="mt-s-8">
        <h2 className="text-h3 font-extrabold text-ink">UTM 채널별 전환율</h2>
        {d.utm.length === 0 ? (
          <p className="mt-s-3 rounded-lg border border-card-border bg-surface p-s-4 text-caption text-ink-2">
            UTM 부착 이벤트가 없습니다. <code>?utm_source=…</code> 로 유입된 진단이 있어야 채널이 표시됩니다.
          </p>
        ) : (
          <div className="mt-s-4 overflow-hidden rounded-lg border border-card-border">
            <table className="w-full text-left text-caption">
              <thead className="bg-bg text-caption-xs text-ink-3">
                <tr>
                  <th className="px-s-4 py-s-2 font-bold">utm_source</th>
                  <th className="px-s-4 py-s-2 text-right font-bold">landing_viewed</th>
                  <th className="px-s-4 py-s-2 text-right font-bold">diagnosis_completed</th>
                  <th className="px-s-4 py-s-2 text-right font-bold">전환율</th>
                </tr>
              </thead>
              <tbody>
                {d.utm.map((c) => (
                  <tr key={c.source} className="border-t border-card-border">
                    <td className="px-s-4 py-s-2 font-bold text-ink">{c.source}</td>
                    <td className="px-s-4 py-s-2 text-right text-ink-2">{c.landed}</td>
                    <td className="px-s-4 py-s-2 text-right text-ink-2">{c.completed}</td>
                    <td className="px-s-4 py-s-2 text-right font-bold text-ink">{fmtRate(c.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="mt-s-9 border-t border-card-border pt-s-5 text-caption-xs leading-relaxed text-ink-3">
        ★ 수치는 <strong>이벤트 단위</strong>(세션·방문자 distinct 미적용) — 소표본에선 <code>login_entered</code> 가{" "}
        <code>landing_viewed</code> 보다 클 수 있음(다회 발화). 정규 전환율(distinct·봇 제외)·가집계/최종집계 크론은{" "}
        <strong>후속 이슈</strong>(미구현). 본 화면은 raw 직접 집계로 소량 데이터에 충분.
      </footer>
    </main>
  );
}
