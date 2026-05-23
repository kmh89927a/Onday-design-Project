// ──────────────────────────────────────────────
// CMD-DIAG-001 자동완성 디바운스 Hook (300ms) — 명세 §3.4 풀세트 Hook 답습 정확.
//
// ★ lib/{도메인}/ owner 차원 첫 Client Component 입증 = lib/use-debounce.ts 답습 정밀화 (★ 자가 치유 28번째 = lib 루트 → lib 도메인 owner 확장).
//   환경 중립 책임 = geocoding.ts/coverage.ts 분리 (Server Action 금지는 본 파일에만, ★ Mismatch ④).
//
// ★ Mismatch ⑧ "use client" 쌍따옴표 (Prettier singleQuote: false 정합) — use-debounce.ts 답습.
// ★ Mismatch ⑨ React 19 react-hooks/set-state-in-effect 규칙 — 외부 동기화(디바운스 시간 윈도우 + 외부 API 응답) 정당 사용 사례.
// ★ 자가 치유 29번째 — 모든 setState 는 setTimeout 콜백 내부 (★ use-debounce.ts 답습 정밀화 = 동기 setState 0건, ESLint 정합).
//
// ★ setQuery 래핑 (selected 무효화) — 사용자 재입력 시 selected reset 으로 effect fetch 재개 (★ 명세 §3.4 자연 보강).
// ──────────────────────────────────────────────
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { geocodeAddress } from "./geocoding";
import type { GeocodedAddress } from "./geocoding-types";

const DEBOUNCE_MS = 300;

// React 19: setState in effect는 외부 동기화(디바운스 시간 윈도우 + 외부 API 응답) 정당 사용 사례.
export function useGeocode(apiKey: string) {
  const [query, setQueryRaw] = useState("");
  const [results, setResults] = useState<GeocodedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selected, setSelected] = useState<GeocodedAddress | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ★ setQuery: 사용자 입력 시 selected 무효화 (★ effect 의 if (selected) return 가드 재개)
  const setQuery = useCallback((newQuery: string) => {
    setQueryRaw(newQuery);
    setSelected(null);
  }, []);

  useEffect(() => {
    if (selected) return;

    // ★ 자가 치유 29번째 — 동기 setState 회피, setTimeout 콜백 내부 이동 (use-debounce.ts 답습 정밀화).
    if (query.length < 2) {
      const id = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(id);
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const geocoded = await geocodeAddress(query, apiKey);
        setResults(geocoded);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, apiKey, selected]);

  const selectAddress = useCallback((address: GeocodedAddress) => {
    setSelected(address);
    setQueryRaw(address.address); // ★ 내부 setter — selected reset 회피
    setResults([]);
  }, []);

  const reset = useCallback(() => {
    setQueryRaw("");
    setResults([]);
    setSelected(null);
    setError(null);
  }, []);

  return { query, setQuery, results, isLoading, error, selected, selectAddress, reset };
}
