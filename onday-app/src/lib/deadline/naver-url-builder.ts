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
