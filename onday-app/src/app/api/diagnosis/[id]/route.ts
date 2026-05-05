import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CandidateArea, DiagnosisFilters } from "@/lib/types";

// GET /api/diagnosis/[id] — Fetch diagnosis result (API-02)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const diagnosis = await prisma.diagnosis.findUnique({ where: { id } });

    if (!diagnosis) {
      return NextResponse.json({ error: "진단 결과를 찾을 수 없습니다" }, { status: 404 });
    }

    const candidates: CandidateArea[] = JSON.parse(diagnosis.candidates);
    const filters: DiagnosisFilters = JSON.parse(diagnosis.filters);

    return NextResponse.json({
      id: diagnosis.id,
      userId: diagnosis.userId,
      addressA: diagnosis.addressA,
      addressB: diagnosis.addressB,
      candidates,
      filters,
      mode: diagnosis.mode,
      deadlineMode: diagnosis.deadlineMode,
      deadline: diagnosis.deadline?.toISOString() ?? null,
      status: diagnosis.status,
      createdAt: diagnosis.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[API] GET /api/diagnosis/[id] error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
