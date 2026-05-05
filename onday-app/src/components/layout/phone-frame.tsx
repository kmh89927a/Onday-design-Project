import * as React from "react";

import { cn } from "@/lib/utils";

// components-spec §01 PhoneFrame
//   데스크탑: 375×780 베젤 + 배경 그라디언트 + dynamic island + status bar + home indicator
//   모바일 (<768): 풀스크린, 베젤/island/home/status 모두 display:none
//   베젤은 aria-hidden — 실제 콘텐츠는 <main role="main">

const screenBgMap = {
  surface: "bg-surface",
  bg: "bg-bg",
  soft: "bg-surface-soft",
} as const;

interface PhoneFrameProps {
  children: React.ReactNode;
  statusBarTone?: "light" | "dark";
  screenBackground?: keyof typeof screenBgMap;
  screenLabel?: string;
  className?: string;
}

export function PhoneFrame({
  children,
  statusBarTone = "light",
  screenBackground = "surface",
  screenLabel,
  className,
}: PhoneFrameProps) {
  return (
    <div
      data-screen-label={screenLabel}
      className={cn(
        "md:grid md:min-h-screen md:place-items-center",
        "md:bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary-soft))_0%,_hsl(var(--bg))_60%)]",
        className,
      )}
    >
      <div
        className={cn(
          "relative w-full",
          "md:h-[780px] md:w-[375px] md:overflow-hidden md:rounded-phone md:bg-ink md:p-1.5",
          "md:shadow-[0_40px_80px_rgba(0,0,0,0.45)]",
        )}
      >
        <div
          aria-hidden
          className="hidden md:absolute md:left-1/2 md:top-2 md:z-10 md:block md:h-7 md:w-28 md:-translate-x-1/2 md:rounded-full md:bg-black"
        />
        <div
          className={cn(
            "min-h-screen w-full",
            "md:relative md:h-full md:min-h-0 md:overflow-y-auto md:rounded-[36px]",
            screenBgMap[screenBackground],
          )}
        >
          <div
            aria-hidden
            className={cn(
              "hidden md:flex md:items-center md:justify-between md:px-s-5 md:pt-s-3 md:pb-s-1 md:text-caption md:font-bold md:tabular",
              statusBarTone === "dark" ? "md:text-white" : "md:text-ink",
            )}
          >
            <span>9:41</span>
            <span className="md:flex md:items-center md:gap-1">
              <SignalIcon />
              <BatteryIcon />
            </span>
          </div>
          <main role="main" className="relative">
            {children}
          </main>
        </div>
        <div
          aria-hidden
          className="hidden md:absolute md:bottom-2 md:left-1/2 md:block md:h-1 md:w-32 md:-translate-x-1/2 md:rounded-full md:bg-white/80"
        />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="0.5" />
      <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg
      width="22"
      height="11"
      viewBox="0 0 22 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
    >
      <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" />
      <rect x="2" y="2" width="15" height="7" rx="1" fill="currentColor" />
      <path d="M20 4v3" strokeLinecap="round" />
    </svg>
  );
}
