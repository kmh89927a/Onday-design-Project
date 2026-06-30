import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CandidateArea, Coordinate, DiagnosisFilters } from "@/lib/types";
import { getServerUser } from "@/lib/auth/session";
import { logError, type LogUserType } from "@/lib/logging/log-error";

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
    // 입력 직장 좌표 — 새로고침 시 경로선 복원용(게스트/심사관은 localStorage 미저장이라 서버만이 복원 경로).
    //   본 컬럼 이전 진단 row 는 null → 클라가 복원 skip(기존 동작 유지).
    const coordinateA = diagnosis.coordinateA
      ? (JSON.parse(diagnosis.coordinateA) as Coordinate)
      : null;
    const coordinateB = diagnosis.coordinateB
      ? (JSON.parse(diagnosis.coordinateB) as Coordinate)
      : null;

    return NextResponse.json({
      id: diagnosis.id,
      userId: diagnosis.userId,
      addressA: diagnosis.addressA,
      addressB: diagnosis.addressB,
      coordinateA,
      coordinateB,
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
    // ★ 3-sink 로깅 추가(기존 유지). 서버 컨텍스트만 — visitorId/device/os=null(클라 정보).
    let userType: LogUserType | null = null;
    try {
      userType = (await getServerUser()) ? "kakao" : null;
    } catch {
      // best-effort
    }
    await logError({
      level: "error",
      message: error instanceof Error ? error.message : String(error),
      statusCode: 500,
      route: "GET /api/diagnosis/[id]",
      errorType: "api_error",
      userType,
      visitorId: null,
      device: null,
      os: null,
      originalError: error,
    });
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
