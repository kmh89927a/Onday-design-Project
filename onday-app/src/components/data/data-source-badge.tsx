import * as React from "react";

import { cn } from "@/lib/utils";

// components-spec §14 DataSourceBadge
//   kind: official(녹) / aggregated(파) / estimate(노) — dot 색만 다름
//   컨테이너: rgba(255,255,255,0.14) — share hero(어두운 배경) 위
//   role="img" + aria-label 종합

const DOT_COLORS = {
  official: "bg-success",
  aggregated: "bg-info",
  estimate: "bg-warning",
} as const;

const KIND_LABELS = {
  official: "공식 출처",
  aggregated: "집계 데이터",
  estimate: "추정치",
} as const;

interface DataSourceBadgeProps {
  kind: keyof typeof DOT_COLORS;
  source: string;
  updatedAt: string;
  /** 어두운 배경(hero) 위 / 라이트 배경 둘 다 지원 */
  tone?: "on-dark" | "on-light";
  className?: string;
}

export function DataSourceBadge({
  kind,
  source,
  updatedAt,
  tone = "on-dark",
  className,
}: DataSourceBadgeProps) {
  return (
    <span
      role="img"
      aria-label={`${KIND_LABELS[kind]}: ${source} 갱신일 ${updatedAt}`}
      className={cn(
        "inline-flex w-fit items-center gap-1.5",
        // on-dark(공유 hero): 기존 chip 스타일·크기(caption-xs 11px) 유지.
        // on-light(결과 화면): 보조 정보라 조용히 — 테두리·배경 제거 + ink-3 + 일반 굵기 +
        //   글씨 한 단계 더 작게(10px) 위계 더 낮춤. (caption-xs 아래 토큰 없어 scoped 10px.)
        tone === "on-dark"
          ? "rounded-sm bg-white/15 px-s-2 py-1 text-caption-xs font-bold text-white backdrop-blur-sm"
          : "text-[10px] font-medium leading-[14px] text-ink-3",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1 rounded-full opacity-60", DOT_COLORS[kind])}
      />
      <span>{source}</span>
      <span className="opacity-70">· {updatedAt}</span>
    </span>
  );
}
