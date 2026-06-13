"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { IS_MOCK_AUTH } from "@/lib/auth/flags";
import { useSessionStore, type SessionUser } from "@/stores/session";
import { DIAGNOSIS_PERSIST_KEY } from "@/stores/diagnosis-store";

function toSessionUser(user: User): SessionUser {
  const meta = user.user_metadata ?? {};
  // ★ 네이버 로그인은 GA 이연(버튼 제거) — naver 분기는 재개 대비 보존.
  const provider = user.app_metadata?.provider === "naver" ? "naver" : "kakao";
  const nickname =
    meta.name ?? meta.nickname ?? meta.full_name ?? user.email?.split("@")[0] ?? "사용자";
  return {
    id: user.id,
    nickname,
    provider,
    avatarUrl: meta.avatar_url ?? meta.picture,
  };
}

// 실 auth 모드에서 Supabase 세션(httpOnly 쿠키) ↔ Zustand(client UI) 동기화.
// 로그인/토큰갱신 → setUser, 명시적 로그아웃 → signOut.
// ★ INITIAL_SESSION(null) 에선 아무것도 안 함 — 게스트(isGuest)·미인증 상태를 보존
//   (signOut 은 isGuest 까지 리셋하므로 게스트 흐름이 깨지는 것을 방지).
// mock-auth 모드면 no-op (login-form 이 직접 Zustand 갱신).
export function SessionBridge() {
  const setUser = useSessionStore((s) => s.setUser);
  const signOut = useSessionStore((s) => s.signOut);
  const clearGuestSession = useSessionStore((s) => s.clearGuestSession);

  React.useEffect(() => {
    if (IS_MOCK_AUTH) return;

    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // ★ CMD-AUTH-004 — 게스트/심사관 → 인증 전환 시 게스트 세션 플래그 정리.
        clearGuestSession();
        setUser(toSessionUser(session.user));
      } else if (event === "SIGNED_OUT") {
        signOut();
        // 로그아웃 후 입력좌표·결과가 localStorage 에 잔존하지 않게 제거(프라이버시).
        localStorage.removeItem(DIAGNOSIS_PERSIST_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, signOut, clearGuestSession]);

  return null;
}
