import type { SafetyGrade } from "@/lib/types";

// wiki/concepts/single-mode.md 야간 안전 등급 (정적 JSON 미수집 → grade 기반 deterministic)
// single.html 시각 truth와 동일 값
const NIGHT_CRIME_RATE: Record<SafetyGrade, number> = {
  A: 0.84,
  B: 1.32,
  C: 2.18,
  D: 3.04,
};

// SafetyBar percent (0~100) — single.html 정확 매핑
const CRIME_BAR_PERCENT: Record<SafetyGrade, number> = {
  A: 21,
  B: 33,
  C: 54.5,
  D: 76,
};

const NIGHT_GRADE_LABELS: Record<SafetyGrade, string> = {
  A: "야간 매우 안전",
  B: "야간 안전",
  C: "야간 주의",
  D: "야간 위험",
};

export function getNightCrimeRate(grade: SafetyGrade): number {
  return NIGHT_CRIME_RATE[grade];
}

export function getCrimePercent(grade: SafetyGrade): number {
  return CRIME_BAR_PERCENT[grade];
}

export function getNightGradeLabel(grade: SafetyGrade): string {
  return NIGHT_GRADE_LABELS[grade];
}

// "반경 1km · 인접 N개 동 기준" — facilities 기반 deterministic
export function getRadiusSub(facilities?: {
  convenience: number;
  cafes: number;
}): string {
  const adjacent = facilities
    ? ((facilities.convenience + facilities.cafes) % 5) + 3
    : 4;
  return `반경 1km · 인접 ${adjacent}개 동 기준`;
}
