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

// 모드 필터(부부/싱글) — mode 컬럼은 5개 이벤트(input_viewed·submit_clicked·share_*·saved_search)만 보유.
// ★ 그래서 방문자의 mode 를 그 이벤트로 추론(visitorId→mode)한 뒤, 그 방문자의 전 이벤트를 필터한다.
//   → mode 이벤트가 없는 방문자(랜딩만 이탈 등)는 모드뷰에서 제외(전체뷰엔 포함). 정직 표기.
export type ModeFilter = "couple" | "single";

function delegate(source: InsightsSource) {
  return (source === "preview" ? prisma.previewEventLog : prisma.eventLog) as typeof prisma.eventLog;
}

// 해당 모드 방문자 visitorId 목록(mode 보유 이벤트 기준 distinct).
async function modeVisitorIds(model: typeof prisma.eventLog, mode: ModeFilter): Promise<string[]> {
  const rows = await model.findMany({
    where: { mode },
    select: { visitorId: true },
    distinct: ["visitorId"],
  });
  return rows.map((r) => r.visitorId).filter((v): v is string => v != null);
}

export async function getInsights(source: InsightsSource = "prod", mode?: ModeFilter): Promise<InsightsData> {
  const model = delegate(source);
  // mode 미지정 → modeWhere undefined → 쿼리 동일(기존 무변경). 지정 시 visitorId IN 필터.
  const modeWhere = mode ? { visitorId: { in: await modeVisitorIds(model, mode) } } : undefined;

  const grouped = await model.groupBy({ by: ["eventName"], _count: { _all: true }, where: modeWhere });
  const counts: Record<string, number> = {};
  let total = 0;
  for (const g of grouped) {
    counts[g.eventName] = g._count._all;
    total += g._count._all;
  }

  const addressVerified2 = await model.count({
    where: { eventName: "address_verified", count: 2, ...(modeWhere ?? {}) },
  });

  const rates = {
    inputCompletion: pct(addressVerified2, counts["diagnosis_input_viewed"] ?? 0),
    submitSuccess: pct(counts["diagnosis_started"] ?? 0, counts["diagnosis_submit_clicked"] ?? 0),
    shareCreation: pct(counts["share_link_created"] ?? 0, counts["diagnosis_completed"] ?? 0),
  };

  // UTM 채널 — props(JSON)에서 utm_source 추출 후 채널별 집계.
  const utmRowsRaw = await model.findMany({
    where: { NOT: { props: null }, ...(modeWhere ?? {}) },
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
    where: modeWhere,
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

// ── 로그인 방식 분류 (login_entered.method) — kakao/guest/reviewer 분포. 읽기 전용 SELECT. ──
// ★ method 컬럼은 login_entered 에만 채워짐. null·과거데이터·예상밖 값은 unknown 으로 안전 처리.
export interface LoginMethods {
  total: number; // login_entered 총건(method 유무 무관)
  kakao: number;
  guest: number;
  reviewer: number;
  unknown: number; // method null·예상밖 값(과거/누락)
}

export async function getLoginMethods(source: InsightsSource = "prod", mode?: ModeFilter): Promise<LoginMethods> {
  const model = delegate(source);
  const modeWhere = mode ? { visitorId: { in: await modeVisitorIds(model, mode) } } : undefined;
  const grouped = await model.groupBy({
    by: ["method"],
    where: { eventName: "login_entered", ...(modeWhere ?? {}) },
    _count: { _all: true },
  });

  const result: LoginMethods = { total: 0, kakao: 0, guest: 0, reviewer: 0, unknown: 0 };
  for (const g of grouped) {
    const n = g._count._all;
    result.total += n;
    if (g.method === "kakao") result.kakao += n;
    else if (g.method === "guest") result.guest += n;
    else if (g.method === "reviewer") result.reviewer += n;
    else result.unknown += n; // null·예상밖 값
  }
  return result;
}

// ── 활성 지표 (E1) — DAU/WAU/MAU. 익명 visitorId distinct 기준(PII 0), raw 직접(크론 0). ──
const DAU_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

export interface ActivityData {
  dau: { date: string; visitors: number }[]; // 최근 DAU_WINDOW_DAYS 일(데이터 있는 날)
  latestDau: { date: string; visitors: number } | null; // 최근 활동일 DAU
  wau: number; // 최근 7일 trailing distinct
  mau: number; // 최근 30일 trailing distinct
  totalVisitors: number; // 전체 distinct(참고)
  nullVisitorRows: number; // visitorId null(distinct 제외) — 과소집계 주석용
}

export async function getActivity(source: InsightsSource = "prod", mode?: ModeFilter): Promise<ActivityData> {
  const model = delegate(source);
  const modeWhere = mode ? { visitorId: { in: await modeVisitorIds(model, mode) } } : undefined;
  const rows = await model.findMany({ where: modeWhere, select: { visitorId: true, timestamp: true } });

  const now = Date.now();
  const perDay = new Map<string, Set<string>>();
  const wauSet = new Set<string>();
  const mauSet = new Set<string>();
  const allSet = new Set<string>();
  let nullVisitorRows = 0;

  for (const r of rows) {
    if (!r.visitorId) {
      nullVisitorRows += 1; // distinct 불가 → 제외(과소집계 가능)
      continue;
    }
    const t = r.timestamp.getTime();
    if (t > now) continue; // 미래 타임스탬프(더미 아티팩트 등) 방어 — 활성 집계서 제외
    const day = r.timestamp.toISOString().slice(0, 10);
    let set = perDay.get(day);
    if (!set) {
      set = new Set();
      perDay.set(day, set);
    }
    set.add(r.visitorId);
    allSet.add(r.visitorId);
    if (now - t <= 7 * DAY_MS) wauSet.add(r.visitorId);
    if (now - t <= 30 * DAY_MS) mauSet.add(r.visitorId);
  }

  const dau = [...perDay.entries()]
    .map(([date, set]) => ({ date, visitors: set.size }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-DAU_WINDOW_DAYS);

  return {
    dau,
    latestDau: dau.length ? dau[dau.length - 1] : null,
    wau: wauSet.size,
    mau: mauSet.size,
    totalVisitors: allSet.size,
    nullVisitorRows,
  };
}

// ── NSM (E3) — 주간 진단 완료 수 추세 + 목표선. diagnosisId 중복제거(null=행 카운트 폴백). ──
const NSM_WEEKS = 8;
const NSM_TARGET_3MO = 50; // REQ-NF-026: 3개월 50건/주
const NSM_TARGET_6MO = 200; // REQ-NF-026: 6개월 200건/주

export interface NsmTrend {
  weeks: { weekStart: string; completed: number }[]; // 최근 NSM_WEEKS 주(데이터 있는 주)
  latest: { weekStart: string; completed: number } | null;
  dedup: { distinctIds: number; nullRows: number }; // 정직 표기 — null 은 행 카운트 폴백
  target3mo: number;
  target6mo: number;
}

// 주(월요일) 시작일(UTC) — YYYY-MM-DD.
function weekStartUTC(d: Date): string {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = dt.getUTCDay(); // 0=일..6=토
  dt.setUTCDate(dt.getUTCDate() + (day === 0 ? -6 : 1 - day)); // 월요일로
  return dt.toISOString().slice(0, 10);
}

export async function getNsmTrend(source: InsightsSource = "prod", mode?: ModeFilter): Promise<NsmTrend> {
  const model = delegate(source);
  const modeWhere = mode ? { visitorId: { in: await modeVisitorIds(model, mode) } } : undefined;
  const rows = await model.findMany({
    where: { eventName: "diagnosis_completed", ...(modeWhere ?? {}) },
    select: { diagnosisId: true, timestamp: true },
  });

  const now = Date.now();
  const perWeek = new Map<string, { ids: Set<string>; nulls: number }>();
  const distinctIds = new Set<string>();
  let nullRows = 0;

  for (const r of rows) {
    if (r.timestamp.getTime() > now) continue; // 미래 일자 방어(E1 패턴 계승)
    const ws = weekStartUTC(r.timestamp);
    let w = perWeek.get(ws);
    if (!w) {
      w = { ids: new Set(), nulls: 0 };
      perWeek.set(ws, w);
    }
    if (r.diagnosisId) {
      w.ids.add(r.diagnosisId); // 중복제거(같은 진단 재진입 1회로)
      distinctIds.add(r.diagnosisId);
    } else {
      w.nulls += 1; // ★ diagnosisId null → dedup 불가 → 행 카운트 폴백(누수 가능, 정직 표기)
      nullRows += 1;
    }
  }

  const weeks = [...perWeek.entries()]
    .map(([weekStart, w]) => ({ weekStart, completed: w.ids.size + w.nulls }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-NSM_WEEKS);

  return {
    weeks,
    latest: weeks.length ? weeks[weeks.length - 1] : null,
    dedup: { distinctIds: distinctIds.size, nullRows },
    target3mo: NSM_TARGET_3MO,
    target6mo: NSM_TARGET_6MO,
  };
}

// ── 세그먼트 분석 — 로그인방식/모드별 NSM 추세(선) + 퍼널 비교(막대). 읽기 전용 SELECT. ──
// ★ diagnosis_completed 엔 method/mode 컬럼이 없음(login_entered=method, 5개 이벤트=mode).
//   → visitorId → 세그먼트(최초값) 매핑으로 귀속. 매핑 없는 방문자 이벤트는 unknown=차트 제외.
// ★ 색은 hsl(토큰 var) 문자열 — 페이지에서 선 stroke·막대 backgroundColor 인라인 사용(클래스 0).
// ★ 좌표/높이는 페이지가 인라인 style 로 렌더(JIT 클래스 의존 0). 데이터 0/단일주차 안전.

export interface SegLineSeries {
  key: string;
  label: string;
  color: string;
  values: number[]; // weeks 인덱스별 주간 완료수
  total: number;
}
export interface SegFunnelSeries {
  key: string;
  label: string;
  color: string;
  counts: number[]; // funnelSteps 인덱스별 이벤트수
  total: number;
}
export interface SegmentAnalytics {
  weeks: string[]; // 양 NSM 선차트 공용 X축(월요일 시작, 최근 NSM_WEEKS)
  nsmByMethod: SegLineSeries[];
  nsmByMode: SegLineSeries[];
  funnelSteps: { key: string; label: string }[];
  funnelByMethod: SegFunnelSeries[];
  funnelByMode: SegFunnelSeries[];
  excluded: { methodUnknown: number; modeUnknown: number }; // 세그 미매핑 방문자수(정직 표기)
  completions: number; // diagnosis_completed 총건(귀속 전, 참고)
}

// 퍼널 비교 핵심 단계(login→완료→공유) — 11종 전부는 막대 비교서 스파게티 → 핵심 5단계.
const SEG_FUNNEL_STEPS = [
  { key: "login_entered", label: "로그인" },
  { key: "diagnosis_input_viewed", label: "입력" },
  { key: "diagnosis_submit_clicked", label: "제출" },
  { key: "diagnosis_completed", label: "완료" },
  { key: "share_link_created", label: "공유" },
] as const;

// 세그먼트 색(hsl 토큰 var) — 선/막대/범례 공용. 톤 구분 우선(카카오 amber·게스트 blue·채용 red).
const METHOD_COLORS: Record<string, string> = {
  kakao: "hsl(var(--warning))",
  guest: "hsl(var(--info))",
  reviewer: "hsl(var(--danger))",
};
const MODE_COLORS: Record<string, string> = {
  couple: "hsl(var(--primary))",
  single: "hsl(var(--warning))",
};
const METHOD_LABEL: Record<string, string> = { kakao: "카카오", guest: "게스트", reviewer: "채용담당자" };
const MODE_LABEL: Record<string, string> = { couple: "부부", single: "싱글" };
const METHOD_SEGS = ["kakao", "guest", "reviewer"] as const;
const MODE_SEGS = ["couple", "single"] as const;

export async function getSegmentAnalytics(source: InsightsSource = "prod"): Promise<SegmentAnalytics> {
  const model = delegate(source);
  // 단일 SELECT — 필요한 컬럼만(preview 수백 행 수준, 충분). write 0.
  const rows = await model.findMany({
    select: { eventName: true, visitorId: true, method: true, mode: true, diagnosisId: true, timestamp: true },
  });

  // 방문자 → 세그먼트(최초 등장값). method=login_entered.method, mode=mode 보유 이벤트.
  const vMethod = new Map<string, string>();
  const vMode = new Map<string, string>();
  for (const r of rows) {
    if (!r.visitorId) continue;
    if (r.eventName === "login_entered" && r.method && !vMethod.has(r.visitorId)) vMethod.set(r.visitorId, r.method);
    if (r.mode && !vMode.has(r.visitorId)) vMode.set(r.visitorId, r.mode);
  }

  const now = Date.now();
  // 공용 주차축 — 완료 이벤트 전체 기준(양 NSM 차트 동일 X축).
  const completionWeeks = new Set<string>();
  let completions = 0;
  for (const r of rows) {
    if (r.eventName === "diagnosis_completed" && r.visitorId && r.timestamp.getTime() <= now) {
      completionWeeks.add(weekStartUTC(r.timestamp));
      completions += 1;
    }
  }
  const weeks = [...completionWeeks].sort((a, b) => a.localeCompare(b)).slice(-NSM_WEEKS);
  const weekIdx = new Map(weeks.map((w, i) => [w, i]));

  // NSM 선 — 세그먼트별 주간 완료(diagnosisId dedup, null=행 폴백).
  const buildLines = (
    vMap: Map<string, string>,
    segs: readonly string[],
    colors: Record<string, string>,
    labels: Record<string, string>,
  ): { series: SegLineSeries[]; unknown: number } => {
    const buckets = segs.map((s) => ({ key: s, ids: weeks.map(() => new Set<string>()), nulls: weeks.map(() => 0) }));
    const bySeg = new Map(buckets.map((b) => [b.key, b]));
    const unknown = new Set<string>();
    for (const r of rows) {
      if (r.eventName !== "diagnosis_completed" || !r.visitorId || r.timestamp.getTime() > now) continue;
      const wi = weekIdx.get(weekStartUTC(r.timestamp));
      if (wi === undefined) continue;
      const seg = vMap.get(r.visitorId);
      const b = seg ? bySeg.get(seg) : undefined;
      if (!b) {
        unknown.add(r.visitorId);
        continue;
      }
      if (r.diagnosisId) b.ids[wi].add(r.diagnosisId);
      else b.nulls[wi] += 1;
    }
    const series = buckets.map((b) => {
      const values = weeks.map((_, i) => b.ids[i].size + b.nulls[i]);
      return { key: b.key, label: labels[b.key], color: colors[b.key], values, total: values.reduce((a, c) => a + c, 0) };
    });
    return { series, unknown: unknown.size };
  };

  // 퍼널 막대 — 세그먼트별 단계 이벤트수.
  const buildFunnel = (
    vMap: Map<string, string>,
    segs: readonly string[],
    colors: Record<string, string>,
    labels: Record<string, string>,
  ): { series: SegFunnelSeries[]; unknown: number } => {
    const stepKeys = SEG_FUNNEL_STEPS.map((s) => s.key as string);
    const buckets = segs.map((s) => ({ key: s, counts: stepKeys.map(() => 0) }));
    const bySeg = new Map(buckets.map((b) => [b.key, b]));
    const unknown = new Set<string>();
    for (const r of rows) {
      const si = stepKeys.indexOf(r.eventName);
      if (si === -1 || !r.visitorId) continue;
      const seg = vMap.get(r.visitorId);
      const b = seg ? bySeg.get(seg) : undefined;
      if (!b) {
        unknown.add(r.visitorId);
        continue;
      }
      b.counts[si] += 1;
    }
    const series = buckets.map((b) => ({
      key: b.key,
      label: labels[b.key],
      color: colors[b.key],
      counts: b.counts,
      total: b.counts.reduce((a, c) => a + c, 0),
    }));
    return { series, unknown: unknown.size };
  };

  const nsmM = buildLines(vMethod, METHOD_SEGS, METHOD_COLORS, METHOD_LABEL);
  const nsmMode = buildLines(vMode, MODE_SEGS, MODE_COLORS, MODE_LABEL);
  const funM = buildFunnel(vMethod, METHOD_SEGS, METHOD_COLORS, METHOD_LABEL);
  const funMode = buildFunnel(vMode, MODE_SEGS, MODE_COLORS, MODE_LABEL);

  return {
    weeks,
    nsmByMethod: nsmM.series,
    nsmByMode: nsmMode.series,
    funnelSteps: SEG_FUNNEL_STEPS.map((s) => ({ key: s.key, label: s.label })),
    funnelByMethod: funM.series,
    funnelByMode: funMode.series,
    excluded: { methodUnknown: funM.unknown, modeUnknown: funMode.unknown },
    completions,
  };
}
