"use client";

import * as React from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

// components-spec §22 LockedCard
//   자식 콘텐츠 흐림(blur 8px default) + ink/45 오버레이 + 자물쇠 + 메시지
//   자식 aria-hidden=true / 래퍼 role=button + aria-label
//   키보드 포커스 가능

interface LockedCardProps {
  children: React.ReactNode;
  message?: string;
  blurStrength?: number;
  onUnlock?: () => void;
  className?: string;
}

export function LockedCard({
  children,
  message = "회원가입하면 전체 정보를 볼 수 있어요",
  blurStrength = 8,
  onUnlock,
  className,
}: LockedCardProps) {
  const interactive = Boolean(onUnlock);
  const Wrapper: React.ElementType = interactive ? "button" : "div";

  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      onClick={onUnlock}
      role={interactive ? "button" : undefined}
      aria-label={
        interactive ? `${message}, 클릭해 회원가입` : message
      }
      className={cn(
        "group relative block w-full overflow-hidden rounded-lg",
        interactive &&
          "cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        className,
      )}
    >
      <div
        aria-hidden
        style={{ filter: `blur(${blurStrength}px)`, opacity: 0.95 }}
        className="pointer-events-none select-none"
      >
        {children}
      </div>
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-s-2 bg-ink/45 px-s-4 text-center text-white transition-colors",
          interactive && "group-hover:bg-ink/55",
        )}
      >
        <span className="grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur-sm">
          <Lock className="size-5" aria-hidden />
        </span>
        <p className="text-body-sm font-bold leading-snug">{message}</p>
        {interactive && (
          <p className="text-caption-xs opacity-80">탭하여 잠금 해제</p>
        )}
      </div>
    </Wrapper>
  );
}
