import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";
import type { AuthProviderType } from "@/lib/types/user";

// Supabase Auth 유저 → public.users UPSERT (id = auth uuid).
// OAuth 콜백 성공 직후 호출해 진단 FK 대상 User 행을 보장한다.
// RLS off(DB-007 RLS 이연) 상태라 Prisma(postgres role)로 직접 write.
export async function syncUserFromAuth(user: User): Promise<void> {
  const rawProvider = user.app_metadata?.provider;
  const authProvider: AuthProviderType =
    rawProvider === "naver" ? "naver" : "kakao";

  // ★ 카카오 account_email = 비즈앱 검수 전이라 권한 없음 → user.email = null.
  //   schema 의 email String @unique 충족용 placeholder (auth uuid 라 항상 unique).
  //   비즈 검수 후 실 email 이 들어오면 아래 update 로 자동 치환(self-heal).
  const email = user.email ?? `${user.id}@${authProvider}.local`;

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email,
      authProvider,
      mode: "couple",
    },
    // 실 email 이 있을 때만 갱신 → 이미 저장된 실 email 을 placeholder 로 덮지 않음.
    update: user.email ? { email: user.email } : {},
  });
}
