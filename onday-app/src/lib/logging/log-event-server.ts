// 상세 로그 적재 — 서버측 insert (로거 1단계 토대).
// ★ log-error.ts best-effort 패턴 계승: DB insert 실패해도 조용히 삼킴(앱 흐름 차단 X).
// ★ prod → event_logs / preview·dev → preview_event_logs (prod raw 청결 유지, 환경 격리).
// ★ USER FK 없음 · PII 0 — 비식별 속성만(ErrorLog 답습).

import { prisma } from "@/lib/db";
import { getDeploymentEnv } from "@/lib/health";

export interface EventLogInput {
  eventName: string;
  mode?: string | null;
  method?: string | null;
  count?: number | null;
  daysLeft?: number | null;
  diagnosisId?: string | null;
  visitorId?: string | null;
  props?: string | null;
}

/** event_logs(prod) / preview_event_logs(preview·dev) 에 1행 insert. best-effort. */
export async function logEvent(input: EventLogInput): Promise<void> {
  const data = {
    eventName: input.eventName,
    mode: input.mode ?? null,
    method: input.method ?? null,
    count: input.count ?? null,
    daysLeft: input.daysLeft ?? null,
    diagnosisId: input.diagnosisId ?? null,
    visitorId: input.visitorId ?? null,
    props: input.props ?? null,
  };

  try {
    if (getDeploymentEnv() === "production") {
      await prisma.eventLog.create({ data });
    } else {
      await prisma.previewEventLog.create({ data });
    }
  } catch {
    // best-effort — 테이블 미배포·연결 실패 시 조용히 실패. 앱·기존 동작 영향 0.
  }
}
