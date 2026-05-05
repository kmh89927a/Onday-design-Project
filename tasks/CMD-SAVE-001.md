---
name: Feature Task
title: "[Feature] CMD-SAVE-001: 입력값 자동 저장 — saveSearch Server Action (best effort UPSERT)"
labels: ['feature', 'priority:M', 'epic:SavedSearch', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-SAVE-001] 입력값 자동 저장 — saveSearch Server Action (세션 종료/앱 종료 시 best effort UPSERT)
- **목적 (Why):**
  - **비즈니스:** 반복 이사자(C-04)가 매 이사 건마다 주소·필터를 원점에서 재입력하는 비용(평균 3주)을 제거하여, 다음 방문 시 1초 이내 이전 조건을 복원·재진단할 수 있게 한다.
  - **사용자 가치:** 세션 종료/앱 종료 시 입력 조건이 자동 저장되며, 저장 실패해도 사용자에게 알리지 않아 주 흐름을 전혀 차단하지 않는다.
- **범위 (What):**
  - ✅ 만드는 것: `saveSearch` Server Action ('use server'), Prisma UPSERT (userId 기준), best effort 에러 처리 (catch → Sentry만), 클라이언트 호출 Hook (beforeunload + 디바운스 5초)
  - ❌ 만들지 않는 것: 저장된 조건 불러오기(QRY-SAVE-001), 재계산 로직, 비교 뷰, replaySearch API, 결제 관련 코드
- **복잡도:** M
- **Wave:** 4 (SavedSearch 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-025** (§4.1.5): "시스템은 사용자가 진단을 완료하고 세션 종료 또는 앱 종료 시 입력 조건(주소·필터·시간대)을 자동 저장해야 한다. 저장은 best effort로 처리하며 실패 시 사용자에게 알리지 않는다. 다음 방문 시 복원 시간은 1초 이내여야 하며, 불러온 주소가 geocoding 실패 시 \"주소를 다시 입력해주세요\" 안내를 표시한다."
- **REQ-NF-016** (§4.2.2): "입력값 자동 저장 성공률 — Best effort (저장 실패 시 무시, 사용자 미통지)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (커스텀 슬랙 임계치 제거)"

### 시퀀스 다이어그램 (§6.3.5 간이 저장·불러오기 — 저장 부분)

- **참여 Actor:** 반복 이사자(C-04), Next.js Client Component, Server Action, Prisma ORM
- **핵심 메시지:**
  ```
  User→Web: 진단 완료 후 세션 종료
  Web→SA: saveSearch(searchParams)
  SA→Prisma: SavedSearch UPSERT (user_id 기준, best effort)
  alt 저장 성공: SA→Web: 저장 확인
  else 저장 실패: Note: 실패 무시 (사용자 미통지, best effort)
  ```

### ERD 컬럼 (§6.2.5 SAVED_SEARCH — Rev 1.5 단순화)

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `user_id` | UUID | FK → USER.id, PK (UNIQUE) | 저장 사용자 (사용자당 1건) |
| `search_params` | JSONB | NOT NULL | 저장된 검색 조건 (주소·필터·시간대 등) |
| `saved_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 저장일시 |

### 선행 태스크 산출물 (배치 1~11)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-006 | `model SavedSearch` (Prisma 스키마), `SavedSearchDTO`, `SearchParams` 타입, `searchParamsSchema` (Zod) | `@prisma/client`, `@/lib/types/saved-search`, `@/lib/validators/saved-search` | UPSERT 대상 모델 + 입력 유효성 검증 |
| API-005 | `SaveSearchRequest`, `SaveSearchResponse`, `SavedSearchErrorCode`, `saveSearchRequestSchema` (Zod) | `@/lib/types/saved-search-api`, `@/lib/validators/saved-search-api` | Server Action 입출력 DTO |
| CMD-AUTH-003 | `getCurrentUser`, `requireAuth` | `@/lib/auth/session` | 인증 검증 (게스트 skip) |
| MON-001 | `reportErrorToSentry` (Sentry 통합) | `@sentry/nextjs` | best effort 에러 기록 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `app/actions/save-search.ts`에 `saveSearch` Server Action 구현
  ```typescript
  'use server';
  import { prisma } from '@/lib/prisma';
  import { getCurrentUser } from '@/lib/auth/session';
  import { saveSearchRequestSchema } from '@/lib/validators/saved-search-api';
  import type { SaveSearchRequest } from '@/lib/types/saved-search-api';
  import * as Sentry from '@sentry/nextjs';

  /**
   * 입력값 자동 저장 — best effort UPSERT
   * REQ-FUNC-025, REQ-NF-016: 저장 실패 시 사용자 미통지, Sentry만 기록
   * ⚠️ 이 함수는 throw 하지 않는다 (best effort 패턴)
   */
  export async function saveSearch(input: SaveSearchRequest): Promise<void> {
    try {
      // 1. 인증 확인 — 게스트는 조용히 skip
      const currentUser = await getCurrentUser();
      if (currentUser.type !== 'authenticated') return;

      // 2. 입력 유효성 검증
      const parsed = saveSearchRequestSchema.safeParse(input);
      if (!parsed.success) {
        Sentry.captureMessage('saveSearch invalid input', {
          level: 'warning',
          tags: { domain: 'save-search', task: 'CMD-SAVE-001' },
          extra: { errors: parsed.error.flatten() },
        });
        return; // best effort — 유효성 실패도 사용자 미통지
      }

      // 3. Prisma UPSERT — 사용자당 1건
      await prisma.savedSearch.upsert({
        where: { userId: currentUser.user.id },
        create: {
          userId: currentUser.user.id,
          searchParams: parsed.data.searchParams as any,
        },
        update: {
          searchParams: parsed.data.searchParams as any,
          savedAt: new Date(),
        },
      });
    } catch (error) {
      // ⚠️ best effort 핵심 — throw 안 함, Sentry만 기록
      Sentry.captureException(error, {
        tags: { domain: 'save-search', task: 'CMD-SAVE-001' },
      });
      // return — 사용자 흐름 차단 금지 (REQ-NF-016)
    }
  }
  ```

- [ ] **3.2** `lib/hooks/use-auto-save.ts`에 클라이언트 자동 저장 Hook 구현
  ```typescript
  'use client';
  import { useEffect, useRef, useCallback } from 'react';
  import { saveSearch } from '@/app/actions/save-search';
  import type { SearchParams } from '@/lib/types/saved-search';

  const DEBOUNCE_MS = 5000; // 5초 디바운스

  export function useAutoSave(searchParams: SearchParams | null) {
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestParamsRef = useRef<SearchParams | null>(searchParams);

    // 최신 params 추적
    useEffect(() => {
      latestParamsRef.current = searchParams;
    }, [searchParams]);

    // 저장 함수 (best effort — 에러 무시)
    const triggerSave = useCallback(async () => {
      const params = latestParamsRef.current;
      if (!params) return;
      // fire-and-forget: 에러 무시
      try { await saveSearch({ searchParams: params }); } catch { /* best effort */ }
    }, []);

    // 디바운스 5초 — input 변경 시
    useEffect(() => {
      if (!searchParams) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        triggerSave();
      }, DEBOUNCE_MS);

      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }, [searchParams, triggerSave]);

    // beforeunload — 세션 종료 시 저장
    useEffect(() => {
      const handleBeforeUnload = () => {
        const params = latestParamsRef.current;
        if (!params) return;
        // navigator.sendBeacon 또는 fetch keepalive로 비동기 전송
        const body = JSON.stringify({ searchParams: params });
        navigator.sendBeacon('/api/save-search-beacon', body);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    return { triggerSave };
  }
  ```

- [ ] **3.3** `app/api/save-search-beacon/route.ts`에 sendBeacon용 Route Handler 작성
  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { prisma } from '@/lib/prisma';
  import { createSupabaseServerClient } from '@/lib/supabase/server';
  import * as Sentry from '@sentry/nextjs';

  export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ ok: true }); // 게스트 skip

      await prisma.savedSearch.upsert({
        where: { userId: user.id },
        create: { userId: user.id, searchParams: body.searchParams },
        update: { searchParams: body.searchParams, savedAt: new Date() },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { domain: 'save-search', task: 'CMD-SAVE-001' },
      });
    }
    return NextResponse.json({ ok: true }); // always 200 (best effort)
  }
  ```

- [ ] **3.4** `__tests__/actions/save-search.spec.ts`에 Server Action 단위 테스트
  ```typescript
  import { saveSearch } from '@/app/actions/save-search';
  import * as Sentry from '@sentry/nextjs';

  describe('saveSearch Server Action', () => {
    it('인증 사용자 — UPSERT 성공', async () => { /* ... */ });
    it('게스트 — 조용히 skip (throw 0건, toast 0건)', async () => { /* ... */ });
    it('유효하지 않은 입력 — Sentry 기록만, throw 0건', async () => { /* ... */ });
    it('DB 에러 — Sentry.captureException 호출, throw 0건', async () => { /* ... */ });
    it('동일 userId 재호출 — 기존 행 갱신 (UPSERT)', async () => { /* ... */ });
  });
  ```

- [ ] **3.5** `__tests__/hooks/use-auto-save.spec.tsx`에 자동 저장 Hook 테스트
  ```typescript
  import { renderHook, act } from '@testing-library/react';
  import { useAutoSave } from '@/lib/hooks/use-auto-save';

  describe('useAutoSave Hook', () => {
    it('디바운스 5초 — 5초 이내 연속 변경 시 saveSearch 호출 1회', async () => { /* ... */ });
    it('beforeunload 이벤트 시 sendBeacon 호출', async () => { /* ... */ });
    it('searchParams가 null이면 저장 안 함', async () => { /* ... */ });
  });
  ```

- [ ] **3.6** `__tests__/api/save-search-beacon.spec.ts`에 Beacon Route Handler 테스트
  ```typescript
  describe('POST /api/save-search-beacon', () => {
    it('인증 사용자 — UPSERT 성공, 200 응답', async () => { /* ... */ });
    it('게스트 — skip, 200 응답 (에러 0건)', async () => { /* ... */ });
    it('DB 에러 — Sentry 기록, 200 응답 (best effort)', async () => { /* ... */ });
  });
  ```

- [ ] **3.7** best effort 정적 검증 스크립트 작성
  ```bash
  # saveSearch 함수에서 throw 문이 0건인지 확인
  grep -n "throw " app/actions/save-search.ts | wc -l  # → 0
  # saveSearch 함수에서 toast/alert 호출이 0건인지 확인
  grep -rn "toast\|alert\|notify" app/actions/save-search.ts | wc -l  # → 0
  ```

- [ ] **3.8** `lib/types/saved-search-api.ts`에 `SaveSearchRequest` 타입이 이미 존재하는지 확인 (API-005 산출물), 없으면 추가
  ```typescript
  // API-005에서 이미 정의된 타입 재확인
  import type { SaveSearchRequest } from '@/lib/types/saved-search-api';
  ```

- [ ] **3.9** `app/actions/save-search.ts`에 rate limit 방어 — 사용자당 분당 최대 12회 호출 제한
  ```typescript
  // 서버 메모리 기반 간이 rate limit (디바운스 5초 = 분당 최대 12회)
  const saveCallTimestamps = new Map<string, number[]>();
  const MAX_CALLS_PER_MINUTE = 12;
  ```

- [ ] **3.10** CI 게이트 검증
  ```bash
  npx tsc --noEmit  # 타입 검사
  npx jest --testPathPattern="save-search" --coverage  # 테스트 + 커버리지
  npx eslint app/actions/save-search.ts lib/hooks/use-auto-save.ts  # 린트
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 인증 사용자 — UPSERT 정상 저장
- **Given** 인증된 사용자가 주소A("서울 강남구"), 필터(maxCommuteTime: 60) 입력 완료
- **When** 세션 종료 또는 디바운스 5초 경과 후 `saveSearch({ searchParams })` 호출
- **Then** `saved_searches` 테이블에 해당 userId 행이 UPSERT, `search_params`에 입력값 포함, `saved_at`이 현재 시각

**AC-2 (예외):** 저장 실패 시 사용자 미통지 (best effort 핵심)
- **Given** DB 연결 실패 등으로 Prisma UPSERT 에러 발생
- **When** `saveSearch()` 내부 catch 블록 실행
- **Then** `Sentry.captureException` 호출됨 (1회), **throw 0건**, **toast/alert/에러 모달 0건**, UI에 변화 없음

**AC-3 (예외):** 게스트 사용자 — 조용히 skip
- **Given** 게스트 모드(currentUser.type === 'unauthenticated') 활성 상태
- **When** `saveSearch()` 호출
- **Then** 함수가 조기 return, DB 호출 0건, Sentry 호출 0건, throw 0건

**AC-4 (경계):** 동일 userId 재저장 시 기존 행 덮어쓰기 (UPSERT)
- **Given** `saved_searches`에 userId='user-001' 행이 존재 (addressA: '강남구')
- **When** 동일 userId로 addressA='마포구'로 `saveSearch()` 호출
- **Then** 총 행 수 1건 유지, `search_params.addressA`가 '마포구'로 갱신, `saved_at` 갱신

**AC-5 (도메인 핵심):** beforeunload + 디바운스 5초 호출 시점 검증
- **Given** 사용자가 입력 필드를 변경
- **When** ① 5초 디바운스 경과 시 `saveSearch` 호출, ② 브라우저 닫기(beforeunload) 시 `sendBeacon` 호출
- **Then** 두 경로 모두에서 최신 입력값이 서버로 전송

**AC-6 (정적 검증):** best effort 패턴 코드 검증
- **Given** `app/actions/save-search.ts` 파일
- **When** `grep "throw " app/actions/save-search.ts` 실행
- **Then** 매칭 0건 — catch 블록에서 절대 throw 하지 않음

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-016 | "입력값 자동 저장 성공률 — Best effort (저장 실패 시 무시, 사용자 미통지)" (§4.2.2) | saveSearch catch 블록에서 throw 0건 + toast 0건 정적 검증. AC-2에서 Sentry 호출만 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | catch 블록에서 `Sentry.captureException(error, { tags: { domain: 'save-search', task: 'CMD-SAVE-001' } })` 호출을 Jest mock으로 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `app/actions/save-search.ts` (saveSearch Server Action — 'use server', best effort UPSERT)
- `app/api/save-search-beacon/route.ts` (sendBeacon용 Route Handler — best effort)
- `lib/hooks/use-auto-save.ts` (useAutoSave Hook — beforeunload + 디바운스 5초, 'use client')
- `__tests__/actions/save-search.spec.ts` (5개 케이스)
- `__tests__/hooks/use-auto-save.spec.tsx` (3개 케이스)
- `__tests__/api/save-search-beacon.spec.ts` (3개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 태스크 시작 전 필요):

- **DB-006 ✅:** `model SavedSearch` (Prisma 3필드 스키마) — UPSERT 대상 테이블
- **API-005 ✅:** `SaveSearchRequest`, `SavedSearchErrorCode`, `saveSearchRequestSchema` — 입출력 타입/검증
- **CMD-AUTH-003 ✅:** `getCurrentUser` — 인증 검증 (게스트 분기)
- **MON-001 ✅:** Sentry 통합 — best effort 에러 기록

### 후행 (이 태스크 완료 후 가능):

- **QRY-SAVE-001:** 저장된 조건 불러오기 — saveSearch가 저장한 데이터를 조회
- **TEST-007:** 간이 저장 GWT 시나리오 — best effort 동작 검증
- **UI-014:** 이전 조건 불러오기 UI — saveSearch 연동

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/actions/save-search.spec.ts` — 5개 케이스 (정상 UPSERT, 게스트 skip, 유효성 실패 Sentry, DB 에러 best effort, 재UPSERT)
- **컴포넌트 테스트:** `__tests__/hooks/use-auto-save.spec.tsx` — 3개 케이스 (디바운스 5초, beforeunload, null 방어)
- **API 테스트:** `__tests__/api/save-search-beacon.spec.ts` — 3개 케이스 (인증 UPSERT, 게스트 skip, DB 에러)
- **정적 분석:**
  - `grep "throw " app/actions/save-search.ts | wc -l` → 0건
  - `grep -r "toast\|alert\|notify" app/actions/save-search.ts | wc -l` → 0건
- **수동 검증:**
  1. 브라우저에서 주소 입력 후 5초 대기 → Supabase Studio에서 saved_searches 행 확인
  2. 브라우저 탭 닫기 → Network 탭에서 sendBeacon 호출 확인
  3. 네트워크 차단 상태에서 저장 시도 → UI 변화 없음 (toast 0건) 확인
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **beforeunload + 디바운스 5초 적정성:** beforeunload 이벤트에서 `navigator.sendBeacon`의 payload 크기 제한(64KB)을 초과할 가능성은 낮으나, 대용량 필터 조건 시 확인 필요. 디바운스 5초는 타이핑 완료 후 충분한 지연이지만, 사용자 입력 빈도에 따라 조정 가능.
2. **sendBeacon vs fetch keepalive:** `navigator.sendBeacon`은 POST만 지원하고 커스텀 헤더를 설정할 수 없어 Supabase Auth 쿠키가 자동 전송되는지 확인 필요. `fetch(url, { keepalive: true })` 대안도 검토.
3. **서버 메모리 rate limit의 Vercel Serverless 호환성:** Vercel Serverless Functions는 매 호출마다 별도 인스턴스이므로 인메모리 rate limit이 동작하지 않음. 디바운스 5초가 사실상 클라이언트 측 rate limit 역할.
4. **Supabase RLS와 UPSERT 호환:** DB-006에서 정의한 RLS 정책 `auth.uid() = user_id`가 Prisma를 통한 서버 사이드 UPSERT에서도 적용되는지 확인. Prisma는 service_role 키를 사용하므로 RLS bypass 가능 — 서버 측 인증 검증으로 보완.
