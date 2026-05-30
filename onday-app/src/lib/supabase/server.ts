import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./keys";

// 서버(Route Handler / Server Component)용 Supabase 클라이언트.
// ★ @supabase/ssr 0.10.x 쿠키 API = getAll/setAll (구 get/set/remove 아님 — R5).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 렌더 중엔 cookie set 불가 — 세션 갱신은 middleware 가
            // 담당하므로 무시해도 안전 (@supabase/ssr 공식 패턴).
          }
        },
      },
    },
  );
}
