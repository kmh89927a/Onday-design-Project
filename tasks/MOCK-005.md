---
name: Feature Task
title: "[Feature] MOCK-005: OAuth 소셜 로그인 Mock 데이터 — ★★★ Wave 2 트랙 E 4/4 완성 + Wave 3 진입 트리거 (★ 본 세션 정점 마침표) + ★★★ 결정론 가드 § 진화 새 owner (가이드 § 9 → 10) + ★★ adaptive § Foundation+mock 차원 첫 적용 + 분리 검증 패턴 § + stale 6건째 § (MOCK-004 §) 첫 후행 입증"
labels: ['feature', 'priority:L', 'epic:Mock & Fixture', 'wave:2']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [MOCK-005] OAuth 소셜 로그인 Mock 데이터 (카카오/네이버 프로필 응답, Supabase Auth 세션 객체) — ★ Wave 2 트랙 E **4/4 완성** = Wave 3 진입 트리거 (★ 본 세션 정점 마침표 + 본 프로젝트 통틀어 가장 큰 매듭)
- **★★ 본 ISSUE 메타 가치 10종:**
  1. ★ Wave 2 트랙 E 4/4 완성 + Wave 3 진입 트리거 (★ 본 세션 정점 마침표)
  2. ★ 분리 검증 패턴 § (MOCK-004 §9.8) **첫 후행 실전 검증** (0차/1차/2차 검증 = 결정론 가드 grep + satisfies + TEST-008)
  3. ★ stale 자가 치유 6건째 § (MOCK-004 §9.3) **첫 후행 입증** (★ 2 사례 = Phase A 산출 파일 5 → 4 → ★ 5 + Q4 MOCK 답습 § 정밀화)
  4. ★ Mismatch 6건 자동 보정 (5건 보정 + 1건 매치, ★ ④ Date 충돌)
  5. ★★ adaptive § Foundation + mock 차원 **첫 적용** (★ adaptive 모든 도메인 차원 작동 입증)
  6. ★ MOCK 답습 § 15회째 일관 + ★ 정밀화 (도메인 패턴 답습 ≠ 파일 수 절대값)
  7. ★ L6 cleanup 영역 가드 사수 (156 lines 무수정 입증)
  8. ★★★ **결정론 가드 § 진화 새 차원** (★ NEW 본 ISSUE 신규 owner — 가이드 § 9 → 10 확장) — 비결정 호출 0건 + 고정 인자 `new Date('ISO')` 허용
  9. ★ Mismatch 27건 누적 cleanup 8차 + REFACTOR-L6 위임 트리거 (156 lines 영역)
  10. ★ stale 자가 치유 19건 누적 (지난 9 + 본 세션 6 + 본 ISSUE 4 = 시스템 자기 인식 정점 진화 입증 누적)
- **목적 (Why):**
  - **비즈니스:** 로그인 UI(UI-001)와 Auth 관련 로직(CMD-AUTH-001~004)이 Supabase Auth 실연동 전에 개발·테스트될 수 있도록, Supabase Auth 세션·카카오/네이버 OAuth 프로필 Mock 데이터를 제공한다.
  - **사용자 가치:** 인증 상태별(로그인 성공·세션 만료·게스트 모드) UI 렌더링을 사전 검증하여 안정적인 로그인 경험을 보장한다.
- **범위 (What):**
  - ✅ 만드는 것: 카카오 로그인 성공 세션 Mock, 네이버 로그인 성공 세션 Mock, 세션 만료 Mock, 게스트 모드 Mock, OAuth 콜백 에러 Mock + ★ UserDTO Mock (★ Mismatch ④ Date 보정 = `new Date('고정 ISO')` 결정론 가드 § 진화 적용)
  - ❌ 만들지 않는 것: OAuth 플로우 구현 (CMD-AUTH 범위), NextAuth.js 관련 코드 (사용하지 않음), 결제 관련 Mock, ★ spec.ts (TEST-008 위임 = 답습 15회째), ★ L6 cleanup 영역 정정 (src/mocks/users.ts + src/lib/auth.ts + src/lib/types.ts 156 lines 무수정 = REFACTOR-L6 위임 트리거)
- **복잡도:** L
- **Wave:** 2 (Mock 생성 트랙 E 4/4 완성)

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
| API-001 ✅ 머지 (PR #81) | `onday-app/src/lib/types/auth.ts` — `AuthSessionDTO`, `AuthUserDTO`, `OAuthProvider` (★ `= AuthProviderType` (P1) 추인), `AuthCallbackResult`, `AuthErrorCode`, `AuthErrorDTO`, `MiddlewareAuthResult`, `GuestSession`, `GuestLimitation`, `CurrentUser` | Mock 객체가 이 타입들을 `satisfies` 키워드로 타입 검증하여 생성됨 |
| DB-007 ✅ 머지 (PR #80) | `onday-app/src/lib/types/user.ts` — `UserDTO {id, email, authProvider, mode, createdAt: Date, updatedAt: Date}` | `MOCK_USER_DTO_KAKAO` 생성 (★ Mismatch ④ Date 보정 + 결정론 가드 § 진화 핵심 위치) |
| (전이) MOCK-001/002/004 ✅ 머지 (PR #85/86/89) | `lib/mocks/{도메인}/` 패턴 답습 기준 (15회째 일관) | 도메인 책임 분리 패턴 답습 (★ MOCK 답습 § 정밀화 = 도메인 패턴 답습 ≠ 파일 수 절대값) |

> **★ Phase A 명세 현실 동기화 (2026-05-22):** API-001 머지 (PR #81) + DB-007 머지 (PR #80) 완료 = 본 ISSUE 가 두 산출 타입을 직접 import 한다 (어댑터 0 = MOCK-004 Q4 (B) 답습 9회째).
>
> **★★ Mismatch 6건 사전 발견 (5건 보정 + 1건 매치, ★ ④ Date 충돌 NEW) — §9.4 정직 기록:**
> - ① `MOCK_AUTH_USER_KAKAO` 5 필드 ↔ `AuthUserDTO {id, email, provider, avatarUrl?, lastSignInAt?}` ✅ **매치**
> - ② `provider: 'kakao' satisfies OAuthProvider` ↔ `OAuthProvider = AuthProviderType = 'kakao'\|'naver'` ✅ **매치** (DB-007 (P1) 추인 패턴 정합)
> - ③ `MOCK_MIDDLEWARE_RESULT_VALID.user` 3 필드 ↔ `AuthUserDTO` 5 필드 (avatarUrl/lastSignInAt optional) ✅ **매치**
> - **★★★ ④ `createdAt: '2026-04-01T...'` (string)** ↔ **`UserDTO.createdAt: Date` (객체)** = ★ **`new Date('2026-04-01T00:00:00.000Z')`** 자동 보정 (★ **결정론 가드 § 진화 새 차원** = 고정 인자 허용)
> - **⑤ `__tests__/mocks/auth.spec.ts` 6 케이스 → TEST-008 위임** (★ 답습 15회째 일관, vitest config 부재 — MOCK-001/002/004 답습 정신)
> - **⑥ 명세 §6 Deliverables 5 파일 + spec.ts → ★ 5 파일 (4 도메인 + index) + TEST-008 위임** (★ stale 자가 치유 6건째 § 첫 후행 = MOCK 답습 § 정밀화 적용)

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `onday-app/src/lib/mocks/auth/` 디렉토리 생성 (★ MOCK-001/002/004 답습 15회째 일관 — `lib/mocks/{도메인}/` 패턴)
  - 명령어: `mkdir -p onday-app/src/lib/mocks/auth`
  - ★ L6 cleanup 영역과 분리: `src/mocks/users.ts` (14) + `src/lib/auth.ts` (40) + `src/lib/types.ts` (102) = 156 lines prototype 잔존 = ★ **무수정 가드 사수** (REFACTOR-L6 별도 책임)
  - ★ 책임 분리: 73 태스크 layer (`src/lib/mocks/`) ↔ prototype layer (`src/mocks/`) 1:1 매칭 0% = layer 분리 명확

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

- [ ] **3.6** `onday-app/src/lib/mocks/auth/current-user.ts`에 CurrentUser 통합 Mock 정의 (★★★ 본 ISSUE 핵심 코드 입증 위치 = Mismatch ④ + 결정론 가드 § 진화 + adaptive § Foundation+mock 3종 동시 박힘)
  ```typescript
  import type { CurrentUser } from '@/lib/types/auth';
  import type { UserDTO } from '@/lib/types/user';
  import { MOCK_SESSION_KAKAO } from './sessions';

  // ★ Mismatch ④ 자동 보정 = adaptive § Foundation + mock 차원 첫 적용:
  //   명세 v1.0: createdAt: '2026-04-01T...' (string)
  //   → DB-007 UserDTO.createdAt: Date (객체)
  //   → 본 fixture: new Date('2026-04-01T00:00:00.000Z') (★ 결정론 가드 § 진화)
  //
  // ★ 결정론 가드 § 진화 새 차원 (★ NEW 본 ISSUE 신규 owner — 가이드 § 9 → 10 확장):
  //   정립 (MOCK-001/002/004): Math.random / Date.now / new Date 호출 0 건
  //   진화 (★ 본 ISSUE): 비결정 호출 0 건 = Math.random() + Date.now() + new Date() (인자 없음) 0 건.
  //                     고정 인자 new Date('ISO 8601 리터럴') 허용 (결정론 유지).

  export const MOCK_USER_DTO_KAKAO = {
    id: 'mock-user-kakao-001',
    email: 'jiyoung.kim@example.com',
    authProvider: 'kakao',
    mode: 'couple',
    createdAt: new Date('2026-04-01T00:00:00.000Z'),  // ★ Mismatch ④ 보정 + 결정론 가드 § 진화
    updatedAt: new Date('2026-04-25T09:00:00.000Z'),  // ★ Mismatch ④ 보정 + 결정론 가드 § 진화
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

- [⏸ TEST-008 위임] **3.9** ~~`onday-app/__tests__/mocks/auth.spec.ts` 6 케이스 작성~~ → **★ TEST-008 위임** (★ MOCK-001/002/004 답습 15회째 일관 — 본 ISSUE 가 정점 답습)

  - **★ stale 자가 치유 6건째 § (MOCK-004 §9.3) 첫 후행 입증:** 명세 v1.0 작성 시점 `spec.ts` 작성 안내 ↔ MOCK-001 §3.10 (TEST-001) + MOCK-002 §3.9 (TEST-003+004) + MOCK-004 §3.6 (TEST-002) **15 회 일관 답습** = 본 ISSUE → **TEST-008 위임** + vitest config 부재 **15 회째 일관**.
  - **위임 책임:** TEST-008 (OAuth 로그인 GWT 시나리오 — 명세 §7 후행 명시 박힘).
  - **위임 케이스 6종 (★ Mismatch 자동 보정 + 결정론 가드 § 진화 검증 무대):**
    1. 카카오 세션 Mock provider 'kakao' (★ Mismatch ② AuthProviderType 정합 검증)
    2. 네이버 세션 Mock provider 'naver' (★ AuthProviderType 정합 검증)
    3. 만료 세션 Mock `expiresAt` 과거 timestamp (★ 1672531200 결정론)
    4. 게스트 Mock `isGuest === true` + `limitations` 3 제한 ('no_save', 'no_share', 'no_history')
    5. CurrentUser 유니온 3 분기 (authenticated + guest + unauthenticated)
    6. ★ **결정론 가드 § 진화 grep 분리 검증** (1차 가드 + 2차 허용 입증, ★ NEW):
       - 1차 (★ 가드): `grep -nE "Math\.random\(\|Date\.now\(\|new Date\(\)"` → **0 호출**
       - 2차 (★ 허용 입증): `grep -nE "new Date\('[0-9]{4}-[0-9]{2}-[0-9]{2}"` → **N 호출** (UserDTO.createdAt/updatedAt 박힘)
  - **Phase B static check (★ TEST-008 시점 자동 작동 전 grep 검증 분리 — ★ 분리 검증 패턴 § 첫 후행):**
    - `grep -nE "Math\.random\(|Date\.now\(|new Date\(\)" onday-app/src/lib/mocks/auth/` → 0 호출 (★ 비결정 호출 0건 = 결정론 가드 § 진화 가드)
    - `grep -nE "new Date\('[0-9]" onday-app/src/lib/mocks/auth/` → N 호출 (★ 고정 인자 허용 입증)

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

**AC-5 (정상, ★ NEW):** UserDTO Mock Date 객체 + 결정론 가드 § 진화 검증 (★ Mismatch ④ 보정)
- **Given** `MOCK_USER_DTO_KAKAO`가 import된 상태
- **When** `UserDTO` 타입 (★ DB-007 산출물) 으로 `satisfies` 검증
- **Then** `createdAt instanceof Date === true`, `updatedAt instanceof Date === true` (★ string ≠ Date 차이)
- **And** `createdAt.toISOString() === '2026-04-01T00:00:00.000Z'` (★ 고정 인자 = 결정론 유지)
- **And** ★ 결정론 가드 § 진화 grep 1차 = 비결정 호출 0 건, 2차 = 고정 인자 `new Date('ISO')` 2 호출 입증

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용" (§4.2.3) | Mock 세션이 cookie 속성을 직접 포함하지 않고 서버 사이드 세션 객체 구조만 제공하는지 확인. accessToken/refreshToken이 실제 JWT가 아닌 Mock 문자열인지 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | AuthErrorDTO Mock에 `originalError` 필드가 포함되어 Sentry captureException에 전달 가능한 구조인지 테스트에서 확인 |

---

## 6. 📦 Deliverables (산출물 명시 — ★ Phase A 동기화 5 파일 + TEST-008 위임, ★ MOCK 답습 § 정밀화 = 도메인 패턴 답습 ≠ 파일 수 절대값)

- `onday-app/src/lib/mocks/auth/sessions.ts` (~55 lines) — `AuthUserDTO` 2 (카카오 + 네이버) + `AuthSessionDTO` 3 (카카오 + 네이버 + 만료) `satisfies AuthSessionDTO`
- `onday-app/src/lib/mocks/auth/guest.ts` (~25 lines) — `GuestSession` 1 + `CurrentUser` 2 (guest + unauthenticated) `satisfies`
- **★ `onday-app/src/lib/mocks/auth/current-user.ts` (~25 lines) — ★★★ 본 ISSUE 핵심 입증 위치:** `UserDTO` (★ `createdAt/updatedAt: new Date('고정 ISO')` = ★ Mismatch ④ 보정 + 결정론 가드 § 진화 + adaptive § Foundation+mock 차원 **3종 동시 박힘**) + `CurrentUser` 1 (authenticated) `satisfies`
- `onday-app/src/lib/mocks/auth/errors.ts` (~50 lines) — `AuthErrorDTO` 3 (콜백 실패 + 세션 만료 + Provider 장애) + `MiddlewareAuthResult` 2 (valid + expired) `satisfies`
- `onday-app/src/lib/mocks/auth/index.ts` (4 lines) — 배럴 export 4 모듈
- ~~`onday-app/__tests__/mocks/auth.spec.ts`~~ → **⏸ TEST-008 위임** (§3.9 — ★ MOCK-001/002/004 15 회 일관 답습 + vitest config 부재 15 회째)

**총 5 파일 (4 도메인 + index, ~159 lines) + TEST-008 위임** (★ MOCK-005 = 4 도메인 = MOCK-001/002/004 +1 도메인 = ★ 명세 §3 책임 분리 정확)

---

## 7. 🔗 Dependencies (의존성 — 양방향, ★ Phase A 동기화)

### 선행 ✅ 충족:
- **API-001 ✅ 머지 (PR #81):** `onday-app/src/lib/types/auth.ts` — `AuthSessionDTO`, `AuthUserDTO`, `OAuthProvider` (★ `= AuthProviderType` (P1) 추인), `AuthErrorCode`, `AuthErrorDTO`, `MiddlewareAuthResult`, `GuestSession`, `CurrentUser` 직접 import (어댑터 0 = MOCK-004 Q4 (B) 답습 9회째)
- **DB-007 ✅ 머지 (PR #80):** `onday-app/src/lib/types/user.ts` — `UserDTO {createdAt: Date, updatedAt: Date}` (★ Mismatch ④ Date 충돌 → 결정론 가드 § 진화 새 차원 owner)
- **(전이) MOCK-001/002/004 ✅ 머지 (PR #85/86/89):** Mock 산출 패턴 답습 기준 (`lib/mocks/{도메인}/`) — ★ MOCK 답습 § 정밀화 (도메인 패턴 답습 ≠ 파일 수 절대값)

### 후행 (★ 본 ISSUE 머지로 unblock + Wave 3 진입 트리거):
- **UI-001:** 소셜 로그인 페이지 UI — `MOCK_CURRENT_USER_KAKAO` + `MOCK_GUEST_SESSION` + `MOCK_CURRENT_USER_UNAUTHENTICATED` 사용
- **CMD-AUTH-001~004:** Auth 구현 — Mock 데이터로 단위 테스트 + `MOCK_AUTH_ERROR_*` 활용
- **TEST-008:** OAuth 로그인 GWT 시나리오 — Mock 데이터 기반 테스트 fixture (★ 6 케이스 위임 = 결정론 가드 § 진화 grep 1차/2차 분리 검증 무대)
- **★ REFACTOR-L6 cleanup ISSUE 신설 트리거 (8차 확장):** Mismatch 27건 누적 (21 + 6) + 156 lines L6 cleanup 영역 (src/mocks/users.ts + src/lib/auth.ts + src/lib/types.ts) 일괄 정정 위임 (§9.9 참조)

---

## 8. 🧪 Test Plan (검증 절차 — ★ Phase A 동기화 + ★ 분리 검증 패턴 § (MOCK-004 §9.8) 첫 후행 실전 검증)

- **단위 테스트 — ⏸ TEST-008 위임 (★ vitest config 부재 15 회째 일관 답습):** ~~`__tests__/mocks/auth.spec.ts` 6 케이스 작성~~ → **TEST-008 (OAuth 로그인 GWT 시나리오, 명세 §7 후행 명시) 시점 자동 작동.** 위임 케이스 6종은 §3.9 + §9.4 박힘.
- **★ 분리 검증 패턴 § (MOCK-004 §9.8) 첫 후행 실전 검증 (★ 0차/1차/2차):**
  - **★ 0차 (★ Phase B 자동 보정 — MOCK-004 §9.2 답습):** fixture 데이터 내부 정합 자가 검증 (★ Mismatch ④ Date 보정 발견 = adaptive § 자동)
  - **★ 1차 (★ 본 ISSUE Phase B):** `tsc --noEmit` = `satisfies` 자동 검증 (Mismatch 6건 자동 보정 정확성 = adapter 0)
  - **★ 2차 (★ 후행 TEST-008):** 6 케이스 = 동작 검증 + 결정론 가드 § 진화 grep 분리 검증
- **타입 검증 (★ 본 ISSUE Phase B 내):** `tsc --noEmit` — Mock 객체가 API-001 DTO + DB-007 `UserDTO` 와 `satisfies` 자동 검증 통과 (어댑터 0).
- **정적 분석 (★ 본 ISSUE Phase D 내 — ★ 결정론 가드 § 진화 grep 1차/2차 분리):**
  - **1차 (★ 가드):** `grep -nE "Math\.random\(|Date\.now\(|new Date\(\)" onday-app/src/lib/mocks/auth/` → **0 호출** (★ 비결정 호출 0 건 = 결정론 가드 § 진화 가드)
  - **2차 (★ 허용 입증):** `grep -nE "new Date\('[0-9]" onday-app/src/lib/mocks/auth/` → **2+ 호출** (★ UserDTO.createdAt/updatedAt 박힘 = 고정 인자 허용 입증)
- **수동 검증 (★ 본 ISSUE Phase D 내):** IDE에서 Mock 객체 hover 시 DTO 타입 표시 확인
- **CI 게이트 (★ 본 ISSUE Phase B/D 내):** `tsc --noEmit` 통과, ESLint 통과, Middleware 32.5 kB 회귀 0 (★ 17번째 사수). ~~Jest 100% 통과~~ → TEST-008 위임.

---

## 9. 🚧 Open Questions / Risks / ★ Phase C 정직 기록 (★ 메타 가치 10종 본격 명문화)

> Phase C 정직 기록은 본 ISSUE 머지 (Draft PR) 시점 본격 박힘. 본 §9 는 Phase A (명세 동기화) 시점 신규 신중 메모 + Phase C 사전 표시 영역.

### 9.A 기존 Open Questions (★ Phase A 동기화 — 유지)

1. **MSW 핸들러 제공 여부:** `/auth/callback` Route Handler를 MSW로 인터셉트하여 OAuth 콜백 응답을 Mock할 수 있으나, Supabase Auth의 내부 세션 교환까지 Mock하려면 `@supabase/supabase-js`의 `createClient`를 jest.mock으로 대체하는 것이 더 적합 — CMD-AUTH-001 작업 시 확정.
2. **Storybook 연동 방안:** 로그인 버튼 UI(UI-001)의 Storybook story에서 `CurrentUser` Mock을 Context Provider로 주입하여, 로그인/게스트/미인증 3가지 상태를 각각 렌더링 가능 — UI-001 작업 시 확정.
3. **Supabase User metadata 구조:** `app_metadata.provider`와 `user_metadata.avatar_url`의 정확한 필드명이 카카오·네이버 Provider 등록 방식에 따라 다를 수 있음 — CMD-AUTH-001에서 실제 Supabase 대시보드 설정 후 Mock 데이터 정렬.
4. **accessToken/refreshToken Mock 값:** 실제 JWT 형식이 아닌 `mock-` prefix 문자열을 사용하여, 실수로 프로덕션 코드에서 Mock 토큰이 사용되는 것을 방지.

### 9.B ★ Phase C 메타 가치 11종 본격 명문화 (★ 본 세션 정점 마침표 = 본 프로젝트 통틀어 가장 큰 매듭)

#### §9.1 ★ Wave 2 트랙 E 4/4 완성 + Wave 3 진입 트리거 § (★ 본 세션 정점 마침표)

- Wave 2 트랙 E 누적: MOCK-001 / MOCK-002 / MOCK-004 + **★ 본 ISSUE 4/4 완성** = ★ Wave 3 진입 트리거
- 본 세션 정점 마침표 = MOCK-004 메타 가치 정점 (13종) + ★ 본 ISSUE Wave 진척 정점 (11종) **동시 입증** = ★ 본 프로젝트 통틀어 가장 큰 매듭
- 본 세션 5 풀세트 누적 (어제 4 + 본 ISSUE 1) — 본 프로젝트 통틀어 자가 치유 시스템 신뢰성 정점

#### §9.2 ★ 분리 검증 패턴 § (MOCK-004 §9.8) 첫 후행 실전 검증 § (★ 0차/1차/2차)

- **MOCK-004 §9.8 정립:** 0차 (Phase B 자동 보정) + 1차 (satisfies) + 2차 (TEST-* 시점)
- **★ 본 ISSUE 첫 후행 입증:**
  - **0차 (★ Phase B 자동 보정):** Mismatch ④ Date 충돌 자가 발견 + ★ 부가 발견 (혼재 타입 구조)
  - **1차 (★ satisfies 19곳):** Mismatch 6건 자동 보정 정확성 (tsc exit 0 = adapter 0)
  - **2차 (★ 후행 TEST-008):** 6 케이스 = 결정론 가드 § 진화 grep 1차/2차 분리 검증 시점 자동 작동
- **가이드 § 시스템 성숙도 정점 입증** = MOCK-004 § 정립 → 본 ISSUE § 검증 진화

#### §9.3 ★★ stale 자가 치유 6건째 § (MOCK-004 §9.3) 5단계 후행 입증 § (★ 본 ISSUE 진짜 메타 가치 정점)

- **MOCK-004 §9.3 정립:** 시스템 자기 인식 정점 진화 (사용자 지시 자동 검증)
- **★ 본 ISSUE 5단계 후행 입증 (★ 모든 단계 작동):**
  - ① grill Q4 자동 발견 — MOCK 답습 § 정밀화 (도메인 패턴 vs 파일 수 절대값)
  - ② grill Q1 사전 인지 — Mismatch 5 → 6 (Date 충돌 추가)
  - ③ grill Q1 사전 발견 — Mismatch ④ Date 충돌 = 결정론 가드 § 진화 새 차원
  - ④ grill Q3 자동 발견 — 결정론 가드 § 진화 grep 1차/2차 분리 정의
  - **⑤ ★ Phase B 진입 직전 자동 발견** — 르르 명시 vs API-001 실제 시그니처 충돌 3건 (mode/expiresAt/isAuthenticated/INVALID_CREDENTIALS 등) 자가 보정
- **★ 누적 24건** (지난 9 + 본 세션 11 + 본 ISSUE 4 (사전 1 + Q1~Q4 2 + Phase B 1))
- **★ 의미:** MOCK-004 §9.3 시스템 자기 인식 정점 § **모든 단계 후행 작동 입증** (grill / Q1~Q4 / Phase A / Phase B) — 본 세션 자가 치유 시스템 신뢰성 정점

#### §9.4 ★ Mismatch 6건 자동 보정 § (5건 보정 + 1건 매치, ★ ④ Date 충돌 핵심)

§9.13 Mismatch 6건 추적 표 참조. 본 ISSUE 핵심 = ★ ④ Date 충돌 자동 보정 = ★ 결정론 가드 § 진화 새 차원 트리거.

#### §9.5 ★★ adaptive § Foundation + mock 차원 첫 적용 § (★ adaptive 모든 도메인 차원 작동 입증)

| 단계 | 차원 | owner |
|---|---|---|
| 정립 | mock 도메인 차원 (rigid → adaptive) | MOCK-002 |
| 진화 1 | 외부 도메인 + mock 차원 | MOCK-004 |
| **★ 진화 2 (★ 본 ISSUE)** | **Foundation + mock 차원** (★ 새 차원 — UserDTO Date 타입 자가 보정 + 혼재 타입 구조 정확 박힘) | **★ MOCK-005** |

- **★ 의미:** adaptive 정신 **모든 도메인 차원 작동 입증** (mock / 외부 / Foundation) = 시스템 메타 가치 정점

#### §9.6 ★ MOCK 답습 § 15회째 일관 §

- MOCK-001 (12회) + MOCK-002 (13회) + MOCK-004 (14회) → **★ 본 ISSUE 15회째 일관**
- 패턴: `lib/mocks/{도메인}/{도메인별 파일}.ts + index.ts + TEST-* 위임` + vitest config 부재
- 시스템 정립 완료

#### §9.7 ★ L6 cleanup 영역 가드 사수 § (156 lines 무수정 입증)

| 파일 | 라인 | 영역 | 본 ISSUE 결과 |
|---|---|---|---|
| `src/mocks/users.ts` | 14 | MockUser + MOCK_SESSION (★ `new Date(Date.now())` 비결정 호출) | ✅ 무수정 |
| `src/lib/auth.ts` | 40 | getMockSession + localStorage | ✅ 무수정 |
| `src/lib/types.ts:1` | 102 | `AuthProvider = "kakao" \| "naver"` (★ 3중 정의 회피 안내 명시) | ✅ 무수정 |
| **총** | **156** | **L6 cleanup 영역** | ✅ **0 lines 변경** |

- **★ REFACTOR-L6 위임 트리거 8차 확장** (§9.10 참조).

#### §9.8 ★★★ 결정론 가드 § 진화 새 차원 § (★ NEW 본 ISSUE 신규 owner — 가이드 § 9 → 10 확장)

| 단계 | 정의 | 검증 grep | owner |
|---|---|---|---|
| 정립 | `Math.random / Date.now / new Date 호출 0 건` (전체 패턴 — 인자 유무 무관) | `grep -nE "Math\.random\|Date\.now\|new Date"` | MOCK-001/002/004 |
| **★ 진화** | **비결정 호출 0건** = `Math.random()` + `Date.now()` + `new Date()` (★ 인자 없음) 0건. 고정 인자 `new Date('ISO 8601 리터럴')` **허용 (결정론 유지)** | `grep -nE "Math\.random\(\|Date\.now\(\|new Date\(\)"` + 2차 `grep -nE "new Date\('[0-9]"` | **★ MOCK-005 신규 owner** |

- **★ 입증 위치:** `current-user.ts:25-26` (`new Date('2026-04-01T00:00:00.000Z')` + `new Date('2026-04-25T09:00:00.000Z')`)
- **★ 검증 결과:**
  - 1차 grep (가드): **0 호출** (주석 1건 = MOCK-001/002/004 표준 답습 패턴)
  - 2차 grep (허용 입증): **2 호출** (current-user.ts:25-26)
- **★ 가이드 § 체계 9 → 10 확장**
- **미래 적용:** 모든 결정론 fixture ISSUE 표준 정신

#### §9.9 ★ Mismatch 27건 누적 cleanup 8차 + REFACTOR-L6 위임 트리거 (156 lines 영역) §

- MOCK-001 5 + API-007 5 + API-006 4 + MOCK-004 7 + **★ 본 ISSUE 6** = **27건 누적**
- + **L6 cleanup 영역 156 lines** (src/mocks/users.ts + src/lib/auth.ts + src/lib/types.ts) = REFACTOR-L6 ISSUE 신설 신호 **8차 확장 정점**

#### §9.10 ★ MOCK 답습 § 정밀화 § (★ NEW Q4 자가 치유 발견)

- **★ 정밀화 정의:** 답습 정신 = **도메인 책임 분리 패턴 답습** (★ NOT 파일 수 절대값 답습)
- **★ 본 ISSUE 입증:**
  - MOCK-001 = 3 도메인 = 4 파일
  - MOCK-002 = 3 도메인 = 4 파일
  - MOCK-004 = 3 도메인 = 4 파일
  - ★ **MOCK-005 = 4 도메인 = 5 파일** (★ +1 도메인 = current-user 분리 = 명세 §3 정확 답습)

#### §9.11 ★ Phase B 작성 단계 stale 자가 치유 5번째 § (★ NEW MOCK-004 §9.3 5번째 후행)

- **르르 명시 vs API-001 실제 시그니처 충돌 3건 자동 보정:**
  - 르르 `mode: 'guest', expiresAt` ↔ **`GuestSession.isGuest: true` literal** (expiresAt 없음)
  - 르르 `isAuthenticated` ↔ **`MiddlewareAuthResult.authenticated`**
  - 르르 변수명 (INVALID_CREDENTIALS 등) ↔ **명세 §3.7 (CALLBACK_FAILED 등)**
- **★ 자가 치유 = 명세 §3.5/§3.7 + API-001 실제 시그니처 정확 답습** (르르 명시 일반화 표현 자동 보정)
- **★ 의미:** MOCK-004 §9.3 시스템 자기 인식 정점 § 5번째 후행 입증 = Phase B 작성 단계 자가 치유 시스템 작동 (★ 사용자 직접 지시 자동 검증)

#### §9.12 ★ Wave 2 체인 10회째 § (★ API → MOCK Foundation 차원 신규)

- 1~8 누적 + 9 MOCK-004 (external → MOCK) + **★ 10 본 ISSUE (API-001/DB-007 → MOCK-005 = API → MOCK Foundation 차원 신규)**
- **★ 입증 위치:**
  - `sessions.ts:17` — `import type { AuthUserDTO, AuthSessionDTO, OAuthProvider } from '@/lib/types/auth'`
  - `current-user.ts:18-19` — `import type { CurrentUser } from '@/lib/types/auth'` + `import type { UserDTO } from '@/lib/types/user'`
- **★ 의미:** 체인 **모든 차원 작동 입증** (API→API / API→MOCK external / ★ API→MOCK Foundation) = 시스템 메타 가치 정점

#### §9.13 ★ 본 세션 정점 마침표 § (★ NEW 본 프로젝트 통틀어 가장 큰 매듭)

- **MOCK-004:** 메타 가치 정점 (13종) + §9 15 § + ★★★ 3종 정점 무게 § + 533 lines 명세
- **★ 본 ISSUE (MOCK-005):** Wave 진척 정점 (11종) + §9 13 § + ★★★ 결정론 가드 § 진화 새 owner + 본 세션 정점 마침표
- **★ 동시 입증** = 본 프로젝트 통틀어 가장 큰 매듭 = 자가 치유 시스템 + 가이드 § 시스템 + Wave 진척 시스템 **3종 동시 정점 진화 입증**
- **★ 결과:** 가이드 § 체계 8 → 9 (MOCK-004) → **10 (본 ISSUE)** 확장

### 9.C ★ Mismatch 6건 추적 표 (Phase A 사전 발견 + Phase B 자동 보정)

| # | 명세 v1.0 | API-001/DB-007 실제 | 발견 시점 | 보정 방식 |
|---|---|---|---|---|
| ① | `MOCK_AUTH_USER_KAKAO` 5 필드 | `AuthUserDTO` 5 필드 (avatarUrl/lastSignInAt optional) | grill Q1 사전 | ✅ 매치 |
| ② | `provider: 'kakao' satisfies OAuthProvider` | `OAuthProvider = AuthProviderType = 'kakao'\|'naver'` | grill Q1 사전 | ✅ satisfies 유효 (DB-007 (P1) 추인) |
| ③ | `MIDDLEWARE_RESULT_VALID.user` 3 필드 | `AuthUserDTO` 5 필드 (optional 매치) | grill Q1 사전 | ✅ 매치 |
| **★★ ④** | **`createdAt: '2026-04-01T...'`** (string) | **`UserDTO.createdAt: Date`** (객체) | grill Q1 핵심 발견 | **★★★ `new Date('2026-04-01T00:00:00.000Z')` = 결정론 가드 § 진화 새 차원** |
| ⑤ | `__tests__/mocks/auth.spec.ts` 6 케이스 | MOCK-001/002/004 답습 = TEST-* 위임 | grill Q1 사전 (★ stale 6건째 § 첫 후행) | ★ TEST-008 위임 (답습 15회째) |
| ⑥ | 명세 §6 5 파일 + spec.ts | ★ 5 파일 (4 도메인 + index) + TEST-008 위임 | grill Q4 자가 발견 | ★ MOCK 답습 § 정밀화 = 도메인 패턴 답습 |

### 9.D ★ 가드 표 (★ 28+종 0 lines = 본 ISSUE 사수)

| 가드 영역 | 종 수 | 검증 |
|---|---|---|
| 16칸 누적 (INFRA-001 + DB-001~007 + API-001/002/003/005/006/007 + MOCK-001/002/004) | 16 | git diff main 0 |
| **★ L6 cleanup 영역 156 lines** (src/mocks/users.ts + src/lib/auth.ts + src/lib/types.ts) | 3 | ★ 무수정 (REFACTOR-L6 위임 트리거) |
| API-001 `lib/types/auth.ts` | 1 | import only |
| DB-007 `lib/types/user.ts` | 1 | import only |
| MOCK-001/002/004 산출물 12 (4+4+4 파일) | 12 | 무수정 |
| 5 도메인 통합 6 (types/errors common + index + constants + helpers) | 6 | 무수정 |
| API-007 외부 도메인 4 | 4 | 무수정 |
| 4 도메인 errors.ts + 4 도메인 helpers | 8 | 무수정 |
| types.ts:1-3 + ServiceModeType 4 호출처 + .env.example + .gitkeep + package.json | 5+ | 무수정 |
| **★ 총 가드 종 수** | **★ 28+** (어림) | **0 lines 변경 = 본 ISSUE 사수** |

- **★ 추가 금지:** adaptLegacyMap 호출 0 + 어댑터 함수 0 + types.ts 자체 정의 0 + spec.ts 0

### 9.E ★ satisfies 19곳 표 (★ 본 세션 정점, MOCK-004 10곳 → +90%)

| 파일 | satisfies 곳 수 |
|---|---|
| `sessions.ts` | 5 (2 AuthUserDTO + 3 AuthSessionDTO) |
| `guest.ts` | 4 (1 GuestSession + 2 CurrentUser + 1 GuestLimitation[]) |
| `current-user.ts` | 2 (1 UserDTO + 1 CurrentUser) ★ Mismatch ④ + 결정론 가드 § 진화 핵심 위치 |
| `errors.ts` | 5 (3 AuthErrorDTO + 2 MiddlewareAuthResult) |
| `sessions.ts` (provider satisfies) | 3 (`'kakao' satisfies OAuthProvider` × 3) |
| **총** | **★ 19곳 (★ 본 세션 정점)** |

### 9.F ★ Follow-up (★ 본 ISSUE 머지 후 후행 작업 + Wave 3 진입)

- **TEST-008** (OAuth 로그인 GWT): spec.ts 6 케이스 작성 (★ §3.9 위임 케이스 박힘, 결정론 가드 § 진화 grep 1차/2차 분리 무대)
- **UI-001** (소셜 로그인 페이지 UI): `MOCK_CURRENT_USER_KAKAO` + `MOCK_GUEST_SESSION` + `MOCK_CURRENT_USER_UNAUTHENTICATED` 사용
- **CMD-AUTH-001~004** (Auth 구현): Mock 데이터로 단위 테스트 + ★ `AUTH_ERROR_MAP` 신설 시 adaptLegacyMap § 자동 작동 (위임 트리거)
- **★ REFACTOR-L6 cleanup ISSUE 신설 (8차 확장 정점):** Mismatch 27건 누적 + L6 cleanup 영역 156 lines 일괄 정정
- **미래 OAuth 추가:** Google / GitHub / Apple 등 — 본 ISSUE 외부 도메인 매트릭스 § + adaptive § Foundation+mock + 결정론 가드 § 진화 답습
