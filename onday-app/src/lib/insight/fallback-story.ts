import type { SafetyGrade } from "@/lib/types";
import type { DayCommuteSlot, DayPreviewData } from "./extract-day-data";
import type { DayStory, StorySlot } from "./story";

// 동네 하루 미리보기 — AI(Gemini) 실패·과부하 시 로컬 폴백 스토리.
// ★ 외부 호출 0(Gemini 무관) → "언제 봐도 작동". ★ DayPreviewData 에 실제 있는 값만 사실 묘사 —
//   없는 정보(역 이름·미입력 여가·등급 등)는 줄 자체를 빼고 창작 0. AI story 와 동일 UI(DayStory).
//   ★ 등급은 사실 라벨만(미화 금지). keywords ⊆ text(하이라이트 동일 동작).

const GRADE_LABEL: Record<SafetyGrade, string> = { A: "안심", B: "양호", C: "보통", D: "주의" };

// 통근 표현 — 있는 값만(시간 필수, 환승·출발역 선택).
function commutePhrase(s: DayCommuteSlot): string {
  const parts = [`약 ${s.time}분`];
  if (s.transfers != null) parts.push(s.transfers === 0 ? "환승 없이" : `환승 ${s.transfers}회로`);
  if (s.departureStation) parts.push(`${s.departureStation}에서`);
  return parts.join(" ");
}

function uniqInText(keywords: string[], text: string): string[] {
  return [...new Set(keywords)].filter((k) => k.length > 0 && text.includes(k));
}

function morningSlot(data: DayPreviewData): StorySlot {
  const { dong, morning } = data;
  let text = `${dong}에서 아침 출근은 ${commutePhrase(morning.a)} 닿는 거리예요.`;
  const kw = [dong, `${morning.a.time}분`];
  if (morning.b) {
    text += ` 배우자는 ${commutePhrase(morning.b)} 출근할 수 있어요.`;
    kw.push(`${morning.b.time}분`);
  }
  return { text, keywords: uniqInText(kw, text) };
}

// 여가 데이터(싱글 여가거점) 없으면 null — 부부·미입력은 저녁 슬롯 생략(거짓값 금지).
function eveningSlot(data: DayPreviewData): StorySlot | null {
  const { dong, leisure } = data;
  if (!leisure) return null;
  const text = `퇴근 후엔 자주 가는 곳까지 ${commutePhrase(leisure)} 이동해 ${dong}에서의 저녁을 보낼 수 있어요.`;
  return { text, keywords: uniqInText([dong, `${leisure.time}분`], text) };
}

function nightSlot(data: DayPreviewData): StorySlot {
  const { dong, night } = data;
  const kw = [dong];
  const bits: string[] = [];
  if (night.grade) {
    bits.push(`야간 치안은 ${GRADE_LABEL[night.grade]} 수준`);
    kw.push(GRADE_LABEL[night.grade]);
  }
  if (night.convenience != null) bits.push("편의점이 가까이 분포해 있어요");
  if (night.cafes != null) bits.push("주변에 카페도 자리해 있어요");
  const text = bits.length ? `${dong}의 밤은 ${bits.join(", ")}.` : `${dong}에서의 밤 시간대예요.`;
  return { text, keywords: uniqInText(kw, text) };
}

/** DayPreviewData → 로컬 템플릿 DayStory. AI 실패 시 graceful 대체(외부 호출 0, 실데이터만). */
export function buildFallbackStory(data: DayPreviewData): DayStory {
  return {
    morning: morningSlot(data),
    evening: eveningSlot(data),
    night: nightSlot(data),
  };
}
