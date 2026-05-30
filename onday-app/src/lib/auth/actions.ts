"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IS_MOCK_AUTH } from "@/lib/auth/flags";

// 로그아웃 Server Action (CMD-AUTH-003) — Supabase 세션 종료 후 /login 으로.
// 클라이언트 Zustand 정리는 SessionBridge 의 onAuthStateChange(SIGNED_OUT) 가 담당.
// mock-auth 모드에선 Supabase 호출을 건너뛴다.
export async function signOutAction() {
  if (!IS_MOCK_AUTH) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
