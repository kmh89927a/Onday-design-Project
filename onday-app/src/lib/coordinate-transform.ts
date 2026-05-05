import type { Coordinate } from "@/lib/types";

// 서울 시역 bbox — 미래 city별 분기 시 이 표만 늘림
const SEOUL_BBOX = {
  latMin: 37.42,
  latMax: 37.7,
  lngMin: 126.76,
  lngMax: 127.18,
};

// MapCanvas SVG viewBox 와 동일
const VIEWBOX = { width: 375, height: 320 };
// 마커 r=14, 가장자리 클립 방지용 padding
const PAD = 18;

export function latLngToPixel(coord: Coordinate): { x: number; y: number } {
  const { lat, lng } = coord;
  const xRaw =
    ((lng - SEOUL_BBOX.lngMin) / (SEOUL_BBOX.lngMax - SEOUL_BBOX.lngMin)) *
    VIEWBOX.width;
  // lat은 큰 값이 위쪽 → y 반전
  const yRaw =
    ((SEOUL_BBOX.latMax - lat) / (SEOUL_BBOX.latMax - SEOUL_BBOX.latMin)) *
    VIEWBOX.height;
  return {
    x: Math.max(PAD, Math.min(VIEWBOX.width - PAD, xRaw)),
    y: Math.max(PAD, Math.min(VIEWBOX.height - PAD, yRaw)),
  };
}
