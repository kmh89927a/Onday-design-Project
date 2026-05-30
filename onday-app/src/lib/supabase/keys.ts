// Supabase 클라이언트 공개 키 — client/server 공용 (NEXT_PUBLIC_ 만, server-only import 없음).
// ★ 최신 Supabase = publishable key 체계(sb_publishable_...). 레거시 anon key 는 fallback.
//   둘 다 supabase-js 의 key 슬롯에 그대로 사용 가능 (2.105.4 = publishable 네이티브 지원).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const SUPABASE_PUBLISHABLE_KEY = (process.env
  .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
