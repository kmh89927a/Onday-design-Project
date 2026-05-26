# FEAT-DIAGNOSIS-INPUT-FILTERS — 진단 페이지 maxCommuteTime + budget 자유 입력 + 결과 페이지 4 chip 다 what-if 일관성

## 1. 🎯 Summary

진단 페이지 (`/diagnosis`) 에 maxCommuteTime + budget 입력칸 추가 (#106 §9.D 르르 약속 답습) + 결과 페이지 chip 클릭 시 what-if 답습 (★ #111+#118+#120 패턴 답습). 본 ISSUE 머지 시점 = 4 chip 다 what-if 일관성 도달 (★ 출근시간 + maxCommute + budget 양방향).

### ★ 본 ISSUE 메타 가치 6종

1. ★ ★ 사용자 본질 짚음 답습 정수 § (★ 르르 "다 가야돼 꼭" + "몇억 ~ 몇억" 진짜 짚음)
2. ★ ★ 4 chip 다 what-if 일관성 정점 § (★ 출근시간 + maxCommute + budget 양방향)
3. ★ ㊠ 사전 발견 정직 (★ complexity:h → m + 타입/Zod 이미 박힘)
4. ★ #111+#118+#120 패턴 답습 정수 §
5. ★ ISSUE 신설 자동화 답습 14회째 §
6. ★ 가드 30+종 8 영역 사수 §

### ★ Mismatch — ㊠ 1건 + ㊡ 1건

- ㊠ (Phase A 사전 발견): complexity:h → m (★ 타입/Zod/Calculator/mapper/util 다 이미 박힘 ✅, #98 답습)
- ㊡ (Phase A 사후 발견 즉시 해소): notifyComingSoon 사용처 0 (ESLint +1 warning) → 함수 제거 = 10 warnings 회복

### 자가 치유 누적

- #108 → #110 → #114 → #111 → #118 → #120 → **#112** = 본 세션 7 ISSUE 누적 진화 답습 정점

---

## 2. 🔗 References (Spec & Context)

### Issue #112 (본 ISSUE)

- GitHub: https://github.com/kmh89927a/Onday-design-Project/issues/112
- 신설 시점: 2026-05-25 (★ #106 §9.D 약속 답습)
- 진행 시점: 2026-05-26 (★ PR #121 머지 직후)

### ★ Q1~Q5 + Q-C/Q-D/Q-E 결정 표

| Q | 결정 | 사유 |
|---|---|---|
| Q1 | (B) 풀세트 (답습 34회째) | 패턴 답습 명세 가치 |
| Q3 | 단순 복사 (★ Q-D (D)) | wrapper 추출 X = 답습 자연 |
| Q-C | (ii) 억 단위 입력 + 내부 만원 변환 | UX 직관 (★ "3억" 자연) + formatBudgetFilter 답습 |
| Q-D | (D) wrapper 추출 X (★ 단순 복사) | 3 chip input 차이 ↑ + complexity:m 자연 |
| Q-E | "60분" + "3억" 단위 | formatBudgetFilter "X-Y억" 답습 |
| Q5 | A → B → C → D | 답습 34회째 |

### ★ ㊠/㊡ Mismatch 표

| 종류 | 시점 | 사전 案 | 실측 | 정정 |
|---|---|---|---|---|
| ㊠ Phase A 사전 | Phase A 진입 전 | complexity:h | 타입/Zod/Calculator/mapper/util 다 이미 박힘 | complexity:h → m (★ Issue 라벨 정정) |
| ㊡ Phase A 사후 | A.3 검증 | ESLint 10 warnings 사수 | 11 warnings (notifyComingSoon 사용처 0) | 함수 제거 = 10 warnings 회복 |

### ★ ★ Phase B 한계 § 7 ISSUE 누적 학습 정점 § (★ §9.5)

| ISSUE | 본질 |
|---|---|
| #108 | Phase B 자체 grill 한계 정직 § NEW |
| #110 | Phase A 사전 박힘 7회째 |
| #114 | Phase B 한계 § 진짜 본질 입증 정점 |
| #111 | β 확장 정수 정점 + 4 ISSUE 누적 |
| #118 | React 19 답습 정수 + 5 ISSUE 누적 |
| #120 | Phase A 11회 + 양방향 동기화 + 6 ISSUE 누적 |
| **#112** | ★ 4 chip 다 what-if 일관성 정점 + ㊠ 사전 발견 + ㊡ 즉시 해소 + 7 ISSUE 누적 학습 정점 |

### ★ 사용자 본질 짚음 §

- "다 가야돼 꼭" (★ 르르 진행 의지)
- "몇억 ~ 몇억" (★ budget 범위 단위 영역 진짜 짚음)
- "남은 task 영역 정확 분류 박힘?" (★ ★ 사전 분석 권고)
- #106 §9.D "예산 영역 진짜 박힘 약속" (★ 어제 누적)

### ★ #111+#118+#120 패턴 답습 정수 §

- #111 β: handleTimeWhatIf + setFilters + runMockDiagnosis client-side 재계산 + setResult
- #118 명시적 확인: pending state + 변경 버튼 + Enter 키 + isUnchanged disabled + key 재마운트
- #120 양방향: handleTimeSlotChange = handleTimeWhatIf 재사용 + currentDepartureTime 통합
- **#112**: ★ handleCommuteWhatIf + handleBudgetWhatIf 신규 + CommuteChipOptions + BudgetChipOptions 신규 = 4 chip 일관성

---

## 3. 🛠️ Task Breakdown (✅/⏸ 실측 status markers)

### §3.1 ✅ `src/app/diagnosis/result/[id]/commute-chip-options.tsx` (NEW, +71)

- ✅ props: `baseValue + onConfirm + disabled` (★ TimeChipOptions 답습)
- ✅ number input + min=10 max=120 + isValid 검증
- ✅ 변경 버튼 + Enter 키 + isUnchanged + canConfirm disabled

### §3.2 ✅ `src/app/diagnosis/result/[id]/budget-chip-options.tsx` (NEW, +99)

- ✅ props: `baseMin/baseMax + onConfirm + disabled`
- ✅ 2 input + 억 단위 + 내부 만원 변환 (× 10000)
- ✅ isValid (min > 0 && max > 0 && min ≤ max) + isUnchanged 검증
- ✅ 변경 버튼 + Enter 키 + canConfirm disabled

### §3.3 ✅ `src/app/diagnosis/page.tsx` (+84)

- ✅ 조건 section 박힘 (★ "출퇴근" + "진단 모드" 사이)
- ✅ maxCommuteTime input (★ `filters.maxCommuteTime` 직접 박힘)
- ✅ budget local state 2개 (budgetMinInput + budgetMaxInput) + syncBudget
- ✅ handleLoadLast sync 박힘 (★ "이전 조건 불러오기" 영역)

### §3.4 ✅ `src/app/diagnosis/result/[id]/result-content.tsx` (+85 / -8)

- ✅ state 2종: showCommuteOptions + showBudgetOptions
- ✅ handler 2종: handleCommuteWhatIf + handleBudgetWhatIf (★ handleTimeWhatIf 답습)
- ✅ chip onClick 정정: notifyComingSoon → setShowXxxOptions 토글
- ✅ inline 영역 박힘 (★ `<CommuteChipOptions>` + `<BudgetChipOptions>`)
- ✅ ㊡ notifyComingSoon 함수 정의 제거 (★ 사용처 0 즉시 해소)

---

## 4. ✅ Acceptance Criteria

| AC | 영역 |
|---|---|
| AC-1 | 진단 페이지 maxCommuteTime input 박힘 + 10~120 검증 |
| AC-2 | 진단 페이지 budget min/max input 박힘 + 억 단위 + min < max 검증 + 내부 만원 변환 |
| AC-3 | 결과 페이지 maxCommute chip 클릭 → input + 변경 버튼 + 재계산 |
| AC-4 | 결과 페이지 budget chip 클릭 → 2 input + 변경 버튼 + 재계산 |
| AC-5 | 4 chip 다 what-if 일관성 (★ 출근시간 + maxCommute + budget 모두 클릭 시 재계산) |
| AC-6 | 가드 30+종 8 영역 사수 (★ AC-6 grep 7행 + 컴포넌트 영향 0) |

---

## 5. ⚙️ Non-Functional Constraints (NFR)

- bundle: /diagnosis 11.3 → **11.7 kB** (+0.4 kB)
- bundle: /diagnosis/result/[id] 9.42 → **9.8 kB** (+0.38 kB)
- Middleware: 32.5 kB (★ 30회 회귀 0 정수 정점 사수)
- tsc: 0 errors
- ESLint: 0 errors, 10 warnings (★ baseline 사수 — ㊡ 즉시 해소 후)

---

## 6. 📦 Deliverables

### Phase A ✅ (4 파일 — 정정 2 + 신규 2)

- ✅ commute-chip-options.tsx (NEW, +71)
- ✅ budget-chip-options.tsx (NEW, +99)
- ✅ diagnosis/page.tsx (+84)
- ✅ result-content.tsx (+85 / -8 — ★ ㊡ notifyComingSoon 제거 박힘)

### Phase B ✅ (자체 grill 7 영역 + AC-6 grep 7행 + Phase B 한계 § 7 ISSUE 누적)

### Phase C ✅ (명세 + 로그)

- ✅ `tasks/FEAT-DIAGNOSIS-INPUT-FILTERS.md` (★ 본 파일)
- ✅ `tasks/ISSUE_REGISTER_LOG.md` (+1 § = 16건 누적)

### Phase D (★ feat+docs 커밋 분리 답습 28회째)

- ⏸ feat 커밋 (4 파일)
- ⏸ docs 커밋 (명세 + 로그)
- ⏸ draft PR + Vercel 사용자 검증

### Follow-up

- Vercel 시각 검증 = AC-1 ~ AC-5 (★ 4 chip 다 what-if 사용자 검증 필수)
- Issue #114 Tailwind 본질 (★ OPEN 유지)
- FEAT-SINGLE-RESULT-WHAT-IF (★ 신규 영역 — 다음 ISSUE)
- (★ 미래) wrapper 추출 후속 ISSUE (★ ChipOptions 공통 영역 추상화)

---

## 7. 🔗 Dependencies

### 선행 (모두 ✅)

- ✅ #111 PR #116+#117 (★ β 확장)
- ✅ #118 PR #119 (★ 변경 버튼 + Enter)
- ✅ #120 PR #121 (★ 양방향 동기화)
- ✅ #98 (★ 타입/Zod/Calculator 사전 박힘 — ㊠ 핵심 영역)

### 후행

- Vercel 시각 검증 (★ AC-1 ~ AC-5 양방향)
- Issue #114 Tailwind 본질 (★ OPEN 유지)
- FEAT-SINGLE-RESULT-WHAT-IF (★ 신규 영역 — 다음 ISSUE)
- (★ 미래) wrapper 추출 후속 ISSUE

---

## 8. 🧪 Test Plan

### Phase A ✅ — 검증 7항목

- tsc 0 errors
- ESLint 0 errors, 10 warnings (★ ㊡ 즉시 해소 후 baseline 사수)
- build 정합 통과
- /diagnosis bundle 11.7 kB (+0.4 kB)
- /diagnosis/result/[id] bundle 9.8 kB (+0.38 kB)
- Middleware 32.5 kB (★ 30회 회귀 0 정수 정점)
- 가드 30+종 8 영역 사수

### Phase B ✅ — 자체 grill 7 영역 + AC-6 grep 7행 + Phase B 한계 § 7 ISSUE 누적 학습 정점

7 영역:
1. commute-chip-options.tsx props/검증/UX ✓
2. budget-chip-options.tsx 2 input + 억/만원 변환 + min<max ✓
3. diagnosis/page.tsx 조건 section + local state + handleLoadLast sync ✓
4. result-content.tsx state/handler/chip onClick/inline 영역 + ㊡ 제거 입증 ✓
5. tsc + ESLint + build 재확인 ✓
6. 가드 30+종 8 영역 재입증 ✓
7. Phase B 한계 § 7 ISSUE 누적 학습 정점 ✓

AC-6 grep 7행: 1차 3종 (console/TODO/any) + 2차 4종 (input 박힘 + handler 박힘 + 신규 컴포넌트 박힘 + notifyComingSoon 사용처 0)

---

## 9. 📓 정직성 6 + §9.C ㊠ + §9.D ㊡ + §9.E 미래 작업자 학습 정수 3종

### §9.1 ★ 사용자 본질 짚음 답습 정수 §

- 어제: #106 §9.D "예산 영역 진짜 박힘 약속"
- 오늘 본질:
  - "남은 task 영역 정확 분류 박힘?" (★ 사전 분석 권고)
  - "다 가야돼 꼭" (★ 진행 의지)
  - "몇억 ~ 몇억" (★ budget 단위 영역 진짜 짚음)
- 답습 정수: 어제 + 오늘 누적 = 사용자 본질 짚음 답습 정수 정점

### §9.2 ★ ★ 4 chip 다 what-if 일관성 정점 §

본 ISSUE 머지 시점 = 결과 페이지 4 chip 다 what-if 답습:
- 출근시간 chip (★ #111 β + #118 변경 버튼 + #120 양방향)
- 최대 통근시간 chip (★ #112 신규)
- 예산 chip (★ #112 신규)
- 진단 모드 변경 (★ 별도 영역)

★ 본 프로젝트 자유 입력 답습 패턴 정점 = ★ ★ 사용자 어느 chip 클릭해도 자유 입력 + 변경 버튼 + 재계산 자연 답습.

### §9.3 ★ #111+#118+#120 패턴 답습 정수 §

- handleCommuteWhatIf + handleBudgetWhatIf = handleTimeWhatIf 답습 (★ setFilters + runMockDiagnosis + setResult)
- CommuteChipOptions + BudgetChipOptions = TimeChipOptions 답습 (★ pending state + 변경 버튼 + Enter 키 + isUnchanged disabled + key 재마운트)
- show*Options state = showTimeOptions 답습

### §9.4 ★ ISSUE 신설 자동화 답습 14회째 §

- #94~#118 + #111 + #120 + **#112** = 14 ISSUE 누적
- 본 ISSUE = ★ ISSUE_REGISTER_LOG 16건 § 박힘 시점

### §9.5 ★ ★ Phase B 한계 § 7 ISSUE 누적 학습 정점 §

- #108 (Phase B 자체 grill 한계 § NEW)
- #110 (Phase A 사전 박힘 7회째)
- #114 (Phase B 한계 § 진짜 본질 입증 정점)
- #111 (β 확장 정수 정점 + 4 ISSUE 누적)
- #118 (React 19 답습 정수 + ㊠ Phase A 즉시 해소 + 5 ISSUE 누적)
- #120 (Phase A 11회 + 양방향 동기화 + 6 ISSUE 누적)
- **#112** (★ ★ 4 chip 다 what-if 일관성 정점 + ㊠ 사전 발견 + ㊡ 즉시 해소 + 7 ISSUE 누적 학습 정점)

미커버 4종 (★ Phase B 자체 grill 한계):
1. 진단 페이지 input + 결과 페이지 양방향 흐름 진짜 입증 = Vercel 사용자 검증 필수
2. budget 억/만원 변환 사용자 입력 + 표시 시각 입증
3. 4 chip 다 what-if 일관성 시각 입증
4. 모바일/태블릿 number input 시각 정합

### §9.6 ★ 가드 30+종 8 영역 사수 §

- AC-6 grep 7행 통과 (1차 3종 + 2차 4종)
- 컴포넌트 영향 0: TimeChipOptions + TimeSlotSelector + DetailSheet + single-result-view.tsx + dev/page.tsx

### ★ ★ §9.C ㊠ Mismatch 정직 인정 § (★ Phase A 사전 발견)

- 사전 案: complexity:h (UI + DTO + Zod + mapper + 백엔드 + Mock 통합)
- 실측 (2026-05-26 사전 분석):
  - 타입 (`lib/types.ts:46-47`): `maxCommuteTime?: number` + `budget?: { min, max }` ✅
  - Zod (`validators/diagnosis.ts:18-19`): min(10).max(120).optional() + budget object ✅
  - mock-calculator (`mock-calculator.ts:45,124`): budget 페널티 + maxCommuteTime 제외 ✅
  - result-utils: `formatBudgetFilter` + `formatCommuteFilter` ✅
- 정직 명문화: 본질 = UI 입력만 추가 + 결과 페이지 what-if 답습 = **M** (★ Issue 라벨 정정 박힘)

### ★ §9.D ㊡ Mismatch 정직 인정 § (★ Phase A 사후 발견 즉시 해소)

- 사전 案: ESLint baseline 10 warnings 사수
- 실측 (A.3 검증 시점): ESLint 11 warnings 발생 (★ `notifyComingSoon` 사용처 0 자연 발생)
- 정정: 함수 제거 = ESLint 10 warnings 회복
- ★ Phase A 사전 박힘 진화 답습 12회 시도 + ㊡ 즉시 해소 = 답습 정수 진화

### ★ §9.E 미래 작업자 학습 정수 3종

1. **Issue 본문 complexity 사전 案 vs 실측 정합 사전 짚음 정수** = Phase A 진입 전 타입/Zod/Calculator 영역 사전 분석 박힘 = complexity 정직 재평가 자연 도달.
2. **사용처 0 ESLint warning = 함수 제거 답습 자연** = ESLint baseline 사수 답습 정수 = ㊡ 즉시 해소.
3. **자유 입력 답습 패턴 = 본 프로젝트 진짜 정수 정점** = #111 β → #118 명시적 확인 → #120 양방향 → #112 4 chip 일관성 = 7 ISSUE 누적 진화 정점.
