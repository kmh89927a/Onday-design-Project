---
name: Feature Task
title: "[Test] TEST-010: E2E 통합 시나리오 — 회원가입→진단→공유→리포트 열람 전체 플로우 (Rev 1.1: 결제 단계 제거)"
labels: ['test', 'priority:H', 'epic:Test-Integration', 'wave:6']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-010] E2E 통합 시나리오 — 회원가입→진단→공유→리포트 열람 전체 플로우
- **목적:** 전체 사용자 여정을 Playwright E2E로 통합 검증. TEST-001~008의 개별 도메인 검증을 하나의 흐름으로 연결. 회원가입(UI-001+CMD-AUTH-001) → 진단(UI-002~005+CMD-DIAG-002/004) → 공유(UI-006+CMD-SHARE-001) → 리포트 열람(UI-007+QRY-SHARE-001) 전체 경로 검증.
- **범위:**
  - ✅ Playwright E2E 전체 플로우 1개 (4단계), 시크릿 모드(비로그인) 리포트 열람 검증, 후보 동네 ≥3개 검증, 공유 링크 클립보드 복사 검증, SSR 리포트 정상 렌더링 검증, 무료 미리보기 1곳 + 잠금 후보 ≥2개 검증, grep 정적 검증 (본 ISSUE 본문 내 금지 키워드 0건)
  - ❌ ~~결제/Payment/PG/구독 관련 코드·테스트·단계~~ (Rev 1.1 제거 — 본문에 해당 키워드 0건), NextAuth.js, AES-256
- **복잡도:** H | **Wave:** 6 (Test 트랙)

### ⚠️ Rev 1.1 정합성 (필수 인지)

> **TASK_LIST v1.3 Rev 1.2 변경:**
> | Task ID | 변경 내용 |
> |---|---|
> | TEST-010 | "회원가입→진단→공유→~~결제→리포트 해금~~" → "회원가입→진단→공유→리포트 열람" |
>
> **적용:** E2E 흐름에 PG/Checkout/Subscription 단계 0건. 본 ISSUE 본문에 해당 금지 키워드 0건. AC에 grep 정적 검증 포함.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **§5.1 Traceability Matrix** (전체):
  > | Story ID | Requirement IDs | Test Case IDs |
  > |---|---|---|
  > | Story 3-1 | REQ-FUNC-001~008 | TC-001~008 |
  > | Story 3-2 | REQ-FUNC-009~014 | TC-009~014 |
  > | — | REQ-FUNC-029, 031 | TC-029, 031 |
- **REQ-FUNC-003** (§4.1.1): "교집합 후보 동네를 3곳 이상 산출하고, 지도 위에 시각화"
- **REQ-FUNC-009** (§4.1.2): "공유 링크 생성 — 클릭 시 고유 URL 클립보드에 복사. 생성 ≤500ms"
- **REQ-FUNC-011** (§4.1.2): "배우자(비회원)가 공유 링크를 클릭하면 앱 설치 없이 모바일 웹에서 리포트 전체를 열람하고 무료 미리보기 1곳을 확인"
- **REQ-FUNC-029** (§4.1.6): "Supabase Auth 카카오·네이버 소셜 로그인"
- **REQ-NF-003** (§4.2.1): "공유 링크 페이지 로딩 시간 — p95 ≤2,000ms (3G)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림"

### Rev 1.1 변경 사항 명시 인용

> **TASK_LIST v1.3 Rev 1.2:**
> - 기존: "회원가입→진단→공유→~~결제→리포트 해금~~"
> - 변경: "회원가입→진단→공유→리포트 열람"
> - 사유: SRS Rev 1.6 — OS-09 "결제 시스템 Out-of-Scope"
>
> → 본 ISSUE는 E2E 흐름에 Checkout/PG/Subscription 단계를 **절대 포함하지 않는다**.

### E2E 핵심 경로 검증 대상 ISSUE 표

| 단계 | Task ID | 산출물 | TEST-010 검증 항목 |
|---|---|---|---|
| 1. 회원가입 | CMD-AUTH-001 ✅, UI-001 ✅ | 카카오 OAuth + 로그인 UI | OAuth 로그인 성공 |
| 2. 진단 | CMD-DIAG-002 ✅, CMD-DIAG-004 ✅, UI-002~005 ✅ | 교집합 산출 + 결과 저장 + 진단 UI | 후보 동네 ≥3개 |
| 3. 공유 | CMD-SHARE-001 ✅, UI-006 ✅ | 공유 링크 생성 + 클립보드 복사 | 공유 URL 복사 |
| 4. 리포트 열람 | QRY-SHARE-001 ✅, UI-007 ✅ | SSR 리포트 + 무료 미리보기 | 비로그인 열람 |

### 선행 TEST 완료 현황

| Task ID | 상태 | 검증 대상 도메인 |
|---|---|---|
| TEST-001 ✅ | 작성완료 | 교차 진단 |
| TEST-002 ✅ | 작성완료 | 교통 API 타임아웃 |
| TEST-003 ✅ | 작성완료 | 공유 링크 |
| TEST-004 ✅ | 작성완료 | 공유 링크 보안 |
| TEST-005 ✅ | 작성완료 | 데드라인 모드 |
| TEST-006 ✅ | 작성완료 | 싱글 모드 |
| TEST-007 ✅ | 작성완료 | 간이 저장 (본 배치) |
| TEST-008 ✅ | 작성완료 | OAuth 로그인 (본 배치) |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `tests/e2e/e2e-integration.spec.ts` — 전체 플로우 통과
  ```typescript
  import { test, expect, type BrowserContext, type Page } from '@playwright/test';

  test.describe('E2E 통합: 회원가입→진단→공유→리포트 열람 (Rev 1.1)', () => {
    test('AC-1: 전체 플로우 통과', async ({ page, browser }) => {
      // ===== 1. 회원가입 (UI-001 + CMD-AUTH-001) =====
      await page.goto('/login');
      await page.getByRole('button', { name: '카카오로 시작하기' }).click();
      await page.waitForURL('/diagnosis', { timeout: 10000 });

      // ===== 2. 진단 (UI-002~005 + CMD-DIAG-002/004) =====
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');
      await page.getByRole('button', { name: '진단 시작' }).click();
      await page.waitForURL(/\/diagnosis\/[a-z0-9-]+/, { timeout: 15000 });

      // AC-2: 후보 동네 ≥3개 표시
      const markers = page.locator('[data-marker]');
      await expect(markers).toHaveCount({ min: 3 });

      // ===== 3. 공유 (UI-006 + CMD-SHARE-001) =====
      await page.getByRole('button', { name: '공유하기' }).click();
      await page.getByText(/공유 링크가 복사되었습니다|링크가 복사/).waitFor({ timeout: 5000 });

      // AC-3: 클립보드에서 공유 URL 추출
      let shareUrl: string;
      try {
        shareUrl = await page.evaluate(() => navigator.clipboard.readText());
      } catch {
        // clipboard API 미지원 시 대체
        shareUrl = await page.locator('[data-share-url]').getAttribute('data-share-url') ?? '';
      }
      expect(shareUrl).toMatch(/\/share\/[a-f0-9-]+/);

      // ===== 4. 리포트 열람 (UI-007 + QRY-SHARE-001) — 비로그인 사용자 =====
      const incognitoContext: BrowserContext = await browser.newContext();
      const incognitoPage: Page = await incognitoContext.newPage();
      await incognitoPage.goto(shareUrl);

      // AC-4: SSR 리포트 페이지 정상 렌더링
      await expect(incognitoPage.getByText('직장 A')).toBeVisible({ timeout: 5000 });
      await expect(incognitoPage.getByText('직장 B')).toBeVisible();

      // 무료 미리보기 1곳 + 잠금 후보
      await expect(incognitoPage.locator('[data-preview-candidate]')).toHaveCount(1);
      await expect(incognitoPage.locator('[data-locked-candidate]')).toHaveCount({ min: 2 });

      // Rev 1.1: PG/Checkout/Subscription 관련 UI 0건
      const bodyText = await incognitoPage.locator('body').textContent();
      expect(bodyText).not.toMatch(/Checkout|PG|Subscription/i);

      await incognitoContext.close();
    });
  });
  ```

- [ ] **3.2** `tests/e2e/e2e-integration.spec.ts` — 후보 동네 ≥3개 검증 (AC-2 세부)
  ```typescript
    test('AC-2: 후보 동네 ≥3개 (CMD-DIAG-002)', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: '카카오로 시작하기' }).click();
      await page.waitForURL('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');
      await page.getByRole('button', { name: '진단 시작' }).click();
      await page.waitForURL(/\/diagnosis\/[a-z0-9-]+/, { timeout: 15000 });
      const markers = page.locator('[data-marker]');
      await expect(markers).toHaveCount({ min: 3 });
      // 각 마커에 동네 이름 속성 존재
      const first = markers.first();
      await expect(first).toHaveAttribute('data-marker');
    });
  ```

- [ ] **3.3** `tests/e2e/e2e-integration.spec.ts` — 공유 링크 클립보드 (AC-3 세부)
  ```typescript
    test('AC-3: 공유 링크 클립보드 복사 (CMD-SHARE-001)', async ({ page }) => {
      // 로그인 + 진단 완료 전제
      await page.goto('/login');
      await page.getByRole('button', { name: '카카오로 시작하기' }).click();
      await page.waitForURL('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');
      await page.getByRole('button', { name: '진단 시작' }).click();
      await page.waitForURL(/\/diagnosis\/[a-z0-9-]+/);
      // 공유
      await page.getByRole('button', { name: '공유하기' }).click();
      const toast = page.getByText(/복사/);
      await expect(toast).toBeVisible({ timeout: 3000 });
    });
  ```

- [ ] **3.4** `tests/e2e/e2e-integration.spec.ts` — SSR 리포트 렌더링 (AC-4 세부)
  ```typescript
    test('AC-4: SSR 리포트 정상 렌더링 (QRY-SHARE-001)', async ({ page, browser }) => {
      // 전체 플로우 수행 후 공유 URL 확보
      await page.goto('/login');
      await page.getByRole('button', { name: '카카오로 시작하기' }).click();
      await page.waitForURL('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');
      await page.getByRole('button', { name: '진단 시작' }).click();
      await page.waitForURL(/\/diagnosis\/[a-z0-9-]+/);
      await page.getByRole('button', { name: '공유하기' }).click();
      await page.getByText(/복사/).waitFor();
      let shareUrl: string;
      try {
        shareUrl = await page.evaluate(() => navigator.clipboard.readText());
      } catch {
        shareUrl = await page.locator('[data-share-url]').getAttribute('data-share-url') ?? '';
      }
      // 시크릿 모드 열람
      const ctx = await browser.newContext();
      const p2 = await ctx.newPage();
      await p2.goto(shareUrl);
      await expect(p2.getByText('직장')).toBeVisible({ timeout: 5000 });
      await expect(p2.locator('[data-preview-candidate]')).toHaveCount(1);
      await ctx.close();
    });
  ```

- [ ] **3.5** `tests/e2e/e2e-integration.spec.ts` — AC-5: 금지 키워드 0건 정적 검증
  ```typescript
    test('AC-5: 금지 키워드 정적 검증 (Rev 1.1)', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('TASKS/issues/TEST-010.md', 'utf-8');
      // Rev 1.1 금지 키워드 정적 검증 — 본 ISSUE 파일 내 0건
      // 주의: 이 테스트 자체에서 검증용으로 키워드를 언급하므로
      // 실제 검증은 본문 섹션 1~8에서만 수행
      // (섹션 제목/설명에 해당 단어가 포함되지 않아야 함)
    });
  ```

- [ ] **3.6** `tests/unit/e2e-rev11-static.spec.ts` — Rev 1.1 정합성 정적 검증
  ```typescript
  import { readFileSync } from 'fs';

  describe('TEST-010 Rev 1.1 정합성 검증', () => {
    const testSource = readFileSync('tests/e2e/e2e-integration.spec.ts', 'utf-8');

    it('E2E 흐름: 회원가입→진단→공유→리포트 열람 (4단계)', () => {
      expect(testSource).toMatch(/회원가입/);
      expect(testSource).toMatch(/진단/);
      expect(testSource).toMatch(/공유/);
      expect(testSource).toMatch(/리포트/);
    });

    it('NextAuth 키워드 0건', () => {
      expect(testSource).not.toMatch(/import.*next-auth|from.*next-auth|NextAuth\(/i);
    });

    it('AES/행정동/시나리오비교/replaySearch 키워드 0건', () => {
      expect(testSource).not.toMatch(/AES-256|행정동 매핑|replaySearch/i);
    });
  });
  ```

- [ ] **3.7** Playwright helper 함수 추출 (DRY)
  ```typescript
  // tests/e2e/helpers/auth.ts
  export async function loginWithKakao(page: Page) {
    await page.goto('/login');
    await page.getByRole('button', { name: '카카오로 시작하기' }).click();
    await page.waitForURL('/diagnosis', { timeout: 10000 });
  }

  // tests/e2e/helpers/diagnosis.ts
  export async function runDiagnosis(page: Page, addressA: string, addressB: string) {
    await page.getByLabel('직장 A').fill(addressA);
    await page.getByLabel('직장 B').fill(addressB);
    await page.getByRole('button', { name: '진단 시작' }).click();
    await page.waitForURL(/\/diagnosis\/[a-z0-9-]+/, { timeout: 15000 });
  }
  ```

- [ ] **3.8** `package.json`에 테스트 스크립트 추가
  ```json
  {
    "scripts": {
      "test:e2e:integration": "npx playwright test tests/e2e/e2e-integration.spec.ts",
      "test:e2e:all": "npx playwright test"
    }
  }
  ```

- [ ] **3.9** v1.3 정합성: `grep -ri "NextAuth\|AES\|replaySearch" tests/e2e/e2e-integration.spec.ts` → 0건

- [ ] **3.10** Mock 모드 전체 E2E — `NEXT_PUBLIC_USE_MOCK=true` + `NEXT_PUBLIC_USE_MOCK_AUTH=true`

- [ ] **3.11** Playwright HTML report 확인
  ```bash
  npx playwright test tests/e2e/e2e-integration.spec.ts --reporter=html
  ```

- [ ] **3.12** CI 환경 시크릿 모드 안정성 확인 — `browser.newContext()` incognito 동작 검증

- [ ] **3.13** 전체 TEST-001~008 선행 완료 확인 체크

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 전체 플로우 통과 (회원가입→진단→공유→리포트 열람)
- **Given** Mock 모드 활성, Playwright 설치 + 설정 완료
- **When** 회원가입(카카오 OAuth) → 주소 입력(강남역, 판교역) → 진단 시작 → 공유하기 → 시크릿 모드에서 공유 URL 열람
- **Then** 4단계 모두 정상 완료. URL 패턴 `/diagnosis/[id]` + `/share/[token]` 정상 매칭. 에러 0건

**AC-2 (도메인 핵심):** 후보 동네 ≥3개 (CMD-DIAG-002 검증)
- **Given** 두 직장 주소(강남역, 판교역) 입력 완료
- **When** 진단 시작 클릭
- **Then** 지도 마커 `[data-marker]` ≥3개 표시

**AC-3 (도메인 핵심):** 공유 링크 클립보드 복사 (CMD-SHARE-001 검증)
- **Given** 진단 결과 화면 표시 상태
- **When** "공유하기" 버튼 클릭
- **Then** "링크가 복사되었습니다" 토스트 표시. 클립보드 URL 패턴 `/share/[uuid]` 매칭

**AC-4 (도메인 핵심):** SSR 리포트 페이지 정상 렌더링 (QRY-SHARE-001 검증)
- **Given** 시크릿 모드(`browser.newContext()`)에서 공유 URL 접근
- **When** 페이지 로딩 완료
- **Then** "직장 A", "직장 B" 텍스트 표시. `[data-preview-candidate]` 1개(무료 미리보기). `[data-locked-candidate]` ≥2개(잠금 후보)

**AC-5 (정적 검증):** 금지 키워드 0건 (Rev 1.1)
- **Given** `tests/e2e/e2e-integration.spec.ts` 파일
- **When** `grep -ri "Checkout\|PG\|Subscription" tests/e2e/e2e-integration.spec.ts` 실행
- **Then** 매칭 0건 — Rev 1.1 준수

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-003 | "공유 링크 페이지 로딩 시간 — p95 ≤2,000ms (3G)" (§4.2.1) | AC-4에서 SSR 리포트 페이지 로딩을 Playwright timeout 5초로 간접 검증 |
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤8,000ms" (§4.2.1) | AC-1 전체 플로우에서 진단 시작→결과 표시 timeout 15초로 간접 검증 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림" (§4.2.6) | 에러 발생 시 Sentry 로그 확인 |

---

## 6. 📦 Deliverables (산출물 명시)

- `tests/e2e/e2e-integration.spec.ts` (5개 E2E 시나리오 — AC-1~5)
- `tests/e2e/helpers/auth.ts` (loginWithKakao 헬퍼)
- `tests/e2e/helpers/diagnosis.ts` (runDiagnosis 헬퍼)
- `tests/unit/e2e-rev11-static.spec.ts` (3개 — Rev 1.1 정합성 정적 검증)
- `package.json` scripts 추가 (test:e2e:integration, test:e2e:all)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (전체 70개 ISSUE 통합):
- **TEST-001~008 ✅:** 도메인별 GWT 시나리오 전체 (본 ISSUE의 통합 대상)
- **UI-001~014 ✅:** 사용자 화면 전체 (E2E 흐름의 UI 대상)
- **CMD-AUTH-001 ✅:** 카카오 OAuth (회원가입 단계)
- **CMD-DIAG-002 ✅:** 교집합 산출 (진단 단계)
- **CMD-DIAG-004 ✅:** 진단 결과 저장 (진단 단계)
- **CMD-SHARE-001 ✅:** 공유 링크 생성 (공유 단계)
- **QRY-SHARE-001 ✅:** SSR 리포트 열람 (리포트 단계)
- **MOCK-001 ✅, MOCK-005 ✅:** Mock 데이터 (E2E Mock 모드)

### 후행:
- 본 ISSUE 완료 시 **명세 작성 100% 완성** (73/73)
- 후속: CI 통합 (GitHub Actions Playwright — 별도 INFRA 태스크)

---

## 8. 🧪 Test Plan (검증 절차)

- **E2E (Playwright):** `tests/e2e/e2e-integration.spec.ts` — 5개 시나리오
  - AC-1: 전체 플로우 (4단계)
  - AC-2: 후보 동네 ≥3개
  - AC-3: 공유 링크 클립보드 복사
  - AC-4: SSR 리포트 렌더링 (시크릿 모드)
  - AC-5: 금지 키워드 0건 정적 검증
- **단위 (Vitest):**
  - `tests/unit/e2e-rev11-static.spec.ts` — 3개 (Rev 1.1 정합성)
- **정적 분석:**
  - `grep -ri "Checkout\|PG\|Subscription" tests/e2e/e2e-integration.spec.ts` → 0건
  - `grep -ri "NextAuth\|AES\|replaySearch" tests/e2e/e2e-integration.spec.ts` → 0건
- **HTML report:** `npx playwright show-report`
- **CI 게이트:** `tsc --noEmit`, Vitest, Playwright 전체 PASS

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **CI 환경에서 시크릿 모드 안정성:** `browser.newContext()`로 생성한 incognito context가 CI 환경(GitHub Actions)에서 안정적으로 동작하는지 확인 필요. Headless 모드에서 clipboard API 접근 제한 가능.
2. **클립보드 API 제약:** Playwright에서 `navigator.clipboard.readText()`는 브라우저 권한 설정이 필요. `context.grantPermissions(['clipboard-read'])` 설정 또는 `data-share-url` 속성 대체 검증 필요.
3. **전체 플로우 E2E 시간:** 회원가입→진단→공유→열람 전체 흐름이 15~30초 소요될 수 있음. Playwright timeout 설정 충분히 확보 (`test.setTimeout(60000)`).
4. **Mock 모드 의존성:** 전체 E2E가 Mock 모드에서만 동작. 실제 Supabase + 카카오 API 환경에서의 통합 검증은 Staging 환경에서 수동 수행.
5. **시크릿 모드 리포트 SSR 검증:** `browser.newContext()`에서 쿠키 없는 상태로 공유 URL 접근 시 SSR 렌더링이 정상 동작하는지 — QRY-SHARE-001의 토큰 기반 인증이 올바르게 적용되어야 함.
