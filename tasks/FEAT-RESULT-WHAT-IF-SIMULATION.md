# FEAT-RESULT-WHAT-IF-SIMULATION

## 1. 🎯 Summary

**결과 페이지 출근시간 chip 클릭 → 자유 `<input type="time">` 입력 + 클릭 시 진짜 재계산 박힘** (★ β 확장 정수 정점) + 르르 본질 짚음 진짜 입증 답습.

본 ISSUE = ★ **β 확장 정수 정점** (사전 案 α: chip + 7 옵션 preview → Phase B 사전 발견 → β 확장: 자유 입력 + runMockDiagnosis client-side 재계산).

### ★ 본 ISSUE 메타 가치 5종

1. ★ ★ 사용자 본질 짚음 답습 정수 § (★ 르르 진짜 짚음 — "다른 시간대도 궁금" + "자유 입력 나을것같아")
2. ★ ★ β 확장 정수 정점 § (★ chip preview → 진짜 재계산 진화)
3. ★ "사용자 입력 → what-if 재계산" 자연 흐름 진화 § (★ #108 양방향 자연 흐름 답습)
4. ISSUE 신설 자동화 답습 11회째 § (#94+#96+#98+#100+#102+#104+#106+#108+#110+#114+#111)
5. 가드 30+종 8 영역 사수 §

### ★ Mismatch 누적 (★ ㊝ + ㊞ 2건 정직 인정)

| # | 영역 | 사전 案 | 실측 | 정직 인정 |
| --- | --- | --- | --- | --- |
| **㊝** | bundle 회귀 | 7.94 kB (회귀 0) | 9.35 kB (+1.41 kB) | M complexity + β 확장 자연 trade-off |
| **㊞** | 사전 작업 일부 폐기 | 7 옵션 chip + util 5 함수 박힘 | what-if-time.ts 35줄 폐기 + TimeChipOptions 53→38줄 재작성 | β 확장 = 진짜 본질 진화 답습 자연 |

→ ★ Phase A 사전 박힘 정수 진화 답습 9회째 = ★ M complexity + β 확장 자연 정직 인정 정점

### 자가 치유 누적 (★ β 확장 진화)

본 ISSUE α 시점 = chip + 7 옵션 preview만 (★ 사전 案) → Phase B 사전 발견 = `useDiagnosis(id)` filters 의존 X = 재계산 X 정직 발견 → β 확장 = 자유 입력 + runMockDiagnosis client-side 호출 + setResult 박힘 → ★ 르르 진짜 의지 답습 완성.

---

## 2. 🔗 References (Spec & Context)

### Issue #111 (본 ISSUE 신설 원본)

- URL: https://github.com/kmh89927a/Onday-design-Project/issues/111
- 라벨: `track:diagnosis-ui` + `wave:4` + `complexity:m` + `enhancement`

### ★ Q1~Q5 결정 표

| Q | 결정 | 근거 |
| --- | --- | --- |
| Q1 작업 모드 | **(B) 풀세트** | 답습 31회째 + M complexity = 진짜 본 기능 + 르르 본질 짚음 |
| Q2 영역 | 3 파일 (★ Phase A β 정정 후) | 정정 1 + 신규 1 + 폐기 1 |
| Q3 UI/UX | (가) inline + (다) chip 클릭 토글 → `<input type="time">` β 정정 | ★ 자유 입력 (★ #108 답습) + Tailwind HTML 표준 |
| Q4-a | 자유 입력 (★ 30분 단위 폐기 답습) | β 확장 = 르르 진짜 짚음 답습 |
| Q4-b | 시나리오 B fallback (옵션 비활성 + toast) | ★ #108 ㊙ 답습 |
| Q5 Phase | A → B → C → D | 답습 31회째 |

### ★ β 확장 정수 정점 § (★ 본 ISSUE 진짜 가치 정점 — 상세 §9.5)

- 사전 案 (α): chip + 7 옵션 preview만 (★ 시각만)
- **Phase B 사전 발견:** `useDiagnosis(id)` GET fetch = filters 의존 X = **재계산 X 정직 발견**
- **β 확장:** runMockDiagnosis client-side 호출 + setResult 박힘 (★ 진짜 재계산)
- ★ 르르 진짜 의지 답습: "30분 단위 → 자유 입력 정정" (★ 진짜 본질 짚음)

### ★ ★ Phase B 한계 § 4 ISSUE 누적 학습 정점 § (★ §9.6)

| ISSUE | 영역 |
| --- | --- |
| #108 §9.E | 사전 명문화 "Phase B 통과 ≠ Vercel 실 환경 입증" |
| #110 | 실 발견 (Vercel 시점 text-white 박힘 X) |
| #114 | 진짜 입증 (text-primary-foreground 토큰 답습) |
| **본 ISSUE (#111)** | **★ β 확장 = Phase B 사전 발견 → 본 ISSUE 진짜 본질 진화 답습 정점** |

### ★ 사용자 본질 짚음 답습 §

> "다른 시간대도 궁금" (★ 사용자 발견) → α 사전 案: 7 옵션 preview → 르르 진짜 짚음: "자유 입력 나을것같아 + 클릭 시 진짜 재계산" → β 확장 완성.

- 시점: PR #115 머지 직후 (2026-05-25)
- 영역: `/diagnosis/result/[id]` 출근시간 chip
- 진화: chip preview만 → 진짜 본질 (★ 자유 입력 + 재계산)

---

## 3. 🛠️ Task Breakdown (✅/⏸ 실측 status markers)

- ✅ **§3.1** Phase A α — `time-chip-options.tsx` 신규 53줄 (7 옵션) + `what-if-time.ts` 신규 35줄 + `result-content.tsx` +30/-1 (★ chip preview)
- ✅ **§3.2** Phase A β — `time-chip-options.tsx` 재작성 53→38줄 (`<input type="time">`) + `what-if-time.ts` 폐기 35줄 → 0 + `result-content.tsx` +60/-1 (★ 클릭 시 재계산)
- ✅ **§3.3** Phase B — 자체 grill 7 영역 + AC-6 grep 7행 + Phase B 한계 § 4 ISSUE 누적 학습 정점 §
- ✅ **§3.4** Phase C — 명세 신설 + ISSUE_REGISTER_LOG.md +1 § (★ 13건 누적) + 메모리 신설/갱신
- ⏸ **§3.5** Phase D — 검증 5종 + 격리 + 커밋 분리 답습 25회째 + Draft PR + 멈춤
- ⏸ **§3.6** Phase D 후 — 머지 + Vercel 시각 검증 (★ 클릭 → 자유 입력 → 재계산 박힘 진짜 입증)

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

- **AC-1** Given 출근시간 chip, When 클릭, Then `<input type="time">` inline 박힘 ✅
- **AC-2** Given input value 변경, When `onChange` 트리거, Then `setFilters` + `runMockDiagnosis` + `setResult` 호출 ✅
- **AC-3** Given 시나리오 B (`coordinateA` null), When input 변경, Then disabled + toast "페이지 새로고침 후 다시 시도해주세요" ✅
- **AC-4** Given `runMockDiagnosis` 호출, When client-side 실행, Then `MOCK_NEIGHBORHOODS` + haversine 답습 (★ Mock 모드 한정) ✅
- **AC-5** Given `candidate-card.tsx` + `dev/page.tsx` + `single-result-view.tsx`, When `git diff main`, Then 영향 0 lines ✅
- **AC-6** Given Middleware + bundle, When `npm run build`, Then Middleware 32.5 kB 25번째 + /diagnosis/result/[id] +1.41 kB (★ ㊝ 정직 인정) ✅
- **AC-7** Given 가드 30+종 8 영역, When 정적 grep 7행, Then 변경 영역 위반 0 lines ✅

---

## 5. ⚙️ Non-Functional Constraints (NFR)

- **NFR-PERF**: bundle +1.41 kB (★ ㊝ 정직 인정 — M complexity + β 확장 자연 trade-off)
- **NFR-COMPAT**: candidate-card + dev/page + single-result-view 무수정
- **NFR-DESIGN**: 기본 `<input type="time">` + Tailwind (★ 디자인 시스템 정밀 맞음 = 후속 ISSUE 영역 사전 명시)
- **NFR-ISOLATION**: 본 ISSUE 영역 외 영향 0 (★ 출근시간 chip + what-if 영역만)
- **NFR-FALLBACK**: 시나리오 B (페이지 reload) → 비활성 + toast (★ #108 답습)

---

## 6. 📦 Deliverables

### Phase A α ✅ (사전 시점)

- `onday-app/src/lib/what-if-time.ts` NEW 35줄 (parseTime + toMinutes + roundTo30 + formatTime + generateWhatIfOptions)
- `onday-app/src/app/diagnosis/result/[id]/time-chip-options.tsx` NEW 53줄 (7 옵션 chip)
- `onday-app/src/app/diagnosis/result/[id]/result-content.tsx` +30/-1 (★ chip preview)

### Phase A β ✅ (★ 진화 시점 — 본 ISSUE 진짜 가치 정점)

- `onday-app/src/lib/what-if-time.ts` **★ 폐기 35줄 → 0** (★ ㊞ 정직)
- `onday-app/src/app/diagnosis/result/[id]/time-chip-options.tsx` 재작성 53→**38줄** (`<input type="time">` 박힘)
- `onday-app/src/app/diagnosis/result/[id]/result-content.tsx` **+60/-1** (★ store 5 영역 + runMockDiagnosis + setResult + fallback toast + try/catch)

### Phase B ✅ (자체 grill 7 영역)

- 폐기 맞음 + input 맞음 + handleTimeWhatIf β 맞음 + tsc/eslint/build + 가드 + 영향 0 + ㊝+㊞ 정직 + Phase B 한계 § 4 ISSUE 누적 학습 정점 §

### Phase C ✅ (명세 + 로그 + 메모리)

- `tasks/FEAT-RESULT-WHAT-IF-SIMULATION.md` NEW (본 명세)
- `tasks/ISSUE_REGISTER_LOG.md` +1 § (★ 13건 누적)
- `project_issue111_resume.md` NEW + `project_critical_path_progress.md` 갱신 + `MEMORY.md` entry

### Phase D (★ feat+docs 커밋 분리 답습 25회째 + Draft PR)

- 커밋 1 `feat`: time-chip-options.tsx + result-content.tsx + what-if-time.ts 폐기
- 커밋 2 `docs`: 명세 + 로그
- Draft PR + Refs #111
- ★ 멈춤 (★ 머지 르르 직접 결정)

### Follow-up

1. ★ **Vercel 시각 검증** (★ 클릭 → 자유 입력 → 재계산 박힘 진짜 입증)
2. **#112 FEAT-DIAGNOSIS-INPUT-FILTERS** (★ 다음 — 예산 자유 입력 답습 = 본 ISSUE 자유 입력 패턴 진화)
3. **#114 OPEN 유지** (★ Tailwind 본질 = 다음 세션 정밀 분석)
4. (★ 미래) Production runMockDiagnosis = POST API 호출 = 별도 ISSUE 사전 명시
5. (★ 미래) time-chip-options 디자인 시스템 정밀 맞음 = 후속 ISSUE
6. **Issue #111 Close 정정 댓글**

---

## 7. 🔗 Dependencies

### 선행 (모두 ✅ 충족):

- ✅ #108 REFACTOR-UI-003-FEEDBACK-2 PR #109 머지 (★ store filters 답습)
- ✅ #110 FIX-BEST-BADGE-COLOR PR #113 머지 (★ 29칸)
- ✅ #114 FIX-BEST-BADGE-TEXT-COLOR-TAILWIND PR #115 머지 (★ 30칸)
- ✅ `runMockDiagnosis` (Mock 모드 client-side 호출 가능)
- ✅ `<input type="time">` HTML 표준

### 후행:

1. ★ **Vercel 시각 검증** (★ 본 ISSUE 진짜 본질 입증 — 상세 §6 Deliverables)
2. **#112 FEAT-DIAGNOSIS-INPUT-FILTERS** (★ 자유 입력 패턴 답습 진화)
3. **#114 OPEN 유지** (★ Tailwind 본질)
4. (★ 미래) Production POST API ISSUE
5. (★ 미래) time-chip-options 디자인 시스템 정밀 맞음 ISSUE
6. **Issue #111 Close 정정 댓글**

---

## 8. 🧪 Test Plan

### Phase A α ✅ — 검증 7항목 (★ 사전)

prisma + tsc + eslint + build 7.94 → **8.45 kB** (+0.51 kB) + 가드 + git status

### Phase A β ✅ — 검증 8항목 (★ 본 ISSUE 진짜 가치 정점)

| # | 검증 | 결과 |
| --- | --- | --- |
| 1 | tsc | 0 errors ✅ |
| 2 | eslint | 0 errors ✅ |
| 3 | npm run build | Middleware 32.5 kB + /diagnosis/result/[id] **9.35 kB** (★ ㊝ +1.41 kB) |
| 4 | dev/page.tsx 영향 | 0 ✅ |
| 5 | single-result-view.tsx 영향 | 0 ✅ (★ 본 ISSUE 범위 외) |
| 6 | what-if-time.ts 사용처 | 0 ✅ (★ 폐기 맞음) |
| 7 | 가드 30+종 변경 0 | ✅ |
| 8 | git status | M 1 + ?? 2 ✅ |

### Phase B ✅ — 자체 grill 7 영역 + AC-6 grep 7행 + Phase B 한계 § 4 ISSUE 누적 학습 정점

### ★ β 7 흐름 맞음

1. 출근시간 chip 클릭 → toggle
2. `<input type="time">` inline 박힘
3. 사용자 입력 변경 → `onChange(time)`
4. 시나리오 B → toast + return
5. 정상 → `setFilters(newFilters)`
6. `runMockDiagnosis(coordA, coordB, newFilters, mode, ...)` client-side
7. `setResult(id, candidates)` 갱신 → 결과 자동 정정

---

## 9. 📓 정직성 6 + §9.C ㊝ + §9.D ㊞ + §9.E 미래 작업자 학습 정수 3종

### §9.1 사용자 본질 짚음 답습 §

PR #115 머지 직후 르르 발견 + α → β 진화 = 사용자 본질 짚음 답습. "다른 시간대 궁금" → "자유 입력 + 진짜 재계산" 진짜 의지.

### §9.2 "사용자 입력 → what-if 재계산" 자연 흐름 진화 §

#108 양방향 자연 흐름 답습 진화 → 본 ISSUE β 확장 = 출근시간 chip 클릭 → 자유 입력 → 즉시 재계산.

### §9.3 commuteSchedule store 진화 §

#98 → #100 → #102 commuteSchedule DTO 진화 답습. 본 ISSUE = `setFilters({ commuteSchedule: { days: ..., departureTime: time } })` 호출.

### §9.4 ISSUE 신설 자동화 답습 11회째 §

#94+#96+#98+#100+#102+#104+#106+#108+#110+#114+**#111** = 본 세션 신설 ISSUE **11회째**.

### §9.5 ★ ★ ★ β 확장 정수 정점 § (★ 본 ISSUE 진짜 가치 진화 정점)

**β 확장 3단계 진화:**

1. **사전 案 α:** chip + 7 옵션 preview만 (★ 시각만)
2. **Phase B 사전 발견:** `useDiagnosis(id)` GET fetch = filters 의존 X = **재계산 X 정직 발견** (★ 사용자 추천 案 (다) queryKey 박힘 = 실제 작동 X 정직 인정)
3. **β 확장:** runMockDiagnosis client-side 호출 + setResult 박힘 (★ 진짜 재계산 도달)

**★ 르르 진짜 의지 답습:**
- "30분 단위 7 옵션 → 자유 입력 정정" (★ 진짜 본질 짚음)
- "클릭 시 진짜 재계산 박힘" (★ 본 ISSUE 진짜 본질)

### §9.6 ★ Phase B 한계 § 4 ISSUE 누적 학습 정점 §

| ISSUE | 영역 |
| --- | --- |
| #108 §9.E | 사전 명문화 "Phase B 통과 ≠ Vercel 실 환경 입증" |
| #110 | 실 발견 (Vercel 시점 text-white 박힘 X) |
| #114 | 진짜 입증 (text-primary-foreground 토큰 답습) |
| **본 ISSUE (#111)** | ★ β 확장 = Phase B 사전 발견 → 본 ISSUE 진짜 본질 진화 답습 정점 (★ 미커버 4종) |

### ★ ★ §9.C ㊝ Mismatch 정직 인정 §

- 사전 案: bundle 회귀 0 (★ L complexity 영역 답습)
- 실측: /diagnosis/result/[id] 7.94 → **9.35 kB (+1.41 kB)**
- 정직 인정: M complexity + β 확장 = runMockDiagnosis client import + MOCK_NEIGHBORHOODS 자연 trade-off

### ★ ★ §9.D ㊞ Mismatch 정직 인정 §

- 사전 案: 7 옵션 chip + util 5 함수 박힘
- 실측: **what-if-time.ts 35줄 전체 폐기 + TimeChipOptions 53→38줄 재작성**
- 정직 인정: β 확장 = 진짜 본질 진화 답습 자연 (★ 신중한 진단 + 르르 진짜 의지 박힘 = 사전 작업 폐기 자연 정수)

### ★ §9.E 미래 작업자 학습 정수 3종

1. **"M complexity + β 확장 = bundle 회귀 자연 trade-off"** (★ 사전 案 회귀 0은 L complexity 영역 답습)
2. **"사전 작업 일부 폐기 = β 확장 진짜 본질 진화 답습 자연"** (★ 신중한 진단 후 르르 진짜 의지 박힘 정직 인정)
3. **"Phase B 사전 발견 → 진짜 본질 진화 답습 정점"** (★ #108+#110+#114 누적 + 본 ISSUE β 확장 = 4 ISSUE 누적 학습 정점)

### §9.H 사전 案 vs 실측 정직 인정

| # | 사전 案 | 실측 | 정직 인정 |
| --- | --- | --- | --- |
| 1 | Phase A α 검증 11항목 | 7항목 (★ α 시점만) → β 시점 8항목 | β 확장 = 검증 항목 재구성 자연 |
| 2 | 5~7 파일 산출 | 3 파일 (정정 1 + 신규 1 + 폐기 1) | β 확장 = 산출 영역 정밀화 자연 |

---

_본 명세 신설: 2026-05-25 (Issue #111 Phase C). 본 § 박힘 = β 확장 정수 정점 + Phase B 한계 § 4 ISSUE 누적 학습 정점._
