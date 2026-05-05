---
name: Feature Task
title: "[Feature] CMD-SHARE-001: 공유 링크 생성 Server Action (UUID v4 128bit + 30일 만료 + 옵션 비밀번호 bcrypt)"
labels: ['feature', 'priority:M', 'epic:ShareLink', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-SHARE-001] 공유 링크 생성 — createShareLink Server Action
- **목적 (Why):**
  - **비즈니스:** 진단 결과를 배우자에게 안전하게 공유할 수 있는 고유 URL을 생성한다. ShareLink 도메인은 B2C 바이럴 핵심 기능으로, 무료 미리보기 1곳(REQ-FUNC-011)을 통한 신규 사용자 유입 funnel의 입구 역할을 한다.
  - **사용자 가치:** 진단 완료 후 원클릭으로 공유 링크를 생성하고 클립보드에 복사하여, 카카오톡 등 메신저로 배우자에게 즉시 전달할 수 있다. 선택적 비밀번호 보호로 개인정보를 안전하게 관리한다.
- **범위 (What):**
  - ✅ 만드는 것: `createShareLink` Server Action ('use server'), UUID v4 (crypto.randomUUID) 128bit entropy, 30일 만료 자동 계산, bcrypt 비밀번호 해싱 (강도 12), 진단 소유자 권한 검증, Sentry 에러 핸들링
  - ❌ 만들지 않는 것: 공유 링크 조회/열람(CMD-SHARE-002), 미리보기 분리(CMD-SHARE-003), 비밀번호 검증(CMD-SHARE-004), 결제 관련 코드, NextAuth.js 코드, AES-256 암호화, Math.random() 사용
- **복잡도:** M
- **Wave:** 3 (ShareLink 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-009** (§4.1.2): "시스템은 진단 리포트 생성 완료 후 '공유 링크 생성' 버튼을 제공해야 하며, 클릭 시 고유 URL(UUID v4, entropy ≥ 128bit)을 생성하여 클립보드에 복사해야 한다. 링크 생성 응답 시간은 500ms 이내여야 한다."
- **REQ-FUNC-010** (§4.1.2): "공유 링크의 유효기간은 생성일로부터 30일 이상이어야 한다. 만료된 링크 접근 시 '이 링크는 만료되었습니다' 안내 페이지를 1초 이내에 로딩하고, 원 사용자에게 재생성 알림 푸시를 발송해야 한다. 만료된 링크에서 개인정보 노출은 0건이어야 한다."
- **REQ-NF-006** (§4.2.1): "공유 링크 생성 응답 시간 — ≤ 500ms"
- **REQ-NF-020** (§4.2.3): "공유 링크 보안 — URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션, 열람 로그 실시간 알림"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.2 배우자 공유 링크)

- **참여 Actor:** 사용자A(발신), Next.js Client Component, Server Action (createShareLink), Prisma ORM
- **핵심 메시지:**
  1. `UserA→Web: "공유 링크 생성" 클릭`
  2. `Web→SA: createShareLink(diagnosisId, password?)`
  3. `SA→SA: UUID v4 생성 (entropy ≥ 128bit)`
  4. `SA→Prisma: ShareLink create (expires_at = NOW()+30일)`
  5. `SA→Web: {share_url, expires_at} (≤ 500ms)`
  6. `Web→Web: 클립보드에 URL 복사`

### ERD 컬럼 (§6.2.3 SHARE_LINK)

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, NOT NULL | 공유 링크 고유 식별자 |
| `diagnosis_id` | UUID | FK → DIAGNOSIS.id, NOT NULL | 공유 대상 진단 |
| `unique_url` | VARCHAR(255) | UNIQUE, NOT NULL | 고유 URL (UUID v4, entropy ≥ 128bit) |
| `password_hash` | VARCHAR(255) | NULLABLE | 열람 비밀번호 해시 (선택 설정, bcrypt) |
| `view_count` | INTEGER | NOT NULL, DEFAULT 0 | 열람 횟수 |
| `free_preview_used` | BOOLEAN | NOT NULL, DEFAULT FALSE | 무료 미리보기 사용 여부 |
| `expires_at` | DATE | NOT NULL | 만료일 (생성일 + 30일) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성일시 |

### 선행 태스크 산출물 (배치 1·5)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-004 | `model ShareLink` Prisma 스키마 | `@prisma/client` | ShareLink CREATE 대상 |
| DB-004 | `calculateExpiresAt`, `generateShareLinkToken` | `@/lib/types/share-link-db` | 30일 만료 계산, UUID 토큰 생성 |
| API-003 | `CreateShareLinkRequest`, `CreateShareLinkResponse`, `ShareLinkErrorCode` | `@/lib/types/share-link` | 입출력 DTO, 에러 코드 |
| API-003 | `createShareLinkSchema` (Zod) | `@/lib/validators/share-link` | 서버 측 입력 유효성 검증 |
| API-006 | `createAppError`, `reportErrorToSentry` | `@/lib/helpers/app-error`, `@/lib/helpers/sentry-error` | 에러 생성 + Sentry 리포팅 |
| MOCK-002 | `MOCK_CREATE_SHARE_LINK` | `@/lib/mocks/share-link` | 테스트 기대값 참조 |
| CMD-AUTH-003 | `getCurrentUser` | `@/lib/auth/session` | 세션 검증, 진단 소유자 확인 |
| CMD-DIAG-004 | `saveDiagnosisResult` (진단 ID 생성) | — | 진단 ID를 받아 ShareLink 생성 |
| DB-001 | `prisma` 싱글톤 | `@/lib/db` | Prisma Client |
| INFRA-001 | `app/actions/share.ts` 파일 경로 | — | Server Action 위치 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `app/actions/share.ts`에 `createShareLink` Server Action 작성
  ```typescript
  'use server';
  import { randomUUID } from 'crypto';
  import bcrypt from 'bcryptjs';
  import { prisma } from '@/lib/db';
  import { getCurrentUser } from '@/lib/auth/session';
  import { createShareLinkSchema } from '@/lib/validators/share-link';
  import { createAppError } from '@/lib/helpers/app-error';
  import { reportErrorToSentry } from '@/lib/helpers/sentry-error';
  import { ShareLinkErrorCode } from '@/lib/types/share-link';
  import type { CreateShareLinkRequest, CreateShareLinkResponse } from '@/lib/types/share-link';
  import * as Sentry from '@sentry/nextjs';

  const SHARE_LINK_EXPIRY_DAYS = 30;
  const BCRYPT_ROUNDS = 12; // REQ-NF-020: 강도 ≥ 10, 권장 12

  export async function createShareLink(
    input: CreateShareLinkRequest
  ): Promise<CreateShareLinkResponse> {
    // 1. 입력 유효성 검증 (Zod)
    const parsed = createShareLinkSchema.parse(input);

    // 2. 세션 검증
    const currentUser = await getCurrentUser();

    // 3. 진단 소유자 검증
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: parsed.diagnosisId },
    });
    if (!diagnosis) {
      throw createAppError(ShareLinkErrorCode.DIAGNOSIS_NOT_FOUND);
    }
    // 게스트 세션도 공유 가능 (SRS 기본 허용)
    if (currentUser.type === 'authenticated' && diagnosis.userId !== currentUser.user.id) {
      throw createAppError(ShareLinkErrorCode.UNAUTHORIZED_ACCESS);
    }

    try {
      // 4. UUID v4 생성 (crypto.randomUUID — 128bit entropy)
      const uniqueUrl = randomUUID();

      // 5. 비밀번호 해싱 (선택, bcrypt 강도 12)
      const passwordHash = parsed.password
        ? await bcrypt.hash(parsed.password, BCRYPT_ROUNDS)
        : null;

      // 6. 만료일 계산 (30일)
      const expiresAt = new Date(Date.now() + SHARE_LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      // 7. DB INSERT
      const shareLink = await prisma.shareLink.create({
        data: {
          diagnosisId: parsed.diagnosisId,
          uniqueUrl,
          passwordHash,
          expiresAt,
        },
      });

      // 8. 응답 반환
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://donggung.vercel.app';
      return {
        shareUrl: `${appUrl}/share/${shareLink.uniqueUrl}`,
        expiresAt: shareLink.expiresAt.toISOString(),
        hasPassword: !!passwordHash,
      };
    } catch (error) {
      const appError = createAppError(ShareLinkErrorCode.LINK_NOT_FOUND, '공유 링크 생성 실패');
      reportErrorToSentry(appError, error instanceof Error ? error : undefined);
      throw appError;
    }
  }
  ```

- [ ] **3.2** UUID v4 entropy 검증 — `crypto.randomUUID()` 사용 확인
  - `grep -r "Math.random" app/actions/share.ts` → 0건
  - `grep -r "randomUUID\|uuidv4" app/actions/share.ts` → 1건 이상

- [ ] **3.3** bcrypt 강도 상수 정의 확인 — `BCRYPT_ROUNDS = 12` (REQ-NF-020: 강도 ≥ 10)
  ```typescript
  // bcrypt.hash(password, 12) 호출 — 약 200~300ms
  // Vercel 무료 티어 10초 timeout 내 충분히 여유
  ```

- [ ] **3.4** `lib/share/create-share-link.ts`에 비즈니스 로직 분리 (선택적 리팩토링)
  ```typescript
  export function buildShareUrl(baseUrl: string, uniqueUrl: string): string {
    return `${baseUrl}/share/${uniqueUrl}`;
  }

  export function calculateShareLinkExpiry(days: number = 30): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  ```

- [ ] **3.5** `__tests__/actions/create-share-link.spec.ts`에 Server Action 단위 테스트 작성 (Vitest)
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest';

  describe('createShareLink', () => {
    it('인증된 사용자 + 비밀번호 없이 → 공유 링크 생성 성공', async () => { /* ... */ });
    it('인증된 사용자 + 비밀번호 포함 → passwordHash 저장 + hasPassword: true', async () => { /* ... */ });
    it('진단 소유자 아닌 사용자 → UNAUTHORIZED_ACCESS 에러', async () => { /* ... */ });
    it('존재하지 않는 diagnosisId → DIAGNOSIS_NOT_FOUND 에러', async () => { /* ... */ });
    it('Zod 유효성 검증 실패 → ZodError 발생', async () => { /* ... */ });
    it('DB 에러 → Sentry.captureException 호출', async () => { /* ... */ });
  });
  ```

- [ ] **3.6** `__tests__/share/uuid-entropy.spec.ts`에 UUID v4 entropy 검증 테스트
  ```typescript
  import { randomUUID } from 'crypto';

  describe('UUID v4 entropy 검증 (REQ-FUNC-009)', () => {
    it('1000회 생성 시 충돌 0건', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        uuids.add(randomUUID());
      }
      expect(uuids.size).toBe(1000);
    });

    it('UUID v4 형식 검증 (RFC 4122)', () => {
      const uuid = randomUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });
  });
  ```

- [ ] **3.7** `__tests__/share/bcrypt-strength.spec.ts`에 bcrypt 강도 검증 테스트
  ```typescript
  import bcrypt from 'bcryptjs';

  describe('bcrypt 강도 검증 (REQ-NF-020)', () => {
    it('해시 salt rounds가 12 이상이다', async () => {
      const hash = await bcrypt.hash('test-password', 12);
      // bcrypt 해시에서 rounds 추출: $2b$12$...
      const rounds = parseInt(hash.split('$')[2], 10);
      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    it('bcrypt.compare로 원본 비밀번호 검증 성공', async () => {
      const hash = await bcrypt.hash('my-password', 12);
      const isValid = await bcrypt.compare('my-password', hash);
      expect(isValid).toBe(true);
    });

    it('잘못된 비밀번호로 bcrypt.compare 검증 실패', async () => {
      const hash = await bcrypt.hash('my-password', 12);
      const isValid = await bcrypt.compare('wrong-password', hash);
      expect(isValid).toBe(false);
    });
  });
  ```

- [ ] **3.8** `__tests__/share/create-share-link-perf.spec.ts`에 응답시간 검증 테스트
  ```typescript
  describe('createShareLink 응답시간 (REQ-NF-006)', () => {
    it('비밀번호 포함 생성 p95 ≤ 500ms', async () => {
      const start = Date.now();
      // bcrypt.hash(password, 12) 단독 측정
      await bcrypt.hash('test-password', 12);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500);
    });
  });
  ```

- [ ] **3.9** 'use server' 지시어 확인
  ```bash
  head -1 app/actions/share.ts  # → 'use server'
  ```

- [ ] **3.10** v1.3 정합성 검증 — 금지 항목 0건
  ```bash
  grep -ri "NextAuth\|nextauth\|next-auth" app/actions/share.ts  # → 0건
  grep -ri "payment\|Payment\|PAY_" app/actions/share.ts  # → 0건
  grep -ri "AES\|aes-256\|crypto.createCipher" app/actions/share.ts  # → 0건
  grep -ri "Math.random" app/actions/share.ts  # → 0건
  ```

- [ ] **3.11** MOCK-002 정합성 검증 — `MOCK_CREATE_SHARE_LINK` 응답 구조와 본 Server Action 응답 일치 확인
  - `CreateShareLinkResponse.shareUrl` ↔ MOCK `shareUrl` ✅
  - `CreateShareLinkResponse.expiresAt` ↔ MOCK `expiresAt` ✅
  - `CreateShareLinkResponse.hasPassword` ↔ MOCK `hasPassword` ✅

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 공유 링크 생성 성공 (비밀번호 없음)
- **Given** 인증된 사용자 + 유효한 `diagnosisId` (본인 소유 진단)
- **When** `createShareLink({ diagnosisId })` 호출
- **Then** `CreateShareLinkResponse` 반환: `shareUrl`이 `https://domain/share/{uuid}` 형식, `expiresAt`이 30일 후, `hasPassword: false`. DB에 ShareLink 1건 INSERT, `viewCount === 0`, `freePreviewUsed === false`

**AC-2 (정상):** 공유 링크 생성 성공 (비밀번호 포함)
- **Given** 인증된 사용자 + `password: 'secure123'`
- **When** `createShareLink({ diagnosisId, password: 'secure123' })` 호출
- **Then** DB의 `passwordHash`가 bcrypt 해시 형식 (`$2b$12$...`), `hasPassword: true`. `bcrypt.compare('secure123', passwordHash)` === `true`

**AC-3 (예외):** 존재하지 않는 diagnosisId → 에러
- **Given** `diagnosisId = 'nonexistent-uuid'`
- **When** `createShareLink({ diagnosisId })` 호출
- **Then** `ShareLinkErrorCode.DIAGNOSIS_NOT_FOUND` 에러, HTTP 404

**AC-4 (예외):** 진단 소유자가 아닌 사용자 → 권한 에러
- **Given** 사용자A의 진단에 대해 사용자B가 공유 링크 생성 시도
- **When** `createShareLink({ diagnosisId })` 호출 (사용자B 세션)
- **Then** `ShareLinkErrorCode.UNAUTHORIZED_ACCESS` 에러, HTTP 403

**AC-5 (보안):** UUID v4 entropy ≥ 128bit 검증
- **Given** `randomUUID()` 함수 사용
- **When** 1000회 UUID 생성
- **Then** 충돌 0건, 모든 UUID가 RFC 4122 v4 형식 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)

**AC-6 (보안):** bcrypt 강도 ≥ 10 검증
- **Given** `BCRYPT_ROUNDS = 12`
- **When** `bcrypt.hash(password, 12)` 호출
- **Then** 생성된 해시의 salt rounds가 12, `parseInt(hash.split('$')[2])` ≥ 10

**AC-7 (성능):** 응답시간 p95 ≤ 500ms
- **Given** bcrypt 강도 12 + DB INSERT + JSON 직렬화
- **When** `createShareLink()` 호출
- **Then** 전체 응답시간 ≤ 500ms (bcrypt ~200~300ms + DB ~100ms + 직렬화 ~50ms)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-006 | "공유 링크 생성 응답 시간 — ≤ 500ms" (§4.2.1) | bcrypt 강도 12 (약 200~300ms) + Prisma INSERT (약 100ms) = 총 ≤ 500ms. Vitest 성능 테스트로 검증 |
| REQ-NF-020 | "공유 링크 보안 — URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션" (§4.2.3) | `crypto.randomUUID()` 사용 (128bit). bcrypt 강도 12. 1000회 UUID 충돌 테스트 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | catch 블록에서 `reportErrorToSentry()` 호출. Vitest mock으로 Sentry 호출 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `app/actions/share.ts` (createShareLink Server Action — 'use server')
- `lib/share/create-share-link.ts` (비즈니스 로직 헬퍼 — buildShareUrl, calculateShareLinkExpiry)
- `__tests__/actions/create-share-link.spec.ts` (Server Action 단위 테스트 6개)
- `__tests__/share/uuid-entropy.spec.ts` (UUID v4 entropy 테스트 2개)
- `__tests__/share/bcrypt-strength.spec.ts` (bcrypt 강도 테스트 3개)
- `__tests__/share/create-share-link-perf.spec.ts` (응답시간 테스트 1개)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 태스크 시작 전 필요):

- **DB-004:** `model ShareLink` Prisma 스키마, `calculateExpiresAt`, `generateShareLinkToken`
- **DB-001:** `lib/db.ts` Prisma 싱글톤
- **API-003:** `CreateShareLinkRequest/Response`, `ShareLinkErrorCode`, `createShareLinkSchema`
- **API-006:** `createAppError`, `reportErrorToSentry`
- **CMD-AUTH-003:** `getCurrentUser` 세션 검증
- **CMD-DIAG-004:** `saveDiagnosisResult` — 진단 ID 생성 (선행 완료 필요)

### 후행 (이 태스크 완료 후 차례로 가능):

- **CMD-SHARE-002:** 공유 링크 조회 + 만료 검증
- **CMD-SHARE-003:** 무료 미리보기 1곳 분리 로직
- **CMD-SHARE-004:** 비밀번호 검증
- **QRY-SHARE-001:** SSR 공유 리포트 페이지
- **TEST-003:** 공유 링크 GWT 시나리오
- **TEST-004:** 공유 링크 보안 테스트

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/actions/create-share-link.spec.ts` — Vitest 6개 (정상 생성, 비밀번호 포함 생성, 소유자 아닌 접근, 존재하지 않는 진단, Zod 실패, Sentry 에러)
- **단위 테스트:** `__tests__/share/uuid-entropy.spec.ts` — Vitest 2개 (1000회 충돌 검증, RFC 4122 형식)
- **단위 테스트:** `__tests__/share/bcrypt-strength.spec.ts` — Vitest 3개 (강도 검증, 정상 비교, 오류 비교)
- **성능 테스트:** `__tests__/share/create-share-link-perf.spec.ts` — Vitest 1개 (p95 ≤ 500ms)
- **정적 검증:** `grep -ri "Math.random\|NextAuth\|payment\|AES" app/actions/share.ts` → 0건
- **타입 검증:** `npx tsc --noEmit` 통과
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **게스트의 공유 가능 여부:** SRS에 게스트 사용자의 공유 링크 생성 권한이 명확하지 않음. 현재 구현은 게스트도 공유 가능 (진단 결과가 있으면). CMD-AUTH-004의 GuestSession 구조와 연동 시 확정.
2. **UUID v4 vs unique_url:** DB-004에서 `id` (PK)와 `uniqueUrl` (공유 토큰)이 분리됨. 현재 구현은 `uniqueUrl`에 `randomUUID()`를 사용하여 외부 URL에 노출. PK `id`는 내부 참조용으로 Prisma `@default(uuid())` 자동 생성.
3. **bcrypt 강도 12 vs 10:** REQ-NF-020은 "강도 ≥ 10"을 요구. 본 구현은 보안 vs 성능 균형에서 12를 선택 (약 200~300ms). 500ms 예산 내 충분.
4. **NEXT_PUBLIC_APP_URL 환경변수:** 공유 URL의 base URL을 환경변수로 관리. 미설정 시 fallback `'https://donggung.vercel.app'`.
5. **동일 진단에 대한 중복 공유 링크:** SRS에 중복 생성 제한 언급 없음. 현재 구현은 동일 diagnosisId로 여러 ShareLink 생성 허용.
