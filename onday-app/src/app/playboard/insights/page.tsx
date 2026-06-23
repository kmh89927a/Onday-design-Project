import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDeploymentEnv } from "@/lib/health";
import { getInsights, FUNNEL_STEPS, OTHER_EVENTS, type InsightsData } from "@/lib/playboard/insights";

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

export default async function InsightsPage() {
  if (getDeploymentEnv() === "production") notFound();

  const d: InsightsData = await getInsights();
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
          <span className="rounded-sm bg-success-soft px-s-3 py-s-1 font-bold text-success">총 {d.total} 이벤트</span>
          <span className="rounded-sm bg-info-soft px-s-3 py-s-1 font-bold text-info">UTM 부착 {d.utmRows}</span>
          {d.span.first ? (
            <span className="rounded-sm bg-bg px-s-3 py-s-1 text-ink-3">
              {d.span.first.slice(0, 16).replace("T", " ")} ~ {d.span.last?.slice(11, 16)} UTC
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

      {/* 11종 퍼널 */}
      <section aria-label="퍼널" className="mt-s-6">
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
