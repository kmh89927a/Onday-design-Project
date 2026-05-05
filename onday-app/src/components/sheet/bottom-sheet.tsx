"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// components-spec §24 BottomSheet
//   open/onClose, showHandle (default true), showFloatingClose (default true),
//   dismissOnBackdrop (default true), height 'auto' | number | 'full', ariaLabel
//   진입: translateY 100→0 + 280ms cubic-bezier(.32,.72,0,1)
//   백드롭: opacity 0→1 + 220ms / role=dialog aria-modal=true
//   ≥768 데스크탑은 동일하게 bottom 시트 (PhoneFrame 안에서 사용)

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  showHandle?: boolean;
  showFloatingClose?: boolean;
  dismissOnBackdrop?: boolean;
  height?: "auto" | number | "full";
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  ariaLabel,
  showHandle = true,
  showFloatingClose = true,
  dismissOnBackdrop = true,
  height = "auto",
  children,
  className,
}: BottomSheetProps) {
  const heightStyle =
    height === "auto"
      ? undefined
      : height === "full"
        ? { height: "90vh" }
        : { height };

  return (
    <SheetPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      disablePointerDismissal={!dismissOnBackdrop}
    >
      <SheetPrimitive.Portal>
        <SheetPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-sheet-backdrop bg-ink/45",
            "transition-opacity duration-220 ease-out",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <SheetPrimitive.Popup
          aria-label={ariaLabel}
          style={heightStyle}
          className={cn(
            "fixed inset-x-0 bottom-0 z-sheet flex max-h-[90vh] flex-col",
            "rounded-t-3xl bg-surface shadow-sheet",
            "duration-280 ease-sheet",
            "data-ending-style:translate-y-full data-starting-style:translate-y-full",
            "px-s-5 pt-s-3 pb-[calc(theme(spacing.s-7)+env(safe-area-inset-bottom))]",
            className,
          )}
        >
          {showHandle && (
            <div
              aria-hidden
              className="mx-auto mb-s-3 h-1 w-9 rounded-xs bg-line"
            />
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {showFloatingClose && (
            <SheetPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-s-3 top-s-3 size-9 rounded-3xl bg-surface text-ink shadow-floating hover:bg-bg"
                />
              }
            >
              <XIcon />
              <span className="sr-only">닫기</span>
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Popup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
