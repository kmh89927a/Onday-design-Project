// 스트레스 지수 지표2-A — 서울교통공사 지하철 혼잡도 CSV → congestion-index.json 사전계산.
//   시세(build-price-index)·안전 빌드 패턴 답습: 원본(data-raw, git 미추적) + 디코드 + provenance + 결측 방어.
//   실행: npm run build:congestion   (사전: data-raw/subway.csv)
//
//   ★ 원본 CSV 는 EUC-KR(CP949) → TextDecoder('euc-kr') 로 디코드(원본 읽기만, 수정 금지).
//   ★ 컬럼: 요일구분, 호선, 역번호, 출발역(=해당역), 상하구분, [시간대 39개 30분 단위].
//   ★ 평일(통근)만 사용. 전 시간대 보존 — 시간 라벨은 _meta.times 에 1회 저장하고 값은 정렬 배열로(용량 절약).
//   ★ 노선 1~8호선 한정(서울교통공사). 신분당선·9호선·분당선·공항철도 등 미포함 → 조회 시 no_data.
//   ★ 중복 환승역명(종로3가 등)은 호선 키 아래 분리. 2호선은 상/하선 대신 내/외선.
//   ★ 값 trailing space trim. 결측은 null(날조 금지) — 이 CSV 는 결측 0이라 거의 해당 없음.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "data-raw/subway.csv");
const OUT = join(process.cwd(), "src/lib/data/congestion-index.json");
const RETRIEVED_AT = new Date().toISOString().slice(0, 10);
const DAY_TYPE = "평일"; // 통근 기준
const META_COLS = 5; // 요일구분/호선/역번호/출발역/상하구분
const SOURCE_LABEL =
  "서울교통공사 지하철 시간대별 혼잡도(공공데이터포털, 1~8호선)";

if (!existsSync(SRC)) {
  throw new Error(`원본 없음: data-raw/subway.csv (서울교통공사 혼잡도 CSV 필요)`);
}

// EUC-KR 디코드 후 라인 분리(CR 제거). 빈 줄 제외.
const raw = new TextDecoder("euc-kr").decode(readFileSync(SRC));
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.replace(/\r$/, ""))
  .filter((l) => l.trim().length > 0);

const header = lines[0].split(",").map((c) => c.trim());
const times = header.slice(META_COLS); // 시간대 라벨(39개)
const N = times.length;

// byLine[호선][역명][방향] = number[] (times 정렬, 결측은 null)
type Series = (number | null)[];
const byLine: Record<string, Record<string, Record<string, Series>>> = {};

let rowsUsed = 0;
let nullCells = 0;
const duplicates: string[] = [];

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(",");
  if (cols.length < META_COLS + N) continue; // 형식 이상 행 스킵
  const dayType = cols[0].trim();
  if (dayType !== DAY_TYPE) continue; // 평일만

  const line = cols[1].trim();
  const station = cols[3].trim();
  const direction = cols[4].trim();

  const series: Series = times.map((_, k) => {
    const v = cols[META_COLS + k]?.trim();
    if (v === undefined || v === "") {
      nullCells++;
      return null;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
      nullCells++;
      return null;
    }
    return n;
  });

  byLine[line] ??= {};
  byLine[line][station] ??= {};
  // 2호선 본선/지선 등 (호선+역명+방향) 중복 시 첫 행(본선) 유지 — 통근 주 동선 우선. 손실은 로그.
  if (byLine[line][station][direction]) {
    duplicates.push(`${line}/${station}/${direction}`);
    continue;
  }
  byLine[line][station][direction] = series;
  rowsUsed++;
}

const lineList = Object.keys(byLine).sort();

const out = {
  _meta: {
    description:
      "지하철 역별·방향별·시간대별 혼잡도(%) — 서울교통공사 사전계산. 스트레스 지수 지표2(데이터).",
    source: SOURCE_LABEL,
    retrievedAt: RETRIEVED_AT,
    dayType: DAY_TYPE,
    unit: "혼잡도 %(좌석수 대비 승객수 추정, 100% 초과 가능)",
    coverageNote:
      "★ 서울교통공사 1~8호선 한정. 신분당선·9호선·수인분당·경의중앙·공항철도·우이신설·경기/인천 도시철도 등은 미포함 → 조회 시 no_data.",
    lines: lineList,
    directionNote: "1·3~8호선=상선/하선, 2호선(순환)=내선/외선.",
    stationNameFormat:
      '역명은 접미사 "역" 없음(예: "강남","양재"). P1 routeStations 와 동일 형식. 단 "서울역"만 예외.',
    times, // 시간대 라벨(값 배열은 이 순서에 정렬)
    generatedFrom: "scripts/build-congestion.ts",
    note: "값은 _meta.times 순서의 배열. 결측은 null(추정 환산 없음). 노선명은 CSV 원형('2호선') — 조회 시 정규화 필요.",
  },
  byLine,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
if (!existsSync(OUT)) throw new Error("congestion-index.json 쓰기 실패");

// ── 콘솔 리포트 ───────────────────────────────────────────────
console.log(`\n✅ congestion-index.json — ${DAY_TYPE} ${rowsUsed}행 사용`);
console.log(`   시간대 ${N}개: ${times[0]} ~ ${times[N - 1]}`);
console.log(`   노선 ${lineList.length}개: ${lineList.join(", ")}`);
for (const l of lineList) {
  console.log(`     ${l}: 역 ${Object.keys(byLine[l]).length}개`);
}
console.log(`   고유 역-방향 시리즈 ${rowsUsed}개, null 셀 ${nullCells}개`);
if (duplicates.length) {
  console.log(`   ⚠️ 중복 (역+방향) ${duplicates.length}건: ${duplicates.slice(0, 10).join(", ")}`);
}

// 샘플 점검 — 강남(2호선) 평일 8시00분
const t8 = times.indexOf("8시00분");
const gangnam = byLine["2호선"]?.["강남"];
if (gangnam && t8 >= 0) {
  const dirs = Object.keys(gangnam);
  console.log(`\n── 샘플: 2호선 강남 8시00분 ──`);
  for (const d of dirs) console.log(`     ${d}: ${gangnam[d][t8]}%`);
} else {
  console.log("\n⚠️ 샘플(2호선 강남 8시00분) 조회 실패 — 데이터 확인 필요");
}
