// B 정책 — 공원·공공도서관 표준데이터 CSV → 시군구별 count → community-index.json.
//   #57 safety-index 와 동일 단위(수도권 시군구). 실행: npx tsx scripts/build-community-index.ts
//   사전: data-raw/parks.csv, data-raw/libraries.csv (공공데이터포털 표준데이터 다운로드)
//
//   표준데이터 컬럼명은 데이터셋마다 약간 다를 수 있음 → ADDRESS_COLS 후보로 자동 탐색.
//   매핑이 비면 콘솔에 미매핑 주소를 찍어주니 후보를 보강하면 됨.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const RAW = join(process.cwd(), "data-raw");
const JSON_PATH = join(process.cwd(), "src/lib/data/community-index.json");

// 주소가 들어있을 법한 컬럼명 후보 (표준데이터 공통).
const ADDRESS_COLS = [
  "소재지도로명주소",
  "소재지지번주소",
  "도로명주소",
  "지번주소",
  "주소",
];

// 아주 작은 CSV 파서 (따옴표 필드 지원). 표준데이터는 UTF-8 / EUC-KR 혼재 → UTF-8 가정.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { cur.push(field); field = ""; }
    else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const header = rows.shift() ?? [];
  return rows
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

// "서울특별시 강남구 …" → 65 시군구 키 (서울=bare / 인천="인천 X구" / 경기=시·군).
function toSigunguKey(address: string): string | null {
  const t = address.split(/\s+/).filter(Boolean);
  if (t.length < 2) return null;
  const [sido, a, b] = t;
  if (sido.startsWith("서울")) return a; // "강남구"
  if (sido.startsWith("인천")) return `인천 ${a}`; // "인천 서구"
  if (sido.startsWith("경기")) {
    // "성남시 분당구" → "성남시" / "가평군" → "가평군" / "수원시 영통구" → "수원시"
    return a.endsWith("시") || a.endsWith("군") ? a : b?.endsWith("시") ? b : a;
  }
  return null; // 비수도권 제외
}

// basename.xlsx 우선, 없으면 basename.csv. 헤더 키는 trim (엑셀 헤더 공백 방지).
function readRows(basename: string): Record<string, string>[] {
  const xlsxPath = join(RAW, `${basename}.xlsx`);
  if (existsSync(xlsxPath)) {
    const wb = XLSX.readFile(xlsxPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false }) as Record<string, unknown>[];
    return raw.map((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), String(v).trim()])),
    );
  }
  const csvPath = join(RAW, `${basename}.csv`);
  if (existsSync(csvPath)) return parseCsv(readFileSync(csvPath, "utf-8"));
  throw new Error(`data-raw/${basename}.xlsx 또는 ${basename}.csv 가 없음`);
}

function countByKey(basename: string): Map<string, number> {
  const rows = readRows(basename);
  const col = ADDRESS_COLS.find((c) => rows[0] && c in rows[0]);
  if (!col) throw new Error(`${basename}: 주소 컬럼 없음. ADDRESS_COLS 보강 필요. 헤더=${Object.keys(rows[0] ?? {})}`);
  const counts = new Map<string, number>();
  let unmapped = 0;
  for (const r of rows) {
    const key = toSigunguKey(r[col] ?? "");
    if (!key) { unmapped++; continue; }
    counts.set(key.normalize("NFC"), (counts.get(key.normalize("NFC")) ?? 0) + 1);
  }
  console.log(`${basename}: ${rows.length}행 → ${counts.size}개 시군구 매핑 (미매핑 ${unmapped})`);
  return counts;
}

const parks = countByKey("parks");
const libraries = countByKey("libraries");

const data = JSON.parse(readFileSync(JSON_PATH, "utf-8")) as {
  entries: { sigungu: string; parks: number | null; libraries: number | null; _parksSource?: string | null; _librariesSource?: string | null }[];
};

let filled = 0;
for (const e of data.entries) {
  const key = e.sigungu.normalize("NFC");
  const p = parks.get(key);
  const l = libraries.get(key);
  if (p != null) { e.parks = p; e._parksSource = "data.go.kr:전국도시공원표준데이터"; }
  if (l != null) { e.libraries = l; e._librariesSource = "data.go.kr:전국공공도서관표준데이터"; }
  if (e.parks != null && e.libraries != null) filled++;
}

writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n");
console.log(`\n✅ community-index.json 갱신 — ${filled}/${data.entries.length} 시군구 완성(parks+libraries 둘 다)`);
