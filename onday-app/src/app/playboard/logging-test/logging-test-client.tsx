"use client";

import * as React from "react";
import Link from "next/link";

import { getVisitorId } from "@/lib/logging/visitor-id";
import { getDeviceInfo } from "@/lib/logging/device";
import { useSessionStore } from "@/stores/session";
import type { LogUserType } from "@/lib/logging/log-error";

// 로깅 점검 클라이언트 — 400/500 의도적 에러 트리거 + 3-sink 기록 결과 표시.
// ★ visitorId·device/os·userType 를 클라에서 수집해 API 로 전달(로그에 포함).

type SinkResult = {
  status: number;
  errorType: string;
  sinks: { console: boolean; db: boolean; sentry: boolean };
  sent: { visitorId: string | null; device: string | null; os: string | null; userType: LogUserType | null };
};

function YesNo({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-s-2 py-0.5 text-caption-xs font-bold ${
        on ? "bg-success-soft text-success" : "bg-bg text-ink-3 border border-card-border"
      }`}
    >
      {label} {on ? "기록됨" : "미동작"}
    </span>
  );
}

export function LoggingTestClient() {
  const user = useSessionStore((s) => s.user);
  const isGuest = useSessionStore((s) => s.isGuest);
  const isReviewer = useSessionStore((s) => s.isReviewer);
  const [loading, setLoading] = React.useState<400 | 500 | null>(null);
  const [result, setResult] = React.useState<SinkResult | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const userType: LogUserType | null = isReviewer
    ? "reviewer"
    : isGuest
      ? "guest"
      : user?.provider === "kakao"
        ? "kakao"
        : null;

  async function trigger(status: 400 | 500) {
    setLoading(status);
    setErr(null);
    const { device, os } = getDeviceInfo();
    const visitorId = getVisitorId();
    const sent = { visitorId, device, os, userType };
    try {
      const res = await fetch("/api/dev/log-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...sent }),
      });
      const body = (await res.json().catch(() => ({}))) as Omit<SinkResult, "sent">;
      setResult({ ...body, status: res.status, sent });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-s-5 py-s-8 font-sans text-ink">
      <nav className="text-caption">
        <Link href="/playboard" className="font-bold text-primary hover:underline">
          ← Playboard
        </Link>
        <span className="px-s-2 text-ink-3">/</span>
        <span className="text-ink-3">로깅 점검</span>
      </nav>

      <header className="mt-s-4 border-b border-card-border pb-s-5">
        <p className="text-caption-xs font-extrabold uppercase tracking-[0.16em] text-primary">운영자 도구 · dev 전용</p>
        <h1 className="mt-s-2 text-h1 font-extrabold tracking-[-0.02em] text-ink">로깅 점검 (운영자 테스트)</h1>
        <p className="mt-s-2 text-body text-ink-2">
          버튼을 누르면 의도적으로 400/500 에러를 발생시켜 <strong>3-sink(콘솔·ErrorLog DB·Sentry)</strong> 기록을 검증합니다.
          이 페이지·API는 <strong>production 에서 차단</strong>(404)됩니다.
        </p>
      </header>

      {/* 트리거 버튼 */}
      <section aria-label="에러 트리거" className="mt-s-6 flex flex-wrap gap-s-3">
        <button
          type="button"
          onClick={() => trigger(400)}
          disabled={loading !== null}
          className="rounded-lg bg-warning px-s-5 py-s-3 text-body font-bold text-white shadow-card transition hover:brightness-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2"
        >
          {loading === 400 ? "발생 중…" : "400 에러 발생"}
        </button>
        <button
          type="button"
          onClick={() => trigger(500)}
          disabled={loading !== null}
          className="rounded-lg bg-danger px-s-5 py-s-3 text-body font-bold text-white shadow-card transition hover:brightness-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
        >
          {loading === 500 ? "발생 중…" : "500 에러 발생"}
        </button>
      </section>

      {/* 결과 */}
      {err ? (
        <p className="mt-s-5 rounded-lg border border-danger/40 bg-danger-soft p-s-4 text-body-sm text-danger">
          요청 실패: {err}
        </p>
      ) : null}

      {result ? (
        <section aria-label="기록 결과" className="mt-s-5 rounded-lg border border-card-border bg-surface p-s-5 shadow-card">
          <div className="flex flex-wrap items-center gap-s-2">
            <h2 className="text-h3 font-extrabold text-ink">응답 {result.status}</h2>
            <code className="rounded-xs bg-bg px-1.5 py-0.5 text-caption-xs text-ink-3">{result.errorType}</code>
          </div>

          <p className="mt-s-3 text-caption-xs font-bold text-ink-3">3-sink 기록</p>
          <div className="mt-s-2 flex flex-wrap gap-s-2">
            <YesNo on={result.sinks?.console} label="① 콘솔" />
            <YesNo on={result.sinks?.db} label="② DB(ErrorLog)" />
            <YesNo on={result.sinks?.sentry} label="③ Sentry" />
          </div>
          {!result.sinks?.db ? (
            <p className="mt-s-2 rounded-sm bg-warning-soft px-s-3 py-s-2 text-caption-xs leading-relaxed text-ink-2">
              ★ DB sink 미동작 = <code>error_logs</code> 테이블 미적용(best-effort 실패). 마이그레이션 적용 시 기록됩니다(아래 안내). 콘솔·Sentry는 정상.
            </p>
          ) : null}
          {!result.sinks?.sentry ? (
            <p className="mt-s-2 text-caption-xs text-ink-3">※ Sentry 미동작 = DSN 미설정(no-op). DSN 설정 시 전송.</p>
          ) : null}

          <p className="mt-s-4 text-caption-xs font-bold text-ink-3">로그에 포함된 컨텍스트(개인 식별 X)</p>
          <ul className="mt-s-2 grid gap-1 text-caption-xs text-ink-2 sm:grid-cols-2">
            <li>userType: <code className="text-ink">{result.sent.userType ?? "null"}</code></li>
            <li>visitorId: <code className="text-ink">{result.sent.visitorId ?? "null(차단/시크릿)"}</code></li>
            <li>device: <code className="text-ink">{result.sent.device ?? "null"}</code></li>
            <li>os: <code className="text-ink">{result.sent.os ?? "null"}</code></li>
          </ul>
        </section>
      ) : null}

      <footer className="mt-s-9 border-t border-card-border pt-s-5 text-caption-xs leading-relaxed text-ink-3">
        DB sink 활성화: 마이그레이션 <code>20260621000000_add_error_log</code> 를 클라우드에 적용해야 함 —
        <code className="ml-1">DATABASE_URL=$DIRECT_URL_PROD DIRECT_URL=$DIRECT_URL_PROD npm run db:migrate:deploy</code>
        (새 테이블 CREATE만, 기존 데이터 영향 0). 적용 전엔 DB sink 가 best-effort 로 조용히 실패합니다.
      </footer>
    </main>
  );
}
