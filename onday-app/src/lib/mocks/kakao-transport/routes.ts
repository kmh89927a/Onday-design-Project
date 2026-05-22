// ──────────────────────────────────────────────
// MOCK-004 카카오 모빌리티 경로 fixture — 수도권 실재 경로 4 개 (★ 외부 도메인 첫 mock).
//
// ★ API-007 KakaoRoute / KakaoTransportResponse satisfies = Wave 2 체인 9 회째 입증
//   (★ external → MOCK 차원 신규 — Wave 2 첫 외부 도메인 fixture 활용).
//
// ★ Mismatch ①③ 자동 보정 (satisfies = adaptive § 외부 도메인+mock 차원 첫 적용):
//   ① KakaoCoord {x: 경도, y: 위도} — 명세 v1.0 lat/lng 정반대 (좌표계 정정).
//   ③ KakaoRouteSection.transportMode 3 종 ('transit' | 'car' | 'walk') — 명세 v1.0 'subway' / 'bus' → 'transit' 통합.
//
// ★ 결정론 가드 (Math.random / Date.now / new Date 0 건 = MOCK-001 / MOCK-002 표준 답습 3 회째).
// ──────────────────────────────────────────────

import type { KakaoRoute, KakaoTransportResponse } from '@/lib/external/kakao-transport';

// === 경로 1: 강남역 → 합정역 (대중교통, 환승 1 회) ===
// 합산 1560s = walk(180+120+180=480) + transit(720+360=1080) — TEST-002 AC-4 정합.
export const MOCK_ROUTE_GANGNAM_TO_HAPJEONG = {
  resultCode: 0,
  resultMsg: '성공',
  summary: {
    origin: { x: 127.0276, y: 37.4979, name: '강남역' },
    destination: { x: 126.9139, y: 37.5496, name: '합정역' },
    totalDurationSeconds: 1560,
    totalDistanceMeters: 12500,
    totalTransfers: 1,
    totalWalkingSeconds: 480,
    departureTime: '2026-04-25T08:00:00+09:00',
  },
  sections: [
    { transportMode: 'walk', durationSeconds: 180, distanceMeters: 200 },
    { transportMode: 'transit', durationSeconds: 720, distanceMeters: 5000, route: '2호선', startStation: '강남역', endStation: '홍대입구역' },
    { transportMode: 'walk', durationSeconds: 120, distanceMeters: 150 },
    { transportMode: 'transit', durationSeconds: 360, distanceMeters: 2000, route: '6호선', startStation: '홍대입구역', endStation: '합정역' },
    { transportMode: 'walk', durationSeconds: 180, distanceMeters: 200 },
  ],
} satisfies KakaoRoute;

// === 경로 2: 잠실역 → 시청역 (대중교통, 환승 0 회) ===
export const MOCK_ROUTE_JAMSIL_TO_CITYHALL = {
  resultCode: 0,
  resultMsg: '성공',
  summary: {
    origin: { x: 127.1001, y: 37.5133, name: '잠실역' },
    destination: { x: 126.9784, y: 37.5660, name: '시청역' },
    totalDurationSeconds: 1680,
    totalDistanceMeters: 11000,
    totalTransfers: 0,
    totalWalkingSeconds: 600,
    departureTime: '2026-04-25T08:00:00+09:00',
  },
  sections: [
    { transportMode: 'walk', durationSeconds: 300, distanceMeters: 350 },
    { transportMode: 'transit', durationSeconds: 1080, distanceMeters: 10000, route: '2호선', startStation: '잠실역', endStation: '시청역' },
    { transportMode: 'walk', durationSeconds: 300, distanceMeters: 350 },
  ],
} satisfies KakaoRoute;

// === 경로 3: 판교역 → 강남역 (자차) ===
export const MOCK_ROUTE_PANGYO_TO_GANGNAM = {
  resultCode: 0,
  resultMsg: '성공',
  summary: {
    origin: { x: 127.1112, y: 37.3948, name: '판교역' },
    destination: { x: 127.0276, y: 37.4979, name: '강남역' },
    totalDurationSeconds: 2400,
    totalDistanceMeters: 18000,
    totalTransfers: 0,
    totalWalkingSeconds: 0,
    departureTime: '2026-04-25T08:00:00+09:00',
  },
  sections: [
    { transportMode: 'car', durationSeconds: 2400, distanceMeters: 18000 },
  ],
} satisfies KakaoRoute;

// === 경로 4: 노량진역 → 구로디지털단지역 (대중교통, 환승 2 회) ===
export const MOCK_ROUTE_NORYANGJIN_TO_GURO = {
  resultCode: 0,
  resultMsg: '성공',
  summary: {
    origin: { x: 126.9429, y: 37.5131, name: '노량진역' },
    destination: { x: 126.9015, y: 37.4851, name: '구로디지털단지역' },
    totalDurationSeconds: 2520,
    totalDistanceMeters: 9000,
    totalTransfers: 2,
    totalWalkingSeconds: 900,
    departureTime: '2026-04-25T08:00:00+09:00',
  },
  sections: [
    { transportMode: 'walk', durationSeconds: 300, distanceMeters: 350 },
    { transportMode: 'transit', durationSeconds: 600, distanceMeters: 3000, route: '1호선', startStation: '노량진역', endStation: '대방역' },
    { transportMode: 'walk', durationSeconds: 180, distanceMeters: 200 },
    { transportMode: 'transit', durationSeconds: 720, distanceMeters: 4000, route: '5531' },
    { transportMode: 'walk', durationSeconds: 120, distanceMeters: 150 },
    { transportMode: 'transit', durationSeconds: 360, distanceMeters: 1500, route: '2호선', startStation: '신대방역', endStation: '구로디지털단지역' },
    { transportMode: 'walk', durationSeconds: 240, distanceMeters: 300 },
  ],
} satisfies KakaoRoute;

// === 경로 응답 배열 (KakaoTransportResponse satisfies) ===
export const MOCK_KAKAO_RESPONSES = [
  { routes: [MOCK_ROUTE_GANGNAM_TO_HAPJEONG] },
  { routes: [MOCK_ROUTE_JAMSIL_TO_CITYHALL] },
  { routes: [MOCK_ROUTE_PANGYO_TO_GANGNAM] },
  { routes: [MOCK_ROUTE_NORYANGJIN_TO_GURO] },
] satisfies KakaoTransportResponse[];
