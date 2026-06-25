// preview 더미(seed_) 로그 → GA4 백필 전송 스크립트 (S4, T1). ★ 수동 실행 전용.
// ★★ 읽기 전용 — preview_event_logs 에서 seed_ 행만 SELECT. DB write 0. ★ prod event_logs 절대 미접근(모델 자체가 previewEventLog).
// ★ 라이브 경로 무변경 — 이 스크립트는 빌드/앱에 포함되지 않고 사람이 직접 실행. 클라 gtag·Mixpanel·자체DB·진단 무관.
// ★ 이중집계 0 — 전송 대상은 preview 더미뿐(라이브 트래픽 아님).
// ★ GA4_API_SECRET 필요 — 미설정 시 sendGa4Event 가 no-op(전송 0). 본 스크립트는 사전 점검 후 안내하고 종료.
//
// 사용:
//   npx tsx scripts/send-preview-events-to-ga4.ts                 # 최근 50건, 수신시각(now)으로 실전송 → Realtime/DebugView 즉시 표시
//   npx tsx scripts/send-preview-events-to-ga4.ts --debug         # /debug/mp/collect 검증만(실 적재 X) — 형식 점검
//   npx tsx scripts/send-preview-events-to-ga4.ts --limit=10
//   npx tsx scripts/send-preview-events-to-ga4.ts --original-time # 원본 timestamp 사용(★ MP ~72h 제약 — 오래된 더미는 누락 가능)

import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sendGa4Event } from "../src/lib/analytics/ga-measurement-protocol";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

const SEED_PREFIX = "seed_";

function parseArgs() {
  const a = process.argv.slice(2);
  const limitArg = a.find((x) => x.startsWith("--limit="));
  return {
    debug: a.includes("--debug"),
    originalTime: a.includes("--original-time"),
    limit: limitArg ? Math.max(1, parseInt(limitArg.split("=")[1], 10) || 50) : 50,
  };
}

type Row = {
  eventName: string;
  mode: string | null;
  method: string | null;
  count: number | null;
  daysLeft: number | null;
  diagnosisId: string | null;
  visitorId: string | null;
  timestamp: Date;
};

// 비식별 속성만 GA4 파라미터로(클라 gtag fan-out 과 동일 매핑). PII 0.
function toParams(r: Row): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  if (r.mode) p.mode = r.mode;
  if (r.method) p.method = r.method;
  if (r.count != null) p.count = r.count;
  if (r.daysLeft != null) p.days_left = r.daysLeft;
  if (r.diagnosisId) p.diagnosis_id = r.diagnosisId;
  return p;
}

async function main() {
  const { debug, originalTime, limit } = parseArgs();

  // ── 사전 점검: env(회귀 없이 안내) ──
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    console.log("⚠️  NEXT_PUBLIC_GA_MEASUREMENT_ID 미설정 → 전송 0. (docs/ga4/SETUP_GUIDE.md §4) 종료.");
    return;
  }
  const hasSecret = !!process.env.GA4_API_SECRET;

  // ── 읽기 전용 SELECT — preview 더미(seed_)만. prod 미접근. ──
  const rows = (await prisma.previewEventLog.findMany({
    where: { visitorId: { startsWith: SEED_PREFIX } },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      eventName: true,
      mode: true,
      method: true,
      count: true,
      daysLeft: true,
      diagnosisId: true,
      visitorId: true,
      timestamp: true,
    },
  })) as Row[];

  console.log(`📖 읽기전용 SELECT: preview_event_logs seed_ 행 ${rows.length}건 (limit ${limit}). prod event_logs 미접근.`);

  if (!hasSecret) {
    console.log("⚠️  GA4_API_SECRET 미설정 → sendGa4Event no-op(전송 0). 회귀 0.");
    console.log("   설정법: docs/ga4/SETUP_GUIDE.md §5 (웹 스트림 → Measurement Protocol API secrets → 생성)");
    console.log("   .env.local 에 GA4_API_SECRET=... 추가 후 재실행하면 위 행들이 GA4 로 전송됩니다.");
    console.log(`   (이번 실행은 읽기전용 점검만 수행: 전송 대상 ${rows.length}건 확인.)`);
    return;
  }

  if (rows.length === 0) {
    console.log("전송할 더미가 없습니다. 먼저 `npx tsx scripts/seed-preview-events.ts` 로 시딩하세요.");
    return;
  }

  console.log(
    `🚀 GA4 전송 시작 — ${debug ? "DEBUG(/debug/mp/collect, 실적재 X)" : "실전송(/mp/collect)"} · ` +
      `${originalTime ? "원본 timestamp(★~72h 제약)" : "수신시각(now)"} · ${rows.length}건`,
  );

  let ok = 0;
  const skipped: Record<string, number> = {};
  let errors = 0;
  let firstDebugMsg: unknown;

  for (const r of rows) {
    if (!r.visitorId) continue;
    const res = await sendGa4Event(r.visitorId, r.eventName, toParams(r), {
      debug,
      timestampMicros: originalTime ? r.timestamp.getTime() * 1000 : undefined,
    });
    if (res.ok) ok += 1;
    else if (res.skipped) skipped[res.skipped] = (skipped[res.skipped] ?? 0) + 1;
    else errors += 1;
    if (debug && firstDebugMsg === undefined) firstDebugMsg = res.validationMessages;
  }

  console.log(`✅ 완료 — ok ${ok} · skipped ${JSON.stringify(skipped)} · errors ${errors}`);
  if (debug) console.log("🔎 첫 행 검증 메시지:", JSON.stringify(firstDebugMsg));
  if (!debug && ok > 0) console.log("→ GA4 콘솔: 보고서 → 실시간(Realtime) / 관리 → DebugView 에서 도착 확인.");
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
