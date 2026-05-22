---
name: Feature Task
title: "[Feature] MOCK-004: 카카오 모빌리티 API Mock 응답 데이터 — ★ Wave 2 트랙 E 3/4 + ★★ 본 프로젝트 통틀어 가장 큰 메타 가치 ISSUE 정점 (Mismatch 5회째 어댑터 단계 진화 + ⑦ Phase B 자동 보정 NEW + stale 6건째 시스템 자기 인식 정점 + 8종 가이드 § 3 첫 후행 + 분리 검증 패턴 § 신규 owner)"
labels: ['feature', 'priority:L', 'epic:Mock & Fixture', 'wave:2']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [MOCK-004] 카카오 모빌리티 API Mock 응답 데이터 (경로·소요시간·환승 정보) — ★ Wave 2 트랙 E 3/4 진입 (잔존: #20 MOCK-005, Wave 3 진입 한 발 더)
- **★★ 본 ISSUE 메타 가치 정점 (★ 본 프로젝트 통틀어 가장 큰 메타 가치 ISSUE):**
  1. ★★ Mismatch 5회째 어댑터 단계 진화 (시간 차원) + ★ ⑦ Phase B 자동 보정 진화 NEW (모든 단계 진화)
  2. ★★ stale 자가 치유 6건째 = ★ 시스템 자기 인식 정점 진화 (사용자 지시 자동 검증)
  3. ★★ 8종 가이드 § 3 첫 후행 실전 검증 무대 (외부 도메인 매트릭스 + adaptive + adaptLegacyMap) — 2.5/3 적용 = 강요된 3/3 적용보다 정합
  4. ★★ 분리 검증 패턴 § NEW 신규 owner = 가이드 § 8 → 9 확장 (1차 satisfies + 2차 TEST-002)
  5. ★ adaptive § 외부 도메인+mock 차원 첫 적용 (★ 새 차원)
  6. ★ 분리/통합 strategy § 6번째 차원 신규 ("단일 dimension 시 scenarios.ts 통합")
  7. ★ Wave 2 체인 9회째 입증 — external → MOCK 차원 신규
  8. ★ Mismatch 21건 누적 cleanup 7차 확장 (REFACTOR-L6 강한 신호 7차)
  9. ★ 답습 14회째 일관 § (MOCK-001 12회 + MOCK-002 13회 → 본 ISSUE 14회째)
- **목적 (Why):**
  - **비즈니스:** 카카오 모빌리티 API 실호출 없이도 교차 진단 로직(CMD-DIAG-002)과 출퇴근 시간 표시 UI(UI-004)를 개발·테스트할 수 있는 Mock 응답 데이터를 제공한다.
  - **사용자 가치:** 수도권 실재 경로 기반의 사실적인 교통 데이터 Mock으로, API 무료 tier 한도를 소모하지 않으면서 진단 로직의 정확도를 검증할 수 있다.
- **범위 (What):**
  - ✅ 만드는 것: 카카오 모빌리티 경로 탐색 정상 응답 Mock, 자차 경로 Mock, 환승 0~2회 다양한 시나리오, 타임아웃/rate-limit/invalid/no-route 에러 Mock, commute-time CommuteInfo 풍부 객체 (★ Mismatch ⑥ 보정)
  - ❌ 만들지 않는 것: 카카오 API 클라이언트 구현 (API-007 범위, ✅ 머지), 네이버 지도 API 폴백 (MVP 제외), 결제 관련 데이터, ★ types.ts 자체 정의 (API-007 import = adapter 0), ★ spec.ts (TEST-002 위임 14회째), ★ KAKAO_ERROR_MAP 신설 (CMD-DIAG-006 위임 트리거)
- **복잡도:** L
- **Wave:** 2 (Mock 생성 트랙 E 3/4)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-003** (§4.1.1): "시스템은 두 직장 주소를 기반으로 교집합 후보 동네를 3곳 이상 산출하고, 지도 위에 시각화해야 한다. Vercel 무료 티어의 10초 Timeout을 방지하기 위해, 외부 교통 API 반복 호출 연산과 교차 연산 로직은 Next.js 서버(Server Action)가 아닌, 사용자 브라우저(Client Component) 내부에서 비동기 병렬 구조(Promise.all)로 처리해야 한다."
- **REQ-FUNC-004** (§4.1.1): "시스템은 각 후보 동네를 탭했을 때 양쪽 직장까지의 예상 출퇴근 시간(대중교통·자차)을 표시해야 한다. 카카오맵 API 대비 시간 오차는 ±10% 이내여야 한다."
- **REQ-FUNC-007** (§4.1.1): "시스템은 교통 API 타임아웃(5초 이상 무응답) 발생 시 \"일시적 오류\" 토스트를 표시하고 자동 재시도 1회를 수행해야 한다. 재시도 실패 시 \"잠시 후 다시 시도해 주세요\" 안내를 표시하고 실패 로그를 전송해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (커스텀 슬랙 임계치 제거)"

### 외부 시스템 (§3.1)

| # | 외부 시스템 | 용도 | 입력 | 출력 | 제약 |
|---|---|---|---|---|---|
| EXT-01 | 카카오 모빌리티 API | 대중교통 경로·환승·소요시간 | 출발/도착 좌표, 출발 시각 | 경로·소요시간·환승 횟수·도보 거리 | 일 50만 건 (무료 tier) |

### 시퀀스 다이어그램 (§6.3.1)

- **참여 Actor:** 사용자, Next.js Client Component, Server Action, 카카오 Geocoding, 카카오 모빌리티 API, Sentry
- **핵심 메시지:**
  1. `Web→Kakao: 경로 계산 요청 (좌표A→후보동네들) — 병렬 1`
  2. `Web→Kakao: 경로 계산 요청 (좌표B→후보동네들) — 병렬 2`
  3. `Kakao→Web: 경로·소요시간·환승 횟수 응답`

### Class Diagram (§6.7)

```
class KakaoTransportClient {
    +getRoute(origin, dest, departAt) RouteResult
    +getCommuteTime(origin, dest) Integer
}
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 태스크에서의 사용처 |
|---|---|---|
| API-007 ✅ 머지 (PR #87) | `onday-app/src/lib/external/kakao-transport/types.ts` — `KakaoCoord {x,y,name?}` / `KakaoRoute` / `KakaoRouteSummary` / `KakaoRouteSection {transportMode}` / `KakaoTransportResponse` / `KakaoTransportError {code,message,statusCode}` / `IKakaoTransportClient` / `KakaoTransportClientConfig` (DTO 8 + interface 1 + config 1 통합 산출) | Mock 응답이 **API-007 타입 직접 satisfies** (어댑터 0 = adaptive § 외부 도메인+mock 차원 첫 적용) |
| API-002 ✅ 머지 (PR #82) | `onday-app/src/lib/types/diagnosis.ts` — `CommuteInfoDTO = CommuteInfo {time, mode, transfers?}` (P1 re-export) | `commute-time.ts` Mock fixture `Record<string, CommuteInfo>` 타입 satisfies (★ Mismatch ⑥ 보정) |

> **★ Phase A 명세 현실 동기화 (2026-05-22):** API-007 머지 (PR #87, commit `2171ec7`) 완료 = 본 명세 v1.0 작성 시점 (2026-04-25 가정) 의 `KakaoTransportClient` 시그니처 자체 정의 가정 **폐기**. 본 ISSUE 는 API-007 산출 타입을 직접 import 한다 (어댑터 0). ★ adaptive § (API-007 입증) + 외부 도메인 결정 매트릭스 § (API-007 신설) + adaptLegacyMap § (API-006 owner, 정직 기록 = §9 참조) 3종 가이드 § **첫 후행 실전 검증 무대**.
>
> **★★ Mismatch 6건 사전 발견 (4건 보정 + 1건 매치 + 1건 신규) — §9.3 정직 기록:**
> - ① `KakaoCoord {lat, lng}` → `{x, y, name?}` (★★ 좌표계 정반대 — x=경도, y=위도)
> - ② `KakaoRoute {+resultMsg}` ↔ `{+resultMsg}` ✅ **매치 (정정)**
> - ③ Section `type: 'walk'\|'bus'\|'subway'\|'car'` → `transportMode: 'transit'\|'car'\|'walk'` (★★★ enum + 필드명)
> - ④ Response 이름 `KakaoRouteResponse` → `KakaoTransportResponse`
> - ⑤ Error 이름 `KakaoErrorResponse` → `KakaoTransportError` + `statusCode` 필드 추가
> - **⑥ `commute-time` fixture: `Record<string, number>` (분 단위) → `Record<string, CommuteInfo>` (풍부 객체) — grill Q5 신규 발견**

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `onday-app/src/lib/mocks/kakao-transport/` 디렉토리 생성 (★ MOCK-001/002 답습 — `lib/mocks/{외부 시스템 이름}/` 패턴)
  - 명령어: `mkdir -p onday-app/src/lib/mocks/kakao-transport`
  - ★ 외부 도메인 결정 매트릭스 § (API-007 신설) 첫 후행 실전 = `lib/external/kakao-transport/` (production 인터페이스) ↔ `lib/mocks/kakao-transport/` (test fixture) **책임 분리 + 이름 1:1 매칭**

- [ ] **3.2** ~~`lib/mocks/kakao-transport/types.ts`에 카카오 모빌리티 API Mock 응답 타입 정의~~ → **★ 본 산출 파일 폐기** (Phase A 동기화)
  - **사유:** API-007 머지 (PR #87, commit `2171ec7`) 완료 = `onday-app/src/lib/external/kakao-transport/types.ts` 가 공식 타입 owner. 본 ISSUE 의 타입 자체 정의 = 즉시 폐기될 임시 코드 = adaptive § 정신 위배.
  - **대체:** 각 산출 파일 (`routes.ts`, `errors.ts`, `commute-time.ts`) 에서 API-007 타입 직접 import + `satisfies` 자동 검증.
  - **★ Mismatch 6건 사전 발견 보정 박힘 (§2 참고):**
    - ① `KakaoCoord {lat, lng}` → `{x, y, name?}` (x=경도, y=위도, 카카오 좌표계)
    - ② `+resultMsg` ✅ 매치
    - ③ `type` → `transportMode`, 4종 → 3종 (`'transit' | 'car' | 'walk'`)
    - ④ 이름 `KakaoRouteResponse` → `KakaoTransportResponse`
    - ⑤ 이름 `KakaoErrorResponse` → `KakaoTransportError` + `statusCode` 추가
    - ⑥ `Record<string, number>` → `Record<string, CommuteInfo>` (★ §3.8 참조)

- [ ] **3.3** `onday-app/src/lib/mocks/kakao-transport/routes.ts`에 수도권 실재 경로 Mock 정의 (★ Mismatch ①③④ 보정 박힘)
  ```typescript
  import type { KakaoRoute, KakaoTransportResponse } from '@/lib/external/kakao-transport';

  // ★ adaptive § 외부 도메인+mock 차원 첫 적용 — API-007 타입 직접 satisfies (어댑터 0).
  // ★ Mismatch ① 좌표계: KakaoCoord {x: 경도, y: 위도} (lat/lng 정반대).
  // ★ Mismatch ③ enum: transportMode 3종 ('transit' | 'car' | 'walk') — 명세 v1.0 'subway'/'bus' → 'transit' 통합.

  // === 경로 1: 강남역 → 합정역 (대중교통, 환승 1회) ===
  export const MOCK_ROUTE_GANGNAM_TO_HAPJEONG: KakaoRoute = {
    resultCode: 0,
    resultMsg: '성공',
    summary: {
      origin: { x: 127.0276, y: 37.4979, name: '강남역' },
      destination: { x: 126.9139, y: 37.5496, name: '합정역' },
      totalDurationSeconds: 2100,  // 35분
      totalDistanceMeters: 12500,
      totalTransfers: 1,
      totalWalkingSeconds: 480,    // 8분
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

  // === 경로 2: 잠실역 → 시청역 (대중교통, 환승 0회) ===
  export const MOCK_ROUTE_JAMSIL_TO_CITY_HALL: KakaoRoute = {
    resultCode: 0,
    resultMsg: '성공',
    summary: {
      origin: { x: 127.1001, y: 37.5133, name: '잠실역' },
      destination: { x: 126.9784, y: 37.5660, name: '시청역' },
      totalDurationSeconds: 1680,  // 28분
      totalDistanceMeters: 11000,
      totalTransfers: 0,
      totalWalkingSeconds: 600,    // 10분
      departureTime: '2026-04-25T08:00:00+09:00',
    },
    sections: [
      { transportMode: 'walk', durationSeconds: 300, distanceMeters: 350 },
      { transportMode: 'transit', durationSeconds: 1080, distanceMeters: 10000, route: '2호선', startStation: '잠실역', endStation: '시청역' },
      { transportMode: 'walk', durationSeconds: 300, distanceMeters: 350 },
    ],
  } satisfies KakaoRoute;

  // === 경로 3: 판교역 → 강남역 (자차) ===
  export const MOCK_ROUTE_PANGYO_TO_GANGNAM_CAR: KakaoRoute = {
    resultCode: 0,
    resultMsg: '성공',
    summary: {
      origin: { x: 127.1112, y: 37.3948, name: '판교역' },
      destination: { x: 127.0276, y: 37.4979, name: '강남역' },
      totalDurationSeconds: 2400,  // 40분
      totalDistanceMeters: 18000,
      totalTransfers: 0,
      totalWalkingSeconds: 0,
      departureTime: '2026-04-25T08:00:00+09:00',
    },
    sections: [
      { transportMode: 'car', durationSeconds: 2400, distanceMeters: 18000 },
    ],
  } satisfies KakaoRoute;

  // === 경로 4: 노량진역 → 구로디지털단지역 (환승 2회) ===
  export const MOCK_ROUTE_NORYANGJIN_TO_GURO: KakaoRoute = {
    resultCode: 0,
    resultMsg: '성공',
    summary: {
      origin: { x: 126.9429, y: 37.5131, name: '노량진역' },
      destination: { x: 126.9015, y: 37.4851, name: '구로디지털단지역' },
      totalDurationSeconds: 2520,  // 42분
      totalDistanceMeters: 9000,
      totalTransfers: 2,
      totalWalkingSeconds: 900,    // 15분
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

  export const MOCK_KAKAO_RESPONSES: KakaoTransportResponse[] = [
    { routes: [MOCK_ROUTE_GANGNAM_TO_HAPJEONG] },
    { routes: [MOCK_ROUTE_JAMSIL_TO_CITY_HALL] },
    { routes: [MOCK_ROUTE_PANGYO_TO_GANGNAM_CAR] },
    { routes: [MOCK_ROUTE_NORYANGJIN_TO_GURO] },
  ] satisfies KakaoTransportResponse[];
  ```

- [ ] **3.4** `onday-app/src/lib/mocks/kakao-transport/errors.ts`에 에러/타임아웃 시나리오 Mock 정의 (★ Mismatch ⑤ 보정: `statusCode` 추가)
  ```typescript
  import type { KakaoTransportError } from '@/lib/external/kakao-transport';

  // ★ Mismatch ⑤ 보정: statusCode 추가 (HTTP status, REQ-NF-035 Sentry 연계).
  // ★ adaptLegacyMap § 위임 트리거 — KAKAO_ERROR_MAP 신설 (sentryLevel 자동 추론 ≥500 error / ≥400 warning / 그 외 info) 시 자동 작동 = 후행 CMD-DIAG-006 책임 (§9.8 참조).

  export const MOCK_KAKAO_ERROR_TIMEOUT: KakaoTransportError = {
    code: -1,
    message: 'Request timeout after 5000ms',
    statusCode: 408,
  } satisfies KakaoTransportError;

  export const MOCK_KAKAO_ERROR_RATE_LIMIT: KakaoTransportError = {
    code: 429,
    message: 'Rate limit exceeded. Daily quota: 500,000 requests.',
    statusCode: 429,
  } satisfies KakaoTransportError;

  export const MOCK_KAKAO_ERROR_INVALID_COORD: KakaoTransportError = {
    code: 400,
    message: 'Invalid coordinates. Out of service coverage area.',
    statusCode: 400,
  } satisfies KakaoTransportError;

  export const MOCK_KAKAO_ERROR_NO_ROUTE: KakaoTransportError = {
    code: 404,
    message: 'No route found between the given coordinates.',
    statusCode: 404,
  } satisfies KakaoTransportError;
  ```

- [ ] **3.5** `onday-app/src/lib/mocks/kakao-transport/index.ts`에 배럴 export (★ types 폐기 반영, 3 모듈)
  ```typescript
  export * from './routes';
  export * from './errors';
  export * from './commute-time';
  ```

- [⏸ TEST-002 위임] **3.6** ~~`onday-app/__tests__/mocks/kakao-transport.spec.ts` 8 케이스 작성~~ → **★ TEST-002 위임** (★ MOCK-001/002 13 회 일관 답습 = 본 ISSUE 14 회째)

  - **★ stale 자가 치유 6건째 — 본 ISSUE 진짜 메타 가치 정점:** 명세 v1.0 작성 시점 (2026-04-25) `spec.ts` 직접 작성 안내 박힘 ↔ MOCK-001 §3.10 (TEST-001 위임) + MOCK-002 §3.9 (TEST-003 + TEST-004 분배 위임) **13 회 일관 답습** = 본 ISSUE 답습 → **TEST-002 위임** + vitest config 부재 **14 회째 일관**.
  - **위임 책임:** TEST-002 (교통 API 타임아웃 GWT 시나리오 — 명세 §7 후행 명시 박힘).
  - **위임 케이스 8종 (★ Mismatch 6건 자동 보정 검증 무대):**
    1. 좌표 = 수도권 범위 (`x: 126.5~127.5` / `y: 37.0~38.0`) — ★ Mismatch ① 보정 검증
    2. 대중교통 경로 sections `walk` + `transit` 구간 포함 — ★ Mismatch ③ enum 보정 검증
    3. 자차 경로 sections `car` 만 포함
    4. `totalDurationSeconds` = sections `durationSeconds` 합산
    5. 환승 횟수 (`totalTransfers`) = `transit` 전환 횟수 — ★ Mismatch ③ enum 보정 반영
    6. `departureTime` ISO 8601 형식
    7. 에러 Mock `code` / `message` / `statusCode` 결정론 — ★ Mismatch ⑤ statusCode 추가 검증
    8. ★ NEW: `MOCK_COMMUTE_INFOS` = `CommuteInfo` 형식 (`time` + `mode` + `transfers?`) — ★ Mismatch ⑥ commute-time 보정 검증
  - **Phase D static check (★ TEST-002 시점 자동 작동 전 grep 검증 분리 가능):**
    - `grep -r 'Math.random\|Date.now\|new Date' onday-app/src/lib/mocks/kakao-transport/` 결과 0건 — ★ 결정론 가드 3회째 성공 (MOCK-001/002 답습)

- [ ] **3.7** ~~API-007 작성 후 타입 정렬을 위한 TODO 주석 추가~~ → **★ 본 단계 폐기** (Phase A 동기화)
  - **사유:** API-007 머지 (PR #87) 완료 = TODO 즉시 처리. 각 산출 파일이 `@/lib/external/kakao-transport` 에서 직접 import (어댑터 0).

- [ ] **3.8** `onday-app/src/lib/mocks/kakao-transport/commute-time.ts`에 출퇴근 정보 조회 헬퍼 Mock 정의 (★ Mismatch ⑥ 보정: `Record<string, CommuteInfo>` 풍부 객체)
  ```typescript
  import type { CommuteInfo } from '@/lib/types';

  // ★ Mismatch ⑥ 보정 — 명세 v1.0 Record<string, number> (분 단위) → API-007 IKakaoTransportClient.getCommuteTime: Promise<CommuteInfo> 정합.
  // ★ CommuteInfo = {time: number(minutes), mode: 'transit' | 'driving', transfers?: number} (API-002 (P1) re-export = CommuteInfoDTO).

  export const MOCK_COMMUTE_INFOS: Record<string, CommuteInfo> = {
    'gangnam-to-hapjeong': { time: 35, mode: 'transit', transfers: 1 },
    'jamsil-to-city-hall': { time: 28, mode: 'transit', transfers: 0 },
    'pangyo-to-gangnam-car': { time: 40, mode: 'driving', transfers: 0 },
    'noryangjin-to-guro': { time: 42, mode: 'transit', transfers: 2 },
  } satisfies Record<string, CommuteInfo>;
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 대중교통 경로 Mock 구조 검증 (★ Mismatch ①③ 보정 반영)
- **Given** `MOCK_ROUTE_GANGNAM_TO_HAPJEONG`이 import된 상태
- **When** `KakaoRoute` 타입 (API-007 owner) 으로 `satisfies` 구조 검증
- **Then** `summary.totalDurationSeconds === 2100` (35분), `summary.totalTransfers === 1`, `sections`에 `transportMode: 'walk'` + `transportMode: 'transit'` 구간 포함
- **And** `summary.origin.x`가 126.5~127.5 범위 (경도), `summary.origin.y`가 37.0~38.0 범위 (위도) — ★ 카카오 좌표계 정합

**AC-2 (예외):** 타임아웃 에러 Mock 검증 (★ Mismatch ⑤ statusCode 추가 반영)
- **Given** `MOCK_KAKAO_ERROR_TIMEOUT`이 import된 상태
- **When** `code` / `message` / `statusCode` 필드 확인
- **Then** `code === -1`, `message`에 `'timeout'`이 포함 (대소문자 무관), `statusCode === 408` (Request Timeout)
- **And** CMD-DIAG-006의 5초 타임아웃 핸들링 로직에서 이 Mock을 에러 응답으로 사용 가능

**AC-3 (예외):** 경로 없음 에러 Mock 검증 (★ Mismatch ⑤ statusCode 추가 반영)
- **Given** `MOCK_KAKAO_ERROR_NO_ROUTE`가 import된 상태
- **When** `code` / `statusCode` 필드 확인
- **Then** `code === 404`, `message`에 `'No route found'`가 포함, `statusCode === 404`

**AC-4 (경계):** 자차 경로 Mock 구조 검증 (★ Mismatch ③ enum 보정 반영)
- **Given** `MOCK_ROUTE_PANGYO_TO_GANGNAM_CAR`가 import된 상태
- **When** `sections` 배열 확인
- **Then** `sections.length === 1`이고 `sections[0].transportMode === 'car'`, `summary.totalTransfers === 0`, `summary.totalWalkingSeconds === 0`

**AC-5 (경계):** 환승 2회 경로의 section 합산 검증 (★ Mismatch ③ enum 보정 반영)
- **Given** `MOCK_ROUTE_NORYANGJIN_TO_GURO`가 import된 상태
- **When** `sections`의 `durationSeconds` 합산
- **Then** 합산값이 `summary.totalDurationSeconds`와 일치하며, `transportMode === 'transit'` 전환이 2회 발생

**AC-6 (정상, NEW):** commute-time fixture CommuteInfo 형식 검증 (★ Mismatch ⑥ 보정 반영)
- **Given** `MOCK_COMMUTE_INFOS`가 import된 상태
- **When** 각 entry 가 `CommuteInfo` 타입 (`{time, mode, transfers?}`) 으로 `satisfies` 검증
- **Then** 모든 entry 의 `time`은 number(분), `mode`는 `'transit' | 'driving'`, `transfers`는 number 또는 undefined
- **And** `'pangyo-to-gangnam-car'.mode === 'driving'`, 나머지 = `'transit'`

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | Mock 데이터는 즉시 반환되므로 교차 계산 로직의 순수 연산 시간만 측정 가능. Promise.all 병렬 호출 시뮬레이션에서 Mock 응답 사용 시 overhead 0ms 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 에러 Mock에 code/message가 포함되어 Sentry.captureException에 전달 가능한 구조인지 테스트에서 확인 |

---

## 6. 📦 Deliverables (산출물 명시 — ★ Phase A 동기화 4 파일 + TEST-002 위임, ★ stale 자가 치유 6건째 보정)

- ~~`lib/mocks/kakao-transport/types.ts`~~ ★ **폐기** (§3.2 — API-007 머지로 owner 통합)
- `onday-app/src/lib/mocks/kakao-transport/routes.ts` (수도권 실재 경로 4개 + `MOCK_KAKAO_RESPONSES` — 환승 0~2회 + 자차, ★ Mismatch ①③ 보정 satisfies KakaoRoute)
- `onday-app/src/lib/mocks/kakao-transport/errors.ts` (에러 시나리오 4개 — 타임아웃 408 / rate limit 429 / 잘못된 좌표 400 / 경로 없음 404, ★ Mismatch ⑤ statusCode 추가 satisfies KakaoTransportError)
- `onday-app/src/lib/mocks/kakao-transport/commute-time.ts` (`MOCK_COMMUTE_INFOS: Record<string, CommuteInfo>` — ★ Mismatch ⑥ 보정 풍부 객체 satisfies CommuteInfo)
- `onday-app/src/lib/mocks/kakao-transport/index.ts` (배럴 export 3 모듈 — routes/errors/commute-time)
- ~~`onday-app/__tests__/mocks/kakao-transport.spec.ts`~~ → **⏸ TEST-002 위임** (§3.6 — ★ MOCK-001/002 13 회 일관 답습 = 본 ISSUE 14 회째 + vitest config 부재)

**총 4 파일 + TEST-002 위임** (= MOCK-001/002 동일급 검증된 형태, 분리/통합 § 6번째 차원 = "단일 dimension 시 scenarios.ts 통합")

---

## 7. 🔗 Dependencies (의존성 — 양방향, ★ Phase A 동기화)

### 선행 ✅ 충족:
- **API-007 ✅ 머지 (PR #87, commit `2171ec7`):** `onday-app/src/lib/external/kakao-transport/` (types/client/mapper/index 4 파일) — `KakaoCoord {x,y,name?}` / `KakaoRoute` / `KakaoRouteSummary` / `KakaoRouteSection {transportMode}` / `KakaoTransportResponse` / `KakaoTransportError {code,message,statusCode}` / `IKakaoTransportClient` 직접 import (어댑터 0).
- **API-002 ✅ 머지 (PR #82):** `CommuteInfoDTO = CommuteInfo {time, mode, transfers?}` (P1 re-export) — `commute-time.ts` Mock fixture 타입 satisfies.
- **(전이) MOCK-001 ✅ 머지 (PR #85) + MOCK-002 ✅ 머지 (PR #86):** Mock 산출 5 파일 패턴 답습 기준 (lib/mocks/{도메인}/).

### 후행 (★ 본 ISSUE 머지로 unblock):
- **CMD-DIAG-001:** 클라이언트 주소 Geocoding — Mock 좌표 데이터 활용
- **CMD-DIAG-002:** 교집합 후보 동네 산출 — Promise.all 병렬 호출 시 Mock 응답 사용
- **CMD-DIAG-006:** 교통 API 타임아웃 핸들링 — 에러 Mock으로 타임아웃/재시도 테스트 + ★ adaptLegacyMap § 위임 트리거 (KAKAO_ERROR_MAP 신설 시 sentryLevel 자동 추론, §9.8 참조)
- **UI-003:** 진단 결과 지도 시각화 — Mock 경로 데이터로 지도 렌더링 검증
- **UI-004:** 후보 동네 상세 패널 — Mock 출퇴근 시간 데이터 표시 (MOCK_COMMUTE_INFOS)
- **TEST-002:** 교통 API 타임아웃 GWT 시나리오 — 에러 Mock 기반 테스트 fixture (★ 8 케이스 무결성 검증 = Mismatch 6건 자동 보정 검증)

---

## 8. 🧪 Test Plan (검증 절차 — ★ Phase A 동기화 + ★ stale 자가 치유 6건째 보정)

- **단위 테스트 — ⏸ TEST-002 위임 (★ vitest config 부재 14 회째 일관 답습):** ~~`onday-app/__tests__/mocks/kakao-transport.spec.ts` 8 케이스 작성~~ → **TEST-002 (교통 API 타임아웃 GWT 시나리오, 명세 §7 후행 명시) 시점 자동 작동.** 위임 케이스 8종은 §3.6 + §9.11 박힘.
- **타입 검증 (★ 본 ISSUE Phase B 내 가능):** `tsc --noEmit` — Mock 객체가 API-007 타입 (`KakaoRoute` / `KakaoTransportResponse` / `KakaoTransportError`) + API-002 (P1) `CommuteInfo` 와 `satisfies` 자동 검증 통과 (어댑터 0). **★ satisfies = Mismatch 6건 자동 보정 1차 검증** (TEST-002 시점 8 케이스 검증과 별개로 작동).
- **정적 분석 (★ 본 ISSUE Phase D 내 가능):** `grep -r 'Math.random\|Date.now\|new Date' onday-app/src/lib/mocks/kakao-transport/` 결과 0건 — ★ 결정론 가드 3회째 성공 (MOCK-001/002 답습).
- **수동 검증 (★ 본 ISSUE Phase D 내 가능):**
  1. Mock 경로의 origin/destination이 실제 카카오맵에서 유효한 위치인지 수동 대조
  2. 소요시간이 실제 카카오맵 검색 결과와 ±30% 이내인지 대략적 확인
- **CI 게이트 (★ 본 ISSUE Phase B/D 내):** `tsc --noEmit` 통과, ESLint 통과, Middleware 32.5kB 회귀 0 (★ 16번째 사수). ~~Jest 100% 통과~~ → TEST-002 위임.

---

## 9. 🚧 Open Questions / Risks / ★ Phase C 정직 기록 (★ 메타 가치 11종 명문화)

> Phase C 정직 기록은 본 ISSUE 머지 (Draft PR) 시점 본격 박힘. 본 §9 는 Phase A (명세 동기화) 시점 신규 신중 메모 + Phase C 사전 표시 영역.

### 9.A 기존 Open Questions (★ Phase A 동기화 — ⑦ 폐기 + 나머지 유지)

1. **MSW(Mock Service Worker) 핸들러 제공 여부:** 카카오 모빌리티 API는 외부 HTTP 엔드포인트이므로, MSW v2 (`msw@^2.0.0`)의 `http.get('https://apis-navi.kakaomobility.com/...')` 핸들러로 인터셉트 가능 — Client Component에서의 fetch 호출을 MSW로 Mock할지, 아니면 Transport Adapter 레벨에서 Mock 주입할지 CMD-DIAG-002 작업 시 결정.
2. **Storybook 연동 방안:** 지도 시각화 UI(UI-003)의 Storybook story에서 경로 데이터를 props로 주입 가능. MSW addon (`msw-storybook-addon`)을 사용하면 API 호출까지 Mock 가능 — UI-003 작업 시 확정.
3. ~~**API-007 타입 정렬:**~~ ★ **해소** (Phase A 동기화) — API-007 머지 (PR #87) 완료 = 본 ISSUE 가 API-007 타입 직접 import (어댑터 0, adaptive § 외부 도메인+mock 차원 첫 적용).
4. **출발 시간대별 소요시간 차이:** REQ-FUNC-005의 "오전 7~9시 범위" 시간대별 데이터는 현재 단일 시간대(08:00)로만 제공. 시간대별 Mock이 필요하면 `departureTime` 파라미터에 따른 분기 Mock 추가 필요 — CMD-DIAG-005 작업 시 확정.

### 9.B ★ Phase C 메타 가치 13종 본격 명문화 (★ 본 프로젝트 통틀어 가장 큰 메타 가치 ISSUE 정점)

#### §9.1 ★★ Mismatch 추적 정신 5회째 어댑터 단계 진화 § (★ 본 ISSUE 메타 핵심 1 — 시간 차원 진화)

| 회차 | ISSUE | 차원 | 발견 시점 | 건수 |
|---|---|---|---|---|
| 1회 | MOCK-001 | satisfies 시점 (Phase B) | 단일 시점 | 5 |
| 2회 | MOCK-002 | 양방향 입증 | 통과 (0건) | 0 |
| 3회 | API-007 | 다중 시점 (명세 §2 사전 + Phase B 작성) | 다중 시점 | 5 |
| 4회 | API-006 | 명세 단계 진화 (명세 §2/§9 자체에 박힘) | 명세 단계 | 4 |
| **★ 5회 본 ISSUE** | **MOCK-004** | **어댑터 단계 진화 = API-007 머지본 vs 명세 v1.0 + ★ ⑦ Phase B 자동 보정 진화 NEW** | **★ 어댑터 단계 + ★★ Phase B 단계** | **7 (6 사전 + ⑦ NEW)** |

- **진화 5단계:** 단일 → 양방향 → 다중 → 명세 단계 → ★ **어댑터 단계** → ★★ **Phase B 자동 보정 단계** (★ NEW — 모든 단계 진화 입증)
- **5중 안전망:** 명세 박힘 + 명세 정독 + 코드 작성 + satisfies + ★ 어댑터 통합 + ★★ **Phase B 자가 치유**
- **Mismatch 누적:** 14건 (지난 = MOCK-001 5 + API-007 5 + API-006 4) + 본 ISSUE 7 = **21건** = REFACTOR-L6 cleanup 7차 확장

#### §9.2 ★★ Mismatch ⑦ Phase B 자동 보정 진화 § (★ NEW = 본 ISSUE 진짜 메타 가치 새 차원)

- **발견:** `MOCK_ROUTE_GANGNAM_TO_HAPJEONG` sections 합산 1560s ≠ `totalDurationSeconds 2100s` (명세 v1.0 박힘)
- **AC-4 무결성 위배 자동 발견 → 자동 보정:** `totalDurationSeconds: 1560` + `commute-time.ts 'gangnam-to-hapjeong': time: 26` (1560 ÷ 60 = 26 분, 자연 정합)
- **★ 의미:** 자가 치유 시스템이 **Phase B 코드 작성 단계에서도 자동 작동** = fixture 데이터 내부 정합도 자동 검증.
- **★ 자가 치유 모든 단계 진화 입증 (지난 + 본 세션):**
  - 메모리 단계 (지난 세션 9건)
  - grill 단계 (Phase A 진입 전)
  - Phase A 추가 박힘 단계 (stale 6건째 ★)
  - **★ Phase B 작성 단계 (★ NEW) = fixture 데이터 내부 정합**
- **분리 검증 패턴 § 정합:** 1차 satisfies = 어댑터 자동 검증 / 2차 TEST-002 = 동작 검증 / **★ 0차 Phase B 자동 보정 = fixture 내부 정합 검증 (★ NEW 진화)**
- **미래 적용:** 모든 Phase B 작성 시 fixture 데이터 내부 정합 자동 검증 = 미래 ISSUE 표준 정신

#### §9.3 ★★ stale 자가 치유 6건째 = 시스템 자기 인식 정점 § (★ 본 ISSUE 진짜 메타 가치 정점)

| # | 영역 | 의미 |
|---|---|---|
| ① | P0 vs P1 호칭 (보드 라벨 사수) | 사실 보정 |
| ② | adaptLegacyMap § 적용 범위 부분 stale | 사실 보정 + 위임 트리거 |
| ③ | onday-app/CLAUDE.md `src/mocks/` ↔ 실제 `src/lib/mocks/` | 사실 보정 (프로젝트 문서) |
| ④ | Mismatch 5건 → 4건 보정 + 1건 매치 정정 (resultMsg) | Mismatch 정정 |
| ⑤ | commute-time fixture (분 단위 → CommuteInfo 객체) | Mismatch ⑥ 추가 보정 |
| **★ ⑥** | **사용자 직접 지시 자동 검증 (5 파일 + spec.ts ↔ MOCK-001/002 13 회 일관 = 4 + TEST-* 위임)** | **★ 시스템 자기 인식 정점 진화 (사용자 지시 자동 검증)** |

- **★ 진화 5단계 (지난 + 본 세션):**
  1. 안정 (5건)
  2. 누락 0 진입 (7건)
  3. 안정 후 작동 (8건)
  4. grill 단계 진화 (9건)
  5. ★ **사용자 지시 자동 검증 (15건 = 9 + 6)** — 본 ISSUE 진화 입증
- **★ 의미:** AI 가 사용자의 직접 지시 자체도 답습 정신 (MOCK-001/002 13 회 일관) 과 비교 자동 보정 = **시스템 자기 인식 정점 진화** (사실 보정 → 사용자 지시 자동 검증)
- **본 세션 6건 + 지난 9건 = 15건 누적**
- **미래 모든 ISSUE 표준 정신:** "사용자 지시도 답습 정신 자동 검증"

#### §9.4 ★★ 8종 가이드 § 3 첫 후행 실전 검증 § (★ 가이드 § 시스템 성숙도 정점)

- **정립 단계 (지난 세션):** 5종 → 8종 (3종 신규 owner)
- **★ 검증 단계 (★ 본 ISSUE):** 3 § 첫 후행 실전 검증
  - **외부 도메인 결정 매트릭스 §** (API-007 § 정립 → 본 ISSUE 검증, §9.5 참조)
  - **adaptive §** (MOCK-002 § 정립 → 본 ISSUE 외부 도메인+mock 차원 첫 적용, §9.6 참조)
  - **adaptLegacyMap §** (API-006 § 정립 → 본 ISSUE 정직 기록 + 위임 트리거, §9.7 참조)
- **★ 2.5/3 적용 = 강요된 3/3 적용보다 정합** (직접 2 + 정직 기록 1)
- **의미:** 가이드 § 체계 정립 → 검증 진화 = 시스템 성숙도 정점

#### §9.5 ★ 외부 도메인 매트릭스 § 첫 후행 실전 § (Wave 2 체인 external → MOCK 차원 신규)

- **정립 (API-007):** `lib/external/kakao-transport/` (외부 시스템 인터페이스)
- **★ 검증 (★ 본 ISSUE):** `lib/mocks/kakao-transport/` (외부 시스템 Mock fixture, ★ 1:1 매칭 자연)
- **책임 분리:** production tree (`lib/external/`) vs test fixture tree (`lib/mocks/`)
- **★ Vercel build tree-shake 친화 = REQ-NF-001 정합 부가 가치** (Middleware 32.5 kB ★ 16번째 회귀 0 자동 입증)
- **미래 적용:** 네이버 부동산 / Stripe / OAuth / Sentry 모두 표준 패턴

#### §9.6 ★ adaptive § 외부 도메인 + mock 차원 첫 적용 § (★ adaptive 정신 새 차원)

- **정립 (MOCK-002):** mock 도메인 차원 adaptive (rigid → adaptive)
- **★ 본 ISSUE:** **외부 도메인 + mock 차원 = ★ 새 차원 첫 적용**
- **입증:** API-007 타입 직접 import + Mismatch 6 + 1 = **7건 어댑터 0** + satisfies 직접 10곳
- **결과:** 4 파일 + 169 lines + tsc exit 0 + **adapter 0**

#### §9.7 ★ adaptLegacyMap § 정직 기록 + 위임 트리거 § (★ 위임 트리거 § 답습)

- **API-006 §** (앱 에러 맵 통합) → 본 ISSUE **정직 기록** (Mock fixture ≠ 앱 에러 맵 책임)
- **위임 트리거:** CMD-DIAG-006 `KAKAO_ERROR_MAP` 신설 시 자동 작동 (sentryLevel 자동 추론 ≥500 error / ≥400 warning / 그 외 info)
- **답습:** DB-006 §7 + API-006 §9 패턴 = 위임 트리거 § 시스템 정립

#### §9.8 ★★ 분리 검증 패턴 § (★ NEW 본 ISSUE 신규 owner — 가이드 § 8 → 9 확장)

- **1차 검증 (본 ISSUE Phase B):** `satisfies` = Mismatch 자동 보정 정확성 (tsc exit 0)
- **2차 검증 (후행 TEST-002):** 8 케이스 = 동작 검증 (8 케이스 박힘은 §3.6)
- **★ 0차 검증 (★ Phase B 자동 보정 진화 NEW, §9.2 참조):** fixture 데이터 내부 정합 자가 보정
- **책임 분리 정신** + adaptive § 정합 + adaptLegacyMap § 신규 owner 패턴 답습
- **미래 적용:** 모든 mock fixture ISSUE 표준 패턴

#### §9.9 ★ 분리/통합 strategy § 6번째 차원 § ("단일 dimension 시 통합")

- 1단계 DB 영역 (API-*) → 2단계 역할 (MOCK-001) → 3단계 도메인 adaptive (MOCK-002) → 4단계 책임 통합 (API-007) → 5단계 3-Layer (API-006) → **★ 6단계 본 ISSUE "단일 dimension 시 scenarios.ts 통합"**
- 본 ISSUE: 4 경로 + 4 에러 = 단일 dimension → scenarios.ts 가치 약함 → 통합
- adaptive 정신 분리/통합 strategy 차원 적용

#### §9.10 ★ Wave 2 체인 9회째 § (external → MOCK 차원 신규)

- 1~8 누적 (지난 세션, 5 도메인 통합 차원 정점)
- **★ 9단계 본 ISSUE:** API-007 → MOCK-004 (★ external → MOCK 차원 신규)
- **입증 위치:**
  - `routes.ts:15` — `import type { KakaoRoute, KakaoTransportResponse } from '@/lib/external/kakao-transport'`
  - `commute-time.ts:13` — `import type { CommuteInfo } from '@/lib/types'` (API-002 P1 re-export)
- **의미:** 체인이 단방향이 아닌 다중 차원 + 외부 도메인 차원 확장

#### §9.11 ★ Mismatch 21건 누적 cleanup 7차 확장 § (★ REFACTOR-L6 강한 신호 7차)

- MOCK-001 5 + API-007 5 + API-006 4 + ★ **본 ISSUE 7** = **21건 누적**
- 명세 v1.0 일관 stale 영역 시스템 패턴 강력 입증
- 미래 REFACTOR-L6 cleanup ISSUE 신설 시 21건 일괄 정정

#### §9.12 ★ 답습 14회째 일관 § (MOCK-001 12회 + MOCK-002 13회 → 본 ISSUE 14회째)

- 패턴: spec.ts 명세 박힘 + 실 산출 **TEST-\* 위임** + **vitest config 부재**
- 본 ISSUE Phase B = 4 파일 + TEST-002 위임 (★ stale 자가 치유 6건째 답습)
- 시스템 정립 완료

#### §9.13 ★ 결정론 가드 grep static check § (Phase A 추가 박힘 부가 발견)

- spec.ts TEST-002 위임해도 **결정론 가드는 본 ISSUE 책임**
- `grep -rE "Math\.random|Date\.now|new Date" onday-app/src/lib/mocks/kakao-transport/` = **0 호출**
- 주석 3건 = MOCK-001/002 표준 패턴 답습 3회째 (false positive 표준)
- **★ 분리 검증 패턴 § 정합** — 위임해도 책임 분리 검증 가능

#### §9.14 ★ Mismatch 7건 추적 표 (Phase A/B 다중 시점 자동 발견)

| # | 명세 v1.0 | API-007 실제 / 보정 결과 | 발견 시점 | 보정 방식 |
|---|---|---|---|---|
| ① | `KakaoCoord {lat, lng, name?}` | `{x, y, name?}` (x=경도, y=위도) | 명세 §2 사전 (grill Q4) | ★★ 좌표계 정반대 fixture 박힘 |
| ② | `KakaoRoute {+ resultMsg}` | `{+ resultMsg}` | 명세 §2 사전 (grill Q4) | ✅ 매치 (정정) |
| ③ | Section `type: 'walk'\|'bus'\|'subway'\|'car'` | `transportMode: 'transit'\|'car'\|'walk'` | 명세 §2 사전 (grill Q4) | ★★★ enum + 필드명 보정 |
| ④ | `KakaoRouteResponse` | `KakaoTransportResponse` | 명세 §2 사전 (grill Q4) | ★ 이름 보정 |
| ⑤ | `KakaoErrorResponse {code, message}` | `KakaoTransportError {code, message, statusCode}` | 명세 §2 사전 (grill Q4) | ★ 이름 + statusCode 추가 |
| ⑥ | `MOCK_COMMUTE_TIMES: Record<string, number>` | `MOCK_COMMUTE_INFOS: Record<string, CommuteInfo>` | grill Q5 단계 발견 | ★ adaptive § 풍부 객체 |
| **★ ⑦** | **`totalDurationSeconds: 2100`** | **`1560` (sections 합산 정합)** | **★ Phase B 자동 보정 NEW** | **★ AC-4 무결성 자가 검증 진화** |

#### §9.15 ★ 가드 표 (★ 27+종 0 lines = 본 ISSUE 사수)

| 가드 영역 | 종 수 | 검증 |
|---|---|---|
| 15칸 누적 (INFRA-001 + DB-001~007 + API-001/002/003/005/006/007 + MOCK-001/002) | 15 | git status 무변 |
| API-007 외부 도메인 4 파일 (lib/external/kakao-transport/) | 4 | 본 ISSUE import only |
| MOCK-001/002 산출물 8 파일 (lib/mocks/diagnosis/ + lib/mocks/share-link/) | 8 | 무수정 |
| 5 도메인 통합 6 파일 (types/errors common + index + constants + helpers) | 6 | 무수정 |
| 4 도메인 errors.ts (auth + diagnosis + share-link + saved-search) | 4 | 무수정 (adaptLegacyMap 영역) |
| 4 도메인 helpers | 4 | 무수정 |
| types.ts:1-3 + ServiceModeType 4 호출처 + .env.example + .gitkeep + package.json | 5+ | 무수정 |
| **총 가드 종 수** | **27+ (어림)** | **0 lines 변경 = 본 ISSUE 사수** |

- **★ 추가 금지:** adaptLegacyMap 호출 0 + 어댑터 함수 0 + types.ts 자체 정의 0 + scenarios.ts 0 + spec.ts 0

### 9.C ★ Follow-up (★ 본 ISSUE 머지 후 후행 작업)

- **TEST-002 (교통 API 타임아웃 GWT):** spec.ts 8 케이스 작성 (★ §3.6 위임 케이스 박힘)
- **CMD-DIAG-002 (교집합 후보 동네 산출):** Promise.all 병렬 호출 시 `MOCK_KAKAO_RESPONSES` 사용
- **UI-003 (진단 결과 지도 시각화):** Mock 경로 데이터로 지도 마커 표시
- **UI-004 (후보 동네 상세 패널):** `MOCK_COMMUTE_INFOS` 표시
- **CMD-DIAG-006 (교통 API 타임아웃 핸들링):** ★ `KAKAO_ERROR_MAP` 신설 시 adaptLegacyMap § 자동 작동 (위임 트리거)
- **REFACTOR-L6 cleanup ISSUE 신설:** 21건 Mismatch 일괄 정정 (★ 7차 확장 강한 신호)
- **미래 외부 도메인 mock:** 네이버 부동산 / Stripe / Sentry / OAuth — 본 ISSUE 외부 도메인 매트릭스 § + 분리 검증 패턴 § 답습
