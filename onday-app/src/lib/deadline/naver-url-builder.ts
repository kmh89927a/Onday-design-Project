import type { Coordinate, DealType } from "@/lib/types";
import type { RoomType } from "@/lib/types/deadline";

// QRY-DL-001 / CMD-DL-002 — 네이버 부동산 아웃링크 URL 조합 (단일 수정점, REQ-FUNC-016).
// ★ 구 land.naver.com/?query= 는 동작 안 함(403→포털 홈, 파라미터 무시) → 좌표 기반 new.land 로 교체.
//   형식: new.land.naver.com/complexes?ms={lat},{lng},{zoom}&a={매물종류}&b={거래유형}&e=RETAIL
//   - ms = 지도중심 좌표+줌 (법정동코드 불필요 → 폴백 동네 포함 전 동네 커버)
//   - a  = 매물종류 (APT/OPST/VL), 미지정 = APT
//   - b  = 거래유형 (매매=A1 / 전세=B1 / 월세=B2), 미지정 시 생략
//   - e  = RETAIL (네이버 고정 카테고리)
//   가격·면적은 new.land URL 스킴에 없음(내부 API 전용) → 싣지 않는다(거짓 param 금지).
const NAVER_LAND_BASE = "https://new.land.naver.com/complexes";
const NAVER_MAP_ZOOM = 16;

// 거래유형 → 네이버 b= 코드.
const NAVER_TRADE_CODE: Record<DealType, string> = {
  maemae: "A1",
  jeonse: "B1",
  wolse: "B2",
};

// 매물종류 → 네이버 a= 코드. all/미지정 = APT (우리 시세·면적이 아파트 60~85㎡ 실거래 기준).
const NAVER_ARTICLE_CODE: Record<RoomType, string> = {
  apartment: "APT",
  officetel: "OPST",
  villa: "VL",
  all: "APT",
};

export interface NaverRealEstateOptions {
  dealType?: DealType; // 거래유형 → b= (미지정 시 b 생략)
  roomType?: RoomType; // 매물종류 → a= (기본 APT)
}

export function buildNaverRealEstateUrl(
  coordinate: Coordinate,
  options: NaverRealEstateOptions = {},
): string {
  const { lat, lng } = coordinate;
  const article = NAVER_ARTICLE_CODE[options.roomType ?? "apartment"];
  const trade = options.dealType ? NAVER_TRADE_CODE[options.dealType] : null;
  // 좌표(숫자)·코드(ASCII) 모두 인코딩 불필요 → 수동 조립으로 ms 콤마를 리터럴 유지(네이버 정규 형식).
  const tradeParam = trade ? `&b=${trade}` : "";
  return `${NAVER_LAND_BASE}?ms=${lat},${lng},${NAVER_MAP_ZOOM}&a=${article}${tradeParam}&e=RETAIL`;
}

// ★ 모바일 대응 — PC 좌표 URL(new.land)은 모바일에서 네이버가 fin.land 로 리다이렉트하며 구조 비호환
//   ("페이지 찾을 수 없음"). 모바일 매물 딥링크는 네이버가 좌표 인코딩으로 막아 직접 생성 불가 →
//   동네명으로 네이버 지도 검색(map.naver.com/p/search/{동네명})으로 우회. 모바일·PC 모두 동작.
//   상세 매물 대신 지도 탐색이라 마이크로카피로 안내(아래 상수). 분기는 클라이언트(useIsMobile)에서만.
const NAVER_MAP_SEARCH_BASE = "https://map.naver.com/p/search";

// 모바일 매물 CTA 문구 + 안내 마이크로카피 — 호출처 공통(중복 방지).
export const NAVER_MOBILE_CTA_LABEL = "네이버 부동산 탐색하기";
export const NAVER_MOBILE_NOTE =
  "💡 모바일에서는 지도로 연결돼요. 상세 매물은 PC에서 확인해 보세요!";

// 동네명("강남구 역삼동") → 네이버 지도 검색 아웃링크. 한글은 encodeURIComponent 로 인코딩.
export function buildNaverMobileMapUrl(neighborhoodName: string): string {
  return `${NAVER_MAP_SEARCH_BASE}/${encodeURIComponent(neighborhoodName)}`;
}

// 학군 PR2 — 인근 초등학교명 → 네이버 통합검색 아웃링크.
//   학교는 부동산(land.naver.com)이 아니라 search.naver.com. URLSearchParams 가 한글 인코딩 처리.
//   ★ 좌표 최근접 "인근" 학교 — 정확한 배정 학군은 검색 결과에서 사용자가 확인하는 흐름.
const NAVER_SEARCH_BASE = "https://search.naver.com/search.naver";

export function buildSchoolSearchUrl(schoolName: string): string {
  const params = new URLSearchParams({ query: schoolName });
  return `${NAVER_SEARCH_BASE}?${params.toString()}`;
}
