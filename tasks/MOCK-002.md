---
name: Feature Task
title: "[Feature] MOCK-002: 공유 링크 열람 Mock 데이터 (유효/만료/비밀번호 설정 시나리오)"
labels: ['feature', 'priority:L', 'epic:Mock & Fixture', 'wave:2']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [MOCK-002] 공유 링크 열람 Mock 데이터 (유효/만료/비밀번호 설정 시나리오)
- **목적 (Why):**
  - **비즈니스:** 배우자 공유 링크 관련 UI 컴포넌트(UI-006, UI-007, UI-008)가 백엔드 공유 로직 완성 전에 병렬 개발될 수 있도록, 유효·만료·비밀번호 보호 3가지 시나리오의 Mock 데이터를 제공한다.
  - **사용자 가치:** SSR 공유 리포트 페이지·유료 전환 모달·만료 안내 페이지가 실 데이터 없이도 완전한 UI 검증이 가능해져, 공유 경험의 완성도를 사전에 확보한다.
- **범위 (What):**
  - ✅ 만드는 것: 유효 공유 링크 Mock, 만료 공유 링크 Mock, 비밀번호 설정 Mock, 무료 미리보기 소진 Mock, 에러 시나리오 Mock
  - ❌ 만들지 않는 것: 공유 링크 CRUD 로직(CMD-SHARE 범위), 결제 관련 Mock, 푸시 알림 로직
- **복잡도:** L
- **Wave:** 2 (Mock 생성 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-009** (§4.1.2): "시스템은 진단 리포트 생성 완료 후 \"공유 링크 생성\" 버튼을 제공해야 하며, 클릭 시 고유 URL(UUID v4, entropy ≥ 128bit)을 생성하여 클립보드에 복사해야 한다. 링크 생성 응답 시간은 500ms 이내여야 한다."
- **REQ-FUNC-010** (§4.1.2): "공유 링크의 유효기간은 생성일로부터 30일 이상이어야 한다. 만료된 링크 접근 시 \"이 링크는 만료되었습니다\" 안내 페이지를 1초 이내에 로딩하고, 원 사용자에게 재생성 알림 푸시를 발송해야 한다. 만료된 링크에서 개인정보 노출은 0건이어야 한다."
- **REQ-FUNC-011** (§4.1.2): "배우자(비회원)가 공유 링크를 클릭하면 앱 설치 없이 모바일 웹에서 리포트 전체를 열람하고 무료 미리보기 1곳을 확인할 수 있어야 한다. 3G 환경 기준 페이지 로딩 시간은 p95 ≤ 2,000ms여야 한다."
- **REQ-FUNC-014** (§4.1.2): "비회원이 무료 미리보기 소진 후 2곳째 동네 접근 시도 시, 유료 전환 유도 모달을 300ms 이내에 표시해야 한다."
- **REQ-NF-006** (§4.2.1): "공유 링크 생성 응답 시간 — ≤ 500ms"
- **REQ-NF-020** (§4.2.3): "공유 링크 보안 — URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션, 열람 로그 실시간 알림"
- **REQ-NF-021** (§4.2.3): "비인가 제3자 공유 링크 개인정보 접근 차단 — 비인가 접근 시 개인정보 노출 0건"

### 시퀀스 다이어그램 (§6.3.2 배우자 공유 링크)

- **참여 Actor:** 사용자A(발신), 배우자(수신, 비회원), Next.js Client Component, Server Action, SSR 공유 페이지, Prisma ORM, 푸시 알림 서비스
- **핵심 분기:**
  1. 유효 링크 → `view_count` 증가 + 리포트 SSR 렌더링 + 무료 미리보기 1곳
  2. 만료 링크 → "이 링크는 만료되었습니다" SSR 페이지 + 재생성 알림 푸시
  3. 비밀번호 설정 → 비밀번호 입력 프롬프트 → bcrypt 검증

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 태스크에서의 사용처 |
|---|---|---|
| API-003 | `lib/types/share-link.ts` — `CreateShareLinkResponse`, `GetReportResponse`, `ReportDTO`, `DataSourceDTO`, `ShareLinkMetaDTO`, `VerifyPasswordResponse`, `ShareLinkErrorCode` | Mock 객체가 이 타입들을 `satisfies` 키워드로 타입 검증하여 생성됨 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/mocks/share-link/` 디렉토리 생성
  - 명령어: `mkdir -p lib/mocks/share-link`

- [ ] **3.2** `lib/mocks/share-link/report-data.ts`에 리포트 공통 데이터 Mock 정의
  ```typescript
  import type { DataSourceDTO, ReportDTO } from '@/lib/types/share-link';
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';
  import { MOCK_CANDIDATES_NORMAL } from '@/lib/mocks/diagnosis';

  export const MOCK_DATA_SOURCES: DataSourceDTO[] = [
    { name: '카카오 모빌리티 API', type: 'api', lastUpdated: '2026-04-20T00:00:00.000Z' } satisfies DataSourceDTO,
    { name: '국토교통부 실거래가', type: 'public_data', lastUpdated: '2026-04-15T00:00:00.000Z' } satisfies DataSourceDTO,
    { name: '경찰청 범죄 통계', type: 'public_data', lastUpdated: '2026-01-01T00:00:00.000Z' } satisfies DataSourceDTO,
  ];

  export const MOCK_REPORT_NORMAL: ReportDTO = {
    diagnosisId: 'mock-diag-001',
    candidates: [...MOCK_CANDIDATES_NORMAL],
    mode: 'couple',
    createdAt: '2026-04-25T10:00:00.000Z',
    freePreviewUsed: false,
    previewCandidateId: 'mock-cand-001',
  } satisfies ReportDTO;

  export const MOCK_REPORT_PREVIEW_USED: ReportDTO = {
    ...MOCK_REPORT_NORMAL,
    freePreviewUsed: true,
  } satisfies ReportDTO;
  ```

- [ ] **3.3** `lib/mocks/share-link/scenarios.ts`에 유효 링크 시나리오 Mock 정의
  ```typescript
  import type { CreateShareLinkResponse, GetReportResponse, ShareLinkMetaDTO } from '@/lib/types/share-link';
  import { MOCK_DATA_SOURCES, MOCK_REPORT_NORMAL, MOCK_REPORT_PREVIEW_USED } from './report-data';

  // === 시나리오 1: 유효한 공유 링크 (비밀번호 없음) ===
  export const MOCK_CREATE_SHARE_LINK: CreateShareLinkResponse = {
    shareUrl: 'https://donggung.vercel.app/share/mock-token-001',
    expiresAt: '2026-05-25T10:00:00.000Z',
    hasPassword: false,
  } satisfies CreateShareLinkResponse;

  export const MOCK_SHARE_LINK_META_VALID: ShareLinkMetaDTO = {
    id: 'mock-share-001',
    uniqueUrl: 'mock-token-001',
    viewCount: 3,
    expiresAt: '2026-05-25T10:00:00.000Z',
    isExpired: false,
    hasPassword: false,
    freePreviewUsed: false,
  } satisfies ShareLinkMetaDTO;

  export const MOCK_GET_REPORT_VALID: GetReportResponse = {
    report: MOCK_REPORT_NORMAL,
    sources: MOCK_DATA_SOURCES,
    shareLink: MOCK_SHARE_LINK_META_VALID,
  } satisfies GetReportResponse;
  ```

- [ ] **3.4** `lib/mocks/share-link/scenarios.ts`에 만료 링크 시나리오 Mock 정의
  ```typescript
  // === 시나리오 2: 만료된 공유 링크 ===
  export const MOCK_SHARE_LINK_META_EXPIRED: ShareLinkMetaDTO = {
    id: 'mock-share-002',
    uniqueUrl: 'mock-token-expired-001',
    viewCount: 15,
    expiresAt: '2026-03-01T10:00:00.000Z',
    isExpired: true,
    hasPassword: false,
    freePreviewUsed: true,
  } satisfies ShareLinkMetaDTO;
  ```

- [ ] **3.5** `lib/mocks/share-link/scenarios.ts`에 비밀번호 설정 시나리오 Mock 정의
  ```typescript
  // === 시나리오 3: 비밀번호 설정된 공유 링크 ===
  export const MOCK_SHARE_LINK_META_PASSWORD: ShareLinkMetaDTO = {
    id: 'mock-share-003',
    uniqueUrl: 'mock-token-pw-001',
    viewCount: 0,
    expiresAt: '2026-05-25T10:00:00.000Z',
    isExpired: false,
    hasPassword: true,
    freePreviewUsed: false,
  } satisfies ShareLinkMetaDTO;

  export const MOCK_CREATE_SHARE_LINK_PASSWORD: CreateShareLinkResponse = {
    shareUrl: 'https://donggung.vercel.app/share/mock-token-pw-001',
    expiresAt: '2026-05-25T10:00:00.000Z',
    hasPassword: true,
  } satisfies CreateShareLinkResponse;
  ```

- [ ] **3.6** `lib/mocks/share-link/scenarios.ts`에 무료 미리보기 소진 시나리오 Mock 정의
  ```typescript
  // === 시나리오 4: 무료 미리보기 소진 ===
  export const MOCK_GET_REPORT_PREVIEW_EXHAUSTED: GetReportResponse = {
    report: MOCK_REPORT_PREVIEW_USED,
    sources: MOCK_DATA_SOURCES,
    shareLink: { ...MOCK_SHARE_LINK_META_VALID, freePreviewUsed: true },
  } satisfies GetReportResponse;
  ```

- [ ] **3.7** `lib/mocks/share-link/errors.ts`에 에러 시나리오 Mock 정의
  ```typescript
  import { ShareLinkErrorCode } from '@/lib/types/share-link';

  export const MOCK_SHARE_ERROR_EXPIRED = {
    code: ShareLinkErrorCode.LINK_EXPIRED,
    message: '이 링크는 만료되었습니다.',
    httpStatus: 410,
  } as const;

  export const MOCK_SHARE_ERROR_PASSWORD_MISMATCH = {
    code: ShareLinkErrorCode.PASSWORD_MISMATCH,
    message: '비밀번호가 일치하지 않습니다.',
    httpStatus: 401,
  } as const;

  export const MOCK_SHARE_ERROR_NOT_FOUND = {
    code: ShareLinkErrorCode.LINK_NOT_FOUND,
    message: '공유 링크를 찾을 수 없습니다.',
    httpStatus: 404,
  } as const;

  export const MOCK_SHARE_ERROR_UNAUTHORIZED = {
    code: ShareLinkErrorCode.UNAUTHORIZED_ACCESS,
    message: '접근 권한이 없습니다.',
    httpStatus: 403,
  } as const;
  ```

- [ ] **3.8** `lib/mocks/share-link/index.ts`에 배럴 export
  ```typescript
  export * from './report-data';
  export * from './scenarios';
  export * from './errors';
  ```

- [ ] **3.9** `__tests__/mocks/share-link.spec.ts`에 Mock 데이터 무결성 검증 테스트 작성
  ```typescript
  import { MOCK_GET_REPORT_VALID, MOCK_SHARE_LINK_META_EXPIRED, MOCK_SHARE_LINK_META_PASSWORD } from '@/lib/mocks/share-link';

  describe('ShareLink Mock 데이터 무결성', () => {
    it('유효 링크 Mock의 isExpired가 false이다', () => { /* ... */ });
    it('만료 링크 Mock의 isExpired가 true이고 expiresAt이 과거 날짜이다', () => { /* ... */ });
    it('비밀번호 링크 Mock의 hasPassword가 true이다', () => { /* ... */ });
    it('데이터 소스 Mock의 각 항목에 name, type, lastUpdated가 존재한다', () => { /* ... */ });
    it('모든 Mock의 id가 결정론적(고정값)이다', () => { /* ... */ });
    it('만료 링크 Mock의 report 데이터에 개인정보가 포함되지 않는다', () => { /* ... */ });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 유효 공유 링크 Mock 데이터 구조 검증
- **Given** `MOCK_GET_REPORT_VALID`가 import된 상태
- **When** `GetReportResponse` 타입으로 `satisfies` 검증
- **Then** `report.candidates.length >= 3`이고, `shareLink.isExpired === false`이며, `sources.length >= 1`
- **And** `shareLink.uniqueUrl`이 `'mock-token-001'` (결정론적), `report.freePreviewUsed === false`

**AC-2 (예외):** 만료 공유 링크 Mock 검증
- **Given** `MOCK_SHARE_LINK_META_EXPIRED`가 import된 상태
- **When** `isExpired` 필드 확인
- **Then** `isExpired === true`이고, `expiresAt`이 `'2026-03-01T10:00:00.000Z'` (과거 고정값)
- **And** `MOCK_SHARE_ERROR_EXPIRED.httpStatus === 410`, `message === '이 링크는 만료되었습니다.'`

**AC-3 (예외):** 비밀번호 불일치 에러 Mock 검증
- **Given** `MOCK_SHARE_ERROR_PASSWORD_MISMATCH`가 import된 상태
- **When** `code` 필드 확인
- **Then** `code === ShareLinkErrorCode.PASSWORD_MISMATCH`, `httpStatus === 401`, `message === '비밀번호가 일치하지 않습니다.'`

**AC-4 (경계):** 무료 미리보기 소진 Mock 검증
- **Given** `MOCK_GET_REPORT_PREVIEW_EXHAUSTED`가 import된 상태
- **When** `report.freePreviewUsed` 필드 확인
- **Then** `freePreviewUsed === true`이고, `shareLink.freePreviewUsed === true`
- **And** UI에서 유료 전환 유도 모달 렌더링에 사용 가능

**AC-5 (정상):** 에러 코드 전수 매핑 검증
- **Given** `lib/mocks/share-link/errors.ts`의 모든 에러 Mock
- **When** 각 Mock의 `code`가 `ShareLinkErrorCode` enum 값인지 확인
- **Then** 모든 `code`가 유효한 enum 값이며, `message`가 한국어 문자열, `httpStatus`가 유효한 HTTP 상태 코드

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-006 | "공유 링크 생성 응답 시간 — ≤ 500ms" (§4.2.1) | Mock 데이터는 즉시 반환. SSR 리포트 페이지 렌더링 시 Mock 직렬화 오버헤드가 최소화되도록 순수 객체 리터럴 사용 |
| REQ-NF-020 | "공유 링크 보안 — URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션" (§4.2.3) | 비밀번호 설정 시나리오 Mock에 `hasPassword: true` 포함. uniqueUrl 필드가 토큰 형식 문자열인지 확인 |
| REQ-NF-021 | "비인가 접근 시 개인정보 노출 0건" (§4.2.3) | 만료 링크 Mock 시나리오에서 `report` 데이터가 null/제거되어야 하는지 테스트에서 검증. 에러 Mock에 `UNAUTHORIZED_ACCESS` 코드 포함 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/mocks/share-link/report-data.ts` (리포트 공통 데이터 + DataSource Mock)
- `lib/mocks/share-link/scenarios.ts` (유효·만료·비밀번호·미리보기소진 4개 시나리오)
- `lib/mocks/share-link/errors.ts` (에러 시나리오 4개)
- `lib/mocks/share-link/index.ts` (배럴 export)
- `__tests__/mocks/share-link.spec.ts` (Mock 무결성 검증 6개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **API-003:** `lib/types/share-link.ts` — `CreateShareLinkResponse`, `GetReportResponse`, `ReportDTO`, `DataSourceDTO`, `ShareLinkMetaDTO`, `ShareLinkErrorCode` 타입 정의
- **MOCK-001:** `lib/mocks/diagnosis/candidates.ts` — `MOCK_CANDIDATES_NORMAL` 배열을 리포트 Mock에서 재사용

### 후행:
- **UI-006:** 공유 링크 생성 UI — `MOCK_CREATE_SHARE_LINK` 사용
- **UI-007:** SSR 공유 리포트 페이지 UI — `MOCK_GET_REPORT_VALID` 사용
- **UI-008:** 유료 전환 유도 모달 UI — `MOCK_GET_REPORT_PREVIEW_EXHAUSTED` 사용
- **TEST-003:** 공유 링크 GWT 시나리오 — Mock 데이터 기반 테스트 fixture
- **TEST-004:** 공유 링크 보안 테스트

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/mocks/share-link.spec.ts` — 6개 케이스 (유효 링크, 만료 링크, 비밀번호 링크, DataSource, 결정론적 ID, 만료 링크 개인정보 미포함)
- **타입 검증:** `tsc --noEmit`으로 모든 Mock 객체가 API-003 DTO 타입과 호환되는지 확인
- **정적 분석:** `grep -r 'Math.random\|Date.now\|new Date' lib/mocks/share-link/` 결과 0건 확인
- **수동 검증:**
  1. IDE에서 Mock 객체 hover 시 DTO 타입이 올바르게 표시되는지 확인
  2. SSR 공유 페이지에 Mock 데이터를 주입하여 3가지 시나리오(유효/만료/비밀번호) 렌더링 확인
- **CI 게이트:** `tsc --noEmit` 통과, Jest 테스트 100% 통과, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **MSW(Mock Service Worker) 핸들러 제공 여부:** GET `/api/diagnosis/[id]/report` Route Handler를 MSW로 인터셉트할 경우, 유효/만료/비밀번호 3가지 시나리오를 query parameter(`token`)에 따라 분기하는 핸들러 설계 필요 — MSW v2 (`msw@^2.0.0`) 사용 시 `http.get()` 핸들러로 구현 가능. UI-007 작업 시 함께 확정.
2. **Storybook 연동 방안:** SSR 공유 페이지 컴포넌트를 Storybook에서 테스트하려면, Server Component Mock이 필요할 수 있음. `@storybook/nextjs`의 RSC 지원 상황에 따라 Mock 주입 방식 결정 — UI-007 작업 시 확정.
3. **만료 링크에서 report 데이터 포함 여부:** REQ-NF-021에 따라 만료 링크 접근 시 개인정보 노출 0건이어야 함 — 만료 시나리오 Mock에서 `report`를 null로 할지, 에러 응답만 반환할지 CMD-SHARE-003 작업 시 확정.
4. **비밀번호 해시 Mock:** 실제 bcrypt 해시가 아닌 Mock 용도이므로, `password_hash` 필드는 Mock에 포함하지 않고 `hasPassword` boolean만 노출. 실제 bcrypt 검증은 CMD-SHARE-004에서 구현.
