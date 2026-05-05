---
name: Feature Task
title: "[Feature] CMD-AUTH-002: Supabase Auth 네이버 OAuth Provider 설정"
labels: ['feature', 'priority:M', 'epic:Auth', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-AUTH-002] Supabase Auth 네이버 OAuth Provider 설정 (Supabase 대시보드 External OAuth 구성 + @supabase/ssr 클라이언트 연동)
- **목적 (Why):**
  - **비즈니스:** 카카오 외 네이버 계정 보유 사용자에게 추가 로그인 옵션을 제공하여 가입 전환율을 높인다. 수도권 3040 맞벌이 부부 타겟의 네이버 앱 사용률을 감안한 진입 경로 확보.
  - **사용자 가치:** 카카오 계정이 없거나 네이버를 선호하는 사용자도 별도 회원가입 없이 서비스를 즉시 이용할 수 있다.
- **범위 (What):**
  - ✅ 만드는 것: Supabase 대시보드 네이버 OAuth Provider 설정 (Custom OIDC 또는 Generic OAuth 2.0), 네이버 Developers OAuth 앱 생성, 네이버 로그인 트리거 Client Component, CMD-AUTH-001의 `/auth/callback` Route Handler 재사용
  - ❌ 만들지 않는 것: 카카오 OAuth(CMD-AUTH-001에서 완료), 세션 전략 상세(CMD-AUTH-003), 게스트 모드(CMD-AUTH-004), 결제 관련 코드, NextAuth.js 관련 코드
- **복잡도:** M
- **Wave:** 3 (Auth 구현 트랙)

### ⚠️ 카카오 vs 네이버 핵심 차이점

| 항목 | 카카오 (CMD-AUTH-001) | 네이버 (CMD-AUTH-002) |
|---|---|---|
| Supabase 지원 | 기본 지원 Provider | **기본 미지원 → Custom OIDC 등록 필요** |
| Provider 이름 | `'kakao'` | Custom 등록 시 별도 이름 (예: `'naver'`) |
| Authorization URL | Supabase 자동 처리 | `https://nid.naver.com/oauth2.0/authorize` |
| Token URL | Supabase 자동 처리 | `https://nid.naver.com/oauth2.0/token` |
| User Info URL | Supabase 자동 처리 | `https://openapi.naver.com/v1/nid/me` |
| scope | `account_email profile_nickname` | `name email profile_image` |
| signInWithOAuth 호출 | `provider: 'kakao'` | `provider: 'naver'` (Custom OIDC 등록명 사용) |

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-029** (§4.1.6): "시스템은 Supabase Auth(@supabase/ssr)를 사용하여 카카오·네이버 소셜 로그인을 지원해야 한다. 세션은 Supabase Auth가 발급하는 httpOnly cookie로 관리하며, 카카오·네이버 OAuth는 Supabase 대시보드의 External OAuth Provider 설정으로 구성한다."
- **CON-18** (§1.2.3): "인증은 Supabase Auth (@supabase/ssr 패키지)를 사용한다. 카카오·네이버 OAuth는 Supabase 대시보드의 External OAuth Provider 설정으로 구성한다. NextAuth.js는 사용하지 않는다."
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (커스텀 슬랙 임계치 제거)"
- **EXT-07** (§3.1): "OAuth Provider (카카오/네이버) — 소셜 로그인 인증. OAuth 2.0 표준"

### 시퀀스 다이어그램 (§6.3.6 인증 플로우)

- **참여 Actor:** 사용자, Next.js Client Component, Next.js Middleware, Route Handler (/auth/callback), Supabase Auth, OAuth Provider (카카오/네이버), Prisma ORM, Amplitude
- **핵심 흐름:** CMD-AUTH-001과 동일 — `signInWithOAuth({provider: 'naver'})` → Supabase → 네이버 OAuth → `/auth/callback` → `syncUserFromAuth()` → 리디렉트

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| CMD-AUTH-001 | `app/auth/callback/route.ts` | — | 네이버 OAuth도 동일한 콜백 Route Handler 재사용 |
| CMD-AUTH-001 | `lib/supabase/client.ts` | `@/lib/supabase/client` | 네이버 로그인 버튼에서 브라우저 클라이언트 재사용 |
| CMD-AUTH-001 | `middleware.ts` | — | 세션 검증 로직 재사용 (Provider 무관) |
| DB-007 | syncUserFromAuth | `@/lib/services/user-sync` | 네이버 OAuth 콜백 성공 후 User UPSERT |
| API-001 | OAuthProvider, OAuthSignInOptions | `@/lib/types/auth` | `provider: 'naver'`로 signInWithOAuth 호출 |
| API-001 | AuthErrorCode | `@/lib/types/auth` | 에러 핸들링 |
| API-001 | createAuthError | `@/lib/helpers/auth-error` | 에러 DTO 생성 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** 네이버 Developers Console에서 OAuth 앱 생성 + Client ID/Secret 발급
  - https://developers.naver.com 접속 → 애플리케이션 등록
  - 앱 이름: "동네궁합진단기"
  - 사용 API: 네이버 로그인 (네아로)
  - 환경 추가: PC웹 → 서비스 URL `https://your-domain.vercel.app`
  - Callback URL 등록: `https://{supabase_project_ref}.supabase.co/auth/v1/callback`
  - 필수 정보: 이메일 주소, 프로필 사진, 이름
  - Client ID + Client Secret 발급 확인

- [ ] **3.2** Supabase 대시보드 → Authentication → Providers에서 네이버 Custom OIDC 등록
  - Supabase 대시보드 → Authentication → Providers → 하단 "Add new provider" 또는 Custom OIDC 섹션
  - Provider 이름: `naver`
  - Client ID: 네이버 Developers에서 발급받은 Client ID
  - Client Secret: 네이버 Developers에서 발급받은 Client Secret
  - Authorization URL: `https://nid.naver.com/oauth2.0/authorize`
  - Token URL: `https://nid.naver.com/oauth2.0/token`
  - User Info URL: `https://openapi.naver.com/v1/nid/me`
  - Scopes: `name email profile_image`
  - Redirect URL 확인: `https://{supabase_project_ref}.supabase.co/auth/v1/callback`

- [ ] **3.3** Supabase 대시보드에서 네이버 Provider 활성 상태 확인
  - Provider 목록에서 네이버(Custom)가 "Enabled"로 표시되는지 확인
  - 테스트 환경에서 OAuth 인증 요청이 네이버 로그인 페이지로 정상 리디렉트되는지 확인

- [ ] **3.4** `app/(auth)/login/naver-login-button.tsx`에 네이버 로그인 트리거 Client Component 작성
  ```typescript
  'use client';
  import { createSupabaseBrowserClient } from '@/lib/supabase/client';
  import type { OAuthSignInOptions } from '@/lib/types/auth';

  export function NaverLoginButton() {
    const handleNaverLogin = async () => {
      const supabase = createSupabaseBrowserClient();
      const options: OAuthSignInOptions = {
        provider: 'naver',
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'name email profile_image',
      };
      const { error } = await supabase.auth.signInWithOAuth({
        provider: options.provider,
        options: {
          redirectTo: options.redirectTo,
          scopes: options.scopes,
        },
      });
      if (error) {
        console.error('Naver OAuth error:', error);
      }
    };

    return (
      <button onClick={handleNaverLogin} id="naver-login-btn">
        네이버로 시작하기
      </button>
    );
  }
  ```

- [ ] **3.5** `/auth/callback` Route Handler가 네이버 OAuth 콜백도 동일하게 처리하는지 확인
  - CMD-AUTH-001에서 작성한 `app/auth/callback/route.ts`는 Provider에 무관하게 `exchangeCodeForSession(code)` 호출
  - `syncUserFromAuth(data.user)` 내부에서 `user.app_metadata.provider`가 `'naver'`로 설정되는지 확인
  - 추가 코드 변경 없이 재사용 가능 여부 확인. 불가 시 provider 분기 로직 추가

- [ ] **3.6** 네이버 OAuth 응답의 사용자 프로필 필드 매핑 검증
  - 네이버 `/v1/nid/me` 응답 구조:
    ```json
    {
      "resultcode": "00",
      "message": "success",
      "response": {
        "id": "네이버_고유_ID",
        "email": "user@naver.com",
        "name": "홍길동",
        "profile_image": "https://..."
      }
    }
    ```
  - Supabase Auth가 이를 `user.user_metadata`로 올바르게 매핑하는지 확인
  - `mapSupabaseUserToDTO()` (API-001)에서 네이버 사용자의 `provider`, `email`, `avatarUrl`이 정상 추출되는지 확인

- [ ] **3.7** `docs/supabase-oauth-setup.md`에 네이버 OAuth 설정 절차 추가
  - 네이버 Custom OIDC 등록 절차 (3.1~3.3) 문서화
  - 카카오와의 차이점 명시 (endpoints, scopes, Custom OIDC vs 기본 Provider)
  - 네이버 Developers Console 스크린샷 가이드

- [ ] **3.8** `__tests__/auth/naver-oauth-callback.spec.ts`에 네이버 OAuth 콜백 테스트 작성
  ```typescript
  describe('네이버 OAuth Callback', () => {
    it('네이버 OAuth 콜백 시 provider가 naver인 User UPSERT 실행', async () => { /* ... */ });
    it('네이버 사용자의 email이 user_metadata에서 올바르게 추출', async () => { /* ... */ });
    it('네이버 OAuth 실패 시 Sentry.captureException 호출', async () => { /* ... */ });
  });
  ```

- [ ] **3.9** `__tests__/auth/naver-login-button.spec.tsx`에 네이버 로그인 버튼 테스트
  ```typescript
  import { render, fireEvent } from '@testing-library/react';
  import { NaverLoginButton } from '@/app/(auth)/login/naver-login-button';
  describe('NaverLoginButton', () => {
    it('클릭 시 supabase.auth.signInWithOAuth가 provider: naver로 호출', async () => { /* ... */ });
    it('scopes에 name email profile_image 포함', async () => { /* ... */ });
  });
  ```

- [ ] **3.10** `__tests__/mappers/auth-mapper-naver.spec.ts`에 네이버 사용자 매핑 테스트 추가
  ```typescript
  describe('mapSupabaseUserToDTO - 네이버 사용자', () => {
    it('app_metadata.provider가 naver일 때 provider 필드가 naver', () => { /* ... */ });
    it('네이버 user_metadata.avatar_url이 올바르게 매핑', () => { /* ... */ });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 네이버 OAuth 로그인 전체 플로우 성공
- **Given** Supabase 대시보드에 네이버 Custom OIDC Provider가 활성화되어 있고, Client ID/Secret이 올바르게 설정된 상태
- **When** 사용자가 "네이버로 시작하기" 버튼을 클릭하고 네이버 로그인·동의를 완료
- **Then** `/auth/callback`에서 `exchangeCodeForSession(code)` 호출 성공, `syncUserFromAuth(data.user)` 실행으로 `public.users` 테이블에 `auth_provider = 'naver'`인 행이 UPSERT, 사용자가 `next` 경로로 리디렉트

**AC-2 (예외):** 네이버 OAuth 인증 취소
- **Given** 네이버 로그인 동의 화면에서 사용자가 "취소"를 클릭
- **When** 네이버가 `/auth/callback`에 에러 파라미터를 반환
- **Then** `Sentry.captureException` 호출, `/login?error=AUTH_OAUTH_CALLBACK_FAILED`로 리디렉트

**AC-3 (예외):** 네이버 Custom OIDC endpoints 설정 오류
- **Given** Supabase 대시보드의 네이버 Token URL이 잘못 설정된 상태
- **When** OAuth 인증 코드 교환 시도
- **Then** `exchangeCodeForSession(code)` 에러 반환, Sentry에 에러 기록, `/login` 리디렉트

**AC-4 (보안):** httpOnly cookie 설정 검증 (네이버)
- **Given** 네이버 OAuth 로그인이 성공적으로 완료
- **When** 브라우저 응답 헤더의 `Set-Cookie`를 검사
- **Then** Supabase 세션 쿠키에 `HttpOnly`, `Secure` 플래그 설정, 클라이언트 JS `document.cookie`에서 세션 토큰 접근 불가

**AC-5 (보안):** CSRF 보호 동작 검증
- **Given** 외부 사이트에서 `/auth/callback?code=malicious_code` 직접 호출
- **When** Supabase Auth가 state 파라미터를 검증
- **Then** state 불일치로 인증 실패, 세션 생성되지 않음

**AC-6 (경계):** 네이버 이메일 미제공 사용자 처리
- **Given** 네이버 계정에 이메일 정보가 없거나 비공개 설정된 사용자
- **When** OAuth 인증 완료 후 `syncUserFromAuth()` 호출
- **Then** `email` 필드가 빈 문자열 또는 Supabase 제공 임시 이메일로 설정, User UPSERT 정상 완료

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용" (§4.2.3) | 네이버 OAuth 응답의 Set-Cookie 헤더에 HttpOnly, SameSite, Secure 플래그 존재 확인. state 파라미터 CSRF 검증 동작 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 네이버 OAuth 실패 시 `Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-002' } })` 호출 확인 |

---

## 6. 📦 Deliverables (산출물 명시)

- `app/(auth)/login/naver-login-button.tsx` (네이버 로그인 트리거 Client Component)
- `docs/supabase-oauth-setup.md` (네이버 OAuth 설정 절차 추가 — CMD-AUTH-001 문서 확장)
- `__tests__/auth/naver-oauth-callback.spec.ts` (네이버 콜백 테스트)
- `__tests__/auth/naver-login-button.spec.tsx` (네이버 로그인 버튼 테스트)
- `__tests__/mappers/auth-mapper-naver.spec.ts` (네이버 사용자 매핑 테스트)

> **참고:** `app/auth/callback/route.ts`, `middleware.ts`는 CMD-AUTH-001에서 작성 완료. 네이버 추가 시 코드 변경 없이 재사용.

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 태스크 시작 전 필요):

- **CMD-AUTH-001:** `app/auth/callback/route.ts` (OAuth 콜백 Route Handler), `lib/supabase/client.ts` (브라우저 클라이언트), `middleware.ts` (세션 검증)
- **DB-007:** `lib/services/user-sync.ts` (syncUserFromAuth), `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
- **API-001:** `lib/types/auth.ts` (OAuthProvider, OAuthSignInOptions, AuthErrorCode), `lib/helpers/auth-error.ts` (createAuthError), `lib/mappers/auth-mapper.ts` (mapSupabaseUserToDTO)

### 후행 (이 태스크 완료 후 차례로 가능):

- **CMD-AUTH-003:** 세션 전략 구현 — 카카오·네이버 양쪽 모두 동일한 세션 관리
- **CMD-AUTH-004:** 게스트 모드 — 카카오·네이버 모두 장애 시 게스트 전환
- **TEST-008:** OAuth 로그인 GWT 시나리오 — 네이버 로그인 테스트 추가
- **UI-001:** 소셜 로그인 페이지 UI — NaverLoginButton 컴포넌트 활용

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/auth/naver-oauth-callback.spec.ts` — 3개 케이스 (provider naver UPSERT, 이메일 추출, OAuth 실패 Sentry)
- **단위 테스트:** `__tests__/auth/naver-login-button.spec.tsx` — 2개 케이스 (provider: naver 호출, scopes 확인)
- **단위 테스트:** `__tests__/mappers/auth-mapper-naver.spec.ts` — 2개 케이스 (provider 매핑, avatar_url 매핑)
- **통합 테스트:** `__tests__/integration/naver-oauth-flow.spec.ts` — OAuth 콜백 Mocking + DB UPSERT 검증
- **E2E 테스트:** Playwright로 네이버 OAuth 흐름 시뮬레이션 (Mock Provider 사용)
- **수동 검증:**
  1. Supabase 대시보드 → Authentication → Providers → 네이버 Custom OIDC 상태 확인
  2. 네이버 로그인 후 Supabase → Authentication → Users 에 provider가 naver인 사용자 생성 확인
  3. 브라우저 DevTools에서 httpOnly cookie 플래그 확인
  4. 네이버 Developers Console에서 활성 사용자 수 확인
- **CI 게이트:** `tsc --noEmit` 통과, Jest 테스트 100% 통과, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **Supabase 네이버 Custom OIDC 지원 여부:** Supabase가 네이버를 Custom OIDC로 등록할 때, 네이버의 User Info 응답 구조(`response.response.email`)가 표준과 다를 수 있음. Supabase의 `user_metadata` 매핑이 올바른지 실제 테스트 필수.
2. **네이버 provider 이름:** Custom OIDC 등록 시 provider 이름이 `'naver'`인지 Supabase가 자동으로 부여하는 다른 이름(예: `'oidc-naver'`)인지 확인 필요. `signInWithOAuth` 호출 시 정확한 provider 이름을 사용해야 함.
3. **네이버 개발자 앱 심사:** 네이버 로그인 API를 상용 환경에서 사용하려면 검수 신청이 필요할 수 있음. 개발 단계에서는 테스트 앱으로 진행하고, Closed Beta 전 정식 검수.
4. **이메일 비공개 사용자:** 네이버 계정에서 이메일을 비공개로 설정한 사용자의 경우, `email` 필드가 null일 수 있음. `syncUserFromAuth`에서 이 케이스를 처리하는 방어 로직 필요.
5. **Generic OAuth 2.0 vs Custom OIDC:** Supabase의 "Third-party Auth" 설정 방식이 버전에 따라 다를 수 있음. 최신 Supabase 대시보드 UI에서 네이버 등록 방법을 실제 확인 후 문서 업데이트.
