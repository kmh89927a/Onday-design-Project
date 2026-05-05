import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// design-tokens §6.8 Logo Mark
//   28×28 / radius 8 / gradient 135deg #2563EB → #4F8CFF / shadow-logo
//   텍스트 "동네궁합" extra-bold + tracking -0.02em
//   variant size sm/md/lg — md(28px)가 디자인 토큰 정 사양

const containerVariants = cva("inline-flex items-center", {
  variants: {
    size: {
      sm: "gap-1.5",
      md: "gap-s-2",
      lg: "gap-s-3",
    },
  },
  defaultVariants: { size: "md" },
});

const markVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center rounded-md shadow-logo",
    "bg-gradient-to-br from-primary to-[#4F8CFF]",
  ),
  {
    variants: {
      size: {
        sm: "size-6",
        md: "size-7", // 28px — 디자인 토큰 spec
        lg: "size-10",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const textVariants = cva("font-extrabold tracking-[-0.02em] text-ink", {
  variants: {
    size: {
      sm: "text-body-sm",
      md: "text-title",
      lg: "text-h4",
    },
  },
  defaultVariants: { size: "md" },
});

interface LogoProps extends VariantProps<typeof containerVariants> {
  /** 텍스트 노출 (default true) — false 시 mark만 */
  showText?: boolean;
  /** 텍스트 — default "동네궁합" */
  text?: string;
  className?: string;
}

export function Logo({
  size = "md",
  showText = true,
  text = "동네궁합",
  className,
}: LogoProps) {
  return (
    <span className={cn(containerVariants({ size }), className)}>
      <span aria-hidden className={markVariants({ size })}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="size-3/5"
        >
          <path
            d="M5 14l7-7 7 7M8 14v6h8v-6"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11" r="1.6" fill="#fff" />
        </svg>
      </span>
      {showText && <span className={textVariants({ size })}>{text}</span>}
    </span>
  );
}
