import * as React from "react";

import { cn } from "@/lib/utils";

// components-spec §06 StickyCTABar
//   화면 하단 고정 CTA + hint
//   sticky bottom + padding 12 20 24 + safe-area-inset-bottom
//   bordered=true 시 상단 border-line

interface StickyCTABarProps {
  cta: React.ReactNode;
  hint?: React.ReactNode;
  bordered?: boolean;
  className?: string;
}

export function StickyCTABar({
  cta,
  hint,
  bordered = true,
  className,
}: StickyCTABarProps) {
  return (
    <footer
      role="contentinfo"
      className={cn(
        "sticky bottom-0 z-sticky bg-surface px-s-5 pt-s-3",
        "pb-[calc(theme(spacing.s-6)+env(safe-area-inset-bottom))]",
        bordered && "border-t border-line-2",
        className,
      )}
    >
      {cta}
      {hint && (
        <p className="mt-s-2 text-center text-caption text-ink-3">{hint}</p>
      )}
    </footer>
  );
}
