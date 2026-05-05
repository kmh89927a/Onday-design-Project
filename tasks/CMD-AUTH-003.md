---
name: Feature Task
title: "[Feature] CMD-AUTH-003: Supabase Auth 세션 전략 구현 — @supabase/ssr httpOnly cookie"
labels: ['feature', 'priority:M', 'epic:Auth', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-AUTH-003] Supabase Auth 세션 전략 구현 — @supabase/ssr httpOnly cookie, sameSite strict
- **목적 (Why):**
  - **비즈니스:** 로그인 후 세션을 안전하게 유지·갱신·만료 처리하여, 사용자가 인증 관련 불편 없이 진단·저장·공유 기능을 연속적으로 사용할 수 있게 한다.
  - **사용자 가치:** 한 번 로그인하면 브라우저를 닫았다 열어도 세션이 유지되고, 세션 만료 시 자동으로 갱신되어 재로그인 빈도를 최소화한다.
- **범위 (What):**
  - ✅ 만드는 것: Middleware 기반 세션 자동 갱신 로직, Server Component/Route Handler에서 세션 접근 유틸리티, 세션 만료 처리 및 리디렉트, 로그아웃 Server Action, 쿠키 보안 설정 강화
  - ❌ 만들지 않는 것: OAuth 로그인 플로우(CMD-AUTH-001/002), 게스트 모드(CMD-AUTH-004), 결제 관련 코드, NextAuth.js 관련 코드
- **복잡도:** M
- **Wave:** 3 (Auth 구현 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용"
- **REQ-FUNC-029** (§4.1.6): "시스템은 Supabase Auth(@supabase/ssr)를 사용하여 카카오·네이버 소셜 로그인을 지원해야 한다. 세션은 Supabase Auth가 발급하는 httpOnly cookie로 관리하며..."
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (커스텀 슬랙 임계치 제거)"
- **CON-18** (§1.2.3): "인증은 Supabase Auth (@supabase/ssr 패키지)를 사용한다."

### 시퀀스 다이어그램 (§6.3.6 — 세션 검증 부분)

```
User→Web: 인증 필요 페이지 접근
Web→Middleware: 요청 전달
Middleware→Supabase: 세션 검증 (쿠키 기반)
alt 세션 유효: Supabase→Middleware: 사용자 정보 반환 → 요청 진행 허용
else 세션 만료: Supabase→Middleware: 세션 무효 → 로그인 페이지 리디렉트
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| CMD-AUTH-001 | `middleware.ts` (기본 세션 검증) | 프로젝트 루트 | 세션 자동 갱신 로직 추가 |
| CMD-AUTH-001 | `app/auth/callback/route.ts` | — | 세션 초기 생성 후 쿠키 설정 흐름 참조 |
| DB-007 | createSupabaseServerClient | `@/lib/supabase/server` | Server Component에서 세션 접근 |
| DB-007 | createSupabaseMiddlewareClient | `@/lib/supabase/middleware` | Middleware에서 세션 갱신 |
| API-001 | AuthSessionDTO, MiddlewareAuthResult | `@/lib/types/auth` | 세션 검증 결과 타입 |
| API-001 | AuthErrorCode | `@/lib/types/auth` | 세션 에러 코드 |
| API-001 | mapSupabaseSessionToDTO | `@/lib/mappers/auth-mapper` | 세션 변환 |
| API-001 | CurrentUser | `@/lib/types/auth` | 인증/게스트/미인증 유니온 타입 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `middleware.ts` 확장 — 세션 자동 갱신(refresh) 로직 추가
  ```typescript
  import { type NextRequest } from 'next/server';
  import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';
  import * as Sentry from '@sentry/nextjs';

  const PROTECTED_ROUTES = ['/diagnosis', '/share', '/saved'];

  export async function middleware(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddlewareClient(request);

    try {
      // 세션 갱신: getUser()는 만료 임박 시 자동으로 refresh_token 사용
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-003' } });
      }

      const isProtected = PROTECTED_ROUTES.some(route =>
        request.nextUrl.pathname.startsWith(route)
      );

      if (isProtected && !user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', request.nextUrl.pathname);
        return Response.redirect(loginUrl);
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-003' } });
    }

    return response;
  }

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
  };
  ```

- [ ] **3.2** `lib/auth/session.ts`에 Server Component/Route Handler용 세션 접근 유틸리티 작성
  ```typescript
  import { createSupabaseServerClient } from '@/lib/supabase/server';
  import { mapSupabaseSessionToDTO } from '@/lib/mappers/auth-mapper';
  import type { CurrentUser, AuthSessionDTO } from '@/lib/types/auth';
  import * as Sentry from '@sentry/nextjs';
  import { AuthErrorCode } from '@/lib/types/auth';
  import { createAuthError } from '@/lib/helpers/auth-error';

  export async function getCurrentUser(): Promise<CurrentUser> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return { type: 'unauthenticated' };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { type: 'unauthenticated' };
      }

      const authSession = mapSupabaseSessionToDTO(session);
      return {
        type: 'authenticated',
        session: authSession,
        user: {
          id: user.id,
          email: user.email ?? '',
          authProvider: (user.app_metadata.provider ?? 'kakao') as 'kakao' | 'naver',
          mode: 'couple',
          createdAt: new Date(user.created_at),
          updatedAt: new Date(),
        },
      };
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-003' } });
      return { type: 'unauthenticated' };
    }
  }

  export async function requireAuth(): Promise<CurrentUser & { type: 'authenticated' }> {
    const currentUser = await getCurrentUser();
    if (currentUser.type !== 'authenticated') {
      throw createAuthError(AuthErrorCode.SESSION_INVALID);
    }
    return currentUser as CurrentUser & { type: 'authenticated' };
  }
  ```

- [ ] **3.3** `lib/auth/actions.ts`에 로그아웃 Server Action 작성
  ```typescript
  'use server';
  import { createSupabaseServerClient } from '@/lib/supabase/server';
  import { redirect } from 'next/navigation';
  import * as Sentry from '@sentry/nextjs';

  export async function signOut() {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'auth', task: 'CMD-AUTH-003' } });
    }
    redirect('/login');
  }
  ```

- [ ] **3.4** `lib/supabase/server.ts` 보안 강화 — 쿠키 옵션에 sameSite strict 명시적 적용
  ```typescript
  // createSupabaseServerClient 내부 cookies.setAll에서:
  cookiesToSet.forEach(({ name, value, options }) =>
    cookieStore.set(name, value, {
      ...options,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })
  );
  ```

- [ ] **3.5** `lib/supabase/middleware.ts` 보안 강화 — Middleware 쿠키 옵션에도 동일 적용
  ```typescript
  // createSupabaseMiddlewareClient 내부 cookies.setAll에서:
  cookiesToSet.forEach(({ name, value, options }) => {
    const secureOptions = {
      ...options,
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
    };
    request.cookies.set(name, value);
    response.cookies.set(name, value, secureOptions);
  });
  ```

- [ ] **3.6** `app/(auth)/login/logout-button.tsx`에 로그아웃 버튼 Client Component 작성
  ```typescript
  'use client';
  import { signOut } from '@/lib/auth/actions';

  export function LogoutButton() {
    return (
      <form action={signOut}>
        <button type="submit" id="logout-btn">로그아웃</button>
      </form>
    );
  }
  ```

- [ ] **3.7** `__tests__/auth/session.spec.ts`에 세션 유틸리티 단위 테스트
  ```typescript
  describe('getCurrentUser', () => {
    it('유효한 세션이 있으면 type: authenticated 반환', async () => { /* ... */ });
    it('세션이 없으면 type: unauthenticated 반환', async () => { /* ... */ });
    it('에러 발생 시 Sentry.captureException 호출 + unauthenticated 반환', async () => { /* ... */ });
  });
  describe('requireAuth', () => {
    it('인증되지 않으면 AuthErrorDTO throw', async () => { /* ... */ });
    it('인증되면 authenticated CurrentUser 반환', async () => { /* ... */ });
  });
  ```

- [ ] **3.8** `__tests__/auth/middleware-session.spec.ts`에 Middleware 세션 갱신 테스트
  ```typescript
  describe('Middleware 세션 검증', () => {
    it('보호 경로에 미인증 접근 시 /login 리디렉트', async () => { /* ... */ });
    it('보호 경로에 인증 접근 시 요청 진행', async () => { /* ... */ });
    it('공개 경로는 미인증이어도 접근 허용', async () => { /* ... */ });
    it('세션 갱신 에러 시 Sentry.captureException 호출', async () => { /* ... */ });
  });
  ```

- [ ] **3.9** `__tests__/auth/signout.spec.ts`에 로그아웃 Server Action 테스트
  ```typescript
  describe('signOut Server Action', () => {
    it('supabase.auth.signOut 호출 후 /login 리디렉트', async () => { /* ... */ });
    it('signOut 에러 시 Sentry.captureException 호출 + /login 리디렉트', async () => { /* ... */ });
  });
  ```

- [ ] **3.10** `__tests__/integration/session-lifecycle.spec.ts`에 세션 생명주기 통합 테스트
  ```typescript
  describe('세션 생명주기 통합 테스트', () => {
    it('로그인 → 보호 페이지 접근 → 로그아웃 → 보호 페이지 차단 전체 흐름', async () => { /* ... */ });
    it('세션 만료 임박 시 Middleware에서 자동 갱신 확인', async () => { /* ... */ });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** httpOnly cookie 기반 세션 유지
- **Given** 사용자가 카카오/네이버 OAuth 로그인을 완료한 상태
- **When** 브라우저 DevTools → Application → Cookies에서 Supabase 세션 쿠키를 검사
- **Then** 쿠키에 `HttpOnly: true`, `SameSite: Strict`, `Secure: true` (프로덕션) 플래그 설정, 클라이언트 JS `document.cookie`에서 세션 토큰이 노출되지 않음

**AC-2 (정상):** Server Component에서 세션 접근
- **Given** 인증된 사용자가 보호 페이지에 접근한 상태
- **When** Server Component에서 `getCurrentUser()` 호출
- **Then** `CurrentUser.type === 'authenticated'`, `session.accessToken`이 유효, `user.id`가 UUID 형식

**AC-3 (예외):** 세션 만료 시 자동 리디렉트
- **Given** 사용자의 세션이 만료된 상태 (refresh_token도 만료)
- **When** 보호 경로(`/diagnosis`)에 접근
- **Then** Middleware에서 `getUser()` 실패, `/login?next=/diagnosis`로 리디렉트, HTTP 302

**AC-4 (보안):** 세션 토큰이 클라이언트 JS에서 접근 불가능
- **Given** 인증된 사용자의 브라우저
- **When** 브라우저 콘솔에서 `document.cookie` 실행
- **Then** Supabase 세션 관련 쿠키(`sb-*-auth-token`)가 출력되지 않음 (HttpOnly로 인해)

**AC-5 (보안):** CSRF 보호 동작 검증
- **Given** 외부 사이트에서 인증이 필요한 Server Action을 직접 호출 시도
- **When** `SameSite: Strict` 설정으로 인해 쿠키가 전송되지 않음
- **Then** 세션 검증 실패, 요청 거부

**AC-6 (경계):** 로그아웃 후 세션 완전 삭제
- **Given** 인증된 사용자
- **When** `signOut()` Server Action 실행
- **Then** Supabase 세션 쿠키 삭제, 이후 보호 경로 접근 시 `/login` 리디렉트, `getCurrentUser()` 반환값 `type: 'unauthenticated'`

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용" (§4.2.3) | `cookies.set()` 호출 시 `{ httpOnly: true, sameSite: 'strict', secure: true }` 옵션이 적용되는지 단위 테스트로 검증. 브라우저 DevTools에서 Set-Cookie 헤더 수동 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | Middleware, getCurrentUser, signOut 모든 catch 블록에서 `Sentry.captureException(error, { tags: { domain: 'auth' } })` 호출을 Jest mock으로 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `middleware.ts` (세션 자동 갱신 로직 추가 — CMD-AUTH-001 확장)
- `lib/auth/session.ts` (getCurrentUser, requireAuth 유틸리티)
- `lib/auth/actions.ts` (signOut Server Action)
- `lib/supabase/server.ts` (쿠키 보안 옵션 강화 — DB-007 확장)
- `lib/supabase/middleware.ts` (쿠키 보안 옵션 강화 — DB-007 확장)
- `app/(auth)/login/logout-button.tsx` (로그아웃 버튼 Client Component)
- `__tests__/auth/session.spec.ts` (세션 유틸리티 테스트)
- `__tests__/auth/middleware-session.spec.ts` (Middleware 세션 테스트)
- `__tests__/auth/signout.spec.ts` (로그아웃 테스트)
- `__tests__/integration/session-lifecycle.spec.ts` (세션 생명주기 통합 테스트)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:

- **CMD-AUTH-001:** `middleware.ts`, `app/auth/callback/route.ts`, `lib/supabase/client.ts`
- **DB-007:** `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `lib/services/user-sync.ts`
- **API-001:** `lib/types/auth.ts` (AuthSessionDTO, MiddlewareAuthResult, CurrentUser, AuthErrorCode), `lib/mappers/auth-mapper.ts`, `lib/helpers/auth-error.ts`

### 후행:

- **CMD-AUTH-004:** 게스트 모드 — `getCurrentUser()` 반환값에 guest 분기 추가
- **CMD-DIAG-004:** 진단 결과 저장 — `requireAuth()` 사용
- **CMD-SAVE-001:** 입력값 저장 — `requireAuth()` 사용
- **CMD-SHARE-001:** 공유 링크 생성 — `requireAuth()` 사용
- **TEST-008:** OAuth 로그인 GWT 시나리오 — 세션 생성·갱신·만료 테스트

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/auth/session.spec.ts` — 5개 케이스 (getCurrentUser 정상/미인증/에러, requireAuth 정상/미인증)
- **단위 테스트:** `__tests__/auth/middleware-session.spec.ts` — 4개 케이스 (보호 경로 차단, 인증 통과, 공개 경로 허용, 에러 Sentry)
- **단위 테스트:** `__tests__/auth/signout.spec.ts` — 2개 케이스 (정상 로그아웃, 에러 시 Sentry)
- **통합 테스트:** `__tests__/integration/session-lifecycle.spec.ts` — 2개 케이스 (전체 흐름, 자동 갱신)
- **수동 검증:**
  1. 브라우저 DevTools에서 Set-Cookie 헤더의 HttpOnly, SameSite, Secure 플래그 확인
  2. `document.cookie`로 세션 토큰 접근 불가 확인
  3. 세션 만료 후 보호 페이지 접근 시 리디렉트 확인
  4. 로그아웃 후 쿠키 삭제 확인
- **CI 게이트:** `tsc --noEmit` 통과, Jest 테스트 100% 통과, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **Supabase 세션 갱신 전략:** `@supabase/ssr`의 `getUser()`가 자동으로 refresh_token을 사용하여 세션을 갱신하지만, 갱신 임계값(만료 전 몇 초에 갱신하는지)은 Supabase 서버 설정에 의존. Supabase 대시보드에서 JWT expiry 설정 확인 필요.
2. **sameSite strict vs lax 트레이드오프:** `sameSite: 'strict'`는 외부 사이트에서 링크 클릭 시 쿠키를 전송하지 않아 초기 로딩에서 미인증 상태가 될 수 있음. 공유 링크(`/share/[token]`) 접근 시 문제 없는지 확인 필요 — 공유 링크는 미인증으로도 접근 가능하므로 영향 없음.
3. **Middleware 실행 비용:** 모든 요청에서 `getUser()` 호출 시 Supabase API 호출이 발생. Vercel Edge Runtime에서의 성능 영향 측정 필요.
4. **로그아웃 시 모든 디바이스 세션 종료 여부:** `supabase.auth.signOut()`은 현재 세션만 종료. 모든 디바이스 세션 종료는 `scope: 'global'` 옵션 필요 — MVP에서는 현재 세션만 종료.
