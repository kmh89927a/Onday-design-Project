// 시세 1단계 — 49개 동네(neighborhoods.ts) 좌표 → 국토부 실거래 조회용 법정동 코드(LAWD_CD 앞5자리) 부여.
//   카카오 Local coord2regioncode 역지오코딩(1회·빌드타임). 학교/공원(build-schools-index) 패턴 답습:
//   스크립트 + provenance(_source/retrievedAt) + 결측 방어(skip 금지·명시 기록).
//   실행: npm run build:lawd   (사전: .env.local 의 NEXT_PUBLIC_KAKAO_REST_API_KEY)
//
//   ★ 카카오 응답은 행정동(H) + 법정동(B) 둘 다 반환 → 국토부 실거래는 "법정동" 기준이므로 region_type "B" 사용.
//   ★ lawdCd = 법정동코드(10자리) 앞 5자리 = 시군구 코드. 국토부 실거래가 OpenAPI 의 LAWD_CD 파라미터.
//   ★ 우리 dong(한글명) ↔ 카카오 법정동명 불일치(행정동↔법정동 차이)는 flag → 사람이 검토할 목록 별도 출력.
//   이번 단계는 매핑 데이터 생성만. neighborhoods.ts 본문·시세 로직(price.ts) 무변경.

import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";

// .env.local 직접 로드(tsx 는 Next env 를 자동 주입하지 않음). 없으면 셸 환경변수에 의존(CI).
try {
  process.loadEnvFile(join(process.cwd(), ".env.local"));
} catch {
  // .env.local 부재 — process.env 에 이미 있으면 통과, 없으면 아래에서 throw.
}
const KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
if (!KEY) {
  throw new Error(
    "NEXT_PUBLIC_KAKAO_REST_API_KEY 없음 — .env.local 또는 셸 환경변수 확인 필요.",
  );
}

const OUT = join(process.cwd(), "src/lib/data/lawd-mapping.json");
const RAW_DUMP = join(process.cwd(), "data-raw/kakao-coord2regioncode-raw.json"); // provenance(git 미추적)
// retrievedAt 은 날짜 단위(시각 제외) — 재실행 시 동일 좌표→동일 코드(결정론) + diff 노이즈 최소화.
const RETRIEVED_AT = new Date().toISOString().slice(0, 10);
const REQUEST_DELAY_MS = 120; // 카카오 Local API rate limit 여유(49콜 → 약 6초).

// 시/도 판정 — 법정동코드 앞 2자리(행안부 체계). 11=서울, 28=인천, 41=경기.
const SIDO_BY_PREFIX: Record<string, string> = {
  "11": "서울",
  "28": "인천",
  "41": "경기",
};

interface KakaoRegionDoc {
  region_type: "H" | "B"; // H=행정동, B=법정동
  code: string; // 10자리 코드
  address_name: string;
  region_1depth_name: string; // 시/도
  region_2depth_name: string; // 시군구
  region_3depth_name: string; // 읍면동(B=법정동명)
  region_4depth_name: string; // 리(있을 때만)
  x: number;
  y: number;
}
interface KakaoCoord2RegionResponse {
  meta: { total_count: number };
  documents: KakaoRegionDoc[];
}

interface LawdEntry {
  dong: string; // 우리 한글 동네명(neighborhoods.ts)
  gu: string; // 우리 시군구명(neighborhoods.ts) — 검토 비교용
  kakaoLegalDong: string; // 카카오 법정동명(region_type=B)
  kakaoSigungu: string; // 카카오 시군구명(검토 보조)
  lawdCd: string; // 법정동코드 앞 5자리 = 시군구 코드(국토부 LAWD_CD)
  fullCode: string; // 법정동코드 10자리
  lat: number;
  lng: number;
  mismatch: boolean; // 우리 dong ≠ 카카오 법정동명(행정동↔법정동 차이 검토 대상)
  sigunguMismatch: boolean; // ★ 우리 gu ≠ 카카오 시군구 → lawdCd 가 다른 구를 가리킴(critical: 국토부 조회 정확도 직결)
  _source: string;
  retrievedAt: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// "성남시 분당구" → "분당구", "인천 서구" → "서구", "강남구" → "강남구" (마지막 구/시 토큰).
//   우리 gu 와 카카오 region_2depth_name 의 형식 차이를 흡수해 시군구 일치 판정.
const lastSigunguToken = (s: string) => s.trim().split(/\s+/).pop() ?? s.trim();

async function reverseGeocode(
  lng: number,
  lat: number,
): Promise<KakaoCoord2RegionResponse> {
  // coord2regioncode: x=경도(lng), y=위도(lat).
  const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KEY}` },
  });
  if (!res.ok) {
    throw new Error(`카카오 HTTP ${res.status} (${await res.text()})`);
  }
  return (await res.json()) as KakaoCoord2RegionResponse;
}

async function main() {
  const byId: Record<string, LawdEntry> = {};
  const rawDump: Record<string, KakaoCoord2RegionResponse> = {};
  const errors: { id: string; dong: string; reason: string }[] = [];
  const mismatches: LawdEntry[] = [];

  for (const n of MOCK_NEIGHBORHOODS) {
    try {
      const resp = await reverseGeocode(n.coordinate.lng, n.coordinate.lat);
      rawDump[n.id] = resp;

      // 국토부 = 법정동 기준 → region_type "B" 만 사용(H=행정동 무시).
      const legal = resp.documents.find((d) => d.region_type === "B");
      if (!legal) {
        errors.push({
          id: n.id,
          dong: n.dong,
          reason: `법정동(B) 문서 없음 — documents=${resp.documents.map((d) => d.region_type).join(",")}`,
        });
        continue;
      }
      if (!legal.code || legal.code.length !== 10) {
        errors.push({
          id: n.id,
          dong: n.dong,
          reason: `법정동코드 형식 이상: "${legal.code}"`,
        });
        continue;
      }

      const mismatch = n.dong.trim() !== legal.region_3depth_name.trim();
      const sigunguMismatch =
        lastSigunguToken(n.gu) !== lastSigunguToken(legal.region_2depth_name);
      const entry: LawdEntry = {
        dong: n.dong,
        gu: n.gu,
        kakaoLegalDong: legal.region_3depth_name,
        kakaoSigungu: legal.region_2depth_name,
        lawdCd: legal.code.slice(0, 5),
        fullCode: legal.code,
        lat: n.coordinate.lat,
        lng: n.coordinate.lng,
        mismatch,
        sigunguMismatch,
        _source: "Kakao coord2regioncode",
        retrievedAt: RETRIEVED_AT,
      };
      byId[n.id] = entry;
      if (mismatch) mismatches.push(entry);
    } catch (err) {
      errors.push({
        id: n.id,
        dong: n.dong,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  // 시/도별 분포(서울/경기/인천).
  const dist: Record<string, number> = { 서울: 0, 인천: 0, 경기: 0, 기타: 0 };
  for (const e of Object.values(byId)) {
    const sido = SIDO_BY_PREFIX[e.lawdCd.slice(0, 2)] ?? "기타";
    dist[sido]++;
  }

  // ★ critical = 시군구까지 다른 경우(lawdCd 가 다른 구를 가리킴). dong명만 다른 건 같은 구라 lawdCd 영향 없음.
  const sigunguMismatches = Object.values(byId).filter((e) => e.sigunguMismatch);

  const out = {
    _meta: {
      description:
        "각 neighborhood 좌표 → 국토부 실거래 조회용 법정동 코드(LAWD_CD 앞5자리) 매핑. 시세 실데이터 1단계(수집 선행).",
      method:
        "카카오 Local API coord2regioncode 역지오코딩. region_type='B'(법정동) 사용 — 국토부 실거래는 법정동 기준(행정동 H 무시).",
      lawdCd:
        "법정동코드 10자리의 앞 5자리 = 시군구 코드. 국토부 실거래가 OpenAPI 의 LAWD_CD 파라미터.",
      source: "Kakao coord2regioncode (dapi.kakao.com/v2/local/geo)",
      retrievedAt: RETRIEVED_AT,
      generatedFrom: "scripts/build-lawd-mapping.ts",
      total: MOCK_NEIGHBORHOODS.length,
      mapped: Object.keys(byId).length,
      distribution: dist,
      mismatchCount: mismatches.length,
      sigunguMismatchCount: sigunguMismatches.length,
      mismatchNote:
        "mismatch=true 는 우리 dong(한글명) ≠ 카카오 법정동명(행정동↔법정동 차이). 매핑 오류가 아니라 후속 검토 대상 — 실거래는 법정동 기준이라 카카오 법정동명/코드가 정답에 가깝다.",
      sigunguMismatchNote:
        "★ sigunguMismatch=true 는 우리 gu ≠ 카카오 시군구 → lawdCd 가 다른 구를 가리킴(좌표가 구 경계라 그렇다). 국토부 조회 정확도에 직결 — 우리 의도 동네의 시세를 받으려면 사람이 좌표/코드를 재확인해야 한다(역삼동→강남역 좌표=서초동 등).",
      note: "scripts/build-lawd-mapping.ts 로 생성(결정론적). 원본 카카오 응답 덤프 = data-raw/kakao-coord2regioncode-raw.json (git 미추적).",
    },
    byId,
  };

  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  writeFileSync(RAW_DUMP, JSON.stringify(rawDump, null, 2) + "\n");

  // ── 콘솔 리포트 ───────────────────────────────────────────────
  console.log(
    `\n✅ lawd-mapping.json — ${Object.keys(byId).length}/${MOCK_NEIGHBORHOODS.length} 동네 매핑 (실패 ${errors.length})`,
  );
  console.log(
    `   분포: 서울 ${dist.서울} / 경기 ${dist.경기} / 인천 ${dist.인천}` +
      (dist.기타 ? ` / 기타 ${dist.기타}` : ""),
  );

  console.log(`\n── 샘플 5개 (dong / 법정동명 / lawdCd) ──`);
  for (const n of MOCK_NEIGHBORHOODS.slice(0, 5)) {
    const e = byId[n.id];
    console.log(
      e
        ? `   ${e.dong.padEnd(8)} → ${e.kakaoLegalDong.padEnd(8)} / ${e.lawdCd} (${e.fullCode})`
        : `   ${n.dong.padEnd(8)} → (매핑 실패)`,
    );
  }

  console.log(
    `\n── ★ 시군구 불일치 ${sigunguMismatches.length}건 (lawdCd 가 다른 구를 가리킴 — critical, 사람 재확인 필수) ──`,
  );
  for (const e of sigunguMismatches) {
    console.log(
      `   우리 "${e.gu} ${e.dong}" → 카카오 "${e.kakaoSigungu} ${e.kakaoLegalDong}" (lawdCd ${e.lawdCd})`,
    );
  }

  console.log(
    `\n── 법정동명만 불일치(같은 구, lawdCd 영향 없음) ${mismatches.length - sigunguMismatches.length}건 ──`,
  );
  for (const e of mismatches.filter((m) => !m.sigunguMismatch)) {
    console.log(
      `   우리 "${e.gu} ${e.dong}" → 카카오 법정동 "${e.kakaoLegalDong}" (lawdCd ${e.lawdCd})`,
    );
  }

  if (errors.length) {
    console.error(
      `\n❌ 매핑 실패 ${errors.length}건 — 49개 전부 매핑돼야 다음 단계(실거래 수집) 가능:`,
    );
    for (const e of errors) console.error(`   ${e.id} (${e.dong}): ${e.reason}`);
    process.exitCode = 1;
  } else {
    console.log(`\n카카오 호출 실패 0건 — retrievedAt=${RETRIEVED_AT}`);
  }

  // 결과물 존재 가드(쓰기 검증).
  if (!existsSync(OUT)) throw new Error("lawd-mapping.json 쓰기 실패");
}

main();
