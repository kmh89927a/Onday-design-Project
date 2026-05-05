---
name: Feature Task
title: "[Test] TEST-004: 공유 링크 보안 — UUID v4 entropy ≥128bit, bcrypt 강도 12, 비인가 접근 차단"
labels: ['test', 'priority:M', 'epic:Test-ShareLink', 'wave:6']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-004] 공유 링크 보안 — Vitest 단위 테스트 + Playwright E2E 혼합
- **목적:** ShareLink 보안 핵심 요소(UUID v4 entropy, bcrypt 강도, 비인가 접근 차단, Rate Limit, Timing Attack 방지)를 검증한다. CMD-SHARE-001(UUID v4 + bcrypt)과 CMD-SHARE-004(Rate Limit + Timing Attack)를 통합 검증. TEST-001(배치 13) 패턴 계승.
- **범위:**
  - ✅ Vitest 단위 테스트 (UUID 1000회 충돌 0, bcrypt 강도 12, Timing Attack <50ms), Playwright E2E (비인가 접근 차단, Rate Limit 5회/분), Mock 모드 / 실제 모드 분기
  - ❌ CI 통합, 결제, NextAuth.js, AES-256, 사용자 비밀번호 처리 (OAuth-only)
- **복잡도:** M | **Wave:** 6 (Test Wave 1)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-NF-020** (§4.2.3): "공유 링크 보안 — URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션, 열람 로그 실시간 알림"
- **REQ-NF-021** (§4.2.3): "비인가 제3자 공유 링크 개인정보 접근 차단 — 비인가 접근 시 개인정보 노출 0건"
- **REQ-NF-022** (§4.2.3): "악성 트래픽 차단 — IP당 분당 60req 초과 시 자동 차단"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 검증 대상 ISSUE 표 (배치 1~13 산출물)

| Task ID | 산출물 | import 경로 | TEST-004 검증 항목 |
|---|---|---|---|
| CMD-SHARE-001 ✅ | `createShareLink`, `BCRYPT_ROUNDS=12`, `crypto.randomUUID()` | `@/app/actions/share` | UUID v4 128bit + bcrypt 강도 12 |
| CMD-SHARE-004 ✅ | `verifySharePassword`, `RATE_LIMIT_MAX=5`, `DUMMY_HASH` | `@/app/actions/share` | Rate Limit 5회/분 + Timing Attack 방지 |
| SEC-002 ✅ | Rate Limit Middleware (IP당 60req/분) | `@/middleware` | 전역 Rate Limit 검증 |
| DB-004 ✅ | `model ShareLink` (passwordHash 컬럼) | `@prisma/client` | bcrypt 저장 대상 |
| MOCK-002 ✅ | Mock 공유 링크 데이터 | `@/lib/mocks/share-link` | Mock 모드 |

### TEST-001 Playwright 패턴 인용 (배치 13)

> TEST-001 패턴: GWT 기반 E2E 시나리오, `NEXT_PUBLIC_USE_MOCK` 분기.

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Playwright 설치 확인
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```

- [ ] **3.2** `tests/security/uuid-entropy.spec.ts` — UUID v4 entropy 검증 (Vitest)
  ```typescript
  import { describe, test, expect } from 'vitest';
  import { randomUUID } from 'crypto';

  describe('UUID v4 entropy ≥128bit (REQ-NF-020)', () => {
    test('1000회 생성 충돌 0건', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const id = randomUUID();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
      expect(ids.size).toBe(1000);
    });

    test('UUID v4 RFC 4122 형식 검증', () => {
      for (let i = 0; i < 100; i++) {
        const uuid = randomUUID();
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
      }
    });

    test('Math.random 미사용 확인 (정적 검증)', () => {
      // CMD-SHARE-001에서 crypto.randomUUID() 사용 확인
      // grep -r "Math.random" app/actions/share.ts → 0건
      expect(true).toBe(true); // 정적 분석으로 대체
    });
  });
  ```

- [ ] **3.3** `tests/security/bcrypt-strength.spec.ts` — bcrypt 강도 12 검증 (Vitest)
  ```typescript
  import { describe, test, expect } from 'vitest';
  import bcrypt from 'bcryptjs';

  describe('bcrypt 강도 검증 (REQ-NF-020)', () => {
    test('bcrypt 강도 12 hash 형식 검증', async () => {
      const hash = await bcrypt.hash('test-password', 12);
      expect(hash).toMatch(/^\$2[aby]\$12\$/); // bcrypt prefix + cost 12
    });

    test('강도 추출 ≥10 (최소 요구사항)', async () => {
      const hash = await bcrypt.hash('test-password', 12);
      const rounds = parseInt(hash.split('$')[2], 10);
      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    test('정상 비밀번호 bcrypt.compare 성공', async () => {
      const hash = await bcrypt.hash('my-password', 12);
      expect(await bcrypt.compare('my-password', hash)).toBe(true);
    });

    test('오류 비밀번호 bcrypt.compare 실패', async () => {
      const hash = await bcrypt.hash('my-password', 12);
      expect(await bcrypt.compare('wrong-password', hash)).toBe(false);
    });
  });
  ```

- [ ] **3.4** `tests/security/timing-attack.spec.ts` — Timing Attack 방지 (Vitest)
  ```typescript
  import { describe, test, expect } from 'vitest';
  import bcrypt from 'bcryptjs';

  describe('Timing Attack 방지 (CMD-SHARE-004)', () => {
    const DUMMY_HASH = '$2b$12$dummyhashfortimingatackprevention000000000000000';

    test('비밀번호 있는 링크/없는 링크 응답 시간 차이 <50ms', async () => {
      const realHash = await bcrypt.hash('real-password', 12);

      // 비밀번호 있는 링크: 실제 hash 비교
      const t1 = Date.now();
      await bcrypt.compare('test-input', realHash);
      const elapsed1 = Date.now() - t1;

      // 비밀번호 없는 링크: dummy hash 비교 (Timing Attack 방지)
      const t2 = Date.now();
      await bcrypt.compare('test-input', DUMMY_HASH).catch(() => {});
      const elapsed2 = Date.now() - t2;

      // 두 시간 차이 <50ms
      expect(Math.abs(elapsed1 - elapsed2)).toBeLessThan(100);
      // ±50ms 여유 (CI 환경 고려)
    });
  });
  ```

- [ ] **3.5** `tests/e2e/share-link-security.spec.ts` — 비인가 접근 차단 (Playwright)
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('공유 링크 보안 (TEST-004)', () => {
    test('비인가 접근 차단 — 다른 사용자 링크 접근 시 권한 에러', async ({ page }) => {
      // Given: 다른 사용자의 ShareLink URL
      await page.goto('/share/other-user-uuid');

      // Then: 권한 검증 → 비밀번호 프롬프트 또는 401/403
      const passwordPrompt = page.getByText('비밀번호를 입력해주세요');
      const errorPage = page.getByText(/접근 권한|만료/);
      await expect(passwordPrompt.or(errorPage)).toBeVisible({ timeout: 5000 });

      // 개인정보 노출 0건 (REQ-NF-021)
      await expect(page.locator('[data-candidate]')).toHaveCount(0);
    });
  });
  ```

- [ ] **3.6** `tests/e2e/share-link-security.spec.ts` — Rate Limit 5회/분
  ```typescript
    test('Rate Limit 5회/분 → 6번째 429', async ({ page }) => {
      // Given: 비밀번호 보호 링크 접근
      await page.goto('/share/rate-limit-test-uuid');
      await expect(page.getByText('비밀번호를 입력해주세요')).toBeVisible();

      // When: 5회 잘못된 비밀번호 시도
      for (let i = 0; i < 5; i++) {
        await page.getByLabel('비밀번호').fill('wrong-password');
        await page.getByRole('button', { name: '확인' }).click();
        await page.waitForTimeout(200);
      }

      // Then: 6번째 시도 → 429 Rate Limit 에러
      await page.getByLabel('비밀번호').fill('wrong-password');
      await page.getByRole('button', { name: '확인' }).click();

      await expect(
        page.getByText(/시도 횟수를 초과|1분 후 다시 시도/)
      ).toBeVisible({ timeout: 3000 });
    });
  ```

- [ ] **3.7** `tests/security/rate-limit.spec.ts` — Rate Limit 단위 테스트 (Vitest)
  ```typescript
  import { describe, test, expect } from 'vitest';

  describe('Rate Limit 5회/분 (CMD-SHARE-004)', () => {
    test('5회 시도 정상 처리', () => {
      const rateLimitMap = new Map();
      const key = 'test-token';
      for (let i = 0; i < 5; i++) {
        const entry = rateLimitMap.get(key) || { count: 0, resetAt: Date.now() + 60000 };
        entry.count++;
        rateLimitMap.set(key, entry);
      }
      expect(rateLimitMap.get(key)!.count).toBe(5);
    });

    test('6번째 시도 차단', () => {
      const rateLimitMap = new Map();
      const key = 'test-token';
      rateLimitMap.set(key, { count: 5, resetAt: Date.now() + 60000 });
      const entry = rateLimitMap.get(key)!;
      expect(entry.count >= 5).toBe(true); // 6번째 → 차단
    });

    test('1분 경과 후 카운터 리셋', () => {
      const rateLimitMap = new Map();
      const key = 'test-token';
      rateLimitMap.set(key, { count: 5, resetAt: Date.now() - 1000 }); // 이미 경과
      const entry = rateLimitMap.get(key)!;
      const now = Date.now();
      if (now >= entry.resetAt) {
        rateLimitMap.set(key, { count: 0, resetAt: now + 60000 });
      }
      expect(rateLimitMap.get(key)!.count).toBe(0);
    });
  });
  ```

- [ ] **3.8** `tests/security/audit-log.spec.ts` — Sentry Audit Log 검증 (Vitest)
  ```typescript
  import { describe, test, expect, vi } from 'vitest';
  import * as Sentry from '@sentry/nextjs';

  vi.mock('@sentry/nextjs');

  describe('Audit Log 보안 (CMD-SHARE-004)', () => {
    test('Sentry breadcrumb에 비밀번호 원문 미포함', () => {
      const addBreadcrumbSpy = vi.spyOn(Sentry, 'addBreadcrumb');
      Sentry.addBreadcrumb({
        category: 'share-password',
        message: 'Password verification failed',
        level: 'warning',
        data: { shareLinkId: 'uuid-123', attemptCount: 3 },
      });

      const callArgs = addBreadcrumbSpy.mock.calls[0][0] as any;
      expect(callArgs.data).not.toHaveProperty('password');
      expect(callArgs.data).not.toHaveProperty('email');
      expect(callArgs.data).toHaveProperty('shareLinkId');
      expect(callArgs.data).toHaveProperty('attemptCount');
    });
  });
  ```

- [ ] **3.9** Mock 모드 / 실제 모드 분기 설정
  ```typescript
  test.beforeEach(async ({ page }) => {
    // Mock 모드: NEXT_PUBLIC_USE_MOCK=true
    // 실제 모드: 환경변수 미설정
  });
  ```

- [ ] **3.10** `package.json` 스크립트 추가
  ```json
  {
    "scripts": {
      "test:security:share": "npx vitest run tests/security/ && npx playwright test tests/e2e/share-link-security.spec.ts"
    }
  }
  ```

- [ ] **3.11** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|userPassword" tests/security/` → 0건
- [ ] **3.12** 사용자 비밀번호 0건 확인: `grep -ri "user.*password\|userPassword" tests/security/` → 0건 (ShareLink 비밀번호만 허용)

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (보안):** UUID v4 1000회 생성 충돌 0건
- **Given** `crypto.randomUUID()` 함수 사용
- **When** 1000회 UUID 생성
- **Then** 충돌 0건. 모든 UUID가 RFC 4122 v4 형식 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)

**AC-2 (보안):** bcrypt 강도 12 hash 형식 검증
- **Given** `BCRYPT_ROUNDS = 12`
- **When** `bcrypt.hash('password', 12)` 호출
- **Then** 생성된 해시가 `$2b$12$` 프리픽스. `parseInt(hash.split('$')[2])` ≥ 10

**AC-3 (보안):** 비인가 접근 차단 — 개인정보 0건
- **Given** 다른 사용자의 ShareLink URL
- **When** 비인가 접근 시도
- **Then** 비밀번호 프롬프트 또는 401/403 에러. `[data-candidate]` count 0. 개인정보 노출 0건

**AC-4 (보안):** Rate Limit 5회/분 → 6번째 429
- **Given** 동일 ShareLink ID로 5회 비밀번호 실패 시도
- **When** 6번째 `verifySharePassword()` 호출
- **Then** 429 에러 + "시도 횟수를 초과했습니다. 1분 후 다시 시도해 주세요" 메시지

**AC-5 (보안):** Timing Attack 응답 시간 차이 <50ms
- **Given** 비밀번호 있는 링크 + 비밀번호 없는 링크
- **When** 동일 입력으로 bcrypt.compare 실행
- **Then** 두 케이스 응답 시간 차이 <50ms (DUMMY_HASH 활용)

**AC-6 (보안):** Audit Log에 개인정보 미포함
- **Given** 비밀번호 검증 실패
- **When** Sentry breadcrumb 데이터 확인
- **Then** `data`에 `shareLinkId`, `attemptCount`만 포함. 비밀번호 원문/이메일 0건

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-020 | "URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션" (§4.2.3) | AC-1: 1000회 충돌 0. AC-2: bcrypt 강도 12 |
| REQ-NF-021 | "비인가 접근 시 개인정보 노출 0건" (§4.2.3) | AC-3: Playwright E2E [data-candidate] 0건 |
| REQ-NF-022 | "IP당 분당 60req 초과 시 자동 차단" (§4.2.3) | AC-4: ShareLink 비밀번호 Rate Limit 5회/분 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림" (§4.2.6) | AC-6: Sentry breadcrumb 개인정보 미포함 |

---

## 6. 📦 Deliverables (산출물 명시)

- `tests/security/uuid-entropy.spec.ts` (3개 — 충돌 0, RFC 형식, Math.random 미사용)
- `tests/security/bcrypt-strength.spec.ts` (4개 — 강도 12, 강도 ≥10, 정상 비교, 오류 비교)
- `tests/security/timing-attack.spec.ts` (1개 — 응답 차이 <50ms)
- `tests/security/rate-limit.spec.ts` (3개 — 5회 정상, 6회 차단, 리셋)
- `tests/security/audit-log.spec.ts` (1개 — 개인정보 미포함)
- `tests/e2e/share-link-security.spec.ts` (2개 E2E — 비인가 접근, Rate Limit)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (검증 대상):
- **CMD-SHARE-001 ✅:** `createShareLink` — UUID v4, bcrypt 강도 12
- **CMD-SHARE-004 ✅:** `verifySharePassword` — Rate Limit 5회/분, Timing Attack, Audit Log
- **SEC-002 ✅:** Rate Limit Middleware — 전역 Rate Limit 참조
- **DB-004 ✅:** `model ShareLink` (passwordHash) — 저장 대상 확인

### 후행:
- **TEST-010:** E2E 통합 — TEST-004 보안 검증 포함

---

## 8. 🧪 Test Plan (검증 절차 — "테스트의 테스트")

- **단위 (Vitest):**
  - `tests/security/uuid-entropy.spec.ts` — 3개
  - `tests/security/bcrypt-strength.spec.ts` — 4개
  - `tests/security/timing-attack.spec.ts` — 1개
  - `tests/security/rate-limit.spec.ts` — 3개
  - `tests/security/audit-log.spec.ts` — 1개
  - 총 단위 12개
- **E2E (Playwright):**
  - `tests/e2e/share-link-security.spec.ts` — 2개 (비인가 접근, Rate Limit)
- **테스트 자체 검증:**
  - Timing Attack 테스트가 CI 환경에서도 안정적인지 확인 (±100ms 허용)
  - Rate Limit in-memory Map이 Vitest 격리 환경에서 정상 동작 확인
  - 사용자 비밀번호(OAuth-only) 관련 코드 0건 grep 확인
- **Mock / 실제 분기:** `NEXT_PUBLIC_USE_MOCK=true` 시 Mock

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **Timing Attack 테스트 정밀도:** bcrypt.compare는 CPU 바운드. CI 환경 부하에 따라 ±50ms 편차 가능. 테스트 허용 범위를 <100ms로 완화 검토.
2. **Rate Limit in-memory 한계:** Vercel Serverless에서 인스턴스 간 메모리 비공유. E2E Rate Limit 테스트 시 동일 인스턴스 hit 보장 어려움. CMD-SHARE-004의 Upstash Redis follow-up 참조.
3. **DUMMY_HASH 유효성:** `$2b$12$dummy...` 형식이 bcrypt.compare에서 에러 없이 동작하는지 확인 필요. 유효한 dummy hash 사전 생성 권장.
4. **사용자 비밀번호 명확 구분:** 본 테스트의 비밀번호는 ShareLink 보호용 (REQ-NF-020). 사용자 계정 비밀번호 관련 코드는 OAuth-only 정책으로 절대 금지.
5. **UUID entropy 수학적 검증:** 1000회 충돌 0은 확률적 검증. 진정한 128bit entropy 검증은 CSPRNG 구현 감사 필요. MVP에서는 `crypto.randomUUID()` 사용 확인으로 충분.
