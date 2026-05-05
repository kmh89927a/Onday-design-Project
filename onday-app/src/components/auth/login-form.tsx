"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { OAuthButton } from "@/components/ui/oauth-button";
import { MOCK_USER } from "@/mocks/users";
import { useSessionStore } from "@/stores/session";
import { useUIStore } from "@/stores/ui";

// 패턴 A — controlled props 유지
//   OAuthButton / Button은 props만 받고, store 연결은 본 LoginForm에서만
//   Mock 분기: NEXT_PUBLIC_USE_MOCK === "true" 시 즉시 setUser + 라우팅
//   실 OAuth: Step 12 Postgres 마이그 후 supabase.auth.signInWithOAuth 활성

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const MOCK_LATENCY_MS = 400;

type AuthInFlight = "kakao" | "naver" | "guest" | null;

export function LoginForm() {
  const router = useRouter();
  const setUser = useSessionStore((s) => s.setUser);
  const enterGuestMode = useSessionStore((s) => s.enterGuestMode);
  const pushToast = useUIStore((s) => s.pushToast);
  const [inFlight, setInFlight] = React.useState<AuthInFlight>(null);

  const handleOAuth = async (provider: "kakao" | "naver") => {
    setInFlight(provider);
    try {
      if (IS_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
        setUser({
          id: MOCK_USER.id,
          nickname: MOCK_USER.email.split("@")[0],
          provider,
        });
        router.push("/diagnosis");
        return;
      }
      // TODO: Supabase Auth 활성 (Step 12 Postgres 마이그레이션 후)
      throw new Error("OAuth Provider 미구성 — Mock 모드를 켜주세요");
    } catch (err) {
      pushToast({
        variant: "danger",
        message:
          err instanceof Error ? err.message : "로그인에 실패했어요",
      });
      setInFlight(null);
    }
  };

  const handleGuest = () => {
    setInFlight("guest");
    enterGuestMode();
    router.push("/diagnosis");
  };

  const isBusy = inFlight !== null;

  return (
    <div className="space-y-s-3">
      <OAuthButton
        provider="kakao"
        onClick={() => handleOAuth("kakao")}
        loading={inFlight === "kakao"}
        disabled={isBusy && inFlight !== "kakao"}
      />
      <OAuthButton
        provider="naver"
        onClick={() => handleOAuth("naver")}
        loading={inFlight === "naver"}
        disabled={isBusy && inFlight !== "naver"}
      />

      <div
        role="separator"
        aria-orientation="horizontal"
        className="flex items-center gap-s-3 py-s-1"
      >
        <span aria-hidden className="h-px flex-1 bg-line-2" />
        <span className="text-caption text-ink-3">또는</span>
        <span aria-hidden className="h-px flex-1 bg-line-2" />
      </div>

      <Button
        variant="outline"
        fullWidth
        onClick={handleGuest}
        loading={inFlight === "guest"}
        disabled={isBusy && inFlight !== "guest"}
      >
        로그인 없이 체험하기
      </Button>

      <p className="text-center text-caption-xs text-ink-3">
        가입 시{" "}
        <a
          href="/terms"
          className="underline underline-offset-2 hover:text-ink-2"
        >
          이용약관
        </a>{" "}
        ·{" "}
        <a
          href="/privacy"
          className="underline underline-offset-2 hover:text-ink-2"
        >
          개인정보처리방침
        </a>
        에 동의합니다
      </p>
    </div>
  );
}
