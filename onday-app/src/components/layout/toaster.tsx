"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

import { useUIStore, type Toast, type ToastVariant } from "@/stores/ui";
import { cn } from "@/lib/utils";

// 글로벌 Toast 컨테이너
//   useUIStore.toasts 구독 → 자동 dismiss(3초) + 수동 닫기
//   z-toast (120) — Sheet/Dialog 위
//   포지션: 화면 상단 중앙 (top + safe-area)
//   role=region/aria-live=polite — 스크린리더 자동 알림

const AUTO_DISMISS_MS = 3000;

const VARIANT_ICONS: Record<
  ToastVariant,
  React.ComponentType<{ className?: string }>
> = {
  default: Info,
  ok: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "border-card-border bg-surface text-ink",
  ok: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
};

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div
      role="region"
      aria-label="알림"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 z-toast flex flex-col items-center gap-s-2 px-s-4",
        "top-[calc(env(safe-area-inset-top)+theme(spacing.s-3))]",
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUIStore((s) => s.dismissToast);
  const Icon = VARIANT_ICONS[toast.variant];

  React.useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [dismiss, toast.id]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-center gap-s-2",
        "rounded-lg border px-s-4 py-s-3 shadow-floating",
        "animate-modal-in",
        VARIANT_STYLES[toast.variant],
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <p className="min-w-0 flex-1 text-body-sm font-bold">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="알림 닫기"
        className="-m-1 shrink-0 rounded-sm p-1 transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-1"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
