// ──────────────────────────────────────────────
// UI-002 adapter Hook — 사전 작업 444 lines ↔ CMD-DIAG-001 useGeocode 통합.
//
// ★ features/diagnosis/ adapter Hook 패턴 § (NEW) = UI 측 adapter owner 첫 입증 (★ use-diagnosis.ts 동거).
// ★ CMD-DIAG-001 useGeocode Hook 첫 본격 호출처 실전 = Client Component § lib/{도메인}/ owner 차원 첫 본격 호출처.
// ★ Mock/실 분기 § = NEXT_PUBLIC_USE_MOCK 환경 변수 답습 정수.
//
// ★ Mismatch ⑪ 정정: lib/use-debounce.ts 답습 정수 (★ 명세 use-debounced-value.ts 신규 stale).
// ★ Mismatch ⑫ 정정: useGeocode Hook 호출 (★ 명세 searchAddress stale).
// ★ Mismatch ⑭ 정정: 사전 작업 AddressSuggestion 인터페이스 답습 (★ 사전 작업 src/components/form/suggest-list.tsx 정수).
// ★ Mismatch ⑯ 정정 (★ Phase B 자체 grill): AddressSuggestion = { id, title, sub, kind, coordinate? } (★ subtitle/coord/isMetroArea 가정 stale).
// ★ Mismatch ⑰ 정정 (★ Phase B 자체 grill): MOCK_NEIGHBORHOODS = @/mocks/neighborhoods (★ @/lib/mocks/... 가정 stale).
// ──────────────────────────────────────────────
"use client";

import { useEffect, useState } from "react";
import { useGeocode } from "@/lib/diagnosis";
import type { GeocodedAddress } from "@/lib/diagnosis";
import type { AddressSuggestion } from "@/components/form/suggest-list";
import { useDebounce } from "@/lib/use-debounce";
import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";
import { comparableMedian } from "@/lib/diagnosis/price-index";

const SUGGESTION_LIMIT = 5;
const DEBOUNCE_MS = 300;
const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ?? "";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** ★ Neighborhood → AddressSuggestion 변환 (★ REFACTOR-UI-002-FEEDBACK 헬퍼 추출, 중복 제거) */
function neighborhoodToSuggestion(n: (typeof MOCK_NEIGHBORHOODS)[number]): AddressSuggestion {
  // 4-B: 기존 "매가 X억"은 avgPrice(전세 추정)를 매매가로 오라벨 → price-index 실거래 매매 median 으로 정정.
  //   결측(id 없음)이면 가격 라벨 생략(거짓값 금지).
  const maemae = comparableMedian(n.id, "maemae");
  const pricePart = maemae != null ? `매매가 ${(maemae / 10000).toFixed(1)}억 · ` : "";
  return {
    id: n.id,
    title: `${n.gu} ${n.dong}`,
    sub: `${pricePart}안전등급 ${n.safetyGrade}`,
    kind: "지역" as const,
    coordinate: n.coordinate,
  };
}

/** ★ Mock 분기 = 사전 작업 searchNeighborhoods 답습 정수 + REFACTOR-UI-002-FEEDBACK 빈 query 인기 지역 분기 추가 (★ 피드백 1 정수) */
function mockSearch(query: string): AddressSuggestion[] {
  const q = query.trim();
  // ★ REFACTOR-UI-002-FEEDBACK: 빈 query 시 인기 지역 Top 5 반환 (★ AddressInput showList 자연 작동 = focus 시 인기 지역 자동 표시)
  if (!q) return MOCK_NEIGHBORHOODS.slice(0, SUGGESTION_LIMIT).map(neighborhoodToSuggestion);
  return MOCK_NEIGHBORHOODS.filter(
    (n) =>
      n.dong.includes(q) || n.gu.includes(q) || `${n.gu} ${n.dong}`.includes(q),
  )
    .slice(0, SUGGESTION_LIMIT)
    .map(neighborhoodToSuggestion);
}

/** ★ β₁ 실 모드 변환 = GeocodedAddress → AddressSuggestion (adapter 책임) */
function geocodedToSuggestion(g: GeocodedAddress): AddressSuggestion {
  return {
    id: `${g.coord.lat},${g.coord.lng}`,
    title: g.address,
    sub: g.region,
    kind: "지역" as const,
    coordinate: g.coord,
  };
}

// React 19: setState in effect는 외부 동기화(디바운스 + 외부 API) 정당 사용 사례 (★ use-debounce.ts + use-geocode.ts 답습 정수).
export function useAddressSuggest(query: string): {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
} {
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const [mockSuggestions, setMockSuggestions] = useState<AddressSuggestion[]>([]);

  // ★ 실 모드 — useGeocode Hook 호출처 첫 본격 실전 (★ apiKey 외부 전달)
  const geocode = useGeocode(KAKAO_API_KEY);

  // ★ 외부 query → useGeocode setQuery 동기화 (★ effect 내부 setQuery = useGeocode 자체 디바운스 활용)
  useEffect(() => {
    if (!USE_MOCK) {
      geocode.setQuery(debouncedQuery);
    }
  }, [debouncedQuery, geocode]);

  // ★ Mock 모드 — setTimeout 0 콜백 내부 setState (★ 자가 치유 29번째 답습)
  useEffect(() => {
    if (!USE_MOCK) return;
    const id = setTimeout(() => setMockSuggestions(mockSearch(debouncedQuery)), 0);
    return () => clearTimeout(id);
  }, [debouncedQuery]);

  if (USE_MOCK) {
    return { suggestions: mockSuggestions, isLoading: false };
  }
  // 실 모드 — useGeocode 풀세트 Hook의 results → AddressSuggestion 변환
  return {
    suggestions: geocode.results.slice(0, SUGGESTION_LIMIT).map(geocodedToSuggestion),
    isLoading: geocode.isLoading,
  };
}
