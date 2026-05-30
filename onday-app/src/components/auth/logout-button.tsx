"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { useSessionStore } from "@/stores/session";

// 로그인(세션 user 존재) 상태에서만 노출되는 로그아웃 버튼.
// signOutAction(Server Action) → Supabase 세션 종료 + /login. Zustand 정리는
// SessionBridge 의 onAuthStateChange(SIGNED_OUT) 가 담당. mock 모드(user 없음)면 미노출.
export function LogoutButton() {
  const user = useSessionStore((s) => s.user);
  if (!user) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      aria-label="로그아웃"
      onClick={() => signOutAction()}
    >
      <LogOut className="size-3.5" />
    </Button>
  );
}
