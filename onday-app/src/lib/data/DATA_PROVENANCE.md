# OnDay 실데이터 출처·재현성 인덱스 (DATA_PROVENANCE)

OnDay가 동네 추천·점수·표시에 쓰는 **실데이터**의 원본 출처·가공 방법·재현 명령·한계를 한 곳에 모은 문서다.

**정직 원칙(이 문서 작성 규칙)**
- 각 데이터 JSON의 `_meta` 블록·`_*Source` 필드·`*_DATA_GUIDE.md`에 **실제로 적힌 것만** 기재한다.
- 원본 dataset ID·URL이 소스에 명시돼 있지 않으면 **"확인 필요"**로 솔직히 표기한다(추측 출처·가짜 ID 금지).
- 미수집·미검증은 `no_data` / `null` / "출처 확인 중"으로 남긴다 — 값 날조 금지.

---

## 0. 한눈에 보기

| # | 데이터 | 생성물(`src/lib/data/`) | 원본 출처(요약) | 빌드 명령 | 재현 상태 |
|---|---|---|---|---|---|
| 1 | 시세(매매·전세·월세) | `price-index.json` | 국토교통부 실거래가공개시스템 | `npm run build:price` | ✅ 완전 |
| 2 | 학군(인근 초교) | `schools-index.json` | 학교알리미 표준데이터(data.go.kr) | `npm run build:schools` | ✅ 완전 |
| 3 | 지하철 혼잡도 | `congestion-index.json` · `congestion-commute.json` | 서울교통공사 시간대별 혼잡도(1~8호선) | `npm run build:congestion` | ✅ 완전 |
| 4 | 법정동 매핑 | `lawd-mapping.json` | Kakao coord2regioncode API | `npm run build:lawd` | ✅ 완전 |
| 5 | 공원·공공도서관 | `community-index.json` | data.go.kr 표준데이터(공원·도서관) | `npm run build:community` | 🟠 수집 진행(스크립트·원본 보유) |
| 6 | 야간안전(범죄·CCTV) | `safety-index.json` | 행안부 지역안전지수 + 시군구 CCTV현황 | 수기 입력(스크립트 없음) | 🟠 65/66(수원 no_data) |
| 7 | 편의점·카페 밀집도 | (하드코딩 `src/mocks/neighborhoods.ts`) | 소상공인 상가정보 추정 | 없음 | ⚠️ 출처 미검증·원본/스크립트 없음 |
| 8 | 지하철역 좌표 | `metro-dong.json` | 수기 큐레이션 | 없음 | ⚠️ 메타·출처 없음 |

> `data-raw/`(원본 파일 디렉토리)는 **git 미추적**(`.gitignore`). 대용량 공공데이터 원본은 아래 "다운로드 위치"에서 받아 `data-raw/`에 넣고 빌드 명령을 실행하면 동일 JSON이 **결정론적으로** 재생성된다.

---

## 1. 시세 — `price-index.json`

- **원본 출처:** 국토교통부 실거래가공개시스템 — 아파트 매매/전월세 (정확한 OpenAPI/URL은 `_meta`에 미기재 → **확인 필요**)
- **기간/필터:** 2025-12 ~ 2026-06 · 전용 **60–85㎡**(국민주택규모) 한정 · `retrievedAt` 2026-06-06
- **다운로드 위치(data-raw):** `apt-trade_서울.xlsx`·`apt-trade_경기도.xlsx`·`apt-trade_인천.xlsx` · `apt-rent_서울.xlsx`·`apt-rent_경기도.xlsx`·`apt-rent_인천.xlsx`
- **빌드:** `npm run build:price` → `scripts/build-price-index.ts` + `scripts/price-dong-mapping.ts`
- **가공 방법:** `PRICE_DONG_MAPPING`(사람 큐레이션)으로 (시군구+법정동) 텍스트 조인 후 중앙값. 숫자 LAWD 미사용.
- **읽는 코드:** `src/lib/diagnosis/price-index.ts` — `comparableMedian` / `wolseMedian` / `priceRangeFor` / `priceSource`
- **한계(정직 표기):** 동 표본 매매<20 또는 전월세<30 → **자동 시군구 폴백**(`source:"sigungu-fallback"`, 10개 중 5개 발동). 결측은 `null`(추정 환산 없음). 60–85㎡ 외 제외.

## 2. 학군(인근 초등학교) — `schools-index.json`

- **원본 출처:** 학교알리미 **전국초중등학교위치표준데이터** (data.go.kr) · 제공기관 한국교육시설안전원 · `updatedAt` 2026-03-20 (숫자 dataset ID는 `_meta`에 미기재 → **확인 필요**)
- **다운로드 위치(data-raw):** `schools.xls`
- **빌드:** `npm run build:schools` → `scripts/build-schools-index.ts` (초등학교만 필터 → 동네 좌표 기준 **Haversine 최근접 1곳**, 결정론적)
- **읽는 코드:** `src/lib/schools-index.ts` — `getNearestSchool`
- **한계(정직 표기):** **"배정"이 아니라 "인근"** (학구도 폴리곤 미보유). 정확한 배정은 학구도(`data.go.kr/15021158`)로 업그레이드 가능. 미매핑 시 `null`(등급 날조 금지).

## 3. 지하철 혼잡도 — `congestion-index.json` · `congestion-commute.json`

- **원본 출처:** 서울교통공사 지하철 시간대별 혼잡도 (공공데이터포털, **1~8호선**) · `dayType` 평일 · `retrievedAt` 2026-06-09 (숫자 dataset ID 미기재 → **확인 필요**)
- **단위:** 혼잡도 %(좌석수 대비 승객수 추정, 100% 초과 가능)
- **다운로드 위치(data-raw):** `subway.csv` (**EUC-KR/CP949** 인코딩)
- **빌드:** `npm run build:congestion` → `scripts/build-congestion.ts`
  - 출력 2종: 전체(`congestion-index.json`, 39개 30분 단위) + 출근 경량본(`congestion-commute.json`, 6시00분~10시00분 9개)
- **읽는 코드:** `src/features/stress/congestion.ts` — `getCongestion(line, station, time, direction?)`
- **한계(정직 표기):** **서울교통공사 1~8호선 한정.** 신분당선·9호선·수인분당·경의중앙·공항철도·우이신설·경기/인천 도시철도 등 **미포함 → 조회 시 `no_data`**. 결측은 배열 인덱스 `null`.

## 4. 법정동 매핑 — `lawd-mapping.json`

- **원본 출처:** **Kakao coord2regioncode** (`dapi.kakao.com/v2/local/geo`) · `region_type='B'`(법정동) · `retrievedAt` 2026-06-06
- **다운로드 위치(data-raw):** `kakao-coord2regioncode-raw.json` (44개 동네 좌표 역지오코딩 응답 덤프)
- **빌드:** `npm run build:lawd` → `scripts/build-lawd-mapping.ts` (LAWD_CD 앞 5자리 = 시군구 코드 추출, 결정론적)
- **용도:** 국토부 실거래 조회용 시군구 코드(시세 수집 1단계 보조). 런타임에서 직접 표시하진 않음.
- **한계(정직 표기):** 44개 전부 매핑. `mismatch`=20(우리 dong명 ≠ 카카오 법정동명 — 행정동↔법정동 차이, 오류 아님), `sigunguMismatch`=2(좌표가 구 경계 — 동탄→화성시, 상동→부천시), `override`=2(역삼→강남구 11680 · 사당→동작구 11590, 사람 보정).

## 5. 공원·공공도서관 — `community-index.json`

- **원본 출처:** data.go.kr **전국도시공원정보표준데이터** · **전국공공도서관표준데이터** (검색어 기준 — 숫자 dataset ID는 GUIDE에 미기재 → **확인 필요**). 행별 `_parksSource`/`_librariesSource`에 출처 기록.
- **다운로드 위치(data-raw):** `parks.xls`(또는 `.xlsx`/`.csv`) · `libraries.xls`
- **빌드:** `npm run build:community` → `scripts/build-community-index.ts` (시군구별 count 집계)
- **읽는 코드:** `src/lib/diagnosis/community-index.ts` — `getCommunityByGu`
- **가이드:** [`COMMUNITY_INDEX_DATA_GUIDE.md`](./COMMUNITY_INDEX_DATA_GUIDE.md)
- **상태/한계:** 수도권 65 시군구(수원 제외) 키 준비, **수집 진행 중**. `parks`·`libraries` 둘 다 차야 표시 — 하나라도 결측이면 UI **"준비중"**. `_meta` 블록은 아직 비어 있음(GUIDE·행 필드로 출처 추적).

## 6. 야간안전(범죄·CCTV) — `safety-index.json`

- **종합식:** 범죄(행안부 지역안전지수)×0.7 + CCTV 밀집도(면적당 정규화)×0.3 · 시군구 단위
- **원본 출처:**
  - 범죄 등급: **행정안전부 지역 안전지수 등급현황** — `data.go.kr/data/15069240` (2025)
  - CCTV: 서울 **열린데이터광장 OA-2734**(2025.12.31) · 인천 **공공데이터 15104287** · 경기 **경기데이터드림 CCTV현황** (시·군 면적으로 ÷)
- **빌드:** **없음** — `_meta.note`대로 사람이 직접 채우는 데이터. 검증은 `npm run check:coverage`.
- **읽는 코드:** `src/features/single/safety-index.ts` — `getSafetyByGu` (등급 A/B/C/D)
- **가이드:** [`SAFETY_INDEX_DATA_GUIDE.md`](./SAFETY_INDEX_DATA_GUIDE.md)
- **상태/한계(정직 표기):** 수도권 **65/66 완성**(서울25·인천10·경기30). **수원시 `no_data`**(경기데이터드림 표준데이터셋 미제출 — 추측값 안 넣음). ⚠️ 서울 일부 구 CCTV는 GUIDE상 "이투데이2022 기사 대수 ÷ 위키 면적" **추정값**이 섞일 수 있음(행별 `_cctvSource`에 기록) — OA-2734 엑셀로 덮어쓰면 정확. 동 단위 미보유 → 시군구 룩업.

## 7. ⚠️ 편의점·카페 밀집도 — 하드코딩(`src/mocks/neighborhoods.ts`)

- **현 표기:** 코드 주석 — "소상공인시장진흥공단 상가(상권)정보(2026.03)에서 각 동 좌표 반경 1km 내 편의점/카페 실집계(오프라인)".
- **★ 출처 검증 상태: 미검증.** UI 출처(`LAYER_SOURCES`, `src/app/single/[id]/single-result-view.tsx`)에도 **`자체 집계 (출처 확인 중)`**로 표기. **정확한 dataset ID/URL = 확인 필요.**
- **원본/스크립트:** **없음**(`data-raw`에 원본 없음, 빌드 스크립트 없음) → 현재 **재현 불가**.
- **읽는 코드:** `src/lib/diagnosis/scoring.ts`(점수) · `single-result-view.tsx`(정렬·표시).
- **권장 후속:** 실 dataset(소상공인 상가정보 정확 ID·연도) 확정 + 집계 방법(좌표 반경 1km) 명문화 + `build:facilities` 스크립트·원본 확보. 확정 전까지 "출처 확인 중" 유지(정직).

## 8. ⚠️ 지하철역 좌표 — `metro-dong.json`

- **구조:** `[{ name, coord{lat,lng}, region1 }]` 44개 동네 좌표 배열. **`_meta`/출처 없음.**
- **상태:** 수기 큐레이션 좌표(지도 마커용). 출처·생성방법 메타 미보유.
- **권장 후속:** `_meta`(출처·생성방법) 추가.

---

## 재현 명령 요약

```bash
# data-raw/ 에 각 원본을 넣은 뒤(아래 "다운로드 위치" 참조):
npm run build:price       # apt-trade*×3 + apt-rent*×3 → price-index.json
npm run build:schools     # schools.xls            → schools-index.json
npm run build:congestion  # subway.csv(EUC-KR)     → congestion-index.json + congestion-commute.json
npm run build:lawd        # kakao-...-raw.json     → lawd-mapping.json
npm run build:community   # parks.xls + libraries.xls → community-index.json
npm run check:coverage    # safety-index.json 커버리지 검증(65/66)
# 야간안전(safety-index.json)·편의점카페·metro-dong 은 빌드 스크립트 없음(수기/미보유)
```

## 출처 검증 상태 정리

| 데이터 | 출처 명시 | 정확 dataset ID/URL |
|---|---|---|
| 야간안전(범죄) | ✅ 행안부 지역안전지수 | ✅ `data.go.kr/15069240` |
| 야간안전(CCTV) | ✅ 서울/인천/경기 | ✅ OA-2734 · 15104287 · 경기데이터드림 |
| 법정동 매핑 | ✅ Kakao API | ✅ `dapi.kakao.com/v2/local/geo` |
| 시세 | ✅ 국토부 실거래가공개시스템 | ⚠️ 확인 필요(URL/OpenAPI 미기재) |
| 학군 | ✅ 학교알리미 표준데이터 | ⚠️ 확인 필요(숫자 ID 미기재; 학구도=15021158은 별건) |
| 혼잡도 | ✅ 서울교통공사 공공데이터포털 | ⚠️ 확인 필요(숫자 ID 미기재) |
| 공원·도서관 | ✅ data.go.kr 표준데이터 | ⚠️ 확인 필요(검색어만, 숫자 ID 미기재) |
| 편의점·카페 | ⚠️ 소상공인 상가정보(추정) | ❌ 미검증("출처 확인 중") |
| 지하철역 좌표 | ❌ 없음(수기) | ❌ 없음 |

---

*이 문서는 `src/lib/data/*.json`의 `_meta`·`_*Source` 필드와 `*_DATA_GUIDE.md`에서 추출했다. 데이터가 갱신되면 해당 `_meta`와 함께 본 표를 갱신한다.*
