---
name: Feature Task
title: "[Feature] CMD-AUTH-004: OAuth 장애 시 게스트 임시 체험 모드 전환 로직"
labels: ['feature', 'priority:L', 'epic:Auth', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-AUTH-004] OAuth 장애 시 게스트 임시 체험 모드 전환 로직
- **목적 (Why):**
  - **비즈니스:** 카카오·네이버 OAuth Provider 장애 시에도 서비스를 완전히 중단하지 않고, 제한된 기능으로 체험할 수 있게 하여 사용자 이탈을 방지한다.
  - **사용자 가치:** OAuth 로그인 실패 시 "게스트 모드로 체험하기" 옵션을 제공하여, 핵심 진단 기능을 즉시 체험하고 이후 로그인하여 결과를 저장할 수 있다.
- **범위 (What):**
  - ✅ 만드는 것: OAuth 실패 감지 로직, 게스트 세션 생성·관리, 게스트 모드 UI 안내, 기능 제한 적용, 게스트→인증 전환 플로우
  - ❌ 만들지 않는 것: OAuth 로그인 구현(CMD-AUTH-001/002), 세션 전략(CMD-AUTH-003), 결제 관련 코드, NextAuth.js 관련 코드
- **복잡도:** L
- **Wave:** 3 (Auth 구현 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **EXT-07 우회 전략** (§3.1.1): "OAuth Provider — 장애 시 로컬 게스트 임시 체험 모드로 전환"
- **REQ-FUNC-029** (§4.1.6): "시스템은 Supabase Auth(@supabase/ssr)를 사용하여 카카오·네이버 소셜 로그인을 지원해야 한다."
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용."
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (커스텀 슬랙 임계치 제거)"

### §3.1.1 외부 시스템 장애 시 우회 설계 원칙

> "단순화 최우선: 복잡한 서버 자동 폴백과 캐시 DB 파이프라인을 MVP에서는 제외합니다."
> "Graceful Degradation: 핵심 기능(지도API) 외 외부 데이터가 누락되더라도 서비스를 숏다운하지 않고 진행하게 만듭니다."

### 선행 태스크 산출물 (배치 1·2 정의 타입 재사용)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| API-001 | GuestSession | `@/lib/types/auth` | 게스트 세션 타입 그대로 사용 |
| API-001 | GuestLimitation | `@/lib/types/auth` | 기능 제한 목록 타입 |
| API-001 | CurrentUser | `@/lib/types/auth` | `{ type: 'guest', session: GuestSession }` 분기 사용 |
| API-001 | AuthErrorCode | `@/lib/types/auth` | `GUEST_MODE_ACTIVATED` 코드 사용 |
| CMD-AUTH-001 | `/auth/callback` Route Handler | — | OAuth 실패 감지 경로 |
| CMD-AUTH-003 | getCurrentUser | `@/lib/auth/session` | 게스트 모드 분기 추가 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/auth/guest.ts`에 게스트 세션 생성·관리 함수 작성
  ```typescript
  import type { GuestSession, GuestLimitation } from '@/lib/types/auth';

  const GUEST_LIMITATIONS: GuestLimitation[] = ['no_save', 'no_share', 'no_history'];

  export function createGuestSession(): GuestSession {
    return {
      isGuest: true,
      guestId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      limitations: GUEST_LIMITATIONS,
    };
  }

  export function getGuestSession(): GuestSession | null {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem('guest_session');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as GuestSession;
    } catch {
      return null;
    }
  }

  export function saveGuestSession(session: GuestSession): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('guest_session', JSON.stringify(session));
  }

  export function clearGuestSession(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('guest_session');
  }

  export function isGuestLimited(
    limitation: GuestLimitation,
    session: GuestSession
  ): boolean {
    return session.limitations.includes(limitation);
  }
  ```

- [ ] **3.2** `lib/auth/guest-mode-detector.ts`에 OAuth 장애 감지 로직 작성
  ```typescript
  import * as Sentry from '@sentry/nextjs';
  import { AuthErrorCode } from '@/lib/types/auth';

  /** OAuth 콜백 실패를 감지하여 게스트 모드 안내 여부를 결정 */
  export function shouldOfferGuestMode(errorCode: string | null): boolean {
    if (!errorCode) return false;
    const oauthErrors: string[] = [
      AuthErrorCode.OAUTH_CALLBACK_FAILED,
      AuthErrorCode.OAUTH_PROVIDER_ERROR,
    ];
    return oauthErrors.includes(errorCode);
  }

  /** 로그인 페이지에서 error query param 기반으로 게스트 모드 안내 표시 여부 결정 */
  export function getGuestModeMessage(errorCode: string | null): string | null {
    if (!shouldOfferGuestMode(errorCode)) return null;
    return '소셜 로그인에 일시적 장애가 있습니다. 게스트 모드로 체험하시겠습니까?';
  }
  ```

- [ ] **3.3** `app/(auth)/login/guest-mode-banner.tsx`에 게스트 모드 안내 Client Component 작성
  ```typescript
  'use client';
  import { useSearchParams, useRouter } from 'next/navigation';
  import { createGuestSession, saveGuestSession } from '@/lib/auth/guest';
  import { shouldOfferGuestMode, getGuestModeMessage } from '@/lib/auth/guest-mode-detector';
  import * as Sentry from '@sentry/nextjs';
  import { AuthErrorCode } from '@/lib/types/auth';

  export function GuestModeBanner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const errorCode = searchParams.get('error');
    const message = getGuestModeMessage(errorCode);

    if (!message) return null;

    const handleGuestMode = () => {
      const session = createGuestSession();
      saveGuestSession(session);
      Sentry.captureMessage('Guest mode activated due to OAuth failure', {
        tags: { domain: 'auth', task: 'CMD-AUTH-004' },
        extra: { errorCode, guestId: session.guestId },
      });
      router.push('/');
    };

    return (
      <div id="guest-mode-banner" role="alert">
        <p>{message}</p>
        <p>※ 게스트 모드에서는 진단 결과 저장, 공유 링크 생성, 이전 조건 불러오기가 제한됩니다.</p>
        <button onClick={handleGuestMode} id="guest-mode-btn">
          게스트로 체험하기
        </button>
        <button onClick={() => router.push('/login')} id="retry-login-btn">
          다시 로그인 시도
        </button>
      </div>
    );
  }
  ```

- [ ] **3.4** `lib/auth/session.ts` 확장 — `getCurrentUser()`에 게스트 모드 분기 추가
  ```typescript
  // getCurrentUser() 내부에 추가:
  // 서버 사이드에서는 게스트 세션을 확인하지 않음 (sessionStorage는 클라이언트 전용)
  // 클라이언트 사이드 유틸리티로 별도 제공

  // lib/auth/session-client.ts (새 파일)
  'use client';
  import { getGuestSession } from '@/lib/auth/guest';
  import type { CurrentUser } from '@/lib/types/auth';

  export function getClientCurrentUser(
    serverUser: CurrentUser
  ): CurrentUser {
    if (serverUser.type === 'authenticated') return serverUser;

    const guestSession = getGuestSession();
    if (guestSession) {
      return { type: 'guest', session: guestSession };
    }

    return { type: 'unauthenticated' };
  }
  ```

- [ ] **3.5** `lib/hooks/use-current-user.ts`에 React Hook 작성
  ```typescript
  'use client';
  import { useState, useEffect } from 'react';
  import { getGuestSession } from '@/lib/auth/guest';
  import type { CurrentUser } from '@/lib/types/auth';

  export function useCurrentUser(serverUser: CurrentUser): CurrentUser {
    const [user, setUser] = useState<CurrentUser>(serverUser);

    useEffect(() => {
      if (serverUser.type === 'authenticated') {
        setUser(serverUser);
        return;
      }

      const guestSession = getGuestSession();
      if (guestSession) {
        setUser({ type: 'guest', session: guestSession });
      }
    }, [serverUser]);

    return user;
  }
  ```

- [ ] **3.6** `lib/auth/guest-guard.ts`에 게스트 모드 기능 제한 가드 유틸리티 작성
  ```typescript
  import type { CurrentUser, GuestLimitation } from '@/lib/types/auth';

  export function assertNotGuest(
    user: CurrentUser,
    action: GuestLimitation
  ): void {
    if (user.type === 'guest' && user.session.limitations.includes(action)) {
      throw new Error(
        `게스트 모드에서는 이 기능을 사용할 수 없습니다. 로그인 후 이용해 주세요.`
      );
    }
  }

  export function canPerformAction(
    user: CurrentUser,
    action: GuestLimitation
  ): boolean {
    if (user.type !== 'guest') return true;
    return !user.session.limitations.includes(action);
  }
  ```

- [ ] **3.7** `__tests__/auth/guest.spec.ts`에 게스트 세션 단위 테스트
  ```typescript
  describe('게스트 세션 관리', () => {
    it('createGuestSession은 유효한 UUID guestId를 생성', () => { /* ... */ });
    it('createGuestSession의 limitations에 no_save, no_share, no_history 포함', () => { /* ... */ });
    it('saveGuestSession 후 getGuestSession으로 복원 가능', () => { /* ... */ });
    it('clearGuestSession 후 getGuestSession이 null 반환', () => { /* ... */ });
    it('isGuestLimited가 제한 항목을 올바르게 판별', () => { /* ... */ });
  });
  ```

- [ ] **3.8** `__tests__/auth/guest-mode-detector.spec.ts`에 장애 감지 테스트
  ```typescript
  describe('OAuth 장애 감지', () => {
    it('OAUTH_CALLBACK_FAILED 에러 시 게스트 모드 안내 true', () => { /* ... */ });
    it('OAUTH_PROVIDER_ERROR 에러 시 게스트 모드 안내 true', () => { /* ... */ });
    it('SESSION_EXPIRED 에러 시 게스트 모드 안내 false', () => { /* ... */ });
    it('null 에러 시 게스트 모드 안내 false', () => { /* ... */ });
  });
  ```

- [ ] **3.9** `__tests__/auth/guest-guard.spec.ts`에 기능 제한 가드 테스트
  ```typescript
  describe('게스트 모드 기능 제한 가드', () => {
    it('게스트 사용자의 no_save 액션 시 assertNotGuest throw', () => { /* ... */ });
    it('인증된 사용자는 모든 액션 허용', () => { /* ... */ });
    it('canPerformAction이 게스트 제한 항목에 false 반환', () => { /* ... */ });
  });
  ```

- [ ] **3.10** `__tests__/components/guest-mode-banner.spec.tsx`에 배너 컴포넌트 테스트
  ```typescript
  describe('GuestModeBanner', () => {
    it('OAuth 에러 query param이 있으면 배너 표시', () => { /* ... */ });
    it('에러 없으면 배너 미표시', () => { /* ... */ });
    it('게스트 체험 버튼 클릭 시 sessionStorage에 게스트 세션 저장 + / 리디렉트', () => { /* ... */ });
    it('다시 로그인 버튼 클릭 시 /login 리디렉트', () => { /* ... */ });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** OAuth 장애 시 게스트 모드 전환 성공
- **Given** 카카오 OAuth Provider 장애로 `/login?error=AUTH_OAUTH_CALLBACK_FAILED`로 리디렉트된 상태
- **When** 사용자가 "게스트로 체험하기" 버튼 클릭
- **Then** `sessionStorage`에 `guest_session` 키로 `GuestSession` 저장, `guestId`가 유효한 UUID, `limitations`에 `['no_save', 'no_share', 'no_history']` 포함, 메인 페이지로 리디렉트

**AC-2 (예외):** 게스트 모드에서 저장 기능 차단
- **Given** 게스트 모드로 진단을 완료한 상태
- **When** 진단 결과 저장 시도 (Server Action 호출 전 클라이언트 가드)
- **Then** `assertNotGuest(user, 'no_save')` 에러 발생, "게스트 모드에서는 이 기능을 사용할 수 없습니다. 로그인 후 이용해 주세요." 안내 표시

**AC-3 (예외):** 게스트 모드에서 공유 링크 생성 차단
- **Given** 게스트 모드 상태
- **When** 공유 링크 생성 시도
- **Then** `canPerformAction(user, 'no_share')` 반환값 `false`, 공유 기능 비활성화 + 로그인 유도 안내

**AC-4 (보안):** 게스트 세션은 탭 종료 시 소멸
- **Given** 게스트 모드로 서비스를 사용 중
- **When** 브라우저 탭을 닫고 새 탭에서 서비스 재접속
- **Then** `sessionStorage`가 초기화되어 `getGuestSession()` 반환값 `null`, 게스트 세션 소멸

**AC-5 (경계):** 게스트→인증 전환 시 게스트 세션 삭제
- **Given** 게스트 모드로 서비스를 사용 중
- **When** OAuth 로그인 성공
- **Then** `clearGuestSession()` 호출로 `sessionStorage` 에서 게스트 세션 삭제, `getCurrentUser()` 반환값 `type: 'authenticated'`

**AC-6 (보안):** Sentry에 게스트 모드 전환 이벤트 기록
- **Given** OAuth 장애로 게스트 모드 전환
- **When** "게스트로 체험하기" 버튼 클릭
- **Then** `Sentry.captureMessage('Guest mode activated due to OAuth failure', { tags: { domain: 'auth', task: 'CMD-AUTH-004' } })` 호출

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용." (§4.2.3) | 게스트 세션은 sessionStorage에만 저장하고 httpOnly cookie에는 포함하지 않음을 확인. 게스트 guestId가 서버에 전송되지 않음을 네트워크 탭에서 검증 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 게스트 모드 전환 시 Sentry.captureMessage 호출, OAuth 에러 발생 시 Sentry.captureException 호출을 Jest mock으로 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/auth/guest.ts` (createGuestSession, getGuestSession, saveGuestSession, clearGuestSession, isGuestLimited)
- `lib/auth/guest-mode-detector.ts` (shouldOfferGuestMode, getGuestModeMessage)
- `lib/auth/guest-guard.ts` (assertNotGuest, canPerformAction)
- `lib/auth/session-client.ts` (getClientCurrentUser — 클라이언트 전용)
- `lib/hooks/use-current-user.ts` (useCurrentUser React Hook)
- `app/(auth)/login/guest-mode-banner.tsx` (게스트 모드 안내 배너)
- `__tests__/auth/guest.spec.ts`
- `__tests__/auth/guest-mode-detector.spec.ts`
- `__tests__/auth/guest-guard.spec.ts`
- `__tests__/components/guest-mode-banner.spec.tsx`

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:

- **CMD-AUTH-001:** `/auth/callback` Route Handler에서 OAuth 실패 시 `/login?error=...` 리디렉트 패턴
- **API-001:** `GuestSession`, `GuestLimitation`, `CurrentUser` 타입 정의, `AuthErrorCode.GUEST_MODE_ACTIVATED`
- **CMD-AUTH-003:** `getCurrentUser()` 함수 — 게스트 분기 추가 기반

### 후행:

- **UI-001:** 소셜 로그인 페이지 UI — GuestModeBanner 컴포넌트 포함
- **CMD-DIAG-002:** 진단 로직에서 `canPerformAction` 가드 활용
- **TEST-008:** OAuth 로그인 GWT 시나리오 — 게스트 모드 전환 테스트

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/auth/guest.spec.ts` — 5개 케이스
- **단위 테스트:** `__tests__/auth/guest-mode-detector.spec.ts` — 4개 케이스
- **단위 테스트:** `__tests__/auth/guest-guard.spec.ts` — 3개 케이스
- **컴포넌트 테스트:** `__tests__/components/guest-mode-banner.spec.tsx` — 4개 케이스
- **수동 검증:**
  1. 로그인 실패 시 게스트 모드 배너가 표시되는지 확인
  2. 게스트 모드에서 진단 실행 → 저장 시도 시 제한 안내 확인
  3. 탭 닫기 후 재접속 시 게스트 세션 소멸 확인
  4. 게스트 모드에서 로그인 성공 시 게스트 세션 삭제 확인
- **CI 게이트:** `tsc --noEmit` 통과, Jest 테스트 100% 통과, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **sessionStorage vs localStorage 트레이드오프:** `sessionStorage`는 탭 종료 시 소멸하여 보안상 유리하지만, 새 탭에서 게스트 세션이 유지되지 않음. MVP에서는 `sessionStorage` 사용 (보안 우선). 사용자 피드백에 따라 `localStorage` + 만료 시간 방식으로 변경 가능.
2. **게스트 모드 진단 결과 보존:** 게스트 모드에서 진단 결과를 메모리에만 유지하면 새로고침 시 소멸. 게스트 진단 결과를 `sessionStorage`에 임시 저장하는 방안 — CMD-DIAG 구현 시 확정.
3. **OAuth Provider 장애 감지 정확도:** 현재는 OAuth 콜백 실패(`/login?error=...`)만으로 감지. Sentry 에러 임계치 기반 자동 감지는 MVP에서는 구현하지 않음. 수동으로 Sentry 대시보드에서 auth 에러 급증을 모니터링.
4. **게스트→인증 전환 시 진단 결과 마이그레이션:** 게스트 모드에서 생성한 진단 결과를 로그인 후 사용자 계정으로 이전하는 로직 — MVP에서는 미구현. "로그인 후 다시 진단해 주세요" 안내로 대체.
