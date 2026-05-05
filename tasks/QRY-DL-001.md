---
name: Feature Task
title: "[Feature] QRY-DL-001: 교집합 매물 조회 (filterListings Server Action + 네이버 부동산 아웃링크 URL 생성)"
labels: ['feature', 'priority:M', 'epic:Deadline', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [QRY-DL-001] 교집합 매물 조회 — filterListings Server Action + 네이버 부동산 아웃링크 URL 생성
- **목적:** 데드라인 모드에서 후보 동네별 네이버 부동산 검색 URL을 조합하여 아웃링크로 제공. 자체 매물 DB 없이 외부 연동.
- **범위:**
  - ✅ `filterListings` Server Action ('use server'), Prisma Diagnosis+CandidateArea 조회, `buildNaverRealEstateUrl` 함수, 복합 인덱스 활용, p95 ≤1,500ms
  - ❌ 자체 매물 DB, 크롤링, 결제, NextAuth.js
- **복잡도:** M | **Wave:** 4 (Deadline 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용

- **REQ-FUNC-016** (§4.1.3): "시스템은 데드라인 모드에서 교집합 동네를 클릭하면 해당 조건을 네이버 부동산 검색 URL 파라미터로 조합하여 아웃링크로 새 창을 연다. (직접 크롤링 대체)"
- **REQ-NF-007** (§4.2.1): "교집합 매물 연산 응답 시간 (데드라인 모드) — p95 ≤ 1,500ms"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"
- **EXT-08** (§3.1.1): "매물 데이터 소스 (네이버 부동산 등) — 조건 파라미터 결합 이동 (아웃링크방식)"

### 시퀀스 다이어그램 (§6.3.3)

- `Web→SA: filterListings(diagnosisId, filters)`
- `SA→Prisma: 교집합 매물 쿼리 (복합 인덱스 활용)`
- `SA→Web: 매물 리스트 (≤1.5초)`

### 선행 태스크 산출물

| Task ID | 산출물 | import 경로 | 사용처 |
|---|---|---|---|
| CMD-DL-001 (같은 배치) | `activateDeadlineMode` | `@/app/actions/deadline` | 데드라인 활성화 선행 |
| DB-003 | Diagnosis + CandidateArea 모델, `@@index([diagnosisId, rank])` | `@prisma/client` | 조회 대상 + 인덱스 |
| API-002 | `DiagnosisFilters`, `CandidateAreaDTO` | `@/lib/types/diagnosis` | 입출력 타입 |
| CMD-AUTH-003 | `requireAuth` | `@/lib/auth/session` | 권한 검증 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/types/deadline.ts`에 ListingFilters, ListingResult 타입 정의
  ```typescript
  export interface ListingFilters {
    priceMin?: number;
    priceMax?: number;
    roomType?: 'apartment' | 'officetel' | 'villa' | 'all';
    areaMin?: number;  // m²
    areaMax?: number;
  }

  export interface ListingItem {
    candidateId: string;
    candidateName: string;
    naverSearchUrl: string;
    rank: number;
  }

  export interface ListingResult {
    listings: ListingItem[];
    totalCount: number;
  }
  ```

- [ ] **3.2** `lib/deadline/naver-url-builder.ts`에 `buildNaverRealEstateUrl` 함수
  ```typescript
  interface NaverUrlParams {
    area: string;
    priceMin?: number;
    priceMax?: number;
    roomType?: string;
    areaMin?: number;
    areaMax?: number;
  }

  const NAVER_REALESTATE_BASE = 'https://land.naver.com/search/result.naver';

  export function buildNaverRealEstateUrl(params: NaverUrlParams): string {
    const searchParams = new URLSearchParams();
    searchParams.set('query', params.area);
    if (params.priceMin) searchParams.set('priceMin', String(params.priceMin));
    if (params.priceMax) searchParams.set('priceMax', String(params.priceMax));
    if (params.roomType && params.roomType !== 'all') searchParams.set('type', params.roomType);
    if (params.areaMin) searchParams.set('areaMin', String(params.areaMin));
    if (params.areaMax) searchParams.set('areaMax', String(params.areaMax));
    return `${NAVER_REALESTATE_BASE}?${searchParams.toString()}`;
  }
  ```

- [ ] **3.3** `app/actions/deadline.ts`에 `filterListings` Server Action 추가
  ```typescript
  'use server';
  import { prisma } from '@/lib/prisma';
  import { requireAuth } from '@/lib/auth/session';
  import { buildNaverRealEstateUrl } from '@/lib/deadline/naver-url-builder';
  import { reportErrorToSentry } from '@/lib/helpers/sentry-error';
  import type { ListingFilters, ListingResult } from '@/lib/types/deadline';

  export async function filterListings(
    input: { diagnosisId: string; filters: ListingFilters }
  ): Promise<ListingResult> {
    const currentUser = await requireAuth();

    // 1. Diagnosis + CandidateArea 조회 (복합 인덱스 활용)
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: input.diagnosisId },
      include: { candidates: { orderBy: { rank: 'asc' } } },
    });

    if (!diagnosis) throw new Error('DIAGNOSIS_NOT_FOUND');
    // 권한 검증
    if (diagnosis.userId !== currentUser.user.id) throw new Error('DIAGNOSIS_FORBIDDEN');

    // 2. 후보 동네별 네이버 부동산 URL 조합
    const listings = diagnosis.candidates.map((c) => ({
      candidateId: c.id,
      candidateName: c.name,
      naverSearchUrl: buildNaverRealEstateUrl({
        area: c.name,
        priceMin: input.filters.priceMin,
        priceMax: input.filters.priceMax,
        roomType: input.filters.roomType,
        areaMin: input.filters.areaMin,
        areaMax: input.filters.areaMax,
      }),
      rank: c.rank,
    }));

    return { listings, totalCount: listings.length };
  }
  ```

- [ ] **3.4** `lib/validators/deadline.ts`에 filterListings Zod 스키마
  ```typescript
  export const filterListingsSchema = z.object({
    diagnosisId: z.string().min(1),
    filters: z.object({
      priceMin: z.number().min(0).optional(),
      priceMax: z.number().min(0).optional(),
      roomType: z.enum(['apartment', 'officetel', 'villa', 'all']).optional(),
      areaMin: z.number().min(0).optional(),
      areaMax: z.number().min(0).optional(),
    }),
  });
  ```

- [ ] **3.5** `__tests__/actions/filter-listings.spec.ts` — Server Action 테스트
  ```typescript
  describe('filterListings (QRY-DL-001)', () => {
    it('후보 3곳 → 3개 네이버 부동산 URL 반환', async () => {});
    it('각 URL에 area 파라미터 포함', async () => {});
    it('필터 적용 시 URL에 priceMin/priceMax 포함', async () => {});
    it('진단 소유자 아닌 사용자 → FORBIDDEN', async () => {});
    it('존재하지 않는 diagnosisId → NOT_FOUND', async () => {});
    it('응답시간 p95 ≤1,500ms', async () => {});
  });
  ```

- [ ] **3.6** `__tests__/deadline/naver-url-builder.spec.ts` — URL 빌더 테스트
  ```typescript
  describe('buildNaverRealEstateUrl', () => {
    it('area만 → query 파라미터', () => {});
    it('priceMin+priceMax → URL 포함', () => {});
    it('roomType=all → type 미포함', () => {});
    it('URL이 NAVER_REALESTATE_BASE로 시작', () => {});
  });
  ```

- [ ] **3.7** 복합 인덱스 활용 검증
  ```typescript
  // DB-003 @@index([diagnosisId, rank]) 활용
  // Prisma include + orderBy rank → 인덱스 스캔
  // EXPLAIN ANALYZE로 인덱스 사용 확인
  ```

- [ ] **3.8** Mock 분기 (`NEXT_PUBLIC_USE_MOCK`)

- [ ] **3.9** 'use server' 지시어 확인

- [ ] **3.10** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES" app/actions/deadline.ts lib/deadline/` → 0건

- [ ] **3.11** 자체 매물 DB 0건 확인: `grep -ri "model Listing\|model Property" prisma/` → 0건

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 후보 N곳 → N개 네이버 부동산 URL 반환
- **Given** deadlineMode=true인 Diagnosis + CandidateArea 3곳
- **When** `filterListings({ diagnosisId, filters: {} })` 호출
- **Then** `listings.length === 3`, 각 item에 `naverSearchUrl` 포함, URL이 네이버 부동산 base URL로 시작

**AC-2 (정상):** 필터 적용 → URL 파라미터 포함
- **Given** `filters: { priceMin: 5000, priceMax: 15000, roomType: 'apartment' }`
- **When** `filterListings()` 호출
- **Then** 각 `naverSearchUrl`에 `priceMin=5000&priceMax=15000&type=apartment` 포함

**AC-3 (성능):** p95 ≤1,500ms
- **Given** CandidateArea 10곳
- **When** `filterListings()` 호출
- **Then** Prisma include + URL 조합 ≤1,500ms (k6 측정)

**AC-4 (예외):** 권한 검증 (Diagnosis.userId == 세션 userId)
- **Given** 사용자B가 사용자A의 진단에 접근
- **When** `filterListings()` 호출
- **Then** DIAGNOSIS_FORBIDDEN 에러

**AC-5 (도메인 핵심):** 자체 매물 DB 0건 — 네이버 부동산 아웃링크만
- **Given** 프로젝트 전체
- **When** `grep -ri "model Listing\|model Property" prisma/` 실행
- **Then** 0건. 자체 매물 조회 쿼리 없음

**AC-6 (경계):** CandidateArea 0곳 → 빈 리스트
- **Given** 진단 결과에 CandidateArea 0곳
- **When** `filterListings()` 호출
- **Then** `listings === []`, `totalCount === 0`

---

## 5. ⚙️ Non-Functional Constraints

| NFR ID | 인용 | 검증 |
|---|---|---|
| REQ-NF-007 | "교집합 매물 연산 p95 ≤1,500ms" (§4.2.1) | Prisma include + URL 조합. k6 부하 테스트 |
| REQ-NF-035 | "Sentry 기본 알림" (§4.2.6) | 에러 시 reportErrorToSentry 호출 |

---

## 6. 📦 Deliverables

- `app/actions/deadline.ts` (filterListings 추가 — 'use server')
- `lib/deadline/naver-url-builder.ts` (buildNaverRealEstateUrl)
- `lib/types/deadline.ts` (ListingFilters, ListingResult, ListingItem)
- `lib/validators/deadline.ts` (filterListingsSchema 추가)
- `__tests__/actions/filter-listings.spec.ts` (6개)
- `__tests__/deadline/naver-url-builder.spec.ts` (4개)

---

## 7. 🔗 Dependencies

### 선행:
- **CMD-DL-001 (같은 배치):** 데드라인 모드 활성화
- **DB-003 ✅:** Diagnosis + CandidateArea, `@@index([diagnosisId, rank])`
- **API-002 ✅:** CandidateAreaDTO, DiagnosisFilters
- **CMD-AUTH-003 ✅:** requireAuth

### 후행:
- **UI-010:** 급매 매물 리스트 + 지도 UI unblock
- **TEST-005:** 데드라인 모드 GWT 시나리오

---

## 8. 🧪 Test Plan

- **단위 테스트:** `filter-listings.spec.ts` 6개 + `naver-url-builder.spec.ts` 4개
- **성능:** k6 p95 ≤1,500ms
- **정적 검증:** 자체 매물 DB 0건 + NextAuth/결제/AES 0건
- **인덱스 검증:** Prisma EXPLAIN으로 `@@index([diagnosisId, rank])` 활용 확인
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint

---

## 9. 🚧 Open Questions / Risks

1. **네이버 부동산 URL 스펙 변경:** 네이버 부동산 검색 URL 파라미터 스펙이 공식 문서화되지 않음. URL 구조 변경 시 `buildNaverRealEstateUrl` 함수 갱신 필요. 주기적 검증 권장.
2. **지역 코드 매핑:** 현재 `c.name` (행정동명)으로 검색. 네이버 부동산 지역 코드 기반 검색이 더 정확할 수 있음 — MVP에서는 텍스트 검색으로 시작.
3. **필터 확장:** 현재 가격/면적/타입만. 층수, 방향 등 추가 필터는 UI-010 구현 시 확장.
