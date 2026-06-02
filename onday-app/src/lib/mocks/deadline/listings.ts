import type { CandidateArea } from "@/lib/types";
import type { ListingItem } from "@/lib/types/deadline";

// 데드라인 급매 mock — 후보 동네별로 급매 매물 1~3건 생성.
// 실 매물 API 없음 (네이버 아웃링크 위임). 결정적 생성으로 데모 안정 (Math.random 미사용).

const DEAL_TYPES = ["매매", "전세"] as const;

function listingsForArea(c: CandidateArea): ListingItem[] {
  const areaName = `${c.gu} ${c.dong}`;
  const basePrice = c.priceRange
    ? (c.priceRange.min + c.priceRange.max) / 2
    : 50000; // 만원
  const basePyeong = c.avgArea ?? 24;
  const count = Math.min(3, Math.max(1, ((c.listingsCount ?? 3) % 3) + 1));

  return Array.from({ length: count }, (_, i) => {
    const discountPercent = 5 + ((i * 4 + c.dong.length) % 11); // 5~15%, 결정적
    const discounted = basePrice * (1 - discountPercent / 100);
    return {
      id: `${c.id}-listing-${i}`,
      areaName,
      dealType: DEAL_TYPES[(i + c.gu.length) % 2],
      priceLabel: `${Math.round(discounted / 1000) / 10}억`, // 만원 → 억 (1자리)
      pyeong: Math.max(8, Math.round(basePyeong + (i - 1) * 4)),
      elapsedDays: 7 + ((i * 5 + c.dong.length) % 24), // 7~30일
      discountPercent,
      coordinate: c.coordinate,
    };
  });
}

export function buildMockListings(candidates: CandidateArea[]): ListingItem[] {
  return candidates.flatMap(listingsForArea);
}
