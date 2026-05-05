---
name: Feature Task
title: "[Feature] CMD-DL-002: 네이버 부동산 아웃링크 URL 조합 (교집합 동네 클릭 → 네이버 부동산 검색 URL 생성 + 새 창 열기)"
labels: ['feature', 'priority:M', 'epic:Deadline', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DL-002] 네이버 부동산 아웃링크 URL 조합 — 교집합 동네 클릭 시 네이버 부동산 검색 URL 파라미터 생성 + 새 창 열기
- **목적:** 데드라인 모드에서 후보 동네 클릭 시 네이버 부동산 검색 페이지를 새 창으로 열어 사용자가 실제 매물을 탐색할 수 있게 한다. 자체 매물 DB 없이 아웃링크 방식으로 외부 서비스에 위임한다 (REQ-FUNC-016).
- **범위:**
  - ✅ `openNaverListing` 클라이언트 유틸 함수, QRY-DL-001의 `buildNaverRealEstateUrl` 재사용, `window.open(url, '_blank', 'noopener,noreferrer')` 새 창 열기, URL 파라미터 정확 조합
  - ❌ 자체 매물 DB 조회/저장(REQ-FUNC-016 — 외부 아웃링크만), 크롤링, 결제, NextAuth.js
- **복잡도:** L | **Wave:** 4 (Deadline 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용

- **REQ-FUNC-016** (§4.1.3): "시스템은 데드라인 모드에서 교집합 동네를 클릭하면 해당 조건을 네이버 부동산 검색 URL 파라미터로 조합하여 아웃링크로 새 창을 연다. (직접 크롤링 대체)"
- **REQ-FUNC-017** (§4.1.3): "(조정됨) 매물 직접 필터링 배제 - 아웃링크를 통한 조건 위임으로 대체"
- **EXT-08** (§3.1): "매물 데이터 소스 (네이버 부동산 등) — 조건 파라미터 결합 이동 (아웃링크방식) … 크롤링 폐기 및 아웃링크 연동 대체"
- **EXT-08 장애 우회** (§3.1.1): "아웃링크이므로 시스템 가용성에 영향 없음 (외부 장애 시 안내)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.3)

- **참여 Actor:** 긴급 이사자(C-03), Next.js Client Component, Server Action, Prisma ORM
- **핵심 흐름:**
  1. `Web→User: 지도 + 리스트 동시 표시 (급매 최상단, 경과 시간 표기)` — 매물 리스트에서 동네 클릭
  2. 클라이언트에서 `openNaverListing()` 호출 → `buildNaverRealEstateUrl()` → `window.open()`

### 선행 태스크 산출물

| Task ID | 산출물 | import 경로 | 사용처 |
|---|---|---|---|
| QRY-DL-001 ✅ | `buildNaverRealEstateUrl` | `@/lib/deadline/naver-url-builder` | URL 생성 함수 재사용 |
| QRY-DL-001 ✅ | `ListingItem`, `ListingFilters` | `@/lib/types/deadline` | 입력 타입 |
| CMD-DL-001 ✅ | `activateDeadlineMode` | `@/app/actions/deadline` | 데드라인 모드 활성화 선행 |
| API-002 ✅ | `CandidateAreaDTO` | `@/lib/types/diagnosis` | 후보 동네 타입 |
| API-006 ✅ | `reportErrorToSentry` | `@/lib/helpers/app-error` | 에러 추적 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/types/deadline.ts`에 `OpenNaverListingInput` 인터페이스 추가
  ```typescript
  export interface OpenNaverListingInput {
    candidateId: string;
    candidateName: string;
    filters: {
      priceMin?: number;
      priceMax?: number;
      roomType?: 'apartment' | 'officetel' | 'villa' | 'all';
      areaMin?: number;
      areaMax?: number;
    };
  }
  ```

- [ ] **3.2** `lib/deadline/naver-link.ts`에 `openNaverListing` 클라이언트 유틸 함수 구현
  ```typescript
  import { buildNaverRealEstateUrl } from '@/lib/deadline/naver-url-builder'; // QRY-DL-001 산출물
  import type { OpenNaverListingInput } from '@/lib/types/deadline';

  /**
   * 교집합 동네 클릭 시 네이버 부동산 검색 URL로 새 창 열기
   * REQ-FUNC-016: 아웃링크 방식, 자체 매물 DB 0건
   * 보안: noopener,noreferrer (window.opener 차단 + Referer 미전송)
   */
  export function openNaverListing(input: OpenNaverListingInput): void {
    const url = buildNaverRealEstateUrl({
      area: input.candidateName,
      priceMin: input.filters.priceMin,
      priceMax: input.filters.priceMax,
      roomType: input.filters.roomType,
      areaMin: input.filters.areaMin,
      areaMax: input.filters.areaMax,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  ```

- [ ] **3.3** `openNaverListing` 함수에 `window.open` 실패 시 fallback 처리 추가
  ```typescript
  export function openNaverListing(input: OpenNaverListingInput): void {
    const url = buildNaverRealEstateUrl({
      area: input.candidateName,
      priceMin: input.filters.priceMin,
      priceMax: input.filters.priceMax,
      roomType: input.filters.roomType,
      areaMin: input.filters.areaMin,
      areaMax: input.filters.areaMax,
    });

    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    // 팝업 차단 시 fallback: <a> 태그 클릭 방식
    if (!newWindow) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    }
  }
  ```

- [ ] **3.4** `lib/deadline/naver-link.ts`에 `getNaverListingUrl` 순수 함수 분리 (테스트 용이)
  ```typescript
  /**
   * URL만 생성 (부작용 없음) — 테스트, SSR 호환
   */
  export function getNaverListingUrl(input: OpenNaverListingInput): string {
    return buildNaverRealEstateUrl({
      area: input.candidateName,
      priceMin: input.filters.priceMin,
      priceMax: input.filters.priceMax,
      roomType: input.filters.roomType,
      areaMin: input.filters.areaMin,
      areaMax: input.filters.areaMax,
    });
  }
  ```

- [ ] **3.5** UI-010에서 사용할 `<a>` 태그 기반 대안 컴포넌트 패턴 정의
  ```typescript
  // components/deadline/NaverListingLink.tsx
  'use client';
  import { getNaverListingUrl } from '@/lib/deadline/naver-link';
  import type { OpenNaverListingInput } from '@/lib/types/deadline';

  interface NaverListingLinkProps {
    input: OpenNaverListingInput;
    children: React.ReactNode;
    className?: string;
  }

  export function NaverListingLink({ input, children, className }: NaverListingLinkProps) {
    const url = getNaverListingUrl(input);
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={`${input.candidateName} 네이버 부동산 검색 (새 창)`}
      >
        {children}
      </a>
    );
  }
  ```

- [ ] **3.6** `__tests__/deadline/naver-link.spec.ts` — 클라이언트 유틸 테스트
  ```typescript
  describe('openNaverListing (CMD-DL-002)', () => {
    it('buildNaverRealEstateUrl에 올바른 파라미터 전달', () => {});
    it('window.open에 noopener,noreferrer 옵션 전달', () => {});
    it('window.open 반환 null 시 fallback <a> 클릭', () => {});
    it('candidateName이 URL query 파라미터에 포함', () => {});
    it('filters 미지정 시 최소 파라미터(area)만 포함', () => {});
    it('자체 매물 DB 조회 코드 0건 (정적 검증)', () => {});
  });
  ```

- [ ] **3.7** `__tests__/deadline/naver-link.spec.ts` — `getNaverListingUrl` 순수 함수 테스트
  ```typescript
  describe('getNaverListingUrl', () => {
    it('URL이 https://land.naver.com/ 으로 시작', () => {});
    it('priceMin + priceMax → URL 파라미터 포함', () => {});
    it('roomType=all → type 파라미터 미포함', () => {});
    it('한글 동네명 인코딩 정상', () => {});
  });
  ```

- [ ] **3.8** `__tests__/components/NaverListingLink.spec.tsx` — Link 컴포넌트 테스트
  ```typescript
  describe('NaverListingLink', () => {
    it('target="_blank" 렌더링', () => {});
    it('rel="noopener noreferrer" 렌더링', () => {});
    it('aria-label에 동네명 포함', () => {});
  });
  ```

- [ ] **3.9** v1.3 정합성 검증: `grep -ri "NextAuth\|payment\|AES\|model Listing\|model Property" lib/deadline/` → 0건

- [ ] **3.10** 자체 매물 DB 0건 확인: `grep -ri "prisma.listing\|prisma.property\|model Listing" prisma/ lib/ app/` → 0건

- [ ] **3.11** `noopener,noreferrer` 보안 옵션이 모든 외부 링크 열기 경로에 적용되었는지 코드 리뷰

- [ ] **3.12** TypeScript 컴파일 검증: `tsc --noEmit`

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 후보 동네 + 필터 → 정확한 네이버 부동산 URL 조합
- **Given** `candidateName: '성남시 분당구'`, `filters: { priceMin: 5000, priceMax: 15000, roomType: 'apartment' }`
- **When** `openNaverListing(input)` 호출
- **Then** `buildNaverRealEstateUrl`에 `area='성남시 분당구'`, `priceMin=5000`, `priceMax=15000`, `roomType='apartment'` 전달. URL이 `https://land.naver.com/search/result.naver?query=성남시+분당구&priceMin=5000&priceMax=15000&type=apartment` 형태

**AC-2 (정상):** 새 창 열기 + 보안 옵션 검증
- **Given** 유효한 `OpenNaverListingInput`
- **When** `openNaverListing(input)` 호출
- **Then** `window.open(url, '_blank', 'noopener,noreferrer')` 호출. 새 창에서 `window.opener === null` (noopener 보안). Referer 헤더 미전송 (noreferrer)

**AC-3 (예외):** 팝업 차단 시 fallback
- **Given** 브라우저 팝업 차단 설정 ON
- **When** `openNaverListing(input)` 호출, `window.open` 반환값 `null`
- **Then** `<a target="_blank" rel="noopener noreferrer">` fallback 클릭 방식으로 새 탭 열기

**AC-4 (경계):** 필터 미지정 시 area만으로 URL 생성
- **Given** `filters: {}` (모든 필터 비어있음)
- **When** `getNaverListingUrl(input)` 호출
- **Then** URL에 `query=<동네명>` 파라미터만 포함. 가격/타입/면적 파라미터 미포함

**AC-5 (도메인 핵심):** 자체 매물 DB 코드 0건 — 정적 검증
- **Given** 프로젝트 전체 코드베이스
- **When** `grep -ri "model Listing\|model Property\|prisma.listing\|prisma.property" prisma/ lib/ app/` 실행
- **Then** 0건. `openNaverListing`은 외부 URL 조합만 수행, 자체 DB 접근 없음

**AC-6 (보안):** noopener,noreferrer 보안 옵션 적용 검증
- **Given** `NaverListingLink` 컴포넌트 또는 `openNaverListing` 함수
- **When** 렌더링 또는 호출
- **Then** 모든 외부 링크에 `rel="noopener noreferrer"` 또는 `window.open(..., 'noopener,noreferrer')` 적용. `window.opener` 접근 차단

---

## 5. ⚙️ Non-Functional Constraints

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 변형 | "인증 세션 보안 — sameSite strict 적용" (§4.2.3) — 변형: 외부 링크 보안 | `window.open` 3번째 인자 `noopener,noreferrer` + `<a>` 태그 `rel` 속성 정적 검증 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림" (§4.2.6) | URL 생성 실패 시 `reportErrorToSentry` 호출. `window.open` 실패 시 Sentry 비경고 로그 |
| EXT-08 | "아웃링크이므로 시스템 가용성에 영향 없음" (§3.1.1) | 외부 장애 시 안내 표시만. 시스템 장애로 전파되지 않음 |

---

## 6. 📦 Deliverables

- `lib/types/deadline.ts` — `OpenNaverListingInput` 인터페이스 추가
- `lib/deadline/naver-link.ts` — `openNaverListing`, `getNaverListingUrl` 함수
- `components/deadline/NaverListingLink.tsx` — `<a>` 기반 링크 컴포넌트
- `__tests__/deadline/naver-link.spec.ts` — 유틸 함수 테스트 (10개)
- `__tests__/components/NaverListingLink.spec.tsx` — 컴포넌트 테스트 (3개)

---

## 7. 🔗 Dependencies

### 선행:
- **CMD-DL-001 ✅:** 데드라인 모드 활성화 (`activateDeadlineMode`) — 데드라인 모드 사전 활성화 필요
- **QRY-DL-001 ✅:** `buildNaverRealEstateUrl` 함수, `ListingItem`/`ListingFilters` 타입 — URL 빌더 재사용

### 후행:
- **UI-010 (같은 배치):** 급매 매물 리스트 UI — 매물 카드 클릭 시 `openNaverListing` 호출
- **TEST-005:** 데드라인 모드 GWT 시나리오 — 아웃링크 동작 검증

### Deadline 도메인 완성 기여:
- 본 태스크 완료 시 Deadline 백엔드 3/5 완료 (CMD-DL-001 ✅ + QRY-DL-001 ✅ + CMD-DL-002 ✅)

---

## 8. 🧪 Test Plan

- **단위 테스트:** `naver-link.spec.ts` 10개 + `NaverListingLink.spec.tsx` 3개 = 총 13개
- **정적 검증:**
  - `grep -ri "NextAuth\|payment\|AES" lib/deadline/` → 0건
  - `grep -ri "model Listing\|model Property" prisma/ lib/ app/` → 0건 (자체 매물 DB 0건)
  - `grep -r "noopener" lib/deadline/ components/deadline/` → ≥2건 (모든 경로에 보안 옵션)
- **수동 검증:**
  - 실제 브라우저에서 `openNaverListing` 호출 → 네이버 부동산 검색 페이지 새 탭 열림
  - 팝업 차단 설정 후 호출 → fallback 동작
  - DevTools → `window.opener` 확인 → `null`
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint

---

## 9. 🚧 Open Questions / Risks

1. **네이버 부동산 URL 스펙 변경 대응:** 네이버 부동산 검색 URL 파라미터 스펙은 공식 문서화되지 않음. URL 구조(`https://land.naver.com/search/result.naver?query=...`) 변경 시 `buildNaverRealEstateUrl` 함수 갱신 필요. QRY-DL-001에서 정의한 함수를 단일 수정점으로 활용.
2. **지역 코드 vs 텍스트 검색:** 현재 `candidateName` (행정동명)으로 검색. 네이버 부동산 지역 코드 기반 검색이 더 정확할 수 있으나, MVP는 텍스트 검색으로 시작 (QRY-DL-001과 동일 결정).
3. **모바일 브라우저 팝업 정책:** iOS Safari / Android Chrome의 팝업 차단 정책이 다름. 사용자 제스처 기반 호출(`onClick`)이면 차단되지 않으나, 비동기 호출 내부에서 `window.open` 시 차단 가능. UI-010에서 `onClick` 핸들러 직접 연결 필요.
4. **EXT-08 외부 장애 시 UX:** 네이버 부동산 서버 다운 시 새 창에서 에러 페이지 표시. 본 시스템 가용성에 영향 없으나 UX 안내 문구 추가 여부 검토.
