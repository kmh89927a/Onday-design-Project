import { z } from "zod";
import type { SafetyGrade } from "@/lib/types";
import type { SummaryFacts } from "./extract-summary";

// 30분 요약 (Phase 1) — SummaryFacts → Gemini "이 동네 추천 이유" 한 줄. story.ts 답습.
// ★ 거짓 방지(하루 미리보기 원칙 그대로): 주어진 데이터(통근·점수·등급·시세)만,
//   미화·창작 금지. 안전등급 낮으면(C·D) "안전/안심" 금지. 데이터 없는 항목 언급 금지.
//
// ★ INFRA-005(#4) "AI 기반 동네 추천 요약" 실구현 (코드=SSoT 정합):
//   명세 neighborhoodSummarySchema{summary, commuteAnalysis, lifestyleMatch}(3필드)를
//   카드 UI 에 맞춰 단일 rationale 로 통합(통근·생활점수·안전을 한 문장에) — 1인 MVP 단순화.
//   provider 분기(AI_PROVIDER)는 GA 이연 — GEMINI_MODEL env 교체로 CON-14 충족(타 provider 키 부재).
//   "맞춤 인사이트"(§6.6)는 하루 미리보기(/api/insight)로 별도 구현됨.

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
  // 통근 라벨 — 카드 라벨("내 통근/배우자 통근")과 일치. 부부=내 직장/배우자 직장, 싱글=직장(배우자 없음).
  //   ★ A=내 직장, B=배우자 직장 (입력 1번째=A 기준, #208 정합).
  const isCouple = facts.mode === "couple";
  lines.push(commuteLine(isCouple ? "내 직장 통근" : "직장 통근", facts.commuteA));
  if (facts.commuteB) lines.push(commuteLine("배우자 직장 통근", facts.commuteB));
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
    `6. 통근은 데이터 라벨 그대로 표현해("내 직장"·"배우자 직장"·"직장"). "직장 A"·"직장 B"·"A까지"·"B까지" 같은 표현은 절대 쓰지 마.`,
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
 * 예(부부): "내 직장 35분 · 배우자 직장 42분 · 생활점수 78점" / (싱글): "직장 35분 · 생활점수 78점"
 */
export function generateFallbackRationale(facts: SummaryFacts): string {
  const parts: string[] = [];
  const isCouple = facts.mode === "couple";
  parts.push(`${isCouple ? "내 직장" : "직장"} ${facts.commuteA.time}분`);
  if (facts.commuteB) parts.push(`배우자 직장 ${facts.commuteB.time}분`);
  parts.push(`생활점수 ${facts.livingScore}점`);
  if (facts.safetyGrade) parts.push(`야간 ${facts.safetyGrade}등급`);
  return parts.join(" · ");
}
