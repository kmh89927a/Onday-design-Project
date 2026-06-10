import type {
  CandidateArea,
  CommuteInfo,
  CommuteMode,
  DealType,
  DiagnosisMode,
  SafetyGrade,
} from "@/lib/types";
import type { SummaryCardDTO } from "@/lib/types/deadline";
import { getSafetyByGu } from "@/features/single/safety-index";
import { getNearestSchool } from "@/lib/schools-index";
import { buildNaverRealEstateUrl } from "@/lib/deadline/naver-url-builder";
import { formatDealValue } from "@/features/diagnosis/result-utils";

// 30분 요약 (Phase 1) — CandidateArea 에서 요약 카드 재료 추출. extract-day-data.ts 답습.
// ★ 외부 API 없음, 기존 데이터 구조화만. 없는 값은 생략 — 거짓값 금지(채우지 않음).
//   · rationale(AI) 입력 재료 = SummaryFacts (route 로 전송, generateObject 프롬프트 소비).
//   · 카드 결정값(시세·통근·네이버URL·학교) = buildSummaryCardBase (AI 무관, 결정적).
//   ★ 야간 등급은 종합 야간안전 지수(getSafetyByGu) 단일 소스 — 화면과 동일.
//     낡은 mock 필드 c.safetyGrade 는 읽지 않음(stale 금지, #192/#193 교훈). no_data 면 생략.

/** 통근 한 구간 재료 — 시간 + 수단(대중교통/자차). */
export interface SummaryCommute {
  time: number; // 분
  mode: CommuteMode;
}

/** rationale 생성 입력 재료 — 주어진 데이터만(거짓 방지). */
export interface SummaryFacts {
  dong: string;
  gu: string;
  mode: DiagnosisMode;
  commuteA: SummaryCommute; // 직장 A 통근(필수)
  commuteB?: SummaryCommute; // 직장 B 통근(부부 모드일 때만)
  livingScore: number; // 종합 적합도 점수 (0~100)
  priceLabel: string; // 예상 시세 ("전세 7.2억")
  safetyGrade?: SafetyGrade; // 야간안전 등급 — getSafetyByGu ok 일 때만(stale 금지)
  convenience?: number; // 편의점 밀집도
  cafes?: number; // 카페 밀집도
}

function toCommute(c: CommuteInfo): SummaryCommute {
  return { time: c.time, mode: c.mode };
}

/** 통근 표시 문자열 — "대중교통 35분" / "자차 35분". */
export function formatCommuteLabel(c: CommuteInfo): string {
  const label = c.mode === "driving" ? "자차" : "대중교통";
  return `${label} ${c.time}분`;
}

/**
 * 후보 동네 → rationale 입력 재료(SummaryFacts). 없는 값은 생략(거짓값 금지).
 * @param dealType 시세 표시 거래유형(전세/매매/월세) — filters.dealType.
 */
export function extractSummaryFacts(
  c: CandidateArea,
  mode: DiagnosisMode,
  dealType?: DealType,
): SummaryFacts {
  // ★ 안전등급은 종합 야간안전 지수 — ok 일 때만 채움(no_data·비수도권은 생략, 날조 금지).
  const safety = getSafetyByGu(c.gu);
  return {
    dong: c.dong,
    gu: c.gu,
    mode,
    commuteA: toCommute(c.commuteA),
    ...(c.commuteB ? { commuteB: toCommute(c.commuteB) } : {}),
    livingScore: c.score,
    priceLabel: formatDealValue(c, dealType),
    ...(safety.status === "ok" ? { safetyGrade: safety.grade } : {}),
    ...(c.facilities?.convenience != null
      ? { convenience: c.facilities.convenience }
      : {}),
    ...(c.facilities?.cafes != null ? { cafes: c.facilities.cafes } : {}),
  };
}

/**
 * 후보 동네 → 카드 결정값(rationale 제외). AI 무관, 결정적.
 * rationale 은 route(AI) 또는 fallback 에서 채워 SummaryCardDTO 완성.
 */
export function buildSummaryCardBase(
  c: CandidateArea,
  rank: number,
  dealType?: DealType,
): Omit<SummaryCardDTO, "rationale"> {
  const school = getNearestSchool(c.id);
  return {
    candidateId: c.id,
    candidateName: `${c.gu} ${c.dong}`,
    estimatedPrice: formatDealValue(c, dealType),
    commuteToA: formatCommuteLabel(c.commuteA),
    commuteToB: c.commuteB ? formatCommuteLabel(c.commuteB) : "—",
    livingScore: c.score,
    naverSearchUrl: buildNaverRealEstateUrl(c.coordinate, dealType ? { dealType } : {}),
    ...(school ? { schoolDistrict: school.name } : {}),
    rank,
  };
}

/** Top N 선정 — 종합 점수(score) 내림차순. 기본 3. */
export function selectTopCandidates(
  candidates: CandidateArea[],
  n = 3,
): CandidateArea[] {
  return [...candidates].sort((a, b) => b.score - a.score).slice(0, n);
}
