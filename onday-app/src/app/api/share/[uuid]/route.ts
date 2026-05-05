import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CandidateArea } from "@/lib/types";

// GET /api/share/[uuid] — Fetch share link data (UI-007)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    const { uuid } = await params;
    const shareLink = await prisma.shareLink.findUnique({
      where: { uniqueUrl: uuid },
      include: { diagnosis: true },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: "공유 링크를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    if (shareLink.expiresAt < new Date()) {
      return NextResponse.json(
        {
          error: "expired",
          expiredAt: shareLink.expiresAt.toISOString(),
        },
        { status: 410 },
      );
    }

    // viewCount 증가 (응답엔 새 값 포함)
    const updated = await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { viewCount: { increment: 1 } },
    });

    const candidates: CandidateArea[] = JSON.parse(
      shareLink.diagnosis.candidates,
    );

    return NextResponse.json({
      uniqueUrl: shareLink.uniqueUrl,
      diagnosisId: shareLink.diagnosisId,
      addressA: shareLink.diagnosis.addressA,
      addressB: shareLink.diagnosis.addressB,
      mode: shareLink.diagnosis.mode,
      candidates,
      expiresAt: shareLink.expiresAt.toISOString(),
      viewCount: updated.viewCount,
    });
  } catch (error) {
    console.error("[API] GET /api/share/[uuid] error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
