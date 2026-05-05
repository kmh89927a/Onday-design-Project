---
name: Feature Task
title: "[Feature] QRY-SHARE-001: SSR 공유 리포트 페이지 데이터 (Next.js Server Component + OG 메타태그 + 데이터 출처 배지)"
labels: ['feature', 'priority:H', 'epic:ShareLink', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [QRY-SHARE-001] SSR 공유 리포트 페이지 — Next.js Server Component + generateMetadata (OG 메타태그) + 데이터 출처 배지
- **목적 (Why):**
  - **비즈니스:** 배우자(비회원)가 공유 링크를 클릭했을 때 앱 설치 없이 모바일 웹에서 즉시 진단 결과를 열람할 수 있는 SSR 페이지를 제공한다. OG 메타태그로 카카오톡 리치 프리뷰를 자동 생성하여 바이럴 효과를 극대화한다.
  - **사용자 가치:** 공유 링크 클릭 시 빠른 로딩(p95 ≤ 2,000ms)으로 진단 결과를 확인하고, 데이터 출처 배지로 정보의 신뢰성을 확인할 수 있다.
- **범위 (What):**
  - ✅ 만드는 것: `app/share/[uuid]/page.tsx` Server Component, `generateMetadata()` (OG 메타태그), 만료/비밀번호/유효 3분기 렌더링, 데이터 출처 배지 (`DataSourceBadge`), CMD-SHARE-002/003/004 통합 호출
  - ❌ 만들지 않는 것: UI 컴포넌트 구현(UI-007), 동적 OG 이미지 생성(/api/og), 결제 코드, NextAuth.js 코드
- **복잡도:** H
- **Wave:** 3 (ShareLink 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-011** (§4.1.2): "배우자(비회원)가 공유 링크를 클릭하면 앱 설치 없이 모바일 웹에서 리포트 전체를 열람하고 무료 미리보기 1곳을 확인할 수 있어야 한다. 3G 환경 기준 페이지 로딩 시간은 p95 ≤ 2,000ms여야 한다."
- **REQ-FUNC-012** (§4.1.2): "시스템은 리포트 내 모든 데이터 항목에 출처 배지(공공데이터·API명)와 최종 업데이트 일자를 표시해야 한다. 출처 투명도는 100%여야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms"
- **REQ-NF-003** (§4.2.1): "공유 링크 페이지 로딩 시간 — p95 ≤ 2,000ms (비회원·비설치 환경, 3G)"
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션."

### 시퀀스 다이어그램 (§6.3.2 — 전체 열람 플로우)

- **참여 Actor:** 배우자(수신, 비회원), SSR 공유 페이지 (`app/share/[uuid]/page.tsx`), Server Action, Prisma ORM
- **핵심 메시지:**
  1. `UserB→SSR: 공유 링크 클릭 (앱 설치 불필요)`
  2. `SSR→Prisma: ShareLink + Diagnosis 조회 (token 기반)`
  3. `분기: 만료 → ExpiredView / 비밀번호 → PasswordPromptView / 유효 → ShareReportView`
  4. `SSR→UserB: 리포트 SSR 렌더링 + 무료 미리보기 1곳 (≤ 2초)`

### ERD 컬럼 (§6.2.3 SHARE_LINK — 조회 대상)

| 필드명 | 타입 | 사용 |
|---|---|---|
| `unique_url` | VARCHAR(255) | URL 파라미터 매칭 |
| `expires_at` | DATE | 만료 검증 |
| `password_hash` | VARCHAR(255) | 비밀번호 보호 분기 |
| `view_count` | INTEGER | 열람 카운트 |

### 선행 태스크 산출물 (배치 1·5·6)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| CMD-SHARE-002 | `getShareLinkData()` | `@/lib/share/get-share-link` | 링크 조회 + 만료 검증 |
| CMD-SHARE-002 | `getShareLinkMeta()` | `@/lib/share/get-share-link-meta` | OG 메타태그용 경량 조회 |
| CMD-SHARE-003 | `splitForPreview()` | `@/lib/share/preview-splitter` | 미리보기 1곳 분리 |
| CMD-SHARE-003 | `LockedCandidateDTO`, `PreviewSplitResult` | `@/lib/types/share-preview` | 잠금 후보 타입 |
| CMD-AUTH-003 | `getCurrentUser` | `@/lib/auth/session` | 로그인 여부 판단 |
| API-003 | `DataSourceDTO`, `GetReportResponse` | `@/lib/types/share-link` | 응답 DTO |
| MOCK-002 | `MOCK_DATA_SOURCES` | `@/lib/mocks/share-link` | 데이터 출처 Mock |
| INFRA-001 | `app/share/[uuid]/page.tsx` 경로 | — | Server Component 위치 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `app/share/[uuid]/page.tsx`에 Server Component 작성 (지시어 없음 = 기본 Server Component)
  ```typescript
  // app/share/[uuid]/page.tsx
  // Server Component — 'use client'/'use server' 지시어 없음
  import { notFound } from 'next/navigation';
  import { getShareLinkData } from '@/lib/share/get-share-link';
  import { splitForPreview } from '@/lib/share/preview-splitter';
  import { getCurrentUser } from '@/lib/auth/session';
  import { mapCandidateToDTO } from '@/lib/mappers/diagnosis-mapper';
  import type { DataSourceBadge } from '@/lib/types/share-report';

  // 데이터 출처 배지 (REQ-FUNC-012)
  const DATA_SOURCES: DataSourceBadge[] = [
    { source: '카카오 모빌리티', retrievedAt: new Date().toISOString(), trustLevel: 'official' },
    { source: '국가공간정보포털', retrievedAt: new Date().toISOString(), trustLevel: 'official' },
  ];

  interface SharePageProps {
    params: { uuid: string };
  }

  export default async function SharePage({ params }: SharePageProps) {
    // 1. 공유 링크 데이터 조회 (CMD-SHARE-002)
    const linkData = await getShareLinkData(params.uuid);

    // 2. 존재하지 않음 → 404
    if (!linkData) notFound();

    // 3. 만료 → ExpiredView
    if (linkData.expired) {
      return <ExpiredView />;
    }

    // 4. 비밀번호 보호 → PasswordPromptView
    if (linkData.requiresPassword) {
      return <PasswordPromptView linkId={params.uuid} />;
    }

    // 5. 로그인 여부 판단 (CMD-AUTH-003)
    const currentUser = await getCurrentUser();
    const isAuthenticated = currentUser.type === 'authenticated';

    // 6. 미리보기 분리 (CMD-SHARE-003)
    const candidates = linkData.candidates.map(c => mapCandidateToDTO(c));
    const { previewCandidate, lockedCandidates, ctaMessage } = splitForPreview(
      candidates,
      isAuthenticated
    );

    // 7. 렌더링
    return (
      <ShareReportView
        preview={previewCandidate}
        locked={lockedCandidates}
        ctaMessage={ctaMessage}
        dataSources={DATA_SOURCES}
        diagnosis={{
          mode: linkData.diagnosis.mode,
          createdAt: linkData.diagnosis.createdAt.toISOString(),
        }}
      />
    );
  }
  ```

- [ ] **3.2** `app/share/[uuid]/page.tsx`에 `generateMetadata()` export (OG 메타태그 — REQ-FUNC-012)
  ```typescript
  import type { Metadata } from 'next';
  import { getShareLinkMeta } from '@/lib/share/get-share-link-meta';

  export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
    const meta = await getShareLinkMeta(params.uuid);
    if (!meta) {
      return { title: '공유 링크를 찾을 수 없습니다' };
    }

    const title = '동네 궁합 진단 결과를 확인해보세요';
    const description = '두 직장 동선이 만나는 최적의 동네를 확인해보세요. 무료 미리보기 1곳 제공!';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [`/api/og?linkId=${params.uuid}`], // 동적 OG 이미지 (Open Questions)
        type: 'website',
        siteName: '내 하루 동선 맞춤 동네 궁합 진단기',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  }
  ```

- [ ] **3.3** `lib/types/share-report.ts`에 DataSourceBadge 타입 정의
  ```typescript
  // lib/types/share-report.ts
  export interface DataSourceBadge {
    source: '카카오 모빌리티' | '국가공간정보포털';
    retrievedAt: string; // ISO date
    trustLevel: 'official' | 'aggregated';
  }
  ```

- [ ] **3.4** `app/share/[uuid]/_components/expired-view.tsx`에 만료 안내 컴포넌트 placeholder
  ```typescript
  // Server Component — 지시어 없음
  export function ExpiredView() {
    return (
      <main>
        <h1>이 링크는 만료되었습니다</h1>
        <p>공유 링크의 유효기간(30일)이 지났습니다. 원 사용자에게 링크 재생성을 요청해주세요.</p>
      </main>
    );
  }
  ```

- [ ] **3.5** `app/share/[uuid]/_components/password-prompt-view.tsx`에 비밀번호 입력 컴포넌트 placeholder
  ```typescript
  'use client';
  // Client Component — 사용자 입력 처리
  export function PasswordPromptView({ linkId }: { linkId: string }) {
    // verifySharePassword Server Action 호출
    // 검증 성공 시 페이지 리로드 또는 데이터 반환
    return (
      <main>
        <h1>비밀번호를 입력해주세요</h1>
        <form>
          <input type="password" placeholder="비밀번호" />
          <button type="submit">확인</button>
        </form>
      </main>
    );
  }
  ```

- [ ] **3.6** `app/share/[uuid]/_components/share-report-view.tsx`에 리포트 뷰 placeholder
  ```typescript
  // Server Component — 지시어 없음
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';
  import type { LockedCandidateDTO } from '@/lib/types/share-preview';
  import type { DataSourceBadge } from '@/lib/types/share-report';

  interface ShareReportViewProps {
    preview: CandidateAreaDTO;
    locked: LockedCandidateDTO[];
    ctaMessage: string | null;
    dataSources: DataSourceBadge[];
    diagnosis: { mode: string; createdAt: string };
  }

  export function ShareReportView({ preview, locked, ctaMessage, dataSources, diagnosis }: ShareReportViewProps) {
    return (
      <main>
        <h1>동네 궁합 진단 결과</h1>
        {/* 미리보기 1곳 전체 정보 */}
        <section id="preview-candidate">
          <h2>{preview.name}</h2>
          <p>통근A: {preview.commuteA.durationMinutes}분</p>
          <p>통근B: {preview.commuteB.durationMinutes}분</p>
          <p>점수: {preview.score}점</p>
        </section>
        {/* 잠금 후보 */}
        {locked.map((c) => (
          <section key={c.rank} id={`locked-candidate-${c.rank}`}>
            <h3>{c.name} 🔒</h3>
            <p>순위: {c.rank}</p>
          </section>
        ))}
        {/* CTA */}
        {ctaMessage && <p id="cta-message">{ctaMessage}</p>}
        {/* 데이터 출처 배지 */}
        <footer id="data-sources">
          {dataSources.map((ds) => (
            <span key={ds.source}>{ds.source} ({ds.trustLevel})</span>
          ))}
        </footer>
      </main>
    );
  }
  ```

- [ ] **3.7** `__tests__/pages/share-page.spec.ts`에 Server Component 통합 테스트
  ```typescript
  describe('SharePage Server Component', () => {
    it('유효한 링크 → ShareReportView 렌더링', async () => { /* ... */ });
    it('만료 링크 → ExpiredView 렌더링', async () => { /* ... */ });
    it('비밀번호 보호 → PasswordPromptView 렌더링', async () => { /* ... */ });
    it('존재하지 않는 링크 → notFound() 호출', async () => { /* ... */ });
    it('비로그인 → 미리보기 1곳 + 잠금 후보', async () => { /* ... */ });
    it('로그인 → 전체 후보 노출', async () => { /* ... */ });
  });
  ```

- [ ] **3.8** `__tests__/pages/share-metadata.spec.ts`에 OG 메타태그 테스트
  ```typescript
  describe('generateMetadata (OG 메타태그)', () => {
    it('유효 링크 → title, description, openGraph 포함', async () => { /* ... */ });
    it('존재하지 않는 링크 → fallback title', async () => { /* ... */ });
    it('openGraph.images에 /api/og?linkId= 포함', async () => { /* ... */ });
    it('twitter.card === summary_large_image', async () => { /* ... */ });
  });
  ```

- [ ] **3.9** Server Component 지시어 검증
  ```bash
  grep -c "'use client'\|'use server'" app/share/[uuid]/page.tsx  # → 0건
  # 기본 Server Component
  ```

- [ ] **3.10** 응답시간 ≤ 1,500ms 목표 — Prisma include 단일 쿼리 검증
  ```typescript
  // getShareLinkData()의 Prisma findUnique + include = 단일 SQL JOIN
  // + splitForPreview() = in-memory 연산 (< 1ms)
  // + generateMetadata() = 별도 경량 쿼리 (~50ms)
  // 총 ≤ 300ms DB + SSR 렌더링 ≤ 1,200ms
  ```

- [ ] **3.11** v1.3 정합성 검증
  ```bash
  grep -ri "NextAuth\|payment\|AES" app/share/  # → 0건
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** SSR 렌더링 — 유효 링크 + 비로그인
- **Given** 유효한 ShareLink + 비로그인 사용자
- **When** `GET /share/{uuid}` 접근
- **Then** Server Component로 SSR 렌더링, 미리보기 1곳 전체 + 나머지 잠금, CTA 메시지 표시, 데이터 출처 배지 표시

**AC-2 (정상):** SSR 렌더링 — 유효 링크 + 로그인
- **Given** 유효한 ShareLink + 로그인 사용자
- **When** `GET /share/{uuid}` 접근
- **Then** 전체 후보 노출 (잠금 0건), CTA 메시지 null

**AC-3 (예외):** 만료 링크 → ExpiredView
- **Given** 만료된 ShareLink (`expiresAt` < now)
- **When** `GET /share/{uuid}` 접근
- **Then** `<ExpiredView />` 렌더링, 개인정보 노출 0건, HTTP 200 (SSR 페이지 자체는 렌더링)

**AC-4 (예외):** 비밀번호 보호 → PasswordPromptView
- **Given** `passwordHash`가 존재하는 ShareLink
- **When** `GET /share/{uuid}` 접근
- **Then** `<PasswordPromptView />` 렌더링, 진단 데이터 미노출

**AC-5 (정상):** OG 메타태그 — 카카오톡 리치 프리뷰
- **Given** 유효한 ShareLink
- **When** `generateMetadata()` 호출
- **Then** `openGraph.title`, `openGraph.description`, `openGraph.images` 포함, `twitter.card === 'summary_large_image'`

**AC-6 (성능):** SSR 로딩 p95 ≤ 1,500ms
- **Given** 유효한 ShareLink
- **When** Server Component 렌더링
- **Then** Prisma 쿼리(~200ms) + splitForPreview(~1ms) + SSR 렌더링(~800ms) = 총 ≤ 1,500ms

**AC-7 (정상):** 데이터 출처 배지 표시
- **Given** 진단 결과에 카카오 모빌리티, 국가공간정보포털 데이터 사용
- **When** ShareReportView 렌더링
- **Then** DataSourceBadge 2개 이상 표시, `trustLevel` ('official'/'aggregated') 포함

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) — 변형: 조회 응답시간 ≤ 1,500ms | Prisma include 단일 쿼리 + Server Component SSR. Lighthouse/WebPageTest로 3G 환경 측정 |
| REQ-NF-003 | "공유 링크 페이지 로딩 시간 — p95 ≤ 2,000ms (비회원·비설치 환경, 3G)" (§4.2.1) | SSR로 HTML 스트리밍. 3G 환경 Lighthouse 측정 |
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션" (§4.2.3) | `getCurrentUser()` 호출로 세션 확인. 비로그인 시에도 페이지 접근 허용 (공유 링크는 public) |

---

## 6. 📦 Deliverables (산출물 명시)

- `app/share/[uuid]/page.tsx` (Server Component + generateMetadata)
- `app/share/[uuid]/_components/expired-view.tsx` (만료 안내)
- `app/share/[uuid]/_components/password-prompt-view.tsx` (비밀번호 입력 — Client Component)
- `app/share/[uuid]/_components/share-report-view.tsx` (리포트 뷰 — Server Component)
- `lib/types/share-report.ts` (DataSourceBadge 타입)
- `__tests__/pages/share-page.spec.ts` (Server Component 통합 테스트 6개)
- `__tests__/pages/share-metadata.spec.ts` (OG 메타태그 테스트 4개)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **CMD-SHARE-002:** `getShareLinkData()`, `getShareLinkMeta()` — 데이터 조회
- **CMD-SHARE-003:** `splitForPreview()` — 미리보기 분리
- **CMD-SHARE-004:** `verifySharePassword()` — 비밀번호 검증 (PasswordPromptView에서 호출)
- **CMD-AUTH-003:** `getCurrentUser()` — 로그인 여부 판단
- **DB-004:** `model ShareLink` Prisma 스키마
- **API-003:** `DataSourceDTO`, `GetReportResponse`

### 후행:
- **UI-007:** SSR 공유 리포트 페이지 UI — 본 태스크의 구조를 기반으로 상세 UI 구현
- **TEST-003:** 공유 링크 GWT 시나리오
- **TEST-010:** E2E 통합 시나리오 (Playwright)

---

## 8. 🧪 Test Plan (검증 절차)

- **통합 테스트:** `__tests__/pages/share-page.spec.ts` — Vitest 6개 (유효/만료/비밀번호/404/비로그인/로그인)
- **단위 테스트:** `__tests__/pages/share-metadata.spec.ts` — Vitest 4개 (OG title/description/images/twitter)
- **E2E 테스트:** Playwright (`e2e/share-page.spec.ts`) — 실제 SSR 렌더링 검증, Lighthouse OG 메타태그 확인
- **성능 테스트:** Lighthouse 3G throttling — p95 ≤ 2,000ms
- **정적 검증:** `grep -ri "NextAuth\|payment" app/share/` → 0건
- **Server Component 검증:** `grep "'use client'\|'use server'" app/share/[uuid]/page.tsx` → 0건
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **동적 OG 이미지 생성 (`/api/og`):** `generateMetadata`에서 `images: ['/api/og?linkId=...']` 참조. 실제 OG 이미지를 생성하는 Route Handler (`app/api/og/route.tsx`)는 별도 태스크로 분리 권장. Next.js `ImageResponse` (Satori) 또는 Vercel OG 사용.
2. **Edge Runtime 적용 여부:** `app/share/[uuid]/page.tsx`에 `export const runtime = 'edge'`를 설정하면 전 세계 Edge에서 SSR 가능. 단 Prisma는 Edge에서 제한적 (Prisma Accelerate 필요). MVP에서는 Node.js runtime 유지, 성능 이슈 시 Edge 검토.
3. **PasswordPromptView의 상태 관리:** 비밀번호 검증 성공 후 페이지 전체를 리로드할지, Client Component에서 상태를 업데이트할지 결정 필요. 현재는 `'use client'`로 Client Component 처리.
4. **SEO 영향:** 공유 링크 페이지는 SSR이므로 검색엔진 크롤러가 접근 가능. robots.txt에서 `/share/` 경로를 noindex로 설정할지 — 바이럴 관점에서 index 허용이 유리할 수 있음.
5. **만료 페이지 HTTP 상태코드:** SSR에서 HTTP 410 반환이 어려움 (Next.js Server Component는 기본 200). `headers()` API 또는 Route Handler 조합으로 410 반환 검토 — 현재는 ExpiredView UI로 대체.
