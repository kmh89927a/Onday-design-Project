import schoolsData from "@/lib/data/schools-index.json";

// 학군 PR1 — 각 neighborhood 최근접 초등학교 1곳 (build-schools-index.ts 사전계산).
//   ★ "배정"이 아니라 "인근" (학구도 폴리곤 미보유 — 정확한 배정은 외부 아웃링크에서, PR2).
//   safety-index/community-index 와 동일 패턴: 정적 JSON + getXxx 룩업.

export interface NearestSchool {
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  _source: string;
  updatedAt: string;
}

const BY_NEIGHBORHOOD = (
  schoolsData as { byNeighborhood: Record<string, NearestSchool> }
).byNeighborhood;

// neighborhood id → 최근접 초등학교. 미매핑 시 null (등급 날조 금지 원칙과 동일 — 없으면 없다고).
export function getNearestSchool(neighborhoodId: string): NearestSchool | null {
  return BY_NEIGHBORHOOD[neighborhoodId] ?? null;
}
