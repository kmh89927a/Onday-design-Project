# REFACTOR-DTO-COMMUTE-TIME-FEEDBACK — commute-schedule-picker.tsx 내부 state 분리 (Mismatch ㊵ Phase A 사전 박힘 정수 vs UX 충돌 자가 치유)

> **Issue:** [#100](https://github.com/kmh89927a/Onday-design-Project/issues/100)
> **Branch:** `feature/REFACTOR-DTO-COMMUTE-TIME-FEEDBACK`
> **Wave:** 4 / **Track:** diagnosis-ui / **Complexity:** L (~45분~1h)
> **Origin Issue:** [#98 DTO-COMMUTE-TIME](https://github.com/kmh89927a/Onday-design-Project/issues/98) (PR #99 머지 `bd7be79`)

---

## 1. 🎯 Summary

DTO-COMMUTE-TIME (#98, PR #99) 머지 + Vercel 자동 배포 후 ★ 4차 사용자 검증 시점 발견 버그 정정.

`commute-schedule-picker.tsx` `emit` 가드가 "둘 다 채워질 때만 onChange" 조건을 만족 못 한 부분 입력(요일 단독 / 시간 단독) 시 `onChange(undefined)` 호출 → store `undefined` 저장 → 리렌더 → `value=undefined` → 내부 days/time derived 가 `new Set([])` / `""` 로 리셋 → UI 시각 피드백 X (사용자 체감 "버튼 클릭 안 됨").

해결안 (A) 내부 state 분리 패턴: `localDays` + `localTime` `useState` lazy initializer + `lastValueRef` `useRef` + `useEffect` 외부 변경 동기화 + `emit` 시 `lastValueRef.current = next` 박힘 (무한 루프 방지). controlled API 정수 (value/onChange) + emit 가드 (Phase A 사전 박힘 정수) 그대로 유지.

### ★ 본 ISSUE 메타 (메타 7종)

- Mismatch ㊵ Phase A 사전 박힘 정수 vs UX 충돌 자가 치유 (★ 본 ISSUE 진짜 가치)
- useEffect + useRef guard 패턴 도입 (Q3 (vi) 결정)
- Phase A 사전 박힘 정수 진화 답습 2회째 (#96 → #100)
- 사용자 검증 + 즉시 반영 워크플로 답습 4회째
- ISSUE 신설 자동화 답습 4회째 (#94 + #96 + #98 + #100)
- 가드 30+종 0 lines 사수 (1054 lines 8 영역)
- ★ 100번째 마일스톤

### ★ Mismatch 사전 박힘 5건 (Phase A 진입 직전 명문화)

- ㊵ Phase A 사전 박힘 정수 vs UX 충돌 → Phase A 내부 state 분리로 해소
- ㊶ value prop ↔ 내부 state 동기화 패턴 → Q3 (vi) useEffect + useRef guard
- ㊷ 빈 상태 처리 ("이전 조건 불러오기" value=undefined) → useEffect 동기화 시 리셋
- ㊸ StrictMode 더블 렌더 useEffect 중복 호출 → useRef guard 우회
- ㊹ useEffect ↔ emit onChange 무한 루프 → emit 시 `lastValueRef.current = next` 박힘

### 자가 치유 누적

- DTO-COMMUTE-TIME #98 시점: 62건
- 본 ISSUE 추가: 62 + 5 = **67건** (㊵+㊶+㊷+㊸+㊹ 모두 Phase A 영역에서 해소)
- Phase B 자체 grill 새 Mismatch 0건

---

## 2. 🔗 References (Spec & Context)

### ★ Issue #100 (본 ISSUE 신설 원본)
- Title: `[REFACTOR] DTO-COMMUTE-TIME 사용자 피드백 반영 — commute-schedule-picker.tsx 내부 state 분리 (★ Mismatch ㊵ Phase A 사전 박힘 정수 vs UX 충돌 자가 치유)`
- Labels: `track:diagnosis-ui` + `wave:4` + `complexity:l`
- Origin: PR #99 머지 + Vercel 자동 배포 후 사용자 검증 시점 발견

### ★ Vercel URL (4차 확인 시점 = 머지 후 자연 배포)
- https://onday-design-project.vercel.app/diagnosis
- 버그: 요일 chip + HH:MM input 클릭 시 시각 피드백 X

### ★ Q1~Q5 결정 표 (본 ISSUE grill 합의 결과)

| Q | 분기 | 결정 | 근거 |
| --- | --- | --- | --- |
| Q1 작업 모드 | A/B/C/D | (B) 풀세트 | 답습 23회째 + Mismatch ㊵ 명문화 가치 + 사용자 검증 4회째 |
| Q2 디렉토리 + 사전 작업 | A/B/C | (A) form/ 단일 | controlled component 한계 = 본 ISSUE 본질 = 새 패턴 도입 정당 |
| Q3 동기화 패턴 | i/ii/iii/iv/v/vi | (vi) useEffect + useRef guard | React 19 안전 정수 + StrictMode 우회 + 빈 상태 처리 + 무한 루프 방지 |
| Q4 산출 파일 | 단일/분할 | 단일 commute-schedule-picker.tsx | page.tsx + types.ts + intersection.ts + Mock/SavedSearch/Validator + time-range-toggle 변경 0 |
| Q5 Phase 구성 | A/B/C/D | A → B → C → D | 답습 23회째 |

### ★ Mismatch ㊵~㊹ 5건 추적 표

| Mismatch | 영역 | 본질 | 처리 |
| --- | --- | --- | --- |
| ㊵ | Step 1.5 사전 라벨 | Phase A 사전 박힘 정수가 UX 박살냄 (부분 입력 차단) | ✅ Phase A 내부 state 분리 (★ 본 ISSUE 진짜 가치) |
| ㊶ | Q3 결정 | value prop ↔ 내부 state 동기화 패턴 | ✅ (vi) useEffect + useRef guard |
| ㊷ | Phase A 사전 박힘 | "이전 조건 불러오기" value=undefined 흐름 | ✅ useEffect 동기화 시 `new Set()` + `""` 리셋 |
| ㊸ | Phase A 사전 박힘 | StrictMode 더블 렌더 useEffect 중복 | ✅ `lastValueRef.current === value` skip |
| ㊹ | Phase A 사전 박힘 | useEffect → onChange → 부모 setFilters → value 갱신 → useEffect 무한 루프 | ✅ emit L63 `lastValueRef.current = next` 박힘 |

→ Phase B 자체 grill 새 Mismatch **0건** = Phase A 사전 박힘 정수 진화 답습 2회째 입증

### Mismatch ㊵ Phase A 사전 박힘 정수 vs UX 충돌 자가 치유 § (★ 본 ISSUE 진짜 가치)

**Phase A 정수 (사전 박힘):**
> "유효한 commuteSchedule (요일 + 시간 둘 다)만 store 저장 = 타입 안전 + 백엔드 정수"

**UX 정수 위배 (㊵):**
- 사용자 입력은 순차적 (요일 먼저 OR 시간 먼저)
- 부분 입력 = UI 즉시 피드백 필수 ("버튼 눌렀는데 반응 X" = 핵심 UX 위배)

**해결 (★ 3 정수 동시 달성):**
1. controlled API 정수 유지 = `value` / `onChange` 시그니처 그대로
2. Phase A 사전 박힘 정수 유지 = `emit` 가드로 둘 다 채워질 때만 store 저장
3. UX 즉시 피드백 정수 신규 박힘 = 내부 `useState` 분리 + 즉시 setter

**미래 작업자 학습:**
- "Phase A 사전 박힘 = 컴파일 차원 정수. 단 UX 차원 미커버 = Phase B 사용자 검증 필수."

### ★★ useEffect + useRef guard 패턴 § (Q3 (vi) 결정)

```tsx
const [localDays, setLocalDays] = React.useState<Set<DayOfWeek>>(
  () => new Set(value?.days ?? []),
);
const [localTime, setLocalTime] = React.useState(
  () => value?.departureTime ?? "",
);
const lastValueRef = React.useRef(value);

React.useEffect(() => {
  if (value !== lastValueRef.current) {     // ㊸ StrictMode 더블 렌더 우회
    lastValueRef.current = value;
    setLocalDays(new Set(value?.days ?? []));  // ㊷ 빈 상태 리셋
    setLocalTime(value?.departureTime ?? "");
  }
}, [value]);

const emit = (nextDays: DayOfWeek[], nextTime: string) => {
  const sortedDays = DAY_ORDER.filter((d) => nextDays.includes(d));
  const next =
    sortedDays.length === 0 || !nextTime
      ? undefined                            // Phase A 정수 유지
      : { days: sortedDays, departureTime: nextTime };
  lastValueRef.current = next;               // ㊹ 무한 루프 방지
  onChange(next);
};
```

**4 효과:**
- React 19 안전 정수 — `set-state-in-effect` 규칙 맞음 (deadline-banner.tsx 패턴 답습)
- StrictMode 더블 렌더 우회 (㊸)
- "이전 조건 불러오기" 빈 상태 처리 (㊷)
- 무한 루프 방지 (㊹ — emit 시 ref 박힘)

**form/ 디렉토리 첫 도입:** address-input / mode-selector / filter-chip 등 8 파일 모두 순수 controlled = useEffect 동기화 0건. 본 ISSUE는 부분 입력 보존 필요 = controlled component 한계 = 새 패턴 도입 정당.

### ★★ Phase A 사전 박힘 정수 진화 답습 2회째 § (★ 본 ISSUE 진짜 가치 진화)

| 회차 | ISSUE | 시점 | 입증 |
| --- | --- | --- | --- |
| 1회 | REFACTOR-UI-002-FEEDBACK-2 (#96) | 2026-05-23 | Phase A 사전 박힘 정수 입증 (Mismatch ㉓~㉗ 5건 Phase A 영역, Phase B 자체 grill 0건) |
| 2회 (본 ISSUE) | REFACTOR-DTO-COMMUTE-TIME-FEEDBACK (#100) | 2026-05-24 | Mismatch ㊵~㊹ 5건 Phase A 영역 해소, Phase B 자체 grill 0건 |

→ 본 프로젝트 워크플로 시스템 신뢰성 진화 = 사전 인지 → Phase A 박힘 → Phase B 0건 패턴 진화.

### ★ 사전 검증 baseline (Phase A 진입 시점)

| 검증 | 결과 |
| --- | --- |
| `npx prisma validate` | valid |
| `npx prisma generate` | ./src/generated/prisma 7.8.0 |
| `npx tsc --noEmit` | 0 errors |
| `npx eslint src/components/form/` | 0 errors |
| `npm run build` | 13/13 static pages + Middleware 32.5 kB (19번째 baseline) + Warning 1건 (`_departureTime` kakao-transport baseline stub, 본 ISSUE 무관) |
| L6 cleanup 156 lines | time-range-toggle.tsx 보존 (legacy) |
| git status | untracked 2 (`.agents/skills` + `tasks/ISSUE_REGISTER_LOG.md`), staging 0 = 23칸 가드 맞음 |

### ★ 본 ISSUE 실측 산출물 표 (+32/-13 단일 파일)

| 파일 | 변경 | 사전 案 | 실측 | 차이 |
| --- | --- | --- | --- | --- |
| `commute-schedule-picker.tsx` | M | +15 / -5 | +32 / -13 | +17 / -8 (formatting + 자가 치유 코멘트 명문화) |

---

## 3. 🛠️ Task Breakdown (✅/⏸ 실측 status markers)

| § | 항목 | status | 사유 |
| --- | --- | --- | --- |
| §3.1 | `commute-schedule-picker.tsx` 내부 state 분리 정정 (+32/-13) | ✅ Phase A | 내부 state + useEffect + useRef guard + emit ref 박힘 |
| §3.2 | `app/diagnosis/page.tsx` | ⏸ 변경 0 | controlled API 그대로 (value/onChange 호출 맞음) |
| §3.3 | `lib/types.ts` `CommuteSchedule` | ⏸ 변경 0 | Phase A 사전 박힘 정수 유지 |
| §3.4 | `lib/diagnosis/intersection.ts` `commuteScheduleToDepartureISO` | ⏸ 변경 0 | 백엔드 정수 유지 |
| §3.5 | `lib/mocks/diagnosis/get-diagnosis.ts` | ⏸ 변경 0 | Mismatch ㊲ backward compat |
| §3.6 | `lib/saved-search.ts` | ⏸ 변경 0 | Mismatch ㊳ DB 영향 회피 |
| §3.7 | `lib/validators/diagnosis.ts` | ⏸ 변경 0 | Mismatch ㊴ client store 흡수 |
| §3.8 | `components/form/time-range-toggle.tsx` | ⏸ 변경 0 | L6 legacy 보존 (REFACTOR-COMMUTE-LEGACY 위임) |

→ ★ 정정 1 / ⏸ 7 = 가드 30+종 8 영역 1054 lines 사수 입증

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD — 8 시나리오)

| AC | Given | When | Then |
| --- | --- | --- | --- |
| AC-1 초기 mount value=undefined | filters.commuteSchedule = undefined | 컴포넌트 마운트 | localDays = `new Set()` + localTime = `""` (lazy init), useEffect 동기화 X (ref === undefined) |
| AC-2 초기 mount value 존재 | filters.commuteSchedule = `{days:["fri"], departureTime:"19:00"}` | 컴포넌트 마운트 | localDays = `Set(["fri"])` + localTime = `"19:00"` (lazy init), 동기화 X |
| ★★ AC-3 어제 버그 정정 | 빈 상태 | 사용자 "월" chip 단독 클릭 | localDays = `Set(["mon"])` 즉시 갱신 → active 시각 피드백 ✅, emit → onChange(undefined) (Phase A 정수) |
| AC-4 순차 입력 완성 | "월" 클릭 후 "08:00" 입력 | setTime("08:00") | localTime = "08:00", emit → onChange(`{days:["mon"], departureTime:"08:00"}`) → store 저장 |
| AC-5 "이전 조건 불러오기" (빈 → 채움) | value=undefined, lastValueRef=undefined | 부모 setFilters로 `{days:["fri"], departureTime:"19:00"}` 주입 | useEffect 동기화 실행 (ref ≠ value) → localDays/localTime 동기화 + ref 갱신 |
| AC-6 "이전 조건 불러오기" (채움 → 빈) | value 채움 | 부모 setFilters로 undefined 주입 | useEffect 동기화 → localDays = `new Set()`, localTime = `""` 리셋 |
| AC-7 StrictMode 더블 렌더 | dev 모드 | useEffect 2회 호출 | 첫 호출 ref 갱신 → 둘째 호출 `ref === value` skip (㊸ 해소 입증) |
| AC-8 무한 루프 방지 | emit 호출 | emit L63 `lastValueRef.current = next` → onChange → 부모 리렌더 | value === lastValueRef.current → useEffect skip (㊹ 해소 입증) |

---

## 5. ⚙️ Non-Functional Constraints (NFR)

- **NFR-PERF:** /diagnosis 11.2 kB (141 kB First Load JS) 변화 0 — baseline 맞음
- **NFR-SEC:** client component (`use server` 0건, `createSupabaseServerClient` 0건, `AbortSignal.timeout` 0건)
- **NFR-A11y:** `role="group"` + `aria-label="출퇴근 일정 선택"` / "요일 선택" 보존, button `role="switch"` + `aria-checked` 보존
- **NFR-REACT19:** React 19 안전 정수 — useEffect 내 setState 는 ref guard 조건부 호출 (deadline-banner.tsx 패턴 답습)
- **NFR-BUNDLE:** Middleware 32.5 kB **20번째 답습** (회귀 0)

---

## 6. 📦 Deliverables

### Phase A ✅ (1 파일 +32/-13 실측 완료)
- `onday-app/src/components/form/commute-schedule-picker.tsx` 정정

### Phase B ✅ (자체 grill 7 영역 + 추가 검증 통과)
- 자체 grill: useEffect 양방향 / StrictMode / 빈 상태 / page.tsx 호출 흐름 / 가드 30+종 / Vercel 빌드 / Middleware
- 추가 검증: AC-6 1차 가드 3 + 2차 입증 4 + L6 가드 맞음

### Phase C ✅ (명세 신설)
- `tasks/REFACTOR-DTO-COMMUTE-TIME-FEEDBACK.md` (본 파일)

### Phase D (★ feat+docs 커밋 분리 + Draft PR Refs #100)
- 커밋 1 `feat`: 코드 1 파일 (`commute-schedule-picker.tsx`)
- 커밋 2 `docs`: 명세 1 파일 (`tasks/REFACTOR-DTO-COMMUTE-TIME-FEEDBACK.md`)
- 코드 ↔ 문서 안 섞음
- Draft PR → Ready → 머지 → Vercel 자동 배포 → Issue #100 Close

### Follow-up (TEST-001 + REFACTOR-COMMUTE-LEGACY + UI-003 위임, 선택)
- TEST-001 `commute-schedule-picker.spec.tsx` (단위 테스트 8 시나리오)
- REFACTOR-COMMUTE-LEGACY (Validator + SavedSearch + Mock + time-range-toggle 통합 정리)
- UI-003 (5차 Vercel 확인 타이밍)
- ★ Issue #100 Close 시 정정 댓글 (Mismatch ㊵+㊶+㊷+㊸+㊹ 명문화 + 사전 案 vs 실측 차이 정직 인정)

### ★ 정직성 7 (§9.1~§9.7)
1. 사용자 검증 + 즉시 반영 워크플로 답습 4회째 (§9.1)
2. Mismatch ㊵ Phase A 사전 박힘 정수 vs UX 충돌 자가 치유 (§9.2, ★ 본 ISSUE 진짜 가치)
3. useEffect + useRef guard 패턴 도입 (§9.3)
4. ISSUE 신설 자동화 답습 4회째 (§9.4)
5. Phase A 사전 박힘 정수 진화 답습 2회째 (§9.5, ★ 본 ISSUE 진짜 가치 진화)
6. 가드 30+종 0 lines 사수 (§9.6)
7. ★ 100번째 마일스톤 (§9.7)

---

## 7. 🔗 Dependencies

### 선행 (모두 ✅ 충족):
- DTO-COMMUTE-TIME (#98) 머지 완료 (`bd7be79`)
- Issue #98 정정 댓글 박힘 (#issuecomment-4526836564)
- main 동기화 + `feature/REFACTOR-DTO-COMMUTE-TIME-FEEDBACK` 신규 분기

### 후행 4종:

| 후행 | 트리거 | 산출 |
| --- | --- | --- |
| REFACTOR-COMMUTE-LEGACY | timeRange enum 9 옵션 잔존 정리 (Validator + SavedSearch + Mock + time-range-toggle.tsx) | 후행 ISSUE 신설 |
| UI-003 | 5차 Vercel 확인 + 추가 사용자 피드백 | 후행 검증 |
| TEST-001 | `commute-schedule-picker.spec.tsx` 8 시나리오 단위 테스트 | spec.tsx 위임 |
| ★ Issue #100 Close 정정 댓글 | PR 머지 직후 | Mismatch ㊵+㊶+㊷+㊸+㊹ 명문화 + 사전 案 vs 실측 차이 정직 인정 + Phase A 사전 박힘 정수 진화 답습 2회째 입증 명문화 |

---

## 8. 🧪 Test Plan

### ★ Phase A ✅ (실측) — 검증 7종

| # | 검증 | 결과 |
| --- | --- | --- |
| 1 | `npx prisma validate` | valid |
| 2 | `npx prisma generate` | 7.8.0 |
| 3 | `npx tsc --noEmit` | 0 errors |
| 4 | `npx eslint src/components/form/` | 0 errors |
| 5 | `npm run build` | 13/13 static + Middleware 32.5 kB |
| 6 | L6 cleanup 156 lines | time-range-toggle.tsx 보존 |
| 7 | git status | M 1 + untracked 2 (23칸 가드 맞음) |

### ★ Phase B 자체 grill ✅ (실측) — 7 영역

| # | 영역 | 결과 |
| --- | --- | --- |
| 1 | useEffect 동기화 양방향 (외부/자체) | ref guard 맞음 |
| 2 | StrictMode 더블 렌더 (㊸) | 첫 호출만 실행 |
| 3 | 빈 상태 처리 (㊷) | "이전 조건 불러오기" 양방향 |
| 4 | page.tsx 호출 흐름 | controlled API 변경 0 |
| 5 | 가드 30+종 8 영역 | git diff --stat 빈 출력 (0 lines) |
| 6 | Vercel 빌드 통합 | Compiled + 13/13 static |
| 7 | Middleware 32.5 kB | 20번째 답습 |

### ★ AC-6 정적 grep 7행 표 (1차 가드 3 + 2차 입증 4)

| 영역 | 명령 | 기대 | 실측 |
| --- | --- | --- | --- |
| 1차 ① `use server` | `grep "use server" commute-schedule-picker.tsx` | 0 | 0 |
| 1차 ② `createSupabaseServerClient` | `grep "createSupabaseServerClient" commute-schedule-picker.tsx` | 0 | 0 |
| 1차 ③ `AbortSignal.timeout` | `grep "AbortSignal.timeout" commute-schedule-picker.tsx` | 0 | 0 |
| 2차 ④ 내부 state 박힘 | `grep "localDays\|localTime\|lastValueRef"` | 12+ | 12 매치 |
| 2차 ⑤ emit 가드 박힘 | `grep "sortedDays.length === 0 \|\| !nextTime"` | 1 | L60 |
| 2차 ⑥ useEffect + ref guard | `grep "useEffect\|lastValueRef.current"` | 4+ | L49/L50/L51/L63 |
| 2차 ⑦ 가드 30+종 8 영역 0 lines | `git diff --stat main..HEAD -- <8파일>` | 빈 출력 | 빈 출력 |

### 타입 / 빌드 검증

- TypeScript strict: 0 errors
- ESLint: 0 errors (Warning 1건 = `_departureTime` baseline stub, 본 ISSUE 무관)
- Next build: 13/13 static + Middleware 32.5 kB

### TEST-001 spec.tsx 위임 (★ 답습 23회째, 선택)
- `commute-schedule-picker.spec.tsx` 8 시나리오 (AC-1~AC-8) 단위 테스트
- React Testing Library + @testing-library/user-event
- StrictMode wrapper 시나리오 AC-7 검증

---

## 9. 🚧 Open Questions / Risks + ★ Phase C 정직 기록 § (7종)

### §9.A — Open Questions / Risks (보류 → REFACTOR-COMMUTE-LEGACY 위임)

- timeRange enum 9 옵션 잔존 4 파일 (Validator + SavedSearch + Mock + time-range-toggle.tsx) 통합 정리 위임
- TEST-001 `commute-schedule-picker.spec.tsx` 단위 테스트 위임

### ★ §9.B — Phase C 정직 기록 § (7종)

#### §9.1 사용자 검증 + 즉시 반영 워크플로 답습 4회째 §
- 1회 #94 metro-dong, 2회 #96 REFACTOR-UI-002-FEEDBACK-2, 3회 #98 DTO-COMMUTE-TIME, 4회 본 ISSUE
- 사용자 검증 → ISSUE 신설 → grill → Phase A~D → 머지 → Vercel 자동 배포 → 다음 검증 순환
- 본 ISSUE 특이점: 머지 후 Vercel 자동 배포 시점 발견 ("정정의 정정" 자가 치유)

#### ★★★ §9.2 Mismatch ㊵ Phase A 사전 박힘 정수 vs UX 충돌 자가 치유 § (★ 본 ISSUE 진짜 가치)
- §2 Mismatch ㊵ § 본격 박힘 답습
- ★ 3 정수 동시 달성: controlled API + Phase A 사전 박힘 + UX 즉시 피드백
- 미래 작업자 학습 명문화: "Phase A 사전 박힘 = 컴파일 차원 정수. 단 UX 차원 미커버 = Phase B 사용자 검증 필수."

#### ★★ §9.3 useEffect + useRef guard 패턴 도입 § (Q3 (vi) 결정)
- form/ 디렉토리 첫 도입 (8 파일 모두 순수 controlled = useEffect 동기화 0건)
- 4 효과: React 19 안전 정수 + StrictMode 우회 + 빈 상태 처리 + 무한 루프 방지
- 미래 form 컴포넌트 학습 가치 (controlled component 한계 = 부분 입력 보존 시점)

#### §9.4 ISSUE 신설 자동화 답습 4회째 § (#94 + #96 + #98 + #100)
- 본 세션 신설 = #100 (★ 100번째 마일스톤)
- 라벨 3종 (track:diagnosis-ui + wave:4 + complexity:l) + 보드 Todo 자동 박힘
- 4회째 신뢰성 입증

#### ★★ §9.5 Phase A 사전 박힘 정수 진화 답습 2회째 § (★ 본 ISSUE 진짜 가치 진화)
- 1회 #96: Phase A 사전 박힘 정수 입증 (Mismatch ㉓~㉗ 5건)
- 2회 본 ISSUE #100: Mismatch ㊵~㊹ 5건 모두 Phase A 영역 해소
- 본 프로젝트 워크플로 시스템 신뢰성 진화 = 사전 인지 → Phase A 박힘 → Phase B 0건 패턴

#### §9.6 가드 30+종 0 lines 사수 § (1054 lines 8 영역)
- §3.2~§3.8 7 영역 ⏸ 변경 0 (page.tsx + types.ts + intersection.ts + Mock + SavedSearch + Validator + time-range-toggle)
- §3.1 commute-schedule-picker.tsx 단일 +32/-13 = 본 ISSUE 본질
- git diff --stat 빈 출력 입증

#### ★ §9.7 100번째 마일스톤 § (Issue #100)
- 본 프로젝트 100번째 마일스톤
- 본 ISSUE = "Phase A 사전 박힘 정수 진화 답습 2회째" 박힘

### ★ §9.C — 사전 案 vs 실측 정직 인정 §

| 항목 | 사전 案 | 실측 | 차이 | 사유 |
| --- | --- | --- | --- | --- |
| insertions | +15 | +32 | +17 | 코멘트 4 lines (㊵+㊹ 자가 치유 명문화) + ternary multi-line formatting + useRef + useEffect + setter 분리 |
| deletions | -5 | -13 | -8 | 기존 emit 6 lines 통째 교체 + days/departureTime const 2 lines |

→ 차이 본질 = formatting + 자가 치유 코멘트 명문화

### Follow-up 4 (§9.B + §6)

1. REFACTOR-COMMUTE-LEGACY (Validator + SavedSearch + Mock + time-range-toggle 통합 정리)
2. UI-003 (5차 Vercel 확인 타이밍)
3. TEST-001 spec.tsx 위임 (8 시나리오 단위 테스트)
4. ★ Issue #100 Close 시 정정 댓글 — Mismatch ㊵~㊹ 5건 명문화 + 사전 案 vs 실측 차이 정직 인정 + Phase A 사전 박힘 정수 진화 답습 2회째 입증 명문화 + 100번째 마일스톤 명문화

---

**문서 끝.** Phase C 명세 신설 ✅. Phase D 진입 대기 (르르 검수 + 컨디션 답 후).
