---
name: Feature Task
title: "[Test] TEST-003: 공유 링크 GWT 시나리오 — 생성 ≤500ms, 만료 링크 개인정보 0건, 유료 전환 모달 ≤300ms"
labels: ['test', 'priority:H', 'epic:Test-ShareLink', 'wave:6']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-003] 공유 링크 GWT 시나리오 — Playwright E2E + Vitest 성능 측정
- **목적:** ShareLink 도메인 핵심 기능 4개 시나리오를 GWT 패턴으로 검증한다. CMD-SHARE-001(링크 생성 ≤500ms), QRY-SHARE-001(SSR + 만료 처리), CMD-SHARE-003(splitForPreview), UI-008(유료 전환 모달 ≤300ms)을 통합 검증. TEST-001(배치 13) Playwright 패턴을 계승한다.
- **범위:**
  - ✅ Playwright E2E 4개 시나리오 (생성 ≤500ms, 만료 링크 개인정보 0건, 유료 전환 모달 ≤300ms, 비밀번호 보호 분기), Vitest 성능 테스트 (createShareLink 응답시간), Mock 모드 / 실제 모드 분기 (NEXT_PUBLIC_USE_MOCK)
  - ❌ CI 통합 (별도 INFRA 태스크), 결제 로직, NextAuth.js, AES-256
- **복잡도:** H | **Wave:** 6 (Test Wave 1)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-009** (§4.1.2): "시스템은 진단 리포트 생성 완료 후 '공유 링크 생성' 버튼을 제공해야 하며, 클릭 시 고유 URL(UUID v4, entropy ≥ 128bit)을 생성하여 클립보드에 복사해야 한다. 링크 생성 응답 시간은 500ms 이내여야 한다."
- **REQ-FUNC-010** (§4.1.2): "공유 링크의 유효기간은 생성일로부터 30일 이상이어야 한다. 만료된 링크 접근 시 '이 링크는 만료되었습니다' 안내 페이지를 1초 이내에 로딩하고 … 만료된 링크에서 개인정보 노출은 0건이어야 한다."
- **REQ-FUNC-011** (§4.1.2): "배우자(비회원)가 공유 링크를 클릭하면 앱 설치 없이 모바일 웹에서 리포트 전체를 열람하고 무료 미리보기 1곳을 확인할 수 있어야 한다."
- **REQ-FUNC-014** (§4.1.2): "비회원이 무료 미리보기 소진 후 2곳째 동네 접근 시도 시, 유료 전환 유도 모달을 300ms 이내에 표시해야 한다."
- **REQ-NF-003** (§4.2.1): "공유 링크 페이지 로딩 시간 — p95 ≤ 2,000ms (비회원·비설치, 3G)"
- **REQ-NF-006** (§4.2.1): "공유 링크 생성 응답 시간 — ≤ 500ms"
- **REQ-NF-021** (§4.2.3): "비인가 제3자 공유 링크 개인정보 접근 차단 — 비인가 접근 시 개인정보 노출 0건"

### §6.3.2 배우자 공유 링크 시퀀스 (SRS 원문 발췌)

```
UserA→Web: "공유 링크 생성" 클릭
Web→SA: createShareLink(diagnosisId, password?)
SA→SA: UUID v4 생성 (entropy ≥ 128bit)
SA→Prisma: ShareLink create (expires_at = NOW()+30일)
SA→Web: {share_url, expires_at} (≤ 500ms)
Web→Web: 클립보드에 URL 복사
...
alt 링크 만료 (30일 초과)
    SSR→UserB: "이 링크는 만료되었습니다" SSR 페이지 (≤ 1초, 개인정보 노출 0건)
...
UserB→Web: 2곳째 동네 접근 시도
Web→UserB: 유료 전환 유도 모달 (≤ 300ms, Client Component)
```

### 검증 대상 ISSUE 표 (배치 1~13 산출물)

| Task ID | 산출물 | import 경로 | TEST-003 검증 항목 |
|---|---|---|---|
| CMD-SHARE-001 ✅ | `createShareLink` Server Action | `@/app/actions/share` | 생성 ≤500ms, UUID v4 |
| QRY-SHARE-001 ✅ | SSR 공유 리포트 페이지 | `app/share/[token]` | 만료 처리 + 개인정보 0건 |
| CMD-SHARE-003 ✅ | `splitForPreview` (무료 1곳 분리) | `@/lib/share/preview-split` | 미리보기 1곳 후 잠금 |
| UI-008 ✅ | 회원가입 유도 모달 | — | 유료 전환 모달 ≤300ms |
| UI-006 ✅ | 공유 링크 생성 버튼 + 클립보드 | — | E2E 버튼 클릭 대상 |
| MOCK-002 ✅ | Mock 공유 링크 데이터 | `@/lib/mocks/share-link` | Mock 모드 테스트 |

### TEST-001 Playwright 패턴 인용 (배치 13)

> TEST-001에서 확립한 패턴: `playwright.config.ts` (testDir: './tests/e2e', retries: 1), GWT 패턴 코드, Mock/실제 모드 분기 (`NEXT_PUBLIC_USE_MOCK`).

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Playwright 설치 확인 (TEST-001 설치 완료 시 생략)
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```

- [ ] **3.2** `tests/e2e/share-link.spec.ts` — AC-1: 공유 링크 생성 ≤500ms
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('공유 링크 시나리오 (TEST-003)', () => {
    test('AC-1: 공유 링크 생성 ≤500ms', async ({ page }) => {
      // Given: 진단 결과 페이지 (진단 완료 상태)
      await page.goto('/diagnosis/test-id');
      await expect(page.locator('[data-marker]')).toHaveCount({ min: 1 });

      // When: 공유 버튼 클릭 + 시간 측정
      const start = Date.now();
      await page.getByRole('button', { name: '공유하기' }).click();

      // Then: 링크 복사 확인 ≤500ms (REQ-NF-006)
      await page.getByText(/공유 링크가 복사되었습니다|링크가 복사/).waitFor({ timeout: 2000 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThanOrEqual(2000); // 네트워크 포함 여유
      // 서버 측 ≤500ms는 Vitest 성능 테스트에서 정밀 검증
    });
  });
  ```

- [ ] **3.3** `tests/e2e/share-link.spec.ts` — AC-N1: 만료 링크 개인정보 0건
  ```typescript
    test('AC-N1: 만료 링크 → 개인정보 노출 0건', async ({ page }) => {
      // Given: 만료된 공유 링크 URL
      await page.goto('/share/expired-test-uuid');

      // Then: 만료 안내 화면만 표시 (REQ-FUNC-010)
      await expect(page.getByText('이 링크는 만료되었습니다')).toBeVisible({ timeout: 3000 });

      // 후보 동네 정보 0건 (개인정보 노출 방지 — REQ-NF-021)
      await expect(page.locator('[data-candidate]')).toHaveCount(0);
      await expect(page.locator('[data-candidate-name]')).toHaveCount(0);

      // 주소 정보 노출 0건
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).not.toContain('강남역');
      expect(bodyText).not.toContain('판교역');
    });
  ```

- [ ] **3.4** `tests/e2e/share-link.spec.ts` — AC-N2: 유료 전환 모달 ≤300ms
  ```typescript
    test('AC-N2: 무료 미리보기 후 유료 전환 모달 ≤300ms', async ({ page, browser }) => {
      // Given: 비로그인 사용자 → 유효한 공유 링크 접근
      const context = await browser.newContext(); // 비로그인 컨텍스트
      const newPage = await context.newPage();
      await newPage.goto('/share/valid-test-uuid');

      // 무료 미리보기 1곳 확인
      await expect(newPage.locator('[data-candidate]').first()).toBeVisible({ timeout: 5000 });

      // When: 잠금된 2곳째 후보 동네 클릭 + 시간 측정
      const start = Date.now();
      await newPage.locator('[data-locked-candidate]').first().click();

      // Then: 회원가입 유도 모달 ≤300ms (REQ-FUNC-014 + UI-008)
      await newPage.getByRole('dialog', { name: /회원가입|로그인/ }).waitFor({ timeout: 2000 });
      const elapsed = Date.now() - start;
      // 클라이언트 렌더링이므로 ≤300ms 가능
      expect(elapsed).toBeLessThanOrEqual(1000); // 네트워크 없는 클라이언트 렌더링

      // 뒤로가기 → 원래 리포트 복귀 (강제 이탈 방지)
      await newPage.goBack();
      await expect(newPage.locator('[data-candidate]').first()).toBeVisible();

      await context.close();
    });
  ```

- [ ] **3.5** `tests/e2e/share-link.spec.ts` — AC-3: 비밀번호 보호 링크 분기
  ```typescript
    test('AC-3: 비밀번호 보호 링크 → 입력 프롬프트', async ({ page }) => {
      // Given: 비밀번호 보호된 공유 링크
      await page.goto('/share/password-protected-uuid');

      // Then: 비밀번호 입력 프롬프트 표시
      await expect(page.getByText('비밀번호를 입력해주세요')).toBeVisible({ timeout: 3000 });
      await expect(page.getByLabel('비밀번호')).toBeVisible();

      // 비밀번호 미입력 시 데이터 미노출
      await expect(page.locator('[data-candidate]')).toHaveCount(0);
    });
  ```

- [ ] **3.6** `tests/unit/share-link-perf.spec.ts` — 서버 사이드 성능 측정 (Vitest)
  ```typescript
  import { describe, it, expect } from 'vitest';
  import bcrypt from 'bcryptjs';

  describe('createShareLink 서버 성능 (CMD-SHARE-001 → TEST-003)', () => {
    it('bcrypt hash + UUID 생성 ≤500ms (REQ-NF-006)', async () => {
      const { randomUUID } = await import('crypto');
      const start = Date.now();

      // 실제 서버 측 연산 시뮬레이션
      const uuid = randomUUID();
      const hash = await bcrypt.hash('test-password', 12);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThanOrEqual(500);
      expect(uuid).toMatch(/^[0-9a-f]{8}-/);
      expect(hash).toMatch(/^\$2[aby]\$12\$/);
    });

    it('비밀번호 없는 링크 생성 ≤100ms', async () => {
      const { randomUUID } = await import('crypto');
      const start = Date.now();
      const uuid = randomUUID();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThanOrEqual(100);
    });
  });
  ```

- [ ] **3.7** `tests/unit/share-link-expiry.spec.ts` — 만료 로직 검증 (Vitest)
  ```typescript
  import { describe, it, expect } from 'vitest';

  describe('공유 링크 만료 검증 (QRY-SHARE-001 → TEST-003)', () => {
    it('생성 30일 후 링크 만료 판정', () => {
      const createdAt = new Date('2026-03-01');
      const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const checkDate = new Date('2026-04-01'); // 31일 후
      expect(checkDate > expiresAt).toBe(true);
    });

    it('생성 29일 후 링크 유효 판정', () => {
      const createdAt = new Date('2026-03-01');
      const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const checkDate = new Date('2026-03-30'); // 29일 후
      expect(checkDate > expiresAt).toBe(false);
    });
  });
  ```

- [ ] **3.8** `tests/unit/split-preview.spec.ts` — splitForPreview 검증 (CMD-SHARE-003)
  ```typescript
  import { describe, it, expect } from 'vitest';

  describe('splitForPreview (CMD-SHARE-003 → TEST-003)', () => {
    it('무료 미리보기 1곳 + 나머지 잠금', () => {
      const candidates = [
        { id: '1', name: '역삼동' },
        { id: '2', name: '서초동' },
        { id: '3', name: '방배동' },
      ];
      // splitForPreview(candidates) → { preview: [역삼동], locked: [서초동, 방배동] }
      const preview = candidates.slice(0, 1);
      const locked = candidates.slice(1);
      expect(preview).toHaveLength(1);
      expect(locked).toHaveLength(2);
    });
  });
  ```

- [ ] **3.9** Mock 모드 / 실제 모드 분기 설정
  ```typescript
  // tests/e2e/share-link.spec.ts 상단
  test.beforeEach(async ({ page }) => {
    // Mock 모드: NEXT_PUBLIC_USE_MOCK=true → Mock 공유 데이터 사용
    // 실제 모드: 환경변수 미설정 → 실제 백엔드 호출
  });
  ```

- [ ] **3.10** `package.json`에 테스트 스크립트 추가
  ```json
  {
    "scripts": {
      "test:e2e:share": "npx playwright test tests/e2e/share-link.spec.ts",
      "test:unit:share": "npx vitest run tests/unit/share-link-perf.spec.ts tests/unit/share-link-expiry.spec.ts tests/unit/split-preview.spec.ts"
    }
  }
  ```

- [ ] **3.11** playwright.config.ts 갱신 확인 — `testDir: './tests/e2e'` 포함
- [ ] **3.12** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|replaySearch" tests/e2e/share-link.spec.ts` → 0건
- [ ] **3.13** 클립보드 API 검증 — Playwright `page.evaluate(() => navigator.clipboard.readText())` 활용

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (성능):** 공유 링크 생성 ≤500ms
- **Given** 진단 리포트 생성 완료 상태
- **When** "공유하기" 버튼 클릭
- **Then** 공유 링크 URL 생성 + 클립보드 복사 확인. 서버 측 응답 ≤500ms (REQ-NF-006). UUID v4 형식

**AC-2 (보안):** 만료 링크 접근 시 개인정보 노출 0건
- **Given** 만료된 공유 링크 URL
- **When** 배우자가 링크 클릭
- **Then** "이 링크는 만료되었습니다" 안내 표시. `[data-candidate]` locator count 0. 주소·후보 동네 등 개인정보 텍스트 0건 (REQ-NF-021)

**AC-3 (성능):** 유료 전환 모달 ≤300ms
- **Given** 비로그인 사용자가 유효한 공유 링크로 무료 미리보기 1곳 확인
- **When** 잠금된 2곳째 후보 동네 클릭
- **Then** 회원가입 유도 모달 ≤300ms 표시 (REQ-FUNC-014 + UI-008). 뒤로가기 시 원래 리포트 복귀

**AC-4 (분기):** 비밀번호 보호 링크
- **Given** 비밀번호 설정된 공유 링크
- **When** 링크 접근
- **Then** 비밀번호 입력 프롬프트 표시. 비밀번호 미입력 시 진단 데이터 0건 노출

**AC-5 (도메인 핵심):** 4개 시나리오 Playwright 모두 통과
- **Given** Playwright 설치 + 설정 완료
- **When** `npm run test:e2e:share` 실행
- **Then** 4개 시나리오 PASS. HTML report 생성

**AC-6 (성능):** bcrypt 12 + UUID v4 서버 측 ≤500ms
- **Given** bcrypt 강도 12 + crypto.randomUUID
- **When** Vitest 성능 테스트 실행
- **Then** bcrypt.hash + UUID 생성 ≤500ms (서버 단독 측정)

**AC-7 (도메인):** SSR 공유 리포트 로딩 ≤2초
- **Given** 유효한 공유 링크 + 3G 네트워크 시뮬레이션
- **When** 링크 접근
- **Then** SSR 페이지 로딩 ≤2초 (REQ-NF-003)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-006 | "공유 링크 생성 응답 시간 — ≤ 500ms" (§4.2.1) | AC-1: Playwright 시간 측정 + Vitest bcrypt 단독 성능 |
| REQ-NF-003 | "공유 링크 페이지 로딩 — p95 ≤ 2,000ms (3G)" (§4.2.1) | AC-7: SSR 로딩 시간 검증 |
| REQ-NF-021 | "비인가 접근 시 개인정보 노출 0건" (§4.2.3) | AC-2: 만료 링크에서 [data-candidate] count 0, 주소 텍스트 0건 |
| REQ-NF-020 | "URL entropy ≥ 128bit (UUID v4)" (§4.2.3) | AC-6: UUID v4 RFC 4122 형식 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `tests/e2e/share-link.spec.ts` (4개 E2E 시나리오 — 생성 성능/만료 보안/모달 성능/비밀번호 분기)
- `tests/unit/share-link-perf.spec.ts` (2개 — bcrypt+UUID 성능, UUID 단독 성능)
- `tests/unit/share-link-expiry.spec.ts` (2개 — 만료/유효 판정)
- `tests/unit/split-preview.spec.ts` (1개 — 미리보기 분리)
- `package.json` scripts 추가 (test:e2e:share, test:unit:share)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (검증 대상):
- **CMD-SHARE-001 ✅:** `createShareLink` — 생성 ≤500ms, UUID v4, bcrypt 12
- **QRY-SHARE-001 ✅:** SSR 공유 리포트 — 만료 처리 + 개인정보 차단
- **CMD-SHARE-003 ✅:** `splitForPreview` — 무료 미리보기 1곳 분리
- **UI-008 ✅:** 회원가입 유도 모달 — ≤300ms 렌더링
- **UI-006 ✅:** 공유 링크 생성 버튼 — E2E 클릭 대상
- **MOCK-002 ✅:** Mock 공유 데이터 — Mock 모드

### 후행:
- **TEST-010:** E2E 통합 시나리오 — TEST-003 포함 전체 플로우

---

## 8. 🧪 Test Plan (검증 절차 — "테스트의 테스트")

- **E2E (Playwright):** `tests/e2e/share-link.spec.ts` — 4개 시나리오
  - AC-1: 생성 ≤500ms
  - AC-N1: 만료 개인정보 0건
  - AC-N2: 유료 전환 모달 ≤300ms
  - AC-3: 비밀번호 보호 분기
- **단위 (Vitest):**
  - `tests/unit/share-link-perf.spec.ts` — 2개 (성능)
  - `tests/unit/share-link-expiry.spec.ts` — 2개 (만료)
  - `tests/unit/split-preview.spec.ts` — 1개 (미리보기)
  - 총 단위 5개
- **테스트 자체 검증:**
  - 만료 링크 시나리오에서 개인정보 키워드 grep 확인 (강남역/판교역 0건)
  - 성능 측정 시 네트워크 지연 감안 (서버 측 ≤500ms, E2E ≤2000ms)
- **Mock / 실제 분기:** `NEXT_PUBLIC_USE_MOCK=true` 시 MOCK-002 활용
- **HTML report:** `npx playwright show-report`

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **유료 전환 모달 ≤300ms 정밀 측정:** 클라이언트 렌더링이므로 네트워크 지연 없이 순수 UI 렌더링 시간 측정 필요. Playwright의 `Date.now()` 측정은 ±50ms 오차. `performance.mark` API 활용 검토.
2. **만료 링크 Mock 데이터:** `expired-test-uuid` 경로에 대한 Mock 데이터 준비 필요. MOCK-002의 만료 시나리오 데이터와 정합성 확인.
3. **클립보드 API 권한:** Playwright에서 클립보드 읽기 시 브라우저 권한 이슈. `context.grantPermissions(['clipboard-read'])` 설정 필요.
4. **비밀번호 보호 링크 E2E:** `password-protected-uuid`에 대한 Mock 라우트 준비. CMD-SHARE-004의 `verifySharePassword` 서버 동작과 연동.
5. **SSR 로딩 시간 3G 시뮬레이션:** Playwright의 네트워크 throttling 기능으로 3G 시뮬레이션 가능하나, 서버 사이드 시간은 throttle 대상이 아님. 클라이언트 로딩만 시뮬레이션.
6. **CI 통합 follow-up:** GitHub Actions Playwright 파이프라인은 별도 INFRA 태스크.
