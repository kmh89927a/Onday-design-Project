import { NextResponse } from "next/server";

import { checkHealth } from "@/lib/health";

// MON-001 v1.4 (Issue #73) Uptime 핑 + #10 DB 연결 검증.
// 기존 단순 200 → prisma.$queryRaw`SELECT 1` 로 실제 DB 연결을 확인한다:
//   연결 OK = 200 db:"ok" / 실패 = 503 db:"error" (DATABASE_URL 깨짐·P1001 등을 즉시 가시화).
// ★ pg 드라이버 어댑터는 Node 런타임 필수 → prisma 는 지연 import (헬스 외 경로 영향 0).
// ★ 로그(db_connect_ok/db_connect_fail)에 connection string 미포함 (DB_SPEC §19).

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { prisma } = await import("@/lib/db");
  const result = await checkHealth(prisma, new Date().toISOString());
  return NextResponse.json(result.body, { status: result.status });
}
