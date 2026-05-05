---
name: Feature Task
title: "[Feature] CMD-DIAG-001: 클라이언트 주소 Geocoding 연동 — 카카오 Geocoding API 호출 (자동완성)"
labels: ['feature', 'priority:M', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DIAG-001] 클라이언트 주소 Geocoding 연동 — 카카오 Local API 호출, 자동완성 UI 데이터 소스
- **목적 (Why):**
  - **비즈니스:** 사용자가 직장 주소를 입력하면 자동완성 후보를 표시하고, 선택된 주소를 좌표(lat, lng)로 변환하여 교차 진단 로직(CMD-DIAG-002)에 제공한다.
  - **사용자 가치:** 주소를 몇 글자만 입력해도 자동완성 목록이 표시되어 빠르고 정확한 주소 입력이 가능하다.
- **범위 (What):**
  - ✅ 만드는 것: 카카오 Local API (Geocoding) 호출 라이브러리, 디바운스 300ms 자동완성 로직, GeocodeResult 타입 정의, 좌표 변환 결과 반환
  - ❌ 만들지 않는 것: 교집합 후보 동네 산출(CMD-DIAG-002), 카카오 모빌리티 API 호출(API-007), UI 컴포넌트(UI-001), Server Action/Route Handler
- **복잡도:** M
- **Wave:** 3 (Diagnosis 트랙)
- **⚠️ 클라이언트 측 처리:** Vercel 10초 timeout 우회를 위해 브라우저에서 직접 카카오 API를 호출한다. Server Action 사용 금지.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-001** (§4.1.1): "시스템은 사용자가 두 개의 직장 주소를 입력할 수 있는 인터페이스를 제공해야 한다. 각 주소 입력 필드는 자동완성(Geocoding) 기능을 포함해야 한다."
- **REQ-FUNC-002** (§4.1.1): "시스템은 두 개의 직장 주소가 모두 입력된 경우에만 \"진단 시작\" 버튼을 활성화해야 한다."
- **REQ-FUNC-003** (§4.1.1): "... 외부 교통 API 반복 호출 연산과 교차 연산 로직은 Next.js 서버(Server Action)가 아닌, 사용자 브라우저(Client Component) 내부에서 비동기 병렬 구조(Promise.all)로 처리해야 한다."
- **REQ-FUNC-031** (§4.1.6): "시스템은 수도권(서울·경기·인천) 외 주소 입력 시 서비스 커버리지 안내 UI를 표시하고 진단 실행을 차단해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.1 — Geocoding 부분)

```
User→Web: 주소A 입력 (자동완성)
Web→Geo: Geocoding 요청 (주소A)
Geo→Web: 좌표A 반환
User→Web: 주소B 입력 (자동완성)
Web→Geo: Geocoding 요청 (주소B)
Geo→Web: 좌표B 반환
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| API-007 | IKakaoTransportClient, KakaoCoord | `@/lib/external/kakao-transport` | KakaoCoord 타입 재사용 (좌표 표현) |
| API-002 | CreateDiagnosisRequest | `@/lib/types/diagnosis` | coordA, coordB 필드 타입 참조 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/diagnosis/geocoding-types.ts`에 Geocoding 관련 타입 정의
  ```typescript
  /** 카카오 Local API Geocoding 응답 타입 */
  export interface GeocodeResult {
    addressName: string;          // 전체 주소
    roadAddressName: string;      // 도로명 주소
    x: string;                    // 경도 (lng)
    y: string;                    // 위도 (lat)
    region1DepthName: string;     // 시/도 (수도권 검증용)
    region2DepthName: string;     // 시/군/구
    region3DepthName: string;     // 읍/면/동
  }

  export interface GeocodedAddress {
    address: string;
    roadAddress: string;
    coord: { lat: number; lng: number };
    region: string;               // "서울특별시 마포구 합정동"
    isMetroArea: boolean;         // 수도권 여부
  }

  export interface GeocodeError {
    code: string;
    message: string;
  }
  ```

- [ ] **3.2** `lib/diagnosis/geocoding.ts`에 카카오 Local API 호출 함수 작성 (환경 중립 — 'use client' X)
  ```typescript
  import type { GeocodeResult, GeocodedAddress } from './geocoding-types';
  import * as Sentry from '@sentry/nextjs';

  const KAKAO_LOCAL_API_URL = 'https://dapi.kakao.com/v2/local/search/address.json';
  const METRO_AREA_PREFIXES = ['서울', '경기', '인천'];

  export async function geocodeAddress(
    query: string,
    apiKey: string
  ): Promise<GeocodedAddress[]> {
    if (!query || query.length < 2) return [];

    try {
      const url = new URL(KAKAO_LOCAL_API_URL);
      url.searchParams.set('query', query);
      url.searchParams.set('size', '5');

      const response = await fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Kakao Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      const documents: GeocodeResult[] = data.documents ?? [];

      return documents.map(mapToGeocodedAddress);
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'diagnosis', task: 'CMD-DIAG-001' } });
      return [];
    }
  }

  function mapToGeocodedAddress(doc: GeocodeResult): GeocodedAddress {
    const isMetroArea = METRO_AREA_PREFIXES.some(prefix =>
      doc.region1DepthName.startsWith(prefix)
    );
    return {
      address: doc.addressName,
      roadAddress: doc.roadAddressName,
      coord: { lat: parseFloat(doc.y), lng: parseFloat(doc.x) },
      region: `${doc.region1DepthName} ${doc.region2DepthName} ${doc.region3DepthName}`.trim(),
      isMetroArea,
    };
  }
  ```

- [ ] **3.3** `lib/diagnosis/use-geocode.ts`에 디바운스 300ms 자동완성 React Hook 작성
  ```typescript
  'use client';
  import { useState, useEffect, useRef, useCallback } from 'react';
  import { geocodeAddress } from './geocoding';
  import type { GeocodedAddress } from './geocoding-types';

  const DEBOUNCE_MS = 300;

  export function useGeocode(apiKey: string) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GeocodedAddress[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selected, setSelected] = useState<GeocodedAddress | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (selected) return; // 선택 후 추가 검색 방지
      if (query.length < 2) { setResults([]); return; }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true);
        const geocoded = await geocodeAddress(query, apiKey);
        setResults(geocoded);
        setIsLoading(false);
      }, DEBOUNCE_MS);

      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }, [query, apiKey, selected]);

    const selectAddress = useCallback((address: GeocodedAddress) => {
      setSelected(address);
      setQuery(address.address);
      setResults([]);
    }, []);

    const reset = useCallback(() => {
      setQuery('');
      setResults([]);
      setSelected(null);
    }, []);

    return { query, setQuery, results, isLoading, selected, selectAddress, reset };
  }
  ```

- [ ] **3.4** `lib/diagnosis/coverage.ts`에 수도권 커버리지 검증 유틸리티 작성
  ```typescript
  import type { GeocodedAddress } from './geocoding-types';

  const METRO_AREA_BOUNDS = {
    latMin: 36.9,  latMax: 38.0,
    lngMin: 126.5, lngMax: 127.9,
  };

  export function isMetroArea(address: GeocodedAddress): boolean {
    return address.isMetroArea;
  }

  export function isWithinMetroBounds(coord: { lat: number; lng: number }): boolean {
    return (
      coord.lat >= METRO_AREA_BOUNDS.latMin && coord.lat <= METRO_AREA_BOUNDS.latMax &&
      coord.lng >= METRO_AREA_BOUNDS.lngMin && coord.lng <= METRO_AREA_BOUNDS.lngMax
    );
  }
  ```

- [ ] **3.5** `.env.local`에 카카오 REST API 키 환경변수 등록
  ```env
  NEXT_PUBLIC_KAKAO_REST_API_KEY={kakao_rest_api_key}
  ```
  - `NEXT_PUBLIC_` 접두어: 브라우저에서 직접 호출하므로 클라이언트 노출 필요

- [ ] **3.6** `lib/diagnosis/index.ts`에 배럴 export
  ```typescript
  export * from './geocoding-types';
  export * from './geocoding';
  export * from './use-geocode';
  export * from './coverage';
  ```

- [ ] **3.7** `__tests__/diagnosis/geocoding.spec.ts`에 Geocoding 함수 단위 테스트
  ```typescript
  describe('geocodeAddress', () => {
    it('유효한 주소 입력 시 GeocodedAddress[] 반환', async () => { /* ... */ });
    it('query가 2글자 미만이면 빈 배열 반환', async () => { /* ... */ });
    it('수도권 주소의 isMetroArea가 true', async () => { /* ... */ });
    it('비수도권 주소의 isMetroArea가 false', async () => { /* ... */ });
    it('API 에러 시 Sentry.captureException 호출 + 빈 배열 반환', async () => { /* ... */ });
    it('5초 타임아웃 후 AbortError + 빈 배열 반환', async () => { /* ... */ });
  });
  ```

- [ ] **3.8** `__tests__/diagnosis/use-geocode.spec.tsx`에 Hook 테스트
  ```typescript
  import { renderHook, act } from '@testing-library/react';
  import { useGeocode } from '@/lib/diagnosis/use-geocode';
  describe('useGeocode Hook', () => {
    it('디바운스 300ms 적용 — 300ms 이내 연속 입력 시 API 호출 1회', async () => { /* ... */ });
    it('selectAddress 호출 시 selected 상태 업데이트 + 결과 목록 초기화', async () => { /* ... */ });
    it('reset 호출 시 query/results/selected 모두 초기화', async () => { /* ... */ });
  });
  ```

- [ ] **3.9** `__tests__/diagnosis/coverage.spec.ts`에 커버리지 검증 테스트
  ```typescript
  describe('수도권 커버리지 검증', () => {
    it('서울 주소 → isMetroArea true', () => { /* ... */ });
    it('경기 주소 → isMetroArea true', () => { /* ... */ });
    it('인천 주소 → isMetroArea true', () => { /* ... */ });
    it('부산 주소 → isMetroArea false', () => { /* ... */ });
    it('좌표 범위 내 → isWithinMetroBounds true', () => { /* ... */ });
    it('좌표 범위 외 → isWithinMetroBounds false', () => { /* ... */ });
  });
  ```

- [ ] **3.10** 정적 분석: Server Action 미사용 검증
  - 명령어: `grep -r "'use server'" lib/diagnosis/ | wc -l` → 결과 0
  - 명령어: `grep -r "createSupabaseServerClient" lib/diagnosis/ | wc -l` → 결과 0

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 주소 입력 시 자동완성 목록 표시
- **Given** 사용자가 주소 입력 필드에 "강남" 입력
- **When** 300ms 디바운스 후 카카오 Local API 호출 완료
- **Then** `GeocodeResult[]` 반환, `results.length ≥ 1`, 각 항목에 `addressName`, `coord.lat`, `coord.lng` 포함

**AC-2 (정상):** 자동완성 항목 선택 시 좌표 변환
- **Given** 자동완성 목록에서 "서울 강남구 역삼동" 선택
- **When** `selectAddress()` 호출
- **Then** `selected.coord.lat`이 37.4~37.6 범위, `selected.coord.lng`이 126.8~127.2 범위, `selected.isMetroArea === true`

**AC-3 (예외):** 카카오 Geocoding API 타임아웃
- **Given** 카카오 API가 5초 이상 무응답
- **When** `geocodeAddress()` 호출
- **Then** AbortSignal.timeout에 의해 중단, `Sentry.captureException` 호출, 빈 배열 반환, UI에 에러 안내

**AC-4 (예외):** 비수도권 주소 감지
- **Given** 사용자가 "부산 해운대구" 주소 선택
- **When** `isMetroArea(address)` 검증
- **Then** `false` 반환, 호출처에서 서비스 커버리지 안내 UI 표시 (REQ-FUNC-031)

**AC-5 (경계):** 디바운스 300ms 동작 검증
- **Given** 사용자가 50ms 간격으로 "강", "강남", "강남역" 연속 입력
- **When** 마지막 입력 후 300ms 경과
- **Then** API 호출 1회만 발생 (query: "강남역"), 중간 입력에 대한 호출 0건

**AC-6 (보안/성능):** Server Action 미사용 정적 검증
- **Given** `lib/diagnosis/` 디렉토리 전체
- **When** `grep -r "'use server'" lib/diagnosis/` 실행
- **Then** 매칭 0건 — Vercel 10초 timeout 우회 전략 준수

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)" (§4.2.1) | Geocoding은 전체 진단 파이프라인의 첫 단계. 단독 API 호출 ≤1초 목표. AbortSignal.timeout(5000) 적용으로 5초 이내 보장 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | geocodeAddress 에러 시 `Sentry.captureException(error, { tags: { domain: 'diagnosis', task: 'CMD-DIAG-001' } })` 호출 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/diagnosis/geocoding-types.ts` (GeocodeResult, GeocodedAddress, GeocodeError)
- `lib/diagnosis/geocoding.ts` (geocodeAddress, mapToGeocodedAddress)
- `lib/diagnosis/use-geocode.ts` (useGeocode React Hook — 'use client')
- `lib/diagnosis/coverage.ts` (isMetroArea, isWithinMetroBounds)
- `lib/diagnosis/index.ts` (배럴 export)
- `__tests__/diagnosis/geocoding.spec.ts` (6개 케이스)
- `__tests__/diagnosis/use-geocode.spec.tsx` (3개 케이스)
- `__tests__/diagnosis/coverage.spec.ts` (6개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **API-007:** `KakaoCoord` 타입 — 좌표 표현 타입 재사용
- **API-002:** `CreateDiagnosisRequest.coordA/coordB` — Geocoding 결과가 이 필드에 할당

### 후행:
- **CMD-DIAG-002:** 교집합 후보 동네 산출 — geocodeAddress 결과 좌표를 입력으로 사용
- **CMD-DIAG-007:** 수도권 커버리지 검증 — isMetroArea/isWithinMetroBounds 활용
- **UI-002:** 주소 입력 자동완성 UI — useGeocode Hook 활용

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/diagnosis/geocoding.spec.ts` — 6개 케이스
- **단위 테스트:** `__tests__/diagnosis/use-geocode.spec.tsx` — 3개 케이스
- **단위 테스트:** `__tests__/diagnosis/coverage.spec.ts` — 6개 케이스
- **정적 분석:** `grep -r "'use server'" lib/diagnosis/` 매칭 0건
- **타입 검증:** `npx tsc --noEmit` 통과
- **수동 검증:**
  1. 브라우저 DevTools → Network 탭에서 카카오 Local API 호출 확인
  2. 디바운스 300ms 동작 — 연속 입력 시 API 호출 횟수 확인
  3. 비수도권 주소 입력 시 `isMetroArea: false` 확인
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **CMD-DIAG-003 (스코어링 엔진):** SRS §6.7 CLD에 ScoringEngine.score/rank 기준이 상세 미정. 본 태스크는 스코어링 없이 주소→좌표 변환만 담당. CMD-DIAG-003은 SRS §6.7 보완 후 별도 배치로 작성 예정.
2. **카카오 REST API 키 브라우저 노출:** `NEXT_PUBLIC_KAKAO_REST_API_KEY`로 클라이언트에서 직접 호출하므로 API 키가 브라우저에 노출됨. 카카오 Developers Console에서 도메인 제한(Allowed Origins) 설정으로 악용 방지. 프록시 API Route 도입은 Vercel timeout 제약으로 MVP에서 제외.
3. **카카오 Local API vs 카카오 모빌리티 API:** Geocoding은 카카오 Local API(`dapi.kakao.com/v2/local/search/address.json`), 경로 탐색은 카카오 모빌리티 API(`apis-navi.kakaomobility.com`). 두 API는 별도 서비스이며 API 키도 동일 REST API 키를 사용하지만 호출 제한(quota)은 별도.
4. **자동완성 API 호출량 최적화:** 디바운스 300ms 적용 시에도 사용자 수 증가 시 API 호출량이 급증할 수 있음. MVP에서는 `size=5`로 제한. 추후 서버 측 캐싱 레이어 도입 검토.
