"use client";

import * as React from "react";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";

import type { Coordinate } from "@/lib/types";
import { cn } from "@/lib/utils";

// react-kakao-maps-sdk 공식 useKakaoLoader 훅으로 SDK 로드.
// ★ 기존 next/script + onLoad 방식은 dynamic import(ssr:false) 안에서 onLoad가 안 불려
//   sdk.js 요청 자체가 발생하지 않았음(Network 0건 확인). 훅은 자체 스크립트 주입 +
//   autoload + ready 관리라 그 문제를 회피한다.

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
  /** SDK 로드 실패/타임아웃 시 호출 — 부모(MapCanvas)가 SVG fallback으로 전환 */
  onFail?: () => void;
}

const SEOUL_CENTER: Coordinate = { lat: 37.5665, lng: 126.978 };

// 로드가 끝나지 않을 때 무한 스피너 방지 안전망 (ms).
const SDK_LOAD_TIMEOUT_MS = 6000;

export default function MapCanvasKakao({
  appKey,
  markers,
  height,
  onMarkerClick,
  className,
  onFail,
}: MapCanvasKakaoProps) {
  const [loading, error] = useKakaoLoader({ appkey: appKey });

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

  // 로드 에러 시 부모가 SVG fallback으로 전환.
  React.useEffect(() => {
    if (error) onFail?.();
  }, [error, onFail]);

  // 안전망 — 로딩이 타임아웃 넘게 안 끝나면 fallback.
  React.useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => onFail?.(), SDK_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading, onFail]);

  if (loading) {
    return (
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
    );
  }

  return (
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
  );
}
