import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// components-spec §16 Stat (Tile) + design-tokens §6.7
//   tile : bg-bg · radius 8 · padding 6/8 · label 10/600 ink-3 / value 12/800 ink (-0.02em)
//   metric : 가로 분할 · 가운데 정렬 · 인접 시 좌측 보더(line-2) — detail 전용
//   접근성: <dl> + <dt>(label) + <dd>(value)

const statVariants = cva("flex min-w-0 flex-col", {
  variants: {
    variant: {
      tile: "items-start rounded-md bg-bg px-s-2 py-1.5 text-left",
      metric:
        "items-center px-s-3 py-s-2 text-center [&+&]:border-l [&+&]:border-line-2",
    },
    align: {
      left: "items-start text-left",
      center: "items-center text-center",
    },
  },
  defaultVariants: { variant: "tile" },
});

interface StatProps extends VariantProps<typeof statVariants> {
  label: string;
  value: React.ReactNode;
  /** value 옆 보조 단위 (detail metric 의 84㎡ 등) */
  sub?: string;
  className?: string;
}

function Stat({
  label,
  value,
  sub,
  variant = "tile",
  align,
  className,
}: StatProps) {
  return (
    <dl
      data-slot="stat"
      className={cn(statVariants({ variant, align }), className)}
    >
      <dt className="text-[10px] font-semibold leading-tight text-ink-3">
        {label}
      </dt>
      <dd className="tabular text-caption font-extrabold leading-snug tracking-[-0.02em] text-ink">
        {value}
        {sub && (
          <span className="ml-1 text-caption-xs font-bold text-ink-3">
            {sub}
          </span>
        )}
      </dd>
    </dl>
  );
}

export { Stat, statVariants, type StatProps };
