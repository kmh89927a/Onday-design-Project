// QRY-DL-001 / CMD-DL-002 — 데드라인 급매 매물 타입.
// 자체 매물 DB 없음 — 조건을 네이버 부동산 아웃링크 URL로 위임 (REQ-FUNC-016).

export type RoomType = "apartment" | "officetel" | "villa" | "all";

export interface ListingFilters {
  priceMin?: number; // 만원
  priceMax?: number; // 만원
  roomType?: RoomType;
}

export interface ListingItem {
  id: string;
  areaName: string; // "강남구 역삼동"
  dealType: "매매" | "전세";
  priceLabel: string; // "4.5억"
  pyeong: number; // 평형
  elapsedDays: number; // 등록 경과일 (급매 = 오래 남은 매물 강조)
  discountPercent: number; // 급매 할인율 (%)
  coordinate: { lat: number; lng: number };
}
