"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// components-spec §18 MapMarker
//   SVG <g role="button">. default fill 흰 + stroke primary, selected fill primary
//   hover r 16 (확대), focus 3px stroke + outline 2px primary
//   text는 aria-hidden, aria-label 종합 ("마포, 점수 92점, 1위")

interface MapMarkerProps {
  id?: string;
  label: string;
  position: { x: number; y: number };
  selected?: boolean;
  rank?: number;
  ariaLabel?: string;
  onClick?: () => void;
}

export function MapMarker({
  label,
  position,
  selected,
  rank,
  ariaLabel,
  onClick,
}: MapMarkerProps) {
  const aria =
    ariaLabel ??
    `${label}${rank ? `, 추천 ${rank}위` : ""}${selected ? " (선택됨)" : ""}`;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={aria}
      aria-pressed={selected || undefined}
      transform={`translate(${position.x},${position.y})`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="cursor-pointer outline-none focus-visible:[&>circle]:stroke-[3]"
    >
      {/* 추천지역 = 통일 회색 (직장 파랑/주황과 구분). 선택 시만 진한 회색으로 강조. */}
      <circle
        r="14"
        className={cn(
          "transition-all stroke-white stroke-[2] hover:[r:16]",
          selected ? "fill-ink" : "fill-ink-3",
        )}
      />
      {/* 원 안 = 순위 숫자 (점수 순 1~N). */}
      <text
        aria-hidden
        textAnchor="middle"
        dominantBaseline="central"
        className="pointer-events-none fill-white text-[11px] font-extrabold tracking-tight"
      >
        {rank ?? label}
      </text>
      {rank === 1 && (
        <g aria-hidden transform="translate(10,-10)">
          <circle r="6" className="fill-warning stroke-white stroke-[1]" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white text-[7px] font-extrabold"
          >
            1
          </text>
        </g>
      )}
    </g>
  );
}
