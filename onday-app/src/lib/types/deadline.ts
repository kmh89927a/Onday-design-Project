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
  neighborhoodId: string; // 후보 동네 id — 인근 초등학교(getNearestSchool) 조회 키.
  areaName: string; // "강남구 역삼동"
  dealType: "매매" | "전세";
  priceLabel: string; // "4.5억"
  pyeong: number; // 평형
  elapsedDays: number; // 등록 경과일 (급매 = 오래 남은 매물 강조)
  discountPercent: number; // 급매 할인율 (%)
  coordinate: { lat: number; lng: number };
}

// ── UI-011 / QRY-DL-002 — "30분 요약 카드" (Top 3 동네 요약, REQ-FUNC-018) ──
//   ListingItem(급매 매물 단위)과 별개 — 본 DTO 는 동네 단위 요약(통근 A/B·생활점수·AI 추천 이유).
//   카드 UI 는 Phase 2, 표시 연결은 Phase 3. 본 타입은 백엔드(Phase 1) 산출물.

/** 30분 요약 카드 DTO — 항목 ≥6개 강제 (REQ-FUNC-018). */
export interface SummaryCardDTO {
  candidateId: string;
  candidateName: string; // 1. 동네명 ("강남구 역삼동")
  estimatedPrice: string; // 2. 예상 시세 ("전세 7.2억") — formatDealValue
  commuteToA: string; // 3. 직장 A 통근 ("대중교통 35분")
  commuteToB: string; // 4. 직장 B 통근 ("대중교통 42분") — 싱글/단일 직장은 "—"
  livingScore: number; // 5. 생활편의 점수 (0~100) — 종합 적합도 score
  naverSearchUrl: string; // 6. 네이버 부동산 링크 (buildNaverRealEstateUrl)
  schoolDistrict?: string; // 7. 인근 초등학교 (있을 때만, getNearestSchool)
  rationale: string; // 8. AI 추천 이유 (또는 fallback 룰 기반 — 빈 값 금지)
  rank: number; // Top 3 순위 (1~3)
}

/** getSummary 결과 묶음. */
export interface SummaryResult {
  cards: SummaryCardDTO[];
  generatedAt: string; // ISO 8601
  totalCandidates: number;
}

/** /api/summary 응답 — rationale 1건 (클라가 Top3 Promise.all). */
export interface RationaleResponse {
  rationale: string;
  source: "ai" | "fallback"; // 데모 투명성 — AI 생성인지 룰 기반인지.
}
