---
name: Feature Task
title: "[Feature] MOCK-001: 프론트엔드 UI 개발용 진단 결과 Mock 데이터 (CandidateAreaDTO 4 종 fixture). ★ Wave 2 트랙 E 첫 ISSUE (MOCK-002/004/005 답습 가이드 정립). ★ Q3 (가) 4 파일 분리 strategy § 첫 후행 실전 (API-005 § 적용). ★ Wave 2 체인 작동 5회째 (API→MOCK 차원 첫 진입). ★ Mismatch 5건 발견 — satisfies 명세 검증 정신 (TS 컴파일이 명세 검증기 역할)"
labels: ['feature', 'priority:L', 'epic:Mock & Fixture', 'wave:2']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [MOCK-001] 프론트엔드 UI 개발용 진단 결과 Mock 데이터 — CandidateAreaDTO 4 종 fixture + CreateDiagnosisResponse 시나리오 5 종 + GetDiagnosisResponse + 배럴. ★ **Mock 트랙 첫 진입 — Wave 2 트랙 E 첫 ISSUE** (Wave 2 트랙 D = API-001/002/003/005 완성 직후, ★ **본 ISSUE 머지 시 Wave 3 진입 한 발 더 가까워짐** — 트랙 E 잔존 MOCK-002/004/005 3 개). 본 ISSUE 산출물 = **신규 4 코드 + 명세 1 파일 갱신** + **커밋 2개 (feat + docs 분리, API-001/002/003/005 패턴 정확 답습 5 회째)**. spec (§3.10) 은 vitest config 부재 (TEST-001 위임). ★ **`src/lib/mocks/diagnosis/` 신규 첫 owner** — `src/mocks/` (M1~M3 현실 mock) 와 책임 분리 (Q2 (가) 결정). ★ **Q3 (가) 4 파일 분리 strategy § 첫 후행 실전** — API-005 §9 분리/통합 strategy § 다른 차원 적용 (DB 영역 base 아닌 **역할별 책임 분리** — fixture / 시나리오 / 응답 / 배럴). ★ **Wave 2 체인 작동 5회째 — API → MOCK 차원 첫 진입** (DB-003 → API-002 → API-003 → DB-006 → API-005 → ★ MOCK-001 = 격리된 칸 아닌 도메인 차원 확장). ★ **★★ Mismatch 5건 발견 = TS satisfies 가 명세 검증기 역할** — CandidateAreaDTO 필드 / CommuteInfo 필드 / DiagnosisFilters 필드 / MOCK_CREATE_DIAGNOSIS_ERROR 모델 / GetDiagnosisResponse.timeline 부재 5 영역에서 명세 v1.0 가 실제 API-002 산출물 과 다름. 본 ISSUE 가 산출물 정확 기준 채택 = 9 칸+API-001/002/003/005 누적 "현실 추인 + 명세/보드 실제 우선" 원칙 정확 적용. ★ **결정론적 가드 첫 도입** (AC-5 — Math.random / Date.now / new Date 0건, MOCK 트랙 표준 가드 정립). ★ **ServiceModeType 재사용 5 회째** (user.ts 정의 + diagnosis.ts API-002 + share-link.ts API-003 + saved-search.ts API-005 + ★ get-diagnosis.ts MOCK-001 = 5 회 일관, ★ MOCK 도메인은 satisfies 로 자동 타입 체크 — import 불필요 차원 추가). ★ **(P1) 패턴 미묘 구분 § 5 회째 케이스** — MOCK 도메인은 fixture only (interface 정의 0) = "기존 산출물 import + satisfies" 형태로 (P1) 정신 작동.
- **목적 (Why):**
  - **비즈니스:** UI 컴포넌트 (UI-002 / UI-003 / UI-004 / UI-005) + TEST-001 (진단 GWT) 가 백엔드 진단 로직 (CMD-DIAG-001~007 / QRY-DIAG-001~002) 완성 전에 **병렬 개발** 될 수 있도록, API-002 산출물 타입 (CandidateAreaDTO / CreateDiagnosisResponse / GetDiagnosisResponse / DiagnosisDTO / TimelineDTO / DiagnosisErrorDTO / DiagnosisErrorCode) 정확 기준 Mock 데이터를 제공. ★ Mock 트랙 = **fixture 정의 자체가 본 ISSUE 의 owner** → docs only 시 빈 contract 로 Wave 2 진입 의미 상실. ★ **★ 본 ISSUE 진짜 핵심 가치 = Mismatch 5건 발견** — satisfies 키워드가 TS 컴파일 시점에 명세 v1.0 가설을 산출물 사실로 검증. "명세는 가설, 코드는 사실" 원칙이 mock 도메인에서 코드 차원에 박힘. 5 건 모두 산출물 정확 기준 채택 + Phase C 정직 기록. ★ Q2 (가) 책임 분리 — M1 `MOCK_NEIGHBORHOODS` 22 개 동네 (`Neighborhood` 타입, 진단 input) vs M4 신규 owner (`CandidateAreaDTO` fixture, UI prop) = 다른 타입 / 다른 사용처 / 다른 워크플로 → 공존 자연. ★ Q3 (가) 4 파일 분리 strategy § 첫 후행 실전 — candidates(base fixture) / scenarios(시나리오 5종) / get-diagnosis(GET response) / index(배럴) = **역할별 책임 분리** (MOCK-002/004/005 답습 가이드 정립).
  - **사용자 가치:** 수도권 실재 행정동 (역삼 / 안국 / 이태원 / 성수 4 개) 좌표 기반의 사실적인 Mock 데이터로 UI 시각화 (지도 마커 / 후보 상세 패널 / 필터 적용 결과 / 빈 결과 안내 / 에러 토스트) 를 실 데이터 연동 전에 완성도 확보. 결정론적 가드 (AC-5) 로 테스트 시점에 따라 다른 결과 가능성 0 — 디버깅 / 재현성 / TEST-001 GWT 기준선 안정.
- **범위 (What):**
  - ✅ 만드는 것 (신규 4 코드 파일 + 명세 1 파일):
    - **`onday-app/src/lib/mocks/diagnosis/candidates.ts`** (신규, ★ **재사용 fixture base, 신규 owner 디렉토리 포함**) — CandidateAreaDTO 4 종 (역삼 / 안국 / 이태원 / 성수) + MOCK_CANDIDATES_NORMAL 배열 const. **import 정확 1 (정직 기록): `import type { CandidateAreaDTO } from '@/lib/types/diagnosis'` — ★ 이 한 줄이 Wave 2 체인 5 회째 입증 위치 (API-002 (P1) re-export 첫 fixture 활용)**. Prisma 0 / types.ts 직접 0 / M1 `MOCK_NEIGHBORHOODS` 0.
    - **`onday-app/src/lib/mocks/diagnosis/scenarios.ts`** (신규) — 시나리오 6 객체 (NORMAL / SINGLE / DEADLINE / EMPTY × CreateDiagnosisResponse + ERROR_TIMEOUT / ERROR_OUT_OF_COVERAGE × DiagnosisErrorDTO). candidates.ts 의 fixture 재사용. **import 정확 3**: `CreateDiagnosisResponse` + `DiagnosisErrorDTO` + `DiagnosisErrorCode` from `'@/lib/types/diagnosis'`.
    - **`onday-app/src/lib/mocks/diagnosis/get-diagnosis.ts`** (신규) — MOCK_DIAGNOSIS_ENTITY (DiagnosisDTO) + MOCK_GET_DIAGNOSIS_RESPONSE (GetDiagnosisResponse — POST 와 다른 contract, ★ `timeline` 필드 부재). **import 정확 2**: `DiagnosisDTO` + `GetDiagnosisResponse` from `'@/lib/types/diagnosis'`. ★ **ServiceModeType 재사용 5 회째 — satisfies 로 자동 타입 체크 (import 불필요)**.
    - **`onday-app/src/lib/mocks/diagnosis/index.ts`** (신규) — 배럴 3 export (candidates / scenarios / get-diagnosis). 호출처 단순화 (TEST-001 / UI-002~005 from `@/lib/mocks/diagnosis`).
    - **`tasks/MOCK-001.md`** — 본 명세 현실 동기화 (Q1~Q7 + ★ Wave 2 체인 작동 5회째 § + ★ Q3 (가) 4 파일 분리 § + ★ 분리/통합 strategy § 다른 차원 적용 § + ★ (P1) 미묘 구분 § 5 회째 케이스 § + ★ mock 도메인 결정 매트릭스 § (★ 신규 owner) + ★ 결정론적 가드 § (★ 신규 가드) + ★ Mismatch 5건 추적 표 (★ 본 ISSUE 진짜 핵심 가치) + M1~M5 현실 mock 표 + ServiceModeType 5 회째 표 + Q4~Q7 자동 묶음 표 + ★ MOCK 답습 가이드 § + ★ 메모리 stale 보정 정직 기록 § + §9 follow-up 5+).
  - ❌ 만들지 않는 것 (현실 가드 + 영역 분리 + dead 회피):
    - mapper (`lib/mappers/diagnosis-mapper.ts`) / Zod 추출 — **CMD-DIAG-001~007 / QRY-DIAG-001~002 영역** (본 ISSUE = fixture only)
    - `__tests__/mocks/diagnosis.spec.ts` 6 케이스 — **TEST-001 위임** (vitest config 부재 12 회째 일관, DB-001~007 + API-001/002/003/005 누적)
    - M1 `src/mocks/neighborhoods.ts` 22 개 동네 (Neighborhood 타입) — **Q2 (가) 책임 분리 가드** (진단 input, 6 호출처 보존, mock-calculator 의존)
    - M2 `src/mocks/users.ts` (mock-auth M1~M4 가드 누적) — 본 ISSUE 무관여
    - M3 `src/features/diagnosis/mock-calculator.ts` (DiagnosisMode DM5~7 가드) — 본 ISSUE 무관여
    - MSW (Mock Service Worker) 핸들러 — **CMD-DIAG / UI-* 영역** (본 ISSUE Open Questions 보존)
    - `types.ts:1-3` `AuthProvider`/`DiagnosisMode`/`DiagnosisStatus` 통합 정리 — **Q2 가드 5 회째 사수 (API-002 첫 성공 / API-003 2회째 / API-005 3회째 / 본 ISSUE 4회째 — mock 차원 사수 첫)**. owner = 별도 cleanup ISSUE.
    - **DiagnosisFilters 명세 v1.0 ↔ 실제 산출물 mismatch 통합** (Mismatch ③) — API-002 §9.5 / 본 ISSUE Mismatch 추적 만 명시, cleanup ISSUE 영역
    - DiagnosisMode 11 + DiagnosisStatus 2 + ServiceModeType 4 회 호출처 일괄 치환 — cleanup ISSUE 위임
    - S1~S6 ShareLink / SS1~SS3 SavedSearch / N1~N6 Diagnosis 현실 코드 (API-002/003/005 가드 누적) — 본 ISSUE 무관여
    - API-001/002/003/005 산출물 14 (`auth.ts` + `diagnosis.ts` + `share-link.ts` + `saved-search.ts` + `saved-search-api.ts` + 4 errors + 4 helpers) — 본 ISSUE 미수정
    - `CandidateAreaDTO` / `CreateDiagnosisResponse` / `GetDiagnosisResponse` / `DiagnosisDTO` / `TimelineDTO` / `DiagnosisErrorDTO` / `Neighborhood` 재정의·중복 정의 — **절대 금지** ((P1) 정신 — 기존 산출물 재사용, MOCK 차원은 import + satisfies 형태)
    - Prisma model re-export — **(P1) 패턴 오해 금지** (관심사 분리, API-001/002/003/005 일관)
    - 라이브 서비스 mock 사용 정책 (`NEXT_PUBLIC_USE_MOCK=true` 영향) — **INFRA-002 / MOCK-002~005 / CMD-DIAG 영역 위임** (Q7)
- **복잡도:** L (명세 v1.0 동일)
- **Wave:** 2 (Mock 생성 트랙 — ★ 트랙 E 첫 ISSUE)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-003** (§4.1.1): "시스템은 두 직장 주소를 기반으로 교집합 후보 동네를 3 곳 이상 산출하고, 지도 위에 시각화해야 한다. Vercel 무료 티어의 10초 Timeout 을 방지하기 위해, 외부 교통 API 반복 호출 연산과 교차 연산 로직은 Next.js 서버(Server Action) 가 아닌, 사용자 브라우저(Client Component) 내부에서 비동기 병렬 구조(Promise.all) 로 처리해야 한다."
- **REQ-FUNC-004** (§4.1.1): "시스템은 각 후보 동네를 탭했을 때 양쪽 직장까지의 예상 출퇴근 시간(대중교통·자차) 을 표시해야 한다."
- **REQ-FUNC-006** (§4.1.1): "시스템은 조건 필터(최대 통근 시간, 예산) 를 적용했을 때 조건에 맞지 않는 후보를 실시간 필터링하고 지도를 갱신해야 한다."
- **REQ-FUNC-008** (§4.1.1): "시스템은 두 직장 간 거리로 인해 교집합 후보가 0 곳인 경우 \"조건을 만족하는 동네가 없습니다\" 안내를 1초 이내에 표시하고, 조건 완화 제안을 2 개 이상 제공해야 한다."
- **REQ-FUNC-015** (§4.1.3): "시스템은 사용자가 이사 마감일(D-day) 을 입력하고 \"데드라인 모드\" 를 활성화할 수 있는 인터페이스를 제공해야 한다. 활성화 시 계약 역산 타임라인(5 단계 이상) 을 2초 이내에 자동 생성해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### `prototypes/design/CLAUDE.md` §3 (1인 MVP 제약) 인용

- "Vercel Serverless Timeout = 10초" → 본 ISSUE 비대상 (Mock 트랙, fixture only).
- "Out of Scope ... 자동 코드 생성 금지" → spec (§3.10) 위임 (vitest 부재 12 회째 일관).

### API 엔드포인트 (§6.1)

| # | Method | Endpoint / Action | 응답 Body | 응답 시간 목표 |
|---|---|---|---|---|
| API-01 | POST | `createDiagnosis()` | `diagnosisId`, `candidates[]`, `timeline`, `status` (★ `mode` 부재 — Mismatch ⑤ 보조) | p95 ≤ 3,000ms |
| API-02 | GET | `/api/diagnosis/[id]` | `diagnosis: DiagnosisDTO`, `candidates: CandidateAreaDTO[]` (★ `timeline` 부재 — Mismatch ⑤) | p95 ≤ 1,500ms |

### ★ Phase B 작성 산출물 표 (신규 4 파일, ★ Q3 (가) 4 파일 분리)

| # | 파일 | 역할 | import 부 (정직 기록) | 명세 §3 매핑 |
|---|---|---|---|---|
| **B.1** | `onday-app/src/lib/mocks/diagnosis/candidates.ts` (★ 재사용 fixture base, 신규 owner 디렉토리 포함) | CandidateAreaDTO 4 종 (역삼/안국/이태원/성수) + MOCK_CANDIDATES_NORMAL 배열 const | `import type { CandidateAreaDTO } from '@/lib/types/diagnosis';` ★ **Wave 2 체인 5 회째 입증 위치** | §3.2 (현실 보정) |
| **B.2** | `onday-app/src/lib/mocks/diagnosis/scenarios.ts` | 6 시나리오 (NORMAL / SINGLE / DEADLINE / EMPTY × CreateDiagnosisResponse + ERROR_TIMEOUT / ERROR_OUT_OF_COVERAGE × DiagnosisErrorDTO) | `import type { CreateDiagnosisResponse, DiagnosisErrorDTO } from '@/lib/types/diagnosis'; import { DiagnosisErrorCode } from '@/lib/types/diagnosis'; import { MOCK_CANDIDATE_YEOKSAM, MOCK_CANDIDATE_ANGUK, MOCK_CANDIDATE_ITAEWON, MOCK_CANDIDATES_NORMAL } from './candidates';` | §3.3~3.7 (★ Mismatch ④ 보정) |
| **B.3** | `onday-app/src/lib/mocks/diagnosis/get-diagnosis.ts` | MOCK_DIAGNOSIS_ENTITY (DiagnosisDTO, ★ ServiceModeType 5 회째 satisfies 자동) + MOCK_GET_DIAGNOSIS_RESPONSE | `import type { DiagnosisDTO, GetDiagnosisResponse } from '@/lib/types/diagnosis'; import { MOCK_CANDIDATES_NORMAL } from './candidates';` | §3.8 (★ Mismatch ③/⑤ 보정) |
| **B.4** | `onday-app/src/lib/mocks/diagnosis/index.ts` | 배럴 3 export (호출처 단순화) | `export * from './candidates'; export * from './scenarios'; export * from './get-diagnosis';` | §3.9 |

**satisfies 검증 합계**: 13 곳 (candidates 5 + scenarios 6 + get-diagnosis 2). 모든 fixture/시나리오/응답 객체가 TS 컴파일 시점에 API-002 산출물 타입 정합 검증 → **★ TS satisfies = 명세 검증기 역할** (Mismatch 5 건 발견 메커니즘).

### ★ Wave 2 체인 작동 5회째 표 (★ 본 ISSUE 진짜 핵심 가치 첫 부분 — API → MOCK 차원 첫 진입)

12+ ISSUE 누적 워크플로 = 격리된 칸 아닌 **체인 시스템** 입증. 본 ISSUE 가 5 회째 다른 차원 증거:

| # | 체인 단계 | 시점 | 증거 |
|---|---|---|---|
| 1 | **Wave 1 → Wave 2** | DB-003 PR #77 (`DiagnosisStatusType` 정의, 사용처 0건) → API-002 PR #82 (`DiagnosisDTO.status` 첫 활성) | DB → API 트랙 |
| 2 | **Wave 2 내부 (API-003)** | API-002 PR #82 (`CandidateAreaDTO = CandidateArea` re-export, 외부 활용 0) → API-003 PR #83 (`ReportDTO.candidates: CandidateAreaDTO[]` 첫 외부 활용) | API → API 내부 |
| 3 | **트리거 → 위임 (API-003 / API-005)** | API-002 §9.6 트리거 → API-003 수신 + CMD-SHARE-001 위임 발신 / DB-006 §7+§9.1 동시 → API-005 동시 수신 | mismatch 추적 정신 누적 |
| 4 | **Wave 2 트랙 D 완성 마일스톤 (API-005)** | API-001/002/003/005 = 트랙 D 완성, ★ 3 종 가이드 § 정립 ((P1) 미묘 / 분리·통합 / mapper) | DTO 통신 계약 SSoT 4 도메인 완성 |
| **★ 5** | **★ API → MOCK 차원 첫 진입 (★ 본 ISSUE)** | API-002 PR #82 `CandidateAreaDTO = CandidateArea` re-export → **★ MOCK-001 candidates.ts L17 import + 13 satisfies 검증** = **fixture 첫 외부 활용** | API → MOCK 차원 첫 진입 |

**입증 내용 (★ 본 ISSUE 진짜 핵심 가치)**:
- 13 ISSUE (INFRA-001 / DB-001~007 / API-001/002/003/005 / MOCK-001) 가 격리된 칸 아닌 **도메인 차원 체인 시스템**
- 체인이 단일 차원 (DB→API) 아닌 **multi 차원 다양화** (DB→API / API→API / 트리거→위임 / multi 트리거 / **API→MOCK**)
- 향후 후행 ISSUE: MOCK-002 = API-003 share-link.ts 활용 (5+1 회째) / MOCK-004 = API 산출물 활용 / MOCK-005 = API-001 auth.ts 활용 → **본 ISSUE 답습 가능**
- **위치 명시**: candidates.ts L17 `import type { CandidateAreaDTO } from '@/lib/types/diagnosis';` — 이 한 줄이 본 ISSUE 진짜 가치 입증

### ★ Q3 (가) 4 파일 분리 strategy 표 (★ 본 ISSUE 핵심 분기 코드 입증, API-005 분리/통합 strategy § 다른 차원 적용)

API-005 §9 분리/통합 strategy § 결정 매트릭스 다른 차원 적용 — **역할별 책임 분리**:

| 파일 | 책임 | 정의 | import / 의존 |
|---|---|---|---|
| **`candidates.ts`** | **재사용 fixture base** | CandidateAreaDTO 4 종 (역삼/안국/이태원/성수) + MOCK_CANDIDATES_NORMAL 배열 | `CandidateAreaDTO` (API-002 산출물) ← ★ Wave 2 체인 5 회째 |
| **`scenarios.ts`** | **시나리오 6 종** (NORMAL/SINGLE/DEADLINE/EMPTY/ERROR×2) | CreateDiagnosisResponse 4 + DiagnosisErrorDTO 2 | candidates.ts (fixture) + `CreateDiagnosisResponse` + `DiagnosisErrorDTO` + `DiagnosisErrorCode` |
| **`get-diagnosis.ts`** | **GET response (POST 와 다른 contract)** | DiagnosisDTO + GetDiagnosisResponse (★ timeline 부재) | candidates.ts (MOCK_CANDIDATES_NORMAL) + `DiagnosisDTO` + `GetDiagnosisResponse` |
| **`index.ts`** | **배럴 export** | 3 export 통합 | candidates / scenarios / get-diagnosis |

**분리 strategy 근거 (5 종)**:
1. **★ 명세 §3.1~3.9 분리 의도 직접 정합**: 명세가 정확히 4 코드 파일 + spec (위임) 명시.
2. **★ 책임 차원 4 종 명확**: fixture (재사용 base) / 시나리오 (응답 시나리오) / response (POST≠GET contract) / barrel (호출처 단순화) — 다른 책임.
3. **★ 후행 ISSUE 활용 명확**: TEST-001 = candidates + scenarios / UI-002 = scenarios NORMAL / UI-003 = candidates 4 종 / UI-005 = scenarios EMPTY → 다른 후행이 다른 파일 import.
4. **★ MOCK-002/004/005 답습 가이드 신규 owner 정립**: 본 ISSUE 4 파일 분리 = 트랙 E 4 ISSUE 통일 가이드 (§9 답습 가이드 § 참조).
5. **API-005 +0 = 절충 일관**: 4 코드 + 명세 1 = 5 파일 = API-005 동일 분량. API-001/002/003/005 일관 (B) 절충 패턴 + Phase B 활성 5 회째.

### ★ 분리/통합 strategy § 다른 차원 적용 표 (★ API-005 § 첫 후행 실전)

API-005 §9 분리/통합 strategy § 결정 매트릭스 답습 + 새 차원 추가:

| ISSUE | 결정 변수 | 결정 | 차원 |
|---|---|---|---|
| **API-002** | DB §7 base + DB 영역 직접 정의 | 2 파일 분리 (diagnosis.ts base + diagnosis-errors.ts API) | DB 영역 차원 |
| **API-003** | DB-004 §7 base 0 | 1 파일 통합 (share-link.ts 6 섹션) | DB 영역 차원 |
| **API-005** | DB §7 base + DB 영역 정의 위임 | 2 파일 분리 (saved-search.ts base + saved-search-api.ts API) | DB 영역 차원 |
| **★ MOCK-001** | **역할별 책임 분리 명시** (fixture / 시나리오 / 응답 / 배럴) | **★ 4 파일 분리** (candidates / scenarios / get-diagnosis / index) | **★ 역할 차원 (신규)** |

**결정 매트릭스 확장 (★ Wave 3+ 새 도메인 가이드)**:
- **"DB 영역 차원"**: API-* 트랙 — base type 존재 + DB 영역 정의 위치
- **★ "역할 차원" (신규 owner — 본 ISSUE)**: MOCK-* 트랙 — 책임 분리 종 수 (fixture / 시나리오 / 응답 / barrel — 4 책임 = 4 파일)
- **결정 매트릭스 정리**: "DB 영역 차원 + base 명시 (직접/위임) = 2 파일 분리" / "DB 영역 차원 + base 0 = 1 파일 통합" / **★ "역할 차원 + 책임 분리 명시 = 책임 수만큼 분리"**

**3 종 가이드 § 실전 첫 적용 입증**: API-005 §9 매트릭스가 다른 차원 (역할별) 에서도 작동 = 가이드 § 범용성 입증.

### ★ (P1) 패턴 미묘 구분 표 (★ 5 회째 케이스 — MOCK 도메인 특화)

(P1) "재사용 패턴" 은 **기존 도메인 entity 재사용** 정신 — Prisma 직접 노출 아님. **본 ISSUE 가 5 회째 케이스 — MOCK 도메인 특화 형태 추가**:

| ISSUE | base type 존재 | (P1) 적용 | 패턴 | 특이점 |
|---|---|---|---|---|
| API-001 | ✅ user.ts AuthProviderType (DB-002) | ✅ 적용 | `OAuthProvider = AuthProviderType` (re-export) | base + re-export |
| API-002 | ✅ types.ts + user.ts + diagnosis.ts | ✅ 적용 (3 re-export) | `CandidateAreaDTO = CandidateArea` 등 | 다중 re-export |
| API-003 | ❌ DB-004 base 0 | ❌ 적용 불가 | share-link.ts 6 섹션 신규 정의 | base 0 → 신규 |
| API-005 | ❌ DB-006 base 0 (§7 위임만) | ❌ 적용 불가 | saved-search.ts (base) + saved-search-api.ts (API) 분리 신규 | base 0 + 분리 |
| **★ MOCK-001** | **❌ fixture only (interface 정의 0)** | **❌ 적용 불가 (다른 차원)** | **★ API-002 산출물 import + satisfies 검증 형태** | **MOCK 도메인 = type 영역 아님, 산출물 활용 형태로 (P1) 정신 작동** |

**(P1) 정신 명시 (MOCK 도메인 차원 추가)**:
- (P1) = 기존 도메인 entity 재사용 (API-* 트랙: `OAuthProvider = AuthProviderType` / `CandidateAreaDTO = CandidateArea`)
- ★ **MOCK 트랙은 interface 정의 0 → "기존 산출물 import + satisfies" 형태로 (P1) 정신 작동** (API → MOCK 차원 확장)
- 본 ISSUE: 13 satisfies 검증 = 모든 fixture 가 API-002 산출물 정확 기준
- 향후 새 도메인 (예: Notification DTO / Recommendation DTO) 의 MOCK 트랙 = 본 매트릭스 5 회째 케이스 참조

### ★ mock 도메인 결정 매트릭스 § (★ 본 ISSUE 신규 owner — 3 종 가이드 § 옆 4 번째 § 추가)

본 ISSUE 가 정립한 mock 도메인 결정 매트릭스 — MOCK-002/004/005 + 미래 새 도메인 mock 결정 가이드:

| 결정 변수 | 결정 | 본 ISSUE 적용 |
|---|---|---|
| **interface 정의 vs fixture 정의** | interface = type 영역 (API-* 트랙) / fixture = mock 영역 (MOCK-* 트랙) | ★ 본 ISSUE = fixture only, interface 0 (API-002 산출물 import) |
| **MOCK-* 트랙 패턴** | API-* 산출물 import + satisfies 검증 (재정의 0) + 결정론적 가드 (Math.random/Date.now/new Date 0건) | ★ Phase B 13 satisfies + AC-5 grep 0건 |
| **파일 분리 strategy** | 역할별 책임 분리 (fixture / 시나리오 / 응답 / 배럴) — 책임 수만큼 분리 | ★ Q3 (가) 4 파일 분리 |
| **현실 mock 가드** | M1~M5 형태 grep + 신규 owner 영역 분리 | ★ Q2 (가) M1~M3 보존 + M4 신규 owner |
| **spec 위임** | vitest config 부재 → TEST-* 위임 (DB-001~007 + API-001/002/003/005 12 회 누적) | ★ Q4 TEST-001 위임 |

**4 종 가이드 § 정리 (★ 본 ISSUE 추가)**:
1. (P1) 패턴 미묘 구분 (API-003 §, ★ 본 ISSUE 5 회째 케이스 추가)
2. 분리/통합 strategy (API-005 §, ★ 본 ISSUE 다른 차원 적용 — 역할 차원 신규)
3. mapper 패턴 차이 (API-005 §, MOCK 영역 외)
4. **★ mock 도메인 결정 매트릭스 (★ MOCK-001 신규 owner)** — Wave 2 트랙 E + 미래 MOCK 트랙 가이드

### ★ 결정론적 가드 § (★ 본 ISSUE 신규 가드 첫 도입)

MOCK 트랙 표준 가드 — Math.random / Date.now / new Date 0건 (AC-5 정합):

| 가드 | 정의 | 검증 시점 | 본 ISSUE 결과 |
|---|---|---|---|
| **결정론적 ID** | 모든 mock id = 고정 string (예: `'mock-cand-001'`, `'mock-diag-001'`, `'mock-user-001'`) | Phase B 코드 작성 시 grep | ✅ 4 candidates + 4 diagnosis id = 8 고정값 |
| **결정론적 좌표** | 모든 coordinate = 실재 행정동 위경도 고정값 (역삼/안국/이태원/성수 4 종) | Phase B + Phase D grep | ✅ 4 좌표 고정 |
| **결정론적 날짜** | 모든 dueDate / deadlineDate / createdAt = 고정 ISO string (예: `'2026-06-30'`, `'2026-05-21T10:00:00.000Z'`) | Phase B + Phase D grep | ✅ 6 dueDate + 1 deadlineDate + 1 createdAt = 8 고정 |
| **결정론적 통계** | 모든 score / safetyGrade / priceRange / facilities / lines / listingsCount / avgArea = 고정값 | Phase B 코드 검증 | ✅ 4 candidates × 7 필드 = 28 고정값 |
| **grep 검증** | `grep -rnE "Math\.random\|Date\.now\|new Date" lib/mocks/diagnosis/` 결과 = 0건 (주석 매치 제외) | Phase B.5 + Phase D | ✅ 코드 0건 (주석 3 매치만) |

**미래 MOCK 트랙 표준 가드 정립**:
- MOCK-002 (ShareLink) — uniqueUrl 고정 / expiresAt 고정 ISO / viewCount 고정
- MOCK-004 (카카오 API) — 경로 응답 고정 / 소요시간 고정 / 환승 정보 고정
- MOCK-005 (OAuth) — 프로필 ID 고정 / 세션 만료 고정 ISO
- AC-5 패턴 답습 = TEST 시점 재현성 + 디버깅 안정 + 시간 의존 버그 차단

### ★★ Mismatch 5건 추적 표 (★ 본 ISSUE 진짜 핵심 가치 — satisfies 명세 검증 정신)

**TS satisfies 키워드가 TS 컴파일 시점에 명세 v1.0 가설을 산출물 사실로 검증** — 5 건 모두 산출물 정확 기준 채택:

| # | 영역 | 명세 v1.0 (MOCK-001.md) | 실제 (API-002 산출물) | 본 ISSUE 채택 | 후행 처리 |
|---|---|---|---|---|---|
| **①** | `CandidateAreaDTO` 필드 | `{ id, name, coord, commuteA, commuteB, score, rank }` | `{ id, dong, gu, coordinate, commuteA, commuteB?, leisureA?, leisureB?, score, safetyGrade?, priceRange?, facilities?, lines?, listingsCount?, avgArea? }` (Step 10.5 풍부) | **실제 산출물 정확** ((P1) 정신 — entity 재사용, Step 10.5 풍부 필드 활용) | cleanup ISSUE 명세 v1.0 갱신 (선택, 본 ISSUE 산출물 = sole source) |
| **②** | `CommuteInfo` 필드 | `{ durationMinutes, transportType, transfers, walkingMinutes }` | `{ time, mode: 'transit' \| 'driving', transfers? }` (★ `walkingMinutes` 부재) | **실제 산출물 정확** | cleanup ISSUE (선택) |
| **③** | `DiagnosisFilters` 필드 | `{ maxCommuteTime, budgetMin, budgetMax, timeSlot }` | `{ maxCommuteTime?, budget: { min, max }, timeRange: 'morning' \| 'evening' \| 'flexible', priorities? }` | **실제 산출물 정확** | ★ **cleanup ISSUE 트리거 확장** (API-002 §9.5 동일 영역, 명세 v1.0 stale 일관 신호 — DiagnosisInput.filters / DiagnosisDTO.filters / SearchParams.filters 3 영역 cleanup) |
| **④** | `MOCK_CREATE_DIAGNOSIS_ERROR` 모델 | `status='failed' + error: DiagnosisErrorCode` (CreateDiagnosisResponse 형태) | `DiagnosisStatusType = 'processing' \| 'completed' \| 'expired'` (★ `failed` 부재) + `CreateDiagnosisResponse` 에 `error` 필드 부재 + 에러는 별도 `DiagnosisErrorDTO` | **본 ISSUE 채택: 별도 `DiagnosisErrorDTO satisfies` 분리** (`MOCK_DIAGNOSIS_ERROR_TIMEOUT` + `MOCK_DIAGNOSIS_ERROR_OUT_OF_COVERAGE` 2 개, 명세 v1.0 가 에러 모델 분리 패턴 놓침) | TEST-001 시점 에러 처리 검증 + 명세 v1.0 갱신 (선택) |
| **⑤** | `GetDiagnosisResponse` 필드 | (§3.8) `timeline` 필드 명세 안 함 / 본 ISSUE grill 시 사용자 안내 "+timeline" 포함 가정 | `{ diagnosis: DiagnosisDTO, candidates: CandidateAreaDTO[] }` (★ `timeline` 부재 — POST 와 다른 contract) | **실제 산출물 정확** (POST = CreateDiagnosisResponse.timeline 포함 / GET = GetDiagnosisResponse.timeline 부재) | API-002 산출물 contract 정확 추인 |

**발견 의미 (★ 9 칸 mismatch 추적 정신 mock 차원 작동)**:
- 9 칸 + API-001/002/003/005 누적 "현실 추인 + mismatch 추적" 정신이 mock 도메인에서 **TS satisfies 키워드로 자동 작동** — 컴파일 통과 vs 실패 = 명세 검증
- TypeScript 컴파일이 명세 검증기 역할 — 명세 v1.0 (가설) ↔ 산출물 (사실) 격차 = satisfies 검증 실패로 표면
- 본 ISSUE 가 Phase B 코드 작성 중 5 건 자동 발견 → Phase C 정직 기록 = 명세 v1.0 동기화

**정직성 가치 (★ 본 ISSUE 진짜 핵심)**:
- "**명세는 가설, 코드는 사실**" 원칙 (9 칸 누적 정신)
- 본 ISSUE 에서 **명세를 산출물에 맞춤 = 현실 추인 원칙 정확 적용**
- 향후 후행 ISSUE (MOCK-002/004/005 + UI-002~005 + TEST-001) 가 본 ISSUE 산출물 = sole source = 명세 v1.0 갱신 불필요 (선택)

### ★ M1~M5 mock 현실 코드 표 (Phase A.4 grep 결과 — 책임 분리 가드)

| # | 위치 | 라인 | 역할 | 본 ISSUE | 후행 |
|---|---|---|---|---|---|
| **M1** | `onday-app/src/mocks/neighborhoods.ts` | **302** | `MOCK_NEIGHBORHOODS: Neighborhood[]` 22 개 동네 (Step 9.5 / 10.5 풍부 필드 추가) | 미수정 (Q2 가드) | CMD-DIAG / mock-calculator 6 호출처 (`app/diagnosis/page.tsx:21,30` + `features/diagnosis/mock-calculator.ts:12,15,89,206`) 유지 |
| **M2** | `onday-app/src/mocks/users.ts` | **14** | Mock 사용자 (mock-auth M1~M4 가드 누적) | 미수정 | API-001 가드 영역 (MOCK-005 통합) |
| **M3** | `onday-app/src/features/diagnosis/mock-calculator.ts` | **230** | 진단 계산 로직 + DiagnosisMode DM5~7 가드 (L5/85/193) | 미수정 (Q2 가드 5 회째) | cleanup ISSUE (의존성 약함) |
| **M4** | `onday-app/src/lib/mocks/diagnosis/` | — | **부재 → ★ 본 ISSUE 신규 owner 디렉토리** (★ 4 파일 작성 위치) | ✅ Phase B 4 파일 신규 | UI-002~005 + TEST-001 의존 |
| **M5** | `MOCK_CANDIDATE_*` / `MOCK_DIAGNOSIS_*` / `mock-cand` / `mock-diag` | — | **Phase A.4 grep 0건** = 100% 명세 신규 | ✅ Phase B 4 candidates + 4 diagnosis-related const | — |

**Q2 (가) 책임 분리 사유**:
- **M1 22 개 동네 = `Neighborhood` 타입 (진단 input)** — addressA/B → MOCK_NEIGHBORHOODS.filter → computeCandidate 워크플로 (mock-calculator 6 호출처 의존)
- **M4 신규 4 종 = `CandidateAreaDTO` (UI prop fixture)** — UI 컴포넌트 / TEST-001 직접 import 워크플로
- **다른 타입 + 다른 사용처 + 다른 워크플로** → 공존 자연 (N1~N6 / SS1~SS3 인라인 보존 + 신규 owner 분리 패턴 답습)

### ★ ServiceModeType 재사용 5 회째 표 (★ Q2 가드 5 회째 — mock 도메인 차원 첫)

| # | 위치 | 라인 | 역할 | 본 ISSUE | 패턴 |
|---|---|---|---|---|---|
| SMT1 | `src/lib/types/user.ts` | L5 | `export type ServiceModeType = 'couple' \| 'single'` (정의, DB-002) | 미수정 (가드) | type 영역 정의 |
| SMT2 | `src/lib/types/diagnosis.ts` | L13 | `import type { ServiceModeType } from './user'` (API-002 산출물) | 미수정 (가드) | type 영역 import |
| SMT3 | `src/lib/types/share-link.ts` | L11 | `import type { ServiceModeType } from './user'` (API-003 산출물) | 미수정 (가드) | type 영역 import |
| SMT4 | `src/lib/types/saved-search.ts` | L13 | `import type { ServiceModeType } from './user'` (API-005 산출물) | 미수정 (가드) | type 영역 import |
| **★ SMT5** | `src/lib/mocks/diagnosis/get-diagnosis.ts` | **L26** (Phase B.3 신규) | **`mode: 'couple'` literal** — DiagnosisDTO.mode = ServiceModeType (API-002 산출물 자동 타입 체크, ★ MOCK 도메인 satisfies 형태) | ✅ Phase B.3 신규 | **★ mock 영역 satisfies (import 불필요 차원 추가)** |

**5 회째 패턴 특징 (★ MOCK 도메인 차원 첫)**:
- SMT1~SMT4 = type 영역 (import type 명시)
- **★ SMT5 = mock 영역 (satisfies 로 자동 타입 체크, import 불필요)** — DiagnosisDTO.mode 타입 자동 추론
- **(P1) 정신 차원 확장**: type 영역 = re-export / mock 영역 = satisfies 검증 = 둘 다 "기존 산출물 재사용" 정신 일관
- Q2 가드 5 회째 사수 (API-002 첫 성공 + API-003 2 회째 + API-005 3 회째 + 본 ISSUE 4 회째 사수 — mock 차원 첫)

### ★ Q4~Q7 자동 묶음 표 (검수 부담 분산)

| Q | 영역 | 결정 | 결과 |
|---|---|---|---|
| **Q4** | §3.10 spec (`__tests__/mocks/diagnosis.spec.ts` 6 케이스) | **⏸ TEST-001 위임** | vitest config 부재 12 회째 일관 (DB-001~007 + API-001/002/003/005 누적). AC-5 grep 검증은 Phase D static check 로 분리 |
| **Q5** | 결정론적 가드 (Math.random/Date.now/new Date 0건) | **✅ 자동 가드** | AC-5 명시 + Phase B.5 grep 코드 0건 (주석 3 매치만) + Phase D 재검증 + ★ MOCK 트랙 표준 가드 정립 |
| **Q6** | satisfies 검증 vs 의존성 (API-002 산출물 활용) | **✅ 13 곳 satisfies 사용** | candidates 5 + scenarios 6 + get-diagnosis 2 = 13 곳 + ★ Wave 2 체인 5 회째 입증 + ★ Mismatch 5 건 자동 발견 메커니즘 |
| **Q7** | 라이브 서비스 mock 사용 정책 (`NEXT_PUBLIC_USE_MOCK=true`) | **✅ fixture only — 라이브 전환 = INFRA-002 / MOCK-002~005 / CMD-DIAG 영역 위임** | 본 ISSUE = Foundation 트랙 fixture only + `.env.example` 가드 무수정 + CLAUDE.md §3 명시 정합 |

### ★ MOCK 답습 가이드 § (★ 본 ISSUE 신규 owner — MOCK-002/004/005 결정 매트릭스)

Wave 2 트랙 E = MOCK-001 (Diagnosis) + MOCK-002 (ShareLink) + MOCK-004 (카카오 API) + MOCK-005 (OAuth) 4 ISSUE. 본 ISSUE 가 정립한 패턴 답습:

| 답습 항목 | 본 ISSUE 정립 | MOCK-002 (ShareLink) | MOCK-004 (카카오 API) | MOCK-005 (OAuth) |
|---|---|---|---|---|
| **4 파일 분리** | candidates / scenarios / get-diagnosis / index | shareLinks (fixture) / scenarios (유효/만료/비밀번호) / get-share (GET response) / index | routes (경로 fixture) / scenarios (성공/타임아웃/없음) / commutes (응답) / index | profiles (카카오/네이버) / scenarios (signin/refresh) / sessions (Supabase Auth 세션) / index |
| **API-* 산출물 import + satisfies** | API-002 7 타입 + 13 satisfies | API-003 share-link.ts 산출물 활용 | API-007 카카오 API 인터페이스 활용 | API-001 auth.ts 산출물 활용 |
| **결정론적 가드 (AC-5)** | Math.random/Date.now/new Date 0건 + 고정 id/좌표/날짜/통계 | uniqueUrl 고정 + expiresAt 고정 ISO + viewCount 고정 | 경로 응답 고정 + 소요시간 고정 + 환승 정보 고정 | 프로필 ID 고정 + 세션 만료 고정 ISO |
| **M1~M5 형태 현실 mock 가드** | M1 neighborhoods 22 + M2 users + M3 mock-calculator 보존 | S1~S6 ShareLink 현실 코드 가드 (API-003) | 카카오 API 현실 클라이언트 가드 (API-007) | M2 users.ts + mock-auth M1~M4 가드 (API-001) |
| **spec 위임 (TEST-* 영역)** | TEST-001 위임 (vitest 12 회째) | TEST-003 (공유 GWT) / TEST-004 (공유 보안) | TEST-002 (교통 타임아웃) | TEST-008 (OAuth GWT) |
| **Wave 2 체인 작동 차원** | API-002 → MOCK-001 (5 회째) | API-003 → MOCK-002 (6 회째) | API-007 → MOCK-004 (7 회째) | API-001 → MOCK-005 (8 회째) |
| **(P1) 5 회째 케이스** | fixture only + satisfies | fixture only + satisfies | fixture only + satisfies | fixture only + satisfies |
| **Mismatch 추적** | 5 건 발견 정직 기록 | satisfies 검증 시점 추적 | satisfies 검증 시점 추적 | satisfies 검증 시점 추적 |

**MOCK 답습 가이드 의미 (★ 본 ISSUE 신규 owner)**:
- Wave 2 트랙 E 4 ISSUE 통일 가이드 = 검수 부담 분산 + 일관성 보장
- 향후 새 도메인 mock (예: Notification mock / Recommendation mock) 가이드 = MOCK 트랙 표준화

### ★ 메모리 stale 보정 정직 기록 § (★ 본 ISSUE 보정 정직성)

본 세션 grill-me 진입 시 메모리 stale 자동 보정 2 건 작동:

| 보정 | 메모리 | 실제 | 보정 메커니즘 | 의미 |
|---|---|---|---|---|
| **보정 1** | "Critical Path Wave 3 진입" (직전 API-005 머지 메모리) | Wave 2 = 트랙 D ✅ 완성 + 트랙 E ⚠️ 미시작 (MOCK-001/002/004/005 4 개 잔존) — **Wave 3 진입 = 트랙 D + E 둘 다 완성 후** | grill-me 가 `06_TASK_LIST_v1.3.md L417-421` + `gh issue list --label "wave:2"` 실제 확인 → 메모리 stale 자동 보정 → 본 ISSUE = Wave 2 트랙 E 첫 | 9 칸 누적 "현실 추인 + 명세/보드 실제 우선" 원칙 = **메모리 stale 자동 보정 시스템** |
| **보정 2** | "12 산출물" (API-001/002/003 + DB-002/003 누적) | **14 산출물** (API-005 +2: saved-search.ts + saved-search-api.ts) | Phase A.5 `ls lib/types/ lib/constants/ lib/helpers/` 실제 확인 → 6 types + 4 errors + 4 helpers = 14 → 메모리 +2 보정 | 메모리는 시점 frozen / Phase A 가 실시간 검증 → 보정 자동 |

**정직 기록 의미 (★ 본 ISSUE 가치 보강)**:
- 메모리 = 시점 frozen (직전 세션 종료 시점) / Phase A grep = 실시간 사실
- 9 칸 누적 패턴이 메모리 stale 시점에도 보정 시스템으로 작동 = 워크플로 자가 치유
- 향후 후행 ISSUE 시작 시 grill-me 가 동일 패턴 답습 = 메모리 의존성 약화

### ★ 부재 산출물 표 (TEST-001 위임 1 + 명확화 0 = 1)

| 명세 §3 산출물 | 현실 (Phase A 확인) | 위임 대상 |
|---|---|---|
| §3.10 `__tests__/mocks/diagnosis.spec.ts` 6 케이스 | vitest config 부재 (Phase A.7 12 회째 일관) + AC-5 grep static check 로 분리 가능 | **TEST-001 (진단 GWT)** |

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 ISSUE 사용처 |
|---|---|---|
| **API-002** (PR #82 머지 완료, main `891ae97`) | `lib/types/diagnosis.ts` — `CandidateAreaDTO` (P1 re-export) + `CommuteInfoDTO` + `DiagnosisDTO` + `CreateDiagnosisResponse` + `GetDiagnosisResponse` + `TimelineDTO` + `TimelineStepDTO` + `DiagnosisFilters` (types.ts import) + `DiagnosisStatusType` + `DiagnosisErrorCode` + `DiagnosisErrorDTO` | ★ **본 ISSUE 핵심 — 7 타입 import + 13 satisfies 검증** (★ Wave 2 체인 5 회째 입증 위치) |
| **API-001** (PR #81 머지 완료) | API Contract 트랙 (B) 절충 + 커밋 2 개 + (P1) 패턴 | ★ 본 ISSUE 답습 기준 — Phase B 활성 5 회째 |
| **API-003** (PR #83 머지 완료) | (P1) 미묘 구분 § + S3+S4 dual mapper § + Wave 2 체인 4 회째 | ★ 본 ISSUE 답습 기준 — (P1) 5 회째 케이스 + 체인 5 회째 |
| **API-005** (PR #84 머지 완료, main `44cebf8`) | ★ Q3 분리/통합 strategy § + 3 종 가이드 § 정립 + Wave 2 트랙 D 완성 마일스톤 | ★ **본 ISSUE 핵심 — 분리/통합 strategy § 첫 후행 실전 (다른 차원 적용) + 3 종 가이드 § 4 번째 § 추가** |
| **DB-007** (PR #80 머지 완료) | L6 1차 발견 | 본 ISSUE = Q2 가드 5 회째 (mock 차원 첫, 의존성 약함) |
| DB-001~006 / INFRA-001 | 간접 선행 (Phase 패턴 + dead 회피 + 11 회 회귀 0 가드 답습) | DB-* / INFRA-* 패턴 답습 |

### 후행 ISSUE 정합성 (Q1~Q7 결정 트리거)

| 후행 Task ID | 본 ISSUE 위임 트리거 |
|---|---|
| **★ UI-002** (주소 입력 화면 UI) | scenarios.ts `MOCK_CREATE_DIAGNOSIS_NORMAL` import + 진단 시작 버튼 결과 프리뷰 |
| **★ UI-003** (진단 결과 지도 시각화) | candidates.ts `MOCK_CANDIDATES_NORMAL` import + react-kakao-maps-sdk 마커 (4 후보 coordinate 활용) |
| **★ UI-004** (후보 동네 상세 패널) | candidates.ts 4 후보 import + CommuteInfo 표시 (time/mode/transfers) |
| **★ UI-005** (조건 필터 UI) | scenarios.ts `MOCK_CREATE_DIAGNOSIS_EMPTY` import + 필터 적용 결과 0 곳 안내 |
| **★ TEST-001** (진단 GWT) | candidates + scenarios + get-diagnosis 전체 fixture + §3.10 6 케이스 (정상 3 곳+ / 수도권 좌표 / 빈 결과 / 데드라인 5 단계 / 결정론적 ID / ISO 8601) |
| **★ MOCK-002** (ShareLink Mock) | ★ 본 ISSUE MOCK 답습 가이드 § 따라 4 파일 분리 + API-003 산출물 import + satisfies + 결정론적 가드 + Wave 2 체인 6 회째 |
| **★ MOCK-004** (카카오 API Mock) | ★ 본 ISSUE 답습 + API-007 활용 + Wave 2 체인 7 회째 |
| **★ MOCK-005** (OAuth Mock) | ★ 본 ISSUE 답습 + API-001 auth.ts 활용 + Wave 2 체인 8 회째 |
| **★ cleanup ISSUE (REFACTOR-L6 또는 명세 v1.0 동기화)** | ★ Mismatch ③ DiagnosisFilters 영역 cleanup 트리거 확장 (API-002 §9.5 동일 영역, 명세 v1.0 stale 일관 신호) |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

> ★ API-001/002/003/005 패턴 답습 5 회째 (Phase A 사전 검증 + Phase B 활성 4 파일 + Phase C 명세 동기화 + Phase D 커밋 2 개) + (B) 절충 + Q3 (가) 4 파일 분리 (역할 차원 신규) + Q2 (가) 책임 분리 + ★ Mismatch 5 건 정직 기록.

- [x] **3.1** `lib/mocks/diagnosis/` 디렉토리 + 4 파일 신규 — **Phase B 완료**
  > ★ 명령어 `mkdir -p src/lib/mocks/diagnosis` 신규 owner 디렉토리 생성 (M4 부재 → 신규).

- [x] **3.2** `candidates.ts` CandidateAreaDTO 4 종 fixture — **Phase B.1 완료**
  > ★ **Mismatch ① 보정**: 명세 `{ id, name, coord, commuteA, commuteB, score, rank }` → 실제 산출물 `{ id, dong, gu, coordinate, commuteA, commuteB?, leisureA?, leisureB?, score, safetyGrade?, priceRange?, facilities?, lines?, listingsCount?, avgArea? }` (Step 10.5 풍부 필드).
  > ★ **Mismatch ② 보정**: CommuteInfo 명세 `{ durationMinutes, transportType, transfers, walkingMinutes }` → 실제 `{ time, mode, transfers? }` (walkingMinutes 부재).
  > 4 fixture: 강남구 역삼동 (mock-cand-001) / 종로구 안국동 (002) / 용산구 이태원동 (003) / 성동구 성수동 (004). 실재 좌표 + Step 10.5 풍부 필드 (safetyGrade/priceRange/facilities/lines/listingsCount/avgArea) 활용. ★ Wave 2 체인 5 회째 입증 위치 (L17 import + 5 satisfies).

- [x] **3.3** `scenarios.ts` MOCK_CREATE_DIAGNOSIS_NORMAL — **Phase B.2 완료**
  > MOCK_CANDIDATES_NORMAL 4 후보 + status='completed' + timeline=null + 1 satisfies CreateDiagnosisResponse.

- [x] **3.4** `scenarios.ts` MOCK_CREATE_DIAGNOSIS_SINGLE — **Phase B.2 완료**
  > 3 후보 (역삼/안국/이태원) + status='completed' + timeline=null.

- [x] **3.5** `scenarios.ts` MOCK_CREATE_DIAGNOSIS_DEADLINE — **Phase B.2 완료**
  > 4 후보 + timeline TimelineDTO (5 단계 dueDate 2026-06-01~30, deadlineDate=2026-06-30) + status='completed'.

- [x] **3.6** `scenarios.ts` MOCK_CREATE_DIAGNOSIS_EMPTY — **Phase B.2 완료**
  > 0 후보 + status='completed' (정상 케이스) + timeline=null. ★ Mismatch ④ 보정: status='failed' (DiagnosisStatusType 부재) → 'completed' 정상 처리 (REQ-FUNC-008 "안내" 표시).

- [x] **3.7** `scenarios.ts` MOCK_DIAGNOSIS_ERROR_* 2 종 — **Phase B.2 완료 (★ Mismatch ④ 보정)**
  > ★ **Mismatch ④ 보정**: 명세 v1.0 `MOCK_CREATE_DIAGNOSIS_ERROR (status='failed' + error)` → 실제 DiagnosisStatusType 에 'failed' 부재 + CreateDiagnosisResponse 에 error 필드 부재. 본 ISSUE 채택: **별도 DiagnosisErrorDTO satisfies** (TIMEOUT 504 + OUT_OF_COVERAGE 400). 에러 모델 분리 패턴 (명세 v1.0 가 놓침).

- [x] **3.8** `get-diagnosis.ts` MOCK_DIAGNOSIS_ENTITY + MOCK_GET_DIAGNOSIS_RESPONSE — **Phase B.3 완료 (★ Mismatch ③/⑤ 보정)**
  > ★ **Mismatch ③ 보정**: DiagnosisFilters 명세 `{ maxCommuteTime, budgetMin, budgetMax, timeSlot }` → 실제 `{ maxCommuteTime?, budget: {min,max}, timeRange, priorities? }`. 본 ISSUE 채택: 실제 정확 + cleanup 트리거 확장 (API-002 §9.5 동일 영역).
  > ★ **Mismatch ⑤ 보정**: GetDiagnosisResponse 에 timeline 필드 부재 (POST CreateDiagnosisResponse 와 다른 contract). 본 ISSUE 채택: 실제 정확 — diagnosis + candidates 2 필드만.
  > ★ **ServiceModeType 재사용 5 회째** — `mode: 'couple'` satisfies 로 자동 타입 체크 (DiagnosisDTO.mode = ServiceModeType, import 불필요).

- [x] **3.9** `index.ts` 배럴 export — **Phase B.4 완료**
  > 3 export (candidates / scenarios / get-diagnosis). TEST-001 / UI-002~005 호출처 단순화.

- [⏸ TEST-001 위임] **3.10** `__tests__/mocks/diagnosis.spec.ts` 6 케이스 — **Q4 부재 산출물 결정**
  > **사유 3 종 (DB-001~007 + API-001/002/003/005 일관 12 회째)**:
  > 1. **vitest config 부재 (Phase A.7 확인)** → spec 작성해도 실행 불가
  > 2. **AC-5 grep static check 분리 가능** → Phase D `grep -rnE "Math\.random|Date\.now|new Date"` 0건 검증으로 결정론적 가드 충족
  > 3. **TEST-001 영역 (진단 GWT)** → 6 케이스 (정상 3 곳+ / 수도권 좌표 / 빈 결과 / 데드라인 5 단계 / 결정론적 ID / ISO 8601) = TEST-001 영역

### ★ Q1~Q7 결정 vs 명세 v1.0 mismatch 추적 표 (API-001/002/003/005 패턴 답습 5 회째)

| Q | 영역 | 명세 v1.0 (MOCK-001.md) | 현실 (onday-app) | 결정 | 후행 처리 |
|---|---|---|---|---|---|
| **Q1** | 작업 모드 (가장 상위) | §3.1~3.10 10 산출물 신규 작성 | M1~M3 현실 mock 가드 + M4 부재 + M5 명세 변수 0건 + vitest 부재 | **(B) 절충 — 5 → 4 파일 분리 + spec 위임 (API-001/002/003/005 일관 5 회째)** | Phase B 4 파일 + Phase D 커밋 2 개 |
| **페이스** | 세션 진행 범위 | — | API-005 풀세트 머지 직후 + 컨디션 OK 새 세션 + 가드 충돌 0 + Q2/Q3 추천 명확 | **(가) 풀세트 도전 — Phase A~D 본 세션 진행** | Phase A~D 진행 |
| **Q2** ★ | 기존 mock 경계 | (명세 §3.1 `lib/mocks/diagnosis/` 신규만 명시) | M1 22 개 동네 (Neighborhood, 6 호출처) + M2 users + M3 mock-calculator (DM5~7) 현실 동작 + M4 부재 | **(가) 두 mock 시스템 공존 — 책임 분리** (M1~M3 보존 + M4 신규 owner, 다른 타입/사용처/워크플로) | M1~M3 가드 보존 + cleanup 의존성 약함 |
| **Q3** ★★ | 5 파일 분리 strategy (★ API-005 § 첫 후행 실전) | §3.1~3.10 5 파일 (4 코드 + 1 spec) 분리 명시 | M4 부재 + 명세 §3.1 직접 분리 명시 + 후행 ISSUE 다른 파일 import | **(가) 4 파일 분리** (candidates / scenarios / get-diagnosis / index, spec 위임) — ★ 역할별 책임 분리 차원 (★ 분리/통합 strategy § 다른 차원 적용) + MOCK-002/004/005 답습 가이드 신규 owner | 후행 import 활용 (UI-002~005 + TEST-001 + MOCK-002/004/005) |
| **Q4** | §3.10 spec | 신규 작성 6 케이스 | vitest config 부재 (Phase A.7 12 회째) + AC-5 grep static 분리 가능 | **⏸ TEST-001 위임** | TEST-001 (§9 답습 가이드) |
| **Q5** | 결정론적 가드 (Math.random/Date.now/new Date 0건) | AC-5 명시 | Phase B grep 코드 0건 (주석 3 매치만) | **✅ 자동 가드 + ★ MOCK 트랙 표준 가드 정립** | Phase D 재검증 + MOCK-002/004/005 답습 |
| **Q6** | satisfies 검증 vs 의존성 | (명세 §3.2~3.8 satisfies 명시) | API-002 산출물 7 타입 활용 | **✅ 13 곳 satisfies + ★ Wave 2 체인 5 회째 입증 + ★ Mismatch 5 건 자동 발견** | TEST-001 시점 검증 |
| **Q7** | 라이브 서비스 mock 사용 정책 | (명세 v1.0 부재 — Open Questions 1) | `.env.example` `NEXT_PUBLIC_USE_MOCK=true` 가드 (CLAUDE.md §3 명시) | **✅ fixture only — 라이브 전환 INFRA-002/MOCK-002~005/CMD-DIAG 위임** | INFRA-002 + 후행 ISSUE |
| **보조 1** ★★ | ★ Mismatch 5 건 (CandidateAreaDTO 필드 / CommuteInfo / DiagnosisFilters / MOCK_CREATE_DIAGNOSIS_ERROR / GetDiagnosisResponse.timeline) | 명세 v1.0 가정 (5 영역) | 실제 API-002 산출물 정확 기준 (5 영역 mismatch) | **★ 실제 산출물 정확 채택 + Phase C 정직 기록 + cleanup 트리거 확장 (③)** | TEST-001 / cleanup ISSUE 선택 |
| **보조 2** | 메모리 stale 보정 2 건 | (메모리 = 직전 세션 frozen) | grill-me + Phase A grep 실시간 보정 | ★ 정직 기록 + 9 칸 누적 "현실 추인" 원칙 = 자가 치유 시스템 입증 | 향후 grill-me 답습 |

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD — API-001/002/003/005 ⏸ 패턴 일관 + Phase B 작성분 충족 + ★ AC-7 신규)

**AC-1 (정상, ✅ Phase B 산출물 충족):** 커플 모드 정상 Mock 데이터 구조 검증
- **Given** `MOCK_CREATE_DIAGNOSIS_NORMAL` import 된 상태
- **When** `CreateDiagnosisResponse` 타입으로 satisfies 검증
- **Then** `candidates.length >= 3` (4 후보) + 각 후보의 `coordinate.lat` 37.0~38.0 범위 + `coordinate.lng` 126.5~127.5 범위 + `score` 0~100 범위 + `diagnosisId === 'mock-diag-001'` (결정론적)
- **Status:** ✅ Phase B.2 satisfies + Phase B.5 tsc exit 0 + Phase D grep 검증

**AC-2 (예외, ✅ Phase B 산출물 충족):** 후보 0 곳 시나리오 Mock 검증
- **Given** `MOCK_CREATE_DIAGNOSIS_EMPTY` import 된 상태
- **When** `candidates` 배열 확인
- **Then** `candidates.length === 0` + `timeline === null` + `status === 'completed'` (★ Mismatch ④ 보정 — failed 아님)
- **And** UI 에서 "조건을 만족하는 동네가 없습니다" 안내 렌더링 base
- **Status:** ✅ Phase B.2 satisfies + 1 satisfies CreateDiagnosisResponse

**AC-3 (예외, ✅ Phase B 산출물 충족, ★ Mismatch ④ 정정):** 교통 API 에러 Mock 검증
- **Given** `MOCK_DIAGNOSIS_ERROR_TIMEOUT` import 된 상태 (★ DiagnosisErrorDTO satisfies — CreateDiagnosisResponse 아님)
- **When** `code` 필드 확인
- **Then** `code === DiagnosisErrorCode.TRANSPORT_API_TIMEOUT` + `httpStatus === 504` + `message` 한국어 문자열
- **Status:** ✅ Phase B.2 DiagnosisErrorDTO 분리 satisfies (★ 명세 v1.0 가 놓친 에러 모델 분리 패턴 본 ISSUE 정정)

**AC-4 (경계, ✅ Phase B 산출물 충족):** 데드라인 모드 타임라인 단계 수 검증
- **Given** `MOCK_CREATE_DIAGNOSIS_DEADLINE` import 된 상태
- **When** `timeline.steps.length` 확인
- **Then** `timeline.steps.length === 5` (≥5 만족) + 각 step `order` 1~5 순차 + `dueDate` ISO date 형식 (`YYYY-MM-DD`) + `timeline.deadlineDate === '2026-06-30'` (마지막 step dueDate 일치)
- **Status:** ✅ Phase B.2 satisfies + TimelineDTO + 5 TimelineStepDTO

**AC-5 (경계, ✅ Phase B 산출물 충족 + ★ MOCK 트랙 표준 가드 정립):** Math.random / Date.now / new Date 0건 검증 (★ 결정론적 가드)
- **Given** `lib/mocks/diagnosis/` 디렉토리 내 모든 `.ts` 파일
- **When** `grep -rnE "Math\.random|Date\.now|new Date" lib/mocks/diagnosis/` 실행
- **Then** 코드 매치 0 건 (주석 3 매치만 — AC-5 가드 정의 주석)
- **Status:** ✅ Phase B.5 grep + Phase D 재검증 + ★ MOCK-002/004/005 답습 가이드 정립

**AC-6 (정상, ✅ Phase B 산출물 충족, ★ Q3 (가) 분리 입증):** Q3 (가) 4 파일 책임 분리 검증
- **Given** Phase B 산출물 4 파일 (candidates / scenarios / get-diagnosis / index)
- **When** 각 파일 책임 grep — candidates(fixture only) / scenarios(시나리오 6) / get-diagnosis(GET response) / index(배럴 3 export)
- **Then** 책임 분리 명확 + candidates.ts L17 `import type { CandidateAreaDTO } from '@/lib/types/diagnosis'` 확인 + 13 satisfies 검증 통과
- **Status:** ✅ Phase B.5 tsc exit 0 + 책임 분리 가드 (역할 차원)

**★ AC-7 (정직성, ✅ Phase C 산출물 충족 — 본 ISSUE 진짜 핵심):** Mismatch 5 건 정직 기록
- **Given** Phase B 코드 작성 중 satisfies 검증 시점에 발견된 명세 v1.0 ↔ API-002 산출물 mismatch 5 영역 (CandidateAreaDTO 필드 / CommuteInfo / DiagnosisFilters / MOCK_CREATE_DIAGNOSIS_ERROR / GetDiagnosisResponse.timeline)
- **When** Phase C `tasks/MOCK-001.md` §2 Mismatch 추적 표 5 행 작성
- **Then** 5 건 모두 정직 기록 + 실제 산출물 정확 기준 채택 + 후행 처리 (cleanup ISSUE 트리거 ③ 확장) 명시
- **Status:** ✅ Phase C §2 Mismatch 추적 표 5 행 + §3 보조 1 mismatch 추적 + §9 follow-up — ★ "명세는 가설, 코드는 사실" 원칙 입증

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | ✅ Mock 데이터 = 순수 객체 리터럴 (직렬화 오버헤드 0) + Phase B `tsc --noEmit` exit 0 + Phase D 재검증 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | ✅ Phase B.2 `MOCK_DIAGNOSIS_ERROR_*` 가 `DiagnosisErrorCode + DiagnosisErrorDTO` satisfies → Sentry captureException 연계 가능 (API-002 산출물 활용) |

---

## 6. 📦 Deliverables (산출물 명시 — 신규/보존/위임/정직성 4 구역)

### ✅ 신규 (5 — 4 코드 + 1 docs, Phase B + C, ★ API-005 +0 일관)

**Phase B 코드 (4 파일)**:
- `onday-app/src/lib/mocks/diagnosis/candidates.ts` (신규, ★ DB-006 영역 base 아닌 **재사용 fixture base**, 신규 owner 디렉토리 포함) — CandidateAreaDTO 4 종 + 배열. import 정확 1 (`CandidateAreaDTO from '@/lib/types/diagnosis'` ★ Wave 2 체인 5 회째)
- `onday-app/src/lib/mocks/diagnosis/scenarios.ts` (신규) — 시나리오 6 객체 (NORMAL/SINGLE/DEADLINE/EMPTY ×CreateDiagnosisResponse + ERROR ×2 DiagnosisErrorDTO). import 정확 3
- `onday-app/src/lib/mocks/diagnosis/get-diagnosis.ts` (신규, ★ ServiceModeType 5 회째 satisfies) — DiagnosisDTO + GetDiagnosisResponse. import 정확 2
- `onday-app/src/lib/mocks/diagnosis/index.ts` (신규) — 배럴 3 export

**Phase C 명세 (1 파일)**:
- `tasks/MOCK-001.md` — 본 명세 현실 동기화 (Q1~Q7 + ★ Wave 2 체인 5 회째 § + ★ Q3 (가) 4 파일 분리 § + ★ 분리/통합 strategy § 다른 차원 적용 § + ★ (P1) 미묘 구분 § 5 회째 케이스 + ★ mock 도메인 결정 매트릭스 § (신규) + ★ 결정론적 가드 § (신규) + ★ Mismatch 5 건 추적 표 + M1~M5 현실 mock + ServiceModeType 5 회째 + Q4~Q7 자동 묶음 + ★ MOCK 답습 가이드 § (신규) + ★ 메모리 stale 보정 § + §9 follow-up 5+)

### ✅ 보존 (DB-001~007 12 + API-001/002/003/005 산출물 14 + types.ts + DiagnosisMode 11/DiagnosisStatus 2/F0/ServiceModeType 4 회 호출처 + S1~S6 + SS1~SS3 + N1~N6 + mock-auth M1~M4 + M1~M3 mock + .env.example = 16+종, 본 ISSUE 절대 미수정)

**DB-001~007 누적 가드 (12)**: prisma/schema.prisma + prisma.config.ts + migrations/ + seed.ts + lib/db.ts + types/errors/.gitkeep + **user.ts** (DB-002, ★ ServiceModeType 정의) + **diagnosis.ts** (DB-003 + API-002 — ★ 본 ISSUE 7 타입 import 대상) + __tests__/db/.gitkeep + package.json + design 루트 + 06_TASK_LIST_v1.3.md

**API-001 산출물 (3)**: auth.ts + auth-errors.ts + auth-error.ts

**API-002 산출물 (3)**: ★ diagnosis.ts (DB-003 보존 + append, ★ 본 ISSUE 7 타입 import 대상) + diagnosis-errors.ts + diagnosis-error.ts

**API-003 산출물 (3)**: share-link.ts + share-link-errors.ts + share-link-error.ts

**API-005 산출물 (4, ★ Phase A.5 보정)**: saved-search.ts (DB-006 base) + saved-search-api.ts (API) + saved-search-errors.ts + saved-search-error.ts

**Q2 가드 (17 행, ★ 5 회째 사수 — mock 차원 첫)**: types.ts (DiagnosisMode 11 DM1~DM11 + DiagnosisStatus 2 DS1~DS2 + F0 + ServiceModeType 4 회 호출처 SMT1~SMT4 + ★ 본 ISSUE SMT5 추가) — 위 §2 ServiceModeType 5 회째 표 참조

**M1~M3 현실 mock 가드 (★ Q2 (가) 책임 분리, MOCK 도메인 신규 owner 패턴)**: M1 neighborhoods.ts (302) + M2 users.ts (14) + M3 mock-calculator.ts (230, DM5~7) — 위 §2 M1~M5 표 참조

**S1~S6 + SS1~SS3 + N1~N6 + mock-auth M1~M4 (API-001/002/003/005 가드 누적)**: 본 ISSUE 무관여

**`.env.example` Supabase 3 종 + `NEXT_PUBLIC_USE_MOCK=true`**: 본 ISSUE 미수정 (Q7 라이브 전환 위임 근거)

### ⏸ 위임 (1)

- §3.10 `__tests__/mocks/diagnosis.spec.ts` 6 케이스 → **TEST-001 (진단 GWT)** (Q4)

### 🔄 정직성 (2 — ★ 본 ISSUE 진짜 핵심 가치 2 종)

- **★ Wave 2 체인 작동 5 회째 — API → MOCK 차원 첫 진입**: API-002 PR #82 CandidateAreaDTO re-export → **본 ISSUE candidates.ts L17 import + 13 satisfies = fixture 첫 외부 활용 = API → MOCK 차원 첫 진입**. 13 ISSUE 누적 워크플로 = 격리된 칸 아닌 도메인 차원 체인 시스템 입증. §9 본문 § 참조.
- **★ Mismatch 5 건 발견 = TS satisfies 명세 검증기 역할**: TS satisfies 키워드가 컴파일 시점에 명세 v1.0 가설을 산출물 사실로 검증 → 5 영역 mismatch 자동 발견 (CandidateAreaDTO 필드 / CommuteInfo / DiagnosisFilters / MOCK_CREATE_DIAGNOSIS_ERROR / GetDiagnosisResponse.timeline). 9 칸 누적 "현실 추인 + 명세/보드 실제 우선" 원칙이 mock 도메인 차원에서 코드 차원에 박힘. §2 Mismatch 추적 표 5 행 참조.

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 ISSUE 시작 전 필요)

- **★ API-002** (PR #82 머지 완료, main `891ae97`): ★ **본 ISSUE 핵심 선행** — `lib/types/diagnosis.ts` (CandidateAreaDTO + CreateDiagnosisResponse + GetDiagnosisResponse + DiagnosisDTO + TimelineDTO + TimelineStepDTO + DiagnosisErrorCode + DiagnosisErrorDTO + DiagnosisFilters + DiagnosisStatusType) — 7 타입 import + 13 satisfies 검증.
- **API-001** (PR #81 머지 완료): API Contract 트랙 (B) 절충 + Phase B 활성 패턴 + 커밋 2 개. ★ 본 ISSUE 답습 기준 5 회째.
- **API-003** (PR #83 머지 완료): (P1) 미묘 구분 § + 체인 작동 §. ★ 본 ISSUE 답습 기준 — 체인 5 회째 + (P1) 5 회째 케이스.
- **★ API-005** (PR #84 머지 완료, main `44cebf8`): ★ **본 ISSUE 핵심 선행** — Q3 분리/통합 strategy § + 3 종 가이드 § 정립. ★ 본 ISSUE 답습 기준 — 분리/통합 strategy § 첫 후행 실전 (다른 차원 적용) + 3 종 가이드 § 4 번째 § 추가.
- **DB-007** (PR #80 머지 완료): L6 1차 발견. 본 ISSUE = Q2 가드 5 회째 (mock 차원 첫, 의존성 약함).
- **DB-001~006** / **INFRA-001**: 간접 선행 (Phase 패턴 + dead 회피 + 12 회 회귀 0 가드 답습).

### 후행 (이 ISSUE 완료 후 차례로 가능)

- **★ UI-002** (주소 입력 화면): `MOCK_CREATE_DIAGNOSIS_NORMAL` import + 진단 시작 프리뷰
- **★ UI-003** (지도 시각화): `MOCK_CANDIDATES_NORMAL` import + react-kakao-maps-sdk 4 마커 (역삼/안국/이태원/성수)
- **★ UI-004** (상세 패널): 4 candidates import + CommuteInfo 표시 (time/mode/transfers)
- **★ UI-005** (조건 필터): `MOCK_CREATE_DIAGNOSIS_EMPTY` import + 0 곳 안내 base
- **★ TEST-001** (진단 GWT): 전체 fixture + §3.10 6 케이스 + AC-1~5 검증
- **★ MOCK-002** (ShareLink Mock): ★ 본 ISSUE MOCK 답습 가이드 § 따라 4 파일 분리 + Wave 2 체인 6 회째
- **★ MOCK-004** (카카오 API Mock): ★ 본 ISSUE 답습 + API-007 활용 + Wave 2 체인 7 회째
- **★ MOCK-005** (OAuth Mock): ★ 본 ISSUE 답습 + API-001 auth.ts 활용 + Wave 2 체인 8 회째
- **★ cleanup ISSUE (REFACTOR-L6 또는 명세 v1.0 동기화)**: ★ **Mismatch ③ DiagnosisFilters 영역 cleanup 트리거 확장** (API-002 §9.5 동일 영역 — DiagnosisInput.filters / DiagnosisDTO.filters / SearchParams.filters 3 영역 cleanup + 명세 v1.0 stale 일관 신호)

---

## 8. 🧪 Test Plan (검증 절차)

### Phase A (본 ISSUE) — 사전 검증 (read-only) — ✅ 완료

- ✅ A.1 main 동기화 (`f0b012e..44cebf8` fast-forward, PR #84 머지본 흡수 — API-005 산출물 4 신규 + tasks/API-005.md 갱신)
- ✅ A.2 feature/MOCK-001 신규 분기 + untracked 2 건 외 변경 0
- ✅ A.3 11 칸 가드 read-only (types.ts:1-3 ★ 12 회째 사수 + API-001~005 산출물 14 + DB-001~007 + user.ts ServiceModeType)
- ✅ A.4 **M1~M5 mock 현실 코드 grep** — M1 neighborhoods.ts (302, 22 동네, 6 호출처) / M2 users.ts (14) / M3 mock-calculator.ts (230, DM5~7) / M4 lib/mocks/ **부재** / M5 명세 변수 **grep 0건** (메모리 정확 일치)
- ✅ A.5 API-005 산출물 + ★ **누적 14 산출물 보정** (메모리 "12" → 실제 14, API-005 +2 saved-search.ts + saved-search-api.ts)
- ✅ A.6 API-002 `diagnosis.ts` satisfies 대상 9 타입 모두 존재 (CandidateAreaDTO L27 P1 re-export + DiagnosisDTO/CreateDiagnosisResponse/GetDiagnosisResponse/TimelineDTO/TimelineStepDTO/DiagnosisFilters/DiagnosisStatusType/DiagnosisErrorCode/DiagnosisErrorDTO)
- ✅ A.7 vitest config 부재 (12 회째 일관, DB-001~007 + API-001/002/003/005 + 본 ISSUE 동일) → TEST-001 위임 근거
- ✅ A.8 `src/lib/mocks/` 디렉토리 **부재** = 신규 owner 위치 정확
- ✅ A.9 `prisma validate` exit 0 + `prisma generate` exit 0 (7.8.0, 21ms) + `tsc --noEmit` exit 0
- ✅ A.10 env-less `npm run build` exit 0 + **Middleware 32.5 kB** (INFRA-001 AC-4 anchor, ★ **12 번째 회귀 0**)

### Phase B (본 ISSUE) — 활성, 4 파일 신규 — ✅ 완료

- ✅ B.1 `candidates.ts` 신규 (★ DB-006 영역 base 아닌 재사용 fixture base, ★ Wave 2 체인 5 회째 입증)
- ✅ B.2 `scenarios.ts` 신규 (시나리오 6 객체 — NORMAL/SINGLE/DEADLINE/EMPTY × CreateDiagnosisResponse + ERROR ×2 DiagnosisErrorDTO, ★ Mismatch ④ 보정)
- ✅ B.3 `get-diagnosis.ts` 신규 (DiagnosisDTO + GetDiagnosisResponse, ★ Mismatch ③/⑤ 보정, ★ ServiceModeType 5 회째 satisfies)
- ✅ B.4 `index.ts` 신규 (배럴 3 export)
- ✅ B.5 `tsc --noEmit` exit 0 (회귀 0) + `prisma validate` exit 0 + ★ 결정론적 grep 코드 0건 (주석 3 매치만) + 가드 grep (Prisma/types.ts 직접/M1 MOCK_NEIGHBORHOODS) 코드 0건 + 가드 16+종 무수정

### 후행 ISSUE 검증 (위임)

- **TEST-001 (진단 GWT)**: §3.10 6 케이스 + AC-1~5 + AC-7 통합 + ★ MOCK 답습 가이드 § 적용
- **수동 검증** (UI-002~005 시점):
  1. IDE 에서 Mock 객체 hover 시 API-002 DTO 타입 정상 표시 (CandidateAreaDTO 14 필드)
  2. `tsc --noEmit` 으로 satisfies 검증 13 곳 호환 재확인
  3. Mock import 후 react-kakao-maps-sdk 지도 컴포넌트 4 마커 렌더링 시각 확인

---

## 9. 🚧 Open Questions / Risks (보류 사항 — follow-up 5+ + ★ MOCK 답습 가이드 § + ★ 메모리 stale 보정 §)

### ★ MOCK 답습 가이드 § (★ 본 ISSUE 신규 owner — MOCK-002/004/005 결정 매트릭스)

§2 MOCK 답습 가이드 § 표 참조. 핵심 요점 재명시:
- Wave 2 트랙 E 4 ISSUE 통일 가이드 (MOCK-001 / MOCK-002 / MOCK-004 / MOCK-005)
- 본 ISSUE 정립: 4 파일 분리 + API-* 산출물 import + satisfies 검증 + 결정론적 가드 + M1~M5 형태 현실 mock 가드 + spec 위임 + Wave 2 체인 차원 확장
- 향후 MOCK-002 = API-003 share-link.ts 활용 (체인 6 회째) / MOCK-004 = API-007 활용 (7 회째) / MOCK-005 = API-001 auth.ts 활용 (8 회째)

### ★ 메모리 stale 보정 정직 기록 § (★ 본 ISSUE 보정 정직성)

§2 메모리 stale 보정 표 참조. 핵심 요점 재명시:
- 보정 1: "Wave 3 진입" → "Wave 2 트랙 E 첫" (06_TASK_LIST L417-421 + gh issue list 실제 확인)
- 보정 2: "12 산출물" → "14 산출물" (Phase A.5 실제 ls 확인, API-005 +2 반영)
- 의미: 9 칸 누적 "현실 추인 + 명세/보드 실제 우선" 원칙 = 메모리 stale 자가 치유 시스템

### 1. ★ §3.10 TEST-001 위임 — Mock 무결성 spec 6 케이스

TEST-001 (진단 GWT) 시점에:
- `vitest.config.ts` 신규 (DB-001~007 + API-001/002/003/005 + 본 ISSUE 일괄 위임 누적 13 회 해소)
- `__tests__/mocks/diagnosis.spec.ts` 6 케이스: 정상 3 곳+ / 수도권 좌표 범위 (lat 37.0~38.0, lng 126.5~127.5) / 빈 결과 / 데드라인 5 단계 / 결정론적 ID / ISO 8601 형식
- 진단 GWT E2E (REQ-FUNC-003 통합 — POST /api/diagnosis → MOCK_CREATE_DIAGNOSIS_NORMAL → 지도 렌더링 → 필터 적용 → MOCK_CREATE_DIAGNOSIS_EMPTY)
- ★ AC-5 grep static check 분리 가능 (Phase D 재검증)

### 2. ★ Mismatch ③ DiagnosisFilters cleanup ISSUE 트리거 확장 (★ 본 ISSUE 특화)

★ 명세 v1.0 stale 일관 신호:
- 본 ISSUE Mismatch ③ DiagnosisFilters: 명세 `{ maxCommuteTime, budgetMin, budgetMax, timeSlot }` ↔ 실제 `{ maxCommuteTime?, budget: {min,max}, timeRange, priorities? }`
- API-002 §9.5 동일 영역 (이미 트리거)
- DiagnosisInput.filters (types.ts L54) / DiagnosisDTO.filters (diagnosis.ts L49) / SearchParams.filters (saved-search.ts L29) 3 영역 cleanup 트리거 확장
- cleanup ISSUE (REFACTOR-L6 또는 명세 v1.0 동기화) 시점 일괄 해소

### 3. ★ MSW (Mock Service Worker) 핸들러 (명세 v1.0 Open Questions 1 보존)

CMD-DIAG / UI-* 영역 결정:
- Mock 데이터를 MSW 핸들러로 래핑하여 `createDiagnosis()` Server Action 브라우저 레벨 인터셉트 여부
- MSW v2 (`msw@^2.0.0`) Server Action 지원 제한 가능성 — 초기 직접 import 권장, 필요시 Route Handler Mock 핸들러 점진적 추가
- 본 ISSUE = fixture only, MSW handler = CMD-DIAG 영역

### 4. ★ Storybook 연동 (명세 v1.0 Open Questions 2 보존)

UI-003 영역 결정:
- Mock 데이터 Storybook story `args` 직접 전달 → 컴포넌트별 독립 렌더링
- `@storybook/nextjs` 프레임워크 사용 시 Server Action Mock `.storybook/preview.ts` handler 등록 필요
- 본 ISSUE = fixture 제공, Storybook 설정 = UI-003 영역

### 5. ★ CandidateArea 확장 필드 (명세 v1.0 Open Questions 3 보존)

CMD-DIAG-003 (ScoringEngine) 영역 결정:
- 현재 `score: number` 추상화 (CandidateArea L28)
- 향후 카테고리별 점수 (교통 / 생활편의 / 치안 등) 추가 시 본 ISSUE 4 candidates Mock 도 확장 필요
- 본 ISSUE 4 candidates score 92/85/88/78 = ScoringEngine 결과 가정

### 6. ★ 좌표 정밀도 (명세 v1.0 Open Questions 4 보존)

- 수도권 실재 행정동 대표 좌표 사용 (역삼/안국/이태원/성수 4 종)
- 동 내부 특정 지점 (역 / 관공서) 정확 좌표와 오차 가능
- UI 지도 렌더링 시각 검증에는 충분 (UI-003 / UI-004 시점)

### 7. ★ MOCK-002/004/005 답습 가이드 적용 (★ 본 ISSUE 신규 owner — §2 표 + §9 가이드 §)

§2 MOCK 답습 가이드 § + 본 § 1 참조. MOCK-002/004/005 시점:
- 4 파일 분리 패턴 답습 (각 도메인 fixture / scenarios / response / barrel)
- API-* 산출물 import + satisfies 검증 패턴 답습
- 결정론적 가드 (AC-5) 답습
- Wave 2 체인 6/7/8 회째 입증 (API → MOCK 차원 확장)
- Mismatch 추적 (satisfies 명세 검증기 역할 답습)
