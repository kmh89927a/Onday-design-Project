// Playboard Insights — event_logs raw 직접 집계 (크론 0, 읽기 전용 SELECT만).
// ★ event_logs(prod 적재분)를 조회. 발표 전 대시보드의 데이터 계층.
// ★ 기존 무변경: write 0(groupBy/count/findMany/aggregate = SELECT). 마이그레이션 0.
// ★ 데이터 0이어도 안전(전부 0/빈 배열 반환).

import { prisma } from "@/lib/db";

// 11종 = 퍼널 7 + Referral·Retention 4 (LOG_IMPLEMENTATION_OUTLINE.md §1·§2 순서).
export const FUNNEL_STEPS = [
  { key: "landing_viewed", label: "랜딩 노출", stage: "Acquisition" },
  { key: "login_entered", label: "로그인 진입", stage: "Acquisition" },
  { key: "diagnosis_input_viewed", label: "입력 화면", stage: "Activation" },
  { key: "address_verified", label: "주소 검증", stage: "Activation" },
  { key: "diagnosis_submit_clicked", label: "제출 클릭", stage: "Activation" },
  { key: "diagnosis_started", label: "제출 성공", stage: "Activation" },
  { key: "diagnosis_completed", label: "진단 완료 (Aha · NSM)", stage: "Activation" },
] as const;

export const OTHER_EVENTS = [
  { key: "share_link_created", label: "공유 생성", stage: "Referral" },
  { key: "share_link_clicked", label: "공유 클릭", stage: "Referral" },
  { key: "saved_search_loaded", label: "조건 불러오기", stage: "Retention" },
  { key: "deadline_mode_activated", label: "데드라인 활성", stage: "Retention" },
] as const;

export interface UtmChannel {
  source: string;
  landed: number; // landing_viewed
  completed: number; // diagnosis_completed
  total: number; // utm 부착 전체 이벤트
  rate: number | null; // completed/landed %
}

export interface InsightsData {
  total: number;
  counts: Record<string, number>;
  addressVerified2: number; // count=2 (입력완료율 분자)
  rates: {
    inputCompletion: number | null; // address_verified(2) / diagnosis_input_viewed
    submitSuccess: number | null; // diagnosis_started / diagnosis_submit_clicked
    shareCreation: number | null; // share_link_created / diagnosis_completed
  };
  utm: UtmChannel[];
  utmRows: number;
  span: { first: string | null; last: string | null };
}

const pct = (num: number, den: number): number | null =>
  den > 0 ? Math.round((num / den) * 1000) / 10 : null;

// 데이터 소스 — prod=event_logs(실), preview=preview_event_logs(더미 데모).
// ★ 읽는 테이블만 교체(write 0). preview 는 dev/preview 에서만 의미(페이지가 prod 차단).
export type InsightsSource = "prod" | "preview";

export async function getInsights(source: InsightsSource = "prod"): Promise<InsightsData> {
  // 두 모델은 스키마 동일(필드·인덱스) — preview 델리게이트를 eventLog 타입으로 캐스팅해 읽기만 분기.
  const model = (source === "preview" ? prisma.previewEventLog : prisma.eventLog) as typeof prisma.eventLog;

  const grouped = await model.groupBy({ by: ["eventName"], _count: { _all: true } });
  const counts: Record<string, number> = {};
  let total = 0;
  for (const g of grouped) {
    counts[g.eventName] = g._count._all;
    total += g._count._all;
  }

  const addressVerified2 = await model.count({
    where: { eventName: "address_verified", count: 2 },
  });

  const rates = {
    inputCompletion: pct(addressVerified2, counts["diagnosis_input_viewed"] ?? 0),
    submitSuccess: pct(counts["diagnosis_started"] ?? 0, counts["diagnosis_submit_clicked"] ?? 0),
    shareCreation: pct(counts["share_link_created"] ?? 0, counts["diagnosis_completed"] ?? 0),
  };

  // UTM 채널 — props(JSON)에서 utm_source 추출 후 채널별 집계.
  const utmRowsRaw = await model.findMany({
    where: { NOT: { props: null } },
    select: { eventName: true, props: true },
  });
  const bySource = new Map<string, UtmChannel>();
  for (const r of utmRowsRaw) {
    let source = "(unknown)";
    try {
      const o = JSON.parse(r.props as string) as { utm_source?: unknown };
      if (typeof o.utm_source === "string") source = o.utm_source;
    } catch {
      // best-effort — 파싱 실패 시 unknown
    }
    const ch = bySource.get(source) ?? { source, landed: 0, completed: 0, total: 0, rate: null };
    ch.total += 1;
    if (r.eventName === "landing_viewed") ch.landed += 1;
    if (r.eventName === "diagnosis_completed") ch.completed += 1;
    bySource.set(source, ch);
  }
  const utm = [...bySource.values()]
    .map((c) => ({ ...c, rate: pct(c.completed, c.landed) }))
    .sort((a, b) => b.total - a.total);

  const agg = await model.aggregate({
    _min: { timestamp: true },
    _max: { timestamp: true },
  });

  return {
    total,
    counts,
    addressVerified2,
    rates,
    utm,
    utmRows: utmRowsRaw.length,
    span: {
      first: agg._min.timestamp?.toISOString() ?? null,
      last: agg._max.timestamp?.toISOString() ?? null,
    },
  };
}
