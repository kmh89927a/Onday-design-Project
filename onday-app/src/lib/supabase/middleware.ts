import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseKeys } from "./keys";

// 미들웨어용 Supabase 클라이언트 — 요청마다 세션 쿠키를 refresh 한다.
// ★ 본 W1-2 슬라이스는 "세션 갱신만" — 라우트 보호(미인증 redirect)는 게스트 흐름
//   보존을 위해 #24(게스트 정리)로 이연. 여기선 getUser() 로 토큰만 갱신.
export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseKeys();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { supabase, response };
}
