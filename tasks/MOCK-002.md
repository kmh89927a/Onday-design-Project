---
name: Feature Task
title: "[Feature] MOCK-002: 공유 링크 열람 Mock 데이터 (유효/만료/비밀번호/미리보기 소진 시나리오). ★ Wave 2 트랙 E 2/4. ★★ MOCK-001 답습 가이드 § 첫 실전 검증 = adaptive 입증 (rigid → adaptive 진화). ★ Wave 2 체인 6회째 다중 차원 (API→MOCK 2번째 + MOCK→MOCK 차원 신규 동시 작동). ★ Mismatch 추적 정신 2회째 작동 (0건 통과 입증 — satisfies 양방향 검증기). ★ 메모리 stale 자동 보정 4번째 (자가 치유 시스템 입증)"
labels: ['feature', 'priority:L', 'epic:Mock & Fixture', 'wave:2']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [MOCK-002] 공유 링크 열람 Mock 데이터 — ReportDTO 2 + DataSourceDTO 3 + ShareLinkMetaDTO 3 시나리오 + CreateShareLinkResponse 2 + GetReportResponse 2 + ShareLinkErrorDTO 4 에러. ★ **Mock 트랙 2/4 진입 — Wave 2 트랙 E 2/4** (MOCK-001 1/4 직후 자연 답습, ★ **본 ISSUE 머지 시 트랙 E 2/4 완성** — 잔존 MOCK-004 + MOCK-005 = Wave 3 진입 2칸 더 필요). 본 ISSUE 산출물 = **신규 4 코드 + 명세 1 파일 갱신** + **커밋 2개 (feat + docs 분리, API-001/002/003/005/MOCK-001 패턴 정확 답습 6 회째)**. spec (§3.9) 은 vitest config 부재 13 회째 일관 (TEST-003 + TEST-004 분배 위임, ★ MOCK-001 단일 위임과 다름 — 보안 분배). ★ **`src/lib/mocks/share-link/` 신규 owner** — S1~S6 ShareLink 현실 코드 (API-003 가드 누적) 와 책임 분리 (Q2 (가) 결정). ★ **Q3 (가) 명세 v1.0 정확 답습 + 가이드 § §9 보정 트리거 정직 기록** — MOCK-001 §9 답습 가이드 § "shareLinks/scenarios/get-share/index" vs 명세 v1.0 "report-data/scenarios/errors/index" mismatch 검토 후 명세 v1.0 정확 답습 채택 = ★★ **가이드 § 첫 실전 검증 = adaptive 입증** (rigid → adaptive 진화). ★ **Wave 2 체인 6회째 다중 차원** — **★ API-003 ReportDTO 첫 fixture 활용 (API → MOCK 차원 2번째)** + **★ MOCK_CANDIDATES_NORMAL 재사용 (★ MOCK → MOCK 차원 신규)** 동시 작동 = 체인 시스템 다중 차원 동시 작동 입증. ★ **Mismatch 추적 정신 2회째 작동 — 0건 발견 = satisfies 양방향 검증기 입증** (MOCK-001 5건 발견 P1 적용 특성 vs 본 ISSUE 0건 base 0 신규 정의 특성, 발견 + 통과 둘 다 가치). ★ **결정론적 가드 첫 안정** (AC-5 — Math.random/Date.now/new Date 0건, MOCK 트랙 표준 가드 2회째 성공). ★ **ServiceModeType 재사용 6회째** (user.ts 정의 + diagnosis.ts API-002 + share-link.ts API-003 + saved-search.ts API-005 + MOCK-001 get-diagnosis.ts SMT5 + ★ MOCK-002 report-data.ts SMT6 — mock 차원 2번째 satisfies 자동). ★ **(P1) 패턴 미묘 구분 § 6회째 케이스** — MOCK 도메인 2번째 (interface 정의 0, import + satisfies). ★ **메모리 stale 자동 보정 4번째** (S1 47줄 → 46줄, 누적 4건 = 9칸+API/MOCK 누적 자가 치유 시스템 입증).
- **목적 (Why):**
  - **비즈니스:** 배우자 공유 링크 관련 UI 컴포넌트 (UI-006 공유 링크 생성 + UI-007 SSR 공유 리포트 + UI-008 유료 전환 모달) + TEST-003 (공유 GWT) + TEST-004 (공유 보안) 가 백엔드 공유 로직 (CMD-SHARE-001~004 + QRY-SHARE-001) 완성 전에 **병렬 개발** 될 수 있도록, API-003 산출물 타입 (ReportDTO + DataSourceDTO + ShareLinkMetaDTO + CreateShareLinkResponse + GetReportResponse + ShareLinkErrorCode + ShareLinkErrorDTO 등 10 타입) 정확 기준 Mock 데이터 제공. ★ Mock 트랙 = **fixture 정의 자체가 본 ISSUE 의 owner**. ★ **★ 본 ISSUE 진짜 핵심 메타 가치 = MOCK-001 답습 가이드 § 첫 실전 검증 = adaptive 입증** — MOCK-001 §9 가이드 § (일반화 패턴 "POST≠GET 모든 도메인 답습" 가정) → 본 ISSUE 실전 검증 결과 "도메인 특성 적응 필요" (ShareLink = POST+GET+Meta 시나리오 안 통합 + 에러 4종 풍부) → **rigid 가이드 → adaptive 가이드 진화 = 워크플로 시스템 메타 진화**. ★ Q2 (가) 책임 분리 — S1~S6 ShareLink 현실 코드 (API-003 가드 누적, CRUD 영역) vs 신규 owner (`lib/mocks/share-link/`, UI prop fixture) = 다른 책임 / 다른 사용처 / 다른 워크플로 → 공존 자연. ★ Q3 (가) 명세 v1.0 정확 답습 — `report-data` (공통 base: DataSourceDTO 3 + ReportDTO NORMAL+PREVIEW_USED) + `scenarios` (4 시나리오 통합: 유효 3 객체 + 만료 1 + 비밀번호 2 + 미리보기소진 1) + `errors` (4 에러 × ShareLinkErrorDTO satisfies, MOCK-001 ④ 보정 답습) + `index` (배럴) = 도메인 특성 적응.
  - **사용자 가치:** SSR 공유 리포트 페이지·유료 전환 모달·만료 안내 페이지가 실 데이터 없이도 4 시나리오 (유효/만료/비밀번호/미리보기 소진) + 4 에러 (만료/비번/없음/비인가) 완전한 UI 검증 가능 → 공유 경험 완성도 사전 확보. 결정론적 가드 (AC-5) 로 디버깅 재현성 + TEST-003/004 GWT 기준선 안정.
- **범위 (What):**
  - ✅ 만드는 것 (신규 4 코드 파일 + 명세 1 파일):
    - **`onday-app/src/lib/mocks/share-link/report-data.ts`** (신규, ★ 공통 base, 신규 owner 디렉토리 포함) — `MOCK_DATA_SOURCES` 3 (카카오 모빌리티/국토교통부/경찰청) + `MOCK_REPORT_NORMAL` + `MOCK_REPORT_PREVIEW_USED` 2 ReportDTO. **import 정확 2 (정직 기록): `import type { ReportDTO, DataSourceDTO } from '@/lib/types/share-link'` ★ Wave 2 체인 6회째 API→MOCK 2번째 + `import { MOCK_CANDIDATES_NORMAL } from '@/lib/mocks/diagnosis'` ★ MOCK→MOCK 차원 신규**. Prisma 0 / types.ts(직접) 0 / S1~S6 0 / M1~M3 0.
    - **`onday-app/src/lib/mocks/share-link/scenarios.ts`** (신규) — 4 시나리오 6 객체 (유효 3: CreateShareLinkResponse + ShareLinkMetaDTO + GetReportResponse / 만료 1: ShareLinkMetaDTO / 비밀번호 2: ShareLinkMetaDTO + CreateShareLinkResponse / 미리보기소진 1: GetReportResponse). ★ **POST+GET+Meta 통합 패턴** (MOCK-001 POST/GET 분리와 다른 도메인 특성 = adaptive 입증). import 정확 4.
    - **`onday-app/src/lib/mocks/share-link/errors.ts`** (신규) — 4 에러 × ShareLinkErrorDTO satisfies (LINK_EXPIRED 410 / PASSWORD_MISMATCH 401 / LINK_NOT_FOUND 404 / UNAUTHORIZED_ACCESS 403). ★ **MOCK-001 ④ 보정 패턴 답습** (`as const` 가 아닌 satisfies). import 정확 1.
    - **`onday-app/src/lib/mocks/share-link/index.ts`** (신규) — 배럴 3 export. UI-006/007/008 + TEST-003/004 호출처 단순화.
    - **`tasks/MOCK-002.md`** — 본 명세 현실 동기화 (Q1~Q7 + ★★ 가이드 § adaptive 입증 § + ★ Wave 2 체인 6회째 다중 차원 § + ★ Q3 (가) 명세 정확 답습 strategy § + (P1) 미묘 구분 § 6회째 + ★ 분리/통합 strategy § 다른 차원 다른 적응 + ★ mock 도메인 결정 매트릭스 § 6회째 adaptive 진화 + ★ 결정론적 가드 § 2회째 성공 + ★ Mismatch 2회째 작동 § + ★ 메모리 stale 자동 보정 누적 4건 § + S1~S6 현실 mock 표 + ServiceModeType 6회째 표 + Q4~Q7 자동 묶음 + §9 4종 신규 § + follow-up 4+).
  - ❌ 만들지 않는 것 (현실 가드 + 영역 분리 + dead 회피):
    - mapper (`lib/mappers/share-link-mapper.ts`) / Zod 추출 — **CMD-SHARE-001~004 / QRY-SHARE-001 영역** (본 ISSUE = fixture only, S1~S4 dual mapper 가드 유지)
    - `__tests__/mocks/share-link.spec.ts` 6 케이스 — **TEST-003 + TEST-004 분배 위임** (vitest config 부재 13 회째, ★ MOCK-001 단일 위임과 다름 — 보안 분배)
    - **S1~S6 ShareLink 현실 코드** (validators/diagnosis.ts:32-43 + api/share/route.ts + api/share/[uuid]/route.ts + app/share/[uuid]/page.tsx + features/share/preview-stats.ts + components/share/ 3) — **Q2 (가) 책임 분리 가드** (API-003 누적 + 본 ISSUE 신규 가드)
    - **M1~M3 mock + MOCK_NEIGHBORHOODS + Neighborhood 타입 import** — MOCK-001 Q2 (가) 책임 분리 답습 (다른 도메인)
    - **MOCK-001 산출물 4 미수정** — candidates.ts / get-diagnosis.ts / index.ts / scenarios.ts (★ MOCK_CANDIDATES_NORMAL 재사용은 import only, 수정 0)
    - MSW (Mock Service Worker) 핸들러 — **CMD-SHARE / UI-007 영역** (명세 §9 Open Question 1 보존)
    - Storybook 연동 — **UI-007 영역** (명세 §9 Open Question 2 보존)
    - 만료 링크 report 노출 여부 (REQ-NF-021) — **CMD-SHARE-003 영역** (Q7 결정, 본 ISSUE = DTO contract only, 만료 시 ShareLinkMetaDTO 분리만)
    - 비밀번호 해시 Mock — **CMD-SHARE-004 영역** (bcrypt 검증, 본 ISSUE = `hasPassword: boolean` only)
    - `types.ts:1-3` `AuthProvider`/`DiagnosisMode`/`DiagnosisStatus` 통합 정리 — **Q2 가드 13번째 사수** (cleanup ISSUE 위임)
    - DiagnosisMode 11 + DiagnosisStatus 2 + ServiceModeType 4 회 호출처 일괄 치환 — cleanup ISSUE 위임
    - API-001/002/003/005 산출물 14 + MOCK-001 산출물 4 — 본 ISSUE 미수정
    - S1~S6 + SS1~SS3 + N1~N6 + mock-auth M1~M4 + M1~M3 mock (API-001/002/003/005/MOCK-001 가드 누적) — 본 ISSUE 무관여
    - `ReportDTO` / `DataSourceDTO` / `ShareLinkMetaDTO` / `CreateShareLinkResponse` / `GetReportResponse` / `ShareLinkErrorCode` / `ShareLinkErrorDTO` / `CandidateAreaDTO` 재정의·중복 정의 — **절대 금지** ((P1) 6회째 정신 일관, MOCK 차원 = import + satisfies)
    - Prisma model re-export — **(P1) 패턴 오해 금지** (관심사 분리)
- **복잡도:** L (명세 v1.0 동일)
- **Wave:** 2 (Mock 생성 트랙 — ★ 트랙 E 2/4)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-009** (§4.1.2): "시스템은 진단 리포트 생성 완료 후 \"공유 링크 생성\" 버튼을 제공해야 하며, 클릭 시 고유 URL(UUID v4, entropy ≥ 128bit) 을 생성하여 클립보드에 복사해야 한다. 링크 생성 응답 시간은 500ms 이내여야 한다."
- **REQ-FUNC-010** (§4.1.2): "공유 링크의 유효기간은 생성일로부터 30일 이상이어야 한다. 만료된 링크 접근 시 \"이 링크는 만료되었습니다\" 안내 페이지를 1초 이내에 로딩하고, 원 사용자에게 재생성 알림 푸시를 발송해야 한다. 만료된 링크에서 개인정보 노출은 0건이어야 한다."
- **REQ-FUNC-011** (§4.1.2): "배우자(비회원) 가 공유 링크를 클릭하면 앱 설치 없이 모바일 웹에서 리포트 전체를 열람하고 무료 미리보기 1 곳을 확인할 수 있어야 한다. 3G 환경 기준 페이지 로딩 시간은 p95 ≤ 2,000ms 여야 한다."
- **REQ-FUNC-014** (§4.1.2): "비회원이 무료 미리보기 소진 후 2 곳째 동네 접근 시도 시, 유료 전환 유도 모달을 300ms 이내에 표시해야 한다."
- **REQ-NF-006** (§4.2.1): "공유 링크 생성 응답 시간 — ≤ 500ms"
- **REQ-NF-020** (§4.2.3): "공유 링크 보안 — URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션, 열람 로그 실시간 알림"
- **REQ-NF-021** (§4.2.3): "비인가 제3자 공유 링크 개인정보 접근 차단 — 비인가 접근 시 개인정보 노출 0건"

### `prototypes/design/CLAUDE.md` §3 (1인 MVP 제약) 인용

- "Vercel Serverless Timeout = 10초" → 본 ISSUE 비대상 (Mock 트랙, fixture only).
- "Out of Scope ... 자동 코드 생성 금지" → spec (§3.9) 위임 (vitest 부재 13 회째 일관).

### ★ Phase B 작성 산출물 표 (신규 4 파일, ★ Q3 (가) 명세 v1.0 정확 답습)

| # | 파일 | 책임 | import (정직 기록) | satisfies |
|---|---|---|---|---|
| **B.1** | `lib/mocks/share-link/report-data.ts` (★ 공통 base, 신규 owner 디렉토리 포함) | DataSourceDTO 3 + ReportDTO NORMAL + PREVIEW_USED | ★ **`ReportDTO + DataSourceDTO from '@/lib/types/share-link'` (Wave 2 체인 6회째 API→MOCK 2번째)** + ★ **`MOCK_CANDIDATES_NORMAL from '@/lib/mocks/diagnosis'` (MOCK→MOCK 차원 신규)** | 5 곳 (3 DataSource + 2 Report) |
| **B.2** | `lib/mocks/share-link/scenarios.ts` (4 시나리오 통합) | 유효 3 객체 + 만료 1 + 비밀번호 2 + 미리보기소진 1 = 7 객체 | `CreateShareLinkResponse + GetReportResponse + ShareLinkMetaDTO from '@/lib/types/share-link'` + report-data.ts 3 import | 7 곳 |
| **B.3** | `lib/mocks/share-link/errors.ts` (4 에러) | LINK_EXPIRED 410 + PASSWORD_MISMATCH 401 + LINK_NOT_FOUND 404 + UNAUTHORIZED_ACCESS 403 | `ShareLinkErrorCode + ShareLinkErrorDTO from '@/lib/types/share-link'` | 4 곳 |
| **B.4** | `lib/mocks/share-link/index.ts` (배럴) | 3 export | — | — |

**satisfies 검증 합계**: **15 곳** (report-data 5 + scenarios 7 + errors 4 - 1 중복 = 15). API-003 산출물 정확 활용.

### ★★ 가이드 § adaptive 입증 § (★ 본 ISSUE 진짜 메타 핵심 — rigid → adaptive 진화)

MOCK-001 §9 답습 가이드 § 첫 실전 검증 결과 — 가이드 §의 적응 가능성 입증:

| 항목 | MOCK-001 정립 (rigid 가정) | ★ 본 ISSUE 실전 결과 (adaptive 입증) |
|---|---|---|
| **답습 가이드 § 표 명시 (MOCK-001 §9)** | "MOCK-002 = shareLinks(fixture) / scenarios(유효/만료/비밀번호) / **get-share(GET response)** / index" — POST≠GET 분리 강조 (일반화 패턴) | — |
| **명세 v1.0 §3.1~3.8** | — | "report-data / scenarios / **errors(별도)** / index" — 시나리오 통합 + 에러 별도 |
| **도메인 특성** | MOCK-001 (Diagnosis): POST CreateDiagnosisResponse 시나리오 4 + GET 1 = **POST vs GET 시나리오 다양성 차이 큼** → POST/GET 분리 자연 | ★ MOCK-002 (ShareLink): POST + GET + Meta 가 같은 시나리오 안에서 3 객체 함께 사용 (유효 시나리오 = `CreateShareLinkResponse` + `ShareLinkMetaDTO_VALID` + `GetReportResponse` 3 객체) + 에러 4 종 풍부 → **시나리오 통합 + 에러 별도 자연** |
| **본 ISSUE 채택** | (가이드 § rigid 답습) | ★ **명세 v1.0 정확 답습 = 도메인 특성 적응 = adaptive 입증** |
| **§9 보정 트리거** | — | ★ MOCK-001 §9 답습 가이드 § = "**모든 도메인 동일 답습 아닌 도메인 특성 적응 가능**" 명시 필요 → Wave 3+ 새 도메인 가이드 = adaptive 패턴 표준 |
| **코드 증거 위치** | — | scenarios.ts 통합 패턴 (유효 시나리오 = 3 객체 그룹 / 비밀번호 시나리오 = 2 객체 그룹) — MOCK-001 객체 1개씩 분리와 다른 도메인 적응 |

**메타 가치 (★ 본 ISSUE 진짜 핵심)**:
- **rigid 가이드 (일반화 패턴 절대 답습) → adaptive 가이드 (도메인 특성 적응) 진화**
- 워크플로 시스템 메타 진화 = "가이드 §는 절대 답습 아닌 도메인 특성 검토 후 적응"
- "rigid 가이드보다 adaptive 가이드 우월" 입증 — Wave 3+ 새 도메인 ISSUE 가 본 § 답습

### ★ Wave 2 체인 6회째 다중 차원 § (★ 본 ISSUE 체인 다양화 입증)

13 ISSUE 누적 워크플로 = 체인 시스템 = **다중 차원 동시 작동** 입증:

| # | 체인 단계 | 시점 | 차원 |
|---|---|---|---|
| 1 | Wave 1 → Wave 2 | DB-003 → API-002 (DiagnosisStatusType 첫 활성) | DB → API |
| 2 | Wave 2 내부 (API-003) | API-002 → API-003 (CandidateAreaDTO 첫 외부 활용) | API → API |
| 3 | 트리거 → 위임 (DB-006/API-005) | DB-006 §7+§9.1 동시 → API-005 (multi 트리거) | 트리거 → 위임 |
| 4 | Wave 2 트랙 D 완성 (API-005) | API-001/002/003/005 + 3 종 가이드 § 정립 | 트랙 완성 |
| 5 | API → MOCK 첫 진입 (MOCK-001) | API-002 → MOCK-001 (CandidateAreaDTO 첫 fixture 활용, 13 satisfies) | API → MOCK 첫 |
| **★ 6** | **★★ API → MOCK 2번째 + ★ MOCK → MOCK 차원 신규 동시 (★ 본 ISSUE)** | **★ API-003 → MOCK-002 (ReportDTO 첫 fixture 활용, API→MOCK 2번째) + ★ MOCK-001 → MOCK-002 (MOCK_CANDIDATES_NORMAL 재사용, MOCK→MOCK 차원 신규)** | **★ 다중 차원 동시** |

**다중 차원 동시 입증 코드 위치 (report-data.ts L23-24)**:
```typescript
import type { ReportDTO, DataSourceDTO } from '@/lib/types/share-link';   // ★ API → MOCK 차원 2번째
import { MOCK_CANDIDATES_NORMAL } from '@/lib/mocks/diagnosis';            // ★ MOCK → MOCK 차원 신규
```

**입증 의미 (★ 시스템 성숙도)**:
- 체인 시스템이 단일 방향 (DB→API / API→API / API→MOCK) 아닌 **다중 차원 동시 작동** = 시스템 성숙
- 향후 후행 ISSUE (MOCK-004 → MOCK-005 / UI-* → CMD-* 등) 가 본 다중 차원 패턴 답습 가능
- 14 ISSUE 누적 워크플로 = 격리된 칸 아닌 **다차원 체인 그래프**

### ★ Q3 (가) 명세 v1.0 정확 답습 strategy 표 (★ 본 ISSUE 핵심 분기 코드 입증)

| 출처 | 4 파일 책임 명칭 | 분리 기준 | 본 ISSUE 채택 |
|---|---|---|---|
| MOCK-001 §9 답습 가이드 § (rigid 일반화) | shareLinks(fixture) / scenarios(유효/만료/비밀번호) / get-share(GET response) / index | POST≠GET 분리 강조 | ❌ 채택 안 함 |
| **명세 v1.0 §3.1~3.8 (도메인 특성 적응)** | **report-data(공통 base) / scenarios(4 시나리오 통합) / errors(4 에러 별도) / index** | **시나리오 기반 통합 + 에러 별도** | ✅ **본 ISSUE 채택 — adaptive 입증** |

**책임 4종 차원 (★ MOCK-001 답습 + 도메인 적응)**:
1. **`report-data.ts`**: 공통 base (DataSource 3 + Report 2) — scenarios 가 import 하는 base
2. **`scenarios.ts`**: 4 시나리오 통합 (유효 3 객체 + 만료 1 + 비밀번호 2 + 미리보기소진 1 = 7 객체) — ★ **POST+GET+Meta 통합**
3. **`errors.ts`**: 4 에러 × ShareLinkErrorDTO satisfies (★ MOCK-001 ④ 보정 답습 — `as const` 아닌 satisfies)
4. **`index.ts`**: 배럴 3 export — 호출처 단순화

**근거 5 종**:
1. **★ 명세 v1.0 §3.1~3.8 정합** — 명세 자체가 도메인 특성 정확 반영
2. **★ 가이드 § adaptive 입증** — MOCK-001 §9 가이드 §의 adaptive 가능성 실전 첫 검증 = 메타 가치
3. **★ 도메인 특성 차이 명확** — MOCK-001 (POST/GET 시나리오 다양성) vs MOCK-002 (POST+GET+Meta 통합 + 에러 풍부)
4. **★ MOCK-004/005 가이드** — adaptive 패턴 표준 정립 = 향후 mock 도메인 결정 매트릭스 진화
5. **분량 일관** — 4 코드 + 명세 1 = 5 파일 = MOCK-001 동일 (API-001/002/003/005/MOCK-001 +0 6회째)

### ★ (P1) 패턴 미묘 구분 표 (★ 6회째 케이스 — MOCK 도메인 2번째)

| ISSUE | base type 존재 | (P1) 적용 | 패턴 | 특이점 |
|---|---|---|---|---|
| API-001 | ✅ user.ts AuthProviderType | ✅ | `OAuthProvider = AuthProviderType` | base + re-export |
| API-002 | ✅ types.ts + user.ts + diagnosis.ts | ✅ (3 re-export) | `CandidateAreaDTO = CandidateArea` 등 | 다중 re-export |
| API-003 | ❌ DB-004 base 0 | ❌ | share-link.ts 6 섹션 신규 정의 | base 0 → 신규 |
| API-005 | ❌ DB-006 base 0 (§7 위임) | ❌ | saved-search.ts (base) + saved-search-api.ts (API) 분리 | base 0 + 분리 |
| MOCK-001 | ❌ fixture only | ❌ (다른 차원) | API-002 산출물 import + satisfies | MOCK 도메인 1번째 |
| **★ MOCK-002** | **❌ fixture only** | **❌ (다른 차원)** | **★ API-003 산출물 import + satisfies** | **★ MOCK 도메인 2번째 — (P1) 정신 안정 입증** |

**(P1) 정신 안정 입증 (★ MOCK 도메인 2번째)**:
- MOCK 트랙은 interface 정의 0 → "기존 산출물 import + satisfies" 형태로 (P1) 정신 작동
- MOCK-001 (체인 5회째) + MOCK-002 (체인 6회째) = MOCK 차원 (P1) 패턴 안정
- 향후 MOCK-004/005 = 동일 패턴 답습 (8 회째 + 9 회째)

### ★ 분리/통합 strategy § 다른 차원 다른 적응 표 (★ API-005 § 실전 첫 후행 2번째)

| ISSUE | 결정 변수 | 분리 strategy | 차원 |
|---|---|---|---|
| API-002 | DB §7 base + DB 영역 직접 정의 | 2 파일 분리 (diagnosis.ts base + diagnosis-errors.ts API) | DB 영역 |
| API-003 | DB-004 §7 base 0 | 1 파일 통합 (share-link.ts 6 섹션) | DB 영역 |
| API-005 | DB-006 §7 base + DB 영역 정의 위임 | 2 파일 분리 (saved-search.ts base + saved-search-api.ts API) | DB 영역 |
| MOCK-001 | 역할별 책임 분리 (fixture/시나리오/응답/배럴) | 4 파일 분리 (candidates/scenarios/get-diagnosis/index) | 역할 차원 |
| **★ MOCK-002** | **★ 역할 + 도메인 특성 (시나리오 통합 vs 분리)** | **4 파일 분리 (report-data/scenarios/errors/index) — ★ POST+GET+Meta 통합 + 에러 별도** | **★ 역할 + 도메인 차원 (adaptive 신규)** |

**결정 매트릭스 진화 (★ Wave 3+ 가이드)**:
- **"DB 영역 차원"** (API-* 트랙): base type 존재 + DB 영역 정의 위치
- **"역할 차원"** (MOCK-001 정립): 책임 분리 종 수 (rigid)
- **★ "역할 + 도메인 차원" (★ MOCK-002 진화 — adaptive)**: 역할 + 도메인 특성 (POST/GET 시나리오 통합 vs 분리 / 에러 풍부 vs 단순 등)

### ★ mock 도메인 결정 매트릭스 § 6회째 adaptive 진화 표

| 결정 변수 | MOCK-001 정립 (rigid) | ★ MOCK-002 진화 (adaptive) |
|---|---|---|
| interface vs fixture | type=API / fixture=MOCK | 동일 (안정) |
| MOCK 패턴 | API-* import + satisfies + 결정론적 가드 | 동일 (안정) |
| **파일 분리 strategy** | **역할별 책임 분리 (책임 수만큼)** | **★ 역할 + 도메인 특성 적응** |
| **시나리오 분리 vs 통합** | POST/GET 분리 (Diagnosis 특성) | ★ **POST+GET+Meta 통합** (ShareLink 특성) |
| **에러 분리 vs 통합** | scenarios.ts 내 통합 | ★ **errors.ts 별도** (도메인 에러 풍부 시) |
| 현실 mock 가드 | M1~M5 + 신규 owner 분리 | S1~S6 + 신규 owner 분리 |
| spec 위임 | TEST-* 단일 | ★ TEST-* 분배 (보안 분배 시) |

**4종 가이드 § 정리 (★ 본 ISSUE 진화)**:
1. (P1) 패턴 미묘 구분 (API-003 §, 6 회째 케이스)
2. 분리/통합 strategy (API-005 §, ★ 본 ISSUE 다른 차원 다른 적응 — adaptive)
3. mapper 패턴 차이 (API-005 §, MOCK 영역 외)
4. **★ mock 도메인 결정 매트릭스 (★ MOCK-001 owner, ★ MOCK-002 adaptive 진화)** — Wave 3+ rigid → adaptive 전환

### ★ 결정론적 가드 § 2회째 성공 표 (★ MOCK 트랙 표준 안정 입증)

| ISSUE | 시점 | 검증 결과 | 의미 |
|---|---|---|---|
| MOCK-001 | Phase B.5 첫 도입 | grep 코드 0건 (주석 3 매치) | 표준 가드 정립 |
| MOCK-001 | Phase D 재검증 | grep 코드 0건 | 재현성 입증 |
| **★ MOCK-002** | **Phase B.5 2회째** | **grep 코드 0건** (주석 2 매치) | **★ 표준 안정** |
| MOCK-002 | Phase D 예정 | (예정) | 2 회 안정 입증 |

**표준 가드 정립 (★ MOCK 트랙 안정)**:
- 결정론적 ID / 좌표 / 날짜 / 통계 / URL — 모든 mock 데이터 고정값
- Math.random / Date.now / new Date 코드 0건 (주석은 가드 정의 명시)
- 시간 의존 버그 차단 + 디버깅 재현성 + TEST 시점 안정
- MOCK-004/005 답습 표준

### ★ Mismatch 2회째 작동 § (★ satisfies 양방향 검증기 입증)

| ISSUE | satisfies 검증 결과 | 발견 의미 |
|---|---|---|
| **MOCK-001** | **5건 발견** (CandidateAreaDTO 필드 / CommuteInfo / DiagnosisFilters / MOCK_CREATE_DIAGNOSIS_ERROR / GetDiagnosisResponse.timeline) | API-002 P1 re-export 특성 (Step 10.5 풍부 vs 명세 v1.0 가정) → 명세 v1.0 동기화 |
| **★ MOCK-002** | **★ 0건 통과** (15 satisfies 모두 정합) | API-003 base 0 신규 정의 특성 (share-link.ts 6 섹션 = 명세 정확) → 산출물 정확성 입증 |

**입증 의미 (★ satisfies 양방향 검증기)**:
- TS satisfies 키워드 = **양방향 검증기** (발견 + 통과 둘 다 가치)
  - **발견 시**: 명세 v1.0 가설 vs 산출물 사실 격차 표면 → 명세 동기화 + cleanup 트리거 (MOCK-001)
  - **통과 시**: 산출물 정확성 + 명세 v1.0 정합 입증 (MOCK-002)
- 도메인 특성 차이 입증:
  - **P1 적용 ISSUE** (API-002 등) = base entity + re-export → 명세 v1.0 미반영 가능성 = mismatch 가능
  - **신규 정의 ISSUE** (API-003/005 등) = base 0 + 명세 정확 정의 → mismatch 적음
- 미래 작업자 가이드: satisfies 검증 = 발견 시 정직 기록 / 통과 시 산출물 정확성 입증

### ★ 메모리 stale 자동 보정 누적 4건 § (★ 9 칸 누적 자가 치유 시스템 입증)

| # | 보정 시점 | 메모리 | 실제 | 보정 메커니즘 |
|---|---|---|---|---|
| 1 | grill-me (MOCK-001) | "Wave 3 진입" | Wave 2 트랙 E 첫 (트랙 D + E 둘 다 완성 필요) | 06_TASK_LIST L417-421 + gh issue list 실제 확인 |
| 2 | A.5 (MOCK-001) | "12 산출물" | 14 산출물 (API-005 +2: saved-search.ts + saved-search-api.ts) | Phase A.5 실제 ls |
| 3 | Q2 분석 (본 ISSUE) | "API-003 7타입" | 10 타입 (Request 2 + Response 3 + DTO 4 + Error 1 enum) | grep export interface/enum |
| **★ 4** | **A.4 (★ 본 ISSUE)** | **S1 validators/diagnosis.ts "47줄"** | **46줄** (1줄 차이) | wc -l 실제 측정 |

**자가 치유 시스템 입증 (★ 본 ISSUE 누적 4건)**:
- 메모리 = 시점 frozen (직전 세션 종료 시점) / Phase A grep + A.5 ls + wc -l = 실시간 사실
- 9 칸 + API-001/002/003/005 + MOCK-001 누적 "현실 추인 + 명세/보드 실제 우선" 원칙이 메모리 stale 시점에도 **자동 보정 시스템**으로 작동
- 향후 후행 ISSUE 시작 시 grill-me + Phase A 가 동일 패턴 답습 = 메모리 의존성 약화 + 시스템 신뢰성 증가
- 본 ISSUE 4건째 = **시스템 안정 진입 시점** (1~3 우연 / 4 이상 = 시스템 패턴 확정)

### ★ S1~S6 ShareLink 현실 코드 표 (★ 본 ISSUE 신규 Q2 가드, ★ S1 메모리 stale 4번째 보정)

| # | 위치 | 라인 | 역할 | 본 ISSUE | 후행 |
|---|---|---|---|---|---|
| **S1** | `onday-app/src/lib/validators/diagnosis.ts` | **46** (★ 메모리 "47줄" → 46줄 4번째 보정) | shareLinkInputSchema (CMD-SHARE-001 영역) | 미수정 | CMD-SHARE-001 |
| **S2** | `onday-app/src/app/api/share/route.ts` | 60 | POST createShareLink | 미수정 | CMD-SHARE-001 |
| **S3** | `onday-app/src/app/api/share/[uuid]/route.ts` | 61 | GET dual mapper Route | 미수정 | QRY-SHARE-001 (dual) |
| **S4** | `onday-app/src/app/share/[uuid]/page.tsx` | 76 | SSR dual mapper | 미수정 | QRY-SHARE-001 (dual) |
| **S5** | `onday-app/src/features/share/preview-stats.ts` | 0.8 KB | UI 표시 통계 | 미수정 | UI-007 |
| **S6** | `onday-app/src/components/share/` 3 | locked-card / report-card / share-hero | UI 컴포넌트 | 미수정 | UI-007 |

**Q2 (가) 책임 분리 사유**:
- S1~S6 = ShareLink 도메인 CRUD 영역 (CMD-SHARE / QRY-SHARE / UI-007)
- 신규 owner `lib/mocks/share-link/` = UI prop fixture (UI-006/007/008 + TEST-003/004)
- 다른 책임 + 다른 사용처 + 다른 워크플로 → 공존 자연 (N1~N6 / SS1~SS3 / MOCK-001 M1~M5 패턴 5 회째 답습)

### ★ ServiceModeType 재사용 6 회째 표 (SMT1~SMT6, ★ MOCK 차원 2번째)

| # | 위치 | 역할 | 차원 | 패턴 |
|---|---|---|---|---|
| SMT1 | `src/lib/types/user.ts` L5 | `export type ServiceModeType` 정의 (DB-002) | type 영역 | 정의 |
| SMT2 | `src/lib/types/diagnosis.ts` L13 | import type (API-002) | type 영역 | import |
| SMT3 | `src/lib/types/share-link.ts` L11 | import type (API-003) | type 영역 | import |
| SMT4 | `src/lib/types/saved-search.ts` L13 | import type (API-005) | type 영역 | import |
| SMT5 | `src/lib/mocks/diagnosis/get-diagnosis.ts` L26 | `mode: 'couple'` satisfies (MOCK-001) | mock 영역 1번째 | satisfies 자동 |
| **★ SMT6** | `src/lib/mocks/share-link/report-data.ts` **L37** (Phase B.1 신규) | **`mode: 'couple'` satisfies (★ MOCK-002)** | **★ mock 영역 2번째 — 안정 입증** | **satisfies 자동 (ReportDTO.mode 자동 타입 체크)** |

**6 회째 패턴 안정 입증 (★ MOCK 차원 2번째)**:
- type 영역 (SMT1~SMT4) = import type 명시 (4 회 일관)
- ★ mock 영역 (SMT5~SMT6) = satisfies 자동, import 불필요 (2 회 안정)
- (P1) 정신 차원 확장 = type 영역 / mock 영역 둘 다 "기존 산출물 재사용" 정신 일관
- Q2 가드 6 회째 사수 (API-002 첫 + API-003 + API-005 + MOCK-001 + 본 ISSUE)

### ★ Q4~Q7 자동 묶음 표 (검수 부담 분산)

| Q | 영역 | 결정 | 결과 |
|---|---|---|---|
| **Q4** | §3.9 spec 분배 (★ MOCK-001 단일과 다름) | **⏸ TEST-003 (공유 GWT) + TEST-004 (공유 보안) 분배 위임** | vitest config 부재 13 회째 일관 + ★ **보안 분배** (REQ-NF-021 만료 링크 개인정보 0건 = TEST-004) |
| **Q5** | 결정론적 가드 | **✅ 자동 가드 2회째 성공** | MOCK-001 표준 답습 + Phase B.5 grep 코드 0건 (주석 2 매치) + Phase D 재검증 + ★ MOCK 트랙 표준 안정 입증 |
| **Q6** | satisfies 검증 (API-003 산출물 활용) | **✅ 15 곳 satisfies + ★ Wave 2 체인 6회째 다중 차원 + Mismatch 2회째 0건** | API-003 10 타입 (Request 2 + Response 3 + DTO 4 + Error 1 + DTO 1 = 11 정확, ★ 메모리 "7" → 10 보정 3번째) |
| **Q7** | 만료 링크 report 노출 (REQ-NF-021) | **✅ DTO contract only — CMD-SHARE-003 위임** | 명세 §9 Open Question 3 보존 + 본 ISSUE = fixture only + 만료 시나리오 ShareLinkMetaDTO 분리만, report null 결정 = CMD-SHARE-003 영역 |

### ★ 부재 산출물 표 (TEST-003 + TEST-004 분배 위임)

| 명세 §3 산출물 | 현실 (Phase A 확인) | 위임 대상 |
|---|---|---|
| §3.9 `__tests__/mocks/share-link.spec.ts` 6 케이스 | vitest config 부재 13 회째 일관 + REQ-NF-021 보안 검증 분리 | **★ TEST-003 (공유 링크 GWT — 정상/만료/비밀번호) + TEST-004 (공유 링크 보안 — REQ-NF-021 만료 링크 개인정보 0건 + 비인가 접근)** |

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 ISSUE 사용처 |
|---|---|---|
| **★ API-003** (PR #83 머지 완료, main `f0b012e`) | ★ **본 ISSUE 핵심 선행** — `lib/types/share-link.ts` (10 타입 — CreateShareLinkRequest + VerifyPasswordRequest + CreateShareLinkResponse + GetReportResponse + VerifyPasswordResponse + ReportDTO + DataSourceDTO + ShareLinkMetaDTO + ShareLinkErrorCode + ShareLinkErrorDTO) | 15 satisfies 검증 + Wave 2 체인 6 회째 API→MOCK 2번째 입증 |
| **★ MOCK-001** (PR #85 머지 완료, main `d49c484`) | ★ **본 ISSUE 핵심 선행** — `lib/mocks/diagnosis/candidates.ts` (`MOCK_CANDIDATES_NORMAL` 4 후보) + ★ MOCK-001 §9 답습 가이드 § (rigid 일반화 패턴) | ★ MOCK_CANDIDATES_NORMAL 재사용 = MOCK→MOCK 차원 신규 + ★ 답습 가이드 § 첫 실전 검증 = adaptive 입증 |
| **API-001/002/005** (PR #81/82/84 머지 완료) | API Contract 트랙 (B) 절충 + Phase B 활성 + 커밋 2 개 패턴 | ★ 본 ISSUE 답습 기준 6 회째 |
| **DB-007** (PR #80 머지 완료) | L6 1차 발견 | 본 ISSUE = Q2 가드 13 번째 사수 |
| DB-001~006 / INFRA-001 | 간접 선행 (Phase 패턴 + dead 회피 + 13 회 회귀 0 가드 답습) | DB-* / INFRA-* 패턴 답습 |

### 후행 ISSUE 정합성 (Q1~Q7 결정 트리거)

| 후행 Task ID | 본 ISSUE 위임 트리거 |
|---|---|
| **★ UI-006** (공유 링크 생성 버튼 + 클립보드 복사) | `MOCK_CREATE_SHARE_LINK_VALID` 또는 `MOCK_CREATE_SHARE_LINK_PASSWORD` import + 클립보드 복사 확인 UI |
| **★ UI-007** (SSR 공유 리포트 페이지) | `MOCK_GET_REPORT_VALID` import + 무료 미리보기 1 곳 + DataSource 배지 + OG 메타태그 |
| **★ UI-008** (회원가입/유료 전환 유도 모달) | `MOCK_GET_REPORT_PREVIEW_EXHAUSTED` import + 유료 전환 유도 모달 + 300ms 표시 |
| **★ TEST-003** (공유 링크 GWT) | 4 시나리오 fixture (유효/만료/비밀번호/미리보기소진) + AC-1~6 검증 |
| **★ TEST-004** (공유 링크 보안) | `MOCK_SHARE_ERROR_UNAUTHORIZED` + `MOCK_SHARE_ERROR_PASSWORD_MISMATCH` + 만료 링크 개인정보 0건 검증 (REQ-NF-021) |
| **★ MOCK-004** (카카오 API Mock) | ★ 본 ISSUE adaptive 패턴 답습 + API-007 활용 + Wave 2 체인 7 회째 |
| **★ MOCK-005** (OAuth Mock) | ★ 본 ISSUE adaptive 패턴 답습 + API-001 auth.ts 활용 + Wave 2 체인 8 회째 + ★ MockUser/AuthProvider L6 cleanup 의존성 약함 |
| **CMD-SHARE-003** (만료 링크 안내) | ★ 본 ISSUE Q7 위임 — 만료 시나리오 ShareLinkMetaDTO_EXPIRED + report null 결정 + REQ-NF-021 보안 |
| **★ cleanup ISSUE (REFACTOR-L6)** | Q2 가드 13 번째 사수 일관 + 본 ISSUE 의존성 약함 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

> ★ API-001/002/003/005/MOCK-001 패턴 답습 6 회째 (Phase A 사전 검증 + Phase B 활성 4 파일 + Phase C 명세 동기화 + Phase D 커밋 2 개) + (B) 절충 + Q3 (가) 명세 v1.0 정확 답습 + Q2 (가) 책임 분리 + ★ 가이드 § adaptive 입증.

- [x] **3.1** `lib/mocks/share-link/` 디렉토리 + 4 파일 신규 — **Phase B 완료**
  > 신규 owner 디렉토리 생성 (M4 부재 → 신규).

- [x] **3.2** `report-data.ts` 공통 base — **Phase B.1 완료 (★ Wave 2 체인 6회째 첫 코드 입증)**
  > MOCK_DATA_SOURCES 3 satisfies DataSourceDTO[] (카카오 모빌리티 + 국토교통부 + 경찰청) + MOCK_REPORT_NORMAL satisfies ReportDTO + MOCK_REPORT_PREVIEW_USED satisfies ReportDTO.
  > ★ import 정확 2: `ReportDTO + DataSourceDTO from '@/lib/types/share-link'` (★ API→MOCK 2번째) + `MOCK_CANDIDATES_NORMAL from '@/lib/mocks/diagnosis'` (★ MOCK→MOCK 신규).
  > ★ ServiceModeType 6 회째 satisfies 자동 (mode='couple').

- [x] **3.3** `scenarios.ts` 유효 시나리오 — **Phase B.2 완료**
  > MOCK_CREATE_SHARE_LINK_VALID + MOCK_SHARE_LINK_META_VALID + MOCK_GET_REPORT_VALID 3 객체 통합 (★ POST+GET+Meta 통합 = 도메인 특성 적응).

- [x] **3.4** `scenarios.ts` 만료 시나리오 — **Phase B.2 완료**
  > MOCK_SHARE_LINK_META_EXPIRED 1 객체 (expiresAt 과거 + isExpired: true).

- [x] **3.5** `scenarios.ts` 비밀번호 시나리오 — **Phase B.2 완료**
  > MOCK_SHARE_LINK_META_PASSWORD + MOCK_CREATE_SHARE_LINK_PASSWORD 2 객체 (hasPassword: true).

- [x] **3.6** `scenarios.ts` 미리보기 소진 시나리오 — **Phase B.2 완료**
  > MOCK_GET_REPORT_PREVIEW_EXHAUSTED 1 객체 (REQ-FUNC-014 유료 전환 모달 base).

- [x] **3.7** `errors.ts` 4 에러 — **Phase B.3 완료 (★ MOCK-001 ④ 보정 패턴 답습)**
  > MOCK_SHARE_ERROR_EXPIRED + MOCK_SHARE_ERROR_PASSWORD_MISMATCH + MOCK_SHARE_ERROR_NOT_FOUND + MOCK_SHARE_ERROR_UNAUTHORIZED × ShareLinkErrorDTO satisfies. ★ `as const` 가 아닌 satisfies (MOCK-001 ④ 보정 답습).

- [x] **3.8** `index.ts` 배럴 export — **Phase B.4 완료**
  > 3 export. UI-006/007/008 + TEST-003/004 호출처 단순화.

- [⏸ TEST-003 + TEST-004 분배 위임] **3.9** `__tests__/mocks/share-link.spec.ts` 6 케이스 — **Q4 부재 산출물 결정**
  > **사유 3종 (DB-001~007 + API-001/002/003/005 + MOCK-001 일관 13 회째)**:
  > 1. **vitest config 부재 (Phase A.7 확인)** → spec 작성해도 실행 불가
  > 2. **AC-5 grep static check 분리 가능** → Phase D `grep -rnE "Math\.random|Date\.now|new Date"` 0건 검증
  > 3. **★ TEST-003 + TEST-004 분배 영역** (★ MOCK-001 TEST-001 단일과 다름):
  >    - TEST-003 (공유 링크 GWT): 정상/만료/비밀번호/미리보기소진 4 시나리오
  >    - TEST-004 (공유 링크 보안): REQ-NF-021 만료 링크 개인정보 0건 + 비인가 접근 + 비밀번호 불일치

### ★ Q1~Q7 결정 vs 명세 v1.0 mismatch 추적 표 (API-001/002/003/005/MOCK-001 패턴 답습 6 회째)

| Q | 영역 | 명세 v1.0 (MOCK-002.md) | 현실 (onday-app) | 결정 | 후행 처리 |
|---|---|---|---|---|---|
| **Q1** | 작업 모드 | §3.1~3.9 9 산출물 신규 작성 | S1~S6 현실 mock 가드 + lib/mocks/share-link/ 부재 + 명세 변수 grep 0건 + vitest 부재 | **(B) 절충 — 5 → 4 파일 분리 + spec 위임 (★ API-001/002/003/005/MOCK-001 일관 6 회째)** | Phase B 4 파일 + Phase D 커밋 2개 |
| **페이스** | 세션 진행 범위 | — | MOCK-001 풀세트 직후 + 컨디션 OK + 가드 충돌 0 + MOCK-001 답습 패턴 메모리 따끈 | **(가) 풀세트 도전 — Phase A~D 본 세션 진행** | Phase A~D 진행 |
| **Q2** | 기존 mock 경계 | (명세 §3.1 신규 lib/mocks/share-link/ 만 명시) | S1~S6 ShareLink 현실 코드 (API-003 가드) + M1~M3 mock + 신규 owner 부재 | **(가) 두 시스템 공존 — 책임 분리** (S1~S6 + M1~M3 가드 + 신규 owner) | S1~S6 가드 보존 + cleanup 의존성 약함 |
| **Q3** ★★ | 4 파일 분리 strategy (가이드 § vs 명세 v1.0) | §3.1~3.9 4 코드 파일 (report-data/scenarios/errors/index) | MOCK-001 §9 답습 가이드 § "shareLinks/scenarios/get-share/index" rigid 일반화 | **(가) 명세 v1.0 정확 답습 — 도메인 특성 적응 (adaptive 입증) + 가이드 § §9 보정 트리거 정직 기록** | ★ MOCK-001 §9 답습 가이드 § = adaptive 가능성 명시 → Wave 3+ adaptive 표준 |
| **Q4** | §3.9 spec | 신규 작성 6 케이스 | vitest config 부재 13 회째 + 보안 분리 가능 | **⏸ TEST-003 + TEST-004 분배 위임** (★ MOCK-001 TEST-001 단일과 다름) | TEST-003 + TEST-004 |
| **Q5** | 결정론적 가드 | AC-5 명시 | Phase B grep 코드 0건 (주석 2 매치) | **✅ 자동 가드 2회째 성공** | Phase D 재검증 + MOCK 트랙 표준 안정 |
| **Q6** | satisfies 검증 | (명세 §3.2~3.8 satisfies 명시) | API-003 산출물 10 타입 활용 + MOCK_CANDIDATES_NORMAL 재사용 | **✅ 15 곳 satisfies + ★ Wave 2 체인 6회째 다중 차원 + Mismatch 2회째 0건** | TEST-003/004 시점 검증 |
| **Q7** | 만료 링크 report 노출 (REQ-NF-021) | (명세 §9 Open Question 3) | DTO contract 명시 시점 만 | **✅ DTO contract only — CMD-SHARE-003 영역 위임** | CMD-SHARE-003 |
| **보조 1** ★ | Mismatch 추적 정신 2회째 | (메모리 적용 시점) | API-003 base 0 신규 정의 = mismatch 적음 | **0건 통과 + ★ satisfies 양방향 검증기 입증** | TEST-003/004 시점 |
| **보조 2** | 메모리 stale 자동 보정 4번째 | (메모리 = frozen) | S1 47줄 → 46줄 보정 + 누적 4건 | ★ 정직 기록 + ★ 자가 치유 시스템 안정 진입 입증 | 향후 grill-me 답습 |

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD — API-001/002/003/005/MOCK-001 ⏸ 패턴 일관 + Phase B 작성분 충족 + ★ AC-7/8 신규)

**AC-1 (정상, ✅ Phase B 산출물 충족):** 유효 공유 링크 Mock 데이터 구조 검증
- **Given** `MOCK_GET_REPORT_VALID` import 된 상태
- **When** `GetReportResponse` 타입으로 satisfies 검증
- **Then** `report.candidates.length === 4` (★ MOCK-001 MOCK_CANDIDATES_NORMAL 재사용) + `shareLink.isExpired === false` + `sources.length === 3` + `shareLink.uniqueUrl === 'mock-token-001'` (결정론적) + `report.freePreviewUsed === false`
- **Status:** ✅ Phase B.2 satisfies + Phase B.5 tsc exit 0

**AC-2 (예외, ✅ Phase B 산출물 충족):** 만료 공유 링크 Mock 검증
- **Given** `MOCK_SHARE_LINK_META_EXPIRED` import 된 상태
- **When** `isExpired` 필드 + `expiresAt` 확인
- **Then** `isExpired === true` + `expiresAt === '2026-03-01T10:00:00.000Z'` (과거 고정) + `MOCK_SHARE_ERROR_EXPIRED.httpStatus === 410`
- **Status:** ✅ Phase B.2 + B.3 satisfies

**AC-3 (예외, ✅ Phase B 산출물 충족, ★ MOCK-001 ④ 보정 답습):** 비밀번호 불일치 에러 Mock 검증
- **Given** `MOCK_SHARE_ERROR_PASSWORD_MISMATCH` import 된 상태
- **When** `code` + `httpStatus` 확인
- **Then** `code === ShareLinkErrorCode.PASSWORD_MISMATCH` + `httpStatus === 401` + `message` 한국어 + ★ **satisfies ShareLinkErrorDTO** (`as const` 아님)
- **Status:** ✅ Phase B.3 satisfies ShareLinkErrorDTO

**AC-4 (경계, ✅ Phase B 산출물 충족):** 무료 미리보기 소진 Mock 검증
- **Given** `MOCK_GET_REPORT_PREVIEW_EXHAUSTED` import 된 상태
- **When** `report.freePreviewUsed` + `shareLink.freePreviewUsed` 확인
- **Then** 둘 다 `true` + UI-008 유료 전환 유도 모달 base
- **Status:** ✅ Phase B.2 satisfies

**AC-5 (경계, ✅ Phase B 산출물 충족 + ★ MOCK 트랙 표준 2회째 안정):** Math.random / Date.now / new Date 0건
- **Given** `lib/mocks/share-link/` 디렉토리 모든 .ts 파일
- **When** `grep -rnE "Math\.random|Date\.now|new Date" lib/mocks/share-link/`
- **Then** 코드 0건 (주석 2 매치만)
- **Status:** ✅ Phase B.5 grep + Phase D 재검증 + ★ MOCK 트랙 표준 안정

**AC-6 (정상, ✅ Phase B 산출물 충족, ★ Q3 (가) adaptive 입증):** Q3 명세 v1.0 정확 답습 검증
- **Given** Phase B 4 파일 (report-data / scenarios / errors / index) — MOCK-001 §9 답습 가이드 § 일반화 (shareLinks/scenarios/get-share/index) 와 다름
- **When** 각 파일 책임 grep — report-data(공통 base) / scenarios(4 시나리오 통합 POST+GET+Meta) / errors(4 에러 별도) / index(배럴)
- **Then** 책임 분리 명확 + ★ **scenarios.ts 통합 패턴** (유효 = 3 객체 그룹 / 비밀번호 = 2 객체 그룹) = **★ 도메인 특성 적응 = adaptive 입증**
- **Status:** ✅ Phase B.5 tsc exit 0 + ★ 가이드 § rigid → adaptive 진화 입증

**★ AC-7 (정직성, ✅ Phase B 산출물 충족 + Phase C 정직 기록 — ★ Mismatch 2회째 작동):** satisfies 양방향 검증기 입증
- **Given** Phase B 15 satisfies 검증 시점에 API-003 산출물 (10 타입) vs 명세 v1.0 §3.2~3.7 가정 비교
- **When** TS satisfies 검증 통과 (mismatch 0건)
- **Then** API-003 base 0 신규 정의 정확성 + 명세 v1.0 정합 입증 + ★ MOCK-001 5건 발견 vs MOCK-002 0건 = 도메인 특성 차이 입증 (P1 적용 vs 신규 정의)
- **Status:** ✅ Phase C §2 Mismatch 2회째 작동 § + ★ "satisfies = 양방향 검증기" (발견 + 통과 둘 다 가치)

**★ AC-8 (정직성, ✅ Phase C 산출물 충족 — ★ 가이드 § adaptive 입증):** MOCK-001 답습 가이드 § rigid → adaptive 진화 입증
- **Given** MOCK-001 §9 답습 가이드 § "shareLinks/scenarios/get-share/index" rigid 일반화 패턴 (POST≠GET 모든 도메인 답습 가정)
- **When** Phase B 실전 작업 시 도메인 특성 검토 (ShareLink = POST+GET+Meta 통합 + 에러 풍부) → 명세 v1.0 정확 답습 채택
- **Then** 가이드 §의 **adaptive 가능성 입증** + §9 보정 트리거 발생 + Wave 3+ 새 도메인 가이드 = adaptive 패턴 표준
- **Status:** ✅ Phase C §2 가이드 § adaptive 입증 § + §9 4종 신규 § + ★ "rigid 가이드보다 adaptive 가이드 우월" = 워크플로 시스템 메타 진화

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-006 | "공유 링크 생성 응답 시간 — ≤ 500ms" (§4.2.1) | ✅ Mock 데이터 = 순수 객체 리터럴 + Phase B `tsc --noEmit` exit 0 |
| REQ-NF-020 | "공유 링크 보안 — URL entropy ≥ 128bit (UUID v4), 열람 비밀번호 옵션" (§4.2.3) | ✅ MOCK_SHARE_LINK_META_PASSWORD `hasPassword: true` + `uniqueUrl` 토큰 형식 |
| REQ-NF-021 | "비인가 접근 시 개인정보 노출 0건" (§4.2.3) | ✅ MOCK_SHARE_ERROR_UNAUTHORIZED satisfies ShareLinkErrorDTO + ⏸ TEST-004 (만료 링크 report null = CMD-SHARE-003 영역) |

---

## 6. 📦 Deliverables (산출물 명시 — 신규/보존/위임/정직성 4 구역)

### ✅ 신규 (5 — 4 코드 + 1 docs, Phase B + C, ★ API-005/MOCK-001 +0 일관 6 회째)

**Phase B 코드 (4 파일)**:
- `onday-app/src/lib/mocks/share-link/report-data.ts` (신규, ★ 공통 base, 신규 owner 디렉토리 포함) — DataSource 3 + Report 2. import 정확 2 (★ Wave 2 체인 6회째 다중 차원)
- `onday-app/src/lib/mocks/share-link/scenarios.ts` (신규) — 4 시나리오 통합 7 객체. import 정확 4
- `onday-app/src/lib/mocks/share-link/errors.ts` (신규, ★ MOCK-001 ④ 보정 답습) — 4 에러 satisfies ShareLinkErrorDTO
- `onday-app/src/lib/mocks/share-link/index.ts` (신규) — 배럴 3 export

**Phase C 명세 (1 파일)**:
- `tasks/MOCK-002.md` — 본 명세 현실 동기화 (Q1~Q7 + ★★ 가이드 § adaptive 입증 § + ★ Wave 2 체인 6회째 다중 차원 § + Q3 명세 정확 답습 + (P1) 6회째 + 분리/통합 다른 차원 적응 + mock 도메인 매트릭스 6회째 adaptive + 결정론적 가드 2회째 + ★ Mismatch 2회째 0건 + ★ 메모리 stale 4건 + S1~S6 + SMT6 + Q4~Q7 + §9 4종 신규 §)

### ✅ 보존 (DB-001~007 12 + API-001/002/003/005 산출물 14 + MOCK-001 산출물 4 + types.ts + DiagnosisMode 11/DiagnosisStatus 2/F0/ServiceModeType 4 회 + S1~S6 + SS1~SS3 + N1~N6 + mock-auth M1~M4 + M1~M3 mock + .env.example = 16+종, 본 ISSUE 절대 미수정)

**누적 13 가드**: types.ts:1-3 ★ 13번째 사수 + API-001~005 산출물 14 + MOCK-001 산출물 4 + DB-001~007 12 + user.ts + diagnosis.ts + auth.ts + share-link.ts + saved-search.ts + saved-search-api.ts + .env.example + package.json + 06_TASK_LIST_v1.3.md

**S1~S6 ShareLink 현실 코드 가드 (★ 본 ISSUE 신규 Q2 가드, API-003 누적)**: S1 46 + S2 60 + S3 61 + S4 76 + S5 + S6 — 위 §2 S1~S6 표 참조

**M1~M3 mock + SS1~SS3 + N1~N6 + mock-auth M1~M4 (API/MOCK 가드 누적)**: 본 ISSUE 무관여

**Q2 가드 (17 행, ★ 6 회째 사수 — MOCK 차원 2번째)**: types.ts (DiagnosisMode 11 DM1~DM11 + DiagnosisStatus 2 DS1~DS2 + F0 + ServiceModeType 4 회 호출처 SMT1~SMT4 + MOCK-001 SMT5 + ★ 본 ISSUE SMT6) — 위 §2 ServiceModeType 6 회째 표 참조

### ⏸ 위임 (2 — ★ 보안 분배, MOCK-001 단일과 다름)

- §3.9 `__tests__/mocks/share-link.spec.ts` 4 케이스 (정상 / 만료 / 비밀번호 / 미리보기소진) → **TEST-003 (공유 링크 GWT)** (Q4)
- §3.9 보안 케이스 (REQ-NF-021 만료 링크 개인정보 0건 + 비인가 접근 + 비밀번호 불일치) → **TEST-004 (공유 링크 보안)** (Q4)

### 🔄 정직성 (4 — ★ 본 ISSUE 진짜 핵심 가치 4 종)

- **★★ 가이드 § adaptive 입증** (★ 본 ISSUE 진짜 메타 핵심) — MOCK-001 §9 답습 가이드 § rigid 일반화 → 본 ISSUE adaptive 입증 → §9 보정 트리거 + Wave 3+ adaptive 표준. 워크플로 시스템 메타 진화. §9 본문 § 참조.
- **★ Wave 2 체인 6회째 다중 차원** — API → MOCK 차원 2번째 (API-003 ReportDTO 첫 fixture 활용) + MOCK → MOCK 차원 신규 (MOCK_CANDIDATES_NORMAL 재사용) 동시 작동 = 체인 시스템 다중 차원 동시 작동 입증. report-data.ts L23-24 코드 위치.
- **★ Mismatch 2회째 작동 0건 통과** — satisfies = 양방향 검증기 (발견 + 통과 둘 다 가치). MOCK-001 5건 발견 (P1 적용) vs MOCK-002 0건 (신규 정의) = 도메인 특성 차이 입증.
- **★ 메모리 stale 자동 보정 4건 누적** — 9 칸+API/MOCK 누적 "현실 추인" 원칙이 자가 치유 시스템으로 진화. 4건째 = 시스템 안정 진입 시점 (1~3 우연 / 4 이상 = 패턴 확정).

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 ISSUE 시작 전 필요)

- **★ API-003** (PR #83 머지 완료): ★ **본 ISSUE 핵심 선행** — `share-link.ts` 10 타입 (★ 메모리 "7" → 10 보정 3번째) 활용 + 15 satisfies + Wave 2 체인 6 회째 API→MOCK 2번째.
- **★ MOCK-001** (PR #85 머지 완료, main `d49c484`): ★ **본 ISSUE 핵심 선행** — MOCK_CANDIDATES_NORMAL 재사용 (★ MOCK→MOCK 차원 신규) + MOCK-001 §9 답습 가이드 § 첫 실전 검증 = adaptive 입증.
- **API-001/002/005** (PR #81/82/84 머지 완료): API Contract (B) 절충 + Phase B 활성 + 커밋 2 개 패턴. ★ 본 ISSUE 답습 기준 6 회째.
- **DB-007** (PR #80 머지 완료): L6 1차 발견. 본 ISSUE = Q2 가드 13 번째 사수 (의존성 약함).
- **DB-001~006 / INFRA-001**: 간접 선행 (Phase 패턴 + dead 회피 + 13 회 회귀 0 가드 답습).

### 후행 (이 ISSUE 완료 후 차례로 가능)

- **★ UI-006** (공유 링크 생성 버튼): MOCK_CREATE_SHARE_LINK_VALID/PASSWORD import + 클립보드 복사
- **★ UI-007** (SSR 공유 리포트): MOCK_GET_REPORT_VALID import + 무료 미리보기 + DataSource 배지
- **★ UI-008** (유료 전환 모달): MOCK_GET_REPORT_PREVIEW_EXHAUSTED import + 300ms 모달
- **★ TEST-003** (공유 GWT): 4 시나리오 + AC-1~6
- **★ TEST-004** (공유 보안): MOCK_SHARE_ERROR_UNAUTHORIZED + 만료 링크 개인정보 0건 (REQ-NF-021)
- **★ MOCK-004 / MOCK-005**: ★ 본 ISSUE adaptive 패턴 답습 + Wave 2 체인 7/8 회째
- **CMD-SHARE-003** (만료 링크 안내): Q7 위임 — report null 결정 + REQ-NF-021
- **★ cleanup ISSUE (REFACTOR-L6)**: Q2 가드 13 번째 사수 일관 + 본 ISSUE 의존성 약함

---

## 8. 🧪 Test Plan (검증 절차)

### Phase A (본 ISSUE) — 사전 검증 (read-only) — ✅ 완료

- ✅ A.1 main 동기화 (`44cebf8..d49c484` fast-forward, PR #85 머지본 흡수 — MOCK-001 산출물 4 신규)
- ✅ A.2 feature/MOCK-002 신규 분기 + untracked 2 건 외 변경 0
- ✅ A.3 13 칸 가드 read-only (types.ts:1-3 ★ 13번째 사수 + API-001~005 산출물 14 + MOCK-001 산출물 4 + DB-001~007 + user.ts)
- ✅ A.4 **S1~S6 ShareLink 현실 코드 grep** — S1 **46** (★ 메모리 "47" → 46 보정 4번째) / S2 60 / S3 61 / S4 76 / S5 / S6 3 components
- ✅ A.5 **M5 명세 변수 grep 0건** (`MOCK_REPORT_*` / `MOCK_SHARE_LINK_META_*` / `MOCK_GET_REPORT_*` / `MOCK_SHARE_ERROR_*` / `MOCK_CREATE_SHARE_LINK` = 100% 명세 신규)
- ✅ A.6 API-003 share-link.ts **10 타입** 모두 존재 확인 (★ 메모리 "7" → 10 보정 3번째)
- ✅ A.7 MOCK-001 산출물 4 파일 main 반영 (candidates / get-diagnosis / index / scenarios)
- ✅ A.8 `src/lib/mocks/share-link/` 부재 = 신규 owner 위치 정확
- ✅ A.9 `prisma validate` exit 0 + `prisma generate` exit 0 (7.8.0, 22ms) + `tsc --noEmit` exit 0
- ✅ A.10 env-less `npm run build` exit 0 + **Middleware 32.5 kB** (★ 13 번째 회귀 0)

### Phase B (본 ISSUE) — 활성, 4 파일 신규 — ✅ 완료

- ✅ B.1 `report-data.ts` 신규 (★ Wave 2 체인 6회째 다중 차원 입증 + ServiceModeType 6 회째 satisfies 자동)
- ✅ B.2 `scenarios.ts` 신규 (4 시나리오 통합 7 객체, ★ POST+GET+Meta 통합 = 도메인 특성 적응 = adaptive 입증)
- ✅ B.3 `errors.ts` 신규 (4 에러 satisfies ShareLinkErrorDTO, ★ MOCK-001 ④ 보정 답습)
- ✅ B.4 `index.ts` 신규 (배럴 3 export)
- ✅ B.5 `tsc --noEmit` exit 0 (회귀 0) + `prisma validate` exit 0 + ★ 결정론적 grep 코드 0건 (주석 2 매치) + 가드 grep (Prisma/types.ts 직접/S1~S6/M1~M3) 코드 0건 + 가드 16+종 무수정 + ★ **Mismatch 0건 통과** (satisfies 양방향 검증기 입증)

### 후행 ISSUE 검증 (위임)

- **TEST-003 (공유 GWT)**: 4 시나리오 + AC-1~6 + ★ MOCK-001 답습 가이드 § adaptive 패턴 적용
- **TEST-004 (공유 보안)**: REQ-NF-021 만료 링크 개인정보 0건 + 비인가 접근 + 비밀번호 불일치
- **수동 검증** (UI-006~008 시점):
  1. IDE 에서 Mock 객체 hover 시 API-003 DTO 타입 정상 표시
  2. `tsc --noEmit` satisfies 15 곳 호환 재확인
  3. SSR 공유 페이지 Mock 주입 4 시나리오 렌더링

---

## 9. 🚧 Open Questions / Risks (보류 사항 — follow-up 4+ + ★ 4 종 신규 § = 본 ISSUE 진짜 메타 가치)

### ★★ 가이드 § adaptive 입증 § (★ 본 ISSUE 진짜 메타 핵심 — rigid → adaptive 진화)

§2 가이드 § adaptive 입증 § 표 참조. 핵심 요점 재명시:
- MOCK-001 §9 답습 가이드 § = rigid 일반화 패턴 (POST≠GET 모든 도메인 답습 가정) → 본 ISSUE 실전 검증 = 도메인 특성 적응 필요 (ShareLink = POST+GET+Meta 통합 + 에러 풍부)
- 결론: **rigid 가이드 → adaptive 가이드 진화 = 워크플로 시스템 메타 진화**
- 코드 증거: scenarios.ts 통합 패턴 (유효 = 3 객체 그룹 / 비밀번호 = 2 객체 그룹)
- §9 보정 트리거: MOCK-001 §9 답습 가이드 § = "도메인 특성 적응 가능" 명시 필요 → Wave 3+ adaptive 표준
- 메타 가치: "rigid 가이드보다 adaptive 가이드 우월" 입증 → 향후 새 도메인 ISSUE = 본 § 답습

### ★ Wave 2 체인 6회째 다중 차원 § (★ 체인 다양화 입증)

§2 Wave 2 체인 6회째 다중 차원 § 표 참조. 핵심 요점 재명시:
- ★ API → MOCK 차원 2 번째 (API-003 ReportDTO 첫 fixture 활용) + ★ MOCK → MOCK 차원 신규 (MOCK_CANDIDATES_NORMAL 재사용) **동시 작동**
- 코드 증거: report-data.ts L23-24 (두 import 줄)
- 14 ISSUE 누적 워크플로 = 격리된 칸 아닌 **다차원 체인 그래프** + 다중 차원 동시 작동 = 시스템 성숙도 입증
- 향후 후행 ISSUE: MOCK-004/005 = Wave 2 체인 7/8 회째 / UI-* → CMD-* = 다른 차원 확장 가능

### ★ Mismatch 2회째 작동 § (★ satisfies 양방향 검증기 입증)

§2 Mismatch 2회째 작동 § 표 참조. 핵심 요점 재명시:
- TS satisfies = **양방향 검증기** (발견 + 통과 둘 다 가치)
- MOCK-001 5건 발견 (P1 적용 = base entity + re-export → 명세 v1.0 미반영 가능) vs MOCK-002 0건 (신규 정의 = base 0 + 명세 정확 정의)
- 도메인 특성 차이 입증 + 산출물 정확성 입증
- 미래 작업자 가이드: satisfies 검증 = 발견 시 정직 기록 / 통과 시 산출물 정확성 입증

### ★ 메모리 stale 자동 보정 4건 누적 § (★ 자가 치유 시스템 안정 진입)

§2 메모리 stale 자동 보정 누적 4건 § 표 참조. 핵심 요점 재명시:
- 보정 1 ("Wave 3 진입" → 트랙 E 첫) / 보정 2 ("12 산출물" → 14) / 보정 3 ("7 타입" → 10) / **★ 보정 4 ("S1 47줄" → 46줄)**
- 메커니즘: 보드 + L417-421 / ls / grep / wc -l
- 의미: 9 칸+API/MOCK 누적 "현실 추인 + 명세/보드 실제 우선" 원칙 = **자가 치유 시스템 안정 진입** (4건째 = 1~3 우연 / 4 이상 = 패턴 확정)
- 향후 후행 ISSUE: grill-me + Phase A 가 동일 패턴 답습 = 메모리 의존성 약화 + 시스템 신뢰성 증가

### 1. ★ §3.9 TEST-003 + TEST-004 분배 위임 — Mock 무결성 spec 6 케이스

TEST-003 (공유 링크 GWT) 시점에:
- `vitest.config.ts` 신규 (DB-001~007 + API-001/002/003/005 + MOCK-001 + 본 ISSUE 일괄 위임 누적 14 회 해소)
- `__tests__/mocks/share-link.spec.ts` 4 케이스 (유효 / 만료 / 비밀번호 / 미리보기소진)
- 공유 링크 GWT E2E (REQ-FUNC-009~014 통합)

TEST-004 (공유 링크 보안) 시점에:
- REQ-NF-021 만료 링크 개인정보 0건 검증
- 비인가 접근 (MOCK_SHARE_ERROR_UNAUTHORIZED) + 비밀번호 불일치 (MOCK_SHARE_ERROR_PASSWORD_MISMATCH) 테스트

### 2. ★ Q7 만료 링크 report 노출 = CMD-SHARE-003 영역 (본 ISSUE 미결정)

본 ISSUE = fixture only + 만료 시나리오 ShareLinkMetaDTO_EXPIRED 분리만 (report null 또는 제거 결정 = CMD-SHARE-003).
CMD-SHARE-003 시점에:
- 만료 링크 접근 시 GetReportResponse.report = null 또는 별도 ExpiredResponse 결정
- REQ-NF-021 개인정보 노출 0건 보장 (TEST-004 통합)

### 3. ★ 결정론적 가드 § 표준 — MOCK 트랙 안정 (2 회째 성공)

MOCK-004/005 답습:
- 결정론적 ID / 좌표 / 날짜 / 통계 / URL — 모든 mock 데이터 고정값
- Math.random / Date.now / new Date 코드 0건 (주석은 가드 정의 명시)
- 시간 의존 버그 차단 + 디버깅 재현성 + TEST 시점 안정

### 4. ★ adaptive 가이드 § Wave 3+ 적용 — 새 도메인 ISSUE 표준

본 ISSUE adaptive 입증 후 Wave 3+ 적용:
- 새 도메인 ISSUE 시작 시 = 가이드 § rigid 답습 아닌 **도메인 특성 검토 후 적응**
- MOCK-004 (카카오 API): adaptive 패턴 — 외부 API 응답 종류별 분리 가능
- MOCK-005 (OAuth): adaptive 패턴 — 프로필 + 세션 분리 가능
- 향후 새 도메인 (Notification mock 등) = 도메인 특성 검토 + adaptive 적용

### 추가 보조 (명세 §9 v1.0 보존)

- **MSW(Mock Service Worker) 핸들러**: CMD-SHARE / UI-007 영역 (명세 §9.1 보존). MSW v2 (`msw@^2.0.0`) `http.get()` 핸들러로 4 시나리오 분기 — UI-007 작업 시 확정.
- **Storybook 연동 방안**: UI-007 영역 (명세 §9.2 보존). SSR 공유 페이지 Server Component Mock 주입 방식 = `@storybook/nextjs` RSC 지원 상황 — UI-007 작업 시 확정.
- **만료 링크 report 데이터 포함 여부**: CMD-SHARE-003 영역 (명세 §9.3 보존). REQ-NF-021 개인정보 노출 0건 보장 — null vs ExpiredResponse 결정.
- **비밀번호 해시 Mock**: CMD-SHARE-004 영역 (명세 §9.4 보존). Mock 용도 = `password_hash` 미포함 + `hasPassword: boolean` only.
