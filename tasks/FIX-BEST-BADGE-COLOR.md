# FIX-BEST-BADGE-COLOR

## 1. 🎯 Summary

**BEST 뱃지 가독성 정정** — Badge `best` variant 색을 `bg-primary` (#2563EB 파란색) → `bg-danger` (#EF4444 빨간색) 으로 정정. 르르 사용자 검증 시점 발견된 잔존 가독성 부족 해소 + 디자인 시스템 토큰 답습.

본 ISSUE = ★ **Phase A 사전 박힘 정수 진화 답습 7회째 완전 입증** (본 ISSUE 진짜 가치 정점 — Phase A 0건 + Phase B 0건 = 가장 깔끔한 회차).

### ★ 본 ISSUE 메타 (메타 가치 5종)

1. 사용자 발견 즉시 정정 (★ 사용자 검증 + 즉시 반영 워크플로 9회째)
2. ★ Badge variant 확장 패턴 (★ #106 ㊕)
3. ISSUE 신설 자동화 답습 9회째 (#94+#96+#98+#100+#102+#104+#106+#108+#110)
4. ★ ★ ISSUE_REGISTER_LOG.md 정직 § 답습 (★ #108 약속)
5. 가드 30+종 8 영역 사수

### ★ Mismatch 0건 (Phase A + B 모두 0건)

| 회차 | ISSUE | Phase A | Phase B |
| --- | --- | --- | --- |
| 7회 (본 ISSUE) | #110 | **0건** | **0건** |

→ ★ **Phase A 사전 박힘 정수 진화 답습 7회째 완전 입증**

### 자가 치유 누적

본 ISSUE 진입 직전 = `bg-primary text-white shadow-sm` (#106 ㊕ 박힘) → 르르 시각 검증 결과 가독성 잔존 ↓ → 본 ISSUE Phase A 1 파일 +1/-1 정정 = 르르 짚음 "흰 글씨 + 빨간 배경 + 본 프로젝트 어울리는 톤" 완전 답습.

---

## 2. 🔗 References (Spec & Context)

### Issue #110 (본 ISSUE 신설 원본)

- URL: https://github.com/kmh89927a/Onday-design-Project/issues/110
- 라벨: `track:diagnosis-ui` + `wave:4` + `complexity:l` + `bug`

### ★ Q1~Q5 결정 표

| Q | 결정 | 근거 |
| --- | --- | --- |
| Q1 작업 모드 | **(B) 풀세트** | 답습 29회째 + ISSUE_REGISTER_LOG.md 4 § 자연 박힘 + L complexity ≠ 명세 절제 |
| Q2 영역 | 1 코드 + 1 명세 + 1 로그 (3 파일) | 단일 variant 색 정정 영역 격리 |
| Q3 색 결정 | **(가-1) `bg-danger text-white shadow-sm`** | ★ 디자인 시스템 토큰 답습 (`--danger` #EF4444) + 르르 짚음 "흰 글씨 + 빨간 배경" + Pastel B 맞음 + 변경 영역 최소 |
| Q4 산출 | 1 코드 정정 + 1 명세 신설 + 1 로그 정정 | 최소 변경 정점 |
| Q5 Phase | A → B → C → D | 답습 29회째 |

### ★ Mismatch 추적 (★ 0건 — Phase A + B 완전 맞음)

| Phase | 새 발견 | 처리 |
| --- | --- | --- |
| Phase A | **0건** | ✅ |
| Phase B | **0건** | ✅ |

→ Phase A 사전 박힘 정수 진화 답습 7회째 완전 입증

### ★ ★ Phase A 사전 박힘 정수 진화 답습 7회째 완전 입증 § (★ 본 ISSUE 진짜 가치 진화 정점 — 상세 §9.5)

| 회차 | ISSUE | Phase A | Phase B | 결과 |
| --- | --- | --- | --- | --- |
| 1회 | #96 | 0건 | 0건 | ✅ |
| 2회 | #100 | 0건 | 0건 | ✅ |
| 3회 | #102 | 0건 | ㊿ → A 해소 | ✅ |
| 4회 | #104 | ㊇ 진입 직전 | 0건 | ✅ |
| 5회 | #106 | ㊗ + ㊘ 2건 | 0건 | ✅ |
| 6회 | #108 | ★ ㊙ 1건 | 0건 | ✅ |
| **7회 (본 ISSUE)** | **#110** | **0건** | **0건** | **★ 완전 입증 (가장 깔끔)** |

### ★ 사용자 발견 즉시 정정 §

> "BEST 글씨색 가독성 ↓ (★ 어제 #106 정정 후에도 잔존). 흰색 글씨로 하던지해서 보였으면 + 또는 배경색도 빨간색으로. 너무 이상한 빨강 X + 본 프로젝트 디자인 시스템 어울리는 빨강."

- 시점: PR #109 머지 직후 (2026-05-25)
- 영역: `/diagnosis/result/[id]` 추천 카드 상단 Badge `best`
- 잔존 사유: #106 Q3-b 시점 variant 신규 + `text-white shadow-sm` 보강 박힘. 그러나 `bg-primary` (파란색) 토큰 맞음 미흡 → 강조 약함.
- 정정: `bg-primary` → `bg-danger` (#EF4444 디자인 시스템 토큰)

### ★ Badge variant 확장 패턴 § (★ #106 ㊕)

#106 시점 `badge.tsx` line 27 `best` variant 신규 박힘 패턴 → 본 ISSUE 시점 동일 line 27 색 정정 박힘. `cva` `variants.best` 정의 유지 + 색 변경 + JSX `variant="best"` 무수정.

### ★ ★ ISSUE_REGISTER_LOG.md 정직 § 답습 (★ #108 약속)

#108 Phase C 시점 8건 한꺼번에 박힘 + ★ 사후 답습 약속. 본 ISSUE Phase C 시점 = 약속 답습 = 표에 #110+#111+#112 박힘 + #108 머지 정보 정정.

### ★ 디자인 시스템 토큰 답습 §

`badge.tsx:27` `bg-danger` 박힘 = `globals.css:43` `--danger: 0 84% 60%` (HSL) = `#EF4444` (HEX) 디자인 시스템 정의 토큰 답습. Tailwind 기본 클래스 (`bg-red-*` / `bg-rose-*`) 사용 X = 본 프로젝트 일관성 정수.

---

## 3. 🛠️ Task Breakdown (✅/⏸ 실측 status markers)

- ✅ **§3.1** Phase A — `badge.tsx` line 27 정정 (+1/-1)
- ✅ **§3.2** Phase B — 자체 grill 7 영역 + AC-6 grep 7행 + Phase B 한계 § (#108 §9.E)
- ✅ **§3.3** Phase C — 명세 신설 + ISSUE_REGISTER_LOG.md 4 § 박힘 + 메모리 신설/갱신
- ⏸ **§3.4** Phase D — 검증 5종 + 격리 + 커밋 2개 분리 + Draft PR + 멈춤
- ⏸ **§3.5** Phase D 후 — 머지 + Vercel 시각 검증 (★ 빨간 BEST 박힘 입증)

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

- **AC-1** Given Badge `best` variant 색이 `bg-primary` 박힘, When 본 ISSUE Phase A 정정, Then `bg-danger` 박힘 + `text-white shadow-sm` 유지 ✅
- **AC-2** Given `candidate-card.tsx:63` 사용처, When Phase A 정정 후, Then JSX 무수정 (diff 0 lines) ✅
- **AC-3** Given `badge.tsx` 다른 variant (default/solid/secondary/ok/info/warning/neutral/danger/destructive/outline/grade-a~d), When `git diff main`, Then 영향 0 lines ✅
- **AC-4** Given `dev/page.tsx`, When `git diff main`, Then 영향 0 lines ✅
- **AC-5** Given Middleware + bundle, When `npm run build`, Then Middleware 32.5 kB 25번째 + /diagnosis/result/[id] 7.94 kB 회귀 0 ✅
- **AC-6** Given 가드 30+종 8 영역, When 정적 grep 7행, Then 변경 영역 위반 0 lines ✅

---

## 5. ⚙️ Non-Functional Constraints (NFR)

- **NFR-PERF**: bundle 회귀 0 (/diagnosis/result/[id] 7.94 kB 유지)
- **NFR-COMPAT**: candidate-card.tsx JSX 무수정 (variant 이름 박힘 유지)
- **NFR-DESIGN**: 디자인 시스템 토큰 답습 (Tailwind 기본 클래스 X, `--danger` 토큰 사용)
- **NFR-ISOLATION**: best variant only 변경 (다른 variant + dev/page.tsx 영향 0)

---

## 6. 📦 Deliverables

### Phase A ✅ (1 파일 정정)

- `onday-app/src/components/ui/badge.tsx` line 27 +1/-1 (`bg-primary` → `bg-danger`)

### Phase B ✅ (자체 grill 7 영역)

- bg-danger 토큰 맞음 ✅
- candidate-card.tsx 사용처 맞음 ✅
- 다른 Badge variant 영향 0 ✅
- tsc + ESLint + build 재확인 ✅
- 가드 30+종 + dev/page.tsx 영향 0 재입증 ✅
- 의미 충돌 정직 인정 ✅ (§9.C)
- Phase B 자체 grill 한계 § (#108 §9.E 답습) ✅

### Phase C ✅ (명세 + 로그 + 메모리)

- `tasks/FIX-BEST-BADGE-COLOR.md` NEW (본 명세)
- `tasks/ISSUE_REGISTER_LOG.md` +4 § 박힘 (#108 머지 정정 + #110+#111+#112)
- `project_issue110_resume.md` NEW + `project_critical_path_progress.md` 갱신 + `MEMORY.md` entry

### Phase D (★ feat+docs 커밋 분리 23회째 + Draft PR)

- 커밋 1 `feat`: badge.tsx +1/-1
- 커밋 2 `docs`: 명세 + 로그 (메모리는 git tracked 외)
- Draft PR + Refs #110
- ★ 멈춤 (★ 머지 르르 직접 결정)

### Follow-up

1. ★ **Vercel 시각 검증** (★ 빨간 BEST 박힘 입증 — Phase B 한계 §)
2. **#111 FEAT-RESULT-WHAT-IF-SIMULATION** (★ 다음 ISSUE)
3. **#112 FEAT-DIAGNOSIS-INPUT-FILTERS** (★ 다음 ISSUE)
4. 의미 충돌 후속 ISSUE 가능성 — `--accent-best` 토큰 신설 (§9.C)

---

## 7. 🔗 Dependencies

### 선행 (모두 ✅ 충족):

- ✅ #106 REFACTOR-UI-003-FEEDBACK Q3-b — Badge `best` variant 신규 박힘 시점 (PR #107 머지)
- ✅ #108 REFACTOR-UI-003-FEEDBACK-2 — PR #109 머지 (★ 28칸 도달)
- ✅ 디자인 시스템 `--danger` 토큰 정의 (`globals.css:43`)

### 후행:

1. **Vercel 시각 검증** (★ 본 ISSUE 진짜 입증)
2. **#111 FEAT-RESULT-WHAT-IF-SIMULATION** (★ 다음 1순위)
3. **#112 FEAT-DIAGNOSIS-INPUT-FILTERS** (★ 다음 2순위 — ★ #106 §9.D 약속)
4. **Issue #110 Close 정정 댓글** (Phase D 후)

---

## 8. 🧪 Test Plan

### Phase A ✅ — 검증 11항목 통과

| # | 검증 | 결과 |
| --- | --- | --- |
| 1 | `npx prisma validate` | exit 0 ✅ |
| 2 | `npx prisma generate` | exit 0 (7.8.0) ✅ |
| 3 | `npx tsc --noEmit` | 0 errors ✅ |
| 4 | `npx eslint src/` | 0 errors (10 warnings 기존) ✅ |
| 5 | `npm run build` | Middleware 32.5 kB + /diagnosis/result/[id] 7.94 kB baseline ✅ |
| 6 | 가드 30+종 변경 0 | ✅ |
| 7 | dev/page.tsx 영향 0 | ✅ |
| 8 | candidate-card.tsx JSX 무수정 | ✅ |
| 9 | 다른 Badge variant 영향 0 | ✅ |
| 10 | git diff main --stat: 1 파일 +1/-1 | ✅ |
| 11 | git status: M 1 + ?? 1 | ✅ |

### Phase B ✅ — 자체 grill 7 영역 + AC-6 grep 7행

[자체 grill 7 영역] 모두 통과 ✅
[AC-6 정적 grep 7행] 1차 가드 3종 모두 0 + 2차 입증 4종 (박힘 1+1, 무수정 0+0) ✅

---

## 9. 📓 정직성 7 + §9.C 의미 충돌 명문화

### §9.1 사용자 발견 즉시 정정 §

PR #109 머지 직후 르르 사용자 시각 검증 시점 BEST 가독성 잔존 발견 → 본 ISSUE 즉시 신설 + Phase A 진입 = 사용자 검증 + 즉시 반영 워크플로 **9회째** (#94+#96+#98+#100+#102+#104+#106+#108+#110).

### §9.2 ★ Badge variant 확장 패턴 § (★ #106)

#106 ㊕ 시점 `badge.tsx:27` `best` variant 신규 박힘 패턴 = `cva` `variants.best` 정의 + JSX `variant="best"` 사용. 본 ISSUE 시점 동일 line 색 정정 = 패턴 답습 (★ ad-hoc 클래스 X).

### §9.3 ★ ★ ISSUE_REGISTER_LOG.md 정직 § 답습 (★ #108)

#108 Phase C 시점 8건 한꺼번에 박힘 + 사후 답습 약속. 본 ISSUE Phase C 시점 = 약속 답습 = 표 4 § 박힘 (#108 머지 정정 + #110 + #111 + #112). 매 신설 ISSUE Phase C 시점 본 로그 박힘 = 정직 답습 정수.

### §9.4 Phase B 한계 § (#108 §9.E 답습 — 미커버 4종 본 ISSUE 시각 가독성 적응)

| # | 미커버 | 검증 시점 |
| --- | --- | --- |
| 1 | 시각 가독성 진짜 입증 (BEST 배지 강조 입증) | Vercel 실 환경 검증 필수 |
| 2 | Vercel 배포 환경 색 렌더링 차이 (oklch SSR/CSR) | Vercel 배포 후 |
| 3 | 사용자 시각 임팩트 (★ 본 ISSUE 진짜 목적 — #106 잔존 해소) | 정적 분석 미커버 |
| 4 | 다른 디바이스 색 렌더링 (모바일/태블릿) | 실 기기 검증 |

**미래 작업자 학습:**
- "Phase B 자체 grill 통과 ≠ 시각 가독성 진짜 입증"
- "디자인 ISSUE = Phase D 정직 차원 정점 = 르르 사용자 실 환경 검증"

### §9.5 ★ ★ ★ Phase A 사전 박힘 정수 진화 답습 7회째 완전 입증 § (★ 본 ISSUE 진짜 가치 진화 정점)

본 ISSUE = **Phase A 0건 + Phase B 0건 = 가장 깔끔한 회차**.

7회 누적:
- 1회 #96: A 0 + B 0
- 2회 #100: A 0 + B 0
- 3회 #102: A 0 + B 1 (㊿ Phase A 해소)
- 4회 #104: A 1 (㊇ 진입 직전) + B 0
- 5회 #106: A 2 (㊗+㊘) + B 0
- 6회 #108: A 1 (★ ㊙) + B 0
- **7회 (본 ISSUE) #110: A 0 + B 0 = 완전 깔끔** ✅

진화 의미: Phase A 진입 직전 사전 인지 + 르르 사전 결정 (Q3 색 案) → Phase A 시점 새 발견 0건 + Phase B 시점 새 발견 0건 = ★ 사전 박힘 정수 완전 입증.

### §9.6 디자인 시스템 토큰 답습 §

`bg-danger` = `--danger: 0 84% 60%` = `#EF4444` 디자인 시스템 정의 토큰 답습. Tailwind 기본 클래스 사용 X = 본 프로젝트 일관성. 대안 (bg-red-500 / bg-rose-500 등) 거절 사유 박힘.

### §9.7 가드 30+종 8 영역 사수 §

AC-6 정적 grep 7행:
- 1차 가드 3종: 모두 0 ✅
- 2차 입증 4종: best 박힘 1 + variant=best 박힘 1 + 다른 variant 무수정 0 + dev/page.tsx 영향 0 ✅

### ★ §9.C 의미 충돌 정직 명문화 (★ 본 ISSUE 정직성 정점)

**충돌 인정:**
- `--danger` 토큰 본래 의미 = "위험 / 삭제 / 잠금 해제 강조" (design-tokens.md §1 정의)
- `best` variant 의미 = "최고 / 추천 동네 1위 강조"
- 의미 충돌 = "위험" vs "최고" 정직 인정

**해소:**
- `best` variant 자체가 별도 정의된 시스템 변형 (`cva` `variants.best`)
- 색 토큰 재사용 = variant 이름이 의미 박힘
- design-tokens.md §1 의미 정의 = 본래 사용처 가이드 + variant 확장 시 색 재사용 OK 판단

**미래 디자인 시스템 진화 영역 사전 명시:**
- 후속 ISSUE 가능성 — `--accent-best` 신규 토큰 신설 (의미 맞음)
- 시점 = 디자인 시스템 정식 진화 시 (본 ISSUE 시점 = MVP 1인 컨텍스트 L complexity 맞음 = 토큰 신설 over-engineering)
- 본 ISSUE = 최소 변경 정점 (Q4 맞음)

### §9.H 사전 案 vs 실측 정직 인정

| # | 사전 案 | 실측 | 정직 인정 |
| --- | --- | --- | --- |
| 1 | Phase A git status `M 1 + ?? 2` | `M 1 + ?? 1` | .agents/skills 외 추가 untracked 없음 — 명세 Phase C 시점 신설 답습 |
| 2 | 코멘트 line 26 정정 | line 26 `#106 ㊕` 그대로 보존 | +1/-1 정확 답습 + 코멘트 #110 흔적 본 명세 + PR 메시지 박힘 |

---

_본 명세 신설: 2026-05-25 (Issue #110 Phase C). 본 § 박힘 = 정직 § 답습 메타 가치 자연 박힘._
