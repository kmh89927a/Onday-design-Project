# community-index.json 데이터 채우기 가이드 (B 정책 — 공원·공공도서관)

싱글 모드 "공원·도서관" 레이어 + #조용한동네 태그의 **실데이터 소스**.
#57 야간안전(safety-index)과 동일 패턴 — 수도권 65 시군구 단위 정적 JSON.
**로직·스키마·룩업(`getCommunityByGu`)은 완성됨. 값만 채우면 끝.** 코드 수정 불필요.

미수집(null)인 동안은 화면에 "준비중"으로 정직 표기됨(날조 X). 채울수록 활성화.

---

## 0. 목표

`src/lib/data/community-index.json` 의 65 시군구 `parks`·`libraries` 를 채운다.
방법은 2가지 — **A(자동 스크립트, 권장)** 또는 B(수기).

## 1. 데이터 다운로드 (공공데이터포털)

[data.go.kr](https://www.data.go.kr) 에서 아래 2개 **표준데이터** CSV 다운로드:

| 데이터 | 검색어 | 다운로드 |
|---|---|---|
| 공원 | **전국도시공원정보표준데이터** | 파일데이터 → **xlsx 또는 csv** |
| 공공도서관 | **전국공공도서관표준데이터** | 파일데이터 → **xlsx 또는 csv** |

- **엑셀(.xlsx) 그대로 OK** — 스크립트가 xlsx·csv 둘 다 읽음(변환 불필요)
- 둘 다 "소재지도로명주소" 또는 "소재지지번주소" 컬럼 포함 → 거기서 시군구 추출
- (csv를 쓸 경우만) 인코딩 EUC-KR이면 UTF-8로 저장

## 2. ★ 시군구 키 규칙 (#57과 동일 — 틀리면 매핑 안 됨)

| 권역 | 규칙 | 예 |
|---|---|---|
| 서울 25 | 자치구명 그대로 | `"강남구"` |
| 인천 10 | **"인천 " 프리픽스** | `"인천 서구"` |
| 경기 30 | **시·군 단위**(일반구 합침) | `"성남시"` (분당구 합침) |

정확한 65 키 = `community-index.json` 의 `sigungu` 필드 (= safety-index.json 과 동일).

## 3-A. 자동 집계 (권장)

1. 다운로드한 파일을 `onday-app/data-raw/` 에 넣고 이름 변경 (.xlsx 또는 .csv):
   - 공원 → `data-raw/parks.xlsx` (또는 `parks.csv`)
   - 도서관 → `data-raw/libraries.xlsx` (또는 `libraries.csv`)
2. 실행:
   ```bash
   npx tsx scripts/build-community-index.ts
   ```
3. 출력에 `✅ N/65 시군구 완성` + 미매핑 행 수가 찍힘.
   - 미매핑이 많으면 = 주소 컬럼명이 다름 → 스크립트의 `ADDRESS_COLS` 에 실제 헤더명 추가
   - 시군구명 파싱이 어긋나면 `toSigunguKey()` 보정

> 스크립트가 `parks`·`libraries` 와 `_parksSource`·`_librariesSource`(출처 추적)를 자동 기입.

## 3-B. 수기 (소량/검증용)

`community-index.json` 의 각 entry에 직접:
```json
{ "sigungu": "강남구", "region1": "서울특별시",
  "parks": 38, "libraries": 6,
  "_parksSource": "data.go.kr:도시공원2024", "_librariesSource": "data.go.kr:공공도서관2024" }
```

## 4. 검증

- `npx tsc --noEmit` 통과
- 싱글 결과 → "공원·도서관" 레이어 → 채운 시군구는 숫자, 안 채운 곳은 "준비중"
- #조용한동네 태그 → 공원·도서관 많은 동네 상위

## 5. 한계 / 후속 (정직 표기)

- **단순 count** — 큰 시군구가 유리(왜곡). MVP는 count로 시작.
- 후속: 인구/면적당 보정(#57 면적당 튜닝 사례 참조), 동단위 데이터.
- 공원 "수"는 면적 무시(대형공원 1 vs 소형 5 동일) — 후속에 면적 합산 고려.
