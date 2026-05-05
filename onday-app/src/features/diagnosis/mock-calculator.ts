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

interface ScoreInput {
  neighborhood: (typeof MOCK_NEIGHBORHOODS)[number];
  commuteA: number;
  commuteB: number | null;
  leisureA: number | null;
  leisureB: number | null;
  filters: DiagnosisFilters;
}

// 여가거점 가산 (Figma 비전 — single 모드, 0~5점/거점)
function leisureBonus(minutes: number | null): number {
  if (minutes == null) return 0;
  // 0분 → +5, 30분 → 0, 그 이상 → 0
  return Math.max(0, 5 - minutes / 6);
}

function scoreCandidate({
  neighborhood,
  commuteA,
  commuteB,
  leisureA,
  leisureB,
  filters,
}: ScoreInput): number {
  let score = 100;

  // 통근 패널티 (가장 큰 요인)
  const avgCommute = commuteB != null ? (commuteA + commuteB) / 2 : commuteA;
  score -= Math.min(40, avgCommute * 0.8);

  // 예산 초과 패널티
  if (filters.budget?.max && neighborhood.avgPrice > filters.budget.max) {
    const overBudgetRatio =
      (neighborhood.avgPrice - filters.budget.max) / filters.budget.max;
    score -= Math.min(20, overBudgetRatio * 40);
  }

  // 안전등급 가산
  const safetyBonus: Record<string, number> = { A: 10, B: 5, C: 0, D: -10 };
  score += safetyBonus[neighborhood.safetyGrade] ?? 0;

  // 편의시설 가산
  const facilityScore =
    (neighborhood.facilities.convenience + neighborhood.facilities.cafes) / 10;
  score += Math.min(10, facilityScore);

  // 여가거점 가산 (single 모드 — Figma 비전)
  score += leisureBonus(leisureA) + leisureBonus(leisureB);

  return Math.max(0, Math.min(100, Math.round(score)));
}

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

  const distA = haversineDistance(coordA, neighborhood.coordinate);
  const commuteA = estimateCommuteMinutes(distA);
  const transfersA = estimateTransfers(distA);

  let commuteB: number | null = null;
  let transfersB: number | undefined;
  if (coordB) {
    const distB = haversineDistance(coordB, neighborhood.coordinate);
    commuteB = estimateCommuteMinutes(distB);
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

  const score = scoreCandidate({
    neighborhood,
    commuteA,
    commuteB,
    leisureA,
    leisureB,
    filters,
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
      priceRange: {
        min: Math.round(neighborhood.avgPrice * 0.85),
        max: Math.round(neighborhood.avgPrice * 1.15),
      },
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

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * SRS pattern: splitForPreview — show 1 location free, lock others.
 */
export function splitForPreview(areas: CandidateArea[]) {
  const sorted = [...areas].sort((a, b) => b.score - a.score);
  const [preview, ...locked] = sorted;
  return { preview: preview ?? null, locked };
}
