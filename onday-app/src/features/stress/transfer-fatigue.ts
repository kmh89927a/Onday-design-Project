import type { CommuteInfo } from "@/lib/types";

// 스트레스 지수 지표1 — 환승 피로도(전 노선 100% 커버).
//   ODsay 도보거리(transferWalkMeters) + 환승 횟수(transfers)만 사용 → 노선 무관(P1 확보).
//   혼잡도(지표2, 서울교통공사 1~8호선)와 독립. 정적 임계 룰 — 투명·재현 가능.

export type FatigueLevel = "none" | "low" | "medium" | "high";

// 환승 도보거리(m) 임계 — 조정 가능. 경계 포함 규칙: [0,250) 낮음 · [250,500) 보통 · [500,∞) 높음.
const MEDIUM_THRESHOLD_M = 250;
const HIGH_THRESHOLD_M = 500;

// 막장환승 위트 — 경로에 있으면 멘트만 추가(점수·레벨 영향 0). 거리와 모순 막으려 보통/높음일 때만 부착.
//   routeStations 는 ODsay 역명(접미사 "역" 없음) — 정적 목록도 동일 형식.
const NOTORIOUS_TRANSFER_STATIONS = [
  "종로3가",
  "고속터미널",
  "노원",
  "동대문역사문화공원",
  "신도림",
  "왕십리",
] as const;

export interface TransferFatigue {
  level: FatigueLevel;
  transfers: number;
  walkMeters?: number;
  /** 메인 라벨 — "환승 없이 한 번에" 또는 "환승 2회 · 도보 450m" */
  label: string;
  /** 레벨 표시 — "낮음"/"보통"/"높음" (환승 없음은 undefined) */
  levelLabel?: string;
  emoji: string; // 🟢🟡🔴 (라벨·색과 함께 3중 표기)
  tone: "success" | "warning" | "danger"; // 디자인 토큰 매핑
  /** 막장환승 위트 멘트(있을 때만, 점수 무관) */
  quip?: string;
}

function levelFromMeters(m: number): Exclude<FatigueLevel, "none"> {
  if (m >= HIGH_THRESHOLD_M) return "high";
  if (m >= MEDIUM_THRESHOLD_M) return "medium";
  return "low";
}

const LEVEL_META: Record<
  Exclude<FatigueLevel, "none">,
  { levelLabel: string; emoji: string; tone: TransferFatigue["tone"] }
> = {
  low: { levelLabel: "낮음", emoji: "🟢", tone: "success" },
  medium: { levelLabel: "보통", emoji: "🟡", tone: "warning" },
  high: { levelLabel: "높음", emoji: "🔴", tone: "danger" },
};

// 다정한 큐레이터 멘트 — 거리 데이터와 모순 없게(낮음에 "힘들어요" 금지). 착석/혼잡도 언급 금지(지표2 영역).
const LEVEL_QUIP: Record<FatigueLevel, string> = {
  none: "환승 없이 한 번에! 출근길이 편안해요 😌",
  low: "환승은 있지만 동선이 짧아 부담 없어요 👍",
  medium: "적당한 환승 거리예요",
  high: "환승 동선이 길어 체력 소모가 있어요",
};

function findNotoriousStation(routeStations?: string[]): string | undefined {
  if (!routeStations?.length) return undefined;
  return NOTORIOUS_TRANSFER_STATIONS.find((s) => routeStations.includes(s));
}

/**
 * 통근 정보 → 환승 피로도. transit 외(차량) 또는 환승 정보 없으면 null.
 * - 환승 0회: "환승 없이 한 번에" (🟢, success).
 * - 환승 ≥1: 도보거리 기준 낮음/보통/높음. 거리 정보 없으면 "환승 N회"만(레벨 생략).
 */
export function computeTransferFatigue(
  commute: CommuteInfo | undefined,
): TransferFatigue | null {
  if (!commute || commute.mode !== "transit") return null;
  const transfers = commute.transfers ?? 0;

  if (transfers === 0) {
    return {
      level: "none",
      transfers: 0,
      label: "환승 없이 한 번에",
      emoji: "🟢",
      tone: "success",
      quip: LEVEL_QUIP.none,
    };
  }

  const walkMeters = commute.transferWalkMeters;
  // 환승은 있는데 ODsay 도보거리 결측 → 레벨 산정 불가, 횟수만 정직하게 표시.
  if (typeof walkMeters !== "number") {
    return {
      level: "low",
      transfers,
      label: `환승 ${transfers}회`,
      emoji: "🟡",
      tone: "warning",
    };
  }

  const level = levelFromMeters(walkMeters);
  const meta = LEVEL_META[level];
  // 막장환승 멘트는 높음일 때만 우선(거리와 모순 없음). 그 외엔 레벨별 멘트.
  const notorious =
    level === "high" ? findNotoriousStation(commute.routeStations) : undefined;
  const quip = notorious
    ? `${notorious} 환승은 꽤 걸어요 🚶`
    : LEVEL_QUIP[level];

  return {
    level,
    transfers,
    walkMeters,
    label: `환승 ${transfers}회 · 도보 ${walkMeters}m`,
    levelLabel: meta.levelLabel,
    emoji: meta.emoji,
    tone: meta.tone,
    quip,
  };
}
