export type AuthProvider = "kakao" | "naver";
export type DiagnosisMode = "couple" | "single";
export type DiagnosisStatus = "processing" | "completed" | "expired";
export type SafetyGrade = "A" | "B" | "C" | "D";
export type CommuteMode = "transit" | "driving";
// 거래유형 — budget 범위가 어떤 시세를 가리키는지.
//   jeonse/maemae=단일 금액(min/max), wolse=월세(min/max) + 보증금(depositMin/Max) 2축.
export type DealType = "jeonse" | "maemae" | "wolse";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CommuteInfo {
  time: number; // minutes
  mode: CommuteMode;
  transfers?: number;
  // A-2 (#졸업 지도) — 실 이동 경로 좌표열. 자동차=Kakao 도로 vertexes.
  //   없으면(mock·실패·transit) 화면에서 직선 추정으로 fallback.
  routePath?: Coordinate[];
}

export interface CandidateArea {
  id: string;
  dong: string;
  gu: string;
  coordinate: Coordinate;
  commuteA: CommuteInfo; // 대중교통(ODsay) — 주 지표·점수 기준 (mock=Haversine 추정)
  commuteB?: CommuteInfo; // nullable for single mode
  // ★ W2B 자차(카카오) — 직장 경로 보조(mode='driving', 옵셔널 best-effort).
  //   대중교통이 주, 자차는 DetailSheet 표시 보조. 실패/mock 시 undefined → 차량 행 생략.
  commuteACar?: CommuteInfo;
  commuteBCar?: CommuteInfo;
  // single 모드 여가거점까지의 통근 정보 (Figma 비전) — 자차 미적용(REQ-FUNC-004 밖)
  leisureA?: CommuteInfo;
  leisureB?: CommuteInfo;
  score: number; // 0-100
  safetyGrade?: SafetyGrade;
  priceRange?: { min: number; max: number }; // KRW in 만원 (전세/매매 표시·정렬용)
  // 월세 실거래 median(만원) — dealType=wolse 시 채움(price-index). 표시는 보증금/월.
  wolseEstimate?: { deposit: number; monthly: number };
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
  // 거래유형 — ★ budget 과 독립(예산 미입력해도 유실 안 됨). 미지정 = 전세. 표시·median 선택의 단일 소스.
  dealType?: DealType;
  // 예산(금액)만. 거래유형 정보는 위 filters.dealType 단일 소스. 단위 = 만원.
  //   jeonse/maemae: min/max = 금액 범위 / wolse: min/max = 월세 범위, depositMin/Max = 보증금 범위.
  budget?: {
    min: number;
    max: number;
    depositMin?: number;
    depositMax?: number;
  };
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
  avgPrice: number; // 만원 (구 전세 추정 보증금 — 시세는 price-index 실거래 median 으로 교체됨. 자동완성 등 일부 잔존)
  safetyGrade: SafetyGrade;
  facilities: { convenience: number; cafes: number; schools: number };
  lines?: string; // 지하철/버스 노선 요약 — step-10.5에서 보강
  listingsCount?: number; // 매물 건수 — step-10.5에서 보강
  avgArea?: number; // 평균 평수 — step-10.5에서 보강
}
