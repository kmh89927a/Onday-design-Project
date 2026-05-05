import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// components-spec §03 IconButton
//   40×40 정사각, 16~20px SVG, variant plain/bordered, aria-label 필수
//   focus-visible: 2px primary outline + 2px offset (globals.css 공통 + 자체 명시)
//   active: translateY(1px) / disabled: opacity 0.4

const iconButtonVariants = cva(
  cn(
    "inline-flex size-10 shrink-0 items-center justify-center rounded-md text-ink",
    "transition-colors duration-120 outline-none",
    "active:translate-y-px",
    "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ),
  {
    variants: {
      variant: {
        plain: "bg-transparent hover:bg-bg",
        bordered: "border border-card-border bg-surface hover:bg-bg",
      },
    },
    defaultVariants: { variant: "plain" },
  },
);

interface IconButtonProps extends VariantProps<typeof iconButtonVariants> {
  icon: React.ReactNode;
  ariaLabel: string;
  href?: string;
  onClick?: React.MouseEventHandler;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

function IconButton({
  variant = "plain",
  icon,
  ariaLabel,
  href,
  onClick,
  disabled,
  className,
  type = "button",
}: IconButtonProps) {
  const classes = cn(iconButtonVariants({ variant }), className);
  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        className={classes}
      >
        <span aria-hidden>{icon}</span>
      </a>
    );
  }
  return (
    <ButtonPrimitive
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      <span aria-hidden>{icon}</span>
    </ButtonPrimitive>
  );
}

export { IconButton, iconButtonVariants };
