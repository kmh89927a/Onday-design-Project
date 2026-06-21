import { NextResponse } from "next/server";

import { getDeploymentEnv } from "@/lib/health";
import { logError, type LogUserType } from "@/lib/logging/log-error";
import { prisma } from "@/lib/db";

// 로깅 점검(운영자 테스트) — 의도적 400/500 에러로 3-sink(콘솔·DB·Sentry) 기록 검증.
// ★ production 차단: 운영 도구라 production 에선 404. 개발·프리뷰에서만 동작.
// ★ 의도적 테스트임을 errorType("test_400"/"test_500")로 명확히.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface LogTestBody {
  status?: 400 | 500;
  visitorId?: string | null;
  device?: string | null;
  os?: string | null;
  userType?: LogUserType | null;
}

export async function POST(request: Request) {
  // ★ production 차단 (관리자 인증 대체 — 환경 기반).
  if (getDeploymentEnv() === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as LogTestBody;
  const status = body.status === 400 ? 400 : 500;
  const errorType = status === 400 ? "test_400" : "test_500";

  await logError({
    level: "error",
    message: `[로깅 점검] 의도적 ${status} 테스트 에러 (운영자 트리거)`,
    statusCode: status,
    route: "POST /api/dev/log-test",
    errorType,
    userType: body.userType ?? null,
    visitorId: body.visitorId ?? null,
    device: body.device ?? null,
    os: body.os ?? null,
  });

  // ★ DB sink 실제 동작 여부 정직 보고 — error_logs 테이블 존재 확인(미적용이면 false).
  let dbAvailable = false;
  try {
    await prisma.errorLog.count();
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }

  const sentryConfigured = Boolean(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  );

  return NextResponse.json(
    {
      ok: true,
      status,
      errorType,
      sinks: {
        console: true, // JSON 구조화 로그 — 항상 동작
        db: dbAvailable, // error_logs 테이블 적용 시 true (미적용이면 best-effort 실패)
        sentry: sentryConfigured, // DSN 설정 시 전송, 없으면 no-op
      },
    },
    { status },
  );
}
