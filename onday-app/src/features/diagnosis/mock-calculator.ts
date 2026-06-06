import type {
  CandidateArea,
  Coordinate,
  DiagnosisFilters,
  DiagnosisMode,
} from "@/lib/types";
import {
  haversineDistance,
  estimateCommuteMinutes,
  estimateTransfers,
} from "@/lib/haversine";
import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";
// ScoringEngine (#27) — 점수 로직은 공용 모듈로 추출. client(실 ODsay) + server(mock) 공유.
import { scoreCandidate } from "@/lib/diagnosis/scoring";
// 시세 4-A — 예산 필터·priceRange 가 실거래 median(price-index)을 사용. price.ts 추정 환산 제거.
import { comparableMedian, wolseMedian, priceRangeFor } from "@/lib/diagnosis/price-index";

interface ComputeResult {
  status: "fulfilled";
  candidate: CandidateArea;
}

interface ComputeError {
  status: "rejected";
  neighborhoodId: string;
  reason: string;
}

type ComputeSettled = ComputeResult | ComputeError;

interface ComputeArgs {
  coordA: Coordinate;
  coordB: Coordinate | null;
  leisureCoordA: Coordinate | null;
  leisureCoordB: Coordinate | null;
  filters: DiagnosisFilters;
  mode: DiagnosisMode;
}

async function computeOneCandidate(
  neighborhood: (typeof MOCK_NEIGHBORHOODS)[number],
  args: ComputeArgs,
): Promise<ComputeSettled> {
  const { coordA, coordB, leisureCoordA, leisureCoordB, filters, mode } = args;
  // 비동기 API 지연 시뮬레이션 (50-200ms)
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));

  // 출퇴근 시간대 혼잡 계수 — 출발 시각(commuteSchedule.departureTime) 반영 (#졸업 시간대 시뮬).
  const depTime = filters.commuteSchedule?.departureTime;

  const distA = haversineDistance(coordA, neighborhood.coordinate);
  const commuteA = estimateCommuteMinutes(distA, depTime);
  const transfersA = estimateTransfers(distA);

  let commuteB: number | null = null;
  let transfersB: number | undefined;
  if (coordB) {
    const distB = haversineDistance(coordB, neighborhood.coordinate);
    commuteB = estimateCommuteMinutes(distB, depTime);
    transfersB = estimateTransfers(distB);
  }

  let leisureA: number | null = null;
  let leisureATransfers: number | undefined;
  if (leisureCoordA) {
    const dist = haversineDistance(leisureCoordA, neighborhood.coordinate);
    leisureA = estimateCommuteMinutes(dist);
    leisureATransfers = estimateTransfers(dist);
  }
  let leisureB: number | null = null;
  let leisureBTransfers: number | undefined;
  if (leisureCoordB) {
    const dist = haversineDistance(leisureCoordB, neighborhood.coordinate);
    leisureB = estimateCommuteMinutes(dist);
    leisureBTransfers = estimateTransfers(dist);
  }

  // 통근 시간 상한 필터
  if (filters.maxCommuteTime) {
    const maxCommute = Math.max(commuteA, commuteB ?? 0);
    if (maxCommute > filters.maxCommuteTime) {
      return {
        status: "rejected",
        neighborhoodId: neighborhood.id,
        reason: `Commute time ${maxCommute}min exceeds max ${filters.maxCommuteTime}min`,
      };
    }
  }

  // Issue #123 — 예산 범위 외 제외 (★ maxCommuteTime 답습 정합).
  //   사용자 시각 검증 짚음: "예산 4~5억 박힘 + 결과 카드 4~5억 사이 X = 다양 박힘" → 범위 외 카드 제외 박힘.
  // 거래유형 — filters.dealType 단일 소스(budget 과 독립). 미지정=전세.
  const dealType = filters.dealType ?? "jeonse";
  if (filters.budget) {
    if (dealType === "wolse") {
      // 월세 — 보증금(상한) + 월세(범위) 2축. 실거래 median(price-index) 기준.
      //   median 결측이면 예산 충족 확인 불가 → 제외(임의 통과 금지, 가짜 결과 방지).
      const w = wolseMedian(neighborhood.id);
      if (!w) {
        return {
          status: "rejected",
          neighborhoodId: neighborhood.id,
          reason: "Wolse median 결측(price-index)",
        };
      }
      const depositOk = w.deposit <= (filters.budget.depositMax ?? Infinity);
      const monthlyOk =
        w.monthly >= filters.budget.min && w.monthly <= filters.budget.max;
      if (!depositOk || !monthlyOk) {
        return {
          status: "rejected",
          neighborhoodId: neighborhood.id,
          reason: `Wolse deposit ${w.deposit}/monthly ${w.monthly} outside budget`,
        };
      }
    } else {
      // 전세/매매 — 실거래 median. 미지정=전세. median 결측이면 제외(임의 통과 금지).
      const price = comparableMedian(neighborhood.id, dealType);
      if (price == null) {
        return {
          status: "rejected",
          neighborhoodId: neighborhood.id,
          reason: "Price median 결측(price-index)",
        };
      }
      if (price < filters.budget.min || price > filters.budget.max) {
        return {
          status: "rejected",
          neighborhoodId: neighborhood.id,
          reason: `Price ${price} outside budget [${filters.budget.min}, ${filters.budget.max}]`,
        };
      }
    }
  }

  const score = scoreCandidate({
    neighborhood,
    commuteA,
    commuteB,
    leisureA,
    leisureB,
    priority: filters.priorities?.[0],
  });

  return {
    status: "fulfilled",
    candidate: {
      id: neighborhood.id,
      dong: neighborhood.dong,
      gu: neighborhood.gu,
      coordinate: neighborhood.coordinate,
      commuteA: { time: commuteA, mode: "transit", transfers: transfersA },
      commuteB: coordB
        ? { time: commuteB!, mode: "transit", transfers: transfersB }
        : undefined,
      leisureA:
        leisureA != null
          ? {
              time: leisureA,
              mode: "transit",
              transfers: leisureATransfers,
            }
          : undefined,
      leisureB:
        leisureB != null
          ? {
              time: leisureB,
              mode: "transit",
              transfers: leisureBTransfers,
            }
          : undefined,
      score,
      safetyGrade: mode === "single" ? neighborhood.safetyGrade : undefined,
      // priceRange = 거래유형 median ±15%(만원). filters.dealType 기준(예산 미입력해도 거래유형 반영). 결측 시 undefined.
      priceRange: priceRangeFor(neighborhood.id, dealType),
      // 월세 — dealType=wolse 시만 채움(표시는 보증금/월). 실거래 median, 결측 시 undefined.
      wolseEstimate:
        dealType === "wolse"
          ? (wolseMedian(neighborhood.id) ?? undefined)
          : undefined,
      facilities: neighborhood.facilities,
      lines: neighborhood.lines,
      listingsCount: neighborhood.listingsCount,
      avgArea: neighborhood.avgArea,
    },
  };
}

/**
 * Mock diagnosis using Promise.allSettled pattern (Vercel timeout avoidance).
 * Computes commute times + leisure distances for all neighborhoods in parallel.
 */
export async function runMockDiagnosis(
  coordA: Coordinate,
  coordB: Coordinate | null,
  filters: DiagnosisFilters,
  mode: DiagnosisMode,
  leisureCoordA: Coordinate | null = null,
  leisureCoordB: Coordinate | null = null,
): Promise<CandidateArea[]> {
  const args: ComputeArgs = {
    coordA,
    coordB,
    leisureCoordA,
    leisureCoordB,
    filters,
    mode,
  };
  const results = await Promise.allSettled(
    MOCK_NEIGHBORHOODS.map((n) => computeOneCandidate(n, args)),
  );

  const candidates: CandidateArea[] = [];
  for (const result of results) {
    if (
      result.status === "fulfilled" &&
      result.value.status === "fulfilled"
    ) {
      candidates.push(result.value.candidate);
    }
    // rejected는 production에서 Sentry로
  }

  // 방어적 dedup — 같은 id 후보가 들어와도 result/지도의 React key(=candidate.id)
  //   충돌을 막는다 (mock 데이터에 중복이 또 생겨도 안전). 첫 항목 우선.
  const deduped = Array.from(
    new Map(candidates.map((c) => [c.id, c])).values(),
  );

  // Issue #106 ㊓ — 진단 페이지 약속 (후보 6~8개) 정합 (★ top 8개).
  return deduped.sort((a, b) => b.score - a.score).slice(0, 8);
}
