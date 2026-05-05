"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

// components-spec §02 AppHeader
//   height 48 / padding 0 12 / 좌측 back · 가운데 title · 우측 trailing
//   <header role="banner">, 뒤로가기 IconButton aria-label="이전"
//   variant: back-only / back+trailing / back+title+trailing

interface AppHeaderProps {
  onBack?: () => void;
  backHref?: string;
  backAriaLabel?: string;
  title?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  onBack,
  backHref,
  backAriaLabel = "이전",
  title,
  trailing,
  className,
}: AppHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (backHref ? undefined : () => router.back());
  return (
    <header
      role="banner"
      className={cn(
        "flex h-12 items-center gap-s-2 px-s-3",
        "bg-surface",
        className,
      )}
    >
      <div className="flex shrink-0 items-center">
        <IconButton
          icon={<ChevronLeft />}
          ariaLabel={backAriaLabel}
          href={backHref}
          onClick={handleBack}
        />
      </div>
      {title && (
        <h1 className="min-w-0 flex-1 truncate text-center text-title font-bold text-ink">
          {title}
        </h1>
      )}
      {!title && <div className="flex-1" />}
      <div className="flex shrink-0 items-center gap-1">{trailing}</div>
    </header>
  );
}
