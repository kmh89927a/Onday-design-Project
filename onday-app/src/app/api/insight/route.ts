import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// 동네 하루 미리보기 — Gemini 인사이트 (SRS CON-13/14: Vercel AI SDK + Gemini, env 모델 교체).
// ★ Phase 1 = 인프라 + 최소 동작 확인만. 실제 동선 데이터(통근/여가/야간) 주입·프롬프트·UI 는 후속 Phase.
// ★ 서버 전용 키 — GOOGLE_GENERATIVE_AI_API_KEY (NEXT_PUBLIC 아님: 키 브라우저 노출 금지).
export const dynamic = "force-dynamic";
// CLAUDE.md §3 — Vercel 무료 함수 10초 한도. 짧은 프롬프트 단발 호출로 회피(스트리밍은 Phase 3 UI 검토).
export const maxDuration = 10;

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
// CON-14 — 모델은 env 만으로 교체 가능. 미설정 시 비용 효율 Flash 기본.
const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

// POST /api/insight  { dong: string }  → { insight: string }
export async function POST(request: Request) {
  // 키 없음 → graceful 503 (크래시 X — ODsay fallback 정신과 동일, 호출처가 안내/생략 처리).
  if (!API_KEY) {
    return NextResponse.json(
      { error: "AI 키가 설정되지 않았습니다 (GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 503 },
    );
  }

  let dong = "";
  try {
    const body = await request.json();
    dong = typeof body?.dong === "string" ? body.dong.trim() : "";
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  if (!dong) {
    return NextResponse.json({ error: "dong 이 필요합니다" }, { status: 400 });
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey: API_KEY });
    const { text } = await generateText({
      model: google(MODEL_ID),
      // ★ Phase 1 최소 프롬프트 — 실제 동선 데이터는 Phase 2~3 에서 주입. 거짓 수치 방지 가드만.
      prompt: `"${dong}" 동네에 사는 하루를 한 문장으로 친근하게 묘사해줘. 추측성 구체 수치나 사실은 넣지 말고 분위기만.`,
    });
    return NextResponse.json({ insight: text });
  } catch (error) {
    // Gemini 실패/타임아웃/쿼터 → graceful 502 (크래시 X).
    console.error("[API] POST /api/insight error:", error);
    return NextResponse.json(
      { error: "인사이트 생성에 실패했습니다" },
      { status: 502 },
    );
  }
}
