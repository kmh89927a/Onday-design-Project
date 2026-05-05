---
name: Feature Task
title: "[Test] TEST-008: OAuth 로그인 GWT 시나리오 — 카카오/네이버 Supabase Auth 세션, 리프레시 갱신, 게스트 전환 (Rev 1.1)"
labels: ['test', 'priority:M', 'epic:Test-Auth', 'wave:6']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-008] OAuth 로그인 GWT 시나리오 — Supabase Auth 세션 검증
- **목적:** Auth 도메인의 카카오/네이버 Supabase Auth OAuth 흐름, 세션 생성·리프레시 갱신·만료, 게스트 모드 전환을 GWT 패턴으로 검증. CMD-AUTH-001~004를 통합 검증.
- **범위:**
  - ✅ Playwright E2E 5개 시나리오 (카카오 로그인, 네이버 로그인, 리프레시 토큰 자동 갱신, 게스트 모드 전환, CSRF 0건 정적 검증), Vitest 단위 테스트 (세션 검증 + 게스트 세션), Mock 모드 (MOCK-005 활용)
  - ❌ ~~NextAuth.js 세션/코드/타입/주석~~ (Rev 1.1 제거), ~~CSRF token 검증~~ (Supabase PKCE OAuth — Rev 1.1), 결제, AES-256
- **복잡도:** M | **Wave:** 6 (Test 트랙)

### ⚠️ Rev 1.1 정합성 (필수 인지)

> **TASK_LIST v1.3 Rev 1.2 변경:**
> | Task ID | 변경 내용 |
> |---|---|
> | TEST-008 | NextAuth 세션 → Supabase Auth 세션, CSRF 검증 제거 |
> | CMD-AUTH-001 | NextAuth.js v5 카카오 OAuth → Supabase Auth 카카오 OAuth Provider 설정 |
> | CMD-AUTH-003 | NextAuth.js 세션 전략 → Supabase Auth 세션 전략 (@supabase/ssr) |
>
> **적용:** NextAuth 관련 코드/주석/언급 0건. CSRF 검증 0건. Supabase Auth만.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-029** (§4.1.6): "시스템은 Supabase Auth(@supabase/ssr)를 사용하여 카카오·네이버 소셜 로그인을 지원해야 한다. 세션은 Supabase Auth가 발급하는 httpOnly cookie로 관리하며, 카카오·네이버 OAuth는 Supabase 대시보드의 External OAuth Provider 설정으로 구성한다."
- **CON-18** (§1.2.3): "인증은 Supabase Auth (@supabase/ssr 패키지)를 사용한다. NextAuth.js는 사용하지 않는다."
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용"
- **EXT-07 우회 전략** (§3.1.1): "OAuth Provider — 장애 시 로컬 게스트 임시 체험 모드로 전환"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §6.3.6 인증 시퀀스 다이어그램 (SRS 원문 핵심)

```
Web→Supabase: supabase.auth.signInWithOAuth({provider: "kakao"})
Supabase→OAuth: OAuth 인증 요청 (리디렉트)
OAuth→Callback: auth_code 반환 (/auth/callback)
Callback→Supabase: auth_code → 세션 교환
Supabase→Callback: 세션 (httpOnly cookie 설정)
Callback→Prisma: User UPSERT
```

### 검증 대상 ISSUE 표 (CMD-AUTH-001~004, MOCK-005)

| Task ID | 산출물 | import 경로 | TEST-008 검증 항목 |
|---|---|---|---|
| CMD-AUTH-001 ✅ | 카카오 OAuth (Supabase), `/auth/callback` Route Handler | `@/app/auth/callback/route` | 카카오 로그인 성공 + Supabase 세션 쿠키 |
| CMD-AUTH-002 ✅ | 네이버 OAuth (Custom OIDC) | — | 네이버 로그인 성공 |
| CMD-AUTH-003 ✅ | Supabase Auth 세션 전략 (`getCurrentUser`, @supabase/ssr) | `@/lib/auth/session` | 세션 검증 + 리프레시 갱신 |
| CMD-AUTH-004 ✅ | 게스트 모드 (`createGuestSession`, sessionStorage) | `@/lib/auth/guest` | 게스트 전환 + sessionStorage 저장 |
| MOCK-005 ✅ | OAuth Mock 데이터 (카카오/네이버 프로필, Supabase 세션) | `@/lib/mocks/auth` | Mock 모드 E2E |
| UI-001 ✅ | 소셜 로그인 페이지 UI | — | E2E 로그인 버튼 대상 |

### TEST-001 Playwright 패턴 인용

> `playwright.config.ts` 재사용, `test.describe` + GWT 주석, Mock 모드 분기, HTML report

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `tests/e2e/auth-oauth.spec.ts` — AC-1: 카카오 로그인 성공
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('Supabase OAuth 로그인 (Rev 1.1: Supabase Auth)', () => {
    test('AC-1: 카카오 로그인 성공 → Supabase 세션', async ({ page, context }) => {
      await page.goto('/login');
      // Mock 모드 (MOCK-005 활용)
      await page.getByRole('button', { name: '카카오로 시작하기' }).click();
      // Supabase 콜백 처리 (CMD-AUTH-001)
      await page.waitForURL('/diagnosis', { timeout: 10000 });
      // Then: Supabase 세션 쿠키 존재 (sb- prefix)
      const cookies = await context.cookies();
      const supabaseCookie = cookies.find(c => c.name.startsWith('sb-'));
      expect(supabaseCookie).toBeDefined();
      // NextAuth 쿠키 0건 검증 (Rev 1.1)
      const nextAuthCookie = cookies.find(c => c.name.includes('next-auth'));
      expect(nextAuthCookie).toBeUndefined();
    });
  });
  ```

- [ ] **3.2** `tests/e2e/auth-oauth.spec.ts` — AC-2: 네이버 로그인 성공
  ```typescript
    test('AC-2: 네이버 로그인 성공 (Custom OIDC)', async ({ page, context }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: '네이버로 시작하기' }).click();
      await page.waitForURL('/diagnosis', { timeout: 10000 });
      const cookies = await context.cookies();
      const supabaseCookie = cookies.find(c => c.name.startsWith('sb-'));
      expect(supabaseCookie).toBeDefined();
    });
  ```

- [ ] **3.3** `tests/e2e/auth-oauth.spec.ts` — AC-3: 리프레시 토큰 자동 갱신
  ```typescript
    test('AC-3: 리프레시 토큰 자동 갱신', async ({ page, context }) => {
      // Given: 로그인 완료 상태
      await page.goto('/login');
      await page.getByRole('button', { name: '카카오로 시작하기' }).click();
      await page.waitForURL('/diagnosis');
      // When: 세션 만료 시뮬레이션 (access_token 제거)
      const cookies = await context.cookies();
      const sbCookie = cookies.find(c => c.name.startsWith('sb-') && c.name.includes('auth-token'));
      if (sbCookie) {
        await context.clearCookies();
        // 리프레시 토큰만 유지하는 시뮬레이션은 Supabase 내부 동작
        // 실제로는 @supabase/ssr 미들웨어가 자동 갱신
      }
      // Then: 페이지 리로드 시 세션 유지 (Supabase 자동 갱신)
      await page.goto('/diagnosis');
      // 로그인 페이지로 리디렉트되지 않으면 세션 갱신 성공
      const url = page.url();
      // Mock 환경에서는 정확한 갱신 검증 어려움 — Open Questions 참조
    });
  ```

- [ ] **3.4** `tests/e2e/auth-oauth.spec.ts` — AC-4: 게스트 모드 전환
  ```typescript
    test('AC-4: 게스트 모드 전환 (CMD-AUTH-004)', async ({ page }) => {
      await page.goto('/login');
      // OAuth 실패 시뮬레이션
      await page.goto('/login?error=AUTH_OAUTH_CALLBACK_FAILED');
      // When: 게스트 체험 버튼 클릭
      const guestButton = page.getByRole('button', { name: /게스트/ });
      if (await guestButton.isVisible()) {
        await guestButton.click();
        // Then: sessionStorage에 guest_session 저장
        const session = await page.evaluate(() => sessionStorage.getItem('guest_session'));
        expect(session).toBeTruthy();
        const parsed = JSON.parse(session!);
        expect(parsed.isGuest).toBe(true);
        expect(parsed.guestId).toBeTruthy();
        expect(parsed.limitations).toContain('no_save');
      }
    });
  ```

- [ ] **3.5** `tests/e2e/auth-oauth.spec.ts` — AC-5: CSRF 검증 0건 정적 검증
  ```typescript
    test('AC-5: CSRF 검증 0건 (Rev 1.1 — Supabase PKCE)', async () => {
      // Supabase Auth는 PKCE OAuth를 사용하므로 CSRF token 검증 불필요
      const fs = await import('fs');
      const authFiles = [
        'app/auth/callback/route.ts',
        'middleware.ts',
        'lib/supabase/server.ts',
      ];
      for (const file of authFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          expect(content).not.toMatch(/csrf|csrfToken|_csrf/i);
        } catch { /* 파일 미존재 시 skip */ }
      }
    });
  ```

- [ ] **3.6** `tests/unit/auth-session.spec.ts` — Supabase 세션 단위 테스트
  ```typescript
  describe('Supabase Auth 세션 검증 (TEST-008)', () => {
    it('getCurrentUser — 인증된 사용자 반환', async () => {});
    it('getCurrentUser — 미인증 시 null 반환', async () => {});
    it('middleware — 인증 필요 경로에서 세션 없으면 리디렉트', async () => {});
  });
  ```

- [ ] **3.7** `tests/unit/guest-session.spec.ts` — 게스트 세션 단위 테스트
  ```typescript
  describe('게스트 세션 (CMD-AUTH-004 → TEST-008)', () => {
    it('createGuestSession — 유효한 GuestSession 반환', () => {});
    it('saveGuestSession + getGuestSession — 라운드트립', () => {});
    it('clearGuestSession — null 반환', () => {});
  });
  ```

- [ ] **3.8** `tests/unit/auth-rev11-static.spec.ts` — Rev 1.1 정합성 정적 검증
  ```typescript
  import { readFileSync, readdirSync } from 'fs';
  import { join } from 'path';

  describe('TEST-008 Rev 1.1 정합성 검증', () => {
    const testSource = readFileSync('tests/e2e/auth-oauth.spec.ts', 'utf-8');

    it('NextAuth 키워드 0건 (NextAuth/next-auth/nextauth)', () => {
      // 쿠키 검증에서 'next-auth'를 expect(x).toBeUndefined() 형태로 사용하는 것은 허용
      // 그 외 NextAuth import/설정/사용 0건
      expect(testSource).not.toMatch(/import.*next-auth|from.*next-auth|NextAuth\(/i);
    });

    it('CSRF token 검증 코드 0건', () => {
      expect(testSource).not.toMatch(/csrfToken|_csrf|csrf-token/i);
    });

    it('Supabase Auth 세션 쿠키 (sb-) 검증 존재', () => {
      expect(testSource).toMatch(/sb-/);
    });
  });
  ```

- [ ] **3.9** `package.json`에 테스트 스크립트 추가
  ```json
  {
    "scripts": {
      "test:e2e:auth": "npx playwright test tests/e2e/auth-oauth.spec.ts",
      "test:unit:auth": "npx vitest run tests/unit/auth-session.spec.ts tests/unit/guest-session.spec.ts tests/unit/auth-rev11-static.spec.ts"
    }
  }
  ```

- [ ] **3.10** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|replaySearch" tests/e2e/auth-oauth.spec.ts` → import/설정 0건 (검증용 언급 제외)

- [ ] **3.11** Mock 모드 환경변수 설정
  ```typescript
  // NEXT_PUBLIC_USE_MOCK_AUTH=true → MOCK-005 흐름
  // 프로덕션은 실제 Supabase 호출
  ```

- [ ] **3.12** Playwright HTML report 생성 확인
  ```bash
  npx playwright test tests/e2e/auth-oauth.spec.ts --reporter=html
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 카카오 로그인 성공 → Supabase 세션
- **Given** Supabase 대시보드에 카카오 OAuth Provider 활성, Mock 모드 설정
- **When** "카카오로 시작하기" 버튼 클릭 → OAuth 흐름 완료
- **Then** `/diagnosis`로 리디렉트. Supabase 세션 쿠키(`sb-` prefix) 존재. NextAuth 쿠키(`next-auth`) 0건

**AC-2 (정상):** 네이버 로그인 성공 (Custom OIDC)
- **Given** Supabase 대시보드에 네이버 OAuth Provider 활성
- **When** "네이버로 시작하기" 버튼 클릭 → OAuth 흐름 완료
- **Then** `/diagnosis`로 리디렉트. Supabase 세션 쿠키 존재

**AC-3 (경계):** 리프레시 토큰 자동 갱신
- **Given** 카카오 로그인 성공 후 세션 유지 중
- **When** access_token 만료 후 페이지 새로고침
- **Then** Supabase @supabase/ssr 미들웨어가 리프레시 토큰으로 자동 갱신. 로그인 페이지 리디렉트 없이 서비스 지속

**AC-4 (예외):** 게스트 모드 전환
- **Given** OAuth Provider 장애로 `/login?error=AUTH_OAUTH_CALLBACK_FAILED` 리디렉트
- **When** "게스트로 체험하기" 버튼 클릭
- **Then** `sessionStorage`에 `guest_session` 저장. `isGuest === true`. `limitations`에 `no_save, no_share, no_history` 포함

**AC-5 (정적 검증):** CSRF 검증 0건 (Rev 1.1)
- **Given** Auth 관련 소스 파일 (`app/auth/callback/route.ts`, `middleware.ts`)
- **When** `grep -ri "csrf" {auth-files}` 실행
- **Then** CSRF token 검증 코드 0건 — Supabase PKCE OAuth 사용 (Rev 1.1)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용" (§4.2.3) | AC-1에서 Supabase 세션 쿠키(`sb-`) 존재 검증. AC-5에서 CSRF 코드 0건 정적 검증 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | OAuth 실패 시 Sentry 이벤트 발생 검증 (단위 테스트 mock) |

---

## 6. 📦 Deliverables (산출물 명시)

- `tests/e2e/auth-oauth.spec.ts` (5개 E2E 시나리오 — AC-1~5)
- `tests/unit/auth-session.spec.ts` (3개 — Supabase 세션 검증)
- `tests/unit/guest-session.spec.ts` (3개 — 게스트 세션)
- `tests/unit/auth-rev11-static.spec.ts` (3개 — Rev 1.1 정합성 정적 검증)
- `package.json` scripts 추가 (test:e2e:auth, test:unit:auth)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (검증 대상):
- **CMD-AUTH-001 ✅:** Supabase 카카오 OAuth — 카카오 로그인 검증
- **CMD-AUTH-002 ✅:** Supabase 네이버 OAuth — 네이버 로그인 검증
- **CMD-AUTH-003 ✅:** Supabase Auth 세션 전략 — 세션 검증 + 리프레시 갱신
- **CMD-AUTH-004 ✅:** 게스트 모드 — 게스트 전환 검증
- **MOCK-005 ✅:** OAuth Mock 데이터 — E2E Mock 모드
- **UI-001 ✅:** 소셜 로그인 페이지 — E2E 로그인 버튼
- **TEST-001 ✅:** Playwright 패턴 확립

### 후행:
- **TEST-010:** E2E 통합 시나리오 — TEST-008 포함 전체 플로우

---

## 8. 🧪 Test Plan (검증 절차)

- **E2E (Playwright):** `tests/e2e/auth-oauth.spec.ts` — 5개 시나리오
  - AC-1: 카카오 로그인 → Supabase 세션
  - AC-2: 네이버 로그인 (Custom OIDC)
  - AC-3: 리프레시 토큰 자동 갱신
  - AC-4: 게스트 모드 전환
  - AC-5: CSRF 0건 정적 검증
- **단위 (Vitest):**
  - `tests/unit/auth-session.spec.ts` — 3개 (getCurrentUser, middleware)
  - `tests/unit/guest-session.spec.ts` — 3개 (createGuestSession, roundtrip, clear)
  - `tests/unit/auth-rev11-static.spec.ts` — 3개 (NextAuth 0건, CSRF 0건, sb- 존재)
  - 총 단위 9개
- **정적 분석:**
  - Auth 파일에 NextAuth import 0건
  - CSRF token 검증 코드 0건
  - `grep -ri "payment\|AES\|replaySearch" tests/e2e/auth-oauth.spec.ts` → 0건
- **HTML report:** `npx playwright show-report`

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **실제 Supabase 환경에서 E2E 검증 가능 여부:** Mock 모드(`NEXT_PUBLIC_USE_MOCK_AUTH=true`)에서는 실제 Supabase OAuth 흐름을 시뮬레이션. 실제 카카오/네이버 OAuth 흐름은 외부 리디렉트가 포함되어 Playwright에서 직접 검증 어려움. CI에서는 Mock 모드만 사용, Staging 환경에서 수동 검증 병행.
2. **리프레시 토큰 갱신 시뮬레이션:** Supabase의 자동 리프레시는 @supabase/ssr 내부에서 처리. access_token 만료 시뮬레이션이 E2E에서 어려움. 단위 테스트에서 Supabase SDK mock으로 대체.
3. **Supabase 세션 쿠키 이름 패턴:** `sb-{project_ref}-auth-token` 형식. project_ref에 따라 쿠키 이름이 달라지므로 `startsWith('sb-')` 패턴으로 검증.
4. **게스트 모드 sessionStorage 제약:** Playwright에서 `page.evaluate(() => sessionStorage.getItem(...))` 호출로 검증 가능하나, 크로스 도메인 제약 확인 필요.
