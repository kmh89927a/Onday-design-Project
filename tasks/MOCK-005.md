---
name: Feature Task
title: "[Feature] MOCK-005: OAuth 소셜 로그인 Mock 데이터 (카카오/네이버 프로필, Supabase Auth 세션)"
labels: ['feature', 'priority:L', 'epic:Mock & Fixture', 'wave:2']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [MOCK-005] OAuth 소셜 로그인 Mock 데이터 (카카오/네이버 프로필 응답, Supabase Auth 세션 객체)
- **목적 (Why):**
  - **비즈니스:** 로그인 UI(UI-001)와 Auth 관련 로직(CMD-AUTH-001~004)이 Supabase Auth 실연동 전에 개발·테스트될 수 있도록, Supabase Auth 세션·카카오/네이버 OAuth 프로필 Mock 데이터를 제공한다.
  - **사용자 가치:** 인증 상태별(로그인 성공·세션 만료·게스트 모드) UI 렌더링을 사전 검증하여 안정적인 로그인 경험을 보장한다.
- **범위 (What):**
  - ✅ 만드는 것: 카카오 로그인 성공 세션 Mock, 네이버 로그인 성공 세션 Mock, 세션 만료 Mock, 게스트 모드 Mock, OAuth 콜백 에러 Mock
  - ❌ 만들지 않는 것: OAuth 플로우 구현(CMD-AUTH 범위), NextAuth.js 관련 코드(사용하지 않음), 결제 관련 Mock
- **복잡도:** L
- **Wave:** 2 (Mock 생성 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-029** (§4.1.6): "시스템은 Supabase Auth(@supabase/ssr)를 사용하여 카카오·네이버 소셜 로그인을 지원해야 한다. 세션은 Supabase Auth가 발급하는 httpOnly cookie로 관리하며, 카카오·네이버 OAuth는 Supabase 대시보드의 External OAuth Provider 설정으로 구성한다."
- **CON-18** (§1.2.3): "인증은 Supabase Auth (@supabase/ssr 패키지)를 사용한다. 카카오·네이버 OAuth는 Supabase 대시보드의 External OAuth Provider 설정으로 구성한다. NextAuth.js는 사용하지 않는다."
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용. CSRF 보호는 Supabase Auth 내장 메커니즘 사용"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (커스텀 슬랙 임계치 제거)"

### 시퀀스 다이어그램 (§6.3.6 인증 플로우)

- **참여 Actor:** 사용자, Next.js Client Component, Next.js Middleware, Route Handler (/auth/callback), Supabase Auth, OAuth Provider (카카오/네이버), Prisma ORM, Amplitude
- **핵심 분기:**
  1. 정상: `signInWithOAuth()` → OAuth 인증 → auth_code → 세션 교환 → httpOnly cookie 설정
  2. 세션 만료: Middleware 검증 → 세션 무효 → 로그인 페이지 리디렉트
  3. 장애: OAuth Provider 장애 → 게스트 임시 체험 모드 전환

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 태스크에서의 사용처 |
|---|---|---|
| API-001 | `lib/types/auth.ts` — `AuthSessionDTO`, `AuthUserDTO`, `OAuthProvider`, `AuthCallbackResult`, `AuthErrorCode`, `AuthErrorDTO`, `MiddlewareAuthResult`, `GuestSession`, `GuestLimitation`, `CurrentUser` | Mock 객체가 이 타입들을 `satisfies` 키워드로 타입 검증하여 생성됨 |
| DB-007 | `lib/types/user.ts` — `UserDTO` | `CurrentUser.user` 필드의 Mock 생성에 사용 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/mocks/auth/` 디렉토리 생성
  - 명령어: `mkdir -p lib/mocks/auth`

- [ ] **3.2** `lib/mocks/auth/sessions.ts`에 카카오 로그인 성공 세션 Mock 정의
  ```typescript
  import type { AuthSessionDTO, AuthUserDTO, OAuthProvider } from '@/lib/types/auth';

  export const MOCK_AUTH_USER_KAKAO: AuthUserDTO = {
    id: 'mock-user-kakao-001',
    email: 'jiyoung.kim@example.com',
    provider: 'kakao' satisfies OAuthProvider,
    avatarUrl: 'https://k.kakaocdn.net/mock/profile_kakao_001.jpg',
    lastSignInAt: '2026-04-25T09:00:00.000Z',
  } satisfies AuthUserDTO;

  export const MOCK_SESSION_KAKAO: AuthSessionDTO = {
    accessToken: 'mock-access-token-kakao-eyJhbGciOiJIUzI1NiJ9',
    refreshToken: 'mock-refresh-token-kakao-dGhpcyBpcyBhIG1vY2s',
    expiresAt: 1777305600,  // 2026-04-25T12:00:00Z (고정값)
    user: MOCK_AUTH_USER_KAKAO,
  } satisfies AuthSessionDTO;
  ```

- [ ] **3.3** `lib/mocks/auth/sessions.ts`에 네이버 로그인 성공 세션 Mock 정의
  ```typescript
  export const MOCK_AUTH_USER_NAVER: AuthUserDTO = {
    id: 'mock-user-naver-001',
    email: 'sangmin.park@example.com',
    provider: 'naver' satisfies OAuthProvider,
    avatarUrl: 'https://phinf.pstatic.net/mock/profile_naver_001.jpg',
    lastSignInAt: '2026-04-25T09:30:00.000Z',
  } satisfies AuthUserDTO;

  export const MOCK_SESSION_NAVER: AuthSessionDTO = {
    accessToken: 'mock-access-token-naver-eyJhbGciOiJIUzI1NiJ9',
    refreshToken: 'mock-refresh-token-naver-bmF2ZXIgbW9jaw',
    expiresAt: 1777305600,
    user: MOCK_AUTH_USER_NAVER,
  } satisfies AuthSessionDTO;
  ```

- [ ] **3.4** `lib/mocks/auth/sessions.ts`에 세션 만료 Mock 정의
  ```typescript
  export const MOCK_SESSION_EXPIRED: AuthSessionDTO = {
    accessToken: 'mock-access-token-expired',
    refreshToken: 'mock-refresh-token-expired',
    expiresAt: 1672531200,  // 2023-01-01T00:00:00Z (과거 고정값)
    user: MOCK_AUTH_USER_KAKAO,
  } satisfies AuthSessionDTO;
  ```

- [ ] **3.5** `lib/mocks/auth/guest.ts`에 게스트 모드 Mock 정의
  ```typescript
  import type { GuestSession, GuestLimitation, CurrentUser } from '@/lib/types/auth';

  export const MOCK_GUEST_SESSION: GuestSession = {
    isGuest: true,
    guestId: 'mock-guest-001',
    createdAt: '2026-04-25T10:00:00.000Z',
    limitations: ['no_save', 'no_share', 'no_history'] satisfies GuestLimitation[],
  } satisfies GuestSession;

  export const MOCK_CURRENT_USER_GUEST: CurrentUser = {
    type: 'guest',
    session: MOCK_GUEST_SESSION,
  };

  export const MOCK_CURRENT_USER_UNAUTHENTICATED: CurrentUser = {
    type: 'unauthenticated',
  };
  ```

- [ ] **3.6** `lib/mocks/auth/current-user.ts`에 CurrentUser 통합 Mock 정의
  ```typescript
  import type { CurrentUser } from '@/lib/types/auth';
  import type { UserDTO } from '@/lib/types/user';
  import { MOCK_SESSION_KAKAO, MOCK_SESSION_NAVER } from './sessions';

  export const MOCK_USER_DTO_KAKAO: UserDTO = {
    id: 'mock-user-kakao-001',
    email: 'jiyoung.kim@example.com',
    authProvider: 'kakao',
    mode: 'couple',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-25T09:00:00.000Z',
  } satisfies UserDTO;

  export const MOCK_CURRENT_USER_KAKAO: CurrentUser = {
    type: 'authenticated',
    session: MOCK_SESSION_KAKAO,
    user: MOCK_USER_DTO_KAKAO,
  };
  ```

- [ ] **3.7** `lib/mocks/auth/errors.ts`에 Auth 에러 시나리오 Mock 정의
  ```typescript
  import { AuthErrorCode, type AuthErrorDTO, type MiddlewareAuthResult } from '@/lib/types/auth';

  export const MOCK_AUTH_ERROR_CALLBACK_FAILED: AuthErrorDTO = {
    code: AuthErrorCode.OAUTH_CALLBACK_FAILED,
    message: '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
    httpStatus: 500,
    originalError: 'Supabase exchangeCodeForSession failed: invalid_grant',
  } satisfies AuthErrorDTO;

  export const MOCK_AUTH_ERROR_SESSION_EXPIRED: AuthErrorDTO = {
    code: AuthErrorCode.SESSION_EXPIRED,
    message: '세션이 만료되었습니다. 다시 로그인해 주세요.',
    httpStatus: 401,
  } satisfies AuthErrorDTO;

  export const MOCK_AUTH_ERROR_PROVIDER_DOWN: AuthErrorDTO = {
    code: AuthErrorCode.OAUTH_PROVIDER_ERROR,
    message: '소셜 로그인 서비스에 일시적 장애가 있습니다.',
    httpStatus: 502,
    originalError: 'Kakao OAuth: Connection refused',
  } satisfies AuthErrorDTO;

  export const MOCK_MIDDLEWARE_RESULT_VALID: MiddlewareAuthResult = {
    authenticated: true,
    user: { id: 'mock-user-kakao-001', email: 'jiyoung.kim@example.com', provider: 'kakao' },
  } satisfies MiddlewareAuthResult;

  export const MOCK_MIDDLEWARE_RESULT_EXPIRED: MiddlewareAuthResult = {
    authenticated: false,
    user: null,
    error: AuthErrorCode.SESSION_EXPIRED,
  } satisfies MiddlewareAuthResult;
  ```

- [ ] **3.8** `lib/mocks/auth/index.ts`에 배럴 export
  ```typescript
  export * from './sessions';
  export * from './guest';
  export * from './current-user';
  export * from './errors';
  ```

- [ ] **3.9** `__tests__/mocks/auth.spec.ts`에 Mock 데이터 무결성 검증 테스트
  ```typescript
  describe('Auth Mock 데이터 무결성', () => {
    it('카카오 세션 Mock의 provider가 kakao이다', () => { /* ... */ });
    it('네이버 세션 Mock의 provider가 naver이다', () => { /* ... */ });
    it('만료 세션 Mock의 expiresAt이 과거 timestamp이다', () => { /* ... */ });
    it('게스트 Mock의 isGuest가 true이고 limitations에 3개 제한이 포함된다', () => { /* ... */ });
    it('CurrentUser 유니온 타입의 3가지 분기가 올바르게 구성된다', () => { /* ... */ });
    it('모든 Mock에서 Math.random/Date.now/new Date 사용이 0건이다', () => { /* ... */ });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 카카오 로그인 성공 세션 Mock 구조 검증
- **Given** `MOCK_SESSION_KAKAO`가 import된 상태
- **When** `AuthSessionDTO` 타입으로 `satisfies` 검증
- **Then** `user.provider === 'kakao'`, `accessToken`이 빈 문자열이 아니며, `expiresAt`이 고정 Unix timestamp
- **And** `user.id === 'mock-user-kakao-001'` (결정론적 고정값)

**AC-2 (예외):** 세션 만료 Mock 검증
- **Given** `MOCK_SESSION_EXPIRED`가 import된 상태
- **When** `expiresAt`과 현재 시각 비교
- **Then** `expiresAt === 1672531200` (2023-01-01, 과거 고정값)
- **And** `MOCK_MIDDLEWARE_RESULT_EXPIRED.authenticated === false`, `error === AuthErrorCode.SESSION_EXPIRED`

**AC-3 (예외):** OAuth Provider 장애 에러 Mock 검증
- **Given** `MOCK_AUTH_ERROR_PROVIDER_DOWN`이 import된 상태
- **When** `code`와 `httpStatus` 확인
- **Then** `code === AuthErrorCode.OAUTH_PROVIDER_ERROR`, `httpStatus === 502`, `message`가 한국어 문자열
- **And** `originalError`에 Sentry 전달용 원본 에러 정보가 포함

**AC-4 (경계):** 게스트 모드 전환 Mock 검증
- **Given** `MOCK_CURRENT_USER_GUEST`가 import된 상태
- **When** `CurrentUser` 유니온 타입 분기 확인
- **Then** `type === 'guest'`, `session.isGuest === true`, `session.limitations`에 `'no_save'`, `'no_share'`, `'no_history'` 포함
- **And** `MOCK_CURRENT_USER_UNAUTHENTICATED.type === 'unauthenticated'`

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용" (§4.2.3) | Mock 세션이 cookie 속성을 직접 포함하지 않고 서버 사이드 세션 객체 구조만 제공하는지 확인. accessToken/refreshToken이 실제 JWT가 아닌 Mock 문자열인지 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | AuthErrorDTO Mock에 `originalError` 필드가 포함되어 Sentry captureException에 전달 가능한 구조인지 테스트에서 확인 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/mocks/auth/sessions.ts` (카카오·네이버 로그인 성공 + 세션 만료 3개 Mock)
- `lib/mocks/auth/guest.ts` (게스트 모드 + 미인증 Mock)
- `lib/mocks/auth/current-user.ts` (CurrentUser 통합 Mock + UserDTO Mock)
- `lib/mocks/auth/errors.ts` (Auth 에러 3개 + Middleware 결과 2개)
- `lib/mocks/auth/index.ts` (배럴 export)
- `__tests__/mocks/auth.spec.ts` (Mock 무결성 검증 6개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **API-001:** `lib/types/auth.ts` — `AuthSessionDTO`, `AuthUserDTO`, `OAuthProvider`, `AuthErrorCode`, `AuthErrorDTO`, `MiddlewareAuthResult`, `GuestSession`, `CurrentUser` 타입 정의
- **DB-007:** `lib/types/user.ts` — `UserDTO` 타입 정의

### 후행:
- **UI-001:** 소셜 로그인 페이지 UI — `MOCK_CURRENT_USER_KAKAO`, `MOCK_GUEST_SESSION` 사용
- **CMD-AUTH-001~004:** Auth 구현 — Mock 데이터로 단위 테스트
- **TEST-008:** OAuth 로그인 GWT 시나리오 — Mock 데이터 기반 테스트 fixture

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/mocks/auth.spec.ts` — 6개 케이스
- **타입 검증:** `tsc --noEmit`으로 모든 Mock 객체가 API-001 DTO 타입과 호환되는지 확인
- **정적 분석:** `grep -r 'Math.random\|Date.now\|new Date' lib/mocks/auth/` 결과 0건
- **수동 검증:** IDE에서 Mock 객체 hover 시 DTO 타입 표시 확인
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **MSW 핸들러 제공 여부:** `/auth/callback` Route Handler를 MSW로 인터셉트하여 OAuth 콜백 응답을 Mock할 수 있으나, Supabase Auth의 내부 세션 교환까지 Mock하려면 `@supabase/supabase-js`의 `createClient`를 jest.mock으로 대체하는 것이 더 적합 — CMD-AUTH-001 작업 시 확정.
2. **Storybook 연동 방안:** 로그인 버튼 UI(UI-001)의 Storybook story에서 `CurrentUser` Mock을 Context Provider로 주입하여, 로그인/게스트/미인증 3가지 상태를 각각 렌더링 가능 — UI-001 작업 시 확정.
3. **Supabase User metadata 구조:** `app_metadata.provider`와 `user_metadata.avatar_url`의 정확한 필드명이 카카오·네이버 Provider 등록 방식에 따라 다를 수 있음 — CMD-AUTH-001에서 실제 Supabase 대시보드 설정 후 Mock 데이터 정렬.
4. **accessToken/refreshToken Mock 값:** 실제 JWT 형식이 아닌 `mock-` prefix 문자열을 사용하여, 실수로 프로덕션 코드에서 Mock 토큰이 사용되는 것을 방지.
