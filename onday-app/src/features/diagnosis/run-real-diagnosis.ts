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
import { wolseMedian, priceRangeFor } from "@/lib/diagnosis/price-index";
// 시세 5-1 — 예산/통근 필터를 공용 술어로(토글 재필터와 동일 의미론).
import { passesFilters } from "@/lib/diagnosis/refilter";
import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";
import { KakaoCarClient } from "@/lib/external/kakao-car";
import { OdsayTransitClient } from "@/lib/external/odsay-transit";

// ★ W2B 자차 — 카카오 모빌리티 브라우저 직접 (NEXT_PUBLIC, 도메인 제한). ODsay 와 병렬.
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ?? "";
const kakaoCar = KAKAO_KEY ? new KakaoCarClient({ apiKey: KAKAO_KEY }) : null;

// ★ 대중교통 — ODsay 브라우저 직접 (NEXT_PUBLIC Web 키, 도메인 인증). 자차(Kakao)와 동일 패턴.
//   서버 프록시(/api/commute, Server 키) 폐지: Vercel 고정 IP 화이트리스트 막힘 회피.
//   ODsay 는 CORS 허용(Access-Control-Allow-Origin: *) → 브라우저 직접 호출 정상.
const ODSAY_KEY = process.env.NEXT_PUBLIC_ODSAY_API_KEY ?? "";
const odsayTransit = ODSAY_KEY
  ? new OdsayTransitClient({ apiKey: ODSAY_KEY })
  : null;

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
//   2) ODsay(대중교통)·Kakao(자차) 둘 다 브라우저 직접 Promise.all (Vercel 함수/10초 무관)
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

/** ODsay 대중교통 1회 — best-effort. 실패/타임아웃/CORS/키없음 → null (호출부 Haversine 추정 fallback). */
async function fetchCommute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<CommuteInfo | null> {
  if (!odsayTransit) return null;
  try {
    return await odsayTransit.getTransitCommute(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
    );
  } catch {
    return null;
  }
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
  // 거래유형 — filters.dealType 단일 소스(budget 과 독립). 미지정=전세.
  const dealType = filters.dealType ?? "jeonse";

  // 2) prefilter 12개 풀 빌드 — 통근(transit/자차) 전부 계산, 예산/통근 필터는 적용 안 함(아래 후처리).
  //    ★ 5-1: 이 12개 풀을 클라가 캐시 → 거래유형/예산 토글 시 재필터(통근 열화·API 재호출 0).
  const pool = await mapWithConcurrency(
    prefiltered,
    ODSAY_CONCURRENCY,
    async ({ n }): Promise<CandidateArea> => {
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

      // ★ W2B 자차(카카오) — (가) 12개 전부 계산(토글 캐시 완비, 예산 통과분만→전부로 확장).
      //   best-effort: 실패/키없음 → undefined(차량 행만 생략, 후보·점수 무영향).
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
        // priceRange = 거래유형 median ±15%(만원). filters.dealType 기준(예산 미입력해도 거래유형 반영). 결측 시 undefined.
        priceRange: priceRangeFor(n.id, dealType),
        // 월세 — dealType=wolse 시만 채움. 실거래 median, 결측 시 undefined.
        wolseEstimate:
          dealType === "wolse" ? (wolseMedian(n.id) ?? undefined) : undefined,
        facilities: n.facilities,
        lines: n.lines,
        listingsCount: n.listingsCount,
        avgArea: n.avgArea,
      };
    },
  );

  // 3) 예산/통근 필터 적용 + 점수순 top N → 저장·표시용 후보.
  const candidates = pool
    .filter((c) => passesFilters(c, filters))
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_TOP_N);

  // 4) 저장 — production 분기는 클라가 계산한 candidates 를 받아 저장만 (B2). 저장은 8개만.
  const res = await fetch("/api/diagnosis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, candidates }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "진단 저장에 실패했습니다");
  }
  // ★ 5-1: pool(12개, 통근 캐시)을 함께 반환 → 클라가 거래유형/예산 토글 재필터에 재활용.
  const saved = await res.json();
  return { ...saved, pool };
}
