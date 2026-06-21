import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { SummaryFacts } from "@/lib/summary/extract-summary";
import {
  buildRationalePrompt,
  generateFallbackRationale,
  rationaleSchema,
  sanitizeRationale,
} from "@/lib/summary/rationale";
import { getServerUser } from "@/lib/auth/session";
import { logError, type LogUserType } from "@/lib/logging/log-error";

// 30분 요약 — Gemini "이 동네 추천 이유" 한 줄 (UI-011/QRY-DL-002 Phase 1).
//   /api/insight(하루 미리보기) 패턴 복제 — createGoogleGenerativeAI + generateObject + thinkingBudget=0.
//   ★ route = 후보 1건 → rationale 1건. 클라(Phase 3)가 Top3 Promise.all (Vercel 10초 한도·CLAUDE.md §3).
//   ★ 빈 카드 방지(spec getSummary §3.2): AI 실패/키 없음 → 룰 기반 fallback 200 반환(502 아님). 400=잘못된 입력만.
//   ★ 서버 전용 키 — GOOGLE_GENERATIVE_AI_API_KEY (NEXT_PUBLIC 아님: 키 브라우저 노출 금지).
export const dynamic = "force-dynamic";
// CLAUDE.md §3 — Vercel 무료 함수 10초 한도. thinkingBudget=0 + Flash 단발로 회피.
export const maxDuration = 10;

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
// CON-14 — 모델은 env 만으로 교체 가능(provider 분기는 GA 이연). 미설정 시 무료 동작 Flash 기본.
const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
// ★ Gemini 호출 상한 — Vercel 10초 한도 안쪽에서 abort → fallback (빈 카드 방지).
const AI_TIMEOUT_MS = 8000;

// 입력 최소 검증 — SummaryFacts 핵심 필드(없으면 프롬프트 생성 불가).
function isValidFacts(d: unknown): d is SummaryFacts {
  const x = d as SummaryFacts | null;
  return (
    !!x &&
    typeof x.dong === "string" &&
    typeof x.gu === "string" &&
    !!x.commuteA &&
    typeof x.commuteA.time === "number" &&
    typeof x.livingScore === "number" &&
    typeof x.priceLabel === "string"
  );
}

// POST /api/summary  { ...SummaryFacts }  → { rationale, source: "ai" | "fallback" }
export async function POST(request: Request) {
  let facts: SummaryFacts;
  try {
    const body = await request.json();
    if (!isValidFacts(body)) {
      return NextResponse.json(
        { error: "동네 데이터(SummaryFacts)가 올바르지 않습니다" },
        { status: 400 },
      );
    }
    facts = body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  // 키 없음 → 룰 기반 fallback (빈 카드 방지 — 데모는 키 없이도 카드 표시).
  if (!API_KEY) {
    return NextResponse.json({
      rationale: generateFallbackRationale(facts),
      source: "fallback",
    });
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey: API_KEY });
    // generateObject = 스키마 강제 JSON(자유 텍스트 파싱보다 견고).
    const { object } = await generateObject({
      model: google(MODEL_ID),
      schema: rationaleSchema,
      prompt: buildRationalePrompt(facts),
      // ★ thinking 비활성 — 지연만 늘어 Vercel 10초 위협. 짧은 한 줄엔 추론 불필요.
      providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
      // ★ 8초 abort — Gemini 가 느릴 때 Vercel 10초 kill 전에 abort → catch → fallback (빈 카드 방지).
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    // 거짓 방지 + 빈 값 방지 — 비거나 등급 미화면 throw → fallback 으로 대체.
    const rationale = sanitizeRationale(object.rationale, facts);
    return NextResponse.json({ rationale, source: "ai" });
  } catch (error) {
    // Gemini 실패/타임아웃/쿼터/스키마 불일치/미화 차단 → 룰 fallback (빈 카드 0).
    // ★ 기존 reportErrorToSentry 를 logError 로 교체 — logError 가 콘솔+DB+Sentry 상위집합이라
    //   Sentry 보고는 logError 내부 reportErrorToSentry 로 그대로 유지(중복 X, 단일화).
    //   ★ statusCode=200 — 에러지만 사용자엔 fallback 200 응답(실제 응답값). errorType 으로 구분.
    let userType: LogUserType | null = null;
    try {
      userType = (await getServerUser()) ? "kakao" : null;
    } catch {
      // best-effort
    }
    await logError({
      level: "error",
      message: error instanceof Error ? error.message : String(error),
      statusCode: 200,
      route: "POST /api/summary",
      errorType: "ai_fallback",
      userType,
      visitorId: null,
      device: null,
      os: null,
      originalError: error,
    });
    return NextResponse.json({
      rationale: generateFallbackRationale(facts),
      source: "fallback",
    });
  }
}
