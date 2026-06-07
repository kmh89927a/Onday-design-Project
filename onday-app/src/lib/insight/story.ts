import { z } from "zod";
import type { SafetyGrade } from "@/lib/types";
import type { DayCommuteSlot, DayPreviewData } from "./extract-day-data";

// 동네 하루 미리보기 (Phase 3) — DayPreviewData → Gemini 시간대별 스토리(morning/evening/night).
// ★ 거짓 방지: 사실 데이터의 값만, 없는 시간대는 null, 등급 미화·근거 없는 평가어 금지.

// 시간대 조각 — text + keywords(text 안에 그대로 등장하는 핵심 부분문자열, UI 강조용).
export const storySlotSchema = z.object({
  text: z.string(),
  keywords: z.array(z.string()),
});

// 출력 — morning(출근)/evening(여가)/night(야간). evening 은 여가 데이터 없으면 null.
export const storySchema = z.object({
  morning: storySlotSchema,
  evening: storySlotSchema.nullable(),
  night: storySlotSchema,
});

export type StorySlot = z.infer<typeof storySlotSchema>;
export type DayStory = z.infer<typeof storySchema>;

// 야간 등급 사실 라벨 — 미화 금지(C·D 를 "안전한"으로 포장 방지). 프롬프트에 그대로 제공.
const GRADE_LABEL: Record<SafetyGrade, string> = {
  A: "안심",
  B: "양호",
  C: "보통",
  D: "주의",
};

function describeSlot(s: DayCommuteSlot): string {
  const parts = [`${s.time}분`];
  if (s.transfers != null) {
    parts.push(s.transfers === 0 ? "환승 없음" : `환승 ${s.transfers}회`);
  }
  if (s.departureStation) parts.push(`${s.departureStation}에서 출발`);
  return parts.join(", ");
}

/** DayPreviewData → 시스템 프롬프트 + 사실 데이터. 없는 필드는 줄 자체를 빼거나 "데이터 없음". */
export function buildStoryPrompt(data: DayPreviewData): string {
  const facts: string[] = [];
  facts.push(`- 출근(아침): ${describeSlot(data.morning.a)}`);
  if (data.morning.b) facts.push(`- 출근(배우자): ${describeSlot(data.morning.b)}`);
  facts.push(
    data.leisure
      ? `- 여가(저녁): 여가거점까지 ${describeSlot(data.leisure)}`
      : `- 여가(저녁): 데이터 없음`,
  );
  const n = data.night;
  const nightParts: string[] = [];
  if (n.grade) nightParts.push(`야간 치안 등급 ${n.grade}(${GRADE_LABEL[n.grade]})`);
  if (n.convenience != null) nightParts.push(`편의점 ${n.convenience}곳`);
  if (n.cafes != null) nightParts.push(`카페 ${n.cafes}곳`);
  facts.push(`- 야간: ${nightParts.length ? nightParts.join(", ") : "데이터 없음"}`);

  return [
    `너는 1인 가구의 이사를 돕는 다정하고 전문적인 동네 큐레이터야. 반드시 제공된 [사용자 데이터]에 있는 수치와 정보만 사용하여, "${data.gu} ${data.dong}"의 하루 일과를 따뜻한 묘사체로 작성해.`,
    ``,
    `[사용자 데이터]`,
    ...facts,
    ``,
    `[엄격한 규칙]`,
    `1. 각 시간대(morning/evening/night)별 2~3문장.`,
    `2. 데이터에 없는 내용(특정 역 이름, 가상 편의시설, 없는 수치)은 절대 지어내거나 추측하지 마. 출발역이 데이터에 없으면 역 이름을 언급하지 마.`,
    `3. 평가 형용사("쾌적한", "편리한", "안전한" 등)는 데이터가 뒷받침할 때만 써. 통근이 길면 "쾌적" 금지, 야간 등급이 낮으면(C·D) "안전/안심" 금지. 수치는 그대로, 평가는 사실에 부합하게.`,
    `4. 데이터 없는 시간대는 해당 키를 null 로 둬(여가가 "데이터 없음"이면 evening 은 반드시 null — 여가 문장 창작 금지).`,
    `5. 야간 등급은 사실대로: A=안심, B=양호, C=보통, D=주의.`,
    `6. 강조할 핵심 데이터(수치·등급·역 이름)는 keywords 배열에 담되, text 안에 그대로 등장하는 부분문자열만 넣어(text 에 없는 단어 금지).`,
    ``,
    `[톤] 따뜻한 묘사체("~해요/~예요"), 장면이 그려지게.`,
  ].join("\n");
}

// keywords 후처리 — text 에 실제 포함된 부분문자열만 유지(UI 부분문자열 매칭 보장).
//   stripStations: 출발역 데이터가 없을 때 "○○역" 형태 keyword 제거(역 이름 창작 차단, 가능 범위).
function filterKeywords(slot: StorySlot, stripStations: boolean): StorySlot {
  let kept = slot.keywords.filter((k) => k.length > 0 && slot.text.includes(k));
  if (stripStations) kept = kept.filter((k) => !/역$/.test(k.trim()));
  return { text: slot.text, keywords: kept };
}

/**
 * 거짓 방지 강제 + keywords 검증.
 * ★ 여가 데이터가 없으면 모델 출력과 무관하게 evening 을 강제 null(여가 창작 차단).
 * ★ 출발역 데이터 없는 시간대는 "○○역" keyword 제거(역 이름 창작 차단, 가능 범위).
 */
export function sanitizeStory(story: DayStory, data: DayPreviewData): DayStory {
  const morningHasStation = !!(
    data.morning.a.departureStation || data.morning.b?.departureStation
  );
  const eveningHasStation = !!data.leisure?.departureStation;
  return {
    morning: filterKeywords(story.morning, !morningHasStation),
    evening:
      data.leisure && story.evening
        ? filterKeywords(story.evening, !eveningHasStation)
        : null,
    night: filterKeywords(story.night, true), // 야간엔 출발역 개념 없음 → 역 keyword 항상 차단.
  };
}

/** 거짓 방지(로깅 전용) — 야간 C/D 인데 text 에 "안전/안심" 미화 흔적이면 경고 반환(차단은 프롬프트가 담당). */
export function auditGradeMismatch(
  story: DayStory,
  data: DayPreviewData,
): string | null {
  const g = data.night.grade;
  if ((g === "C" || g === "D") && /안전|안심/.test(story.night.text)) {
    return `야간 등급 ${g} 인데 text 에 미화 표현 포함: "${story.night.text}"`;
  }
  return null;
}
