"use client";

import * as React from "react";
import {
  CustomOverlayMap,
  Map,
  Polyline,
  useKakaoLoader,
} from "react-kakao-maps-sdk";

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

// A-1 (#졸업) — 직장 마커 + 직선 연결선. A=primary(파랑) / B=warning(주황).
interface KakaoWorkplace {
  id: string;
  coordinate: Coordinate;
  label: string;
  variant: "a" | "b";
}
interface KakaoLine {
  id: string;
  path: Coordinate[];
  variant: "a" | "b";
  dashed?: boolean; // true=직선 추정(A-1) / false=실 도로(A-2)
}

const LINE_COLOR: Record<"a" | "b", string> = {
  a: "#2563EB", // primary
  b: "#F59E0B", // warning
};

interface MapCanvasKakaoProps {
  appKey: string;
  markers: KakaoMarker[];
  height: number;
  onMarkerClick?: (id: string) => void;
  className?: string;
  /** A-1 — 직장 A·B 마커 (추천지역 마커와 별개). */
  workplaces?: KakaoWorkplace[];
  /** A-1 — 후보→직장 직선 연결선 (직선 추정 = 점선). */
  lines?: KakaoLine[];
  /** B — true면 전체 마커(추천+직장) 기준 fit (DetailSheet). 기본=직장 A·B 기준 (메인 맵). */
  fitAll?: boolean;
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
  workplaces = [],
  lines = [],
  fitAll = false,
  onFail,
}: MapCanvasKakaoProps) {
  const [loading, error] = useKakaoLoader({ appkey: appKey });

  // 후보 + 직장 마커를 모두 감싸도록 center 계산 (직장이 화면 밖으로 잘리지 않게).
  const center = React.useMemo<Coordinate>(() => {
    const coords = [
      ...markers.map((m) => m.coordinate),
      ...workplaces.map((w) => w.coordinate),
    ];
    if (coords.length === 0) return SEOUL_CENTER;
    const sum = coords.reduce(
      (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }),
      { lat: 0, lng: 0 },
    );
    return { lat: sum.lat / coords.length, lng: sum.lng / coords.length };
  }, [markers, workplaces]);

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

  // map 인스턴스 — onCreate 로 받아 useEffect 에서 제어 (sdk 권장 패턴).
  const [mapInstance, setMapInstance] = React.useState<kakao.maps.Map | null>(
    null,
  );

  // fit 기준 좌표 — fitAll(시트)=전체 / 기본(메인)=직장 A·B (single은 전체 fallback).
  //   좌표값 key 로 카드 선택 시 재줌 방지.
  const allCoords = [
    ...markers.map((m) => m.coordinate),
    ...workplaces.map((w) => w.coordinate),
  ];
  const fitCoords =
    !fitAll && workplaces.length >= 2
      ? workplaces.map((w) => w.coordinate)
      : allCoords;
  const fitKey = fitCoords.map((c) => `${c.lat},${c.lng}`).join("|");

  // A-2 — 처음 로드 시 두 직장이 한눈에 들어오도록 자동 줌 맞춤.
  //   ★ onCreate 직후 setBounds 는 컨테이너 크기 미확정 → 과도 줌인. map 준비 후
  //     requestAnimationFrame 으로 1프레임 미뤄 레이아웃 확정 후 relayout+setBounds.
  //   ★ deps=[mapInstance, fitKey] = 좌표값 변할 때만 (카드 선택=배열 identity만 변경 → 재줌 X).
  React.useEffect(() => {
    if (!mapInstance || !fitKey) return;
    const coords = fitKey.split("|").map((s) => {
      const [lat, lng] = s.split(",").map(Number);
      return { lat, lng };
    });
    if (coords.length < 2) return;
    // 시트(fitAll)=후보 더 잘 보이게 좁은 여백(35px) / 메인 맵=넉넉히(70px).
    const pad = fitAll ? 35 : 70;
    const raf = requestAnimationFrame(() => {
      const bounds = new kakao.maps.LatLngBounds();
      coords.forEach((c) => bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)));
      mapInstance.relayout();
      mapInstance.setBounds(bounds, pad, pad, pad, pad);
    });
    return () => cancelAnimationFrame(raf);
  }, [mapInstance, fitKey, fitAll]);

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
      onCreate={(map) => setMapInstance(map)}
    >
      {/* A-1 — 후보→직장 직선 연결선 (직선 추정 = 점선). 마커보다 먼저 그려 아래 깔림. */}
      {lines.map((l) => (
        <Polyline
          key={l.id}
          path={l.path}
          strokeWeight={l.dashed ? 3 : 5}
          strokeColor={LINE_COLOR[l.variant]}
          strokeOpacity={0.85}
          strokeStyle={l.dashed ? "shortdash" : "solid"}
        />
      ))}
      {/* 추천지역 마커 — 통일 회색 원 + 순위 숫자 (직장 파랑/주황과 구분). 1위=금색 테두리. */}
      {markers.map((m) => (
        <CustomOverlayMap
          key={m.id}
          position={m.coordinate}
          yAnchor={0.5}
          xAnchor={0.5}
        >
          <button
            type="button"
            onClick={() => onMarkerClick?.(m.id)}
            title={`추천 ${m.rank ?? "-"}위 ${m.label}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: m.selected ? "#1F2937" : "#6B7280",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              border: m.rank === 1 ? "2px solid #F59E0B" : "2px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              cursor: "pointer",
              padding: 0,
              lineHeight: "24px",
            }}
          >
            {m.rank ?? ""}
          </button>
        </CustomOverlayMap>
      ))}
      {/* A-1 — 직장 A·B 마커: 선 색과 맞춘 색상 라벨 pill (한눈에 내 직장/배우자 구분). */}
      {workplaces.map((w) => (
        <CustomOverlayMap
          key={w.id}
          position={w.coordinate}
          yAnchor={0.5}
          xAnchor={0.5}
        >
          <div
            style={{
              background: LINE_COLOR[w.variant],
              color: "#fff",
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              whiteSpace: "nowrap",
              border: "2px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            }}
          >
            {w.label}
          </div>
        </CustomOverlayMap>
      ))}
    </Map>
  );
}
