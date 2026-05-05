---
name: Feature Task
title: "[Feature] MOCK-004: 카카오 모빌리티 API Mock 응답 데이터 (경로·소요시간·환승 정보)"
labels: ['feature', 'priority:L', 'epic:Mock & Fixture', 'wave:2']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [MOCK-004] 카카오 모빌리티 API Mock 응답 데이터 (경로·소요시간·환승 정보)
- **목적 (Why):**
  - **비즈니스:** 카카오 모빌리티 API 실호출 없이도 교차 진단 로직(CMD-DIAG-002)과 출퇴근 시간 표시 UI(UI-004)를 개발·테스트할 수 있는 Mock 응답 데이터를 제공한다.
  - **사용자 가치:** 수도권 실재 경로 기반의 사실적인 교통 데이터 Mock으로, API 무료 tier 한도를 소모하지 않으면서 진단 로직의 정확도를 검증할 수 있다.
- **범위 (What):**
  - ✅ 만드는 것: 카카오 모빌리티 경로 탐색 정상 응답 Mock, 자차 경로 Mock, 환승 0~3회 다양한 시나리오, 타임아웃 에러 Mock, 비수도권 에러 Mock
  - ❌ 만들지 않는 것: 카카오 API 클라이언트 구현(API-007 범위), 네이버 지도 API 폴백(MVP 제외), 결제 관련 데이터
- **복잡도:** L
- **Wave:** 2 (Mock 생성 트랙)

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
| API-007 | `lib/types/kakao-transport.ts` — `KakaoTransportClient` 인터페이스, `RouteResult` 타입, `RouteRequest` 타입 | Mock 응답이 이 인터페이스의 반환 타입과 일치하도록 생성 |

> **참고:** API-007이 아직 미작성이므로, 본 태스크에서는 SRS §6.7 CLD의 `KakaoTransportClient` 시그니처와 §3.1 EXT-01의 입출력 명세를 기반으로 Mock 응답 타입을 자체 정의한다. API-007 작성 시 타입을 정렬한다.

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/mocks/kakao-transport/` 디렉토리 생성
  - 명령어: `mkdir -p lib/mocks/kakao-transport`

- [ ] **3.2** `lib/mocks/kakao-transport/types.ts`에 카카오 모빌리티 API Mock 응답 타입 정의 (API-007 미작성 시 임시 타입, 추후 정렬)
  ```typescript
  /** 카카오 모빌리티 API 경로 탐색 응답 Mock 타입 (SRS §3.1 EXT-01 기반) */
  export interface KakaoRouteResponse {
    routes: KakaoRoute[];
  }

  export interface KakaoRoute {
    resultCode: number;          // 0: 성공
    resultMsg: string;
    summary: KakaoRouteSummary;
    sections: KakaoRouteSection[];
  }

  export interface KakaoRouteSummary {
    origin: KakaoCoord;
    destination: KakaoCoord;
    totalDurationSeconds: number;
    totalDistanceMeters: number;
    totalTransfers: number;
    totalWalkingSeconds: number;
    departureTime: string;       // ISO 8601
  }

  export interface KakaoRouteSection {
    type: 'walk' | 'bus' | 'subway' | 'car';
    durationSeconds: number;
    distanceMeters: number;
    route?: string;              // 버스 번호 또는 지하철 노선
    startStation?: string;
    endStation?: string;
  }

  export interface KakaoCoord {
    lat: number;
    lng: number;
    name?: string;
  }

  /** 카카오 모빌리티 API 에러 응답 */
  export interface KakaoErrorResponse {
    code: number;
    message: string;
  }
  ```

- [ ] **3.3** `lib/mocks/kakao-transport/routes.ts`에 수도권 실재 경로 Mock 정의
  ```typescript
  import type { KakaoRouteResponse, KakaoRoute } from './types';

  // === 경로 1: 강남역 → 합정역 (대중교통, 환승 1회) ===
  export const MOCK_ROUTE_GANGNAM_TO_HAPJEONG: KakaoRoute = {
    resultCode: 0,
    resultMsg: '성공',
    summary: {
      origin: { lat: 37.4979, lng: 127.0276, name: '강남역' },
      destination: { lat: 37.5496, lng: 126.9139, name: '합정역' },
      totalDurationSeconds: 2100,  // 35분
      totalDistanceMeters: 12500,
      totalTransfers: 1,
      totalWalkingSeconds: 480,    // 8분
      departureTime: '2026-04-25T08:00:00+09:00',
    },
    sections: [
      { type: 'walk', durationSeconds: 180, distanceMeters: 200 },
      { type: 'subway', durationSeconds: 720, distanceMeters: 5000, route: '2호선', startStation: '강남역', endStation: '홍대입구역' },
      { type: 'walk', durationSeconds: 120, distanceMeters: 150 },
      { type: 'subway', durationSeconds: 360, distanceMeters: 2000, route: '6호선', startStation: '홍대입구역', endStation: '합정역' },
      { type: 'walk', durationSeconds: 180, distanceMeters: 200 },
    ],
  };

  // === 경로 2: 잠실역 → 시청역 (대중교통, 환승 0회) ===
  export const MOCK_ROUTE_JAMSIL_TO_CITY_HALL: KakaoRoute = {
    resultCode: 0,
    resultMsg: '성공',
    summary: {
      origin: { lat: 37.5133, lng: 127.1001, name: '잠실역' },
      destination: { lat: 37.5660, lng: 126.9784, name: '시청역' },
      totalDurationSeconds: 1680,  // 28분
      totalDistanceMeters: 11000,
      totalTransfers: 0,
      totalWalkingSeconds: 600,    // 10분
      departureTime: '2026-04-25T08:00:00+09:00',
    },
    sections: [
      { type: 'walk', durationSeconds: 300, distanceMeters: 350 },
      { type: 'subway', durationSeconds: 1080, distanceMeters: 10000, route: '2호선', startStation: '잠실역', endStation: '시청역' },
      { type: 'walk', durationSeconds: 300, distanceMeters: 350 },
    ],
  };

  // === 경로 3: 판교역 → 강남역 (자차) ===
  export const MOCK_ROUTE_PANGYO_TO_GANGNAM_CAR: KakaoRoute = {
    resultCode: 0,
    resultMsg: '성공',
    summary: {
      origin: { lat: 37.3948, lng: 127.1112, name: '판교역' },
      destination: { lat: 37.4979, lng: 127.0276, name: '강남역' },
      totalDurationSeconds: 2400,  // 40분
      totalDistanceMeters: 18000,
      totalTransfers: 0,
      totalWalkingSeconds: 0,
      departureTime: '2026-04-25T08:00:00+09:00',
    },
    sections: [
      { type: 'car', durationSeconds: 2400, distanceMeters: 18000 },
    ],
  };

  // === 경로 4: 노량진역 → 구로디지털단지역 (환승 2회) ===
  export const MOCK_ROUTE_NORYANGJIN_TO_GURO: KakaoRoute = {
    resultCode: 0,
    resultMsg: '성공',
    summary: {
      origin: { lat: 37.5131, lng: 126.9429, name: '노량진역' },
      destination: { lat: 37.4851, lng: 126.9015, name: '구로디지털단지역' },
      totalDurationSeconds: 2520,  // 42분
      totalDistanceMeters: 9000,
      totalTransfers: 2,
      totalWalkingSeconds: 900,    // 15분
      departureTime: '2026-04-25T08:00:00+09:00',
    },
    sections: [
      { type: 'walk', durationSeconds: 300, distanceMeters: 350 },
      { type: 'subway', durationSeconds: 600, distanceMeters: 3000, route: '1호선', startStation: '노량진역', endStation: '대방역' },
      { type: 'walk', durationSeconds: 180, distanceMeters: 200 },
      { type: 'bus', durationSeconds: 720, distanceMeters: 4000, route: '5531' },
      { type: 'walk', durationSeconds: 120, distanceMeters: 150 },
      { type: 'subway', durationSeconds: 360, distanceMeters: 1500, route: '2호선', startStation: '신대방역', endStation: '구로디지털단지역' },
      { type: 'walk', durationSeconds: 240, distanceMeters: 300 },
    ],
  };

  export const MOCK_ROUTE_RESPONSES: KakaoRouteResponse[] = [
    { routes: [MOCK_ROUTE_GANGNAM_TO_HAPJEONG] },
    { routes: [MOCK_ROUTE_JAMSIL_TO_CITY_HALL] },
    { routes: [MOCK_ROUTE_PANGYO_TO_GANGNAM_CAR] },
    { routes: [MOCK_ROUTE_NORYANGJIN_TO_GURO] },
  ];
  ```

- [ ] **3.4** `lib/mocks/kakao-transport/errors.ts`에 에러/타임아웃 시나리오 Mock 정의
  ```typescript
  import type { KakaoErrorResponse } from './types';

  export const MOCK_KAKAO_ERROR_TIMEOUT: KakaoErrorResponse = {
    code: -1,
    message: 'Request timeout after 5000ms',
  };

  export const MOCK_KAKAO_ERROR_RATE_LIMIT: KakaoErrorResponse = {
    code: 429,
    message: 'Rate limit exceeded. Daily quota: 500,000 requests.',
  };

  export const MOCK_KAKAO_ERROR_INVALID_COORD: KakaoErrorResponse = {
    code: 400,
    message: 'Invalid coordinates. Out of service coverage area.',
  };

  export const MOCK_KAKAO_ERROR_NO_ROUTE: KakaoErrorResponse = {
    code: 404,
    message: 'No route found between the given coordinates.',
  };
  ```

- [ ] **3.5** `lib/mocks/kakao-transport/index.ts`에 배럴 export
  ```typescript
  export * from './types';
  export * from './routes';
  export * from './errors';
  ```

- [ ] **3.6** `__tests__/mocks/kakao-transport.spec.ts`에 Mock 데이터 무결성 검증 테스트
  ```typescript
  import { MOCK_ROUTE_GANGNAM_TO_HAPJEONG, MOCK_ROUTE_JAMSIL_TO_CITY_HALL, MOCK_ROUTE_PANGYO_TO_GANGNAM_CAR } from '@/lib/mocks/kakao-transport';

  describe('카카오 모빌리티 API Mock 데이터 무결성', () => {
    it('모든 경로의 origin/destination 좌표가 수도권 범위 내이다', () => { /* ... */ });
    it('대중교통 경로의 sections에 walk, subway/bus 구간이 포함된다', () => { /* ... */ });
    it('자차 경로의 sections에 car 구간만 포함된다', () => { /* ... */ });
    it('totalDurationSeconds가 sections 합산과 일치한다', () => { /* ... */ });
    it('환승 횟수가 subway/bus 전환 횟수와 일치한다', () => { /* ... */ });
    it('모든 departureTime이 ISO 8601 형식이다', () => { /* ... */ });
    it('에러 Mock의 code와 message가 결정론적이다', () => { /* ... */ });
  });
  ```

- [ ] **3.7** API-007 작성 후 타입 정렬을 위한 TODO 주석 추가
  ```typescript
  // lib/mocks/kakao-transport/types.ts 상단
  // TODO: API-007 작성 후 lib/types/kakao-transport.ts의 공식 타입으로 교체
  ```

- [ ] **3.8** `lib/mocks/kakao-transport/commute-time.ts`에 출퇴근 시간 조회 헬퍼 Mock 정의
  ```typescript
  /** 고정된 출퇴근 시간 조회 결과 (getCommuteTime Mock) */
  export const MOCK_COMMUTE_TIMES = {
    'gangnam-to-hapjeong': 35,      // 분
    'jamsil-to-city-hall': 28,
    'pangyo-to-gangnam-car': 40,
    'noryangjin-to-guro': 42,
  } as const;
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 대중교통 경로 Mock 구조 검증
- **Given** `MOCK_ROUTE_GANGNAM_TO_HAPJEONG`이 import된 상태
- **When** `KakaoRoute` 타입으로 구조 검증
- **Then** `summary.totalDurationSeconds === 2100` (35분), `summary.totalTransfers === 1`, `sections`에 `walk`과 `subway` 타입이 포함
- **And** `summary.origin.lat`이 37.0~38.0 범위, `summary.origin.lng`이 126.5~127.5 범위 (수도권)

**AC-2 (예외):** 타임아웃 에러 Mock 검증
- **Given** `MOCK_KAKAO_ERROR_TIMEOUT`이 import된 상태
- **When** `code`와 `message` 필드 확인
- **Then** `code === -1`, `message`에 `'timeout'`이 포함 (대소문자 무관)
- **And** CMD-DIAG-006의 5초 타임아웃 핸들링 로직에서 이 Mock을 에러 응답으로 사용 가능

**AC-3 (예외):** 경로 없음 에러 Mock 검증
- **Given** `MOCK_KAKAO_ERROR_NO_ROUTE`가 import된 상태
- **When** `code` 필드 확인
- **Then** `code === 404`, `message`에 `'No route found'`가 포함

**AC-4 (경계):** 자차 경로 Mock 구조 검증
- **Given** `MOCK_ROUTE_PANGYO_TO_GANGNAM_CAR`가 import된 상태
- **When** `sections` 배열 확인
- **Then** `sections.length === 1`이고 `sections[0].type === 'car'`, `summary.totalTransfers === 0`, `summary.totalWalkingSeconds === 0`

**AC-5 (경계):** 환승 2회 경로의 section 합산 검증
- **Given** `MOCK_ROUTE_NORYANGJIN_TO_GURO`가 import된 상태
- **When** `sections`의 `durationSeconds` 합산
- **Then** 합산값이 `summary.totalDurationSeconds`와 일치하며, subway/bus 타입 전환이 2회 발생

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | Mock 데이터는 즉시 반환되므로 교차 계산 로직의 순수 연산 시간만 측정 가능. Promise.all 병렬 호출 시뮬레이션에서 Mock 응답 사용 시 overhead 0ms 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 에러 Mock에 code/message가 포함되어 Sentry.captureException에 전달 가능한 구조인지 테스트에서 확인 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/mocks/kakao-transport/types.ts` (카카오 모빌리티 API 응답 타입 — API-007 미작성 시 임시)
- `lib/mocks/kakao-transport/routes.ts` (수도권 실재 경로 4개 — 환승 0~2회 + 자차)
- `lib/mocks/kakao-transport/errors.ts` (에러 시나리오 4개 — 타임아웃, rate limit, 잘못된 좌표, 경로 없음)
- `lib/mocks/kakao-transport/commute-time.ts` (출퇴근 시간 조회 헬퍼 Mock)
- `lib/mocks/kakao-transport/index.ts` (배럴 export)
- `__tests__/mocks/kakao-transport.spec.ts` (Mock 무결성 검증 7개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **API-007:** `lib/types/kakao-transport.ts` — `KakaoTransportClient` 인터페이스, `RouteResult` 타입 (미작성 시 본 Mock에서 임시 타입 자체 정의, API-007 작성 후 정렬)

### 후행:
- **CMD-DIAG-001:** 클라이언트 주소 Geocoding — Mock 좌표 데이터 활용
- **CMD-DIAG-002:** 교집합 후보 동네 산출 — Promise.all 병렬 호출 시 Mock 응답 사용
- **CMD-DIAG-006:** 교통 API 타임아웃 핸들링 — 에러 Mock으로 타임아웃/재시도 테스트
- **UI-003:** 진단 결과 지도 시각화 — Mock 경로 데이터로 지도 렌더링 검증
- **UI-004:** 후보 동네 상세 패널 — Mock 출퇴근 시간 데이터 표시
- **TEST-002:** 교통 API 타임아웃 GWT 시나리오 — 에러 Mock 기반 테스트 fixture

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/mocks/kakao-transport.spec.ts` — 7개 케이스 (수도권 좌표, 대중교통 구간, 자차 구간, 소요시간 합산, 환승 횟수, ISO 시간 형식, 에러 결정론)
- **타입 검증:** `tsc --noEmit`으로 Mock 객체가 임시 타입과 호환되는지 확인
- **정적 분석:** `grep -r 'Math.random\|Date.now\|new Date' lib/mocks/kakao-transport/` 결과 0건
- **수동 검증:**
  1. Mock 경로의 origin/destination이 실제 카카오맵에서 유효한 위치인지 수동 대조
  2. 소요시간이 실제 카카오맵 검색 결과와 ±30% 이내인지 대략적 확인
- **CI 게이트:** `tsc --noEmit` 통과, Jest 테스트 100% 통과, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **MSW(Mock Service Worker) 핸들러 제공 여부:** 카카오 모빌리티 API는 외부 HTTP 엔드포인트이므로, MSW v2 (`msw@^2.0.0`)의 `http.get('https://apis-navi.kakaomobility.com/...')` 핸들러로 인터셉트 가능 — Client Component에서의 fetch 호출을 MSW로 Mock할지, 아니면 Transport Adapter 레벨에서 Mock 주입할지 CMD-DIAG-002 작업 시 결정.
2. **Storybook 연동 방안:** 지도 시각화 UI(UI-003)의 Storybook story에서 경로 데이터를 props로 주입 가능. MSW addon (`msw-storybook-addon`)을 사용하면 API 호출까지 Mock 가능 — UI-003 작업 시 확정.
3. **API-007 타입 정렬:** API-007이 미작성 상태이므로, 본 Mock의 타입(`lib/mocks/kakao-transport/types.ts`)은 임시 정의. API-007 작성 시 공식 타입으로 교체하고, import 경로를 `@/lib/types/kakao-transport`로 변경해야 함.
4. **출발 시간대별 소요시간 차이:** REQ-FUNC-005의 "오전 7~9시 범위" 시간대별 데이터는 현재 단일 시간대(08:00)로만 제공. 시간대별 Mock이 필요하면 `departureTime` 파라미터에 따른 분기 Mock 추가 필요 — CMD-DIAG-005 작업 시 확정.
