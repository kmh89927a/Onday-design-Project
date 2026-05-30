"use client";

import type {
  CandidateArea,
  CommuteInfo,
  Coordinate,
  DiagnosisInput,
} from "@/lib/types";
import { haversineDistance } from "@/lib/haversine";
import { scoreCandidate } from "@/lib/diagnosis/scoring";
import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";

// ★ B2 클라 오케스트레이션 (production 모드 = USE_MOCK=false).
//   1) Haversine 사전필터 top N (가까운 동네만) → ODsay 호출 수 감축 (10~12)
//   2) /api/commute 프록시 Promise.all (각 함수 1 호출 → Vercel 10초 무관)
//   3) 필터 + 점수(transit) → 후보 → /api/diagnosis 저장(POST)
//   후보 풀 = 22 mock 동네 유지 (행정동/실 데이터 = v1.5+).

const PREFILTER_TOP_N = 12;
const RESULT_TOP_N = 8;

/** /api/commute 1회 — 경로 없음/에러면 null (해당 동네 제외). */
async function fetchCommute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<CommuteInfo | null> {
  const params = new URLSearchParams({
    olat: String(origin.lat),
    olng: String(origin.lng),
    dlat: String(destination.lat),
    dlng: String(destination.lng),
  });
  const res = await fetch(`/api/commute?${params.toString()}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { commute: CommuteInfo };
  return data.commute;
}

export async function runRealDiagnosis(input: DiagnosisInput) {
  const {
    coordinateA,
    coordinateB,
    leisureCoordA,
    leisureCoordB,
    filters,
    mode,
  } = input;

  // 1) Haversine 사전필터 — 직장 A(+B) 합산 직선거리 기준 가까운 top N.
  const prefiltered = MOCK_NEIGHBORHOODS.map((n) => {
    const dA = haversineDistance(coordinateA, n.coordinate);
    const dB = coordinateB ? haversineDistance(coordinateB, n.coordinate) : 0;
    return { n, combined: dA + dB };
  })
    .sort((a, b) => a.combined - b.combined)
    .slice(0, PREFILTER_TOP_N);

  // 2) 동네별 ODsay 통근시간 (병렬). 동네 내부 경로는 순차(동시 호출 부하 완화).
  const settled = await Promise.all(
    prefiltered.map(async ({ n }): Promise<CandidateArea | null> => {
      const commuteA = await fetchCommute(coordinateA, n.coordinate);
      if (!commuteA) return null; // 직장 A 경로 없으면 후보 제외

      let commuteB: CommuteInfo | null = null;
      if (coordinateB) {
        commuteB = await fetchCommute(coordinateB, n.coordinate);
        if (!commuteB) return null; // couple 인데 배우자 경로 없으면 제외
      }

      // single 모드 여가거점 (선택)
      let leisureA: CommuteInfo | null = null;
      if (leisureCoordA) leisureA = await fetchCommute(leisureCoordA, n.coordinate);
      let leisureB: CommuteInfo | null = null;
      if (leisureCoordB) leisureB = await fetchCommute(leisureCoordB, n.coordinate);

      // 필터 — 통근 상한
      if (filters.maxCommuteTime) {
        const maxCommute = Math.max(commuteA.time, commuteB?.time ?? 0);
        if (maxCommute > filters.maxCommuteTime) return null;
      }
      // 필터 — 예산 범위
      if (filters.budget) {
        if (n.avgPrice < filters.budget.min || n.avgPrice > filters.budget.max) {
          return null;
        }
      }

      const score = scoreCandidate({
        neighborhood: n,
        commuteA: commuteA.time,
        commuteB: commuteB?.time ?? null,
        leisureA: leisureA?.time ?? null,
        leisureB: leisureB?.time ?? null,
      });

      return {
        id: n.id,
        dong: n.dong,
        gu: n.gu,
        coordinate: n.coordinate,
        commuteA,
        commuteB: commuteB ?? undefined,
        leisureA: leisureA ?? undefined,
        leisureB: leisureB ?? undefined,
        score,
        safetyGrade: mode === "single" ? n.safetyGrade : undefined,
        priceRange: {
          min: Math.round(n.avgPrice * 0.85),
          max: Math.round(n.avgPrice * 1.15),
        },
        facilities: n.facilities,
        lines: n.lines,
        listingsCount: n.listingsCount,
        avgArea: n.avgArea,
      };
    }),
  );

  const candidates = settled
    .filter((c): c is CandidateArea => c !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_TOP_N);

  // 3) 저장 — production 분기는 클라가 계산한 candidates 를 받아 저장만 (B2).
  const res = await fetch("/api/diagnosis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, candidates }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "진단 저장에 실패했습니다");
  }
  return res.json();
}
