// 개발 테스트·데모용 더미 이벤트 시딩 — preview_event_logs 전용.
// ★★ prod event_logs 절대 미접근(격리). ★ PII 0: 익명 visitorId·utm·mode·method·count만.
// ★ 재실행 안전: visitorId 프리픽스 "seed_" 행만 지우고 재생성(실/타 데이터 무관).
// 실행: npx tsx scripts/seed-preview-events.ts
//
// 개연성: 유입→이탈→완료 funnel drop-off + UTM 채널 + 30일 분산(DAU/WAU/MAU 데모용).

import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

const SEED_PREFIX = "seed_";
const N_VISITORS = 80;
const SPAN_DAYS = 30;

// ★ 고정 시드 PRNG(mulberry32) — 재실행 시 동일 분포 재현(데모 재현성·결정적 funnel drop-off).
//   timestamp 의 now 앵커만 실행시각에 따라가고, 모든 확률 분기는 결정적.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260623);

// UTM 채널 가중(direct=utm 없음). 합 1.0.
const UTM_CHANNELS: { source: string; medium: string; campaign: string; w: number }[] = [
  { source: "instagram", medium: "social", campaign: "spring_launch", w: 0.22 },
  { source: "naver", medium: "cpc", campaign: "brand_kw", w: 0.18 },
  { source: "kakao", medium: "social", campaign: "moment", w: 0.13 },
  { source: "google", medium: "cpc", campaign: "search_generic", w: 0.07 },
];
const DIRECT_RATE = 0.4; // 40% 직접 유입(utm 없음)

// funnel 단계별 "직전 도달자 중 다음 도달 확률".
const RET = {
  login: 0.72,
  input: 0.8,
  addr1: 0.85,
  addr2: 0.82, // couple 만(주소 B)
  submit: 0.85,
  started: 0.92,
  completed: 0.93,
  shareCreated: 0.3,
  shareClicked: 0.45,
  savedLater: 0.2, // 완료자 중 재방문 불러오기
  deadlineLater: 0.15,
};

type Row = {
  eventName: string;
  timestamp: Date;
  mode?: string | null;
  method?: string | null;
  count?: number | null;
  daysLeft?: number | null;
  diagnosisId?: string | null;
  visitorId: string;
  props?: string | null;
};

function hit(p: number): boolean {
  return rand() < p;
}
function pickUtm(): { source: string; medium: string; campaign: string } | null {
  if (rand() < DIRECT_RATE) return null;
  let r = rand() * UTM_CHANNELS.reduce((s, c) => s + c.w, 0);
  for (const c of UTM_CHANNELS) {
    if ((r -= c.w) <= 0) return { source: c.source, medium: c.medium, campaign: c.campaign };
  }
  return UTM_CHANNELS[0];
}

function buildRows(): Row[] {
  const now = Date.now();
  const rows: Row[] = [];

  for (let i = 0; i < N_VISITORS; i++) {
    const visitorId = `${SEED_PREFIX}v_${String(i).padStart(3, "0")}`;
    const mode = hit(0.7) ? "couple" : "single";
    const utm = pickUtm();
    const props = utm
      ? JSON.stringify({ utm_source: utm.source, utm_medium: utm.medium, utm_campaign: utm.campaign })
      : null;

    // 세션 시작 시각: 최근 SPAN_DAYS 내(결정적 분포, now 앵커만 실행시각).
    const sessionStart = now - Math.floor(rand() * SPAN_DAYS * 864e5);
    let t = sessionStart;
    const step = () => {
      t += (30 + Math.floor(rand() * 270)) * 1000; // 0.5~5분 간격
      return new Date(t);
    };

    // ① landing (전원) — utm props 부착.
    rows.push({ eventName: "landing_viewed", timestamp: step(), visitorId, props });
    // ② login
    if (!hit(RET.login)) continue;
    const method = (() => {
      const r = rand();
      return r < 0.5 ? "kakao" : r < 0.9 ? "guest" : "reviewer";
    })();
    rows.push({ eventName: "login_entered", timestamp: step(), method, visitorId, props });
    // ③ input
    if (!hit(RET.input)) continue;
    rows.push({ eventName: "diagnosis_input_viewed", timestamp: step(), mode, visitorId, props });
    // ④ address A
    if (!hit(RET.addr1)) continue;
    rows.push({ eventName: "address_verified", timestamp: step(), count: 1, visitorId, props });
    // 주소 B(couple 만)
    if (mode === "couple" && hit(RET.addr2)) {
      rows.push({ eventName: "address_verified", timestamp: step(), count: 2, visitorId, props });
    }
    // ⑤ submit
    if (!hit(RET.submit)) continue;
    rows.push({ eventName: "diagnosis_submit_clicked", timestamp: step(), mode, visitorId, props });
    // ⑥ started
    if (!hit(RET.started)) continue;
    const diagnosisId = `${SEED_PREFIX}dx_${String(i).padStart(3, "0")}`;
    rows.push({ eventName: "diagnosis_started", timestamp: step(), diagnosisId, visitorId, props });
    // ⑦ completed (Aha)
    if (!hit(RET.completed)) continue;
    rows.push({ eventName: "diagnosis_completed", timestamp: step(), diagnosisId, visitorId, props });

    // Referral — couple 이 공유 동기 ↑.
    const shareP = mode === "couple" ? RET.shareCreated : RET.shareCreated * 0.4;
    if (hit(shareP)) {
      rows.push({ eventName: "share_link_created", timestamp: step(), mode, diagnosisId, visitorId, props });
      if (hit(RET.shareClicked)) {
        rows.push({ eventName: "share_link_clicked", timestamp: step(), mode, visitorId, props });
      }
    }
    // Retention — 다른 날 재방문.
    if (hit(RET.savedLater)) {
      const later = new Date(t + (1 + Math.floor(rand() * 13)) * 864e5);
      rows.push({ eventName: "saved_search_loaded", timestamp: later, mode, visitorId, props });
    }
    if (hit(RET.deadlineLater)) {
      const later = new Date(t + (1 + Math.floor(rand() * 20)) * 864e5);
      rows.push({ eventName: "deadline_mode_activated", timestamp: later, daysLeft: 7 + Math.floor(rand() * 50), visitorId, props });
    }
  }
  return rows;
}

async function main() {
  // ★ 안전 가드: prod 절대 미접근. seed_ 행만 정리 후 재생성.
  const removed = await prisma.previewEventLog.deleteMany({ where: { visitorId: { startsWith: SEED_PREFIX } } });
  const rows = buildRows();
  await prisma.previewEventLog.createMany({ data: rows });

  const total = await prisma.previewEventLog.count();
  const byName = await prisma.previewEventLog.groupBy({ by: ["eventName"], _count: { _all: true } });
  console.log(`정리(seed_): ${removed.count}행 → 시딩: ${rows.length}행 | preview_event_logs 총 ${total}행`);
  console.log("이벤트별:", JSON.stringify(byName.map((r) => ({ e: r.eventName, n: r._count._all }))));
  console.log("prod event_logs(미접근 확인):", await prisma.eventLog.count());
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("SEED FAIL:", e?.message ?? e);
  await prisma.$disconnect();
  process.exit(1);
});
