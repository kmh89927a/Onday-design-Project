import congestionData from "@/lib/data/congestion-index.json";

// 스트레스 지수 지표2 — 지하철 혼잡도 조회 골격 (safety-index getSafetyByGu 패턴 답습).
//   ★ 여기선 "조회"만. 룰 계산(착석확률·쾌적도 점수화)은 2-B, 표시는 2-C.
//   소스: 서울교통공사 1~8호선(congestion-index.json). 미포함 노선·역 → no_data(날조 금지).

interface CongestionData {
  _meta: { times: string[]; lines: string[]; dayType: string };
  byLine: Record<string, Record<string, Record<string, (number | null)[]>>>;
}

const DATA = congestionData as CongestionData;
const TIMES = DATA._meta.times;

/**
 * ODsay 노선명("수도권 2호선") → CSV 호선 키("2호선") 정규화.
 *   "수도권 " 프리픽스 제거. 1~8호선만 데이터 존재 — 그 외(신분당선·9호선 등)는 매칭 실패 → no_data.
 */
export function normalizeLine(line: string): string {
  return line.normalize("NFC").replace(/^수도권\s*/, "").trim();
}

/** "HH:MM" 또는 "8시00분" → _meta.times 라벨. 못 맞추면 null. (2-B 에서 출근 시간대 매핑 확장) */
export function toTimeLabel(time: string): string | null {
  if (TIMES.includes(time)) return time;
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const label = `${Number(m[1])}시${m[2]}분`;
  return TIMES.includes(label) ? label : null;
}

export interface CongestionOk {
  status: "ok";
  percent: number; // 혼잡도 %
  line: string; // 정규화 호선 키
  station: string;
  direction: string; // 단일 방향 조회 시 해당 방향, 미지정 시 "avg"
  time: string; // _meta.times 라벨
}

export interface CongestionNoData {
  status: "no_data";
  reason: "line_not_covered" | "station_not_found" | "direction_not_found" | "time_not_found" | "missing_value";
  line: string;
}

export type CongestionLookup = CongestionOk | CongestionNoData;

/**
 * (호선, 역명, 시간) 혼잡도 조회. direction 미지정 시 가용 방향 평균.
 *   1~8호선 외 노선·미수록 역·시간 라벨 불일치·결측은 grade 날조 없이 no_data.
 */
export function getCongestion(
  line: string,
  station: string,
  time: string,
  direction?: string,
): CongestionLookup {
  const key = normalizeLine(line);
  const lineData = DATA.byLine[key];
  if (!lineData) return { status: "no_data", reason: "line_not_covered", line: key };

  const stationData = lineData[station.normalize("NFC")];
  if (!stationData) return { status: "no_data", reason: "station_not_found", line: key };

  const label = toTimeLabel(time);
  if (!label) return { status: "no_data", reason: "time_not_found", line: key };
  const ti = TIMES.indexOf(label);

  // 방향 지정: 해당 방향만. 미지정: 가용 방향 평균(2-B 에서 진행방향 추론으로 대체).
  if (direction) {
    const series = stationData[direction];
    if (!series) return { status: "no_data", reason: "direction_not_found", line: key };
    const v = series[ti];
    if (v == null) return { status: "no_data", reason: "missing_value", line: key };
    return { status: "ok", percent: v, line: key, station, direction, time: label };
  }

  const vals = Object.values(stationData)
    .map((s) => s[ti])
    .filter((v): v is number => v != null);
  if (!vals.length) return { status: "no_data", reason: "missing_value", line: key };
  const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  return { status: "ok", percent: avg, line: key, station, direction: "avg", time: label };
}
