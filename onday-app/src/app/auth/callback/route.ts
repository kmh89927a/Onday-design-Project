import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncUserFromAuth } from "@/lib/services/user-sync";
import { AuthErrorCode } from "@/lib/types/auth";

// OAuth 콜백 (CMD-AUTH-001 §3.6) — auth_code → 세션 교환 + User UPSERT 후 next 로 redirect.
// 모든 예외는 5xx 대신 /login?error= redirect 로 흡수 (REQ-NF-012 서버 오류율).
// Sentry 상세는 MON-001 이연 — 여기선 console.error.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/diagnosis";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${AuthErrorCode.OAUTH_CODE_MISSING}`,
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(
        `${origin}/login?error=${AuthErrorCode.OAUTH_CALLBACK_FAILED}`,
      );
    }

    await syncUserFromAuth(data.user);
    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("[auth/callback] error:", err);
    return NextResponse.redirect(
      `${origin}/login?error=${AuthErrorCode.OAUTH_CALLBACK_FAILED}`,
    );
  }
}
