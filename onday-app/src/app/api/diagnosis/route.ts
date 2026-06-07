import { NextResponse } from "next/server";
import { diagnosisInputSchema } from "@/lib/validators/diagnosis";
import { runMockDiagnosis } from "@/features/diagnosis/mock-calculator";
import { prisma } from "@/lib/db";
import { getEffectiveUserId } from "@/lib/auth/session";

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// POST /api/diagnosis — Create diagnosis (API-01)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = diagnosisInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Mock mode: use Haversine-based calculator
    if (IS_MOCK) {
      const candidates = await runMockDiagnosis(
        input.coordinateA,
        input.coordinateB ?? null,
        input.filters,
        input.mode,
        input.leisureCoordA ?? null,
        input.leisureCoordB ?? null,
      );

      // ★ R2 — 로그인 유저면 실 Supabase id, 게스트·mock-auth 면 공용 fallback.
      const userId = await getEffectiveUserId();

      const diagnosis = await prisma.diagnosis.create({
        data: {
          userId,
          addressA: input.addressA,
          addressB: input.addressB ?? null,
          filters: JSON.stringify(input.filters),
          candidates: JSON.stringify(candidates),
          mode: input.mode,
          deadlineMode: !!input.deadlineDate,
          deadline: input.deadlineDate ? new Date(input.deadlineDate) : null,
          status: "completed",
        },
      });

      return NextResponse.json({
        diagnosisId: diagnosis.id,
        candidates,
        timeline: input.deadlineDate
          ? { daysLeft: Math.ceil((new Date(input.deadlineDate).getTime() - Date.now()) / 86400000) }
          : null,
      });
    }

    // Production (B2): 클라가 ODsay/Kakao 브라우저 직접으로 계산한 candidates 를 받아 저장만 한다
    //   (외부 API 반복 호출은 클라 Promise.all — Vercel 함수/10초 timeout 회피).
    const candidates = body.candidates;
    if (!Array.isArray(candidates)) {
      return NextResponse.json(
        { error: "candidates 가 필요합니다 (production)" },
        { status: 400 },
      );
    }

    const userId = await getEffectiveUserId();
    const diagnosis = await prisma.diagnosis.create({
      data: {
        userId,
        addressA: input.addressA,
        addressB: input.addressB ?? null,
        filters: JSON.stringify(input.filters),
        candidates: JSON.stringify(candidates),
        mode: input.mode,
        deadlineMode: !!input.deadlineDate,
        deadline: input.deadlineDate ? new Date(input.deadlineDate) : null,
        status: "completed",
      },
    });

    return NextResponse.json({
      diagnosisId: diagnosis.id,
      candidates,
      timeline: input.deadlineDate
        ? { daysLeft: Math.ceil((new Date(input.deadlineDate).getTime() - Date.now()) / 86400000) }
        : null,
    });
  } catch (error) {
    console.error("[API] POST /api/diagnosis error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
