---
name: Feature Task
title: "[Test] TEST-007: 간이 저장 시나리오 — 저장 best effort 동작 검증, geocoding 실패 안내 (Rev 1.1: AC-1만)"
labels: ['test', 'priority:L', 'epic:Test-SavedSearch', 'wave:6']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-007] 간이 저장 시나리오 — 저장 best effort 동작 검증 + geocoding 실패 안내
- **목적:** SavedSearch 도메인의 best effort 저장 패턴과 geocoding 실패 안내 동작을 GWT 패턴으로 검증. CMD-SAVE-001(best effort UPSERT)과 QRY-SAVE-001(조건 불러오기 + geocoding 재검증)을 통합 검증.
- **범위:**
  - ✅ Playwright E2E 3개 시나리오 (AC-1: best effort 저장 동작, AC-1-2: 저장 실패 시 사용자 미통지, AC-1-3: geocoding 실패 시 안내), Vitest 단위 테스트 (saveSearch best effort + getSavedSearch geocoding), best effort 패턴 정적 검증 (throw 0건, toast 0건), Mock 모드 / 실제 모드 분기
  - ❌ ~~AC-2/3/N1 시나리오~~ (Rev 1.1으로 제거), ~~비교 뷰 검증~~ (Rev 1.1 제거), ~~replaySearch~~ (제거), 결제, NextAuth.js, AES-256
- **복잡도:** L | **Wave:** 6 (Test 트랙)

### ⚠️ Rev 1.1 단순화 (필수 인지)

> **TASK_LIST v1.3 Rev 1.1 변경:**
> | Task ID | 변경 내용 |
> |---|---|
> | TEST-007 | AC-1(저장 best effort) 시나리오만 남기고 AC-2/3/N1 제거 |
> | QRY-SAVE-001 | 재계산 로직·비교 뷰 제거 → "저장된 값을 입력 폼에 채우기"만 남김 |
>
> **적용:** AC-1만 작성, 시나리오 3개로 단순화. 비교 검증 0건.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-025** (§4.1.5): "시스템은 사용자가 진단을 완료하고 세션 종료 또는 앱 종료 시 입력 조건(주소·필터·시간대)을 자동 저장해야 한다. 저장은 best effort로 처리하며 실패 시 사용자에게 알리지 않는다. 다음 방문 시 복원 시간은 1초 이내여야 하며, 불러온 주소가 geocoding 실패 시 \"주소를 다시 입력해주세요\" 안내를 표시한다."
- **REQ-NF-016** (§4.2.2): "입력값 자동 저장 성공률 — Best effort (저장 실패 시 무시, 사용자 미통지)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (커스텀 슬랙 임계치 제거)"

### §4.1.5 Acceptance Criteria (SRS 원문 — Rev 1.5)

| AC | Given | When | Then |
|---|---|---|---|
| AC-1 | 사용자가 진단 완료 상태 | 세션 종료 또는 앱 종료 | 입력 조건 자동 저장 (best effort). 복원 ≤1초 |
| AC-2 | 이전 저장 기록 존재 | "이전 조건 불러오기" 클릭 | 저장된 주소·필터로 `createDiagnosis()` 재호출. geocoding 실패 시 "주소를 다시 입력해주세요" 안내 |

### Rev 1.1 변경 사항 명시 인용

> **v1.1에서 TEST-007의 AC-2/3/N1이 제거됨.**
> - ~~AC-2: 저장된 조건과 새 입력 비교 뷰~~ → **제거**
> - ~~AC-3: 시나리오 비교 (저장 시점 vs 현재)~~ → **제거**
> - ~~AC-N1: replaySearch API 검증~~ → **제거**
>
> → 본 ISSUE는 **AC-1(best effort 저장 동작 + geocoding 실패 안내)만 검증**.

### 검증 대상 ISSUE 표 (CMD-SAVE-001, QRY-SAVE-001)

| Task ID | 산출물 | import 경로 | TEST-007 검증 항목 |
|---|---|---|---|
| CMD-SAVE-001 ✅ | `saveSearch` Server Action (best effort UPSERT) | `@/app/actions/save-search` | best effort 저장 동작 (throw 0건, toast 0건) |
| CMD-SAVE-001 ✅ | `useAutoSave` Hook (beforeunload + 디바운스 5초) | `@/lib/hooks/use-auto-save` | 자동 저장 호출 시점 검증 |
| CMD-SAVE-001 ✅ | `/api/save-search-beacon` Route Handler | `@/app/api/save-search-beacon/route` | sendBeacon best effort |
| QRY-SAVE-001 ✅ | `getSavedSearch` Server Action (geocoding 재검증) | `@/app/actions/save-search` | geocoding 실패 시 안내 표시 |
| QRY-SAVE-001 ✅ | `validateAddress` 헬퍼 | `@/lib/diagnosis/geocoding` | 주소 유효성 재검증 |
| DB-006 ✅ | `model SavedSearch` (Prisma 3필드) | `@prisma/client` | DB UPSERT 검증 |
| UI-014 ✅ | 이전 조건 불러오기 버튼 + 폼 자동 채움 UI | — | E2E 불러오기 대상 |
| MON-001 ✅ | Sentry 통합 | `@sentry/nextjs` | 저장 실패 시 Sentry 이벤트 검증 |

### TEST-001 Playwright 패턴 인용

> TEST-001에서 확립된 패턴을 따른다:
> - `playwright.config.ts` 재사용 (testDir: `./tests/e2e`)
> - `test.describe` 블록 + GWT 주석 패턴
> - Mock 모드 / 실제 모드 환경변수 분기 (`NEXT_PUBLIC_USE_MOCK`)
> - HTML report (`playwright-report/index.html`)

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `tests/e2e/saved-search.spec.ts` 파일 생성 — AC-1: best effort 정상 저장
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('SavedSearch 간이 저장 (Rev 1.1: AC-1만)', () => {
    test('AC-1: best effort 정상 저장 동작', async ({ page }) => {
      // Given: 인증된 상태에서 진단 입력 완료
      await page.goto('/login');
      // Mock OAuth 로그인 (MOCK-005 활용)
      await page.getByRole('button', { name: '카카오로 시작하기' }).click();
      await page.waitForURL('/diagnosis');

      // 주소 입력 (진단 조건)
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');

      // When: 디바운스 5초 대기 후 자동 저장 트리거
      await page.waitForTimeout(6000);

      // Then: DB에 SavedSearch 행 존재 (toast/throw 0건)
      // 사용자 흐름에 영향 없음 확인 — 에러 토스트 0건
      const toastElements = page.locator('[data-toast-error]');
      await expect(toastElements).toHaveCount(0);

      // 새 세션에서 불러오기 확인
      await page.reload();
      await page.goto('/diagnosis');
      const loadButton = page.getByRole('button', { name: '이전 조건 불러오기' });
      if (await loadButton.isVisible()) {
        await loadButton.click();
        // 이전 주소가 폼에 채워짐
        await expect(page.getByLabel('직장 A')).toHaveValue(/강남/);
      }
    });
  });
  ```

- [ ] **3.2** `tests/e2e/saved-search.spec.ts` — AC-1-2: 저장 실패 시 사용자 미통지
  ```typescript
    test('AC-1-2: 저장 실패 시 사용자 미통지 (best effort 핵심)', async ({ page }) => {
      // Given: 네트워크 차단 상태에서 저장 시도
      await page.goto('/diagnosis');

      // Mock OAuth 로그인
      await page.getByRole('button', { name: '카카오로 시작하기' }).click();
      await page.waitForURL('/diagnosis');

      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');

      // When: 저장 API 차단 후 페이지 이탈 트리거
      await page.route('**/api/save-search-beacon', route => route.abort());
      await page.route('**/actions/**', route => {
        if (route.request().method() === 'POST') return route.abort();
        return route.continue();
      });

      // 디바운스 대기
      await page.waitForTimeout(6000);

      // Then: 사용자에게 에러 알림 0건 (toast 0건, 모달 0건)
      const toasts = page.locator('[data-toast]');
      const errorModals = page.locator('[role="alertdialog"]');
      await expect(toasts).toHaveCount(0);
      await expect(errorModals).toHaveCount(0);

      // UI에 변화 없음 — 사용자는 저장 실패를 인지하지 못함 (REQ-NF-016)
    });
  ```

- [ ] **3.3** `tests/e2e/saved-search.spec.ts` — AC-1-3: geocoding 실패 시 안내
  ```typescript
    test('AC-1-3: geocoding 실패 시 "다시 입력해주세요" 안내', async ({ page }) => {
      // Given: 저장된 조건에 만료/무효 주소 포함
      // (Mock 모드에서 geocoding 실패 시뮬레이션)
      await page.route('**/v2/local/search/address**', route =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ documents: [] }), // geocoding 결과 0건
        })
      );

      await page.goto('/diagnosis');

      // When: 이전 조건 불러오기 클릭
      const loadButton = page.getByRole('button', { name: '이전 조건 불러오기' });
      if (await loadButton.isVisible()) {
        await loadButton.click();

        // Then: "다시 입력해주세요" 안내 토스트/메시지 표시
        await expect(
          page.getByText(/다시 입력|주소를 다시 입력해주세요/)
        ).toBeVisible({ timeout: 3000 });
      }
    });
  ```

- [ ] **3.4** `tests/unit/save-search-best-effort.spec.ts` — saveSearch 단위 테스트
  ```typescript
  import { describe, it, expect, vi } from 'vitest';

  describe('saveSearch best effort 패턴 검증 (TEST-007)', () => {
    it('AC-1: 정상 저장 — UPSERT 성공, throw 0건', async () => {
      // saveSearch 호출 후 에러 없이 완료되는지 검증
    });

    it('AC-1-2: DB 에러 — Sentry.captureException만 호출, throw 0건', async () => {
      // DB 연결 실패 mock → saveSearch가 throw 하지 않는지 검증
      // Sentry.captureException이 1회 호출되는지 검증
    });

    it('AC-1-2: 유효하지 않은 입력 — Sentry 경고만, throw 0건', async () => {
      // 잘못된 searchParams 전달 → throw 0건 확인
    });
  });
  ```

- [ ] **3.5** `tests/unit/get-saved-search-geocoding.spec.ts` — getSavedSearch geocoding 검증
  ```typescript
  describe('getSavedSearch geocoding 재검증 (TEST-007)', () => {
    it('AC-1-3: geocoding 성공 — addressAValid: true', async () => {
      // 유효한 주소 저장 → geocoding 성공 → addressAValid === true
    });

    it('AC-1-3: geocoding 실패 — addressAValid: false, message 포함', async () => {
      // 만료된 주소 저장 → geocoding 실패 → addressAValid === false
      // geocodingStatus.message === "주소를 다시 입력해주세요"
    });

    it('저장된 기록 없음 — null 반환', async () => {
      // DB에 레코드 없음 → null 반환
    });
  });
  ```

- [ ] **3.6** `tests/unit/save-search-static.spec.ts` — best effort 정적 검증
  ```typescript
  import { readFileSync } from 'fs';

  describe('saveSearch best effort 정적 검증 (TEST-007)', () => {
    const source = readFileSync('app/actions/save-search.ts', 'utf-8');

    it('throw 문 0건 (best effort 핵심)', () => {
      // catch 블록 안에서 throw가 없어야 함
      const throwCount = (source.match(/^\s*throw\s/gm) || []).length;
      expect(throwCount).toBe(0);
    });

    it('toast/alert/notify 호출 0건', () => {
      expect(source).not.toMatch(/toast\(|alert\(|notify\(/);
    });

    it('Sentry.captureException 호출 존재 (에러 기록은 수행)', () => {
      expect(source).toMatch(/Sentry\.captureException/);
    });
  });
  ```

- [ ] **3.7** Rev 1.1 정합성 정적 검증 — 비교/재계산 코드 0건
  ```typescript
  describe('TEST-007 Rev 1.1 정합성 검증', () => {
    const testSource = readFileSync('tests/e2e/saved-search.spec.ts', 'utf-8');

    it('비교 뷰 키워드 0건 (compare/comparison/diff/versus)', () => {
      expect(testSource).not.toMatch(/compare|comparison|diff|versus/i);
    });

    it('재계산 키워드 0건 (recalculate/replay/recompute)', () => {
      expect(testSource).not.toMatch(/recalculate|replay|recompute|replaySearch/i);
    });

    it('시나리오 비교 키워드 0건', () => {
      expect(testSource).not.toMatch(/scenario/i);
    });
  });
  ```

- [ ] **3.8** `package.json`에 테스트 스크립트 추가
  ```json
  {
    "scripts": {
      "test:e2e:saved-search": "npx playwright test tests/e2e/saved-search.spec.ts",
      "test:unit:saved-search": "npx vitest run tests/unit/save-search-best-effort.spec.ts tests/unit/get-saved-search-geocoding.spec.ts tests/unit/save-search-static.spec.ts"
    }
  }
  ```

- [ ] **3.9** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|replaySearch" tests/e2e/saved-search.spec.ts tests/unit/save-search*` → 0건

- [ ] **3.10** Mock 모드 분기 설정 — `NEXT_PUBLIC_USE_MOCK=true` 시 Mock 데이터, 미설정 시 실제 백엔드

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** best effort 정상 저장 동작
- **Given** 인증된 사용자가 주소A("강남역"), 주소B("판교역"), 필터(maxCommuteTime: 60)를 입력 완료
- **When** 디바운스 5초 경과 또는 페이지 이탈(beforeunload) 트리거
- **Then** `saved_searches` 테이블에 해당 userId 행이 UPSERT. 사용자에게 toast/alert 0건. 다음 방문 시 "이전 조건 불러오기"로 복원 가능

**AC-1-2 (예외 — best effort 핵심):** 저장 실패 시 사용자 미통지
- **Given** 네트워크 장애 또는 DB 연결 실패로 Prisma UPSERT 에러 발생
- **When** `saveSearch()` 내부 catch 블록 실행
- **Then** `Sentry.captureException` 호출 1회. **throw 0건**, **toast 0건**, **에러 모달 0건**. UI에 변화 없음 (REQ-NF-016)

**AC-1-3 (예외):** geocoding 실패 시 안내 표시
- **Given** 저장된 조건의 주소A가 유효하지 않은 상태 (주소 체계 변경 등)
- **When** "이전 조건 불러오기" 클릭 후 geocoding 재검증 실패
- **Then** "주소를 다시 입력해주세요" 안내 메시지 표시. 사용자가 주소를 재입력할 수 있는 상태로 폼 표시

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-016 | "입력값 자동 저장 성공률 — Best effort (저장 실패 시 무시, 사용자 미통지)" (§4.2.2) | AC-1-2에서 throw 0건 + toast 0건 정적 검증. Sentry 호출만 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 저장 실패 시 `Sentry.captureException` 호출을 단위 테스트에서 mock 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `tests/e2e/saved-search.spec.ts` (3개 E2E 시나리오 — AC-1/AC-1-2/AC-1-3)
- `tests/unit/save-search-best-effort.spec.ts` (3개 — saveSearch best effort 검증)
- `tests/unit/get-saved-search-geocoding.spec.ts` (3개 — getSavedSearch geocoding 재검증)
- `tests/unit/save-search-static.spec.ts` (3개 — best effort 정적 검증)
- `package.json` scripts 추가 (test:e2e:saved-search, test:unit:saved-search)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (검증 대상):
- **CMD-SAVE-001 ✅:** `saveSearch` Server Action — best effort UPSERT 검증
- **QRY-SAVE-001 ✅:** `getSavedSearch` Server Action — geocoding 실패 안내 검증
- **DB-006 ✅:** `model SavedSearch` — UPSERT 대상 테이블
- **UI-014 ✅:** 이전 조건 불러오기 버튼 — E2E 불러오기 대상
- **MON-001 ✅:** Sentry 통합 — 저장 실패 시 Sentry 이벤트 검증
- **MOCK-005 ✅:** OAuth Mock — E2E 인증 전제
- **TEST-001 ✅:** Playwright 설정 + 패턴 확립

### 후행:
- **TEST-010:** E2E 통합 시나리오 — TEST-007 포함 전체 플로우

---

## 8. 🧪 Test Plan (검증 절차)

- **E2E (Playwright):** `tests/e2e/saved-search.spec.ts` — 3개 시나리오
  - AC-1: best effort 정상 저장
  - AC-1-2: 저장 실패 시 사용자 미통지
  - AC-1-3: geocoding 실패 시 안내
- **단위 (Vitest):**
  - `tests/unit/save-search-best-effort.spec.ts` — 3개 (saveSearch best effort)
  - `tests/unit/get-saved-search-geocoding.spec.ts` — 3개 (getSavedSearch geocoding)
  - `tests/unit/save-search-static.spec.ts` — 3개 (정적 검증)
  - 총 단위 9개
- **정적 분석:**
  - `grep "throw " app/actions/save-search.ts` → 0건
  - `grep "toast\|alert\|notify" app/actions/save-search.ts` → 0건
  - `grep -ri "NextAuth\|payment\|AES\|replaySearch" tests/` → 0건
  - `grep -ri "compare\|comparison\|diff\|versus\|scenario" tests/e2e/saved-search.spec.ts` → 0건
- **HTML report:** `npx playwright show-report` → 브라우저에서 결과 확인
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **디바운스 5초 적정성:** CMD-SAVE-001에서 설정한 5초 디바운스가 E2E 테스트에서 안정적으로 동작하는지 확인 필요. Playwright의 `waitForTimeout(6000)`으로 검증하지만, CI 환경에서 타이밍 이슈 가능. `retries: 1` 설정으로 일차 대응.
2. **sendBeacon 테스트 한계:** `navigator.sendBeacon`은 Playwright에서 직접 검증이 어려움. 네트워크 요청 인터셉트로 간접 검증하거나, 단위 테스트에서 mock으로 대체.
3. **geocoding 실패 시뮬레이션:** Mock 모드에서 카카오 Geocoding API 응답을 빈 배열로 가로채기(route.fulfill)로 시뮬레이션. 실제 API와의 응답 형식 차이 가능성 있음.
4. **E2E 인증 전제:** 저장 기능은 인증된 사용자에게만 동작. E2E에서 Mock OAuth 로그인 선행 필요 (MOCK-005 활용). CI 환경에서 OAuth Mock 안정성 확인 필요.
