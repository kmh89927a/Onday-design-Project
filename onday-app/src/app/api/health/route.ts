import { NextResponse } from "next/server";

// MON-001 v1.4 (Issue #73) — REQ-NF-011 Uptime 핑 엔드포인트.
// Sentry Uptime Monitor 5분 주기 핑 대상 (Sentry Dashboard 설정 = 르르 영역).
// mock 모드 + Vercel 서버리스 = DB ping 환경 부적합 → 단순 200 OK 사수.
// 차후 Production DB(PostgreSQL) 연결 시점 Prisma $queryRaw SELECT 1 확장 답습.

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
