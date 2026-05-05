import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// components-spec §13 Pill / Badge + design-tokens §6.4
//   variant: default(primary-soft) / solid / ok / neutral / danger / warning
//   size: sm(default 4/8 padding) / xs(2/6 padding)
//   확장: secondary / info / outline / destructive(=danger 별칭) / grade-a~d (야간 안전등급)
//   야간 안전등급은 letter + label + 색 3중 표기 — color 단독 금지

const badgeVariants = cva(
  cn(
    "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden",
    "rounded-sm border border-transparent font-bold leading-tight whitespace-nowrap transition-all",
    "focus-visible:ring-2 focus-visible:ring-primary/40",
    "[&>svg]:pointer-events-none [&>svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default: "bg-primary-soft text-primary",
        solid: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        ok: "bg-success-soft text-success",
        info: "bg-info-soft text-info",
        warning: "bg-warning-soft text-warning",
        neutral: "bg-bg text-ink-2",
        danger: "bg-danger-soft text-danger",
        destructive: "bg-danger-soft text-danger",
        outline: "border-card-border text-ink-2 bg-surface",
        "grade-a": "bg-[hsl(152_76%_90%)] text-[hsl(161_94%_24%)]",
        "grade-b": "bg-[hsl(213_97%_87%)] text-[hsl(224_76%_48%)]",
        "grade-c": "bg-[hsl(48_96%_89%)] text-[hsl(35_92%_33%)]",
        "grade-d": "bg-[hsl(0_93%_94%)] text-[hsl(0_74%_42%)]",
      },
      size: {
        sm: "px-s-2 py-s-1 text-caption-xs [&>svg]:size-3",
        xs: "px-1.5 py-0.5 text-[10px] tracking-wide [&>svg]:size-2.5",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

interface BadgeProps
  extends useRender.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  leading?: React.ReactNode;
}

function Badge({
  className,
  variant = "default",
  size = "sm",
  leading,
  children,
  render,
  ...props
}: BadgeProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
        children: (
          <>
            {leading}
            {children}
          </>
        ),
      },
      props,
    ),
    render,
    state: { slot: "badge", variant, size },
  });
}

export { Badge, badgeVariants, type BadgeProps };
