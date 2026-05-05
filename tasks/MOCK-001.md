---
name: Feature Task
title: "[Feature] MOCK-001: 프론트엔드 UI 개발용 진단 결과 Mock 데이터 (CandidateArea 3곳+ 포함)"
labels: ['feature', 'priority:L', 'epic:Mock & Fixture', 'wave:2']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [MOCK-001] 프론트엔드 UI 개발용 진단 결과 Mock 데이터 (CandidateArea 3곳+ 포함)
- **목적 (Why):**
  - **비즈니스:** UI 컴포넌트(UI-002, UI-003, UI-004, UI-005)가 백엔드 진단 로직 완성 전에 병렬 개발될 수 있도록, 실제 API 응답 구조와 동일한 Mock 데이터를 제공한다.
  - **사용자 가치:** 수도권 실재 행정동 좌표 기반의 사실적인 Mock 데이터로 UI 시각화를 미리 검증하여, 지도 렌더링·출퇴근 시간 표시·필터링 UI가 실 데이터 연동 전에 완성도를 확보한다.
- **범위 (What):**
  - ✅ 만드는 것: 정상 진단 결과 Mock(커플 모드, 3곳+ CandidateArea), 싱글 모드 Mock, 데드라인 모드 Mock(타임라인 포함), 빈 결과(0곳) Mock, 에러 시나리오 Mock
  - ❌ 만들지 않는 것: 진단 로직 구현(CMD-DIAG 범위), Mock Service Worker 핸들러(Open Questions에 기재), 결제 관련 Mock
- **복잡도:** L
- **Wave:** 2 (Mock 생성 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-003** (§4.1.1): "시스템은 두 직장 주소를 기반으로 교집합 후보 동네를 3곳 이상 산출하고, 지도 위에 시각화해야 한다. Vercel 무료 티어의 10초 Timeout을 방지하기 위해, 외부 교통 API 반복 호출 연산과 교차 연산 로직은 Next.js 서버(Server Action)가 아닌, 사용자 브라우저(Client Component) 내부에서 비동기 병렬 구조(Promise.all)로 처리해야 한다."
- **REQ-FUNC-004** (§4.1.1): "시스템은 각 후보 동네를 탭했을 때 양쪽 직장까지의 예상 출퇴근 시간(대중교통·자차)을 표시해야 한다. 카카오맵 API 대비 시간 오차는 ±10% 이내여야 한다."
- **REQ-FUNC-006** (§4.1.1): "시스템은 조건 필터(최대 통근 시간, 예산)를 적용했을 때 조건에 맞지 않는 후보를 실시간 필터링하고 지도를 갱신해야 한다."
- **REQ-FUNC-008** (§4.1.1): "시스템은 두 직장 간 거리로 인해 교집합 후보가 0곳인 경우 \"조건을 만족하는 동네가 없습니다. 최대 통근 시간을 늘려보세요\" 안내를 1초 이내에 표시하고, 조건 완화 제안을 2개 이상 제공해야 한다."
- **REQ-FUNC-015** (§4.1.3): "시스템은 사용자가 이사 마감일(D-day)을 입력하고 \"데드라인 모드\"를 활성화할 수 있는 인터페이스를 제공해야 한다. 활성화 시 계약 역산 타임라인(서류 준비·잔금 일정 등 5단계 이상)을 2초 이내에 자동 생성해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"

### API 엔드포인트 (§6.1)

| # | Method | Endpoint / Action | 응답 Body (주요 필드) | 응답 시간 목표 |
|---|---|---|---|---|
| API-01 | POST | `createDiagnosis()` | `diagnosis_id`, `candidates[]`, `timeline` | p95 ≤ 3,000ms |
| API-02 | GET | `/api/diagnosis/[id]` | `diagnosis`, `candidates[]` | p95 ≤ 1,500ms |

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 태스크에서의 사용처 |
|---|---|---|
| API-002 | `lib/types/diagnosis.ts` — `CreateDiagnosisResponse`, `GetDiagnosisResponse`, `DiagnosisDTO`, `CandidateAreaDTO`, `CommuteInfoDTO`, `TimelineDTO`, `TimelineStepDTO`, `DiagnosisFilters`, `DiagnosisStatusType` | Mock 객체가 이 타입들을 `satisfies` 키워드로 타입 검증하여 생성됨 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/mocks/diagnosis/` 디렉토리 생성
  - 명령어: `mkdir -p lib/mocks/diagnosis`

- [ ] **3.2** `lib/mocks/diagnosis/candidates.ts`에 수도권 실재 행정동 기반 CandidateArea Mock 배열 정의
  ```typescript
  import type { CandidateAreaDTO, CommuteInfoDTO } from '@/lib/types/diagnosis';

  export const MOCK_CANDIDATE_YEOKSAM: CandidateAreaDTO = {
    id: 'mock-cand-001',
    name: '강남구 역삼동',
    coord: { lat: 37.5006, lng: 127.0364 },
    commuteA: { durationMinutes: 35, transportType: 'transit', transfers: 1, walkingMinutes: 8 } satisfies CommuteInfoDTO,
    commuteB: { durationMinutes: 42, transportType: 'transit', transfers: 2, walkingMinutes: 5 } satisfies CommuteInfoDTO,
    score: 92,
    rank: 1,
  } satisfies CandidateAreaDTO;

  export const MOCK_CANDIDATE_HAPJEONG: CandidateAreaDTO = {
    id: 'mock-cand-002',
    name: '마포구 합정동',
    coord: { lat: 37.5496, lng: 126.9139 },
    commuteA: { durationMinutes: 28, transportType: 'transit', transfers: 0, walkingMinutes: 10 } satisfies CommuteInfoDTO,
    commuteB: { durationMinutes: 55, transportType: 'transit', transfers: 2, walkingMinutes: 7 } satisfies CommuteInfoDTO,
    score: 85,
    rank: 2,
  } satisfies CandidateAreaDTO;

  export const MOCK_CANDIDATE_JAMSIL: CandidateAreaDTO = {
    id: 'mock-cand-003',
    name: '송파구 잠실동',
    coord: { lat: 37.5133, lng: 127.1001 },
    commuteA: { durationMinutes: 40, transportType: 'transit', transfers: 1, walkingMinutes: 6 } satisfies CommuteInfoDTO,
    commuteB: { durationMinutes: 38, transportType: 'transit', transfers: 1, walkingMinutes: 9 } satisfies CommuteInfoDTO,
    score: 88,
    rank: 3,
  } satisfies CandidateAreaDTO;

  export const MOCK_CANDIDATE_NORYANGJIN: CandidateAreaDTO = {
    id: 'mock-cand-004',
    name: '동작구 노량진동',
    coord: { lat: 37.5131, lng: 126.9429 },
    commuteA: { durationMinutes: 32, transportType: 'transit', transfers: 1, walkingMinutes: 12 } satisfies CommuteInfoDTO,
    commuteB: { durationMinutes: 48, transportType: 'transit', transfers: 2, walkingMinutes: 8 } satisfies CommuteInfoDTO,
    score: 78,
    rank: 4,
  } satisfies CandidateAreaDTO;

  export const MOCK_CANDIDATES_NORMAL = [
    MOCK_CANDIDATE_YEOKSAM,
    MOCK_CANDIDATE_HAPJEONG,
    MOCK_CANDIDATE_JAMSIL,
    MOCK_CANDIDATE_NORYANGJIN,
  ] as const;
  ```

- [ ] **3.3** `lib/mocks/diagnosis/scenarios.ts`에 시나리오별 Mock 객체 정의
  ```typescript
  import type {
    CreateDiagnosisResponse,
    GetDiagnosisResponse,
    DiagnosisDTO,
    TimelineDTO,
    TimelineStepDTO,
  } from '@/lib/types/diagnosis';
  import { MOCK_CANDIDATES_NORMAL, MOCK_CANDIDATE_YEOKSAM, MOCK_CANDIDATE_HAPJEONG, MOCK_CANDIDATE_JAMSIL } from './candidates';

  // === 시나리오 1: 커플 모드 정상 결과 (3곳+) ===
  export const MOCK_CREATE_DIAGNOSIS_NORMAL: CreateDiagnosisResponse = {
    diagnosisId: 'mock-diag-001',
    candidates: [...MOCK_CANDIDATES_NORMAL],
    timeline: null,
    status: 'completed',
  } satisfies CreateDiagnosisResponse;

  // ... (이하 모든 시나리오)
  ```

- [ ] **3.4** `lib/mocks/diagnosis/scenarios.ts`에 싱글 모드 Mock 정의 (학군·가족 항목 제외, 야간 치안 레이어 활성)
  ```typescript
  export const MOCK_CREATE_DIAGNOSIS_SINGLE: CreateDiagnosisResponse = {
    diagnosisId: 'mock-diag-002',
    candidates: [
      { ...MOCK_CANDIDATE_YEOKSAM, id: 'mock-cand-single-001', commuteB: { durationMinutes: 20, transportType: 'transit', transfers: 0, walkingMinutes: 5 } },
      { ...MOCK_CANDIDATE_HAPJEONG, id: 'mock-cand-single-002', commuteB: { durationMinutes: 15, transportType: 'car', transfers: 0, walkingMinutes: 3 } },
      { ...MOCK_CANDIDATE_JAMSIL, id: 'mock-cand-single-003', commuteB: { durationMinutes: 25, transportType: 'transit', transfers: 1, walkingMinutes: 7 } },
    ],
    timeline: null,
    status: 'completed',
  } satisfies CreateDiagnosisResponse;
  ```

- [ ] **3.5** `lib/mocks/diagnosis/scenarios.ts`에 데드라인 모드 Mock 정의 (타임라인 ≥5단계 포함)
  ```typescript
  export const MOCK_TIMELINE: TimelineDTO = {
    steps: [
      { order: 1, title: '매물 탐색 완료', description: '교집합 후보 동네 급매 매물 확인', dueDate: '2026-05-01', completed: false } satisfies TimelineStepDTO,
      { order: 2, title: '집 방문 및 임장', description: '상위 3곳 방문 일정 확보', dueDate: '2026-05-08', completed: false } satisfies TimelineStepDTO,
      { order: 3, title: '계약 협상', description: '중개사 연락 및 가격 협상', dueDate: '2026-05-15', completed: false } satisfies TimelineStepDTO,
      { order: 4, title: '계약서 작성', description: '전·월세 계약서 서명', dueDate: '2026-05-22', completed: false } satisfies TimelineStepDTO,
      { order: 5, title: '잔금 및 입주', description: '잔금 납부 및 이사 완료', dueDate: '2026-05-30', completed: false } satisfies TimelineStepDTO,
    ],
    deadlineDate: '2026-05-30',
  } satisfies TimelineDTO;

  export const MOCK_CREATE_DIAGNOSIS_DEADLINE: CreateDiagnosisResponse = {
    diagnosisId: 'mock-diag-003',
    candidates: [...MOCK_CANDIDATES_NORMAL],
    timeline: MOCK_TIMELINE,
    status: 'completed',
  } satisfies CreateDiagnosisResponse;
  ```

- [ ] **3.6** `lib/mocks/diagnosis/scenarios.ts`에 후보 0곳 + 조건 완화 시나리오 Mock 정의
  ```typescript
  export const MOCK_CREATE_DIAGNOSIS_EMPTY: CreateDiagnosisResponse = {
    diagnosisId: 'mock-diag-004',
    candidates: [],
    timeline: null,
    status: 'completed',
  } satisfies CreateDiagnosisResponse;
  ```

- [ ] **3.7** `lib/mocks/diagnosis/scenarios.ts`에 에러 시나리오(교통 API 타임아웃) Mock 정의
  ```typescript
  import { DiagnosisErrorCode } from '@/lib/types/diagnosis';

  export const MOCK_DIAGNOSIS_ERROR_TIMEOUT = {
    code: DiagnosisErrorCode.TRANSPORT_API_TIMEOUT,
    message: '교통 API 응답 지연이 발생했습니다. 잠시 후 다시 시도해 주세요.',
    httpStatus: 504,
  } as const;

  export const MOCK_DIAGNOSIS_ERROR_NO_COVERAGE = {
    code: DiagnosisErrorCode.ADDRESS_OUT_OF_COVERAGE,
    message: '해당 지역은 현재 수도권만 지원됩니다.',
    httpStatus: 400,
  } as const;
  ```

- [ ] **3.8** `lib/mocks/diagnosis/get-diagnosis.ts`에 GET /api/diagnosis/[id] 응답용 Mock 정의
  ```typescript
  import type { GetDiagnosisResponse, DiagnosisDTO } from '@/lib/types/diagnosis';
  import { MOCK_CANDIDATES_NORMAL } from './candidates';

  export const MOCK_DIAGNOSIS_ENTITY: DiagnosisDTO = {
    id: 'mock-diag-001',
    userId: 'mock-user-001',
    deadline: null,
    status: 'completed',
    filters: { maxCommuteTime: 60, budgetMin: 5000, budgetMax: 15000, timeSlot: '08:00' },
    mode: 'couple',
    deadlineMode: false,
    createdAt: '2026-04-25T10:00:00.000Z',
  } satisfies DiagnosisDTO;

  export const MOCK_GET_DIAGNOSIS_RESPONSE: GetDiagnosisResponse = {
    diagnosis: MOCK_DIAGNOSIS_ENTITY,
    candidates: [...MOCK_CANDIDATES_NORMAL],
  } satisfies GetDiagnosisResponse;
  ```

- [ ] **3.9** `lib/mocks/diagnosis/index.ts`에 배럴 export 파일 작성
  ```typescript
  export * from './candidates';
  export * from './scenarios';
  export * from './get-diagnosis';
  ```

- [ ] **3.10** `__tests__/mocks/diagnosis.spec.ts`에 Mock 데이터 무결성 검증 테스트 작성
  ```typescript
  import { MOCK_CREATE_DIAGNOSIS_NORMAL, MOCK_CREATE_DIAGNOSIS_EMPTY, MOCK_CREATE_DIAGNOSIS_DEADLINE } from '@/lib/mocks/diagnosis';

  describe('Diagnosis Mock 데이터 무결성', () => {
    it('정상 결과 Mock의 candidates가 3곳 이상이다', () => { /* ... */ });
    it('모든 CandidateArea의 좌표가 수도권 범위 내이다 (lat: 37.0~38.0, lng: 126.5~127.5)', () => { /* ... */ });
    it('빈 결과 Mock의 candidates가 빈 배열이다', () => { /* ... */ });
    it('데드라인 Mock의 timeline.steps가 5단계 이상이다', () => { /* ... */ });
    it('모든 Mock의 id가 결정론적(고정값)이다', () => { /* ... */ });
    it('모든 Mock의 createdAt이 ISO 8601 형식이다', () => { /* ... */ });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 커플 모드 정상 Mock 데이터 구조 검증
- **Given** `MOCK_CREATE_DIAGNOSIS_NORMAL`이 import된 상태
- **When** `CreateDiagnosisResponse` 타입으로 `satisfies` 검증
- **Then** `candidates.length >= 3`이고, 각 후보의 `coord.lat`이 37.0~38.0 범위, `coord.lng`이 126.5~127.5 범위이며, `score`가 0~100 범위
- **And** `diagnosisId`가 `'mock-diag-001'` (결정론적 고정값)

**AC-2 (예외):** 후보 0곳 시나리오 Mock 검증
- **Given** `MOCK_CREATE_DIAGNOSIS_EMPTY`가 import된 상태
- **When** `candidates` 배열을 확인
- **Then** `candidates.length === 0`이고, `timeline`이 `null`이며, `status`가 `'completed'`
- **And** UI에서 "조건을 만족하는 동네가 없습니다" 안내를 렌더링하는 데 사용 가능

**AC-3 (예외):** 교통 API 에러 Mock 검증
- **Given** `MOCK_DIAGNOSIS_ERROR_TIMEOUT`이 import된 상태
- **When** `code` 필드를 확인
- **Then** `code`가 `DiagnosisErrorCode.TRANSPORT_API_TIMEOUT`이고, `httpStatus`가 `504`이며, `message`가 한국어 문자열

**AC-4 (경계):** 데드라인 모드 타임라인 단계 수 검증
- **Given** `MOCK_CREATE_DIAGNOSIS_DEADLINE`이 import된 상태
- **When** `timeline.steps.length`를 확인
- **Then** `timeline.steps.length >= 5`이고, 각 step의 `order`가 1부터 순차적이며, `dueDate`가 ISO date 형식 (YYYY-MM-DD)
- **And** `timeline.deadlineDate`가 마지막 step의 `dueDate`와 일치

**AC-5 (경계):** Math.random/Date.now 사용 0건 검증
- **Given** `lib/mocks/diagnosis/` 디렉토리 내 모든 `.ts` 파일
- **When** `Math.random`, `Date.now()`, `new Date()` 문자열 검색
- **Then** 검색 결과 0건 (모든 값이 결정론적 고정값)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | Mock 데이터는 즉시 반환되므로 부하 테스트의 baseline으로 활용. Mock import 시 직렬화 오버헤드가 없도록 순수 객체 리터럴로 정의. `tsc --noEmit`으로 타입 호환성 확인 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 에러 시나리오 Mock에 `DiagnosisErrorCode`가 포함되어 Sentry captureException과 연계 가능한 구조인지 테스트 코드에서 확인 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/mocks/diagnosis/candidates.ts` (수도권 실재 행정동 CandidateArea 4개 + 배열)
- `lib/mocks/diagnosis/scenarios.ts` (정상·싱글·데드라인·빈결과·에러 5개 시나리오)
- `lib/mocks/diagnosis/get-diagnosis.ts` (GET /api/diagnosis/[id] 응답 Mock)
- `lib/mocks/diagnosis/index.ts` (배럴 export)
- `__tests__/mocks/diagnosis.spec.ts` (Mock 무결성 검증 6개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **API-002:** `lib/types/diagnosis.ts` — `CreateDiagnosisResponse`, `GetDiagnosisResponse`, `CandidateAreaDTO`, `CommuteInfoDTO`, `TimelineDTO`, `TimelineStepDTO`, `DiagnosisDTO`, `DiagnosisFilters`, `DiagnosisStatusType`, `DiagnosisErrorCode` 타입 정의. Mock 객체가 이 타입을 `satisfies` 키워드로 명시적 타입 검증

### 후행:
- **UI-002:** 주소 입력 화면 UI — Mock 데이터 기반 프리뷰
- **UI-003:** 진단 결과 지도 시각화 UI — `MOCK_CANDIDATES_NORMAL` 사용
- **UI-004:** 후보 동네 상세 패널 UI — `CommuteInfoDTO` Mock 사용
- **UI-005:** 조건 필터 UI — 필터 적용 후 Mock 데이터로 결과 검증
- **TEST-001:** 교차 진단 GWT 시나리오 — Mock 데이터 기반 테스트 fixture

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/mocks/diagnosis.spec.ts` — 6개 케이스 (정상 3곳+, 수도권 좌표 범위, 빈 결과, 데드라인 5단계+, 결정론적 ID, ISO 8601 형식)
- **타입 검증:** `tsc --noEmit`으로 모든 Mock 객체가 API-002 DTO 타입과 호환되는지 확인
- **정적 분석:** `grep -r 'Math.random\|Date.now\|new Date' lib/mocks/diagnosis/` 결과 0건 확인
- **수동 검증:**
  1. IDE에서 Mock 객체 hover 시 DTO 타입이 올바르게 표시되는지 확인
  2. Storybook 또는 Next.js 개발 서버에서 Mock 데이터를 import하여 지도 컴포넌트에 렌더링 테스트
- **CI 게이트:** `tsc --noEmit` 통과, Jest 테스트 100% 통과, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **MSW(Mock Service Worker) 핸들러 제공 여부:** Mock 데이터를 MSW 핸들러로 래핑하여 `createDiagnosis()` Server Action을 브라우저 레벨에서 인터셉트할지 — MSW v2 (`msw@^2.0.0`)의 Server Action 지원이 제한적일 수 있으므로, 초기에는 직접 import 방식을 기본으로 하고, 필요시 Route Handler Mock 핸들러만 추가하는 점진적 접근을 권장.
2. **Storybook 연동 방안:** Mock 데이터를 Storybook story의 `args`로 직접 전달하여 컴포넌트별 독립 렌더링이 가능. `@storybook/nextjs` 프레임워크 사용 시 Server Action Mock은 `.storybook/preview.ts`에서 handler 등록 필요 — UI-003 작업 시 Storybook 설정과 함께 확정.
3. **CandidateArea 확장 필드:** SRS §6.7 CLD에서 `ScoringEngine`의 스코어링 기준이 상세 미정 — 현재 `score: number`로 추상화하되, 향후 카테고리별 점수(교통, 생활편의, 치안 등) 추가 시 Mock도 확장 필요.
4. **좌표 정밀도:** 수도권 실재 행정동 대표 좌표를 사용하되, 동 내부 특정 지점(역·관공서 등)의 정확한 좌표와는 오차가 있을 수 있음 — UI 지도 렌더링 시각적 검증에는 충분.
