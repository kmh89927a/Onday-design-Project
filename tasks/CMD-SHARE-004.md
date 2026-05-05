---
name: Feature Task
title: "[Feature] CMD-SHARE-004: 공유 링크 비밀번호 검증 (bcrypt.compare + Rate Limit + Audit log)"
labels: ['feature', 'priority:L', 'epic:ShareLink', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-SHARE-004] 공유 링크 비밀번호 검증 — bcrypt.compare + Rate Limit 5회/분 + Audit log
- **목적 (Why):**
  - **비즈니스:** 비밀번호 보호된 공유 링크 접근 시 bcrypt 기반 비밀번호 검증을 수행한다. 무차별 대입 공격 방지를 위한 Rate Limiting과 Timing Attack 방지를 포함한다.
  - **사용자 가치:** 공유 링크에 비밀번호를 설정한 사용자의 개인정보를 안전하게 보호하고, 올바른 비밀번호 입력 시에만 진단 결과를 열람할 수 있게 한다.
- **범위 (What):**
  - ✅ 만드는 것: `verifySharePassword` Server Action ('use server'), `bcrypt.compare()` 비밀번호 검증, Rate Limit (동일 ShareLink ID 5회/분), Timing Attack 방지 (dummy bcrypt), Sentry breadcrumb Audit log, viewCount 증가
  - ❌ 만들지 않는 것: 공유 링크 생성(CMD-SHARE-001), 사용자 비밀번호 처리(OAuth-only — 절대 금지), 결제 코드, NextAuth.js 코드
- **복잡도:** L
- **Wave:** 3 (ShareLink 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-NF-020** (§4.2.3): "공유 링크 보안 — URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션, 열람 로그 실시간 알림"
- **REQ-NF-021** (§4.2.3): "비인가 제3자 공유 링크 개인정보 접근 차단 — 비인가 접근 시 개인정보 노출 0건"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.2 — 비밀번호 검증 부분)

- **핵심 메시지:**
  1. `SSR→UserB: 비밀번호 입력 프롬프트`
  2. `UserB→SSR: 비밀번호 입력`
  3. `SSR→Prisma: 비밀번호 검증 (bcrypt)`
  4. `alt 불일치: SSR→UserB: "비밀번호가 일치하지 않습니다"`

### 선행 태스크 산출물 (배치 1·5)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-004 | `model ShareLink` (passwordHash 컬럼) | `@prisma/client` | bcrypt.compare 대상 |
| API-003 | `VerifyPasswordRequest/Response`, `ShareLinkErrorCode`, `verifyPasswordSchema` | `@/lib/types/share-link`, `@/lib/validators/share-link` | 입출력 DTO, Zod 스키마 |
| API-006 | `createAppError`, `reportErrorToSentry` | `@/lib/helpers/app-error`, `@/lib/helpers/sentry-error` | 에러 생성 + Sentry |
| MOCK-002 | `MOCK_SHARE_ERROR_PASSWORD_MISMATCH` | `@/lib/mocks/share-link` | 테스트 기대값 |
| CMD-SHARE-002 | `getShareLinkData()` | `@/lib/share/get-share-link` | 링크 존재 여부 확인 |
| DB-001 | `prisma` 싱글톤 | `@/lib/db` | Prisma Client |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `app/actions/share.ts`에 `verifySharePassword` Server Action 추가
  ```typescript
  'use server';
  import bcrypt from 'bcryptjs';
  import { prisma } from '@/lib/db';
  import { verifyPasswordSchema } from '@/lib/validators/share-link';
  import { createAppError } from '@/lib/helpers/app-error';
  import { ShareLinkErrorCode } from '@/lib/types/share-link';
  import type { VerifyPasswordRequest, VerifyPasswordResponse } from '@/lib/types/share-link';
  import * as Sentry from '@sentry/nextjs';

  // Rate Limit: 동일 ShareLink ID 5회/분 (in-memory Map — Open Questions 참조)
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_MAX = 5;
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분

  // Timing Attack 방지용 dummy hash
  const DUMMY_HASH = '$2b$12$dummyhashfortimingatackprevention000000000000000';

  export async function verifySharePassword(
    input: VerifyPasswordRequest
  ): Promise<VerifyPasswordResponse> {
    // 1. 입력 유효성 검증
    const parsed = verifyPasswordSchema.parse(input);

    // 2. Rate Limit 체크
    const now = Date.now();
    const rateKey = parsed.token;
    const rateEntry = rateLimitMap.get(rateKey);

    if (rateEntry) {
      if (now < rateEntry.resetAt) {
        if (rateEntry.count >= RATE_LIMIT_MAX) {
          // 5회 초과 → HTTP 429
          Sentry.addBreadcrumb({
            category: 'share-password',
            message: `Rate limit exceeded for ShareLink ${rateKey}`,
            level: 'warning',
            data: { shareLinkId: rateKey, attempts: rateEntry.count },
          });
          throw createAppError(
            ShareLinkErrorCode.UNAUTHORIZED_ACCESS,
            '비밀번호 시도 횟수를 초과했습니다. 1분 후 다시 시도해 주세요.'
          );
        }
        rateEntry.count += 1;
      } else {
        // 윈도우 리셋
        rateLimitMap.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      }
    } else {
      rateLimitMap.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }

    // 3. ShareLink 조회
    const link = await prisma.shareLink.findUnique({
      where: { uniqueUrl: parsed.token },
    });

    // 4. Timing Attack 방지 — 존재하지 않는 링크에도 동일 bcrypt 시간 소요
    const hashToCompare = link?.passwordHash ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(parsed.password, hashToCompare);

    if (!link) {
      throw createAppError(ShareLinkErrorCode.LINK_NOT_FOUND);
    }

    if (!link.passwordHash) {
      // 비밀번호 없는 링크인데 비밀번호 시도 — 동일 응답 시간 유지
      return { verified: true };
    }

    if (!isValid) {
      // 5. Audit Log — 실패 시도 기록 (개인정보 미포함)
      Sentry.addBreadcrumb({
        category: 'share-password',
        message: `Password verification failed`,
        level: 'warning',
        data: {
          shareLinkId: link.id,
          attemptCount: rateLimitMap.get(rateKey)?.count ?? 0,
          // 비밀번호 원문 절대 미포함
        },
      });

      return {
        verified: false,
        error: ShareLinkErrorCode.PASSWORD_MISMATCH,
      };
    }

    // 6. 검증 성공 → viewCount 증가
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } },
    });

    return { verified: true };
  }
  ```

- [ ] **3.2** Rate Limit 저장소 추상화 인터페이스 작성
  ```typescript
  // lib/share/rate-limiter.ts
  export interface RateLimiter {
    check(key: string, maxAttempts: number, windowMs: number): Promise<boolean>;
    increment(key: string): Promise<number>;
    reset(key: string): Promise<void>;
  }

  // 초기 구현: in-memory Map (Vercel Serverless에서는 인스턴스 간 공유 안 됨)
  // Open Questions: Vercel KV / Upstash Redis 도입 시 구현체 교체
  export class InMemoryRateLimiter implements RateLimiter {
    private store = new Map<string, { count: number; resetAt: number }>();
    // ... 구현
  }
  ```

- [ ] **3.3** Timing Attack 방지 검증 — 모든 경로에서 동일 bcrypt.compare 시간
  ```typescript
  // 비밀번호 없는 링크 / 존재하지 않는 링크에서도 bcrypt.compare 실행
  // → 응답 시간이 일정하여 링크 존재 여부 추론 불가
  ```

- [ ] **3.4** `__tests__/actions/verify-share-password.spec.ts`에 단위 테스트 작성 (Vitest)
  ```typescript
  describe('verifySharePassword', () => {
    it('올바른 비밀번호 → verified: true + viewCount 증가', async () => { /* ... */ });
    it('잘못된 비밀번호 → verified: false + PASSWORD_MISMATCH', async () => { /* ... */ });
    it('존재하지 않는 링크 → LINK_NOT_FOUND 에러', async () => { /* ... */ });
    it('비밀번호 없는 링크 → verified: true (무조건 통과)', async () => { /* ... */ });
    it('Zod 유효성 검증 실패 → ZodError', async () => { /* ... */ });
    it('Sentry breadcrumb에 비밀번호 원문 미포함', async () => { /* ... */ });
  });
  ```

- [ ] **3.5** `__tests__/share/rate-limit.spec.ts`에 Rate Limit 테스트 작성
  ```typescript
  describe('Rate Limit (REQ-NF-021)', () => {
    it('동일 ShareLink ID 5회 시도 → 정상', async () => { /* ... */ });
    it('6회째 시도 → 429 에러 + 쿨다운 메시지', async () => { /* ... */ });
    it('1분 경과 후 → 카운터 리셋 + 재시도 가능', async () => { /* ... */ });
  });
  ```

- [ ] **3.6** `__tests__/share/timing-attack.spec.ts`에 Timing Attack 방지 테스트
  ```typescript
  describe('Timing Attack 방지', () => {
    it('비밀번호 있는 링크와 없는 링크의 응답 시간 차이 ≤ 50ms', async () => {
      // 두 케이스의 bcrypt.compare 호출 시간 비교
      const t1 = Date.now();
      await bcrypt.compare('test', '$2b$12$validhash...');
      const elapsed1 = Date.now() - t1;

      const t2 = Date.now();
      await bcrypt.compare('test', DUMMY_HASH);
      const elapsed2 = Date.now() - t2;

      expect(Math.abs(elapsed1 - elapsed2)).toBeLessThan(50);
    });
  });
  ```

- [ ] **3.7** Audit Log 검증 — Sentry breadcrumb 포맷 확인
  ```typescript
  // Sentry.addBreadcrumb 호출 시:
  // - category: 'share-password'
  // - data: { shareLinkId, attemptCount }
  // - 비밀번호 원문 절대 미포함
  ```

- [ ] **3.8** API-006 adaptLegacyMap 활용 검증
  - `SHARE_LINK_ERROR_MAP[ShareLinkErrorCode.PASSWORD_MISMATCH].httpStatus === 401` ✅
  - `SHARE_LINK_ERROR_MAP[ShareLinkErrorCode.UNAUTHORIZED_ACCESS].httpStatus === 403` ✅

- [ ] **3.9** v1.3 정합성 검증
  ```bash
  grep -ri "NextAuth\|payment\|AES\|Math.random" app/actions/share.ts  # → 0건
  # USER 비밀번호 처리 0건 (ShareLink passwordHash만 허용)
  grep -ri "user.*password\|userPassword" app/actions/share.ts  # → 0건
  ```

- [ ] **3.10** 'use server' 지시어 확인 (CMD-SHARE-001과 동일 파일)
  ```bash
  head -1 app/actions/share.ts  # → 'use server'
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 올바른 비밀번호 → 검증 성공
- **Given** `passwordHash`가 `bcrypt.hash('secure123', 12)`인 ShareLink
- **When** `verifySharePassword({ token: uniqueUrl, password: 'secure123' })` 호출
- **Then** `{ verified: true }` 반환, DB `viewCount` +1

**AC-2 (예외):** 잘못된 비밀번호 → 검증 실패
- **Given** 동일 ShareLink
- **When** `verifySharePassword({ token: uniqueUrl, password: 'wrong' })` 호출
- **Then** `{ verified: false, error: 'SHARE_PASSWORD_MISMATCH' }` 반환, Sentry breadcrumb 기록, `viewCount` 미변경

**AC-3 (보안):** Rate Limit 5회/분 초과 → 429 에러
- **Given** 동일 ShareLink ID로 5회 실패 시도 완료
- **When** 6회째 `verifySharePassword()` 호출
- **Then** HTTP 429 에러 + "비밀번호 시도 횟수를 초과했습니다. 1분 후 다시 시도해 주세요." 메시지

**AC-4 (보안):** Timing Attack 방지 — 응답 시간 일정
- **Given** 비밀번호 있는 링크와 비밀번호 없는 링크
- **When** 동일 입력으로 `verifySharePassword()` 호출
- **Then** 두 케이스의 응답 시간 차이 ≤ 50ms (모두 `bcrypt.compare` 실행)

**AC-5 (보안):** Audit Log에 개인정보 미포함
- **Given** 비밀번호 검증 실패
- **When** Sentry breadcrumb 데이터 확인
- **Then** `data`에 `shareLinkId`와 `attemptCount`만 포함. 비밀번호 원문, 사용자 이메일 등 개인정보 0건

**AC-6 (예외):** 존재하지 않는 링크 → 404 (Timing Attack 방지 적용)
- **Given** 존재하지 않는 `token`
- **When** `verifySharePassword()` 호출
- **Then** `LINK_NOT_FOUND` 에러, bcrypt.compare(dummy hash) 실행으로 응답 시간 일정

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-020 | "공유 링크 보안 — 열람 비밀번호 옵션" (§4.2.3) | `bcrypt.compare(input, link.passwordHash)` 호출. 일치 시 데이터 반환, 불일치 시 INVALID_PASSWORD 에러 |
| REQ-NF-021 | "비인가 접근 시 개인정보 노출 0건" (§4.2.3) | Rate Limit 5회/분 + Timing Attack 방지 + 검증 실패 시 데이터 미반환 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 실패 시도 Sentry breadcrumb 기록. 개인정보 미포함 (ShareLink ID + 시도 횟수만) |

---

## 6. 📦 Deliverables (산출물 명시)

- `app/actions/share.ts` (verifySharePassword Server Action 추가 — CMD-SHARE-001 파일 확장)
- `lib/share/rate-limiter.ts` (RateLimiter 인터페이스 + InMemoryRateLimiter)
- `__tests__/actions/verify-share-password.spec.ts` (단위 테스트 6개)
- `__tests__/share/rate-limit.spec.ts` (Rate Limit 테스트 3개)
- `__tests__/share/timing-attack.spec.ts` (Timing Attack 방지 테스트 1개)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **DB-004:** `model ShareLink` (passwordHash 컬럼)
- **DB-001:** `lib/db.ts` Prisma 싱글톤
- **API-003:** `VerifyPasswordRequest/Response`, `verifyPasswordSchema`, `ShareLinkErrorCode`
- **API-006:** `createAppError`
- **CMD-SHARE-001:** ShareLink CREATE (passwordHash 저장)
- **CMD-SHARE-002:** `getShareLinkData()` — 링크 존재 여부 확인

### 후행:
- **QRY-SHARE-001:** SSR 공유 리포트 페이지 — 비밀번호 검증 후 데이터 반환
- **TEST-004:** 공유 링크 보안 테스트

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/actions/verify-share-password.spec.ts` — Vitest 6개 (정상 검증, 실패, 존재하지 않음, 비밀번호 없는 링크, Zod 실패, Sentry 미포함)
- **단위 테스트:** `__tests__/share/rate-limit.spec.ts` — Vitest 3개 (5회 정상, 6회 429, 리셋 후 재시도)
- **단위 테스트:** `__tests__/share/timing-attack.spec.ts` — Vitest 1개 (응답 시간 차이 ≤ 50ms)
- **정적 검증:** `grep -ri "NextAuth\|payment\|userPassword" app/actions/share.ts` → 0건
- **타입 검증:** `npx tsc --noEmit` 통과
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **Rate Limit 저장소 결정:** 현재 in-memory Map으로 구현. Vercel Serverless는 인스턴스 간 메모리 공유가 안 되므로, 프로덕션에서는 **Vercel KV** 또는 **Upstash Redis**로 교체 필요. `RateLimiter` 인터페이스로 추상화하여 구현체 교체 용이하게 설계. — INFRA-005(모니터링/Rate Limit 인프라)에서 결정 후 갱신.
2. **DUMMY_HASH 유효성:** `DUMMY_HASH`는 bcrypt 형식이어야 `bcrypt.compare()`가 정상 동작. 유효한 dummy hash를 사전 생성하여 상수로 보관.
3. **Rate Limit 쿨다운 알림:** 현재 에러 메시지에 "1분 후 다시 시도해 주세요" 포함. 남은 시간을 동적으로 계산하여 반환할지 — MVP에서는 고정 메시지.
4. **USER 비밀번호와의 명확한 구분:** 본 태스크의 비밀번호는 ShareLink 보호용 (REQ-NF-020). 사용자 계정 비밀번호 처리는 OAuth-only 정책으로 절대 금지.
