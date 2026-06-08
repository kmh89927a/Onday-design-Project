import type {
  CandidateArea,
  CommuteInfo,
  DiagnosisMode,
  SafetyGrade,
} from "@/lib/types";
import { getSafetyByGu } from "@/features/single/safety-index";

// 동네 하루 미리보기 (Phase 2) — CandidateArea 에서 3시간대(출근/여가/야간) 스토리 재료 추출.
// ★ 외부 API 없음, 기존 데이터 구조화만. 없는 필드는 null/생략 — 거짓값 금지(채우지 않음).
//   프롬프트(Phase 3)·UI(Phase 4)는 본 구조만 소비. 통근/캐싱/점수 로직과 무관.
//   ★ 야간 등급은 종합 야간안전 지수(getSafetyByGu) 단일 소스 — 화면(resolveGrade)과 동일.
//     낡은 mock 필드 c.safetyGrade 는 읽지 않음(화면과 불일치 방지). no_data 면 생략(거짓값 금지).

/** 한 구간(출근/여가) 통근 재료 — 있는 값만 채움. */
export interface DayCommuteSlot {
  time: number; // 분
  transfers?: number; // 환승 횟수 (있을 때만)
  departureStation?: string; // 첫 탑승역 이름 (ODsay 실데이터 있을 때만)
}

/** 야간 시간대 재료 — 없는 값은 생략. */
export interface DayNight {
  grade?: SafetyGrade; // 야간 치안 등급 A~D (no_data·부재 시 생략)
  convenience?: number; // 편의점 밀집도
  cafes?: number; // 카페 밀집도
}

/** 동네 하루 미리보기 데이터 — 3시간대(출근/여가/야간). */
export interface DayPreviewData {
  dong: string;
  gu: string;
  mode: DiagnosisMode;
  // 출근 🚌 — 본인(a) 필수, 배우자(b)는 부부 모드(commuteB)일 때만.
  morning: { a: DayCommuteSlot; b?: DayCommuteSlot };
  // 여가 🍽️ — 싱글 여가거점(leisureA) 있을 때만. 부부·미입력 = null.
  leisure: DayCommuteSlot | null;
  // 야간 🌙 — 치안 등급 + 편의 밀집도.
  night: DayNight;
}

/** CommuteInfo → DayCommuteSlot (있는 필드만). */
function toSlot(c: CommuteInfo): DayCommuteSlot {
  return {
    time: c.time,
    ...(c.transfers != null ? { transfers: c.transfers } : {}),
    ...(c.departureStation ? { departureStation: c.departureStation } : {}),
  };
}

/**
 * 후보 동네 → 하루 미리보기 데이터. 없는 데이터는 null/생략(거짓값 금지).
 * @param mode 진단 모드(부부/싱글) — 프롬프트 framing 용. 여가 유무는 데이터(leisureA)로 판단.
 */
export function extractDayData(
  c: CandidateArea,
  mode: DiagnosisMode,
): DayPreviewData {
  // 싱글 한정 — 부부 모드는 등급 미포함(기존 동작 보존). 싱글은 종합 지수 ok 일 때만 grade 채움.
  const safety = mode === "single" ? getSafetyByGu(c.gu) : null;
  const night: DayNight = {
    ...(safety && safety.status === "ok" ? { grade: safety.grade } : {}),
    ...(c.facilities?.convenience != null
      ? { convenience: c.facilities.convenience }
      : {}),
    ...(c.facilities?.cafes != null ? { cafes: c.facilities.cafes } : {}),
  };

  return {
    dong: c.dong,
    gu: c.gu,
    mode,
    morning: {
      a: toSlot(c.commuteA),
      ...(c.commuteB ? { b: toSlot(c.commuteB) } : {}),
    },
    leisure: c.leisureA ? toSlot(c.leisureA) : null,
    night,
  };
}
