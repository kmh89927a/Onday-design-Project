import type { SafetyGrade } from "@/lib/types";

// 야간 안전 "표시값" 매핑 — 등급(A~D) → 화면용 수치/문구 (grade-key 보존, D-2 합의).
//   ★ 등급 소스는 #57 getSafetyByGu(safety-index.json 종합지수)로 이관됨.
//   본 함수들은 그 등급을 받아 표시값으로 변환하는 역할만 담당 (single-result-view 에서 연결).
//   범죄율·bar% 수치는 single.html 시각 truth 기준 deterministic (실 건수 표기는 #59 UI에서 확장 가능).
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
