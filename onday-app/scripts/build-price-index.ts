// 시세 3-B — 국토부 실거래(아파트 매매·전월세) 엑셀 6개 → 동네별 거래유형 중앙값 사전계산.
//   학교/공원(build-schools-index) 패턴 답습: 원본(data-raw, git 미추적) + 스크립트 + provenance + 결측 방어.
//   실행: npm run build:price   (사전: data-raw 에 아래 6개 xlsx)
//
//   ★ 조인: 실거래 '시군구' 셀 = "시도 시군구 법정동" 한 셀(숫자 LAWD 없음) → PRICE_DONG_MAPPING(3-A, 사람 큐레이션)으로
//     (시군구 + 법정동) 텍스트 매칭. legalDong 전략이라도 표본이 매매<20 또는 전월세<30 이면 자동 시군구 폴백.
//   ★ 면적 60~85㎡(국민주택규모) 한정 — 소형/대형 혼합 평균 왜곡 방지(Phase 0 권고).
//   ★ 결측은 null. 추정 환산(JEONSE_RATIO 등)으로 메우지 않음(#59 옵션2 — 날조 금지).
//   ★ 매매 파일 3개는 파일명 선행 공백 주의(" apt-trade_*"). 전월세는 공백 없음.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";
import { PRICE_DONG_MAPPING } from "./price-dong-mapping";

const DIR = join(process.cwd(), "data-raw");
const OUT = join(process.cwd(), "src/lib/data/price-index.json");
const RETRIEVED_AT = new Date().toISOString().slice(0, 10);
const AREA_MIN = 60;
const AREA_MAX = 85;
const MIN_TRADE = 20; // 매매 표본 임계(미만 → 시군구 폴백)
const MIN_RENT = 30; // 전월세 표본 임계

const TRADE_FILES = [" apt-trade_서울.xlsx", " apt-trade_경기도.xlsx", " apt-trade_인천.xlsx"];
const RENT_FILES = ["apt-rent_서울.xlsx", "apt-rent_경기도.xlsx", "apt-rent_인천.xlsx"];

interface Bucket {
  maemae: number[];
  jeonseDeposit: number[];
  wolseDeposit: number[];
  wolseMonthly: number[];
}
const newBucket = (): Bucket => ({ maemae: [], jeonseDeposit: [], wolseDeposit: [], wolseMonthly: [] });

// 실거래 시군구 셀 → { sigungu(표준형), legalDong }. 인천은 "인천 " 접두로 서울 중구 등과 구분.
function parseSigunguCell(cell: string): { sigungu: string; legalDong: string } | null {
  const t = cell.trim().split(/\s+/);
  if (t.length < 3) return null;
  const sido = t[0];
  const legalDong = t[t.length - 1];
  const middle = t.slice(1, t.length - 1).join(" ");
  const sigungu = sido.startsWith("인천") ? `인천 ${middle}` : middle;
  return { sigungu, legalDong };
}

const num = (v: unknown): number => Number(String(v).replace(/,/g, "").trim());

function median(arr: number[]): number {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

// 필요한 sigungu 만 수집(메모리 절약).
const neededSigungu = new Set(Object.values(PRICE_DONG_MAPPING).map((m) => m.sigungu));
const bySigungu = new Map<string, Bucket>(); // sigungu 전체(폴백용)
const byDong = new Map<string, Bucket>(); // `${sigungu}|${legalDong}`
const get = (map: Map<string, Bucket>, key: string) => {
  let b = map.get(key);
  if (!b) { b = newBucket(); map.set(key, b); }
  return b;
};

function loadSheet(file: string): { header: string[]; aoa: unknown[][]; hi: number } {
  const fp = join(DIR, file);
  if (!existsSync(fp)) throw new Error(`원본 없음: data-raw/${file} (국토부 실거래가공개시스템 다운로드 필요)`);
  const wb = XLSX.read(readFileSync(fp), { type: "buffer" });
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: false }) as unknown[][];
  const hi = aoa.findIndex((r) => r.some((c) => String(c).trim() === "전용면적(㎡)"));
  if (hi < 0) throw new Error(`헤더(전용면적(㎡)) 못 찾음: ${file}`);
  const header = aoa[hi].map((c) => String(c).trim());
  return { header, aoa, hi };
}

let tradeRows = 0, rentRows = 0;

for (const file of TRADE_FILES) {
  const { header, aoa, hi } = loadSheet(file);
  const iSig = header.indexOf("시군구");
  const iArea = header.indexOf("전용면적(㎡)");
  const iPrice = header.indexOf("거래금액(만원)");
  if (iSig < 0 || iArea < 0 || iPrice < 0) throw new Error(`매매 컬럼 매핑 실패: ${file}`);
  for (let r = hi + 1; r < aoa.length; r++) {
    const row = aoa[r];
    const parsed = parseSigunguCell(String(row[iSig] ?? ""));
    if (!parsed || !neededSigungu.has(parsed.sigungu)) continue;
    const area = num(row[iArea]);
    if (!(area >= AREA_MIN && area <= AREA_MAX)) continue;
    const price = num(row[iPrice]);
    if (!Number.isFinite(price) || price <= 0) continue;
    get(bySigungu, parsed.sigungu).maemae.push(price);
    get(byDong, `${parsed.sigungu}|${parsed.legalDong}`).maemae.push(price);
    tradeRows++;
  }
}

for (const file of RENT_FILES) {
  const { header, aoa, hi } = loadSheet(file);
  const iSig = header.indexOf("시군구");
  const iType = header.indexOf("전월세구분");
  const iArea = header.indexOf("전용면적(㎡)");
  const iDep = header.indexOf("보증금(만원)");
  const iMon = header.indexOf("월세금(만원)");
  if ([iSig, iType, iArea, iDep, iMon].some((i) => i < 0)) throw new Error(`전월세 컬럼 매핑 실패: ${file}`);
  for (let r = hi + 1; r < aoa.length; r++) {
    const row = aoa[r];
    const parsed = parseSigunguCell(String(row[iSig] ?? ""));
    if (!parsed || !neededSigungu.has(parsed.sigungu)) continue;
    const area = num(row[iArea]);
    if (!(area >= AREA_MIN && area <= AREA_MAX)) continue;
    const type = String(row[iType] ?? "").trim();
    const deposit = num(row[iDep]);
    if (!Number.isFinite(deposit) || deposit < 0) continue;
    const sg = get(bySigungu, parsed.sigungu);
    const dg = get(byDong, `${parsed.sigungu}|${parsed.legalDong}`);
    if (type === "전세") {
      sg.jeonseDeposit.push(deposit);
      dg.jeonseDeposit.push(deposit);
    } else if (type === "월세") {
      const monthly = num(row[iMon]);
      if (!Number.isFinite(monthly) || monthly <= 0) continue;
      sg.wolseDeposit.push(deposit);
      sg.wolseMonthly.push(monthly);
      dg.wolseDeposit.push(deposit);
      dg.wolseMonthly.push(monthly);
    } else continue;
    rentRows++;
  }
}

// legalDong 복수 OR 합산
function gather(sigungu: string, legalDong: string[]): Bucket {
  const out = newBucket();
  for (const ld of legalDong) {
    const b = byDong.get(`${sigungu}|${ld}`);
    if (!b) continue;
    out.maemae.push(...b.maemae);
    out.jeonseDeposit.push(...b.jeonseDeposit);
    out.wolseDeposit.push(...b.wolseDeposit);
    out.wolseMonthly.push(...b.wolseMonthly);
  }
  return out;
}

interface PriceEntry {
  maemae: { median: number; count: number } | null;
  jeonse: { median: number; count: number } | null;
  wolse: { depositMedian: number; monthlyMedian: number; count: number } | null;
  source: "legalDong" | "sigungu-fallback";
  matchedSigungu: string;
  matchedLegalDong: string[];
  _source: string;
  period: string;
  areaFilter: string;
  retrievedAt: string;
}

const SOURCE_LABEL = "국토교통부 실거래가공개시스템 아파트 매매/전월세";
const PERIOD = "2025-12 ~ 2026-06";
const AREA_LABEL = `${AREA_MIN}-${AREA_MAX}㎡`;

const byId: Record<string, PriceEntry> = {};
const thresholdFallbackIds: string[] = []; // legalDong 전략이었으나 표본 임계 미달로 폴백된 동네
const missingMap: string[] = [];

for (const n of MOCK_NEIGHBORHOODS) {
  const map = PRICE_DONG_MAPPING[n.id];
  if (!map) { missingMap.push(n.id); continue; }

  let bucket: Bucket;
  let source: "legalDong" | "sigungu-fallback";
  let matchedLegalDong: string[];

  if (map.strategy === "legalDong" && map.legalDong.length) {
    const ldBucket = gather(map.sigungu, map.legalDong);
    const rentCount = ldBucket.jeonseDeposit.length + ldBucket.wolseDeposit.length;
    if (ldBucket.maemae.length < MIN_TRADE || rentCount < MIN_RENT) {
      // 임계 미달 → 시군구 폴백
      bucket = bySigungu.get(map.sigungu) ?? newBucket();
      source = "sigungu-fallback";
      matchedLegalDong = [];
      thresholdFallbackIds.push(n.id);
    } else {
      bucket = ldBucket;
      source = "legalDong";
      matchedLegalDong = map.legalDong;
    }
  } else {
    // 3-A 명시 시군구 폴백(legalDong=[])
    bucket = bySigungu.get(map.sigungu) ?? newBucket();
    source = "sigungu-fallback";
    matchedLegalDong = [];
  }

  const jeonse = bucket.jeonseDeposit.length
    ? { median: median(bucket.jeonseDeposit), count: bucket.jeonseDeposit.length }
    : null;
  const maemae = bucket.maemae.length
    ? { median: median(bucket.maemae), count: bucket.maemae.length }
    : null;
  const wolse = bucket.wolseDeposit.length
    ? {
        depositMedian: median(bucket.wolseDeposit),
        monthlyMedian: median(bucket.wolseMonthly),
        count: bucket.wolseDeposit.length,
      }
    : null;

  byId[n.id] = {
    maemae, jeonse, wolse, source,
    matchedSigungu: map.sigungu,
    matchedLegalDong,
    _source: SOURCE_LABEL, period: PERIOD, areaFilter: AREA_LABEL, retrievedAt: RETRIEVED_AT,
  };
}

const out = {
  _meta: {
    description: "동네별 아파트 거래유형(매매/전세/월세) 중앙값 — 국토부 실거래 사전계산. 시세 실데이터 3단계(데이터).",
    source: SOURCE_LABEL,
    period: PERIOD,
    areaFilter: `전용 ${AREA_LABEL}(국민주택규모) 한정`,
    method: "PRICE_DONG_MAPPING(3-A 사람 큐레이션)으로 (시군구+법정동) 텍스트 조인 후 중앙값. 숫자 LAWD 미존재.",
    threshold: `법정동 표본 매매<${MIN_TRADE} 또는 전월세<${MIN_RENT} 이면 자동 시군구 폴백`,
    fallbackTotal: Object.values(byId).filter((e) => e.source === "sigungu-fallback").length,
    fallbackThresholdTriggered: thresholdFallbackIds.length,
    generatedFrom: "scripts/build-price-index.ts + scripts/price-dong-mapping.ts",
    retrievedAt: RETRIEVED_AT,
    note: "동 단위 중앙값(단지·평형별 편차 있음). 60~85㎡ 한정. 폴백=구 평균(동 데이터 부족). 결측은 null(추정 환산 없음).",
  },
  byId,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
if (!existsSync(OUT)) throw new Error("price-index.json 쓰기 실패");

// ── 콘솔 리포트 ───────────────────────────────────────────────
const man = (v: number) => (v / 10000).toFixed(2) + "억";
console.log(`\n실거래 수집: 매매 ${tradeRows} / 전월세 ${rentRows} 행 (60~85㎡, 필요 시군구만)`);
console.log(`\n══ 44개 동네 산출 (매매median / 전세median / source) ══`);
for (const n of MOCK_NEIGHBORHOODS) {
  const e = byId[n.id];
  if (!e) { console.log(`  ${n.dong} — 매핑 없음`); continue; }
  const mm = e.maemae ? `${man(e.maemae.median)}(${e.maemae.count})` : "—";
  const js = e.jeonse ? `${man(e.jeonse.median)}(${e.jeonse.count})` : "—";
  const tag = e.source === "sigungu-fallback" ? "⚠️구폴백" : "";
  console.log(`  ${n.dong.padEnd(8)} 매매 ${mm.padEnd(14)} 전세 ${js.padEnd(14)} ${e.source}${tag ? " " + tag : ""}`);
}

const dongOf = (id: string) => MOCK_NEIGHBORHOODS.find((n) => n.id === id)?.dong;
const allFallback = MOCK_NEIGHBORHOODS.filter((n) => byId[n.id]?.source === "sigungu-fallback").map((n) => n.dong);
console.log(`\n── 시군구 폴백 총 ${allFallback.length}건: ${allFallback.join(", ")}`);
console.log(`   ├ 3-A 명시 폴백: ${allFallback.filter((d) => !thresholdFallbackIds.map(dongOf).includes(d)).join(", ")}`);
console.log(`   └ 임계(20/30) 미달 자동: ${thresholdFallbackIds.map(dongOf).join(", ")}`);
const missMaemae = MOCK_NEIGHBORHOODS.filter((n) => byId[n.id] && !byId[n.id].maemae).map((n) => n.dong);
const missJeonse = MOCK_NEIGHBORHOODS.filter((n) => byId[n.id] && !byId[n.id].jeonse).map((n) => n.dong);
const missWolse = MOCK_NEIGHBORHOODS.filter((n) => byId[n.id] && !byId[n.id].wolse).map((n) => n.dong);
console.log(`── 결측 매매 ${missMaemae.length}: ${missMaemae.join(", ") || "없음"}`);
console.log(`── 결측 전세 ${missJeonse.length}: ${missJeonse.join(", ") || "없음"}`);
console.log(`── 결측 월세 ${missWolse.length}: ${missWolse.join(", ") || "없음"}`);
if (missingMap.length) console.error(`❌ PRICE_DONG_MAPPING 누락 id: ${missingMap.join(", ")}`);

console.log(`\n── 상식 점검(고가 동네) ──`);
for (const dong of ["역삼동", "잠실동", "송도동", "광교동", "목동", "동탄"]) {
  const n = MOCK_NEIGHBORHOODS.find((x) => x.dong === dong);
  const e = n && byId[n.id];
  if (e) console.log(`  ${dong}: 매매 ${e.maemae ? man(e.maemae.median) : "—"} / 전세 ${e.jeonse ? man(e.jeonse.median) : "—"} (${e.source})`);
}

console.log(`\n✅ price-index.json — ${Object.keys(byId).length}/${MOCK_NEIGHBORHOODS.length} 동네. retrievedAt=${RETRIEVED_AT}`);
if (missingMap.length) process.exitCode = 1;
