"use client";

import type {
  CandidateArea,
  CommuteInfo,
  Coordinate,
  DiagnosisInput,
} from "@/lib/types";
import {
  haversineDistance,
  estimateCommuteMinutes,
  estimateTransfers,
} from "@/lib/haversine";
import { scoreCandidate } from "@/lib/diagnosis/scoring";
// 시세 4-A — 예산 필터·priceRange 가 실거래 median(price-index)을 사용. price.ts 추정 환산 제거.
import { comparableMedian, wolseMedian, priceRangeFor } from "@/lib/diagnosis/price-index";
import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";
import { KakaoCarClient } from "@/lib/external/kakao-car";

// ★ W2B 자차 — 카카오 모빌리티 브라우저 직접 (NEXT_PUBLIC, 도메인 제한). ODsay 프록시와 병렬.
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ?? "";
const kakaoCar = KAKAO_KEY ? new KakaoCarClient({ apiKey: KAKAO_KEY }) : null;

// ODsay(대중교통) 실패 시 haversine 추정 fallback — 후보 drop 대신 추정값 유지.
//   ★ Vercel 무료(ODsay 공인 IP 화이트리스트 불가) 환경에서도 결과가 비지 않게.
//   routePath 없음 → 지도에서 직선 점선(추정) 표시 = 정직. 자차(Kakao)는 실 도로선 유지.
function estimateTransit(
  origin: Coordinate,
  destination: Coordinate,
  departureTime?: string,
): CommuteInfo {
  const dist = haversineDistance(origin, destination);
  return {
    time: estimateCommuteMinutes(dist, departureTime),
    mode: "transit",
    transfers: estimateTransfers(dist),
  };
}

/** 자차 통근 — best-effort. 실패/키없음 → null (차량 행만 생략, 후보·점수 무영향). */
async function fetchCarCommute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<CommuteInfo | null> {
  if (!kakaoCar) return null;
  try {
    return await kakaoCar.getCarCommute(
      { x: origin.lng, y: origin.lat },
      { x: destination.lng, y: destination.lat },
    );
  } catch {
    return null;
  }
}

// ★ B2 클라 오케스트레이션 (production 모드 = USE_MOCK=false).
//   1) Haversine 사전필터 top N (가까운 동네만) → ODsay 호출 수 감축 (10~12)
//   2) /api/commute 프록시 Promise.all (각 함수 1 호출 → Vercel 10초 무관)
//   3) 필터 + 점수(transit) → 후보 → /api/diagnosis 저장(POST)
//   후보 풀 = 22 mock 동네 유지 (행정동/실 데이터 = v1.5+).

const PREFILTER_TOP_N = 12;
const RESULT_TOP_N = 8;

// ★ ODsay 초당 호출 제한(미공개) 회피 — 동네를 배치로 처리(동시 ODsay 호출 cap).
//   Promise.all 전량 동시(~20+)는 429(Too Many Requests) 유발 → 배치 N개씩.
const ODSAY_CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

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

  // 2) 동네별 통근시간 (병렬). ★ 방향 = 동네(집) → 직장 (출퇴근 의미론, #3 정정).
  //    동네 내부 경로는 순차(동시 호출 부하 완화).
  const settled = await mapWithConcurrency(
    prefiltered,
    ODSAY_CONCURRENCY,
    async ({ n }): Promise<CandidateArea | null> => {
      const depTime = filters.commuteSchedule?.departureTime;
      // ODsay 실패 → 후보 drop 대신 haversine 추정(빈 결과 방지, Vercel 무료 대응).
      const commuteA =
        (await fetchCommute(n.coordinate, coordinateA)) ??
        estimateTransit(n.coordinate, coordinateA, depTime);

      let commuteB: CommuteInfo | null = null;
      if (coordinateB) {
        commuteB =
          (await fetchCommute(n.coordinate, coordinateB)) ??
          estimateTransit(n.coordinate, coordinateB, depTime);
      }

      // single 모드 여가거점 (선택) — 동네 → 여가거점 (실패 시 추정).
      let leisureA: CommuteInfo | null = null;
      if (leisureCoordA)
        leisureA =
          (await fetchCommute(n.coordinate, leisureCoordA)) ??
          estimateTransit(n.coordinate, leisureCoordA, depTime);
      let leisureB: CommuteInfo | null = null;
      if (leisureCoordB)
        leisureB =
          (await fetchCommute(n.coordinate, leisureCoordB)) ??
          estimateTransit(n.coordinate, leisureCoordB, depTime);

      // 필터 — 통근 상한
      if (filters.maxCommuteTime) {
        const maxCommute = Math.max(commuteA.time, commuteB?.time ?? 0);
        if (maxCommute > filters.maxCommuteTime) return null;
      }
      // 필터 — 예산 범위
      if (filters.budget) {
        if (filters.budget.dealType === "wolse") {
          // 월세 — 보증금(상한) + 월세(범위) 2축. 실거래 median 기준. 결측이면 제외(임의 통과 금지).
          const w = wolseMedian(n.id);
          if (!w) return null;
          const depositOk = w.deposit <= (filters.budget.depositMax ?? Infinity);
          const monthlyOk =
            w.monthly >= filters.budget.min && w.monthly <= filters.budget.max;
          if (!depositOk || !monthlyOk) return null;
        } else {
          // 전세/매매 — 실거래 median. 미지정=전세. median 결측이면 제외(임의 통과 금지).
          const price = comparableMedian(n.id, filters.budget.dealType);
          if (price == null) return null;
          if (price < filters.budget.min || price > filters.budget.max) {
            return null;
          }
        }
      }

      // ★ W2B 자차(카카오) — 필터 통과한 후보의 직장 경로만. best-effort 병렬.
      //   대중교통이 주(필수)이므로 여기서 실패해도 후보·점수 불변.
      const [commuteACar, commuteBCar] = await Promise.all([
        fetchCarCommute(n.coordinate, coordinateA),
        coordinateB
          ? fetchCarCommute(n.coordinate, coordinateB)
          : Promise.resolve(null),
      ]);

      const score = scoreCandidate({
        neighborhood: n,
        commuteA: commuteA.time,
        commuteB: commuteB?.time ?? null,
        leisureA: leisureA?.time ?? null,
        leisureB: leisureB?.time ?? null,
        priority: filters.priorities?.[0],
      });

      return {
        id: n.id,
        dong: n.dong,
        gu: n.gu,
        coordinate: n.coordinate,
        commuteA,
        commuteB: commuteB ?? undefined,
        commuteACar: commuteACar ?? undefined,
        commuteBCar: commuteBCar ?? undefined,
        leisureA: leisureA ?? undefined,
        leisureB: leisureB ?? undefined,
        score,
        safetyGrade: mode === "single" ? n.safetyGrade : undefined,
        // priceRange = 거래유형 median ±15%(만원). 실거래 median 기준(분위수 미보유 → 밴드 유지). 결측 시 undefined.
        priceRange: priceRangeFor(n.id, filters.budget?.dealType),
        // 월세 — dealType=wolse 시만 채움. 실거래 median, 결측 시 undefined.
        wolseEstimate:
          filters.budget?.dealType === "wolse"
            ? (wolseMedian(n.id) ?? undefined)
            : undefined,
        facilities: n.facilities,
        lines: n.lines,
        listingsCount: n.listingsCount,
        avgArea: n.avgArea,
      };
    },
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
