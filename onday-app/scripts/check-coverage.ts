// QRY-SINGLE-001 (#57) — 수도권 야간안전 커버리지 CI 검증.
//   ★ 명세 Rev 1.1 의 "동(dong) 1,234개 중 90%" → Rev 1.2 "수도권 66 시군구 100%" 로 갱신 (E-2).
//   safety-index.json 의 _filled 항목이 66 시군구를 전부 덮는지 확인. 미달 시 exit 1 (빌드 실패).
//   실행: npm run check:coverage  (npx tsx scripts/check-coverage.ts)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, "..", "src", "lib", "data", "safety-index.json");

// 수도권 66 시군구 정규 목록 (서울25 + 인천10 + 경기31).
//   ★ 키 규칙 = normalizeGu() 출력과 일치해야 함:
//   서울 자치구=bare("강남구") / 인천=프리픽스("인천 중구", 서울 중구 충돌 방지) / 경기=시군("성남시", 일반구 미분리).
const EXPECTED: string[] = [
  // 서울 25
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구",
  "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구",
  "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구",
  // 인천 10 (자치구 8 + 군 2)
  "인천 중구", "인천 동구", "인천 미추홀구", "인천 연수구", "인천 남동구",
  "인천 부평구", "인천 계양구", "인천 서구", "인천 강화군", "인천 옹진군",
  // 경기 31 (시·군, 일반구 미분리)
  "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시",
  "안산시", "고양시", "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시",
  "의왕시", "하남시", "용인시", "파주시", "이천시", "안성시", "김포시", "화성시",
  "광주시", "양주시", "포천시", "여주시", "연천군", "가평군", "양평군",
];

interface Entry {
  sigungu: string;
  crimeGrade: number | null;
  cctvPerKm2: number | null;
}

const data = JSON.parse(readFileSync(JSON_PATH, "utf8")) as { entries: Entry[] };
// ★ NFC 정규화 — readFileSync 는 한글을 NFD(자모분리)로 읽을 수 있고(macOS),
//   EXPECTED 리터럴은 NFC 라 정규화 없이 비교하면 전부 불일치한다. 양쪽 NFC 로 통일.
const nfc = (s: string) => s.normalize("NFC");
const expected = EXPECTED.map(nfc);
// "완성" = 두 지표(범죄등급+CCTV) 모두 채워진 시군구. 하나라도 null 이면 미완성(커버 X).
const filled = new Set(
  data.entries
    .filter((e) => e.crimeGrade != null && e.cctvPerKm2 != null)
    .map((e) => nfc(e.sigungu)),
);

// CCTV 만 채워진(범죄등급 대기) 중간 진척도 별도 표시 — 단계별 워크플로 가시화.
const cctvOnly = data.entries.filter(
  (e) => e.cctvPerKm2 != null && e.crimeGrade == null,
).length;

const missing = expected.filter((s) => !filled.has(s));
const unknown = [...filled].filter((s) => !expected.includes(s));

const total = EXPECTED.length;
const covered = total - missing.length;
const ratio = ((covered / total) * 100).toFixed(1);

console.log(`수도권 커버리지: ${covered}/${total} 시군구 = ${ratio}% (완성 = 범죄등급+CCTV 둘 다)`);
if (cctvOnly > 0) {
  console.log(`   ↳ CCTV만 채워진(범죄등급 대기) 시군구: ${cctvOnly}개`);
}

if (unknown.length > 0) {
  console.warn(`⚠️  EXPECTED 목록에 없는 키 ${unknown.length}건 (오타 의심): ${unknown.join(", ")}`);
}

if (missing.length > 0) {
  console.error(`❌ 미수집 ${missing.length}건:`);
  console.error("   " + missing.join(", "));
  console.error("→ safety-index.json 에 위 시군구의 crimeGrade·cctvPerKm2 를 모두 채우세요 (DATA_GUIDE 참조).");
  process.exit(1);
}

console.log("✅ 수도권 66 시군구 100% 커버 — 통과");
