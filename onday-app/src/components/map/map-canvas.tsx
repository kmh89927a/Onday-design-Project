"use client";

import * as React from "react";

import { MapMarker } from "@/components/map/map-marker";
import { cn } from "@/lib/utils";

// components-spec §19 MapCanvas
//   placeholder SVG (격자+한강) / live(실 SDK) / dim(detail 시트 뒤 배경)
//   role="application" + aria-label="후보 동네 지도"
//   default height 320

interface MarkerInput {
  id: string;
  label: string;
  position: { x: number; y: number };
  selected?: boolean;
  rank?: number;
}

interface MapCanvasProps {
  markers: MarkerInput[];
  placeholder?: boolean;
  height?: number;
  topRightSlot?: React.ReactNode;
  bottomRightSlot?: React.ReactNode;
  dim?: boolean;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

export function MapCanvas({
  markers,
  placeholder = true,
  height = 320,
  topRightSlot,
  bottomRightSlot,
  dim,
  onMarkerClick,
  className,
}: MapCanvasProps) {
  return (
    <div
      role="application"
      aria-label="후보 동네 지도"
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-card-border bg-[#E5EAF2]",
        className,
      )}
      style={{ height }}
    >
      {placeholder && (
        <svg
          viewBox="0 0 375 320"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <pattern
              id="map-grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          {/* 격자 + 한강 = 시각 장식, 스크린리더 무시 */}
          <rect aria-hidden width="375" height="320" fill="url(#map-grid)" />
          <path
            aria-hidden
            d="M -20 220 Q 90 180 180 200 T 400 180 L 400 250 Q 280 270 180 240 T -20 270 Z"
            fill="#B6D6F2"
            opacity="0.85"
          />
          {/* 마커 = 시맨틱 (각 마커 g에 role=button + aria-label) */}
          {markers.map((m) => (
            <MapMarker
              key={m.id}
              label={m.label}
              position={m.position}
              selected={m.selected}
              rank={m.rank}
              onClick={() => onMarkerClick?.(m.id)}
            />
          ))}
        </svg>
      )}
      {topRightSlot && (
        <div className="absolute right-s-3 top-s-3">{topRightSlot}</div>
      )}
      {bottomRightSlot && (
        <div className="absolute bottom-s-3 right-s-3">{bottomRightSlot}</div>
      )}
      {dim && (
        <div
          aria-hidden
          className="absolute inset-0 bg-ink/45"
        />
      )}
    </div>
  );
}
