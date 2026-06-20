"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseKeys } from "./keys";

// 브라우저(Client Component)용 Supabase 클라이언트.
// 세션 쿠키 동기화는 @supabase/ssr 가 담당한다. (CMD-AUTH-001 §3.5 — 단 DB-007 이
// 미제공이라 본 W1-2 슬라이스에서 신규 구축. ssr 0.10.x.)
export function createSupabaseBrowserClient() {
  const { url, key } = getSupabaseKeys();
  return createBrowserClient(url, key);
}
