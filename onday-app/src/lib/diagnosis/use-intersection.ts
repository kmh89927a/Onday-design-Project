// ──────────────────────────────────────────────
// CMD-DIAG-002 교집합 산출 Hook — calculateIntersection 호출 + 상태 관리.
//
// ★ Client Component § lib/{도메인}/ owner 차원 2번째 입증 = CMD-DIAG-001 use-geocode.ts 답습 정수.
// ★ Mismatch ⑥ "use client" 쌍따옴표 (Prettier singleQuote: false 정합) — use-debounce.ts + use-geocode.ts 답습.
// ★ React 19: setState in effect는 외부 동기화(API 응답) 정당 사용 사례.
//   ★ 본 Hook은 useCallback 내부 async setState 만 사용 (★ effect 사용 X = react-hooks/set-state-in-effect 규칙 비대상).
// ──────────────────────────────────────────────
"use client";

import { useCallback, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import type { IKakaoTransportClient } from "@/lib/external/kakao-transport";
import type { Coordinate, DiagnosisFilters } from "@/lib/types";
import { calculateIntersection, type IntersectionResult } from "./intersection";

const RESPONSE_TIME_THRESHOLD_MS = 8000;

export function useIntersection(transportClient: IKakaoTransportClient) {
  const [result, setResult] = useState<IntersectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(
    async (coordA: Coordinate, coordB: Coordinate, filters: DiagnosisFilters) => {
      setIsLoading(true);
      setError(null);
      const startTime = performance.now();
      try {
        const res = await calculateIntersection(coordA, coordB, filters, transportClient);
        setResult(res);
      } catch (e) {
        Sentry.captureException(e, { tags: { domain: "diagnosis", task: "CMD-DIAG-002" } });
        setError("진단 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        const elapsed = performance.now() - startTime;
        if (elapsed > RESPONSE_TIME_THRESHOLD_MS) {
          Sentry.captureMessage(`Intersection calculation exceeded ${RESPONSE_TIME_THRESHOLD_MS}ms: ${elapsed.toFixed(0)}ms`, {
            level: "warning",
            tags: { domain: "diagnosis", task: "CMD-DIAG-002" },
          });
        }
        setIsLoading(false);
      }
    },
    [transportClient],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { result, isLoading, error, calculate, reset };
}
