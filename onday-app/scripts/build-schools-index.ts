// 학군 PR1 — 전국초중등학교위치표준데이터(학교알리미) xls → 각 neighborhood 최근접 초등학교
//   1곳을 빌드타임 사전계산 → src/lib/data/schools-index.json.
//   공원·도서관(build-community-index) 패턴 답습: 원본 + 스크립트 + _source 로 provenance 확보.
//   실행: npx tsx scripts/build-schools-index.ts  (사전: data-raw/schools.xls)
//
//   ★ 최근접 = 동네 좌표 기준 Haversine. "배정"이 아니라 "인근"(학구도 폴리곤 미보유) — 라벨은 PR2.
//   schools.xls: Sheet1, 1행 빈 행 → "학교명" 포함 행을 헤더로 자동 탐지.
//   컬럼: 학교명 / 학교급구분("초등학교") / 위도 / 경도(십진도 WGS84) / 제공기관명 / 데이터기준일자.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

import type { Coordinate } from "@/lib/types";
import { haversineDistance } from "@/lib/haversine";
import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";

const XLS = join(process.cwd(), "data-raw", "schools.xls");
const OUT = join(process.cwd(), "src/lib/data/schools-index.json");

if (!existsSync(XLS)) {
  throw new Error("data-raw/schools.xls 가 없음 (학교알리미 전국초중등학교위치표준데이터 다운로드 필요)");
}

const wb = XLSX.read(readFileSync(XLS), { type: "buffer" });
const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  header: 1,
  defval: "",
}) as unknown[][];

// 헤더 자동 탐지 — 표준데이터 xls 는 0행이 빈 행/제목일 수 있음 ("학교명" 포함 행을 헤더로).
const hi = aoa.findIndex((r) => r.some((c) => String(c).trim() === "학교명"));
if (hi < 0) throw new Error(`헤더 행(학교명) 못 찾음. 첫 행=${aoa[0]?.slice(0, 6)}`);
const header = aoa[hi].map((c) => String(c).trim());

function colIndex(name: string, required = true): number {
  const i = header.indexOf(name);
  if (i < 0 && required) throw new Error(`컬럼 없음: ${name}`);
  return i;
}
const iName = colIndex("학교명");
const iLevel = colIndex("학교급구분");
const iLat = colIndex("위도");
const iLng = colIndex("경도");
const iOrg = colIndex("제공기관명", false);
const iDate = colIndex("데이터기준일자", false);

interface School extends Coordinate {
  name: string;
}

const schools: School[] = [];
let skipped = 0;
let providerName = "";
let dataDate = "";

for (const r of aoa.slice(hi + 1)) {
  if (String(r[iLevel]).trim() !== "초등학교") continue;
  const name = String(r[iName]).trim();
  const lat = Number(String(r[iLat]).trim());
  const lng = Number(String(r[iLng]).trim());
  // 좌표 결측/파싱 실패/0,0 더미는 skip (방어).
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    skipped++;
    continue;
  }
  schools.push({ name, lat, lng });
  if (!providerName && iOrg >= 0) providerName = String(r[iOrg]).trim();
  if (!dataDate && iDate >= 0) dataDate = String(r[iDate]).trim();
}
console.log(`초등학교 ${schools.length}개 적재 (skip ${skipped})`);
if (schools.length === 0) throw new Error("초등학교 0개 — 필터/컬럼 매핑 확인 필요");

const source = providerName || "학교알리미 전국초중등학교위치표준데이터";
const updatedAt = dataDate;

interface NearestSchool {
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  _source: string;
  updatedAt: string;
}

const byNeighborhood: Record<string, NearestSchool> = {};
let maxDist = 0;
let maxId = "";

for (const n of MOCK_NEIGHBORHOODS) {
  let best: School | null = null;
  let bestD = Infinity;
  for (const s of schools) {
    const d = haversineDistance(n.coordinate, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  if (!best) {
    console.warn(`⚠️ ${n.id} 최근접 학교 없음`);
    continue;
  }
  byNeighborhood[n.id] = {
    name: best.name,
    lat: best.lat,
    lng: best.lng,
    distanceKm: Math.round(bestD * 100) / 100,
    _source: source,
    updatedAt,
  };
  if (bestD > maxDist) {
    maxDist = bestD;
    maxId = n.id;
  }
}

const out = {
  _meta: {
    description:
      "각 neighborhood 좌표 기준 최근접 초등학교 1곳 (Haversine). '배정'이 아니라 '인근' (학구도 폴리곤 미보유).",
    dataset: "학교알리미 전국초중등학교위치표준데이터 (data.go.kr)",
    source,
    updatedAt,
    generatedFrom: "data-raw/schools.xls",
    note: "scripts/build-schools-index.ts 로 생성(결정론적). 원본 xls 는 git 미추적. 정확한 배정은 학구도(15021158)로 업그레이드 가능.",
  },
  byNeighborhood,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(
  `✅ schools-index.json — ${Object.keys(byNeighborhood).length}/${MOCK_NEIGHBORHOODS.length} 동네 매핑. 최대거리 ${maxDist.toFixed(2)}km (${maxId})`,
);
