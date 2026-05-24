export type AuthProvider = "kakao" | "naver";
export type DiagnosisMode = "couple" | "single";
export type DiagnosisStatus = "processing" | "completed" | "expired";
export type SafetyGrade = "A" | "B" | "C" | "D";
export type CommuteMode = "transit" | "driving";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CommuteInfo {
  time: number; // minutes
  mode: CommuteMode;
  transfers?: number;
}

export interface CandidateArea {
  id: string;
  dong: string;
  gu: string;
  coordinate: Coordinate;
  commuteA: CommuteInfo;
  commuteB?: CommuteInfo; // nullable for single mode
  // single 모드 여가거점까지의 통근 정보 (Figma 비전)
  leisureA?: CommuteInfo;
  leisureB?: CommuteInfo;
  score: number; // 0-100
  safetyGrade?: SafetyGrade;
  priceRange?: { min: number; max: number }; // KRW in 만원
  facilities?: { convenience: number; cafes: number; schools?: number };
  lines?: string; // 지하철/버스 노선 요약 — step-10.5에서 22개 보강
  listingsCount?: number; // 매물 건수 — step-10.5에서 보강
  avgArea?: number; // 평균 평수 — step-10.5에서 보강
}

// ★ DTO-COMMUTE-TIME (#98) — commuteSchedule (요일 + 시간 자유) DTO 정수 정정 (★ Mismatch ㊱).
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface CommuteSchedule {
  days: DayOfWeek[];     // ★ 1~7 요일 다중 선택 (chip)
  departureTime: string; // ★ "HH:MM" 24시간 형식
}

export interface DiagnosisFilters {
  maxCommuteTime?: number; // minutes
  budget?: { min: number; max: number }; // 만원
  commuteSchedule?: CommuteSchedule; // 요일 + 시간 자유 — Issue #98 commuteSchedule DTO 정수 정정 (★ REFACTOR-COMMUTE-LEGACY #102 timeRange 제거 완성).
  priorities?: string[];
}

export interface DiagnosisInput {
  addressA: string;
  addressB?: string; // nullable for single mode
  coordinateA: Coordinate;
  coordinateB?: Coordinate;
  // single 모드 여가거점 (Figma 비전 — 직장 + 여가 1·2)
  leisureA?: string;
  leisureCoordA?: Coordinate;
  leisureB?: string;
  leisureCoordB?: Coordinate;
  filters: DiagnosisFilters;
  mode: DiagnosisMode;
  deadlineDate?: string; // ISO date string
}

export interface DiagnosisResult {
  id: string;
  userId: string;
  addressA: string;
  addressB?: string;
  candidates: CandidateArea[];
  filters: DiagnosisFilters;
  mode: DiagnosisMode;
  deadlineMode: boolean;
  deadline?: string;
  status: DiagnosisStatus;
  createdAt: string;
}

export interface ShareLinkData {
  id: string;
  diagnosisId: string;
  uniqueUrl: string;
  hasPassword: boolean;
  viewCount: number;
  freePreviewUsed: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface MockUser {
  id: string;
  email: string;
  authProvider: AuthProvider;
  mode: DiagnosisMode;
}

export interface Neighborhood {
  id: string;
  dong: string;
  gu: string;
  coordinate: Coordinate;
  avgPrice: number; // 만원
  safetyGrade: SafetyGrade;
  facilities: { convenience: number; cafes: number; schools: number };
  lines?: string; // 지하철/버스 노선 요약 — step-10.5에서 보강
  listingsCount?: number; // 매물 건수 — step-10.5에서 보강
  avgArea?: number; // 평균 평수 — step-10.5에서 보강
}
