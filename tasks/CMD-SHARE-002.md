---
name: Feature Task
title: "[Feature] CMD-SHARE-002: 공유 링크 조회 + 만료 검증 (lazy 검증 + 만료 시 410 Gone)"
labels: ['feature', 'priority:M', 'epic:ShareLink', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-SHARE-002] 공유 링크 조회 + 만료 검증 — lazy 검증 + 만료 시 HTTP 410 Gone
- **목적 (Why):**
  - **비즈니스:** 공유 링크 클릭 시 유효성을 실시간 검증하고, 유효한 링크는 데이터를 반환하며 만료된 링크는 안전하게 차단한다. Cron 스케줄러 없이 조회 시점에 만료를 lazy 검증하여 인프라 복잡도를 최소화한다.
  - **사용자 가치:** 배우자가 공유 링크를 클릭했을 때 즉시 유효성이 확인되고, 만료된 경우 명확한 안내를 받는다.
- **범위 (What):**
  - ✅ 만드는 것: `getShareLinkData()` 조회 함수, lazy 만료 검증 로직, HTTP 410 (만료) vs 404 (없음) 구분, `requiresPassword` 플래그 반환, `previewCount` (viewCount) 증가 UPDATE, Sentry 에러 핸들링
  - ❌ 만들지 않는 것: 비밀번호 검증 로직(CMD-SHARE-004), 미리보기 분리(CMD-SHARE-003), SSR 페이지(QRY-SHARE-001), Cron 만료 스케줄러, 결제 코드, NextAuth.js 코드
- **복잡도:** M
- **Wave:** 3 (ShareLink 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-010** (§4.1.2): "공유 링크의 유효기간은 생성일로부터 30일 이상이어야 한다. 만료된 링크 접근 시 '이 링크는 만료되었습니다' 안내 페이지를 1초 이내에 로딩하고, 원 사용자에게 재생성 알림 푸시를 발송해야 한다. 만료된 링크에서 개인정보 노출은 0건이어야 한다."
- **REQ-FUNC-011** (§4.1.2): "배우자(비회원)가 공유 링크를 클릭하면 앱 설치 없이 모바일 웹에서 리포트 전체를 열람하고 무료 미리보기 1곳을 확인할 수 있어야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms"
- **REQ-NF-021** (§4.2.3): "비인가 제3자 공유 링크 개인정보 접근 차단 — 비인가 접근 시 개인정보 노출 0건"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.2 — 열람 부분)

- **참여 Actor:** 배우자(수신, 비회원), SSR 공유 페이지, Prisma ORM
- **핵심 메시지:**
  1. `UserB→SSR: 공유 링크 클릭`
  2. `SSR→Prisma: ShareLink + Diagnosis 조회 (token 기반)`
  3. `alt 만료: SSR→UserB: "이 링크는 만료되었습니다" (≤ 1초, 개인정보 0건)`
  4. `alt 비밀번호: SSR→UserB: 비밀번호 입력 프롬프트`
  5. `alt 유효: SSR→Prisma: view_count 증가`

### 선행 태스크 산출물 (배치 1·5)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-004 | `model ShareLink` Prisma 스키마 | `@prisma/client` | ShareLink 조회 대상 |
| DB-004 | `isShareLinkExpired()` | `@/lib/types/share-link-db` | 만료 여부 런타임 판단 |
| API-003 | `ShareLinkErrorCode`, `ShareLinkMetaDTO`, `GetReportResponse` | `@/lib/types/share-link` | 에러 코드, 응답 DTO |
| API-003 | `SHARE_LINK_ERROR_MAP` | `@/lib/constants/share-link-errors` | HTTP 상태코드 매핑 (410/404) |
| API-006 | `createAppError`, `reportErrorToSentry` | `@/lib/helpers/app-error`, `@/lib/helpers/sentry-error` | 에러 생성 + Sentry |
| MOCK-002 | `MOCK_SHARE_LINK_META_VALID`, `MOCK_SHARE_LINK_META_EXPIRED` | `@/lib/mocks/share-link` | 테스트 기대값 |
| DB-001 | `prisma` 싱글톤 | `@/lib/db` | Prisma Client |
| CMD-SHARE-001 | ShareLink CREATE 완료 | — | 조회 대상 ShareLink 레코드 존재 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/share/get-share-link.ts`에 공유 링크 조회 + 만료 검증 함수 작성
  ```typescript
  import { prisma } from '@/lib/db';
  import { createAppError } from '@/lib/helpers/app-error';
  import { reportErrorToSentry } from '@/lib/helpers/sentry-error';
  import { ShareLinkErrorCode } from '@/lib/types/share-link';
  import * as Sentry from '@sentry/nextjs';

  export interface ShareLinkQueryResult {
    expired: boolean;
    requiresPassword: boolean;
    link: {
      id: string;
      uniqueUrl: string;
      diagnosisId: string;
      viewCount: number;
      freePreviewUsed: boolean;
      expiresAt: Date;
      passwordHash: string | null;
    };
    diagnosis: {
      id: string;
      userId: string;
      status: string;
      filters: any;
      mode: string;
      createdAt: Date;
    };
    candidates: Array<{
      id: string;
      name: string;
      coordLat: number;
      coordLng: number;
      commuteAJson: any;
      commuteBJson: any;
      score: number;
      rank: number;
    }>;
  }

  export async function getShareLinkData(
    uuid: string
  ): Promise<ShareLinkQueryResult | null> {
    try {
      // 1. ShareLink + Diagnosis + CandidateArea 한 번에 조회 (Prisma include)
      const link = await prisma.shareLink.findUnique({
        where: { uniqueUrl: uuid },
        include: {
          diagnosis: {
            include: {
              candidates: { orderBy: { rank: 'asc' } },
            },
          },
        },
      });

      // 2. 존재하지 않음 → null (호출자가 404 처리)
      if (!link) return null;

      // 3. Lazy 만료 검증 — Cron 없이 조회 시점에 판단
      const expired = link.expiresAt < new Date();

      if (expired) {
        // 만료 시 개인정보 노출 0건 — 진단 데이터 미반환
        return {
          expired: true,
          requiresPassword: false,
          link: {
            id: link.id,
            uniqueUrl: link.uniqueUrl,
            diagnosisId: link.diagnosisId,
            viewCount: link.viewCount,
            freePreviewUsed: link.freePreviewUsed,
            expiresAt: link.expiresAt,
            passwordHash: null, // 만료 시 해시 미노출
          },
          diagnosis: {
            id: link.diagnosis.id,
            userId: link.diagnosis.userId,
            status: link.diagnosis.status,
            filters: {},
            mode: link.diagnosis.mode,
            createdAt: link.diagnosis.createdAt,
          },
          candidates: [], // 만료 시 후보 데이터 미반환
        };
      }

      // 4. 비밀번호 보호 처리
      const requiresPassword = !!link.passwordHash;

      // 5. viewCount 증가 (비밀번호 보호 시에는 검증 후 증가 — CMD-SHARE-004에서 처리)
      if (!requiresPassword) {
        await prisma.shareLink.update({
          where: { id: link.id },
          data: { viewCount: { increment: 1 } },
        });
      }

      return {
        expired: false,
        requiresPassword,
        link: {
          id: link.id,
          uniqueUrl: link.uniqueUrl,
          diagnosisId: link.diagnosisId,
          viewCount: link.viewCount + (requiresPassword ? 0 : 1),
          freePreviewUsed: link.freePreviewUsed,
          expiresAt: link.expiresAt,
          passwordHash: link.passwordHash,
        },
        diagnosis: {
          id: link.diagnosis.id,
          userId: link.diagnosis.userId,
          status: link.diagnosis.status,
          filters: link.diagnosis.filters,
          mode: link.diagnosis.mode,
          createdAt: link.diagnosis.createdAt,
        },
        candidates: requiresPassword ? [] : link.diagnosis.candidates.map(c => ({
          id: c.id,
          name: c.name,
          coordLat: c.coordLat,
          coordLng: c.coordLng,
          commuteAJson: c.commuteAJson,
          commuteBJson: c.commuteBJson,
          score: c.score,
          rank: c.rank,
        })),
      };
    } catch (error) {
      const appError = createAppError(ShareLinkErrorCode.LINK_NOT_FOUND, '공유 링크 조회 실패');
      reportErrorToSentry(appError, error instanceof Error ? error : undefined);
      throw appError;
    }
  }
  ```

- [ ] **3.2** `lib/share/get-share-link-meta.ts`에 OG 메타태그용 경량 조회 함수 작성
  ```typescript
  export async function getShareLinkMeta(uuid: string) {
    const link = await prisma.shareLink.findUnique({
      where: { uniqueUrl: uuid },
      include: { diagnosis: { select: { mode: true, createdAt: true } } },
    });
    if (!link) return null;
    return { link, diagnosis: link.diagnosis };
  }
  ```

- [ ] **3.3** HTTP 상태코드 분기 헬퍼 작성
  ```typescript
  // lib/share/share-link-status.ts
  export function getShareLinkHttpStatus(result: ShareLinkQueryResult | null): number {
    if (!result) return 404;           // 존재하지 않음
    if (result.expired) return 410;     // 만료 (Gone)
    return 200;                         // 유효
  }
  ```

- [ ] **3.4** `__tests__/share/get-share-link.spec.ts`에 단위 테스트 작성 (Vitest)
  ```typescript
  describe('getShareLinkData', () => {
    it('유효한 uniqueUrl → 데이터 반환 + viewCount 증가', async () => { /* ... */ });
    it('존재하지 않는 uniqueUrl → null 반환', async () => { /* ... */ });
    it('만료된 링크 → expired: true + candidates 빈 배열', async () => { /* ... */ });
    it('비밀번호 보호 링크 → requiresPassword: true + candidates 빈 배열', async () => { /* ... */ });
    it('만료된 링크에서 개인정보(filters, candidates) 미반환', async () => { /* ... */ });
    it('DB 에러 → Sentry.captureException 호출', async () => { /* ... */ });
  });
  ```

- [ ] **3.5** `__tests__/share/share-link-status.spec.ts`에 HTTP 상태코드 테스트
  ```typescript
  describe('getShareLinkHttpStatus', () => {
    it('null → 404 (Not Found)', () => { /* ... */ });
    it('expired: true → 410 (Gone)', () => { /* ... */ });
    it('expired: false → 200 (OK)', () => { /* ... */ });
  });
  ```

- [ ] **3.6** viewCount atomic UPDATE 검증
  ```typescript
  // Prisma의 { increment: 1 }은 SQL `SET view_count = view_count + 1`로 번역
  // 트랜잭션 불필요 (atomic UPDATE 충분)
  ```

- [ ] **3.7** MOCK-002 정합성 검증
  - `MOCK_SHARE_LINK_META_VALID.isExpired === false` ↔ `getShareLinkData().expired === false` ✅
  - `MOCK_SHARE_LINK_META_EXPIRED.isExpired === true` ↔ `getShareLinkData().expired === true` ✅
  - `MOCK_SHARE_ERROR_EXPIRED.httpStatus === 410` ↔ `getShareLinkHttpStatus(expired) === 410` ✅
  - `MOCK_SHARE_ERROR_NOT_FOUND.httpStatus === 404` ↔ `getShareLinkHttpStatus(null) === 404` ✅

- [ ] **3.8** API-006 adaptLegacyMap 활용 검증
  - `SHARE_LINK_ERROR_MAP[ShareLinkErrorCode.LINK_EXPIRED].httpStatus === 410` ✅
  - `SHARE_LINK_ERROR_MAP[ShareLinkErrorCode.LINK_NOT_FOUND].httpStatus === 404` ✅

- [ ] **3.9** v1.3 정합성 검증
  ```bash
  grep -ri "NextAuth\|payment\|AES\|Math.random" lib/share/get-share-link.ts  # → 0건
  ```

- [ ] **3.10** Prisma include 최적화 — N+1 방지 확인
  ```typescript
  // findUnique + include: { diagnosis: { include: { candidates } } }
  // = 단일 SQL JOIN 쿼리 (N+1 아님)
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 유효한 공유 링크 조회 성공
- **Given** DB에 유효한 ShareLink (`expiresAt` > now, `passwordHash` null)
- **When** `getShareLinkData(uniqueUrl)` 호출
- **Then** `expired === false`, `requiresPassword === false`, `candidates.length ≥ 1`, `viewCount`가 이전 대비 +1

**AC-2 (예외):** 만료된 링크 → HTTP 410 Gone
- **Given** DB에 만료된 ShareLink (`expiresAt` < now)
- **When** `getShareLinkData(uniqueUrl)` 호출
- **Then** `expired === true`, `candidates === []` (개인정보 노출 0건), `getShareLinkHttpStatus() === 410`

**AC-3 (예외):** 존재하지 않는 링크 → null (HTTP 404)
- **Given** DB에 해당 `uniqueUrl`이 없음
- **When** `getShareLinkData(uniqueUrl)` 호출
- **Then** 반환값 `null`, `getShareLinkHttpStatus(null) === 404`

**AC-4 (정상):** 비밀번호 보호 링크 → 데이터 미반환
- **Given** DB에 `passwordHash`가 존재하는 ShareLink
- **When** `getShareLinkData(uniqueUrl)` 호출
- **Then** `requiresPassword === true`, `candidates === []` (비밀번호 검증 전 데이터 미반환), `viewCount` 미증가

**AC-5 (경계):** viewCount atomic INCREMENT
- **Given** 유효한 ShareLink with `viewCount = 5`
- **When** `getShareLinkData()` 호출 (비밀번호 없는 링크)
- **Then** DB의 `viewCount === 6` (Prisma `{ increment: 1 }` atomic UPDATE)

**AC-6 (보안):** 만료 링크에서 개인정보 노출 0건
- **Given** 만료된 ShareLink
- **When** `getShareLinkData()` 반환값 검사
- **Then** `candidates === []`, `diagnosis.filters === {}`, `link.passwordHash === null`

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) — 조회 응답시간 적용 | Prisma `findUnique` + `include` 단일 쿼리 ≤ 200ms 목표. `@@index([uniqueUrl])` 인덱스 활용 |
| REQ-NF-021 | "비인가 접근 시 개인정보 노출 0건" (§4.2.3) | 만료 시 `candidates: []`, `filters: {}` 반환. Vitest에서 만료 시나리오 검증 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | catch 블록에서 `reportErrorToSentry()` 호출. Vitest mock 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/share/get-share-link.ts` (getShareLinkData 조회 + lazy 만료 검증)
- `lib/share/get-share-link-meta.ts` (OG 메타태그용 경량 조회)
- `lib/share/share-link-status.ts` (HTTP 상태코드 헬퍼)
- `__tests__/share/get-share-link.spec.ts` (단위 테스트 6개)
- `__tests__/share/share-link-status.spec.ts` (HTTP 상태코드 테스트 3개)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **DB-004:** `model ShareLink` Prisma 스키마, `@@index([uniqueUrl])`
- **DB-003:** `model Diagnosis` + `CandidateArea` (include 대상)
- **DB-001:** `lib/db.ts` Prisma 싱글톤
- **API-003:** `ShareLinkErrorCode`, `ShareLinkMetaDTO`
- **API-006:** `createAppError`, `reportErrorToSentry`
- **CMD-SHARE-001:** ShareLink CREATE 완료 (조회 대상 존재)

### 후행:
- **CMD-SHARE-003:** 무료 미리보기 분리 — `getShareLinkData()` 결과를 splitForPreview()에 전달
- **CMD-SHARE-004:** 비밀번호 검증 — `requiresPassword` 분기 처리
- **QRY-SHARE-001:** SSR 공유 리포트 페이지 — `getShareLinkData()` 호출

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/share/get-share-link.spec.ts` — Vitest 6개 (유효 조회, null 반환, 만료 검증, 비밀번호 보호, 개인정보 미반환, Sentry)
- **단위 테스트:** `__tests__/share/share-link-status.spec.ts` — Vitest 3개 (404/410/200)
- **Prisma 통합 테스트:** Prisma test client로 viewCount atomic increment 검증
- **정적 검증:** `grep -ri "NextAuth\|payment" lib/share/` → 0건
- **타입 검증:** `npx tsc --noEmit` 통과
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **만료 Cron 스케줄러 도입 여부:** 현재 lazy 검증으로 구현. 만료 레코드가 축적되면 DB 용량 이슈 가능. 향후 Cron으로 오래된 만료 링크 물리 삭제 검토 — 별도 인프라 태스크.
2. **viewCount 증가 시점:** 비밀번호 보호 링크에서는 검증 성공 후 증가해야 함 → CMD-SHARE-004에서 viewCount 증가 호출.
3. **OG 메타태그 조회 성능:** `getShareLinkMeta()`는 경량 조회이나, generateMetadata에서 매번 DB 호출. Edge runtime 또는 캐싱 적용 여부 — QRY-SHARE-001에서 결정.
4. **동시 viewCount 증가:** Prisma `{ increment: 1 }`은 atomic SQL로 동시성 안전. 별도 락 불필요.
