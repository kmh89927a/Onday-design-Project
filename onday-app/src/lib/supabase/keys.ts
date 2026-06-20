// Supabase 클라이언트 공개 키 — client/server 공용 (NEXT_PUBLIC_ 만, server-only import 없음).
// ★ 최신 Supabase = publishable key 체계(sb_publishable_...). 레거시 anon key 는 fallback.
//   둘 다 supabase-js 의 key 슬롯에 그대로 사용 가능 (2.105.4 = publishable 네이티브 지원).
//
// ★ #6 — 모듈 import 시점이 아니라 호출 시점에 검증한다(지연 평가). mock-auth 모드는
//   supabase 클라이언트를 생성하지 않으므로(미들웨어 IS_MOCK_AUTH 가드), 키 없이도
//   안전해야 한다. 실 auth 경로에서 create*Client 가 호출될 때만 getClientEnv 가
//   누락/형식오류를 명확한 에러("Missing required env: NEXT_PUBLIC_SUPABASE_URL")로 차단한다.
import { getClientEnv } from "@/lib/env";

export function getSupabaseKeys(): { url: string; key: string } {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY } = getClientEnv();
  return { url: NEXT_PUBLIC_SUPABASE_URL, key: NEXT_PUBLIC_SUPABASE_KEY };
}
