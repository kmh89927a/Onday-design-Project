import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { DayPreviewData } from "@/lib/insight/extract-day-data";
import {
  auditGradeMismatch,
  buildStoryPrompt,
  sanitizeStory,
  storySchema,
} from "@/lib/insight/story";

// 동네 하루 미리보기 — Gemini 시간대별 스토리 (SRS CON-13/14: Vercel AI SDK + Gemini, env 모델 교체).
// ★ Phase 3 = DayPreviewData(Phase 2 extractDayData 출력) 주입 → 구조화 JSON 스토리. UI 는 Phase 4.
// ★ 서버 전용 키 — GOOGLE_GENERATIVE_AI_API_KEY (NEXT_PUBLIC 아님: 키 브라우저 노출 금지).
export const dynamic = "force-dynamic";
// CLAUDE.md §3 — Vercel 무료 함수 10초 한도. thinkingBudget=0 + Flash 단발로 회피.
export const maxDuration = 10;

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
// CON-14 — 모델은 env 만으로 교체 가능. 미설정 시 비용 효율 Flash 기본.
// ★ gemini-2.0-flash 는 free tier 쿼터 0(limit:0)인 키가 있어 2.5-flash 기본(무료 동작 확인).
const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

// 입력 최소 검증 — DayPreviewData 핵심 필드(없으면 프롬프트 생성 불가).
function isValidInput(d: unknown): d is DayPreviewData {
  const x = d as DayPreviewData | null;
  return (
    !!x &&
    typeof x.dong === "string" &&
    !!x.morning?.a &&
    typeof x.morning.a.time === "number" &&
    !!x.night &&
    typeof x.night === "object"
  );
}

// POST /api/insight  { ...DayPreviewData }  → { story: {morning, afternoon|null, night} }
export async function POST(request: Request) {
  // 키 없음 → graceful 503 (크래시 X — ODsay fallback 정신과 동일, 호출처가 안내/생략 처리).
  if (!API_KEY) {
    return NextResponse.json(
      { error: "AI 키가 설정되지 않았습니다 (GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 503 },
    );
  }

  let data: DayPreviewData;
  try {
    const body = await request.json();
    if (!isValidInput(body)) {
      return NextResponse.json(
        { error: "동네 데이터(DayPreviewData)가 올바르지 않습니다" },
        { status: 400 },
      );
    }
    data = body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey: API_KEY });
    // generateObject = 스키마 강제 JSON(자유 텍스트 파싱보다 견고). 스키마 불일치 시 throw → graceful.
    const { object } = await generateObject({
      model: google(MODEL_ID),
      schema: storySchema,
      prompt: buildStoryPrompt(data),
      // ★ thinking 비활성 — 지연만 늘어 Vercel 10초 위협. 짧은 묘사엔 추론 불필요.
      providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    });
    // ★ 거짓 방지 강제(여가 없으면 evening=null, 역 keyword 차단) + keywords 부분문자열 검증.
    const story = sanitizeStory(object, data);
    // 거짓 방지(로깅) — 등급 미화 모순은 차단 대신 경고(차단은 프롬프트가 담당).
    const mismatch = auditGradeMismatch(story, data);
    if (mismatch) console.warn("[API] /api/insight", mismatch);
    return NextResponse.json({ story });
  } catch (error) {
    // Gemini 실패/타임아웃/쿼터/스키마 불일치 → graceful 502 (크래시 X).
    console.error("[API] POST /api/insight error:", error);
    return NextResponse.json(
      { error: "인사이트 생성에 실패했습니다" },
      { status: 502 },
    );
  }
}
