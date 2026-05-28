import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

// MON-001 v1.4 (Issue #73) — Sentry 캡처 검증용 라우트.
// AC-3 "의도 에러 → Sentry Dashboard 캡처" 검증.
// ★ env 가드: production 노출 시 Sentry 5K errors/mo 티어 소모 + 5xx 인위 발생 리스크 = 404 박힘.
// dev/preview 한정 throw → Preview URL에서 르르 1회 호출 → Sentry Dashboard 캡처 확인.

export const dynamic = "force-dynamic";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const error = new Error("MON-001 sentry-test intentional error");
  Sentry.captureException(error, {
    tags: { domain: "monitoring", task: "MON-001", purpose: "test" },
  });
  throw error;
}
