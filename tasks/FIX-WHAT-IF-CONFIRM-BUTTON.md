# FIX-WHAT-IF-CONFIRM-BUTTON

## 1. 🎯 Summary

**시간대 변경 input 옆 "변경" 버튼 박힘 + 명시적 확인 UX + React 19 답습 정수** — 사용자 의지 답습 (★ 르르 "입력 도중 자동 재계산 X + 명시적 확인" 진짜 짚음) + Phase A 시점 ㊠ React 19 규칙 즉시 해소.

본 ISSUE = ★ 사용자 의지 답습 정수 + #111 β 확장 진화 후속 (★ 자동 → 명시적 확인 UX 진화) + ★ ★ Phase B 한계 § 5 ISSUE 누적 학습 정점.

### ★ 본 ISSUE 메타 가치 5종

1. ★ ★ 사용자 의지 답습 정수 § (★ 르르 진짜 짚음)
2. ★ #111 β 확장 진화 후속 § (★ 자동 → 명시적 확인 UX 진화)
3. ★ 사용자 검증 + 즉시 반영 워크플로 답습 13회째 §
4. ISSUE 신설 자동화 답습 12회째 § (#94+#96+#98+#100+#102+#104+#106+#108+#110+#114+#111+#118)
5. 가드 30+종 8 영역 사수 §

### ★ Mismatch — ㊠ 1건 (★ Phase A 즉시 해소)

| # | 영역 | 사전 案 | 실측 | 해소 |
| --- | --- | --- | --- | --- |
| **㊠** | React 19 `react-hooks/set-state-in-effect` 규칙 | `useEffect` + `setPending(baseTime)` props 동기화 | ESLint **error** 차단 (★ cascading renders 방지) | ★ `key={baseTime}` prop 재마운트 패턴 답습 (★ CLAUDE.md 명시) |

### 자가 치유 누적

본 ISSUE 진입 직전 = #111 자동 즉시 재계산 → 르르 짚음 "변경 버튼 + 명시적 확인" → 본 ISSUE Phase A 정정 = 사용자 의지 진짜 답습. Phase A 시점 ㊠ React 19 규칙 발견 + 즉시 해소 = 답습 정수.

---

## 2. 🔗 References (Spec & Context)

### Issue #118 (본 ISSUE 신설 원본)

- URL: https://github.com/kmh89927a/Onday-design-Project/issues/118
- 라벨: `track:diagnosis-ui` + `wave:4` + `complexity:l` + `enhancement`

### ★ Q1~Q5 결정 표

| Q | 결정 | 근거 |
| --- | --- | --- |
| Q1 | **(B) 풀세트** | 답습 32회째 + UX 진화 = 명세 가치 |
| Q2 | 3 파일 (코드 2 + 명세 + 로그) | 단일 컴포넌트 진화 영역 |
| Q3 UI/UX | **(가) inline** | `[ ⏱ 08:00 ] [변경]` 컴팩트 + 르르 사전 짚음 |
| Q4 동작 | **(가) disabled + (다) Enter 키** 결합 | `pending == baseTime` disabled + 키보드 맞음 |
| Q4-extra pending 위치 | **(A) 내부 캡슐화** | 부모 영향 최소 + 컴포넌트 책임 정수 |
| Q5 | A → B → C → D | 답습 32회째 |

### ★ ★ Phase B 한계 § 5 ISSUE 누적 학습 정점 § (★ §9.5)

| ISSUE | 영역 |
| --- | --- |
| #108 §9.E | 사전 명문화 "Phase B 통과 ≠ Vercel 실 환경 입증" |
| #110 | 실 발견 (text-white 박힘 X) |
| #114 | 진짜 입증 (text-primary-foreground 토큰 답습) |
| #111 | β 확장 진화 정점 (runMockDiagnosis client-side) |
| **#118 (본 ISSUE)** | **★ React 19 규칙 답습 정수** (★ ㊠ Phase A 즉시 해소) |

### ★ 사용자 의지 답습 §

> "입력 도중 자동 재계산 X. 변경 버튼 박힘. 클릭 시 재계산" (★ 르르 진짜 짚음)

- 시점: #111 PR #116+#117 머지 후 Vercel 시각 검증
- 진화: #111 자동 재계산 → 본 ISSUE 명시적 확인 UX

### ★ #111 β 확장 진화 후속 §

#111 = 자동 즉시 재계산 → 본 ISSUE = 사용자 명시적 확인 → 입력 자유도 보존 + 재계산 명확.

---

## 3. 🛠️ Task Breakdown (✅/⏸ 실측 status markers)

- ✅ **§3.1** Phase A — `time-chip-options.tsx` +29/-12 (★ pending state + button + Enter 키 + isUnchanged) + `result-content.tsx` +4/-2 (★ props 정정 + key prop)
- ✅ **§3.2** Phase B — 자체 grill 7 영역 + AC-6 grep 7행 + ㊠ 정직 + Phase B 한계 § 5 ISSUE 누적 학습 정점 §
- ✅ **§3.3** Phase C — 명세 신설 + ISSUE_REGISTER_LOG.md +1 § (★ 14건 누적) + 메모리
- ⏸ **§3.4** Phase D — 검증 5종 + 격리 + 커밋 분리 답습 26회째 + Draft PR
- ⏸ **§3.5** Phase D 후 — 머지 + Vercel 시각 검증 (★ "변경" 버튼 + Enter 키 박힘 입증)

---

## 4. ✅ Acceptance Criteria

- **AC-1** Given `<input type="time">`, When 옆 영역, Then "변경" 버튼 inline 박힘 ✅
- **AC-2** Given pending == baseTime, When 버튼 시각, Then disabled (★ "변경 없음" 명확) ✅
- **AC-3** Given input focus, When Enter 키, Then `onConfirm(pending)` 호출 ✅
- **AC-4** Given 사용자 input 변경 도중, When pending state 박힘, Then 즉시 재계산 X (★ 명시적 확인 시점만) ✅
- **AC-5** Given baseTime prop 변경, When 컴포넌트 재마운트, Then pending = 새 baseTime (★ `key` prop 재마운트 패턴) ✅
- **AC-6** Given Middleware + bundle, When build, Then Middleware 32.5 kB 25번째 + /diagnosis/result/[id] 9.48 kB (+0.14 kB 자연) ✅
- **AC-7** Given 가드 30+종 8 영역, When grep, Then 변경 영역 위반 0 lines ✅

---

## 5. ⚙️ Non-Functional Constraints (NFR)

- **NFR-PERF**: bundle +0.14 kB (★ button + Enter 키 + state 자연 증가)
- **NFR-COMPAT**: result-content.tsx props 1개 정정 (`onChange` → `onConfirm`) + key prop 추가
- **NFR-DESIGN**: button = `bg-primary text-primary-foreground` (★ 디자인 시스템 토큰 답습)
- **NFR-A11Y**: button + Enter 키 키보드 접근성 보장
- **NFR-REACT19**: `set-state-in-effect` 규칙 답습 (★ `key` prop 패턴)

---

## 6. 📦 Deliverables

### Phase A ✅ (2 파일 정정)

- `onday-app/src/app/diagnosis/result/[id]/time-chip-options.tsx` +29/-12 (★ pending state + button + Enter + isUnchanged)
- `onday-app/src/app/diagnosis/result/[id]/result-content.tsx` +4/-2 (★ `onChange` → `onConfirm` + `key={currentDepartureTime}`)

### Phase B ✅ (자체 grill 7 영역)

캡슐화 + props + 영향 0 + tsc/eslint/build + 가드 + ㊠ 정직 + Phase B 한계 § 5 ISSUE 누적 학습 정점 §

### Phase C ✅ (명세 + 로그 + 메모리)

- `tasks/FIX-WHAT-IF-CONFIRM-BUTTON.md` NEW (본 명세)
- `tasks/ISSUE_REGISTER_LOG.md` +1 § (★ 14건 누적)
- `project_issue118_resume.md` NEW + `project_critical_path_progress.md` 갱신 + `MEMORY.md` entry

### Phase D (★ feat+docs 커밋 분리 답습 26회째)

- 커밋 1 `feat`: 코드 2 파일
- 커밋 2 `docs`: 명세 + 로그
- Draft PR + Refs #118 + ★ 머지 르르 결정

### Follow-up

1. ★ **Vercel 시각 검증** (★ 변경 버튼 + Enter 키 박힘 입증)
2. **#112 FEAT-DIAGNOSIS-INPUT-FILTERS** (★ 자유 입력 답습 진화)
3. **#114 OPEN 유지** (★ Tailwind 본질)
4. (★ 미래) disabled 시각 디자인 시스템 정밀 맞음 후속 ISSUE
5. **Issue #118 Close 정정 댓글**

---

## 7. 🔗 Dependencies

### 선행 (모두 ✅):

- ✅ #111 PR #116 머지 (★ β 확장 정수 정점)
- ✅ #111 후속 PR #117 머지 (★ "시간대 변경" label + 입력 활성)

### 후행:

1. ★ Vercel 시각 검증
2. #112 FEAT-DIAGNOSIS-INPUT-FILTERS
3. #114 OPEN 유지
4. (★ 미래) 디자인 시스템 정밀 맞음 후속 ISSUE
5. Issue #118 Close 정정 댓글

---

## 8. 🧪 Test Plan

### Phase A ✅ — 검증 7항목

| # | 검증 | 결과 |
| --- | --- | --- |
| 1 | prisma validate/generate | exit 0 ✅ |
| 2 | tsc | 0 errors ✅ (★ ㊠ 해소 후) |
| 3 | eslint | 0 errors ✅ |
| 4 | npm run build | Middleware 32.5 kB + /diagnosis/result/[id] **9.48 kB (+0.14 kB)** |
| 5 | dev/page.tsx 영향 | 0 ✅ |
| 6 | single-result-view.tsx 영향 | 0 ✅ |
| 7 | git status | M 2 + ?? 1 ✅ |

### Phase B ✅ — 자체 grill 7 영역 + AC-6 grep 7행 + ㊠ 정직 + Phase B 한계 § 5 ISSUE 누적 학습 정점

---

## 9. 📓 정직성 6 + §9.C ㊠ + §9.D 미래 작업자 학습 정수 3종

### §9.1 ★ 사용자 의지 답습 정수 §

르르 짚음 "입력 도중 자동 재계산 X + 변경 버튼 + 명시적 확인" → 본 ISSUE Phase A 진입 = 사용자 검증 + 즉시 반영 워크플로 답습 **13회째**.

### §9.2 ★ #111 β 확장 진화 후속 §

#111 자동 즉시 재계산 → 본 ISSUE 명시적 확인 UX → 사용자 입력 자유도 보존 + 재계산 명확 = #111 진화 후속 정수.

### §9.3 ★ 사용자 검증 + 즉시 반영 워크플로 답습 13회째 §

#94+#96+#98+#100+#102+#104+#106+#108+#110+#114+#111(α/β)+#111 후속 + 본 ISSUE = 본 세션 **13회째 사용자 검증** 답습.

### §9.4 ★ ISSUE 신설 자동화 답습 12회째 §

#94+#96+#98+#100+#102+#104+#106+#108+#110+#114+#111+**#118** = 본 세션 신설 ISSUE **12회째**.

### §9.5 ★ ★ Phase B 한계 § 5 ISSUE 누적 학습 정점 §

**5 ISSUE 누적 진화:**

| ISSUE | 영역 |
| --- | --- |
| #108 §9.E | 사전 명문화 |
| #110 | 실 발견 |
| #114 | 진짜 입증 |
| #111 | β 확장 정수 정점 |
| **#118 (본 ISSUE)** | **★ React 19 규칙 답습 정수** |

★ 5 ISSUE 누적 = Phase B 자체 grill 한계 § 4 ISSUE → 5 ISSUE 답습 진화 정점.

### §9.6 ★ 가드 30+종 8 영역 사수 §

AC-6 정적 grep 7행:
- 1차 가드 3종: 모두 0 ✅
- 2차 입증 4종: pending + button disabled + Enter + key/onConfirm ✅

### ★ ★ §9.C ㊠ Mismatch 정직 인정 § (★ React 19 답습 정수)

**사전 案:**
- `useEffect` + `setPending(baseTime)` props 동기화 박힘
- TimeChipOptions 내부 캡슐화 맞음

**실측:**
- ESLint **error** 차단: `react-hooks/set-state-in-effect`
- React 19 규칙 — `setState synchronously within an effect can trigger cascading renders`

**해소:**
- `useEffect` 폐기
- `<TimeChipOptions key={currentDepartureTime} ...>` 박힘 = baseTime 변경 시 컴포넌트 재마운트 = pending 자동 초기화
- ★ CLAUDE.md 명시 답습 (`deadline-banner.tsx` `useSyncExternalStore` 답습 외 props 영역 맞음)

### ★ §9.D 미래 작업자 학습 정수 3종

1. **"React 19 `set-state-in-effect` 규칙 = `useEffect` + `setState` props 동기화 → `key` prop 재마운트 패턴 답습"** (★ 본 ISSUE Phase A 즉시 해소 정수)
2. **"`useSyncExternalStore` = 외부 store 한정 + `key` prop = props 영역 맞음"** (★ 사용처 정수 분리)
3. **"CLAUDE.md 명시 영역 답습 = Phase A 시점 즉시 해소 정수"** (★ 본 ISSUE 진짜 본질 입증 — 사전 문서 답습 가치)

### §9.H 사전 案 vs 실측 정직 인정

| # | 사전 案 | 실측 | 정직 |
| --- | --- | --- | --- |
| 1 | bundle 사전 추정 +0~0.2 kB | +0.14 kB | 사전 案 맞음 ✅ |
| 2 | Mismatch 0건 (Phase A 진화 10회째 시도) | ㊠ 1건 발견 + 즉시 해소 | ★ React 19 규칙 답습 정수 자연 |

---

_본 명세 신설: 2026-05-25 (Issue #118 Phase C). 본 § 박힘 = React 19 답습 정수 + Phase B 한계 § 5 ISSUE 누적 학습 정점._
