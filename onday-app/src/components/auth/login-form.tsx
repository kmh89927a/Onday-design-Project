"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";
import { OAuthButton } from "@/components/ui/oauth-button";
import { MOCK_USER } from "@/mocks/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { IS_MOCK_AUTH } from "@/lib/auth/flags";
import { useSessionStore } from "@/stores/session";
import { DIAGNOSIS_PERSIST_KEY } from "@/stores/diagnosis-store";
import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/utils";

// 패턴 A — controlled props 유지
//   OAuthButton / Button은 props만 받고, store 연결은 본 LoginForm에서만
//   ★ W1-2: IS_MOCK_AUTH(=false) 시 카카오 = 실 supabase.auth.signInWithOAuth →
//     카카오 redirect → /auth/callback 복귀.
//     mock-auth 모드는 기존 즉시 setUser + 라우팅 유지.
//   ★ 네이버 로그인 = GA 이연 — 버튼/핸들러 제거. 카카오 + 게스트 + 심사관으로 완결.
//     (콜백·user-sync·session-bridge 의 naver 분기는 재개 대비 보존.)

const MOCK_LATENCY_MS = 400;

type AuthInFlight = "kakao" | "guest" | null;

export function LoginForm() {
  const router = useRouter();
  const setUser = useSessionStore((s) => s.setUser);
  const enterGuestMode = useSessionStore((s) => s.enterGuestMode);
  const enterReviewerMode = useSessionStore((s) => s.enterReviewerMode);
  const pushToast = useUIStore((s) => s.pushToast);
  const [inFlight, setInFlight] = React.useState<AuthInFlight>(null);

  const handleKakao = async () => {
    setInFlight("kakao");
    try {
      if (IS_MOCK_AUTH) {
        await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
        setUser({
          id: MOCK_USER.id,
          nickname: MOCK_USER.email.split("@")[0],
          provider: "kakao",
        });
        router.push("/diagnosis");
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
    // 게스트는 회원 정보 미저장 — 이전 로그인 사용자가 남긴 입력좌표 blob 제거(물려받기 방지).
    localStorage.removeItem(DIAGNOSIS_PERSIST_KEY);
    router.push("/diagnosis");
  };

  // ★ #24 심사관(채용 담당자) 데모 모드 — 로그인 없이 풀 기능(저장/공유 차단 면제).
  //   세션 내(in-memory + favorites localStorage) 동작, 회원 정보에는 귀속되지 않음.
  const handleReviewer = () => {
    enterReviewerMode();
    // 심사관도 회원 정보 미저장 — 이전 로그인 사용자가 남긴 입력좌표 blob 제거.
    localStorage.removeItem(DIAGNOSIS_PERSIST_KEY);
    // CMD-AUTH-004 — 진입 이벤트 기록(Sentry 미초기화 시 silent no-op).
    Sentry.captureMessage("reviewer_mode_entered", "info");
    pushToast({
      variant: "default",
      message:
        "👨‍💻 심사관 전용 데모 모드로 접속했습니다. (테스트 데이터는 회원 정보에 저장되지 않아요.)",
    });
    router.push("/diagnosis");
  };

  const isBusy = inFlight !== null;

  return (
    <div className="space-y-s-3">
      {/* ★ #24 심사관 진입 — 최상단 강조 버튼. navy(primary) 톤 융화 + 좌측 accent. */}
      <button
        type="button"
        onClick={handleReviewer}
        disabled={isBusy}
        className={cn(
          "w-full rounded-md border-2 border-primary bg-primary/[0.04] px-s-4 py-s-3 text-left",
          "transition-all hover:bg-primary/[0.08] disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
      >
        <span className="block text-body-sm font-bold text-primary">
          👨‍💻 채용 담당자 · 심사관이신가요?
        </span>
        <span className="mt-0.5 block text-caption text-ink-2">
          원클릭으로 풀버전 체험하기 (로그인 불필요)
        </span>
      </button>

      <div
        role="separator"
        aria-orientation="horizontal"
        className="flex items-center gap-s-3 py-s-1"
      >
        <span aria-hidden className="h-px flex-1 bg-line-2" />
        <span className="text-caption text-ink-3">일반 사용자</span>
        <span aria-hidden className="h-px flex-1 bg-line-2" />
      </div>

      <OAuthButton
        provider="kakao"
        onClick={handleKakao}
        loading={inFlight === "kakao"}
        disabled={isBusy && inFlight !== "kakao"}
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
