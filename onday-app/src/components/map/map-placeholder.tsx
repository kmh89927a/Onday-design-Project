"use client";

import type { Coordinate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MapPlaceholderProps {
  center?: Coordinate;
  markers?: { coordinate: Coordinate; label: string }[];
  className?: string;
}

export function MapPlaceholder({ center, markers, className }: MapPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-3/30 bg-surface-soft",
        "min-h-[200px]",
        className,
      )}
    >
      <div className="text-h3 text-ink-3">지도 영역</div>
      <p className="mt-s-1 text-caption text-ink-3">
        MVP에서는 react-kakao-maps-sdk로 대체됩니다
      </p>
      {center && (
        <p className="mt-s-2 text-caption-xs text-ink-3">
          중심: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
        </p>
      )}
      {markers && markers.length > 0 && (
        <div className="mt-s-2 flex flex-wrap justify-center gap-s-1">
          {markers.map((m, i) => (
            <span
              key={i}
              className="rounded-chip bg-primary-soft px-s-2 py-s-1 text-caption-xs text-primary"
            >
              {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
