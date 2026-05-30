import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { IS_MOCK_AUTH } from "@/lib/auth/flags";

// 두 가지 책임:
//   1) Production 에서 /dev/* 외부 노출 차단 (기존 동작 보존).
//   2) 실 auth 모드에서 Supabase 세션 쿠키 refresh (CMD-AUTH-003).
// ★ 라우트 보호(미인증 redirect)는 게스트 흐름 보존을 위해 #24 로 이연 — 여기선 세션 갱신만.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    process.env.NODE_ENV === "production" &&
    (pathname === "/dev" || pathname.startsWith("/dev/"))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // mock-auth 모드면 Supabase 세션 갱신 스킵 (키 없는 환경 안전, 기존 동작과 동일).
  if (IS_MOCK_AUTH) {
    return NextResponse.next();
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // 정적 자산 제외 모든 경로 — 세션 쿠키 refresh 를 위해 광범위 매칭 (CMD-AUTH-001 §3.8).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
