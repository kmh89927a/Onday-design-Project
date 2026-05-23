// ──────────────────────────────────────────────
// CMD-DIAG-002 후보 동네 풀 생성 — lib/data/metro-dong.json 정적 데이터 + 반경 필터링 (환경 중립).
//
// ★ Mismatch ② 자동 보정 = CandidatePoolEntry.coord = Coordinate 재사용 (★ 결정론 가드 § 진화 (MOCK-005 §) 2번째 후행 실전, ★ CMD-DIAG-001 정수 답습).
// ★ KakaoCoord ↔ Coordinate 변환은 intersection.ts 의 transportClient 호출 직전만 (★ 책임 분리).
// ──────────────────────────────────────────────

import type { Coordinate } from "@/lib/types";
import metroDong from "@/lib/data/metro-dong.json";

/** 후보 동네 entry — ★ coord: Coordinate 재사용 (★ Mismatch ② 자동 보정) */
export interface CandidatePoolEntry {
  name: string;
  coord: Coordinate;
  region1?: string;
  dongCode?: string;
}

/** ★ 두 좌표 사이 거리 (km) — Haversine 공식 (★ 인라인 헬퍼, 외부 도구 없음) */
function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371; // Earth radius km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * 두 좌표의 중간 영역에서 통근 가능 반경 내 후보 동네 추출.
 * MVP 샘플 30~50곳 (수도권 핵심) — 실 200곳은 follow-up REFACTOR-L7.
 */
export function generateCandidatePool(
  coordA: Coordinate,
  coordB: Coordinate,
  radiusKm: number = 15,
): CandidatePoolEntry[] {
  const midpoint: Coordinate = {
    lat: (coordA.lat + coordB.lat) / 2,
    lng: (coordA.lng + coordB.lng) / 2,
  };
  return (metroDong as CandidatePoolEntry[]).filter(
    (entry) => haversineKm(midpoint, entry.coord) <= radiusKm,
  );
}
