"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { OAuthButton } from "@/components/ui/oauth-button";
import { MOCK_USER } from "@/mocks/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { IS_MOCK_AUTH } from "@/lib/auth/flags";
import { useSessionStore } from "@/stores/session";
import { useUIStore } from "@/stores/ui";

// 패턴 A — controlled props 유지
//   OAuthButton / Button은 props만 받고, store 연결은 본 LoginForm에서만
//   ★ W1-2: IS_MOCK_AUTH(=false) 시 카카오 = 실 supabase.auth.signInWithOAuth →
//     카카오 redirect → /auth/callback 복귀. 네이버는 #22 이연("준비 중" 토스트).
//     mock-auth 모드는 기존 즉시 setUser + 라우팅 유지.

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
      if (IS_MOCK_AUTH) {
        await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
        setUser({
          id: MOCK_USER.id,
          nickname: MOCK_USER.email.split("@")[0],
          provider,
        });
        router.push("/diagnosis");
        return;
      }

      // 네이버는 #22 이연 — 카카오 패턴 복제 예정. 크래시 대신 안내.
      if (provider === "naver") {
        pushToast({
          variant: "default",
          message: "네이버 로그인은 준비 중이에요. 카카오로 시작해 주세요.",
        });
        setInFlight(null);
        return;
      }

      // 실 카카오 OAuth — Supabase 가 카카오로 redirect → /auth/callback 복귀.
      // 성공 시 페이지가 카카오로 이동하므로 이후 로직 없음. 세션 반영은 SessionBridge.
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // ★ KOE205 회피 — Supabase 의 kakao 기본 scope 엔 account_email 이 박혀 있고
          //   (gotrue 내장, config 로 제거 불가), 카카오 앱은 이메일 권한이 없어 KOE205.
          //   options.scopes 는 기본값에 "추가"만 되지만, authorize 의 `scope`(단수)
          //   쿼리 파라미터는 기본값을 "교체"한다 → queryParams 로 직접 주입해 account_email 제거.
          //   (실제 사용 동의항목: profile_nickname 필수 + profile_image 선택)
          queryParams: { scope: "profile_nickname profile_image" },
        },
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      pushToast({
        variant: "danger",
        message: err instanceof Error ? err.message : "로그인에 실패했어요",
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
