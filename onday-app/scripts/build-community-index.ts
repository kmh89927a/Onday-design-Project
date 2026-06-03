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

// 시도+시군구 → 65 키. 서울=구 / 인천="인천 X구|군" / 경기=시·군(일반구 합침).
//   ★ 시군구명에 시도 프리픽스 오염("서울특별시 도봉구") 대비 — 토큰에서 구/시/군 탐색.
function toKey(sido: string, sigungu: string): string | null {
  if (!sido) return null;
  const toks = sigungu.split(/\s+/).filter(Boolean);
  if (sido.startsWith("서울")) return toks.find((t) => t.endsWith("구")) ?? null;
  if (sido.startsWith("인천")) {
    const g = toks.find((t) => t.endsWith("구") || t.endsWith("군"));
    return g ? `인천 ${g}` : null;
  }
  if (sido.startsWith("경기"))
    return toks.find((t) => t.endsWith("시") || t.endsWith("군")) ?? null;
  return null; // 비수도권 제외
}

// "서울특별시 강남구 …" 주소 → 키 (parks 처럼 시도/시군구 분리 컬럼 없을 때).
function toKeyFromAddress(address: string): string | null {
  const t = address.split(/\s+/).filter(Boolean);
  if (t.length < 2) return null;
  return toKey(t[0], t.slice(1).join(" "));
}

// 헤더 행 자동 탐지 — 표준데이터 xls는 0행이 빈 행/제목인 경우가 있음.
const HEADER_MARKERS = ["소재지도로명주소", "소재지지번주소", "시군구명", "공원명", "도서관명"];

function readRows(basename: string): Record<string, string>[] {
  let aoa: unknown[][] | null = null;
  for (const ext of ["xlsx", "xls"]) {
    const p = join(RAW, `${basename}.${ext}`);
    if (!existsSync(p)) continue;
    const wb = XLSX.readFile(p);
    aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
    break;
  }
  if (!aoa) {
    const csv = join(RAW, `${basename}.csv`);
    if (!existsSync(csv)) throw new Error(`data-raw/${basename}.xlsx/.xls/.csv 가 없음`);
    return parseCsv(readFileSync(csv, "utf-8"));
  }
  const hi = aoa.findIndex((r) =>
    r.some((c) => HEADER_MARKERS.includes(String(c).trim())),
  );
  if (hi < 0) throw new Error(`${basename}: 헤더 행 못 찾음. 첫 행=${aoa[0]?.slice(0, 8)}`);
  const header = aoa[hi].map((c) => String(c).trim());
  return aoa
    .slice(hi + 1)
    .filter((r) => r.some((c) => String(c).trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, String(r[i] ?? "").trim()])));
}

function countByKey(basename: string): Map<string, number> {
  const rows = readRows(basename);
  const h = rows[0] ?? {};
  // 도서관 = 시도명/시군구명 컬럼 직접 / 공원 = 주소 컬럼 파싱(도로명 빈 행은 지번 fallback).
  const hasParts = "시도명" in h && "시군구명" in h;
  const counts = new Map<string, number>();
  let unmapped = 0;
  for (const r of rows) {
    const key = hasParts
      ? toKey(r["시도명"] ?? "", r["시군구명"] ?? "")
      : toKeyFromAddress(r["소재지도로명주소"] || r["소재지지번주소"] || r["주소"] || "");
    if (!key) { unmapped++; continue; }
    const k = key.normalize("NFC");
    counts.set(k, (counts.get(k) ?? 0) + 1);
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
