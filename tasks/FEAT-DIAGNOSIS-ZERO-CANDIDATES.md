---
name: Feature Task
title: "[Feature] FEAT-DIAGNOSIS-ZERO-CANDIDATES: 진단 0곳 안내 + 조건 완화 제안 클릭 → 자동 반영 + 재계산 (★ Phase A 사전 박힘 80% + AC-4 본 ISSUE 진짜 본질)"
labels: ['feature', 'priority:must', 'type:feat', 'area:diagnosis', 'track:diagnosis-be', 'wave:3', 'complexity:m']
assignees: []
status: v1.4 audit 신설 (★ Phase A 사전 박힘 발견 → 본 ISSUE 본질 재정의)
---

## 0. 🔄 v1.4 audit 시점 Phase A 사전 박힘 정직 인정 (★★★ ㊦ 5번째 Mismatch 영역 진화)

### v1.4 audit 한계 정직 인정

| 시점 | 인지 상태 | 실제 |
|---|---|---|
| v1.4 audit (2026-05-27) | "v1.3까지는 TEST-001 AC-N3 검증 시나리오만 존재 (구현 task 0)" → 신설 결정 | **사전 박힘 80% (EmptyState + 안내 + 정적 제안 2 + 백엔드 동적 suggestions)** |
| 본 ISSUE Phase A (2026-05-27) | grep 검증으로 사전 박힘 발견 | **AC-1~3 박힘, AC-4 미박힘 = 본 ISSUE 진짜 본질** |

**㊦ Phase A 사전 박힘 발견 정수 (5번째 Mismatch 영역 진화)** — v1.4 audit 의 Phase B #6 "AC 측정 가능성 ✅ 0" 결론이 **코드 영역 점검 누락** 이었음을 정직 인정. audit 한계 = grep 기반 + SSoT vs 코드 분리 원칙의 자연 trade-off.

### 사전 박힘 인정 80% 표

| AC | 박힘 위치 | 박힘률 |
|---|---|---|
| AC-1 (1초 이내) | `result-view.tsx:120` `showEmpty` 분기 즉시 렌더 | ✅ 박힘 (정적 검증 X, 실 측정 Phase D) |
| AC-2 (안내 문구) | `result-view.tsx:151` + `single-result-view.tsx:257` | ✅ 박힘 |
| AC-3 (완화 제안 ≥2개) | `result-view.tsx:154-155` 정적 2 + `intersection.ts:130/133` 동적 +15/+30분 | ✅ 박힘 (정적 + 동적) |
| AC-4 (클릭 → input 반영 + 재계산) | ❌ **미박힘** — "진단 다시 입력" 버튼 = `/diagnosis` 페이지 이동만 | ❌ **본 ISSUE 진짜 본질** |

### 본 ISSUE 진짜 본질 (재정의)

1. **백엔드 ↔ 프론트 suggestions 연결** — `intersection.ts` suggestions 가 result-view EmptyState 에 노출 X = 본 ISSUE 핵심
2. **mock-calculator suggestions 누락 박힘 (㊡)** — runMockDiagnosis 반환 타입에 suggestions 영역 X
3. **EmptyState 위치 구조 박힘 (㊣)** — result-view inner function → setFilters/runMockDiagnosis 접근 X. 별도 컴포넌트 분리 + props injection 필요
4. **budget 백엔드 누락 박힘 (㊡ 2)** — intersection.ts suggestions 에 budget 분기 X. AC-3 "예산 +5천만원" 충족하려면 백엔드부터 박힘 필요
5. **what-if 답습 패턴 정수** — handleTimeWhatIf/CommuteWhatIf/BudgetWhatIf (#111/#118/#120/#112) → SuggestionButton 같은 패턴 답습

---

## 1. 🎯 Summary

- **기능명:** [FEAT-DIAGNOSIS-ZERO-CANDIDATES] 진단 교집합 0곳 안내 + 조건 완화 제안 클릭 → 자동 반영 + 재계산
- **목적:**
  - **비즈니스:** REQ-FUNC-008 의 본질 = 0곳 상황에서 사용자가 다음 행동을 알 수 있게 가이드. 사전 박힘 80% 위에 AC-4 박힘 = 사용자 이탈 방지 + 자가 학습 흐름.
  - **사용자 가치:** "최대 통근 시간 +15분 적용" 같은 명시적 버튼 클릭 → 즉시 재계산 = what-if 패턴 일관성 (4 chip + EmptyState)
- **범위 (What):**
  - ✅ 만드는 것 (5종):
    - `lib/diagnosis/generate-suggestions.ts` — 백엔드 공통 suggestions 생성 헬퍼 (intersection + mock-calculator 양쪽 호출)
    - `lib/types/diagnosis.ts` — `RelaxationSuggestion` 타입 신설 (`{ label: string; apply: Partial<DiagnosisFilters> }`)
    - `features/diagnosis/mock-calculator.ts` — `runMockDiagnosis` 반환에 suggestions 포함 (budget 분기 추가)
    - `lib/diagnosis/intersection.ts` — budget 완화 suggestion 추가 박힘
    - `components/diagnosis/empty-state.tsx` (신설) + SuggestionButton — props injection 가능
    - `app/diagnosis/result/[id]/result-content.tsx` — handleRelaxationSuggestion handler 박힘 + EmptyState 전달
    - `app/diagnosis/result/[id]/result-view.tsx` — EmptyState inner function 폐기, props 전달 형태로 변경
  - ❌ 만들지 않는 것:
    - `single-result-view.tsx` 의 EmptyState 영역 (★ ㊥ follow-up — 본 ISSUE 영역 외, 별도 ISSUE 또는 후속 작업)
    - 신규 안내 메시지 (이미 박힘)
    - 새 컴포넌트 위치 (EmptyState 만 분리, ZeroCandidatesCard 같은 별개 컴포넌트 X)
- **복잡도:** M
- **Priority:** Must

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (v1.7)

- **REQ-FUNC-008** (§4.1.1): "시스템은 두 직장 간 거리로 인해 교집합 후보가 0곳인 경우 '조건을 만족하는 동네가 없습니다. 최대 통근 시간을 늘려보세요' 안내를 1초 이내에 표시하고, 조건 완화 제안을 2개 이상 제공해야 한다."
  - *v1.7 메타: TASK_LIST 매핑 = FEAT-DIAGNOSIS-ZERO-CANDIDATES 신설*
- **Story 3-1, AC-N3**: 교집합 0곳 시 완화 제안

### 본 프로젝트 답습 정수 인용

- **#111 (FEAT-RESULT-WHAT-IF-SIMULATION)**: β 확장 정수 — chip preview → 자유 input + 진짜 재계산
- **#118 (FIX-WHAT-IF-CONFIRM-BUTTON)**: 변경 버튼 + 명시적 확인 (React 19 set-state-in-effect 답습)
- **#120 (FEAT-DETAIL-SHEET-WHAT-IF)**: 양방향 동기화 (위 input ↔ 아래 chip)
- **#112 (FEAT-DIAGNOSIS-INPUT-FILTERS)**: 4 chip 다 what-if 일관성 정점
- 본 ISSUE = **5번째 what-if 답습 영역** = EmptyState SuggestionButton

### 선행 task 산출물

| 선행 Task | 산출물 | 사용처 |
|---|---|---|
| CMD-DIAG-002 ✅ | `runMockDiagnosis` (mock-calculator.ts:195), `calculateIntersection` (intersection.ts:57) | 본 작업 = suggestions 영역 확장 |
| #111/#118/#120/#112 ✅ (모두 머지) | what-if handler 3종 (handleTimeWhatIf/CommuteWhatIf/BudgetWhatIf) | 본 작업 답습 패턴 |
| useDiagnosisStore | setFilters/setResult/coordinateA/B/mode/leisureCoordA/B | EmptyState handler 의존 |

---

## 3. 🛠️ Task Breakdown

- [ ] **3.1** `lib/types/diagnosis.ts` — `RelaxationSuggestion` 타입 신설
  ```typescript
  export interface RelaxationSuggestion {
    label: string;          // "최대 통근 시간을 45분으로 늘려보세요"
    apply: Partial<DiagnosisFilters>;  // { maxCommuteTime: 45 } 또는 { budget: { min, max } }
  }
  ```

- [ ] **3.2** `lib/diagnosis/generate-suggestions.ts` 신설 — 공통 헬퍼
  ```typescript
  export function generateRelaxationSuggestions(
    filters: DiagnosisFilters
  ): RelaxationSuggestion[] {
    const suggestions: RelaxationSuggestion[] = [];
    // maxCommuteTime 완화
    if (filters.maxCommuteTime && filters.maxCommuteTime < 60) {
      suggestions.push({
        label: `최대 통근 시간을 ${filters.maxCommuteTime + 15}분으로 늘려보세요`,
        apply: { maxCommuteTime: filters.maxCommuteTime + 15 },
      });
    }
    if (filters.maxCommuteTime && filters.maxCommuteTime < 90) {
      suggestions.push({
        label: `최대 통근 시간을 ${filters.maxCommuteTime + 30}분으로 늘려보세요`,
        apply: { maxCommuteTime: filters.maxCommuteTime + 30 },
      });
    }
    // budget 완화 (★ Q3 결정 — 본 ISSUE Phase A 사전 박힘 발견 2번째)
    const FIVE_K_MAN = 50_000_000;  // 5천만원
    if (filters.budget?.max && filters.budget.max < 1_500_000_000) {
      const newMax = filters.budget.max + FIVE_K_MAN;
      suggestions.push({
        label: `예산 최대를 ${(newMax / 100_000_000).toFixed(1)}억원으로 늘려보세요`,
        apply: { budget: { min: filters.budget.min, max: newMax } },
      });
    }
    return suggestions;
  }
  ```

- [ ] **3.3** `features/diagnosis/mock-calculator.ts` — `runMockDiagnosis` 반환 타입 확장 (★ ㊡ Phase B 발견)
  ```typescript
  export interface MockDiagnosisResult {
    candidates: CandidateArea[];
    suggestions: RelaxationSuggestion[];
  }
  
  export async function runMockDiagnosis(
    coordA, coordB, filters, mode, leisureCoordA, leisureCoordB,
  ): Promise<MockDiagnosisResult> {
    // ... 기존 로직 ...
    const candidates = sorted.slice(0, 8);
    const suggestions = candidates.length === 0
      ? generateRelaxationSuggestions(filters)
      : [];
    return { candidates, suggestions };
  }
  ```
  - ★ **이 시그니처 변경은 모든 호출처 영향**: `api/diagnosis/route.ts` + `result-content.tsx` (3 handler) + 본 작업 신규 호출 → 전 영역 갱신 필요 (Phase D 검증 영역)

- [ ] **3.4** `lib/diagnosis/intersection.ts` — budget 분기 추가 박힘 (★ Q3)
  ```typescript
  // line 126-138 기존 영역
  if (candidates.length === 0) {
    suggestions.push(...generateRelaxationSuggestions(filters).map(s => s.label));
    // 또는 IntersectionResult 의 suggestions 타입을 RelaxationSuggestion[] 로 변경
  }
  ```

- [ ] **3.5** `components/diagnosis/empty-state.tsx` 신설 — 분리 컴포넌트 (★ ㊣ Phase B 발견)
  ```typescript
  interface EmptyStateProps {
    suggestions: RelaxationSuggestion[];
    onApply: (apply: Partial<DiagnosisFilters>) => void;
  }
  
  export function EmptyState({ suggestions, onApply }: EmptyStateProps) {
    return (
      <div className="rounded-lg border border-card-border bg-bg p-s-6 text-center">
        <p className="text-body font-bold text-ink">
          조건을 만족하는 동네가 없습니다
        </p>
        {suggestions.length > 0 ? (
          <ul className="mt-s-3 space-y-s-2">
            {suggestions.map((s, i) => (
              <li key={`${s.label}-${i}`}>
                <Button
                  variant="outline"
                  onClick={() => onApply(s.apply)}
                  className="w-full justify-start text-body-sm"
                >
                  {s.label}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-s-3 space-y-1 text-body-sm text-ink-3">
            <li>· 최대 통근 시간을 늘려보세요</li>
            <li>· 예산 범위를 조정해보세요</li>
          </ul>
        )}
        <Link href="/diagnosis" className="mt-s-4 inline-block">
          <Button variant="outline" leading={<ChevronLeft />}>
            진단 다시 입력
          </Button>
        </Link>
      </div>
    );
  }
  ```

- [ ] **3.6** `app/diagnosis/result/[id]/result-content.tsx` — handleRelaxationSuggestion 박힘
  ```typescript
  const handleRelaxationSuggestion = async (apply: Partial<DiagnosisFilters>) => {
    if (!coordinateA) {
      pushToast({ variant: "default", message: "페이지 새로고침 후 다시 시도해주세요" });
      return;
    }
    const newFilters = { ...filters, ...apply };
    setFilters(newFilters);
    try {
      const { candidates: next } = await runMockDiagnosis(
        coordinateA, coordinateB, newFilters, mode, leisureCoordA, leisureCoordB,
      );
      if (diagnosisId) setResult(diagnosisId, next);
      pushToast({ variant: "ok", message: "조건을 완화해서 다시 계산했어요" });
    } catch {
      pushToast({ variant: "danger", message: "재계산에 실패했습니다" });
    }
  };
  ```

- [ ] **3.7** `app/diagnosis/result/[id]/result-view.tsx` — EmptyState inner 폐기, 분리 컴포넌트 + props 전달
  - showEmpty 분기에서 ResultContent 로 suggestions + handler 전달
  - 또는 EmptyState 를 result-content.tsx 안에서 렌더 (★ candidates 0 시 result-content 가 EmptyState 자체 렌더)

- [ ] **3.8** `api/diagnosis/route.ts` — runMockDiagnosis 반환 시그니처 변경에 따른 갱신
  - 응답에 suggestions 필드 추가
  - DiagnosisResponseDTO 갱신

- [ ] **3.9** mock 시나리오 활용 — `scenarios.ts` 의 빈 결과 시나리오 (line 62 REQ-FUNC-008 base)로 검증

- [ ] **3.10** AC-1 (1초 이내) — useTransition 또는 React.startTransition 검토 (★ Phase B 한계 § — 실제 측정은 Phase D Vercel 시각 검증)

---

## 4. ✅ Acceptance Criteria

**AC-1 (성능):** 0곳 안내 ≤1초 표시
- **Given** 사용자 진단 결과 candidates.length === 0
- **When** 결과 페이지 도달
- **Then** EmptyState 안내 ≤1초 표시 (Vercel 시각 검증 — Phase B 한계 § 답습)

**AC-2 (정확성):** 안내 문구 박힘 (사전 박힘 ✅)
- **Then** "조건을 만족하는 동네가 없습니다" 메시지 표시

**AC-3 (정확성):** 완화 제안 ≥2개 (백엔드 동적 + 정적 fallback)
- **Given** filters.maxCommuteTime = 30
- **When** EmptyState 렌더
- **Then** "최대 통근 시간을 45분으로 늘려보세요" + "최대 통근 시간을 60분으로 늘려보세요" + (budget 박혀있으면) "예산 최대를 X억원으로 늘려보세요" 표시

**AC-4 (UX):** 제안 클릭 → input 자동 반영 + 재계산 (★ 본 ISSUE 진짜 본질)
- **Given** EmptyState 의 SuggestionButton 표시
- **When** "최대 통근 시간을 45분으로 늘려보세요" 클릭
- **Then** `useDiagnosisStore.setFilters({maxCommuteTime: 45})` + `runMockDiagnosis` 재계산 + 결과 페이지 갱신 + Toast "조건을 완화해서 다시 계산했어요"

**AC-5 (UX 일관성):** what-if 답습 패턴 정합 (#111/#118/#120/#112)
- **Then** 다른 what-if 영역(출근시간 chip, maxCommuteTime chip, budget chip)과 동일한 패턴 (setFilters + runMockDiagnosis + setResult + Toast)

---

## 5. ⚙️ Non-Functional Constraints

| NFR ID | SRS 본문 인용 | 검증 방법 |
|---|---|---|
| REQ-FUNC-008 | "1초 이내 표시" (§4.1.1) | Vercel 시각 검증 (Phase B 한계 § 답습) |
| REQ-NF-035 | "에러 로그 알림 — Sentry" (§4.2.6) | runMockDiagnosis 실패 시 Sentry 추적 |

---

## 6. 📦 Deliverables

- `lib/types/diagnosis.ts` (수정) — `RelaxationSuggestion` 타입 추가
- `lib/diagnosis/generate-suggestions.ts` (신설) — 공통 헬퍼
- `lib/diagnosis/intersection.ts` (수정) — budget 분기 추가
- `features/diagnosis/mock-calculator.ts` (수정) — 반환 타입 `MockDiagnosisResult`
- `components/diagnosis/empty-state.tsx` (신설) — 분리 컴포넌트
- `app/diagnosis/result/[id]/result-content.tsx` (수정) — handleRelaxationSuggestion + EmptyState 통합
- `app/diagnosis/result/[id]/result-view.tsx` (수정) — EmptyState inner 폐기
- `app/api/diagnosis/route.ts` (수정) — 응답에 suggestions 포함

---

## 7. 🔗 Dependencies

### 선행
- CMD-DIAG-002 ✅, #111/#118/#120/#112 ✅ (모두 머지)

### 후행
- **single-result-view.tsx EmptyState 영역** (㊥ follow-up) — 본 ISSUE 영역 외, 별도 후속 작업 (Single mode 답습 답습)

---

## 8. 🧪 Test Plan

### 정적 검증
- `grep -rn "RelaxationSuggestion" onday-app/src/` → 신규 타입 일관성 확인
- `grep -n "runMockDiagnosis" onday-app/src/` → 호출처 모두 새 시그니처 정합 확인

### 시나리오 검증 (Phase D — Vercel)
- 진단 input: 강남역(A) + 부산역(B) → 0곳 발생 시나리오
- 또는 maxCommuteTime = 10분 (불가능 수준) → 0곳
- EmptyState 표시 확인 → SuggestionButton 클릭 → input 자동 반영 + 재계산 → candidates 표시

### AC-1 1초 이내 측정 — Phase B 한계 § 답습
- 정적 분석 X, Vercel 시각 검증 필요
- ★ 본 ISSUE Phase B 한계 § 10번째 ISSUE 누적 학습 정점

---

## 9. 🚧 Open Questions / Risks

1. **EmptyState 위치 결정** — result-view inner vs result-content 안 vs 별도 컴포넌트:
   - 본 작업 = **별도 컴포넌트 분리 + result-content 안에서 렌더** (★ ㊣ Phase B 발견 정합)
2. **runMockDiagnosis 시그니처 변경 영향 범위:**
   - 호출처 7행 (api/route + result-content 3 + mock-calculator export) → Phase D 검증 영역
3. **single 모드 EmptyState (㊥):** 본 ISSUE 영역 외 follow-up
4. **AC-1 1초 측정:** Phase B 한계 § 답습 — Vercel 시각 검증 필요

---

## 10. 📌 본 ISSUE Phase A 사전 박힘 발견 정수 정점

본 ISSUE 자체가 **v1.4 audit 한계 정직 인정** 의 정수 정점이다. 미래 작업자가 본 §0 + Phase B 결과를 읽고 학습할 영역:

1. **audit 한계 정직 인정** — grep 기반 audit 는 코드 영역 점검 불가. SSoT vs 코드 분리 원칙의 trade-off.
2. **㊠ Phase A 사전 박힘 발견 정수** — 코드 작업 진입 직전 grep 검증으로 80% 사전 박힘 발견 = Phase A 정수.
3. **㊡ Phase B 추가 발견 답습** — mock-calculator suggestions 누락 + EmptyState 위치 구조 박힘 = 정적 grep 으로 발견 정수.
4. **㊦ Mismatch 영역 5번째 진화** — ㊠/㊡/㊣/㊤/㊥ → ㊦ "audit 한계 정직 인정 답습" NEW.
5. **what-if 답습 패턴 5번째 사례** — #111/#118/#120/#112 → 본 ISSUE EmptyState SuggestionButton = 5번째.

_본 명세 신설: 2026-05-27 (FEAT-DIAGNOSIS-ZERO-CANDIDATES Phase C). v1.4 audit Phase A 사전 박힘 80% 발견 + AC-4 본 ISSUE 진짜 본질 재정의 정수._
