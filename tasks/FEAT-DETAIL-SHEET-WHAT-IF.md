# FEAT-DETAIL-SHEET-WHAT-IF — DetailSheet TimeSlotSelector 진짜 재계산 + 양방향 동기화

## 1. 🎯 Summary

DetailSheet 내부 TimeSlotSelector(4 옵션 chip: 07:00/08:00/09:00/10:00)가 어제까지 `notifyComingSoon` toast만 박힘 = 진짜 재계산 X. 본 ISSUE = chip 클릭 시 `handleTimeWhatIf` 재사용 (★ #111+#118 패턴 답습) + 위 input ↔ 아래 chip 양방향 동기화 박힘.

### ★ 본 ISSUE 메타 가치 6종

1. ★ ★ 사용자 본질 짚음 답습 정수 § (★ 어제 르르 사전 짚음 + 오늘 "4 옵션 中 일치 시 자동 선택" 본질)
2. ★ ★ Phase A 사전 박힘 진화 답습 11회 성공 § (★ 사전 案 vs 실제 정합)
3. ★ #111+#118 패턴 답습 정수 § (★ handleTimeWhatIf 재사용 + key 재마운트)
4. ★ 사용자 검증 + 즉시 반영 워크플로 답습 14회째 §
5. ★ ISSUE 신설 자동화 답습 13회째 §
6. ★ 가드 30+종 8 영역 사수 §

### ★ Mismatch — 0건 (★ Phase A 사전 박힘 진화 답습 11회 성공)

사전 案 (TimeSlotSelector.tsx + DetailSheet 정정 추정) vs 실제 (변경 0 + result-content.tsx 1 파일 정정) = ★ Q-A (A) Tabs 4 옵션 유지 + Q-B (ii) currentDepartureTime 통합 결정 자연 정합 = 가장 단순 답습 정수.

### 자가 치유 누적

- #108 → #110 → #114 → #111 → #118 → **#120** = 본 세션 6 ISSUE 누적 진화 답습 정점

---

## 2. 🔗 References (Spec & Context)

### Issue #120 (본 ISSUE 신설 원본)

- GitHub: https://github.com/kmh89927a/Onday-design-Project/issues/120
- 신설 시점: 2026-05-26 (★ PR #119 머지 + 어제 르르 사전 짚음 답습)

### ★ Q1~Q5 + Q-A/Q-B 결정 표

| Q | 결정 | 사유 |
|---|---|---|
| Q1 | (B) 풀세트 (답습 33회째) | 패턴 답습 명세 가치 + Phase B 한계 § 답습 |
| Q3 | (가) 단순 복사 사전 案 자연 무효화 | ★ Q4 (B) 채택 시 single-result-view.tsx 정정 X = 자연 |
| Q4 | (B) DetailSheet TimeSlotSelector 정정 | ★ ★ 사용자 어제 짚음 진짜 본질 (★ 카드 클릭 = DetailSheet) |
| Q-A | (A) Tabs 4 옵션 유지 + 즉시 onConfirm | ★ 4 옵션 chip 가치 보존 + 가장 단순 |
| Q-B | (ii) currentDepartureTime 통합 | ★ filters single source of truth + 4 옵션 외 시 chip 선택 X 자연 |
| Q5 | A → B → C → D | 답습 33회째 |

### ★ ★ Phase B 한계 § 6 ISSUE 누적 학습 정점 § (★ §9.5)

| ISSUE | 본질 |
|---|---|
| #108 | Phase B 자체 grill 한계 정직 정수 § NEW (★ 진짜 가치 정점) |
| #110 | Phase A 사전 박힘 정수 진화 답습 7회째 완전 입증 |
| #114 | Phase B 한계 § 답습 정수 진짜 본질 입증 정점 (★ 3 ISSUE 누적) |
| #111 | β 확장 정수 정점 + Phase B 한계 § 4 ISSUE 누적 학습 정점 |
| #118 | "변경" 버튼 + React 19 답습 정수 (★ ㊠ Phase A 즉시 해소) + Phase B 한계 § 5 ISSUE 누적 학습 정점 |
| **#120** | ★ ★ 본 ISSUE — 양방향 동기화 + Phase A 사전 박힘 진화 답습 11회 성공 + Phase B 한계 § 6 ISSUE 누적 학습 정점 |

### ★ 사용자 본질 짚음 §

- 어제: "결과값 카드 클릭하면 거기에도 출근시간 시뮬레이션 박힘. 거기까지는 연동 X. 나중에 할 일?"
- 오늘 본질: "위 input 값 = 4 옵션 中 일치 시 → 자동 선택 박힘 + 4 옵션 외 → 선택 박힘 X (★ 자연) + chip 클릭 → 양방향 동기화"

### ★ #111+#118 패턴 답습 정수 §

- #111 β: 자유 입력 + runMockDiagnosis client-side 재계산
- #118 명시적 확인: "변경" 버튼 + Enter 키 + disabled + key 재마운트
- **#120**: ★ handleTimeWhatIf 재사용 + value=currentDepartureTime 통합 + 양방향 동기화

---

## 3. 🛠️ Task Breakdown (✅/⏸ 실측 status markers)

### §3.1 ✅ `src/app/diagnosis/result/[id]/result-content.tsx` (+9 / -11)

- ✅ import 정정: `TimeSlotSelector` (★ `type TimeSlot` 제거)
- ✅ `timeSlot` state + `initialTime` 제거 (★ Q-B (ii) 통합)
- ✅ `handleTimeSlotChange` 정정 → `handleTimeWhatIf` 재사용 (★ Issue #120 주석)
- ✅ `<TimeSlotSelector value={currentDepartureTime} onChange={handleTimeSlotChange} />`

### §3.2 ✅ `src/app/diagnosis/result/[id]/time-slot-selector.tsx` (변경 0)

- ✅ Q-A (A) Tabs 4 옵션 유지 정합 자연 (★ value prop 외 옵션이면 어떤 trigger도 active X 자연 박힘)

### §3.3 ✅ `src/components/sheet/detail-sheet.tsx` (변경 0)

- ✅ `commuteExtra` slot 박힘 영역 (★ 정정 영역 X)

---

## 4. ✅ Acceptance Criteria

| AC | 영역 |
|---|---|
| AC-1 | 위 input "07:00" → 아래 chip "07:00" 자동 선택 박힘 |
| AC-2 | 위 input "08:00"/"09:00"/"10:00" → 동일 chip 자동 선택 박힘 |
| AC-3 | 위 input "08:15" → 어느 chip도 active X (★ 4 옵션 외 자연) |
| AC-4 | 아래 chip "09:00" 클릭 → 위 input "09:00" 갱신 + 결과 재계산 박힘 |
| AC-5 | 카드 클릭 → DetailSheet → chip 클릭 → 재계산 흐름 정합 |
| AC-6 | 가드 30+종 8 영역 통과 (★ AC-6 grep 7행 + 컴포넌트 영향 0) |

---

## 5. ⚙️ Non-Functional Constraints (NFR)

- bundle: result/[id] 9.42 kB (★ 변화 0)
- Middleware: 32.5 kB (★ 30회 회귀 0 답습 정수 정점)
- tsc: 0 errors
- ESLint: 0 errors, 10 warnings (★ baseline 동일)

---

## 6. 📦 Deliverables

### Phase A ✅ (1 파일 정정)

- ✅ `src/app/diagnosis/result/[id]/result-content.tsx` (+9 / -11)

### Phase B ✅ (자체 grill 7 영역 + AC-6 grep 7행)

### Phase C ✅ (명세 + 로그)

- ✅ `tasks/FEAT-DETAIL-SHEET-WHAT-IF.md` (★ 본 파일)
- ✅ `tasks/ISSUE_REGISTER_LOG.md` (+1 § = 15건 누적)

### Phase D (★ feat+docs 커밋 분리 답습 27회째)

- ⏸ feat 커밋 (1 파일 +9/-11)
- ⏸ docs 커밋 (명세 + 로그)
- ⏸ draft PR + Vercel 사용자 검증

### Follow-up

- Vercel 시각 검증 = AC-1 ~ AC-5 (★ ★ 양방향 동기화 사용자 검증 필수)
- #112 FEAT-DIAGNOSIS-INPUT-FILTERS (★ 예산 자유 입력)
- Issue #114 Tailwind 본질 (★ OPEN 유지)

---

## 7. 🔗 Dependencies

### 선행 (모두 ✅)

- ✅ #111 PR #116+#117 머지 (★ β 확장 + 자유 input + 시나리오 B fallback)
- ✅ #118 PR #119 머지 (★ 변경 버튼 + Enter 키 + key 재마운트)

### 후행

- Vercel 시각 검증 (★ AC-1 ~ AC-5 양방향 동기화 + 카드 클릭 흐름)
- #112 FEAT-DIAGNOSIS-INPUT-FILTERS
- Issue #114 Tailwind 본질 (★ OPEN 유지)

---

## 8. 🧪 Test Plan

### Phase A ✅ — 검증 3종

- tsc 0 errors
- ESLint 0 errors, 10 warnings (★ baseline 동일)
- build 정합 통과 (★ result/[id] 9.42 kB + Middleware 32.5 kB 30회 정수)

### Phase B ✅ — 자체 grill 7 영역 + AC-6 grep 7행 + Phase B 한계 § 6 ISSUE 누적 학습 정점

7 영역:
1. result-content.tsx 정정 정합 ✓
2. 양방향 동기화 정적 분석 정합 ✓ (★ Phase B 한계 § = Vercel 사용자 검증 필수)
3. 다른 컴포넌트 영향 0 ✓
4. tsc + ESLint + build 재확인 ✓
5. 가드 30+종 8 영역 재입증 ✓
6. Mismatch 정직 인정 정수 § ✓ (0건)
7. Phase B 자체 grill 한계 § 답습 (★ 6 ISSUE 누적 학습 정점) ✓

AC-6 grep 7행: 1차 3종 (console/TODO/any) + 2차 4종 (TimeSlot type 제거 + timeSlot state 제거 + handleTimeWhatIf 재사용 + value=currentDepartureTime 박힘)

---

## 9. 📓 정직성 6 + §9.D 미래 작업자 학습 정수 3종

### §9.1 ★ 사용자 본질 짚음 답습 정수 §

어제 르르 사전 짚음 "결과값 카드 클릭하면 거기에도 출근시간 시뮬레이션 박힘. 거기까지는 연동 X. 나중에 할 일?" + 오늘 본질 "4 옵션 中 일치 시 자동 선택 + 외 → 선택 X (★ 자연) + 양방향 동기화" = 답습 정수 정점 = 본 ISSUE 진짜 가치.

### §9.2 ★ ★ ★ Phase A 사전 박힘 진화 답습 11회 성공 §

- 사전 案 (Phase A 진입 전): TimeSlotSelector.tsx 정정 + DetailSheet 정정 추정
- 실제 (Phase A 후): 변경 0 (★ Q-A (A) + Q-B (ii) 결정 자연 정합)
- 정직 명문화: 사전 案 vs 실제 정합 정직 인정 = 가장 단순 정수
- ★ Phase A 사전 박힘 진화 답습 8회째 (#113) → 9회째 (#115) → 10회째 (#116) → **11회째 (#120) 성공** = 6 ISSUE 누적 진화 정점

### §9.3 ★ #111+#118 패턴 답습 정수 §

- #111 β: `handleTimeWhatIf` + setFilters + runMockDiagnosis client-side 재계산 + setResult
- #118 명시적 확인: TimeChipOptions `key={currentDepartureTime}` 재마운트 + pending state 초기화
- **#120**: ★ `handleTimeSlotChange = (next) => void handleTimeWhatIf(next)` 재사용 = ★ 별도 함수 X 자연 + 양방향 동기화 자연

### §9.4 ★ 양방향 동기화 정합 §

- 위 input (TimeChipOptions) → currentDepartureTime → 아래 chip (TimeSlotSelector value)
- 아래 chip (TimeSlotSelector onChange) → handleTimeWhatIf → setFilters → currentDepartureTime → 위 input (TimeChipOptions key 재마운트)
- ★ 4 옵션 외 시간 입력 시 어떤 chip도 active X (★ @base-ui/react Tabs 자연 동작)
- Phase B 한계 § = 실제 양방향 동기화 시각 입증은 Vercel 사용자 검증 필수

### §9.5 ★ ★ Phase B 한계 § 6 ISSUE 누적 학습 정점 §

- #108 (Phase B 자체 grill 한계 정직 § NEW)
- #110 (Phase A 사전 박힘 정수 진화 답습 7회째)
- #114 (Phase B 한계 § 진짜 본질 입증 정점)
- #111 (β 확장 정수 정점 + 4 ISSUE 누적)
- #118 (React 19 답습 정수 + ㊠ Phase A 즉시 해소 + 5 ISSUE 누적)
- **#120** (★ Phase A 사전 박힘 진화 답습 11회 성공 + 양방향 동기화 + 6 ISSUE 누적 학습 정점)

미커버 4종 (★ Phase B 자체 grill 한계):
1. 양방향 동기화 진짜 입증 = Vercel 사용자 검증 필수
2. Vercel 배포 환경 차이 (★ #115 답습)
3. 4 옵션 외 시간 입력 시 chip 선택 X 시각 정합 (★ "08:15" → 어느 chip도 active X 시각)
4. 카드 클릭 → DetailSheet → chip 클릭 흐름 정합 (★ 실제 사용자 흐름)

### §9.6 ★ 가드 30+종 8 영역 사수 §

- AC-6 grep 7행 통과 (1차 3종 + 2차 4종)
- 컴포넌트 영향 0 (★ TimeChipOptions + dev/page.tsx + single-result-view.tsx + TimeSlotSelector + DetailSheet)

### ★ §9.D 미래 작업자 학습 정수 3종

1. **Phase A 사전 박힘 진화 답습 11회 성공** = 사전 案 vs 실제 정합 사전 짚음 정수 = ★ Phase A 진입 전 결정(Q-A/Q-B) 진짜 본질 사전 짚음이 답습 정수 정점.
2. **Q-A/Q-B 결정 진짜 본질** = 가장 단순 정합 정수 (★ 추가 변경 0 자연) = ★ "단순 = 좋음" 답습 정수.
3. **사용자 어제 짚음 + 오늘 본질 짚음 누적** = 답습 정수 정점 (★ 어제 르르 사전 짚음 + 오늘 "4 옵션 中 일치 시 자동 선택" 본질 = 본 ISSUE 진짜 가치).
