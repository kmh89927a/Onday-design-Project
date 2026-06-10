import { z } from "zod";
import type { SafetyGrade } from "@/lib/types";
import type { SummaryFacts } from "./extract-summary";

// 30분 요약 (Phase 1) — SummaryFacts → Gemini "이 동네 추천 이유" 한 줄. story.ts 답습.
// ★ 거짓 방지(하루 미리보기 원칙 그대로): 주어진 데이터(통근·점수·등급·시세)만,
//   미화·창작 금지. 안전등급 낮으면(C·D) "안전/안심" 금지. 데이터 없는 항목 언급 금지.

/** 추천 이유 출력 — 단일 텍스트(따뜻+간결). */
export const rationaleSchema = z.object({
  rationale: z.string(),
});

export type RationaleObject = z.infer<typeof rationaleSchema>;

// 야간 등급 사실 라벨 — 미화 금지(story.ts 와 동일 기준).
const GRADE_LABEL: Record<SafetyGrade, string> = {
  A: "안심",
  B: "양호",
  C: "보통",
  D: "주의",
};

function commuteLine(label: string, c: { time: number; mode: string }): string {
  const mode = c.mode === "driving" ? "자차" : "대중교통";
  return `- ${label}: ${mode} ${c.time}분`;
}

/** SummaryFacts → 시스템 프롬프트 + 사실 데이터. 없는 항목은 줄 자체를 뺀다(거짓 방지). */
export function buildRationalePrompt(facts: SummaryFacts): string {
  const lines: string[] = [];
  lines.push(commuteLine("직장 A 통근", facts.commuteA));
  if (facts.commuteB) lines.push(commuteLine("직장 B 통근", facts.commuteB));
  lines.push(`- 생활 적합도 점수: ${facts.livingScore}점 (100점 만점)`);
  lines.push(`- 예상 시세: ${facts.priceLabel}`);
  if (facts.safetyGrade) {
    lines.push(
      `- 야간 안전 등급: ${facts.safetyGrade}(${GRADE_LABEL[facts.safetyGrade]})`,
    );
  }
  if (facts.convenience != null) lines.push(`- 편의점: ${facts.convenience}곳`);
  if (facts.cafes != null) lines.push(`- 카페: ${facts.cafes}곳`);

  return [
    `너는 이사를 돕는 다정하고 전문적인 동네 큐레이터야. 반드시 제공된 [동네 데이터]에 있는 수치와 정보만 사용하여, "${facts.gu} ${facts.dong}"을(를) 왜 추천하는지 한 문장(최대 2문장)으로 따뜻하게 설명해.`,
    ``,
    `[동네 데이터]`,
    ...lines,
    ``,
    `[엄격한 규칙]`,
    `1. 1~2문장, 60자 내외로 간결하게.`,
    `2. 데이터에 없는 내용(특정 역 이름, 가상 시설, 없는 수치)은 절대 지어내거나 추측하지 마.`,
    `3. 평가 형용사("쾌적한", "편리한", "안전한" 등)는 데이터가 뒷받침할 때만 써. 통근이 길면 "쾌적" 금지, 야간 등급이 낮으면(C·D) "안전/안심" 금지. 수치는 그대로, 평가는 사실에 부합하게.`,
    `4. 야간 등급은 사실대로: A=안심, B=양호, C=보통, D=주의.`,
    `5. 추천 이유는 가장 강한 강점(짧은 통근·높은 점수 등)을 중심으로.`,
    ``,
    `[톤] 따뜻한 권유체("~예요/~해요"), 군더더기 없이.`,
  ].join("\n");
}

/**
 * 거짓 방지 + 빈 값 방지. 공백 정리 후 비어 있으면 throw(호출처가 fallback 으로 대체).
 * ★ 안전등급 낮은데(C·D) "안전/안심" 미화 흔적이면 throw — fallback(중립 룰)으로 대체.
 */
export function sanitizeRationale(raw: string, facts: SummaryFacts): string {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("EMPTY_RATIONALE");
  const g = facts.safetyGrade;
  if ((g === "C" || g === "D") && /안전|안심/.test(text)) {
    throw new Error("GRADE_MISMATCH_RATIONALE");
  }
  return text;
}

/**
 * AI 실패 시 룰 기반 추천 이유 한 줄. 결정적(≤500ms, 외부 호출 0) — 빈 카드 방지.
 * 예: "직장A 35분 · 직장B 42분 · 생활점수 78점"
 */
export function generateFallbackRationale(facts: SummaryFacts): string {
  const parts: string[] = [];
  parts.push(`직장A ${facts.commuteA.time}분`);
  if (facts.commuteB) parts.push(`직장B ${facts.commuteB.time}분`);
  parts.push(`생활점수 ${facts.livingScore}점`);
  if (facts.safetyGrade) parts.push(`야간 ${facts.safetyGrade}등급`);
  return parts.join(" · ");
}
