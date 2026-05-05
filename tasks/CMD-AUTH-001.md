---
name: Feature Task
title: "[Feature] CMD-AUTH-001: Supabase Auth 카카오 OAuth Provider 설정"
labels: ['feature', 'priority:H', 'epic:Auth', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-AUTH-001] Supabase Auth 카카오 OAuth Provider 설정 (Supabase 대시보드 External OAuth 구성 + @supabase/ssr 클라이언트 연동)
- **목적 (Why):**
  - **비즈니스:** 수도권 3040 맞벌이 부부 타겟의 핵심 진입점인 카카오 소셜 로그인을 구현하여, 별도 회원가입 없이 카카오 계정으로 즉시 서비스를 이용할 수 있게 한다.
  - **사용자 가치:** 카카오톡으로 한 번 로그인하면 진단 결과 저장·공유 링크 생성·이전 조건 불러오기 등 인증이 필요한 모든 기능을 사용할 수 있다.
- **범위 (What):**
  - ✅ 만드는 것: Supabase 대시보드 카카오 OAuth Provider 설정, 카카오 Developers OAuth 앱 생성, `/auth/callback` Route Handler, 카카오 로그인 트리거 Client Component, `middleware.ts` 세션 검증 통합
  - ❌ 만들지 않는 것: 네이버 OAuth(CMD-AUTH-002), 세션 전략 상세 구현(CMD-AUTH-003), 게스트 모드(CMD-AUTH-004), 결제 관련 코드, NextAuth.js 관련 코드
- **복잡도:** H
- **Wave:** 3 (Auth 구현 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-029** (§4.1.6): "시스템은 Supabase Auth(@supabase/ssr)를 사용하여 카카오·네이버 소셜 로그인을 지원해야 한다. 세션은 Supabase Auth가 발급하는 httpOnly cookie로 관리하며, 카카오·네이버 OAuth는 Supabase 대시보드의 External OAuth Provider 설정으로 구성한다."
- **CON-18** (§1.2.3): "인증은 Supabase Auth (@supabase/ssr 패키지)를 사용한다. 카카오·네이버 OAuth는 Supabase 대시보드의 External OAuth Provider 설정으로 구성한다. NextAuth.js는 사용하지 않는다."
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (커스텀 슬랙 임계치 제거)"
- **EXT-07** (§3.1): "OAuth Provider (카카오/네이버) — 소셜 로그인 인증. OAuth 2.0 표준"
- **EXT-07 우회 전략** (§3.1.1): "OAuth Provider — 장애 시 로컬 게스트 임시 체험 모드로 전환"

### 시퀀스 다이어그램 (§6.3.6 인증 플로우)

- **참여 Actor:** 사용자, Next.js Client Component, Next.js Middleware, Route Handler (/auth/callback), Supabase Auth, OAuth Provider (카카오/네이버), Prisma ORM, Amplitude
- **핵심 메시지 흐름:**
  1. `Web→Supabase: supabase.auth.signInWithOAuth({provider: "kakao"})`
  2. `Supabase→OAuth: OAuth 인증 요청 (리디렉트)`
  3. `OAuth→User: 로그인·동의 화면`
  4. `User→OAuth: 로그인 + 동의`
  5. `OAuth→Callback: auth_code 반환 (/auth/callback)`
  6. `Callback→Supabase: auth_code → 세션 교환`
  7. `Supabase→Callback: 세션 (httpOnly cookie 설정)`
  8. `Callback→Prisma: User UPSERT (auth_provider, email)`
  9. `Callback→Web: 리디렉트 + 세션 쿠키 설정 완료`

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-007 | createSupabaseServerClient | `@/lib/supabase/server` | OAuth 콜백에서 Supabase 서버 클라이언트 생성 |
| DB-007 | createSupabaseMiddlewareClient | `@/lib/supabase/middleware` | middleware.ts에서 세션 검증 |
| DB-007 | syncUserFromAuth | `@/lib/services/user-sync` | OAuth 콜백 성공 후 User UPSERT |
| DB-007 | UserDTO | `@/lib/types/user` | 사용자 정보 타입 참조 |
| API-001 | OAuthProvider, OAuthSignInOptions | `@/lib/types/auth` | signInWithOAuth 호출 시 옵션 타입 |
| API-001 | AuthCallbackRequest, AuthCallbackResult | `@/lib/types/auth` | /auth/callback 요청·응답 타입 |
| API-001 | AuthErrorCode, AuthErrorDTO | `@/lib/types/auth` | 에러 핸들링 타입 |
| API-001 | mapSupabaseSessionToDTO | `@/lib/mappers/auth-mapper` | 세션 변환 |
| API-001 | createAuthError | `@/lib/helpers/auth-error` | 에러 DTO 생성 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Supabase 대시보드 → Authentication → Providers → Kakao 활성화
  - Supabase 프로젝트 대시보드 접속 → Authentication → Providers 메뉴 → Kakao 토글 ON
  - 이 단계에서 Redirect URL 확인: `https://{supabase_project_ref}.supabase.co/auth/v1/callback`

- [ ] **3.2** Kakao Developers Console에서 OAuth 앱 생성 + Client ID/Secret 발급
  - https://developers.kakao.com 접속 → 내 애플리케이션 → 애플리케이션 추가
  - 앱 이름: "동네궁합진단기"
  - 플랫폼 등록: Web → 사이트 도메인 `https://your-domain.vercel.app` + `http://localhost:3000` (개발용)
  - 카카오 로그인 활성화: 카카오 로그인 → 활성화 설정 ON
  - Redirect URI 등록: `https://{supabase_project_ref}.supabase.co/auth/v1/callback`
  - 동의 항목 설정: `account_email` (필수), `profile_nickname` (선택)
  - REST API 키(Client ID)와 Client Secret 발급 확인

- [ ] **3.3** Supabase 대시보드에 Kakao Client ID/Secret 입력
  - Authentication → Providers → Kakao
  - Client ID: Kakao REST API 키 입력
  - Client Secret: Kakao Client Secret 입력
  - 저장 후 Provider 상태가 "Enabled"인지 확인

- [ ] **3.4** `.env.local`에 Supabase 환경변수 등록 확인
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://{project_ref}.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_key}
  ```
  - DB-007에서 이미 `.env.example`에 템플릿이 존재. 실제 값만 `.env.local`에 설정

- [ ] **3.5** `lib/supabase/client.ts`에 브라우저용 Supabase 클라이언트 생성 유틸리티 작성
  ```typescript
  'use client';
  import { createBrowserClient } from '@supabase/ssr';

  export function createSupabaseBrowserClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  ```
  - 패키지: `@supabase/ssr@^0.5.0`

- [ ] **3.6** `app/auth/callback/route.ts`에 OAuth 콜백 Route Handler 구현
  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { createSupabaseServerClient } from '@/lib/supabase/server';
  import { syncUserFromAuth } from '@/lib/services/user-sync';
  import { AuthErrorCode } from '@/lib/types/auth';
  import { createAuthError } from '@/lib/helpers/auth-error';
  import * as Sentry from '@sentry/nextjs';

  export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (!code) {
      Sentry.captureMessage('OAuth callback: code missing', { tags: { domain: 'auth', task: 'CMD-AUTH-001' } });
      const error = createAuthError(AuthErrorCode.OAUTH_CODE_MISSING);
      return NextResponse.redirect(`${origin}/login?error=${error.code}`);
    }

    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-001' } });
        const authError = createAuthError(AuthErrorCode.OAUTH_CALLBACK_FAILED, String(error.message));
        return NextResponse.redirect(`${origin}/login?error=${authError.code}`);
      }

      await syncUserFromAuth(data.user);
      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-001' } });
      return NextResponse.redirect(`${origin}/login?error=${AuthErrorCode.OAUTH_CALLBACK_FAILED}`);
    }
  }
  ```

- [ ] **3.7** `app/(auth)/login/kakao-login-button.tsx`에 카카오 로그인 트리거 Client Component 작성
  ```typescript
  'use client';
  import { createSupabaseBrowserClient } from '@/lib/supabase/client';
  import type { OAuthSignInOptions } from '@/lib/types/auth';

  export function KakaoLoginButton() {
    const handleKakaoLogin = async () => {
      const supabase = createSupabaseBrowserClient();
      const options: OAuthSignInOptions = {
        provider: 'kakao',
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'account_email profile_nickname',
      };
      const { error } = await supabase.auth.signInWithOAuth({
        provider: options.provider,
        options: {
          redirectTo: options.redirectTo,
          scopes: options.scopes,
        },
      });
      if (error) {
        console.error('Kakao OAuth error:', error);
      }
    };

    return (
      <button onClick={handleKakaoLogin} id="kakao-login-btn">
        카카오로 시작하기
      </button>
    );
  }
  ```

- [ ] **3.8** `middleware.ts` (프로젝트 루트)에 세션 검증 로직 통합
  ```typescript
  import { type NextRequest } from 'next/server';
  import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

  const PROTECTED_ROUTES = ['/diagnosis', '/share', '/saved'];
  const PUBLIC_ROUTES = ['/login', '/auth/callback', '/'];

  export async function middleware(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddlewareClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    const isProtected = PROTECTED_ROUTES.some(route =>
      request.nextUrl.pathname.startsWith(route)
    );

    if (isProtected && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', request.nextUrl.pathname);
      return Response.redirect(loginUrl);
    }

    return response;
  }

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
  };
  ```

- [ ] **3.9** `npm install @sentry/nextjs` 실행 (미설치 시)
  - 버전: `@sentry/nextjs@^8.0.0`
  - Sentry 초기화 파일(`sentry.client.config.ts`, `sentry.server.config.ts`)은 MON-001에서 상세 구성. 본 태스크에서는 import만 확인

- [ ] **3.10** `docs/supabase-oauth-setup.md`에 Supabase 대시보드 설정 체크리스트 문서 작성
  - 카카오 OAuth Provider 설정 절차 (3.1~3.3) 스크린샷 포함 가이드
  - 환경변수 목록 + 설정 방법
  - Redirect URL 형식 설명

- [ ] **3.11** `__tests__/auth/kakao-oauth-callback.spec.ts`에 OAuth 콜백 단위 테스트 작성
  ```typescript
  import { GET } from '@/app/auth/callback/route';
  describe('카카오 OAuth Callback Route Handler', () => {
    it('code가 있으면 exchangeCodeForSession 호출 후 리디렉트', async () => { /* ... */ });
    it('code가 없으면 OAUTH_CODE_MISSING 에러로 /login 리디렉트', async () => { /* ... */ });
    it('exchangeCodeForSession 실패 시 Sentry.captureException 호출', async () => { /* ... */ });
    it('syncUserFromAuth 호출로 User UPSERT 실행', async () => { /* ... */ });
    it('next 파라미터가 있으면 해당 경로로 리디렉트', async () => { /* ... */ });
  });
  ```

- [ ] **3.12** `__tests__/auth/kakao-login-button.spec.tsx`에 로그인 버튼 컴포넌트 테스트
  ```typescript
  import { render, fireEvent } from '@testing-library/react';
  import { KakaoLoginButton } from '@/app/(auth)/login/kakao-login-button';
  describe('KakaoLoginButton', () => {
    it('클릭 시 supabase.auth.signInWithOAuth가 provider: kakao로 호출', async () => { /* ... */ });
    it('redirectTo에 /auth/callback 경로가 포함', async () => { /* ... */ });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 카카오 OAuth 로그인 전체 플로우 성공
- **Given** Supabase 대시보드에 카카오 OAuth Provider가 활성화되어 있고, Client ID/Secret이 올바르게 설정된 상태
- **When** 사용자가 "카카오로 시작하기" 버튼을 클릭하고 카카오 로그인·동의를 완료
- **Then** `/auth/callback`에서 `exchangeCodeForSession(code)` 호출 성공, `syncUserFromAuth(data.user)` 실행으로 `public.users` 테이블에 행이 UPSERT, 사용자가 `next` 경로로 리디렉트되며 Supabase 세션 쿠키가 브라우저에 설정

**AC-2 (예외):** OAuth 콜백에 code 파라미터 누락
- **Given** `/auth/callback` Route Handler에 `code` query parameter가 없는 요청
- **When** GET 요청이 도착
- **Then** `Sentry.captureMessage` 호출, `AuthErrorCode.OAUTH_CODE_MISSING` 에러와 함께 `/login?error=AUTH_OAUTH_CODE_MISSING`으로 리디렉트, HTTP 302 응답

**AC-3 (예외):** Supabase exchangeCodeForSession 실패
- **Given** 유효하지 않거나 만료된 `code`가 `/auth/callback`에 전달
- **When** `supabase.auth.exchangeCodeForSession(code)` 호출이 에러 반환
- **Then** `Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-001' } })` 호출, `/login?error=AUTH_OAUTH_CALLBACK_FAILED`로 리디렉트

**AC-4 (보안):** httpOnly cookie 설정 검증
- **Given** 카카오 OAuth 로그인이 성공적으로 완료
- **When** 브라우저 응답 헤더의 `Set-Cookie`를 검사
- **Then** Supabase 세션 쿠키에 `HttpOnly` 플래그가 설정, `SameSite=Lax` 또는 `Strict`, `Secure` 플래그 설정 (Supabase Auth 기본 동작), 클라이언트 JS `document.cookie`에서 세션 토큰 접근 불가

**AC-5 (보안):** 인증 필요 페이지에 미인증 접근 차단
- **Given** 세션 쿠키가 없는 브라우저
- **When** `/diagnosis` 경로에 접근 시도
- **Then** `middleware.ts`에서 세션 검증 실패, `/login?next=/diagnosis`로 리디렉트, HTTP 302 응답

**AC-6 (경계):** Supabase 대시보드 Provider 미활성 상태에서 로그인 시도
- **Given** Supabase 대시보드에서 카카오 Provider가 비활성 상태
- **When** `signInWithOAuth({provider: 'kakao'})` 호출
- **Then** Supabase SDK가 에러 반환, 콘솔에 에러 로그 출력, 사용자에게 로그인 실패 안내

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용" (§4.2.3) | OAuth 콜백 응답의 Set-Cookie 헤더에 HttpOnly, SameSite, Secure 플래그 존재를 통합 테스트에서 검증. `document.cookie`로 세션 토큰 접근 불가 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | OAuth 콜백 에러 발생 시 `Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-001' } })` 호출을 Jest mock으로 검증. Sentry 대시보드에서 auth 태그 필터링 확인 |
| REQ-NF-012 | "서버 오류율 (5xx 응답) ≤ 0.5%" (§4.2.2) | OAuth 콜백 Route Handler의 try-catch가 모든 예외를 포착하여 5xx 대신 302 리디렉트로 처리하는지 확인 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/supabase/client.ts` (브라우저용 Supabase 클라이언트)
- `app/auth/callback/route.ts` (OAuth 콜백 Route Handler)
- `app/(auth)/login/kakao-login-button.tsx` (카카오 로그인 트리거 Client Component)
- `middleware.ts` (세션 검증 Middleware — 프로젝트 루트)
- `docs/supabase-oauth-setup.md` (Supabase 대시보드 설정 체크리스트)
- `__tests__/auth/kakao-oauth-callback.spec.ts` (콜백 단위 테스트)
- `__tests__/auth/kakao-login-button.spec.tsx` (로그인 버튼 컴포넌트 테스트)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 태스크 시작 전 필요):

- **DB-007:** `lib/supabase/server.ts` (createSupabaseServerClient), `lib/supabase/middleware.ts` (createSupabaseMiddlewareClient), `lib/services/user-sync.ts` (syncUserFromAuth), `lib/types/user.ts` (UserDTO), `prisma/schema.prisma` (User + AuthProvider Enum)
- **API-001:** `lib/types/auth.ts` (OAuthProvider, OAuthSignInOptions, AuthCallbackRequest, AuthErrorCode, AuthErrorDTO), `lib/mappers/auth-mapper.ts` (mapSupabaseSessionToDTO), `lib/helpers/auth-error.ts` (createAuthError), `lib/constants/auth-errors.ts` (AUTH_ERROR_MAP)

### 후행 (이 태스크 완료 후 차례로 가능):

- **CMD-AUTH-002:** 네이버 OAuth — CMD-AUTH-001의 패턴을 그대로 따르되 네이버 Custom OIDC 설정 추가
- **CMD-AUTH-003:** 세션 전략 구현 — CMD-AUTH-001이 제공하는 middleware.ts + 콜백 로직 기반
- **CMD-AUTH-004:** 게스트 모드 — CMD-AUTH-001의 OAuth 실패 경로를 기반으로 게스트 전환
- **TEST-008:** OAuth 로그인 GWT 시나리오 — 카카오 로그인 성공·실패 테스트
- **UI-001:** 소셜 로그인 페이지 UI — KakaoLoginButton 컴포넌트 활용

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/auth/kakao-oauth-callback.spec.ts` — 5개 케이스 (정상 리디렉트, code 누락, exchangeCodeForSession 실패, syncUserFromAuth 호출, next 파라미터 리디렉트)
- **단위 테스트:** `__tests__/auth/kakao-login-button.spec.tsx` — 2개 케이스 (provider: kakao 호출, redirectTo 경로 확인)
- **통합 테스트:** `__tests__/integration/kakao-oauth-flow.spec.ts` — OAuth 콜백 Mocking + DB UPSERT 검증 3개 케이스 (신규 사용자 생성, 기존 사용자 갱신, 잘못된 code 에러)
- **E2E 테스트:** Playwright로 카카오 OAuth 흐름 시뮬레이션 (Mock Provider 사용)
  - `npx playwright test tests/e2e/kakao-login.spec.ts`
- **수동 검증:**
  1. Supabase 대시보드 → Authentication → Providers → Kakao 상태가 "Enabled" 확인
  2. 카카오 로그인 후 Supabase 대시보드 → Authentication → Users 에 사용자 생성 확인
  3. 브라우저 DevTools → Application → Cookies에서 Supabase 세션 쿠키 HttpOnly 플래그 확인
  4. `document.cookie`에 Supabase 토큰이 노출되지 않는지 콘솔에서 확인
- **CI 게이트:** `tsc --noEmit` 통과, Jest 테스트 100% 통과, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **카카오 REST API 키 vs JavaScript 키:** Supabase OAuth Provider에는 REST API 키를 Client ID로 사용. JavaScript 키와 혼동 주의 — 설정 체크리스트 문서에 명시.
2. **카카오 비즈니스 앱 전환 필요성:** 이메일 동의항목을 필수로 받으려면 카카오 비즈니스 앱 전환이 필요할 수 있음. 개발 단계에서는 선택 동의로 진행하고, Closed Beta 전 확정.
3. **Supabase Auth provider 이름 확인:** `supabase.auth.signInWithOAuth({provider: 'kakao'})`에서 provider 이름이 정확히 `'kakao'`인지 Supabase 대시보드 설정 후 실제 테스트로 확인 필요.
4. **middleware.ts 기존 로직과의 통합:** 프로젝트에 이미 middleware.ts가 있을 경우 세션 검증 로직을 병합해야 함. SEC-002(Rate Limiting)과의 통합은 후속 태스크에서 처리.
5. **로컬 개발 환경 Redirect URL:** 로컬 `http://localhost:3000`에서 OAuth 테스트 시 Supabase 대시보드의 Redirect URL에 `http://localhost:3000/auth/callback`도 추가 등록 필요.
