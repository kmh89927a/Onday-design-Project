---
name: Feature Task
title: "[Feature] CMD-DL-001: 데드라인 모드 활성화 (createDiagnosis(deadline_mode=true) + 계약 역산 타임라인 ≥5단계)"
labels: ['feature', 'priority:H', 'epic:Deadline', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DL-001] 데드라인 모드 활성화 — activateDeadlineMode Server Action
- **목적:** 이사 마감일 입력 시 deadlineMode 활성화 + 계약 역산 타임라인(≥5단계) 자동 생성. 긴급 이사자(C-03) 핵심 기능.
- **범위:**
  - ✅ `activateDeadlineMode` Server Action ('use server'), D+7 이상 검증, 역산 타임라인 ≥5단계 생성, Diagnosis.deadlineMode=true 업데이트, API-002 TimelineDTO/TimelineStepDTO 타입 사용
  - ❌ 매물 조회(QRY-DL-001), UI(UI-009), 결제, NextAuth.js
- **복잡도:** H | **Wave:** 4 (Deadline 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용

- **REQ-FUNC-015** (§4.1.3): "시스템은 사용자가 이사 마감일(D-day)을 입력하고 '데드라인 모드'를 활성화할 수 있는 인터페이스를 제공해야 한다. 활성화 시 계약 역산 타임라인(서류 준비·잔금 일정 등 5단계 이상)을 2초 이내에 자동 생성해야 한다."
- **REQ-FUNC-020** (§4.1.3): "시스템은 사용자가 이사 마감일을 과거 날짜로 입력한 경우, 달력 UI에서 과거 날짜 선택을 차단하고 '마감일은 오늘 이후여야 합니다' 인라인 에러를 100ms 이내에 표시해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" — 변형: 타임라인 생성 ≤2초
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.3)

- **참여 Actor:** 긴급 이사자(C-03), Next.js Client, Server Action, Prisma ORM
- **핵심:**
  1. `User→Web: 이사 마감일 입력`
  2. `Web→SA: createDiagnosis(deadline_mode=true, deadline_date)`
  3. `SA→SA: 계약 역산 타임라인 생성 (≥5단계)`
  4. `SA→Prisma: Diagnosis update (deadlineMode=true)`
  5. `SA→Web: 타임라인 응답 (≤2초)`

### 선행 태스크 산출물

| Task ID | 산출물 | import 경로 | 사용처 |
|---|---|---|---|
| DB-003 | `model Diagnosis` (deadline, deadlineMode 컬럼) | `@prisma/client` | DB 업데이트 대상 |
| API-002 | `TimelineDTO`, `TimelineStepDTO`, `DiagnosisErrorCode` | `@/lib/types/diagnosis` | 응답 타입, 에러 코드 |
| CMD-DIAG-004 | `saveDiagnosisResult` (deadlineMode=false 기본) | `@/app/actions/diagnosis` | 통합 호출 패턴 |
| CMD-AUTH-003 | `requireAuth` | `@/lib/auth/session` | 인증 검증 |
| API-006 | `createAppError`, `reportErrorToSentry` | `@/lib/helpers/app-error` | 에러 처리 |
| MOCK-001 | `MOCK_TIMELINE` | `@/lib/mocks/diagnosis` | 테스트 기대값 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/types/diagnosis.ts`에 `DEADLINE_TOO_SOON` 에러 코드 추가
  ```typescript
  export enum DiagnosisErrorCode {
    // ... 기존
    DEADLINE_TOO_SOON = 'DIAG_DEADLINE_TOO_SOON',
  }
  ```

- [ ] **3.2** `app/actions/deadline.ts`에 `activateDeadlineMode` Server Action 구현
  ```typescript
  'use server';
  import { prisma } from '@/lib/prisma';
  import { requireAuth } from '@/lib/auth/session';
  import { createAppError, reportErrorToSentry } from '@/lib/helpers/app-error';
  import { DiagnosisErrorCode } from '@/lib/types/diagnosis';
  import type { TimelineDTO } from '@/lib/types/diagnosis';
  import { z } from 'zod';

  const MIN_DEADLINE_DAYS = 7;

  const activateDeadlineSchema = z.object({
    diagnosisId: z.string().min(1),
    deadlineDate: z.string().datetime(),
  });

  export async function activateDeadlineMode(
    input: { diagnosisId: string; deadlineDate: string }
  ): Promise<TimelineDTO> {
    const currentUser = await requireAuth();
    const parsed = activateDeadlineSchema.parse(input);

    // 1. D+7 이상 검증
    const deadline = new Date(parsed.deadlineDate);
    const minDate = new Date(Date.now() + MIN_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
    if (deadline < minDate) {
      throw createAppError(DiagnosisErrorCode.DEADLINE_TOO_SOON,
        `마감일은 최소 ${MIN_DEADLINE_DAYS}일 후여야 합니다`);
    }

    // 2. 진단 소유자 검증
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: parsed.diagnosisId },
    });
    if (!diagnosis) throw createAppError(DiagnosisErrorCode.DIAGNOSIS_NOT_FOUND);
    if (diagnosis.userId !== currentUser.user.id) {
      throw createAppError(DiagnosisErrorCode.DIAGNOSIS_FORBIDDEN);
    }

    try {
      // 3. 역산 타임라인 생성 (≥5단계)
      const steps = generateReverseTimeline(parsed.deadlineDate);

      // 4. Diagnosis 업데이트
      await prisma.diagnosis.update({
        where: { id: parsed.diagnosisId },
        data: { deadlineMode: true, deadline: deadline },
      });

      return { steps, deadlineDate: parsed.deadlineDate };
    } catch (error) {
      reportErrorToSentry(error instanceof Error ? error : new Error('Deadline activation failed'));
      throw error;
    }
  }
  ```

- [ ] **3.3** `lib/deadline/timeline-generator.ts`에 역산 타임라인 생성 함수
  ```typescript
  import type { TimelineStepDTO } from '@/lib/types/diagnosis';

  /**
   * 마감일 기준 역산 타임라인 생성 (≥5단계)
   * REQ-FUNC-015: 서류 준비·잔금 일정 등 5단계 이상
   */
  export function generateReverseTimeline(deadlineDateStr: string): TimelineStepDTO[] {
    const deadline = new Date(deadlineDateStr);
    return [
      { order: 1, title: '매물 탐색 완료', description: '후보 동네에서 매물을 탐색합니다', dueDate: addDays(deadline, -30).toISOString(), completed: false },
      { order: 2, title: '집 방문 및 임장', description: '후보 매물을 직접 방문하여 확인합니다', dueDate: addDays(deadline, -22).toISOString(), completed: false },
      { order: 3, title: '계약 협상', description: '가격 및 조건을 협상합니다', dueDate: addDays(deadline, -15).toISOString(), completed: false },
      { order: 4, title: '계약서 작성', description: '계약서를 작성하고 서명합니다', dueDate: addDays(deadline, -8).toISOString(), completed: false },
      { order: 5, title: '잔금 및 입주', description: '잔금을 지불하고 입주합니다', dueDate: deadline.toISOString(), completed: false },
    ];
  }

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  ```

- [ ] **3.4** `lib/validators/deadline.ts`에 Zod 스키마 정의
  ```typescript
  import { z } from 'zod';
  export const activateDeadlineSchema = z.object({
    diagnosisId: z.string().min(1, '진단 ID가 필요합니다'),
    deadlineDate: z.string().datetime('유효한 날짜 형식이 아닙니다'),
  });
  ```

- [ ] **3.5** `lib/constants/deadline-errors.ts`에 에러 메시지 매핑
  ```typescript
  export const DEADLINE_ERROR_MAP = {
    DIAG_DEADLINE_TOO_SOON: '마감일은 최소 7일 후여야 합니다.',
  };
  ```

- [ ] **3.6** Mock 데이터 분기 (`NEXT_PUBLIC_USE_MOCK`)
  ```typescript
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    const { MOCK_TIMELINE } = await import('@/lib/mocks/diagnosis');
    return MOCK_TIMELINE;
  }
  ```

- [ ] **3.7** `__tests__/actions/activate-deadline.spec.ts` — Server Action 테스트
  ```typescript
  describe('activateDeadlineMode (CMD-DL-001)', () => {
    it('D+7 이상 마감일 → 타임라인 ≥5단계 생성 성공', async () => {});
    it('D+7 미만 마감일 → DEADLINE_TOO_SOON 에러', async () => {});
    it('타임라인 단계 순서 정확 (order 1~5)', async () => {});
    it('Diagnosis.deadlineMode = true 업데이트', async () => {});
    it('진단 소유자 아닌 사용자 → FORBIDDEN', async () => {});
    it('에러 시 Sentry 호출', async () => {});
  });
  ```

- [ ] **3.8** `__tests__/deadline/timeline-generator.spec.ts` — 타임라인 생성 테스트
  ```typescript
  describe('generateReverseTimeline', () => {
    it('≥5단계 생성', () => {});
    it('각 단계 dueDate가 마감일 이전 역순', () => {});
    it('마지막 단계 dueDate === 마감일', () => {});
    it('모든 단계 completed === false', () => {});
  });
  ```

- [ ] **3.9** 'use server' 지시어 확인: `head -1 app/actions/deadline.ts`

- [ ] **3.10** API-002 TimelineDTO/TimelineStepDTO 정합성 검증
  ```typescript
  // TimelineDTO: { steps: TimelineStepDTO[], deadlineDate: string }
  // TimelineStepDTO: { order, title, description, dueDate, completed }
  ```

- [ ] **3.11** 응답시간 ≤2초 검증 (단순 산술 연산 + Prisma update)

- [ ] **3.12** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES" app/actions/deadline.ts` → 0건

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** D+7 이상 마감일 → 타임라인 ≥5단계 생성
- **Given** 인증 사용자 + deadlineDate = 오늘 + 30일
- **When** `activateDeadlineMode({ diagnosisId, deadlineDate })` 호출
- **Then** `TimelineDTO` 반환, `steps.length >= 5`, 각 step에 order/title/dueDate/completed 포함

**AC-2 (예외):** D+7 미만 → DEADLINE_TOO_SOON 에러
- **Given** deadlineDate = 오늘 + 3일 (< D+7)
- **When** `activateDeadlineMode()` 호출
- **Then** `DiagnosisErrorCode.DEADLINE_TOO_SOON` 에러, DB 변경 0건

**AC-3 (경계):** D+7 정확히 → 성공
- **Given** deadlineDate = 오늘 + 7일 (경계값)
- **When** `activateDeadlineMode()` 호출
- **Then** 정상 성공, 타임라인 생성

**AC-4 (정상):** Diagnosis.deadlineMode = true 업데이트
- **Given** 기존 Diagnosis (deadlineMode=false)
- **When** `activateDeadlineMode()` 성공
- **Then** DB에서 `Diagnosis.deadlineMode === true`, `Diagnosis.deadline === deadlineDate`

**AC-5 (성능):** 응답 ≤2초
- **Given** 유효한 입력
- **When** `activateDeadlineMode()` 호출
- **Then** 전체 응답 ≤2초 (산술 연산 + Prisma update)

**AC-6 (예외):** 진단 소유자 아닌 사용자 → FORBIDDEN
- **Given** 사용자B가 사용자A의 진단에 대해 호출
- **When** `activateDeadlineMode()` 호출
- **Then** `DIAGNOSIS_FORBIDDEN` 에러

---

## 5. ⚙️ Non-Functional Constraints

| NFR ID | 인용 | 검증 |
|---|---|---|
| REQ-NF-001 변형 | 타임라인 생성 ≤2초 | 산술 연산 + Prisma update 단독 측정. k6 부하 테스트 |
| REQ-NF-035 | Sentry 기본 알림 | catch 블록 reportErrorToSentry 호출 |

---

## 6. 📦 Deliverables

- `app/actions/deadline.ts` (activateDeadlineMode Server Action — 'use server')
- `lib/deadline/timeline-generator.ts` (generateReverseTimeline 함수)
- `lib/validators/deadline.ts` (Zod 스키마)
- `lib/constants/deadline-errors.ts` (에러 메시지)
- `__tests__/actions/activate-deadline.spec.ts` (6개)
- `__tests__/deadline/timeline-generator.spec.ts` (4개)

---

## 7. 🔗 Dependencies

### 선행:
- **DB-003 ✅:** Diagnosis 모델 (deadline, deadlineMode 컬럼)
- **CMD-DIAG-004 ✅:** saveDiagnosisResult (진단 ID 생성)
- **API-002 ✅:** TimelineDTO, TimelineStepDTO, DiagnosisErrorCode
- **CMD-AUTH-003 ✅:** requireAuth

### 후행:
- **QRY-DL-001 (같은 배치):** 교집합 매물 조회 — deadlineMode 활성화 후
- **UI-009:** 데드라인 모드 입력 화면 UI unblock
- **TEST-005:** 데드라인 모드 GWT 시나리오

---

## 8. 🧪 Test Plan

- **단위 테스트:** `activate-deadline.spec.ts` 6개 + `timeline-generator.spec.ts` 4개
- **성능:** k6 측정 p95 ≤2초
- **정적 검증:** `grep -ri "NextAuth\|payment\|AES" app/actions/deadline.ts` → 0건
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint

---

## 9. 🚧 Open Questions / Risks

1. **CMD-DIAG-004 ↔ CMD-DL-001 통합 호출 패턴:** `saveDiagnosisResult` → `activateDeadlineMode` 순차 호출 또는 wrapper 함수 필요 여부 검토.
2. **타임라인 단계 커스터마이징:** SRS는 ≥5단계만 명시. 대출 신청(D-12), 등기 이전(D-3) 등 추가 단계는 SRS 명시 시 추가.
3. **D+7 최소값 근거:** SRS REQ-FUNC-020은 "과거 날짜 차단"만 명시. D+7은 실무적 최소 계약 기간 기준. SRS에 명시적 최소 기간이 없으므로 Open Question.
