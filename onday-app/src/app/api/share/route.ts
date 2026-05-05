import { NextResponse } from "next/server";
import { shareLinkInputSchema } from "@/lib/validators/diagnosis";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

// DUMMY_HASH for timing attack prevention (SRS architecture pattern)
// Production: const DUMMY_HASH = "$2b$12$..."; bcrypt.compare() to prevent password existence inference

// POST /api/share — Create share link (API-03)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = shareLinkInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { diagnosisId, password } = parsed.data;

    // Verify diagnosis exists
    const diagnosis = await prisma.diagnosis.findUnique({ where: { id: diagnosisId } });
    if (!diagnosis) {
      return NextResponse.json({ error: "진단 결과를 찾을 수 없습니다" }, { status: 404 });
    }

    // Check if share link already exists
    const existing = await prisma.shareLink.findUnique({ where: { diagnosisId } });
    if (existing) {
      return NextResponse.json({
        shareUrl: `/share/${existing.uniqueUrl}`,
        expiresAt: existing.expiresAt.toISOString(),
      });
    }

    // In mock mode, store password as-is (no bcrypt dependency yet)
    // Production: use bcrypt.hash(password, 12)
    const passwordHash = password ? `mock_hash_${password}` : null;

    const shareLink = await prisma.shareLink.create({
      data: {
        diagnosisId,
        uniqueUrl: randomUUID(),
        passwordHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return NextResponse.json({
      shareUrl: `/share/${shareLink.uniqueUrl}`,
      expiresAt: shareLink.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[API] POST /api/share error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
