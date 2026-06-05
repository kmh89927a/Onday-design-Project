import type { ListingFilters } from "@/lib/types/deadline";

// QRY-DL-001 / CMD-DL-002 — 네이버 부동산 검색 아웃링크 URL 조합 (단일 수정점).
// 자체 매물 DB 없이 조건을 URL 파라미터로 위임 (REQ-FUNC-016).
// 네이버 부동산 검색 URL 스펙은 비공식이라 본 함수를 단일 변경점으로 둔다 (스펙 변경 시 여기만 수정).
const NAVER_LAND_BASE = "https://land.naver.com/";

export function buildNaverRealEstateUrl(
  area: string,
  filters: ListingFilters = {},
): string {
  const params = new URLSearchParams({ query: area });
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.roomType && filters.roomType !== "all") {
    params.set("type", filters.roomType);
  }
  return `${NAVER_LAND_BASE}?${params.toString()}`;
}

// 학군 PR2 — 인근 초등학교명 → 네이버 통합검색 아웃링크.
//   학교는 부동산(land.naver.com)이 아니라 search.naver.com. URLSearchParams 가 한글 인코딩 처리.
//   ★ 좌표 최근접 "인근" 학교 — 정확한 배정 학군은 검색 결과에서 사용자가 확인하는 흐름.
const NAVER_SEARCH_BASE = "https://search.naver.com/search.naver";

export function buildSchoolSearchUrl(schoolName: string): string {
  const params = new URLSearchParams({ query: schoolName });
  return `${NAVER_SEARCH_BASE}?${params.toString()}`;
}
