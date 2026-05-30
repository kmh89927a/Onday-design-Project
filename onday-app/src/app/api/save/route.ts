import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEffectiveUserId } from "@/lib/auth/session";
import { z } from "zod";

const saveSearchSchema = z.object({
  searchParams: z.record(z.string(), z.unknown()),
});

// POST /api/save — Auto-save search conditions (API-05)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = saveSearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다" }, { status: 400 });
    }

    // ★ R2 — 로그인 유저면 실 id, 게스트·mock-auth 면 공용 fallback.
    const userId = await getEffectiveUserId();

    const saved = await prisma.savedSearch.upsert({
      where: { userId },
      create: {
        userId,
        searchParams: JSON.stringify(parsed.data.searchParams),
      },
      update: {
        searchParams: JSON.stringify(parsed.data.searchParams),
        savedAt: new Date(),
      },
    });

    return NextResponse.json({
      savedSearchId: saved.id,
      savedAt: saved.savedAt.toISOString(),
    });
  } catch (error) {
    console.error("[API] POST /api/save error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// GET /api/save — Get saved search
export async function GET() {
  try {
    const userId = await getEffectiveUserId();

    const saved = await prisma.savedSearch.findUnique({ where: { userId } });

    if (!saved) {
      return NextResponse.json({ saved: null });
    }

    return NextResponse.json({
      saved: {
        id: saved.id,
        searchParams: JSON.parse(saved.searchParams),
        savedAt: saved.savedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/save error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
