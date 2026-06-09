import type { CommuteInfo } from "@/lib/types";
import { getCongestion } from "./congestion";

// 스트레스 지수 2-B — 출근길 혼잡도 룰. P1.5 routeSegments 의 각 지하철 구간을
//   (호선+승차역+출근시각) 으로 2-A congestion 조회 → 경로 대표 혼잡도 + 부드러운 문구.
//   ★ 착석 "가능/불가" 단정 금지 — 혼잡도 %(객관 팩트) + 사실 기반 문구만.
//   ★ 방향(상/하·내/외선)은 평균(getCongestion direction 미지정). 1~8호선만, 그 외 no_data.
//   표시 UI 는 2-C — 여기선 값 반환까지.

const DEFAULT_DEPARTURE = "08:00";

export type CongestionLevel = "low" | "medium" | "high" | "veryHigh";

// 혼잡도 % → 레벨/문구. 서울교통공사 정의: 좌석만 차면 ~34%, 100%=입석 포함 정원.
const LEVELS: { level: CongestionLevel; min: number; label: string }[] = [
  { level: "veryHigh", min: 150, label: "많이 혼잡해요, 각오하세요 😣" },
  { level: "high", min: 130, label: "서서 가기 힘들 수 있어요" },
  { level: "medium", min: 80, label: "출근길이 꽤 붐벼요" },
  { level: "low", min: 0, label: "비교적 여유로워요 😌" },
];

function levelFor(percent: number): { level: CongestionLevel; label: string } {
  const m = LEVELS.find((l) => percent >= l.min) ?? LEVELS[LEVELS.length - 1];
  return { level: m.level, label: m.label };
}

export interface RouteCongestionOk {
  status: "ok";
  percent: number; // 경로 대표 혼잡도(최고 혼잡 구간)
  level: CongestionLevel;
  label: string; // 부드러운 상태 문구
  peakLine: string; // 대표(최고) 구간 호선
  peakStation: string; // 대표(최고) 구간 승차역
  coveredSegments: number; // 혼잡도 조회된 지하철 구간 수
  totalSubwaySegments: number; // 경로의 지하철 구간 수
  departureTime: string; // 조회 기준 출근 시각(HH:MM)
  basisNote: string; // 정직성 — 산출 기준 표기
}

export interface RouteCongestionNoData {
  status: "no_data";
  reason: string; // 사람이 읽는 사유(1~8호선 외 등)
  totalSubwaySegments: number;
  departureTime: string;
}

export type RouteCongestion = RouteCongestionOk | RouteCongestionNoData;

/**
 * 통근 정보 → 출근길 혼잡도. transit 아님/지하철 구간 없음/routeSegments 없음 → null(미해당).
 * 지하철 구간은 있으나 전부 1~8호선 외(신분당선·9호선 등) → no_data.
 */
export function computeRouteCongestion(
  commute: CommuteInfo | undefined,
  departureTime: string = DEFAULT_DEPARTURE,
): RouteCongestion | null {
  if (!commute || commute.mode !== "transit") return null;

  const subwaySegs = (commute.routeSegments ?? []).filter(
    (s) => s.line.type === "subway",
  );
  if (subwaySegs.length === 0) return null; // 버스 전용·경로정보 없음 → 미해당

  const hits: { percent: number; line: string; station: string }[] = [];
  for (const seg of subwaySegs) {
    const station = seg.from ?? seg.stations[0];
    if (!station) continue;
    const r = getCongestion(seg.line.name, station, departureTime);
    if (r.status === "ok") {
      hits.push({ percent: r.percent, line: r.line, station });
    }
  }

  if (hits.length === 0) {
    return {
      status: "no_data",
      reason: "혼잡도 미제공 구간이에요 (서울교통공사 1~8호선만 제공)",
      totalSubwaySegments: subwaySegs.length,
      departureTime,
    };
  }

  // 대표값 = 최고 혼잡 구간(출근 체감은 가장 붐비는 구간이 좌우 — 평균은 가혹한 구간 희석).
  const peak = hits.reduce((a, b) => (b.percent > a.percent ? b : a));
  const { level, label } = levelFor(peak.percent);

  return {
    status: "ok",
    percent: peak.percent,
    level,
    label,
    peakLine: peak.line,
    peakStation: peak.station,
    coveredSegments: hits.length,
    totalSubwaySegments: subwaySegs.length,
    departureTime,
    basisNote: "상·하선 방향 평균, 경로 중 가장 혼잡한 구간 기준",
  };
}
