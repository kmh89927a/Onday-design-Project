import type { SafetyGrade } from "@/lib/types";

import { getCommunityByGu } from "./community-index";

// ScoringEngine (#27 CMD-DIAG-003) — mock-calculator 에서 추출한 순수 점수 로직.
// client(실 ODsay 오케스트레이션) + server(mock-calculator) 양쪽이 동일 점수식을 재사용.
// ★ 점수 기준 = 대중교통(transit) 통근시간 (R2 결정). 입력 commute* 는 "분".

/** 점수 계산에 필요한 동네 속성만 (MOCK_NEIGHBORHOODS 항목이 구조적으로 할당 가능). */
export interface ScoringNeighborhood {
  gu: string; // #조용한동네 가중 — getCommunityByGu(gu) 조회
  safetyGrade: SafetyGrade;
  facilities: { convenience: number; cafes: number; schools?: number };
}

export interface ScoreInput {
  neighborhood: ScoringNeighborhood;
  commuteA: number;
  commuteB: number | null;
  leisureA: number | null;
  leisureB: number | null;
  // 선호 태그 1개(⑥) — "safety"(#안심귀가)/"convenience"(#슬세권)/"hotplace"(#핫플)/"quiet"(#조용한동네).
  priority?: string;
}

// 선호 태그 가중 — 해당 지표를 한 번 더 가산(±10). 취향 맞는 동네를 상위로.
//   ★ 실데이터 정규화 — 편의점/카페는 소상공인 상가정보(반경 1km 실집계).
//   실분포: 편의점 2~165(중앙63) / 카페 10~663(중앙150). 이 분포를 0~10 으로 매핑.
//   (구 mock 12~35 / 9~65 기준 상수는 실데이터선 전부 saturate → 재튜닝.)
function priorityBonus(
  priority: string | undefined,
  n: ScoringNeighborhood,
): number {
  switch (priority) {
    case "safety": {
      const b: Record<string, number> = { A: 10, B: 5, C: 0, D: -10 };
      return b[n.safetyGrade] ?? 0;
    }
    case "convenience":
      return Math.min(10, Math.max(0, (n.facilities.convenience - 15) / 10));
    case "hotplace":
      return Math.min(10, Math.max(0, (n.facilities.cafes - 30) / 24));
    case "quiet": {
      // B 정책 #조용한동네 — 공원+도서관 실데이터(getCommunityByGu) 기반 가산.
      //   미수집(no_data) 시 0 = 가중 안 함(정직, 날조 X).
      //   실 분포(구 단위 38~631, avg 155) → 40~290 을 0~10 으로 정규화(변별력 확보).
      const com = getCommunityByGu(n.gu);
      if (com.status !== "ok") return 0;
      return Math.min(10, Math.max(0, (com.total - 40) / 25));
    }
    default:
      return 0;
  }
}

// 여가거점 가산 (Figma 비전 — single 모드, 0~5점/거점)
function leisureBonus(minutes: number | null): number {
  if (minutes == null) return 0;
  // 0분 → +5, 30분 → 0, 그 이상 → 0
  return Math.max(0, 5 - minutes / 6);
}

export function scoreCandidate({
  neighborhood,
  commuteA,
  commuteB,
  leisureA,
  leisureB,
  priority,
}: ScoreInput): number {
  let score = 100;

  // 통근 패널티 (가장 큰 요인)
  const avgCommute = commuteB != null ? (commuteA + commuteB) / 2 : commuteA;
  score -= Math.min(40, avgCommute * 0.8);

  // 안전등급 가산
  const safetyBonus: Record<string, number> = { A: 10, B: 5, C: 0, D: -10 };
  score += safetyBonus[neighborhood.safetyGrade] ?? 0;

  // 편의시설 가산 — 실데이터(편의점+카페 반경1km). 합 분포 ~12~828(중앙 213) → /40 으로 0~10.
  //   (구 /10 은 mock(합~70) 기준 — 실데이터선 전부 10 saturate → /40 재튜닝.)
  const facilityScore =
    (neighborhood.facilities.convenience + neighborhood.facilities.cafes) / 40;
  score += Math.min(10, facilityScore);

  // 여가거점 가산 (single 모드 — Figma 비전)
  score += leisureBonus(leisureA) + leisureBonus(leisureB);

  // 선호 태그 가중 (⑥) — 취향 지표 한 번 더 가산.
  score += priorityBonus(priority, neighborhood);

  return Math.max(0, Math.min(100, Math.round(score)));
}
