# REFACTOR-COMMUTE-LEGACY — timeRange @deprecated 완전 제거 + commuteSchedule 단일 진리 도달 (Mismatch ㊿ 본 ISSUE 내 해소)

> **Issue:** [#102](https://github.com/kmh89927a/Onday-design-Project/issues/102)
> **Branch:** `feature/REFACTOR-COMMUTE-LEGACY`
> **Wave:** 4 / **Track:** diagnosis-be / **Complexity:** M (~1~1.5h)
> **Origin Issues:** [#98 DTO-COMMUTE-TIME](https://github.com/kmh89927a/Onday-design-Project/issues/98) (PR #99) + [#100 REFACTOR-DTO-COMMUTE-TIME-FEEDBACK](https://github.com/kmh89927a/Onday-design-Project/issues/100) (PR #101)

---

## 1. 🎯 Summary

DTO-COMMUTE-TIME (#98, PR #99) 머지 시 결정한 `timeRange` @deprecated 보존 (Phase B 자가 치유 ㊲㊳㊴ backward compat) → 본 ISSUE 에서 정리 = DTO 단일 진리 도달.

5 파일 정정 + 1 파일 삭제 + ★ Phase A 추가 정정 1 (migrate 헬퍼) — `lib/types.ts` `DiagnosisFilters.timeRange?` 제거 + `lib/types/saved-search.ts` `SearchParams.filters` 정정 + `lib/validators/diagnosis.ts` Zod 스키마 commuteSchedule 정정 + `lib/mocks/diagnosis/get-diagnosis.ts` Mock data 정정 + `components/form/time-range-toggle.tsx` 파일 자체 삭제 + `components/form/commute-schedule-picker.tsx` 코멘트 정정 + ★ `app/diagnosis/page.tsx` migrateLegacyTimeRange 헬퍼 박힘 (㊿ 자가 치유).

### ★ 본 ISSUE 메타 (메타 8종)

- DTO 단일 진리 도달 (★ 본 ISSUE 진짜 가치)
- 본 세션 자가 치유 시스템 완성
- ISSUE 신설 자동화 답습 5회째 (#94 + #96 + #98 + #100 + #102)
- Phase A 사전 박힘 정수 진화 답습 3회째 완전 입증 (★ ㊿ 본 ISSUE 내 해소 답습 정점)
- 르르 사용 의지 우선 정수 (★ ㊿ 정직 정정 답습)
- Mismatch ㊺~㊿ 6건 추적 (★ ㊺~㊾ Phase A 사전 인지 + ㊿ Phase B 새 발견 → 본 ISSUE 내 해소)
- L6 cleanup 가드 의미 진화 (★ legacy 파일 제거 OK + legacy 데이터 자가 치유 헬퍼 박힘)
- 가드 30+종 0 lines 사수 (7 영역)

### ★ Mismatch ㊺~㊿ 6건 (Phase A 사전 인지 5 + Phase B 새 발견 1 → 본 ISSUE 내 해소)

- ㊺ SavedSearch DB 스키마 영향 → 실측 (가) 확정 (Prisma `searchParams String` JSON 직렬화)
- ㊻ Validator Zod 스키마 commuteSchedule 정의 → days `.min(1)` + departureTime regex `/^HH:MM$/` + `.optional()`
- ㊼ time-range-toggle.tsx 정리 → 실측 (A) 확정 (호출처 코드 0건 → 파일 삭제)
- ㊽ Mock get-diagnosis.ts → commuteSchedule: `{ days:평일, 08:00 }` 정정
- ㊾ page.tsx timeRange 잔존 → 실측 해소 (코멘트 1건만, 코드 0건)
- ㊿ SavedSearch localStorage backward compat → Phase B 자체 grill 새 발견 → ★ Phase A 추가 정정으로 **본 ISSUE 내 해소 답습** (migrate 헬퍼 30 lines + 5 시나리오 맞음)

### 자가 치유 누적

- DTO-COMMUTE-TIME #98 시점: 62건
- REFACTOR-DTO-COMMUTE-TIME-FEEDBACK #100 시점: 67건 (+5)
- **본 ISSUE 추가: 67 + 6 = 73건** (㊺~㊾ 5건 Phase A 사전 인지 + ㊿ 1건 Phase B 새 발견 → 본 ISSUE 내 해소)

---

## 2. 🔗 References (Spec & Context)

### ★ Issue #102 (본 ISSUE 신설 원본)
- Title: `[REFACTOR] DTO-COMMUTE-TIME legacy 통합 정리 — timeRange @deprecated 제거 + commuteSchedule 단일 진리 도달`
- Labels: `track:diagnosis-be` + `wave:4` + `complexity:m`
- Origin: #98 + #100 머지 완료 후 자연 후행

### ★ Q1~Q5 결정 표

| Q | 분기 | 결정 | 근거 |
| --- | --- | --- | --- |
| Q1 작업 모드 | A/B/C/D | (B) 풀세트 | 답습 24회째 + 자가 치유 시스템 완성 + DTO 단일 진리 |
| Q2 디렉토리 + 사전 작업 | 영역 선정 | 6 파일 영역 + Phase A 추가 정정 1 (㊿) | 단일 진리 정수 + 가드 30+종 7 영역 사수 |
| Q3-a SavedSearch DB 영향 | (가)/(나) | (가) DB 스키마 변경 X | 실측 (Prisma `searchParams String` JSON 직렬화) |
| Q3-b time-range-toggle.tsx | 정리/보존 | (A) 정리 (파일 삭제) | 실측 호출처 코드 0건 + 단일 진리 + L6 가드 맞음 |
| Q4 산출 파일 | 단일/분할 | 6 정정 + 1 삭제 (+ Phase A 추가 정정 1 = 7 정정 + 1 삭제) | 가드 30+종 7 영역 사수 |
| Q5 Phase 구성 | A/B/C/D | A → B → C → D | 답습 24회째 |

### ★ Mismatch ㊺~㊿ 6건 추적 표

| Mismatch | 영역 | 본질 | 처리 |
| --- | --- | --- | --- |
| ㊺ | Q3-a SavedSearch DB | DB 스키마 영향 (가)/(나) | ✅ 실측 (가) 확정 (Prisma `searchParams String`) |
| ㊻ | Validator Zod | commuteSchedule 정의 | ✅ days `.min(1)` + departureTime regex + `.optional()` |
| ㊼ | time-range-toggle.tsx | 정리/보존 | ✅ 실측 (A) 정리 (호출처 코드 0건) |
| ㊽ | Mock get-diagnosis.ts | timeRange → commuteSchedule | ✅ `{ days:평일, 08:00 }` |
| ㊾ | page.tsx 잔존 | timeRange 코드 잔존 | ✅ 실측 해소 (코멘트 1건만) |
| ㊿ | SavedSearch localStorage backward compat | 기존 사용자 timeRange 박힌 localStorage 변환 | ✅ ★ Phase A 추가 정정 — **본 ISSUE 내 해소** (migrate 헬퍼 30 lines + 5 시나리오) |

### ★★ Mismatch ㊿ 해소 답습 § (★ 본 ISSUE 진짜 가치 진화)

**Phase B 자체 grill 새 발견 (사전):**
- 기존 사용자 localStorage 에 `timeRange:'morning'` 박힌 상태로 저장 → 머지 후 "이전 조건 불러오기" 시 commuteSchedule 박힘 X → 사용자 재입력 필요 (기능 차단 X, 미세 UX)
- 사전 추천: 후속 ISSUE 분리 + "영향 매우 소수" 추정

**★ 르르 정정 (르르 사용 의지 우선 정수):**
> "이전 조건 불러오기는 잘 사용할것 같아 그거없애면 안돼"

**★ 본 ISSUE 내 해소 답습 (B-1 변환 헬퍼 추가):**
- `page.tsx` migrateLegacyTimeRange 헬퍼 30 lines 박힘
- 5 시나리오 맞음 (★ AC-X)
- "정정의 정정" 자가 치유 답습

**미래 작업자 학습:**
- "사용자 영향 영역 = 무조건 사전 확인 = 추정 X."

### ★★ DTO 단일 진리 도달 § (★ 본 ISSUE 진짜 가치)

**사전:** DiagnosisFilters.timeRange? @deprecated + 호출처 backward compat (㊲㊳㊴)
**본 ISSUE:** timeRange? 제거 + commuteSchedule 단일 박힘 + 호출처 정정 + migrate 헬퍼 자가 치유 = **단일 진리 도달**

**미래 작업자 학습:**
- "@deprecated 보존 = 한시적 + REFACTOR ISSUE 발행 = 단일 진리 도달 정수"

### ★★ L6 cleanup 가드 의미 진화 §

| 진화 단계 | 정의 |
| --- | --- |
| 사전 (DTO-COMMUTE-TIME #98) | "정리된 156 lines 재추가 금지" |
| 본 ISSUE | "정리된 라인 재추가 금지" + **"사용 안 되는 legacy 파일 제거 OK" (★ time-range-toggle.tsx -61 lines)** + **"legacy 데이터 자가 치유 헬퍼 박힘" (★ migrate 헬퍼 +30 lines)** |

**미래 작업자 학습:**
- "L6 가드 = 단일 진리 답습 + legacy 자가 치유 헬퍼 박힘"

### ★ 사전 검증 baseline (Phase A 진입 시점)

| 검증 | 결과 |
| --- | --- |
| `npx prisma validate` | valid |
| `npx prisma generate` | 7.8.0 |
| `npx tsc --noEmit` | 0 errors |
| `npx eslint src/lib/ src/components/form/` | 0 errors (Warning 4건 = baseline `_*` stub) |
| `npm run build` | 13/13 static + Middleware 32.5 kB (20번째 baseline) + /diagnosis 11.2 kB |
| L6 cleanup 156 lines | time-range-toggle.tsx 보존 (legacy) |
| git status | untracked 2 (24칸 가드) |

### ★ 본 ISSUE 실측 산출물 표 (+46/-132 7 파일)

| 파일 | 변경 | 사전 案 | 실측 |
| --- | --- | --- | --- |
| `lib/types.ts` | 정정 | -2 | +1/-2 |
| `lib/types/saved-search.ts` | 정정 | +3/-1 | +2/-1 |
| `lib/validators/diagnosis.ts` | 정정 | +6/-1 | +7/-1 |
| `lib/mocks/diagnosis/get-diagnosis.ts` | 정정 | +1/-1 | +1/-1 |
| `components/form/time-range-toggle.tsx` | 삭제 | -111 (추정) | -61 (실측) |
| `components/form/commute-schedule-picker.tsx` | 코멘트 정정 | +1/-1 | +1/-1 |
| ★ `app/diagnosis/page.tsx` (Phase A 추가 정정) | ㊿ migrate 헬퍼 | +25~30 | +33/-1 |
| **합계** | 7 파일 | ≈ +44/-131 | **+46/-132** |

---

## 3. 🛠️ Task Breakdown (✅/⏸ 실측 status markers)

| § | 항목 | status | 사유 |
| --- | --- | --- | --- |
| §3.1 | `lib/types.ts` DiagnosisFilters.timeRange? + @deprecated 제거 (+1/-2) | ✅ Phase A | 단일 진리 |
| §3.2 | `lib/types/saved-search.ts` SearchParams.filters 정정 (+2/-1) | ✅ Phase A | CommuteSchedule import + timeRange → commuteSchedule |
| §3.3 | `lib/validators/diagnosis.ts` Zod 스키마 정정 (+7/-1) | ✅ Phase A | ㊻ days `.min(1)` + departureTime regex + `.optional()` |
| §3.4 | `lib/mocks/diagnosis/get-diagnosis.ts` Mock data 정정 (+1/-1) | ✅ Phase A | ㊽ commuteSchedule `{ days:평일, 08:00 }` |
| §3.5 | `components/form/time-range-toggle.tsx` 파일 삭제 (-61) | ✅ Phase A | ㊼ git rm (호출처 코드 0건) |
| §3.6 | `components/form/commute-schedule-picker.tsx` L11 코멘트 정정 (+1/-1) | ✅ Phase A | 참조 깨짐 방지 + shadcn 톤 |
| ★ §3.7 | `app/diagnosis/page.tsx` migrate 헬퍼 신규 (+33/-1) | ✅ Phase A 추가 정정 | ㊿ 자가 치유 (migrateLegacyTimeRange 30 lines + handleLoadLast 정정 + import) |
| §3.8 | `lib/diagnosis/intersection.ts` | ⏸ 변경 0 | 백엔드 맞음 유지 (가드 30+종) |

→ 정정 6 + 삭제 1 + ⏸ 가드 7 영역

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

| AC | Given | When | Then |
| --- | --- | --- | --- |
| AC-1 timeRange 제거 입증 | DiagnosisFilters 타입 | grep `timeRange` src/ | 코드 잔존 0건 (코멘트 3건만 = history) |
| AC-2 commuteSchedule 박힘 | 7 영역 | grep `commuteSchedule\|CommuteSchedule` | 37 매치 |
| AC-3 time-range-toggle 파일 부재 | components/form/ | `ls time-range-toggle.tsx` | "No such file or directory" |
| AC-4 Validator Zod 맞음 | client → server POST | Zod parse | commuteSchedule `.optional()` + days `.min(1)` + departureTime regex 통과 |
| AC-5 Mock get-diagnosis 맞음 | DiagnosisDTO satisfies | tsc | 0 errors |
| ★ AC-X ㊿ migrate 헬퍼 5 시나리오 | localStorage 데이터 | handleLoadLast | (1)~(5) 모두 맞음 |
| AC-X-① "morning" | `{ timeRange: "morning" }` | migrateLegacyTimeRange | `{ commuteSchedule: { days: 평일, departureTime: "08:00" } }` |
| AC-X-② "evening" | `{ timeRange: "evening" }` | migrateLegacyTimeRange | `{ commuteSchedule: { days: 평일, departureTime: "18:00" } }` |
| AC-X-③ "flexible"/기타 | `{ timeRange: "flexible" }` | migrateLegacyTimeRange | `{}` (사용자 재입력) |
| AC-X-④ commuteSchedule 사전 박힘 | `{ commuteSchedule: {...} }` | migrateLegacyTimeRange | 그대로 (본 ISSUE 이후 데이터) |
| AC-X-⑤ timeRange 없음 | `{ maxCommuteTime: 60 }` | migrateLegacyTimeRange | 그대로 |

---

## 5. ⚙️ Non-Functional Constraints (NFR)

- **NFR-PERF:** /diagnosis 11.2 → 11.3 kB (+0.1 kB) — ★ migrate 헬퍼 30 lines 영향 (정직 인정)
- **NFR-SEC:** client component (`use server` 0 / `createSupabaseServerClient` 0 / `AbortSignal.timeout` 0)
- **NFR-A11y:** picker 맞음 유지 (Issue #100 답습)
- **NFR-VALIDATION:** Validator Zod 양방향 정수 박힘 — Client 단 emit 가드 + Server 단 Zod schema 검증
- **NFR-BUNDLE:** Middleware 32.5 kB 22번째 답습 (회귀 0)
- **NFR-MIGRATION:** legacy localStorage 데이터 자가 치유 (migrate 헬퍼 5 시나리오 맞음)

---

## 6. 📦 Deliverables

### Phase A ✅ (5 정정 + 1 삭제 = 6 영역)
- `lib/types.ts` + `lib/types/saved-search.ts` + `lib/validators/diagnosis.ts` + `lib/mocks/diagnosis/get-diagnosis.ts` + `components/form/commute-schedule-picker.tsx` + `components/form/time-range-toggle.tsx` (삭제)

### Phase A 추가 정정 ✅ (★ ㊿ 자가 치유)
- `app/diagnosis/page.tsx` migrateLegacyTimeRange 헬퍼 + handleLoadLast 정정 + DiagnosisFilters import

### Phase B ✅ (재진입 자체 grill 5 영역 + ㊿ 해소 5 시나리오 + AC-6 grep)
- 자체 grill: SavedSearch JSON 직렬화 / Mock get-diagnosis / picker 코멘트 / types timeRange 제거 / Validator Zod
- 추가 검증: AC-6 1차 가드 3 + 2차 입증 5 + L6 가드 의미 진화 + Middleware 22번째

### Phase C ✅ (명세 신설)
- `tasks/REFACTOR-COMMUTE-LEGACY.md` (본 파일)

### Phase D (★ feat+docs 커밋 분리 + Draft PR Refs #102)
- 커밋 1 `feat`: 코드 6 정정 + 1 삭제 (+ Phase A 추가 정정 page.tsx 포함)
- 커밋 2 `docs`: 명세 1 파일
- 코드 ↔ 문서 안 섞음
- Draft PR → Ready → 머지 → Vercel 자동 배포 → Issue #102 Close

### Follow-up (★ 정정 — REFACTOR-COMMUTE-LEGACY-MIGRATION 제거)
- UI-003 (6차 Vercel 확인 타이밍)
- CMD-DIAG-003 (Scoring + mapper.ts)
- ★ Issue #102 Close 시 정정 댓글 (㊿ 해소 답습 명문화 + 사전 案 vs 실측 차이 + 르르 사용 의지 우선 답습)
- ~~REFACTOR-COMMUTE-LEGACY-MIGRATION~~ (★ 본 ISSUE 내 해소 답습으로 제거)

### ★ 정직성 8 (§9.1~§9.8)
1. DTO 단일 진리 도달 (§9.1, ★ 본 ISSUE 진짜 가치)
2. Validator Zod 양방향 정수 (§9.2)
3. L6 cleanup 가드 의미 진화 (§9.3)
4. ★★★ Phase A 사전 박힘 정수 진화 답습 3회째 완전 입증 + ㊿ 본 ISSUE 내 해소 (§9.4, ★ 본 ISSUE 진짜 가치 진화 정점)
5. ISSUE 신설 자동화 답습 5회째 (§9.5)
6. 본 세션 자가 치유 시스템 완성 (§9.6)
7. 가드 30+종 0 lines 사수 (§9.7)
8. 르르 사용 의지 우선 정수 (§9.8, ★ NEW)

---

## 7. 🔗 Dependencies

### 선행 (모두 ✅ 충족):
- DTO-COMMUTE-TIME (#98) 머지 완료 (`bd7be79`)
- REFACTOR-DTO-COMMUTE-TIME-FEEDBACK (#100) 머지 완료 (`419f6d0`)
- Issue #98 정정 댓글 박힘
- Issue #100 정정 댓글 박힘

### 후행 3종 (★ REFACTOR-COMMUTE-LEGACY-MIGRATION 제거):

| 후행 | 트리거 | 산출 |
| --- | --- | --- |
| UI-003 | 6차 Vercel 확인 + 추가 사용자 피드백 | 후행 검증 |
| CMD-DIAG-003 | Scoring + mapper.ts | 후행 ISSUE |
| ★ Issue #102 Close 정정 댓글 | PR 머지 직후 | ㊿ 해소 답습 명문화 + 사전 案 vs 실측 차이 + 르르 사용 의지 우선 + Phase A 사전 박힘 정수 진화 답습 3회째 완전 입증 |

---

## 8. 🧪 Test Plan

### ★ Phase A ✅ (실측) — 검증 7종 + 추가 정정 1

| # | 검증 | 결과 |
| --- | --- | --- |
| 1 | `npx prisma validate` | valid |
| 2 | `npx prisma generate` | 7.8.0 |
| 3 | `npx tsc --noEmit` | 0 errors |
| 4 | `npx eslint src/lib/ src/components/form/` | 0 errors |
| 5 | `npm run build` | 13/13 static + Middleware 32.5 kB |
| 6 | L6 cleanup 156 lines | time-range-toggle.tsx 보존 → 삭제 (legacy 파일 제거) |
| 7 | git status | M 5 + D 1 + untracked 2 (24칸 가드) |
| ★ A+ | Phase A 추가 정정 (page.tsx migrate 헬퍼) | ✅ tsc 0 + eslint 0 + build + grep + 가드 |

### ★ Phase B 자체 grill ✅ (재진입 실측) — 5 영역 + ㊿ 해소

| # | 영역 | 결과 |
| --- | --- | --- |
| 1 | SavedSearch JSON 직렬화 | ✅ ㊿ 본 ISSUE 내 해소 (migrate 헬퍼) |
| 2 | Mock get-diagnosis | ✅ satisfies DiagnosisDTO + tsc |
| 3 | commute-schedule-picker.tsx 코멘트 | ✅ 참조 깨짐 X |
| 4 | types.ts timeRange 제거 | ✅ DiagnosisFilters L45~50 commuteSchedule만 |
| 5 | Validator Zod 스키마 | ✅ days `.min(1)` + departureTime regex + `.optional()` |
| ★ ㊿ | migrate 헬퍼 5 시나리오 | ✅ ①~⑤ 모두 맞음 |

### ★ AC-6 정적 grep 7행 표 (1차 가드 3 + 2차 입증 5)

| 영역 | 명령 | 기대 | 실측 |
| --- | --- | --- | --- |
| 1차 ① `use server` | grep | 0 | 0 |
| 1차 ② `createSupabaseServerClient` | grep | 0 | 0 |
| 1차 ③ `AbortSignal.timeout` | grep | 0 | 0 |
| 2차 ① DiagnosisFilters.timeRange? 제거 | grep types.ts | 0 | 0 (commuteSchedule만 박힘) |
| 2차 ② commuteSchedule 박힘 (7 파일) | grep | 21+ | 37 매치 |
| 2차 ③ time-range-toggle.tsx 파일 부재 | ls | not found | "No such file or directory" |
| 2차 ④ ★ NEW migrate 헬퍼 박힘 (page.tsx L27~57) | grep | 30+ | 31 lines |
| 2차 ⑤ 가드 30+종 7 영역 0 lines | git diff --stat | 빈 출력 | 빈 출력 |

### 타입 / 빌드 검증

- TypeScript strict: 0 errors
- ESLint: 0 errors (Warning 4건 = baseline `_*` stub, 본 ISSUE 무관)
- Next build: 13/13 static + Middleware 32.5 kB (★ 22번째)
- /diagnosis 11.3 kB (+0.1 kB 정직 인정)

### TEST-001 spec.tsx 위임 (선택)
- `commute-schedule-picker.spec.tsx` 8 시나리오 (Issue #100 follow-up)
- `migrate-legacy-time-range.spec.ts` 5 시나리오 (★ NEW, 본 ISSUE follow-up)

---

## 9. 🚧 Open Questions / Risks + ★ Phase C 정직 기록 § (8종)

### §9.A — Open Questions / Risks

- 본 ISSUE 머지 후 5차 사용자 검증 시점 = ㊿ migrate 헬퍼 실제 동작 입증
- TEST-001 spec.tsx 위임 (단위 테스트)

### ★ §9.B — Phase C 정직 기록 § (8종)

#### §9.1 DTO 단일 진리 도달 § (★ 본 ISSUE 진짜 가치)
- @deprecated 보존 (DTO-COMMUTE-TIME #98 시점 결정) → 본 ISSUE 정리 = 단일 진리 도달
- 미래 작업자 학습: "@deprecated 보존 = 한시적 + REFACTOR ISSUE 발행 = 단일 진리 도달 정수"

#### §9.2 Validator Zod 양방향 정수 §
- Client 단: emit 가드 (둘 다 채워질 때만 store 저장 — Issue #100)
- Server 단: Zod schema (days `.min(1)` + departureTime regex `/^HH:MM$/` + `.optional()`)
- 양방향 정수 박힘 완성

#### §9.3 L6 cleanup 가드 의미 진화 §
- 사전 (#98): "정리된 156 lines 재추가 금지"
- 본 ISSUE: + "사용 안 되는 legacy 파일 제거 OK" (time-range-toggle.tsx -61) + "legacy 데이터 자가 치유 헬퍼 박힘" (migrate +30)
- 미래 작업자 학습: "L6 가드 = 단일 진리 답습 + legacy 자가 치유 헬퍼 박힘"

#### ★★★ §9.4 Phase A 사전 박힘 정수 진화 답습 3회째 완전 입증 + ㊿ 본 ISSUE 내 해소 § (★ 본 ISSUE 진짜 가치 진화 정점)
- 1회 (#96): 0건 ✅
- 2회 (#100): 0건 ✅
- **3회 (본 ISSUE)**: ㊿ 1건 → **본 ISSUE 내 해소** ✅ (Phase A 추가 정정 migrate 헬퍼 30 lines + 5 시나리오 맞음)
- 미래 작업자 학습: "한계 발견 시 본 ISSUE 내 해소 답습 = 르르 사용 의지 우선 정수 + '정정의 정정' 자가 치유 답습"

#### §9.5 ISSUE 신설 자동화 답습 5회째 § (#94 + #96 + #98 + #100 + #102)
- 본 세션 신설 = #102
- 라벨 3종 (track:diagnosis-be + wave:4 + complexity:m) + 보드 Todo 자동 박힘
- 5회째 신뢰성 입증

#### §9.6 본 세션 자가 치유 시스템 완성 §
- DTO-COMMUTE-TIME #98 (DTO 본질 정정) → REFACTOR-DTO-COMMUTE-TIME-FEEDBACK #100 (UX 충돌 자가 치유) → 본 ISSUE #102 (legacy 통합 정리 + migrate 헬퍼)
- 본 세션 = "사전 박힘 → UX 검증 → legacy 정리" 3단계 완성

#### §9.7 가드 30+종 0 lines 사수 § (7 영역)
- intersection.ts + kakao-transport client.ts + types/diagnosis.ts + saved-search-api.ts + user.ts + share-link.ts + (page.tsx는 본 정정 영역이므로 제외)
- git diff --stat 빈 출력 입증

#### ★★ §9.8 르르 사용 의지 우선 정수 § (★ NEW)
- 사전 추천 (㊿ 발견 시): (A) 후속 ISSUE 분리 + "영향 매우 소수" 추정
- **르르 정정:** "이전 조건 불러오기는 잘 사용할것 같아 그거없애면 안돼"
- 정직 정정: 본 ISSUE 내 해소 (B-1) 변환 헬퍼 추가
- **미래 작업자 학습:** "사용자 영향 영역 = 무조건 사전 확인 = 추정 X"

### ★ §9.C — 사전 案 vs 실측 정직 인정 §

| 항목 | 사전 案 | 실측 | 차이 | 사유 |
| --- | --- | --- | --- | --- |
| insertions | +11 (Phase A) | +46 | +35 | Phase A 추가 정정 (page.tsx migrate 헬퍼 +33) + 코멘트 정정 추가 |
| deletions | -117 (Phase A) | -132 | -15 | time-range-toggle.tsx 실측 -61 (사전 -111 추정 → 실측 -61) + Phase A 추가 정정 -1 + 코멘트 -2 |
| 파일 수 | 6 | 7 | +1 (Phase A 추가 정정 page.tsx) |
| /diagnosis bundle | 11.2 kB | 11.3 kB | +0.1 kB (migrate 헬퍼 영향) |

→ 차이 본질 = Phase A 추가 정정 (㊿ 자가 치유) + 사전 추정 오차 정직

### Follow-up 3 (★ REFACTOR-COMMUTE-LEGACY-MIGRATION 제거)

1. UI-003 (6차 Vercel 확인 타이밍)
2. CMD-DIAG-003 (Scoring + mapper.ts)
3. ★ Issue #102 Close 시 정정 댓글 — ㊺~㊿ 6건 명문화 + 사전 案 vs 실측 차이 정직 인정 + Phase A 사전 박힘 정수 진화 답습 3회째 완전 입증 + 르르 사용 의지 우선 정수 명문화

---

**문서 끝.** Phase C 명세 신설 ✅. Phase D 진입 대기 (르르 검수 + 컨디션 답 후).
