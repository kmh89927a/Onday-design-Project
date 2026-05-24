"use client";

import * as React from "react";
import Script from "next/script";
import { Map, MapMarker } from "react-kakao-maps-sdk";

import type { Coordinate } from "@/lib/types";
import { cn } from "@/lib/utils";

// Kakao Maps SDK 실 통합 (Issue #104, Q3-b next/dynamic + ssr:false 패턴).
// map-canvas.tsx 의 dynamic import 대상 (key 박힘 시점만 로드).
// SDK script 로드 → kakao.maps.load → Map/MapMarker 박힘.

declare global {
  interface Window {
    kakao: { maps: { load: (cb: () => void) => void } };
  }
}

interface KakaoMarker {
  id: string;
  coordinate: Coordinate;
  label: string;
  selected?: boolean;
  rank?: number;
}

interface MapCanvasKakaoProps {
  appKey: string;
  markers: KakaoMarker[];
  height: number;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

const SEOUL_CENTER: Coordinate = { lat: 37.5665, lng: 126.978 };

export default function MapCanvasKakao({
  appKey,
  markers,
  height,
  onMarkerClick,
  className,
}: MapCanvasKakaoProps) {
  const [ready, setReady] = React.useState(false);

  const center = React.useMemo<Coordinate>(() => {
    if (markers.length === 0) return SEOUL_CENTER;
    const sum = markers.reduce(
      (acc, m) => ({
        lat: acc.lat + m.coordinate.lat,
        lng: acc.lng + m.coordinate.lng,
      }),
      { lat: 0, lng: 0 },
    );
    return { lat: sum.lat / markers.length, lng: sum.lng / markers.length };
  }, [markers]);

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${appKey}`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(() => setReady(true))}
      />
      {ready ? (
        <Map
          center={center}
          style={{ width: "100%", height: `${height}px` }}
          level={5}
          aria-label="후보 동네 지도"
          className={cn("rounded-lg", className)}
        >
          {markers.map((m) => (
            <MapMarker
              key={m.id}
              position={m.coordinate}
              title={`${m.rank ? `${m.rank}. ` : ""}${m.label}`}
              clickable
              onClick={() => onMarkerClick?.(m.id)}
            />
          ))}
        </Map>
      ) : (
        <div
          role="status"
          aria-label="지도 로딩 중"
          className={cn(
            "flex items-center justify-center rounded-lg border border-card-border bg-[#E5EAF2] text-caption text-ink-3",
            className,
          )}
          style={{ height }}
        >
          지도를 불러오는 중…
        </div>
      )}
    </>
  );
}
