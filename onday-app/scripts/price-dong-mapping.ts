// 시세 3-A — 사람이 검수·승인한 동네 ↔ 실거래(국토부) 법정동 조인표.
//   build-price-index.ts(3-B)가 소비. lawd-mapping.json(카카오 자동 생성)과 달리 이건 "사람 결정"이라
//   성격이 다르므로 src/lib/data(생성물)와 분리해 scripts 아래 둔다.
//
//   sigungu = 실거래 '시군구' 셀의 시군구부(시도 제외) 표준형.
//     - 서울/경기: "강남구", "화성시 동탄구"(일반구 포함)처럼 그대로.
//     - 인천: 실거래 시도='인천광역시'라 모호(서울 중구 vs 인천 중구) → "인천 " 접두로 구분("인천 서구","인천 중구").
//   legalDong = 법정동명 1+개(OR 매칭). 복수=집계(성수동1·2가), 빈 배열=시군구 폴백.
//   strategy = "legalDong"(법정동 정밀) | "sigungu-fallback"(구 단위 평균, 동 데이터 부족).
//
//   ★ 3-A 결정 요약:
//     - 다수의 dong 불일치는 "우리 dong이 실제 법정동이고 매칭이 더 큼" → dong 채택(불광/풍무/산본/시흥/평촌/상동).
//     - 좌표가 경계라 카카오가 인접 법정동을 준 경우 우리 dong이 법정동 아님 → kakao 법정동 채택(왕십리→행당동 등).
//     - override 2건(역삼/사당): 좌표는 인접 구지만 의도 동네의 실제 법정동으로.
//     - 동탄/상동: 실거래 텍스트가 일반구 포함("화성시 동탄구","부천시 원미구") → sigungu 정정.
//     - apt 희박/저볼륨(종로3가·신포동·성신여대입구·신촌동·동탄)은 시군구 폴백.

export interface PriceDongMap {
  sigungu: string; // 실거래 시군구부 표준형(위 규칙)
  legalDong: string[]; // 법정동명 0+개. []=시군구 폴백
  strategy: "legalDong" | "sigungu-fallback";
  note?: string;
}

// key = neighborhood id (MOCK_NEIGHBORHOODS)
export const PRICE_DONG_MAPPING: Record<string, PriceDongMap> = {
  // ── 자동/단순 dong 채택 (dong = 실제 법정동, 매칭 양호) ──
  "mapo-gondeok": { sigungu: "마포구", legalDong: ["공덕동"], strategy: "legalDong" },
  "yongsan-itaewon": { sigungu: "용산구", legalDong: ["이태원동"], strategy: "legalDong" },
  "songpa-jamsil": { sigungu: "송파구", legalDong: ["잠실동"], strategy: "legalDong" },
  "yeongdeungpo-yeouido": { sigungu: "영등포구", legalDong: ["여의도동"], strategy: "legalDong" },
  "nowon-junggye": { sigungu: "노원구", legalDong: ["중계동"], strategy: "legalDong" },
  "gwanak-bongcheon": { sigungu: "관악구", legalDong: ["봉천동"], strategy: "legalDong" },
  "yangcheon-mokdong": { sigungu: "양천구", legalDong: ["목동"], strategy: "legalDong" },
  "dobong-chang": { sigungu: "도봉구", legalDong: ["창동"], strategy: "legalDong" },
  "jungnang-myeonmok": { sigungu: "중랑구", legalDong: ["면목동"], strategy: "legalDong" },
  "gangseo-yeomchang": { sigungu: "강서구", legalDong: ["염창동"], strategy: "legalDong" },
  "gangbuk-mia": { sigungu: "강북구", legalDong: ["미아동"], strategy: "legalDong" },
  "jongno-pyeongchang": { sigungu: "종로구", legalDong: ["평창동"], strategy: "legalDong" },
  "gimpo-sau": { sigungu: "김포시", legalDong: ["사우동"], strategy: "legalDong" },
  "gimpo-janggi": { sigungu: "김포시", legalDong: ["장기동"], strategy: "legalDong" },
  "ilsan-madu": { sigungu: "고양시 일산동구", legalDong: ["마두동"], strategy: "legalDong" },
  "ilsan-janghang": { sigungu: "고양시 일산동구", legalDong: ["장항동"], strategy: "legalDong" },
  "bundang-seohyeon": { sigungu: "성남시 분당구", legalDong: ["서현동"], strategy: "legalDong" },
  "bundang-jeongja": { sigungu: "성남시 분당구", legalDong: ["정자동"], strategy: "legalDong" },
  "bundang-pangyo": { sigungu: "성남시 분당구", legalDong: ["판교동"], strategy: "legalDong" },
  "incheon-cheongna": { sigungu: "인천 서구", legalDong: ["청라동"], strategy: "legalDong" },
  "incheon-songdo": { sigungu: "인천 연수구", legalDong: ["송도동"], strategy: "legalDong" },
  "incheon-bupyeong": { sigungu: "인천 부평구", legalDong: ["부평동"], strategy: "legalDong" },
  "gwangjin-jayang": { sigungu: "광진구", legalDong: ["자양동"], strategy: "legalDong" },

  // ── override (좌표=인접 구지만 의도 동네의 실제 법정동) ──
  "gangnam-station": {
    sigungu: "강남구",
    legalDong: ["역삼동"],
    strategy: "legalDong",
    note: "override: 좌표=강남역(서초동)이나 의도=역삼동",
  },
  "dongjak-sadang": {
    sigungu: "동작구",
    legalDong: ["사당동"],
    strategy: "legalDong",
    note: "override: 좌표=사당역(관악구 경계)이나 의도=동작구 사당동",
  },

  // ── dong 채택 (우리 dong이 실제 법정동이고 매칭이 kakao 대안보다 큼) ──
  "guro-gasan": {
    sigungu: "금천구",
    legalDong: ["가산동"],
    strategy: "legalDong",
    note: "가산동=금천구 소재(이전 구로구 오라벨 정정, #168)",
  },
  "eunpyeong-bulgwang": {
    sigungu: "은평구",
    legalDong: ["불광동"],
    strategy: "legalDong",
    note: "dong 채택(kakao 대조동보다 매칭 큼)",
  },
  "gimpo-pungmu": {
    sigungu: "김포시",
    legalDong: ["풍무동"],
    strategy: "legalDong",
    note: "dong 채택(kakao 고촌읍=0건)",
  },
  "gunpo-sanbon": {
    sigungu: "군포시",
    legalDong: ["산본동"],
    strategy: "legalDong",
    note: "dong 채택(kakao 금정동보다 매칭 큼)",
  },
  "geumcheon-siheung": {
    sigungu: "금천구",
    legalDong: ["시흥동"],
    strategy: "legalDong",
    note: "라벨일치 우선(독산동 대안 있으나 동네명 일치 채택)",
  },
  "anyang-pyeongchon": {
    sigungu: "안양시 동안구",
    legalDong: ["평촌동"],
    strategy: "legalDong",
    note: "라벨일치 우선(호계동 대안 있으나 동네명 일치 채택)",
  },
  "bucheon-jung": {
    sigungu: "부천시 원미구",
    legalDong: ["상동"],
    strategy: "legalDong",
    note: "상동=실제 법정동. 신설 일반구 '부천시 원미구' 포함",
  },

  // ── kakao 법정동 채택 (우리 dong이 행정동/신도시명이라 법정동 아님) ──
  "seongdong-wangsimni": {
    sigungu: "성동구",
    legalDong: ["행당동"],
    strategy: "legalDong",
    note: "왕십리=행정동 → 법정동 행당동",
  },
  "suwon-yeongtong": {
    sigungu: "수원시 영통구",
    legalDong: ["이의동"],
    strategy: "legalDong",
    note: "광교=신도시 → 법정동 이의동",
  },
  "seongnam-wirye": {
    sigungu: "성남시 수정구",
    legalDong: ["창곡동"],
    strategy: "legalDong",
    note: "위례=신도시 → 법정동 창곡동",
  },
  "seongnam-sujeong": {
    sigungu: "성남시 수정구",
    legalDong: ["신흥동"],
    strategy: "legalDong",
    note: "수정동(행정동) → 법정동 신흥동",
  },
  "gwangjin-gundae": {
    sigungu: "광진구",
    legalDong: ["화양동"],
    strategy: "legalDong",
    note: "건대입구=역명 → 법정동 화양동",
  },
  "incheon-geomdan": {
    sigungu: "인천 서구",
    legalDong: ["금곡동"],
    strategy: "legalDong",
    note: "검단신도시 분산 저볼륨 → 임계 미달 시 자동 시군구 폴백",
  },

  // ── 집계(legalDong 복수) ──
  "seongdong-seongsu": {
    sigungu: "성동구",
    legalDong: ["성수동1가", "성수동2가"],
    strategy: "legalDong",
    note: "성수동=법정동 1·2가로 분할 → 집계",
  },

  // ── 시군구 폴백 (apt 희박/저볼륨) ──
  "hwaseong-dongtan": {
    sigungu: "화성시 동탄구",
    legalDong: [],
    strategy: "sigungu-fallback",
    note: "'동탄' 법정동 없음(동탄신도시=다수 법정동) → 동탄구 집계",
  },
  "jong-3": {
    sigungu: "종로구",
    legalDong: [],
    strategy: "sigungu-fallback",
    note: "종로3가=상업지, apt 거의 없음 → 종로구 평균",
  },
  "incheon-sinpo": {
    sigungu: "인천 중구",
    legalDong: [],
    strategy: "sigungu-fallback",
    note: "신포동=구도심, apt 희박 → 인천 중구 평균",
  },
  "seongbuk-seongshin": {
    sigungu: "성북구",
    legalDong: [],
    strategy: "sigungu-fallback",
    note: "성신여대입구 인근 법정동 거의 없음 → 성북구 평균",
  },
  "seodaemun-sinchon": {
    sigungu: "서대문구",
    legalDong: [],
    strategy: "sigungu-fallback",
    note: "신촌(창천동) 저볼륨 → 서대문구 평균",
  },
};
