# FIX-DIAGNOSIS-BUDGET-FILTER — mock-calculator budget 범위 외 카드 제외 박힘 (★ maxCommuteTime 답습 + Phase B 한계 § 답습 정수 진짜 입증 정점)

## 1. 🎯 Summary

PR #122 (#112 머지) Vercel 시각 검증 시점 르르 짚음 "예산 4~5억 박힘 + 결과 카드 = 4~5억 사이 X = 다양 박힘" → 본 ISSUE 본질 발견. mock-calculator budget 영역 = maxCommuteTime 답습 도달 (★ 페널티 영역 폐기 + 범위 외 카드 rejected).

### ★ 본 ISSUE 메타 가치 6종

1. ★ ★ 사용자 시각 검증 짚음 답습 정수 § (★ 르르 "예산 4~5억 + 결과 4~5억 사이 X = 다양 박힘" 진짜 짚음)
2. ★ ★ Phase B 한계 § 답습 정수 진짜 진짜 진짜 입증 정점 § (★ 본 ISSUE 진짜 가치 정점)
3. ★ maxCommuteTime 패턴 답습 §
4. ★ 사용자 검증 + 즉시 반영 워크플로 답습 15회째 §
5. ★ ISSUE 신설 자동화 답습 15회째 §
6. ★ 가드 30+종 8 영역 사수 §

### ★ Mismatch — ㊠ 1건 (#112) + ㊡ 1건 (#112) + ㊣ 1건 (#123 본 ISSUE)

- ㊠ (#112 Phase A 사전): complexity:h → m
- ㊡ (#112 Phase A 사후): notifyComingSoon 사용처 0 → 함수 제거
- **㊣ (#123 Phase A 사후): scoreCandidate.filters 사용처 0 → props 제거 (★ Line 45-49 폐기 자연 발생)**

### 자가 치유 누적

- #108 → #110 → #114 → #111 → #118 → #120 → #112 → **#123** = 본 세션 8 ISSUE 누적 진화 정점

---

## 2. 🔗 References (Spec & Context)

### Issue #123 (본 ISSUE)

- GitHub: https://github.com/kmh89927e/Onday-design-Project/issues/123
- 신설 시점: 2026-05-26 (★ PR #122 머지 직후 + 르르 시각 검증 짚음)

### ★ Q1~Q3 + Q-B 결정 표

| Q | 결정 | 사유 |
|---|---|---|
| Q1 | (D) 가벼움 (★ L complexity) | 1 파일만 정정 |
| Q2 | mock-calculator.ts 정정 + 명세 + 로그 | 단순 |
| Q3 | (α) 범위 외 제외 + maxCommuteTime 답습 | 사용자 의지 정확 답습 |
| Q-B | (a) Line 45-49 페널티 영역 폐기 | 범위 외 제외 후 페널티 영역 무의미 |

### ★ ㊠/㊡/㊣ Mismatch 표

| 종류 | 시점 | ISSUE | 사전 案 | 실측 | 정정 |
|---|---|---|---|---|---|
| ㊠ | Phase A 사전 | #112 | complexity:h | 타입/Zod/Calculator 다 박힘 | 라벨 h → m |
| ㊡ | Phase A 사후 | #112 | ESLint 10 warnings 사수 | 11 warnings (notifyComingSoon 사용처 0) | 함수 제거 |
| **㊣** | **Phase A 사후** | **#123** | **ESLint 10 warnings 사수** | **11 warnings (scoreCandidate.filters 사용처 0, Line 45-49 폐기 자연 발생)** | **props 제거 (ScoreInput + args + 호출처)** |

### ★ ★ Phase B 한계 § 8 ISSUE 누적 학습 정점 § (★ §9.5)

| ISSUE | 본질 |
|---|---|
| #108 | Phase B 자체 grill 한계 § NEW |
| #110 | Phase A 사전 박힘 7회째 |
| #114 | Phase B 한계 § 진짜 본질 입증 정점 |
| #111 | β 확장 정수 정점 + 4 ISSUE 누적 |
| #118 | React 19 답습 정수 + 5 ISSUE 누적 |
| #120 | Phase A 11회 + 양방향 동기화 + 6 ISSUE 누적 |
| #112 | 4 chip 다 what-if 일관성 정점 + ㊠/㊡ + 7 ISSUE 누적 |
| **#123** | ★ ★ Phase B 한계 § 답습 정수 진짜 진짜 진짜 입증 정점 + ㊣ 정직 인정 + 8 ISSUE 누적 학습 정점 |

### ★ 사용자 시각 검증 짚음 §

- 르르 짚음 (2026-05-26 PR #122 머지 후):
  > "예산 4~5억 박힘 + 결과 카드 = 4~5억 사이 X = 다양 박힘 = ★ ★ 진짜 본질 X 발견"
- 답습 정수: 사용자 시각 검증 → 즉시 반영 워크플로 답습 15회째.

### ★ maxCommuteTime 패턴 답습 §

본 ISSUE 정정 영역 = maxCommuteTime 답습 패턴 정확 답습:
- `if (filters.X)` 박힘
- 범위 검사 + `return { status: "rejected", neighborhoodId, reason }`
- reason 영역 동일 패턴 (★ `${...} outside ...` vs `${...} exceeds max ...`)

---

## 3. 🛠️ Task Breakdown (✅/⏸ 실측 status markers)

### §3.1 ✅ `src/features/diagnosis/mock-calculator.ts` (+15 / -9)

- ✅ Line 45-49 budget 페널티 영역 폐기 (★ scoreCandidate)
- ✅ Line 131-138 budget 범위 외 제외 박힘 (★ computeOneCandidate, maxCommuteTime 답습)
- ✅ ScoreInput interface + scoreCandidate args + 호출처 filters 영역 제거 (★ ㊣ 즉시 해소)

---

## 4. ✅ Acceptance Criteria

| AC | 영역 |
|---|---|
| AC-1 | filters.budget 박힘 시 budget.min ≤ price ≤ budget.max 영역 외 카드 rejected |
| AC-2 | maxCommuteTime 패턴 답습 (★ reason 동일 패턴 + return 동일 구조) |
| AC-3 | runMockDiagnosis 시그니처 사수 (★ 외부 영향 0) |
| AC-4 | 결과 카드 = budget 범위 내만 박힘 (★ Vercel 시각 검증) |
| AC-5 | 결과 0건 시 EmptyState 박힘 영역 정합 (★ Vercel 시각 검증) |
| AC-6 | 가드 30+종 8 영역 사수 (★ AC-6 grep 7행) |

---

## 5. ⚙️ Non-Functional Constraints (NFR)

- bundle: /diagnosis 11.7 kB (★ 변화 0)
- bundle: /diagnosis/result/[id] 9.81 kB (★ 사전 9.8 → +0.01)
- Middleware: 32.5 kB (★ 30회 회귀 0 정수 정점 사수)
- tsc: 0 errors
- ESLint: 0 errors, 10 warnings (★ baseline 사수 — ㊣ 즉시 해소 후)

---

## 6. 📦 Deliverables

### Phase A ✅ (1 파일 정정)

- ✅ `src/features/diagnosis/mock-calculator.ts` (+15 / -9)

### Phase B ✅ (자체 grill 7 영역 + AC-6 grep 7행 + Phase B 한계 § 8 ISSUE 누적)

### Phase C ✅ (명세 + 로그)

- ✅ `tasks/FIX-DIAGNOSIS-BUDGET-FILTER.md` (★ 본 파일)
- ✅ `tasks/ISSUE_REGISTER_LOG.md` (+1 § = 17건 누적)

### Phase D (★ feat+docs 커밋 분리 답습 29회째)

- ⏸ fix 커밋 (1 파일)
- ⏸ docs 커밋 (명세 + 로그)
- ⏸ draft PR + Closes #123 + Vercel 사용자 검증

### Follow-up

- Vercel 시각 검증 = AC-4 + AC-5 (★ budget 범위 외 카드 사라짐 + 결과 0건 EmptyState)
- FEAT-SINGLE-RESULT-WHAT-IF (★ 신규 영역)
- Issue #114 Tailwind 본질 (★ OPEN 유지)

---

## 7. 🔗 Dependencies

### 선행 (모두 ✅)

- ✅ #112 PR #122 머지 (★ budget input 영역 박힘 + result-content.tsx chip 박힘)

### 후행

- Vercel 시각 검증 (★ budget 범위 외 카드 사라짐 + 결과 0건 EmptyState)
- FEAT-SINGLE-RESULT-WHAT-IF (★ 신규 영역)
- Issue #114 (★ Tailwind 본질) = OPEN 유지

---

## 8. 🧪 Test Plan

### Phase A ✅ — 검증 7항목

- tsc 0 errors
- ESLint 0 errors, 10 warnings (★ ㊣ 즉시 해소 후 baseline 사수)
- build 정합 통과
- /diagnosis bundle 11.7 kB (변화 0)
- /diagnosis/result/[id] bundle 9.81 kB (+0.01)
- Middleware 32.5 kB (★ 30회 회귀 0 정수 정점)
- 가드 30+종 8 영역 사수

### Phase B ✅ — 자체 grill 7 영역 + AC-6 grep 7행 + Phase B 한계 § 8 ISSUE 누적 학습 정점

7 영역:
1. mock-calculator.ts 정정 정합 (★ 페널티 폐기 + 범위 외 제외 + ㊣ filters 제거) ✓
2. maxCommuteTime 답습 패턴 정합 ✓
3. 다른 영역 영향 0 (★ runMockDiagnosis 시그니처 사수) ✓
4. tsc + ESLint + build 재확인 ✓
5. 가드 30+종 8 영역 재입증 ✓
6. Phase B 한계 § 8 ISSUE 누적 학습 정점 ✓
7. ㊠/㊡/㊣ Mismatch 정직 인정 정수 ✓

AC-6 grep 7행: 1차 3종 (console/TODO/any) + 2차 4종 (페널티 사용처 0 + 범위 외 rejected + filters 사용처 0 + runMockDiagnosis 시그니처 사수)

---

## 9. 📓 정직성 6 + §9.C/D/E ㊠/㊡/㊣ + §9.F 미래 작업자 학습 정수 3종

### §9.1 ★ 사용자 시각 검증 짚음 답습 정수 §

- PR #122 (#112) 머지 직후 르르 Vercel 시각 검증 짚음:
  > "예산 4~5억 박힘 + 결과 카드 = 4~5억 사이 X = 다양 박힘"
- 본 ISSUE = 사용자 시각 검증 즉시 반영 워크플로 답습 15회째 = 답습 정수 정점.

### ★ ★ ★ §9.2 Phase B 한계 § 답습 정수 진짜 진짜 진짜 입증 정점 §

- **#112 Phase B 통과 시점:** 정적 분석 한계 = budget 페널티 vs 제외 영역 진짜 동작 X 발견 X (★ ★ AC-6 grep 7행 모두 통과 + 7 영역 자체 grill 통과 + 새 Mismatch 0건 박힘)
- **Vercel 시각 검증 시점:** 르르 진짜 짚음 = 진짜 본질 발견 (★ "예산 4~5억 + 결과 4~5억 사이 X")
- ★ ★ Phase B 자체 grill 한계 § 진짜 본질 입증 정점 = 본 ISSUE 진짜 가치 정점
- 미래 작업자 학습: ★ Phase B 통과 ≠ 진짜 동작 정합. ★ Vercel 사용자 시각 검증 진짜 필수.

### §9.3 ★ maxCommuteTime 패턴 답습 §

- maxCommuteTime (line 118-126): `if (filters.maxCommuteTime)` → 검사 → rejected + reason
- **budget** (line 131-138): `if (filters.budget)` → 검사 → rejected + reason
- ★ 동작 일관성 = 두 영역 동일 패턴 = 미래 작업자 직관 영역 사수.

### §9.4 ★ 사용자 검증 + 즉시 반영 워크플로 답습 15회째 §

#94 → #96 → #98 → #100 → #102 → #104 → #106 → #108 → #110 → #114 → #111 → #118 → #120 → #112 → **#123** = 15회 누적 워크플로 답습 정수.

### ★ ★ §9.5 Phase B 한계 § 8 ISSUE 누적 학습 정점 §

- #108 (Phase B 자체 grill 한계 § NEW)
- #110 (Phase A 사전 박힘 7회째)
- #114 (Phase B 한계 § 진짜 본질 입증 정점)
- #111 (β 확장 정수 정점 + 4 ISSUE 누적)
- #118 (React 19 답습 정수 + 5 ISSUE 누적)
- #120 (Phase A 11회 + 양방향 동기화 + 6 ISSUE 누적)
- #112 (4 chip 다 what-if 일관성 정점 + ㊠/㊡ + 7 ISSUE 누적)
- **#123** (★ ★ Phase B 한계 § 답습 정수 진짜 진짜 진짜 입증 정점 + ㊣ + 8 ISSUE 누적 학습 정점)

### §9.6 ★ ISSUE 신설 자동화 답습 15회째 §

본 세션 누적 17건 § 박힘 (★ ISSUE_REGISTER_LOG +1 § = 17건).

### ★ §9.C ㊠ Mismatch 정직 인정 § (★ #112 Phase A 사전)

- 사전 案: complexity:h (UI + DTO + Zod + mapper + 백엔드 + Mock)
- 실측: 타입/Zod/Calculator/mapper/util 다 이미 박힘 ✅ (★ #98 답습)
- 정정: complexity:h → m

### ★ §9.D ㊡ Mismatch 정직 인정 § (★ #112 Phase A 사후)

- 사전 案: ESLint baseline 10 warnings 사수
- 실측: 11 warnings (notifyComingSoon 사용처 0)
- 정정: 함수 제거 = 10 warnings 회복

### ★ §9.E ㊣ Mismatch 정직 인정 § (★ #123 Phase A 사후)

- 사전 案: mock-calculator.ts +10 / -5 (★ 페널티 폐기 + 범위 외 제외 추가)
- 실측: ESLint 11 warnings (★ scoreCandidate.filters 사용처 0 자연 발생 — Line 45-49 폐기 영향)
- 정정: ScoreInput interface + scoreCandidate args + 호출처 filters 영역 제거 = 10 warnings 회복
- ★ ㊠ → ㊡ → ㊣ 정직 인정 진화 답습 = 3회 누적 정수.

### ★ §9.F 미래 작업자 학습 정수 3종

1. **Phase B 정적 분석 한계 = Vercel 시각 검증 진짜 필수 정수** = ★ ★ #112 Phase B 통과 vs 실제 동작 X = Vercel 사용자 시각 짚음 = 진짜 본질 발견 = ★ Phase B 답습 정수 진짜 진짜 진짜 입증 정점.
2. **페널티 영역 폐기 = 사용처 0 발생 = props 제거 답습 자연** = ★ Line 45-49 폐기 → scoreCandidate.filters 사용처 0 자연 발생 → ESLint warning → props 제거 답습.
3. **maxCommuteTime 답습 패턴 = 동작 일관성 정합 정수** = ★ `if (filters.X)` + 범위 검사 + rejected + reason 동일 패턴 = 미래 작업자 직관 영역 사수.
