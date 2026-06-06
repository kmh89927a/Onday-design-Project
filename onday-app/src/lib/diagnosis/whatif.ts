// 출근시간(출발시각) what-if 재계산 — ★ 후보 재선정 대신 고정 baseline 세트를 in-place 갱신.
//   거래유형/예산 토글(refilterPool, 통근 캐시 재활용)과 다른 경로 — 출발시각이 바뀌면 통근'분'이
//   달라지므로 baseline 의 통근을 재추정한다(routePath·순위·여가는 보존, 통근 분만 재계산).
//   · 대중교통: estimateCommuteMinutes(거리, 출발시각) — 러시아워 계수 반영
//   · 자동차: 실 Kakao 기준시간 × rushHourFactor (거리추정은 도로보다 짧아 부정확 → 기준값 보존)
//   부부(result-content)·싱글(single-result-view) 공용. 예산/통근 필터는 baseline 의 baked
//   priceRange/wolseEstimate 기준(진단 시점 dealType) — what-if 의미론 유지.

import {
  estimateCommuteMinutes,
  haversineDistance,
  rushHourFactor,
} from "@/lib/haversine";
import type { CandidateArea, DiagnosisFilters } from "@/lib/types";

export function recomputeWhatIf(
  baseline: CandidateArea[],
  filters: DiagnosisFilters,
  coordA: { lat: number; lng: number },
  coordB: { lat: number; lng: number } | null | undefined,
): CandidateArea[] {
  const depTime = filters.commuteSchedule?.departureTime;
  const carFactor = rushHourFactor(depTime);
  return baseline
    .map((c) => {
      const distA = haversineDistance(coordA, c.coordinate);
      const next: CandidateArea = {
        ...c,
        commuteA: { ...c.commuteA, time: estimateCommuteMinutes(distA, depTime) },
      };
      if (coordB && c.commuteB) {
        const distB = haversineDistance(coordB, c.coordinate);
        next.commuteB = {
          ...c.commuteB,
          time: estimateCommuteMinutes(distB, depTime),
        };
      }
      if (c.commuteACar) {
        next.commuteACar = {
          ...c.commuteACar,
          time: Math.round(c.commuteACar.time * carFactor),
        };
      }
      if (c.commuteBCar) {
        next.commuteBCar = {
          ...c.commuteBCar,
          time: Math.round(c.commuteBCar.time * carFactor),
        };
      }
      return next;
    })
    .filter((c) => {
      if (filters.maxCommuteTime) {
        const maxC = Math.max(c.commuteA.time, c.commuteB?.time ?? 0);
        if (maxC > filters.maxCommuteTime) return false;
      }
      if (filters.budget) {
        if (filters.dealType === "wolse") {
          // 월세 — 보증금/월세로 재필터 (priceRange 는 전세 scale 라 부적합).
          const w = c.wolseEstimate;
          if (w) {
            if (w.monthly > filters.budget.max) return false;
            if (
              filters.budget.depositMax != null &&
              w.deposit > filters.budget.depositMax
            ) {
              return false;
            }
          }
        } else if (c.priceRange) {
          const avg = (c.priceRange.min + c.priceRange.max) / 2;
          if (avg < filters.budget.min || avg > filters.budget.max) return false;
        }
      }
      return true;
    });
}
