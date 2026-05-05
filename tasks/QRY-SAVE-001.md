---
name: Feature Task
title: "[Feature] QRY-SAVE-001: 저장된 조건 불러오기 — getSavedSearch Server Action (Rev 1.1 단순화)"
labels: ['feature', 'priority:L', 'epic:SavedSearch', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [QRY-SAVE-001] 저장된 조건 불러오기 — getSavedSearch Server Action (저장된 값을 입력 폼에 채우기 + geocoding 실패 시 안내)
- **목적 (Why):**
  - **비즈니스:** 반복 이사자(C-04)가 이전 방문 시 저장한 입력 조건(주소·필터·시간대)을 1초 이내에 복원하여, 즉시 새 진단을 시작할 수 있게 한다.
  - **사용자 가치:** "이전 조건 불러오기" 클릭 한 번으로 이전 입력값이 폼에 자동 채워지며, 주소가 유효하지 않으면 "다시 입력해주세요" 안내를 받는다.
- **범위 (What):**
  - ✅ 만드는 것: `getSavedSearch` Server Action ('use server'), Prisma SELECT (userId 기준), geocoding 재검증 (CMD-DIAG-001 validateAddress 활용), `GetSavedSearchResponse` DTO 반환
  - ❌ 만들지 않는 것: ~~재계산 로직~~ (Rev 1.1 제거), ~~비교 뷰~~ (Rev 1.1 제거), ~~시나리오 비교~~ (Rev 1.1 제거), ~~replaySearch API~~ (제거), UI 처리(UI-014 범위)
- **복잡도:** L
- **Wave:** 4 (SavedSearch 트랙)

### ⚠️ Rev 1.1 단순화 (필수 인지)

> **v1.1에서 "재계산 로직·비교 뷰 제거" → "저장된 값을 입력 폼에 채우기"만 남김.**
>
> 다음 코드 **절대 작성 금지:**
> - 저장된 값과 새 입력 비교 뷰
> - 자동 재계산 (예: 가격 변동 알림)
> - 시나리오 비교 (저장 시점 vs 현재)
> - replaySearch() API

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-025** (§4.1.5): "시스템은 사용자가 진단을 완료하고 세션 종료 또는 앱 종료 시 입력 조건(주소·필터·시간대)을 자동 저장해야 한다. 저장은 best effort로 처리하며 실패 시 사용자에게 알리지 않는다. 다음 방문 시 복원 시간은 1초 이내여야 하며, 불러온 주소가 geocoding 실패 시 \"주소를 다시 입력해주세요\" 안내를 표시한다."
- **REQ-NF-016** (§4.2.2): "입력값 자동 저장 성공률 — Best effort (저장 실패 시 무시, 사용자 미통지)"
- **REQ-NF-001** (§4.2.1): 복원 시간 ≤1초에 적용 — Prisma SELECT + geocoding 재검증 합산

### Rev 1.1 변경 사항 인용 (TASK_LIST v1.3)

> | Task ID | 변경 내용 |
> |---|---|
> | QRY-SAVE-001 | 재계산 로직·비교 뷰 제거 → "저장된 값을 입력 폼에 채우기"만 남김 |
> | API-005 | `replaySearch()` DTO 제거, `saveSearch()` + `getSavedSearch()` 만 유지 |

### 시퀀스 다이어그램 (§6.3.5 간이 저장·불러오기 — 불러오기 부분)

- **참여 Actor:** 반복 이사자(C-04), Next.js Client Component, Server Action, Prisma ORM, 카카오 Geocoding
- **핵심 메시지:**
  ```
  User→Web: "이전 조건 불러오기" 클릭
  Web→SA: getSavedSearch(userId)
  SA→Prisma: SavedSearch 조회 (user_id 기준)
  alt 저장된 기록 없음: SA→Web: null → "저장된 조건이 없습니다" 안내
  else 저장된 기록 존재:
    SA→Web: search_params 반환
    Web→Web: 폼 자동 채움 (≤1초)
    Web→Geo: 저장된 주소 Geocoding 재검증
    alt Geocoding 실패: Web→User: "주소를 다시 입력해주세요" 안내
    else Geocoding 성공: Web→User: "이전 조건이 복원되었습니다"
  ```

### 선행 태스크 산출물 (배치 1~11 + 같은 배치)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-006 | `model SavedSearch` (Prisma 스키마) | `@prisma/client` | SELECT 대상 모델 |
| API-005 | `GetSavedSearchResponse`, `GeocodingValidationStatus`, `mapToGetResponse`, `mapSavedSearchToDTO` | `@/lib/types/saved-search-api`, `@/lib/mappers/saved-search-mapper` | 응답 DTO + 변환 함수 |
| CMD-SAVE-001 | `saveSearch` Server Action | — | CMD-SAVE-001이 저장한 데이터를 본 태스크가 조회 |
| CMD-DIAG-001 | `geocodeAddress`, `GeocodedAddress` | `@/lib/diagnosis/geocoding` | geocoding 재검증 |
| CMD-AUTH-003 | `getCurrentUser` | `@/lib/auth/session` | 인증 확인 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `app/actions/save-search.ts`에 `getSavedSearch` Server Action 추가 (CMD-SAVE-001과 동일 파일)
  ```typescript
  'use server';
  import { prisma } from '@/lib/prisma';
  import { getCurrentUser } from '@/lib/auth/session';
  import { mapToGetResponse } from '@/lib/mappers/saved-search-mapper';
  import { geocodeAddress } from '@/lib/diagnosis/geocoding';
  import type { GetSavedSearchResponse } from '@/lib/types/saved-search-api';
  import * as Sentry from '@sentry/nextjs';

  /**
   * 저장된 조건 불러오기 — Rev 1.1 단순화
   * ⚠️ 재계산 로직 0건, 비교 뷰 0건 (절대 작성 금지)
   * REQ-FUNC-025: 복원 ≤1초, geocoding 실패 시 안내
   */
  export async function getSavedSearch(): Promise<GetSavedSearchResponse | null> {
    try {
      // 1. 인증 확인
      const currentUser = await getCurrentUser();
      if (currentUser.type !== 'authenticated') return null;

      // 2. Prisma SELECT
      const saved = await prisma.savedSearch.findUnique({
        where: { userId: currentUser.user.id },
      });

      if (!saved) return null;

      // 3. Geocoding 재검증 (CMD-DIAG-001 활용)
      const searchParams = saved.searchParams as any;
      const apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ?? '';

      let addressAValid = true;
      let addressBValid = true;

      if (searchParams.addressA) {
        const resultsA = await geocodeAddress(searchParams.addressA, apiKey);
        addressAValid = resultsA.length > 0;
      }

      if (searchParams.addressB) {
        const resultsB = await geocodeAddress(searchParams.addressB, apiKey);
        addressBValid = resultsB.length > 0;
      }

      // 4. DTO 변환 + geocoding 상태 포함
      return mapToGetResponse(saved, { addressAValid, addressBValid });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { domain: 'save-search', task: 'QRY-SAVE-001' },
      });
      return null;
    }
  }
  ```

- [ ] **3.2** `lib/diagnosis/geocoding.ts`에 주소 유효성 재검증 헬퍼 함수 추가
  ```typescript
  /**
   * 저장된 주소가 여전히 유효한지 geocoding 재검증
   * QRY-SAVE-001에서 사용 — CMD-DIAG-001의 geocodeAddress 활용
   */
  export async function validateAddress(
    address: string,
    apiKey: string
  ): Promise<boolean> {
    if (!address || address.length < 2) return false;
    const results = await geocodeAddress(address, apiKey);
    return results.length > 0;
  }
  ```

- [ ] **3.3** Rev 1.1 정적 검증 — 재계산·비교 관련 코드 0건 확인
  ```bash
  # 재계산 로직 0건 검증
  grep -rn "recalculate\|replay\|recompute\|replaySearch" app/actions/save-search.ts | wc -l  # → 0
  # 비교 뷰 0건 검증
  grep -rn "compare\|comparison\|diff\|versus" app/actions/save-search.ts | wc -l  # → 0
  ```

- [ ] **3.4** `__tests__/actions/get-saved-search.spec.ts`에 Server Action 단위 테스트
  ```typescript
  describe('getSavedSearch Server Action', () => {
    it('저장된 기록 존재 — GetSavedSearchResponse 반환', async () => { /* ... */ });
    it('저장된 기록 없음 — null 반환', async () => { /* ... */ });
    it('미인증 사용자 — null 반환', async () => { /* ... */ });
    it('geocoding 실패 시 — addressAValid: false + message 포함', async () => { /* ... */ });
    it('geocoding 성공 시 — addressAValid: true, addressBValid: true', async () => { /* ... */ });
    it('DB 에러 시 — Sentry 기록 + null 반환', async () => { /* ... */ });
  });
  ```

- [ ] **3.5** `__tests__/actions/get-saved-search-rev11.spec.ts`에 Rev 1.1 정합성 정적 검증 테스트
  ```typescript
  import { readFileSync } from 'fs';

  describe('QRY-SAVE-001 Rev 1.1 정합성 검증', () => {
    const source = readFileSync('app/actions/save-search.ts', 'utf-8');

    it('재계산 로직 0건 (recalculate/replay/recompute)', () => {
      expect(source).not.toMatch(/recalculate|replay|recompute|replaySearch/i);
    });

    it('비교 뷰 0건 (compare/comparison/diff/versus)', () => {
      expect(source).not.toMatch(/compare|comparison|diff|versus/i);
    });

    it('시나리오 비교 0건 (scenario)', () => {
      expect(source).not.toMatch(/scenario/i);
    });
  });
  ```

- [ ] **3.6** 응답 시간 ≤1초 검증 테스트
  ```typescript
  describe('getSavedSearch 응답 시간', () => {
    it('Prisma SELECT + geocoding 재검증 합산 ≤1초', async () => {
      const start = performance.now();
      await getSavedSearch();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThanOrEqual(1000);
    });
  });
  ```

- [ ] **3.7** `lib/mappers/saved-search-mapper.ts`의 `mapToGetResponse` 함수가 API-005 산출물과 정합하는지 확인
  ```typescript
  // API-005에서 정의된 함수 시그니처 확인
  import { mapToGetResponse } from '@/lib/mappers/saved-search-mapper';
  // → found, savedSearch, geocodingStatus 필드 존재 여부 타입 체크
  ```

- [ ] **3.8** `lib/diagnosis/index.ts` 배럴에 `validateAddress` export 추가
  ```typescript
  export { validateAddress } from './geocoding';
  ```

- [ ] **3.9** API-005의 `GetSavedSearchResponse` 타입과 본 Server Action 반환값 일치 여부 `tsc --noEmit` 검증
  ```bash
  npx tsc --noEmit
  ```

- [ ] **3.10** CI 게이트 검증
  ```bash
  npx tsc --noEmit
  npx jest --testPathPattern="get-saved-search" --coverage
  npx eslint app/actions/save-search.ts
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 저장된 조건 정상 응답
- **Given** 인증된 사용자의 `saved_searches` 테이블에 `search_params = { addressA: "서울 강남구", maxCommuteTime: 60 }` 레코드 존재
- **When** `getSavedSearch()` 호출
- **Then** `found === true`, `savedSearch.searchParams.addressA === "서울 강남구"`, `geocodingStatus.addressAValid === true`, 응답 시간 ≤1초

**AC-2 (예외 — Rev 1.1 핵심):** 재계산 로직 0건 정적 검증
- **Given** `app/actions/save-search.ts` 파일
- **When** `grep -rn "recalculate\|replay\|recompute\|replaySearch" app/actions/save-search.ts` 실행
- **Then** 매칭 0건 — Rev 1.1 단순화 준수

**AC-3 (예외 — Rev 1.1 핵심):** 비교 뷰 0건 정적 검증
- **Given** `app/actions/save-search.ts` 파일
- **When** `grep -rn "compare\|comparison\|diff\|versus" app/actions/save-search.ts` 실행
- **Then** 매칭 0건 — Rev 1.1 단순화 준수

**AC-4 (예외):** Geocoding 실패 시 응답에 실패 표시
- **Given** 저장된 주소A가 더 이상 유효하지 않은 상태 (예: 주소 체계 변경)
- **When** `getSavedSearch()` 호출 후 geocoding 재검증 실패
- **Then** `geocodingStatus.addressAValid === false`, `geocodingStatus.message === "주소를 다시 입력해주세요"` — UI(UI-014)에서 이 값으로 안내 표시

**AC-5 (경계):** 저장된 기록 없음 시 null 반환
- **Given** 인증된 사용자의 `saved_searches` 테이블에 레코드 없음
- **When** `getSavedSearch()` 호출
- **Then** `null` 반환 — UI(UI-014)에서 "저장된 조건이 없습니다" 안내 표시

**AC-6 (도메인 핵심):** 응답 ≤1초
- **Given** 인증된 사용자, 저장된 기록 1건, 유효한 주소 2개
- **When** `getSavedSearch()` 호출
- **Then** 전체 응답 시간(Prisma SELECT + geocoding 재검증 2회) ≤ 1,000ms

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) — 복원 ≤1초에 적용 | `getSavedSearch()` 전체 실행 시간 ≤1초를 performance.now() 측정 테스트로 검증 |
| REQ-NF-016 | "입력값 자동 저장 성공률 — Best effort" (§4.2.2) | getSavedSearch 에러 시 null 반환 (throw 안 함), Sentry만 기록 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | catch 블록에서 `Sentry.captureException` 호출 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `app/actions/save-search.ts` (getSavedSearch 추가 — CMD-SAVE-001과 동일 파일)
- `lib/diagnosis/geocoding.ts` (validateAddress 헬퍼 추가 — CMD-DIAG-001 확장)
- `lib/diagnosis/index.ts` (validateAddress export 추가)
- `__tests__/actions/get-saved-search.spec.ts` (6개 케이스)
- `__tests__/actions/get-saved-search-rev11.spec.ts` (3개 케이스 — Rev 1.1 정적 검증)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 태스크 시작 전 필요):

- **DB-006 ✅:** `model SavedSearch` — SELECT 대상 테이블
- **API-005 ✅:** `GetSavedSearchResponse`, `GeocodingValidationStatus`, `mapToGetResponse` — 응답 DTO + 변환 함수
- **CMD-SAVE-001 (같은 배치):** `saveSearch` — 저장 데이터의 원천. 동일 파일에 추가
- **CMD-DIAG-001 ✅:** `geocodeAddress`, `GeocodedAddress` — geocoding 재검증
- **CMD-AUTH-003 ✅:** `getCurrentUser` — 인증 확인

### 후행 (이 태스크 완료 후 가능):

- **UI-014:** 이전 조건 불러오기 버튼 + 폼 자동 채움 UI — getSavedSearch 데이터 소비
- **TEST-007:** 간이 저장 GWT 시나리오 — getSavedSearch + geocoding 실패 검증

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/actions/get-saved-search.spec.ts` — 6개 케이스 (정상, 없음, 미인증, geocoding 실패/성공, DB 에러)
- **정적 검증:** `__tests__/actions/get-saved-search-rev11.spec.ts` — 3개 케이스 (재계산 0건, 비교 0건, 시나리오 0건)
- **성능 테스트:** 응답 시간 ≤1초 검증
- **수동 검증:**
  1. Prisma Studio에서 saved_searches 레코드 확인 후 getSavedSearch 호출
  2. 존재하지 않는 주소 저장 후 getSavedSearch → geocodingStatus.message 확인
  3. `tsc --noEmit` 통과 확인
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **Geocoding 재검증 비용 (카카오 API 호출):** getSavedSearch 호출 시마다 geocoding 재검증 2회(주소A, 주소B)가 카카오 API 쿼터를 소모한다. 빈번한 불러오기 시 쿼터 초과 가능. 대안: 마지막 검증 시각 캐싱(24시간 유효).
2. **geocoding 재검증 타임아웃:** 카카오 API 응답이 느릴 경우 전체 응답 시간이 1초를 초과할 수 있음. geocoding 호출에 AbortSignal.timeout(500) 적용하여 500ms 초과 시 유효한 것으로 간주하는 방어 로직 검토.
3. **addressB 존재 여부:** 싱글 모드(mode='single')에서는 addressB가 없을 수 있음. 이 경우 geocoding 재검증은 addressA만 수행. mode에 따른 분기 로직 검토 필요.
4. **API-005의 GetSavedSearchResponse 구조 정합성:** API-005에서 `found`, `savedSearch`, `geocodingStatus` 필드로 정의했으나, 본 Server Action은 `null` 또는 `GetSavedSearchResponse`를 반환. null vs `{ found: false }` 중 어느 패턴이 UI-014에 적합한지 확정 필요.
