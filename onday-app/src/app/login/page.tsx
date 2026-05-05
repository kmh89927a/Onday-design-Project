import type { Metadata } from "next";
import { Shield } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "로그인 — 온데이",
  description:
    "두 사람의 출퇴근, 가장 합리적인 동네는? 카카오 · 네이버 계정으로 간편 로그인하고 진단을 시작하세요.",
};

export default function LoginPage() {
  return (
    <main
      className={[
        "mx-auto flex min-h-screen w-full max-w-md flex-col",
        "px-s-6 pt-s-8",
        "pb-[calc(env(safe-area-inset-bottom)+theme(spacing.s-6))]",
      ].join(" ")}
    >
      <header className="space-y-s-4">
        <Logo size="md" />

        <h1 className="text-h2 font-extrabold leading-snug tracking-[-0.03em] text-ink">
          두 사람의 출퇴근,
          <br />
          가장 합리적인 동네는?
        </h1>

        <p className="text-body text-ink-3">
          직장 두 곳을 입력하면 통근 동선이
          <br />
          만나는 후보 동네를 지도 위에 보여드려요.
        </p>

        <div
          role="note"
          className="flex items-start gap-s-2 rounded-lg bg-bg p-s-4 text-body-sm text-ink-2"
        >
          <Shield aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3" />
          <span>
            카카오 모빌리티 · 국가공간정보포털 데이터 기반
            <br />
            <span className="text-caption text-ink-3">
              회원가입 없이 체험할 수 있어요
            </span>
          </span>
        </div>
      </header>

      <div aria-hidden className="flex-1" />

      <LoginForm />
    </main>
  );
}
