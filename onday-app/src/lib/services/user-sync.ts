import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";
import type { AuthProviderType } from "@/lib/types/user";

// Supabase Auth 유저 → public.users UPSERT (id = auth uuid).
// OAuth 콜백 성공 직후 호출해 진단 FK 대상 User 행을 보장한다.
// RLS off(DB-007 RLS 이연) 상태라 Prisma(postgres role)로 직접 write.
export async function syncUserFromAuth(user: User): Promise<void> {
  const rawProvider = user.app_metadata?.provider;
  // ★ 네이버 로그인은 GA 이연(버튼 제거) — naver 분기는 재개 대비 보존.
  const authProvider: AuthProviderType =
    rawProvider === "naver" ? "naver" : "kakao";

  // ★ 카카오 account_email = 권한 없음(비즈검수 전) → Supabase 가 user.email 을
  //   null 이 아닌 빈 문자열("")로 줄 수 있음. `??`(nullish)는 ""를 안 잡으므로
  //   `||`(falsy)로 빈 문자열까지 placeholder 치환 → email @unique 충돌 방지.
  //   auth uuid 기반이라 무이메일 유저끼리도 항상 unique. 실 email 유입 시 self-heal.
  const email = user.email || `${user.id}@${authProvider}.local`;

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
