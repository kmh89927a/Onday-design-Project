import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// components-spec §04 Button + design-tokens §6.1
//   variant: primary(default) / outline / ghost / destructive / kakao / naver / secondary
//   size: sm 36/10/12 · md(default) 52/14/16 · lg 44/12/13 (single-foot 변형)
//   single-foot: lg + card border/shadow (single 페이지 footer)
//   loading: leading→spinner, aria-busy, click 차단
//   disabled: primary 한정 bg-disabled, 그 외 opacity-50

const buttonVariants = cva(
  cn(
    "group/button inline-flex shrink-0 items-center justify-center gap-s-2 whitespace-nowrap font-bold",
    "transition-all duration-120 outline-none select-none",
    "active:translate-y-px",
    "disabled:pointer-events-none aria-busy:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-95 disabled:bg-[hsl(220_30%_84%)] disabled:text-white",
        outline:
          "bg-surface text-ink border border-card-border hover:bg-surface-soft disabled:opacity-50",
        ghost:
          "bg-transparent text-ink-2 hover:bg-surface-soft disabled:opacity-50",
        destructive:
          "bg-danger text-white hover:brightness-95 disabled:opacity-50",
        secondary:
          "bg-secondary text-secondary-foreground hover:brightness-95 disabled:opacity-50",
        kakao:
          "bg-oauth-kakao text-oauth-kakao-ink hover:brightness-95 disabled:opacity-50",
        naver:
          "bg-oauth-naver text-oauth-naver-ink hover:brightness-95 disabled:opacity-50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // md (default): 52/14/16
        default: "h-[52px] rounded-2xl px-[18px] text-base",
        md: "h-[52px] rounded-2xl px-[18px] text-base",
        // sm: 36/10/12
        sm: "h-9 rounded-lg px-3 text-xs",
        // lg: 44/12/13 (single-foot 변형 사이즈)
        lg: "h-11 rounded-lg px-3.5 text-[13px]",
        // single-foot: lg + card border + shadow (single 페이지 footer 전용)
        "single-foot":
          "h-11 rounded-lg px-3.5 text-[13px] border border-card-border bg-surface text-ink shadow-card",
        icon: "size-[52px] rounded-2xl",
        "icon-sm": "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonExtraProps {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> &
  ButtonExtraProps;

function Button({
  className,
  variant = "default",
  size = "default",
  leading,
  trailing,
  loading,
  fullWidth,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isInactive = Boolean(disabled || loading);
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={isInactive}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        leading
      )}
      {children}
      {!loading && trailing}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants, type ButtonProps };
