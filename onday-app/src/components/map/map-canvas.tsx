"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { MapMarker } from "@/components/map/map-marker";
import type { Coordinate } from "@/lib/types";
import { cn } from "@/lib/utils";

// components-spec §19 MapCanvas
//   placeholder SVG (격자+한강) / live(실 SDK) / dim(detail 시트 뒤 배경)
//   role="application" + aria-label="후보 동네 지도"
//   default height 320
// ★ Issue #104 UI-003 — env var NEXT_PUBLIC_KAKAO_MAP_KEY 분기 (Q3-a (b)):
//   key 박힘 시 → MapCanvasKakao (실 SDK, next/dynamic + ssr:false).
//   key 박힘 X 시 → 기존 SVG placeholder 보존 (fallback 정수, Vercel/local 양방향 정합).

const MapCanvasKakao = dynamic(() => import("./map-canvas-kakao"), {
  ssr: false,
});

interface MarkerInput {
  id: string;
  label: string;
  position: { x: number; y: number };
  coordinate?: Coordinate; // Issue #104 ㊇ — SDK mode lat/lng (svg mode 시 무시).
  selected?: boolean;
  rank?: number;
}

// A-1 (#졸업) — 직장 마커 + 후보→직장 직선 연결선. position(SVG)+coordinate(SDK) 둘 다 보유.
export interface MapWorkplace {
  id: string;
  label: string; // "내 직장" / "배우자 직장"
  short: string; // SVG 뱃지용 "A" / "B"
  position: { x: number; y: number };
  coordinate?: Coordinate;
  variant: "a" | "b";
}
// points ≥2. dashed=true → 직선 추정(A-1) / false → 실 도로 경로(A-2 Kakao vertexes).
export interface MapLine {
  id: string;
  points: { position: { x: number; y: number }; coordinate?: Coordinate }[];
  variant: "a" | "b";
  dashed?: boolean;
}

const LINE_STROKE: Record<"a" | "b", string> = {
  a: "stroke-primary",
  b: "stroke-warning",
};
const WORKPLACE_FILL: Record<"a" | "b", string> = {
  a: "fill-primary",
  b: "fill-warning",
};

interface MapCanvasProps {
  markers: MarkerInput[];
  workplaces?: MapWorkplace[];
  lines?: MapLine[];
  /** B — true면 전체 마커 기준 줌(DetailSheet). 기본=직장 A·B 기준(메인 맵). */
  fitAll?: boolean;
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
  workplaces = [],
  lines = [],
  fitAll = false,
  placeholder = true,
  height = 320,
  topRightSlot,
  bottomRightSlot,
  dim,
  onMarkerClick,
  className,
}: MapCanvasProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  // SDK 로드 실패(도메인 미등록 등) 시 SVG placeholder로 degrade — 무한 스피너 방지.
  const [sdkFailed, setSdkFailed] = React.useState(false);
  const handleSdkFail = React.useCallback(() => setSdkFailed(true), []);
  const useSdk = Boolean(appKey) && placeholder !== false && !sdkFailed;
  const kakaoMarkers = React.useMemo(
    () =>
      markers
        .filter((m): m is MarkerInput & { coordinate: Coordinate } =>
          Boolean(m.coordinate),
        )
        .map((m) => ({
          id: m.id,
          coordinate: m.coordinate,
          label: m.label,
          selected: m.selected,
          rank: m.rank,
        })),
    [markers],
  );

  // SDK 모드 — 좌표 있는 직장 마커 + 양끝 좌표 있는 연결선만 전달.
  const kakaoWorkplaces = React.useMemo(
    () =>
      workplaces
        .filter((w): w is MapWorkplace & { coordinate: Coordinate } =>
          Boolean(w.coordinate),
        )
        .map((w) => ({
          id: w.id,
          coordinate: w.coordinate,
          label: w.label,
          variant: w.variant,
        })),
    [workplaces],
  );
  const kakaoLines = React.useMemo(
    () =>
      lines
        .filter((l) => l.points.length >= 2 && l.points.every((p) => p.coordinate))
        .map((l) => ({
          id: l.id,
          path: l.points.map((p) => p.coordinate as Coordinate),
          variant: l.variant,
          dashed: l.dashed ?? false,
        })),
    [lines],
  );

  if (useSdk && kakaoMarkers.length === markers.length) {
    return (
      <div
        role="application"
        aria-label="후보 동네 지도"
        className={cn("relative w-full overflow-hidden", className)}
        style={{ height }}
      >
        <MapCanvasKakao
          appKey={appKey as string}
          markers={kakaoMarkers}
          workplaces={kakaoWorkplaces}
          lines={kakaoLines}
          fitAll={fitAll}
          height={height}
          onMarkerClick={onMarkerClick}
          onFail={handleSdkFail}
        />
        {topRightSlot && (
          <div className="absolute right-s-3 top-s-3 z-10">{topRightSlot}</div>
        )}
        {bottomRightSlot && (
          <div className="absolute bottom-s-3 right-s-3 z-10">
            {bottomRightSlot}
          </div>
        )}
        {dim && <div aria-hidden className="absolute inset-0 bg-ink/45 z-10" />}
      </div>
    );
  }

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
          {/* A-1/A-2 — 후보→직장 경로선 (점선=직선 추정 / 실선=실 도로). 마커보다 먼저 = 아래 깔림. */}
          {lines.map((l) => (
            <polyline
              key={l.id}
              aria-hidden
              points={l.points.map((p) => `${p.position.x},${p.position.y}`).join(" ")}
              fill="none"
              strokeWidth="2"
              strokeDasharray={l.dashed ? "5 4" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(LINE_STROKE[l.variant], "opacity-70")}
            />
          ))}
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
          {/* A-1 — 직장 A·B 마커 (둥근 사각 + A/B 뱃지 + 선 색 맞춘 라벨, 후보 원형과 구분). */}
          {workplaces.map((w) => (
            <g
              key={w.id}
              aria-label={w.label}
              transform={`translate(${w.position.x},${w.position.y})`}
            >
              <rect
                x="-13"
                y="-13"
                width="26"
                height="26"
                rx="7"
                className={cn(WORKPLACE_FILL[w.variant], "stroke-white stroke-[2]")}
              />
              <text
                aria-hidden
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none fill-white text-[11px] font-extrabold"
              >
                {w.short}
              </text>
              {/* 선 색과 맞춘 라벨 — 흰 외곽선(paint-order:stroke)으로 지도 위 가독성 확보. */}
              <text
                aria-hidden
                y="26"
                textAnchor="middle"
                dominantBaseline="central"
                stroke="white"
                strokeWidth="3"
                style={{ paintOrder: "stroke" }}
                className={cn(
                  WORKPLACE_FILL[w.variant],
                  "pointer-events-none text-[10px] font-extrabold",
                )}
              >
                {w.label}
              </text>
            </g>
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
