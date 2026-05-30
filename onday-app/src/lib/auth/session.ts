import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IS_MOCK_AUTH } from "@/lib/auth/flags";

export { IS_MOCK_AUTH };

// ★ R2 — 게스트·mock 진단/저장이 귀속되는 공용 fallback 유저.
// prisma seed 의 mock-user-001 재활용 (신규 seed 0, FK 충족).
export const GUEST_FALLBACK_USER_ID = "mock-user-001";

// 서버에서 현재 로그인 유저(Supabase Auth)를 읽는다.
// ★ Q2-3 가드 — mock-auth 모드면 Supabase 조회 자체를 건너뛴다 (supabase 키 없는
//   환경에서 createServerClient 가 터지는 것을 방지).
export async function getServerUser() {
  if (IS_MOCK_AUTH) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// 진단/저장이 귀속될 effective userId.
// 로그인 유저면 실 Supabase id, 게스트·mock 이면 공용 fallback.
export async function getEffectiveUserId(): Promise<string> {
  const user = await getServerUser();
  return user?.id ?? GUEST_FALLBACK_USER_ID;
}
