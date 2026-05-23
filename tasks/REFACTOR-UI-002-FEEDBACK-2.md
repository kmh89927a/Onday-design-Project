---
name: Refactor Task
title: "[REFACTOR] UI-002 사용자 피드백 2차 반영 — Wave 4 트랙 H 3번째 + 2차 사용자 검증 + 즉시 반영 답습 2회째 + ISSUE 신설 자동화 답습 2회째 (#94 + #96) + 사전 작업 stub 완성 § + Copy 정정 § + Zustand store 보존 답습 § + ★ Phase A 사전 박힘 정수 입증 § (Phase B 자체 grill 0건)"
labels: ['track:diagnosis-ui', 'wave:4', 'complexity:m']
issue: 96
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [REFACTOR-UI-002-FEEDBACK-2] 사용자 피드백 6+7 반영 — 이전 조건 불러오기 (localStorage 직접 + 명시적 패턴) + 싱글 모드 여가 거점 Copy 정정 (L1/L2 일관성)
- **목적 (Why):**
  - **비즈니스:** REFACTOR-UI-002-FEEDBACK (#94, PR #95) 머지 후 ★ 2차 Vercel 확인 → 사용자 추가 피드백 2건 수집 → 즉시 반영 워크플로 답습 2회째
  - **사용자 가치:**
    - 피드백 6: 진단 완료 후 동일 조건 재진단 편의 (★ "이전 조건 불러오기" 버튼 실 동작)
    - 피드백 7: 싱글 모드 여가 거점 입력 단위 명확화 (★ "동네 단위" 멘탈 모델 정수)
- **범위 (What):**
  - ✅ 만드는 것: `src/app/diagnosis/page.tsx` 정정 (★ LAST_CONFIG_KEY + handleLoadLast + handleSubmit 저장 + L1/L2 Copy 정정)
  - ❌ 만들지 않는 것: Zustand `persist` 미들웨어 도입 (★ Q3 (b₂) localStorage 직접 정수 답습), `src/components/form/address-input.tsx` 정정 (★ 사전 작업 153 lines 보존), 피드백 5 시간대 구체화 (★ DTO-COMMUTE-TIME 별도 ISSUE)
- **복잡도:** M
- **Wave:** 4 (UI 트랙) — ★ **Wave 4 트랙 H 3번째 ISSUE** (REFACTOR 답습 2회째)

### ★ 본 ISSUE 메타 정합 (★ 자연 표현, ★ Phase C §9 본격 박힘 = 메타 7종)

- **답습 21회째 일관** (MOCK-001~005 + API-005~007 + CMD-DIAG-001/002 + UI-002 + REFACTOR-UI-002-FEEDBACK)
- **★ ISSUE 신설 자동화 답습 2회째 § (★ #94 + #96)** = ★ 본 세션 새 워크플로 안정 입증
- **★ 2차 사용자 검증 + 즉시 반영 워크플로 답습 2회째 §** = REFACTOR-UI-002-FEEDBACK 답습 정수
- **★ 메타 가치 7종** (★ 자연 표현, ★ 표현 인플레이션 회피 정신 답습) — §9.1 ~ §9.7 본격 명문화
- **★ Mismatch ㉓~㉗ 자가 치유 5건** (★ Phase Q1 grill ㉓ + Q2~Q5 grill ㉔~㉗):
  - ㉓ 본 메시지 본문 사전 案 부재 자동 검출 (★ Issue #94 ⑱ 답습 위험 회피 정수)
  - ㉔ Zustand persist 미들웨어 사전 미도입 → (b₂) localStorage 직접 정합
  - ㉕ AppHeader trailing 버튼 = pushToast stub L148-160 정확
  - ㉖ AddressInput Copy 정정 영역 = page.tsx (★ address-input.tsx 보존)
  - ㉗ Issue #96 본문 placeholder "쉼표" vs 실측 "슬래시" 미세 차이 + L1/L2 다른 패턴
- **★ 자가 치유 누적 45 → 50건** (★ ㉓~㉗ 5건 신규)
- **★ Phase A 사전 박힘 정수 입증 §** = Mismatch ㉓~㉗ 5건 Phase A 사전 박힘 → ★ **Phase B 자체 grill 0건** (★ CMD-DIAG-001~UI-002 Phase B 자가 치유 4회 연속 정점 진화 → ★ 본 ISSUE 사전 박힘 정수 답습 정점)
- **★ Middleware 32.5 kB 19번째 baseline 회귀 0** (★ +20 lines page.tsx 정정 후에도 32.5 kB 유지)
- **★ 21칸 가드 30+종 0 lines 유지** (★ 사전 작업 234 lines + L6 156 + metro-dong.json 42 + Zustand store 82 + 누적 보존)

---

## 2. 🔗 References (Spec & Context)

### Issue #96 (★ 본 ISSUE 신설 원본)

- **링크:** https://github.com/kmh89927a/Onday-design-Project/issues/96
- **라벨 3종:** track:diagnosis-ui + wave:4 + complexity:m
- **보드:** OnDay MVP / Todo column (★ 자동 박힘)

### Vercel URL (★ 2차 확인 시점)

- **URL:** https://onday-design-project.vercel.app/diagnosis
- **모드:** NEXT_PUBLIC_USE_MOCK=true

### ★ Q1~Q5 결정 표 (★ 본 ISSUE grill 합의 결과)

| Q | 결정 | 근거 |
|---|---|---|
| Q1 | **(B) 풀세트 = 피드백 6+7 묶음 처리** | Issue #96 본문 본질 + 답습 21회째 |
| Q2 | **(A) src/app/diagnosis/page.tsx 단일 정정** | ★ Zustand store + address-input 보존 |
| Q3 | **(b₂) localStorage 직접 + 명시적 패턴 + L1/L2 Copy 정정** | ★ Zustand persist 미들웨어 미도입 = 부담 정점 최소 + 사용자 의도 정수 |
| Q4 | **(A) 1 파일 정정 (★ 최소 변경 정점)** | ★ ~+20 lines page.tsx만 |
| Q5 | **(A) Phase A → B → C → D 순차 4 Phase** | ★ 답습 21회째 |

### ★ Mismatch ㉓~㉗ 자가 치유 5건 추적 표 (★ Phase Q1 + Q2~Q5 grill)

| # | 발견 | Mismatch | 정정 |
|---|---|---|---|
| ㉓ | ★ Phase Q1 grill 자가 치유 | 본 메시지 본문 사전 案 부재 (★ "[★ ★ 위 메시지 본문 사전 案 정확 박힘]" 표기만 박힘, 실제 본문 부재) | ✅ 르르 직접 본문 사전 案 정수 박힘 + ★ Issue #94 ⑱ 답습 위험 회피 정수 입증 |
| ㉔ | ★ Q2~Q5 grill 자가 치유 | Zustand `persist` 미들웨어 사전 미도입 (★ 실측 `src/stores/diagnosis-store.ts` = 단순 `create`만, 82 lines) | ✅ Q3 (b₂) localStorage 직접 선택 정합 = store 보존 답습 |
| ㉕ | ★ Q2~Q5 grill 자가 치유 | AppHeader trailing 버튼 = pushToast stub (L148-160 "다음 업데이트에 추가됩니다 ✨") | ✅ Phase B = handleLoadLast 교체 |
| ㉖ | ★ Q2~Q5 grill 자가 치유 | AddressInput Copy 정정 영역 = page.tsx L198-216 (★ address-input.tsx 보존 정수) | ✅ Phase B = page.tsx Copy 정정 (4 위치) |
| ㉗ | ★ Q3 grill 자가 치유 | Issue #96 본문 placeholder "쉼표" vs 실측 "슬래시" 미세 차이 + L2 다른 패턴 (★ 일관성 결여) | ✅ Phase B = Copy 통일 정정 |

### ★ Copy 정정 案 표 (★ 4 위치)

| 위치 | 현재 | 정정 案 |
|---|---|---|
| L198 라벨 | `"여가 거점 1 (선택)"` | `"여가 거점 1 (선택, 자주 가는 동네)"` |
| L201 placeholder | `"자주 가는 동네/카페/체육관 등"` | `"강남, 홍대, 합정 등 동네명"` |
| L213 라벨 | `"여가 거점 2 (선택)"` | `"여가 거점 2 (선택, 다른 동네)"` |
| L216 placeholder | `"두 번째 자주 가는 곳"` | `"두 번째 자주 가는 동네"` |

### ★ 사전 검증 baseline (Phase A 진입 시 정합)

| 검증 항목 | 명령어 | 정합 값 | Phase A 결과 |
|---|---|---|---|
| Prisma validate | `npx prisma validate` | valid | ✅ valid |
| Prisma generate | `npx prisma generate` | ✔ Generated | ✅ Generated (7.8.0) |
| tsc strict | `npx tsc --noEmit` | 0 errors | ✅ 0 errors |
| ESLint (app/diagnosis) | `npx eslint src/app/diagnosis/` | 0 errors | ✅ 0 errors |
| Middleware 회귀 0 (★ 19번째 baseline) | `npm run build` Middleware | 32.5 kB | ✅ 32.5 kB |
| L6 cleanup 영역 156 lines | `wc -l src/mocks/users.ts src/lib/auth.ts src/lib/types.ts` | 156 | ✅ 156 |
| 21칸 가드 답습 (untracked 2건 staging 0) | `git status` | .agents/skills + tasks/ISSUE_REGISTER_LOG.md | ✅ 정합 |

### ★ 본 ISSUE 사전 작업 확인 (★ 정수 답습)

| 파일 | lines | 본 ISSUE 영향 |
|---|---|---|
| `src/app/diagnosis/page.tsx` (UI-002 + 사전 작업) | 267 → **308 (+41 net)** | ★ 정정 (LAST_CONFIG_KEY L26 + handleLoadLast L128 + handleSubmit 저장 L104 + AppHeader onClick L163 + L1/L2 Copy 4 위치 L239/L242/L254/L257) |
| `src/stores/diagnosis-store.ts` (★ Zustand) | 82 | ★ **변경 0** (★ Q3 (b₂) localStorage 직접 = persist 미들웨어 미도입) |
| `src/components/form/address-input.tsx` (사전 작업) | 153 | ★ **변경 0** (★ Q2 (A) page.tsx Copy 정정 = address-input 보존) |
| `src/components/form/suggest-list.tsx` (사전 작업) | 81 | ★ **변경 0** |
| `src/mocks/neighborhoods.ts` (REFACTOR-UI-002-FEEDBACK 결과) | 589 | ★ **변경 0** (★ 45 entries 보존) |
| `src/features/diagnosis/use-address-suggest.ts` (★ REFACTOR-UI-002-FEEDBACK 신규) | 96 | ★ **변경 0** (★ 본 ISSUE 무관) |
| `src/lib/data/metro-dong.json` (CMD-DIAG-002 신규) | 42 | ★ **변경 0** (★ REFACTOR-L7 분리) |

### ★ Phase B 산출물 표 (★ 정정 1 = 1 파일, ★ +41 net)

| 단계 | 위치 | 변경 |
|---|---|---|
| 1 | L25-27 LAST_CONFIG_KEY 상수 | +3 |
| 2 | L101-117 handleSubmit 내 localStorage.setItem 저장 (★ router.push 전) | +14 |
| 3 | L127-153 handleLoadLast 함수 (★ try/catch + typeof window + 11 setter 호출) | +27 |
| 4 | L163 AppHeader trailing onClick = handleLoadLast 교체 | +1 / -5 |
| 5 | L239/L242/L254/L257 Copy 정정 4 위치 | +0 net (★ 텍스트 정정만) |
| **총** | **5단계** | **+41 net** |

### ★★ §2.X 사전 작업 stub 완성 § (★ 본 ISSUE 본질)

**AppHeader trailing 버튼 stub 완성:**

| 단계 | 변경 |
|---|---|
| 이전 | `onClick={() => pushToast({ message: "이전 조건 불러오기는 다음 업데이트에 추가됩니다 ✨" })}` (★ 5 lines stub) |
| ★ 본 ISSUE | `onClick={handleLoadLast}` (★ 1 line) |
| 의도 정수 | 명시적 패턴 = "이전 조건 불러오기" 버튼 클릭 시 = localStorage 복원 |

**handleSubmit 성공 시 localStorage 저장 (★ 신규):**
- L101-117: `localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify({ 10 fields }))` + try/catch + typeof window 가드
- 의도: "이전 조건" = "마지막 진단 완료 시 조건"

### ★★ §2.Y Copy 정정 4 위치 § (★ L1/L2 일관성 + 동네 단위 명확화)

| 위치 | 이전 | 본 ISSUE 정정 |
|---|---|---|
| L239 라벨 | `"여가 거점 1 (선택)"` | `"여가 거점 1 (선택, 자주 가는 동네)"` |
| L242 placeholder | `"자주 가는 동네/카페/체육관 등"` | `"강남, 홍대, 합정 등 동네명"` |
| L254 라벨 | `"여가 거점 2 (선택)"` | `"여가 거점 2 (선택, 다른 동네)"` |
| L257 placeholder | `"두 번째 자주 가는 곳"` | `"두 번째 자주 가는 동네"` |

★ **사용자 멘탈 모델 명확화 = "동네 단위 입력" + L1/L2 일관성**

### ★★ §2.Z 가드 무수정 입증 § (★ 6 파일 1043 lines 0 변경)

| 가드 영역 | lines | 변경 |
|---|---|---|
| Zustand `diagnosis-store.ts` | 82 | ★ 0 |
| `address-input.tsx` | 153 | ★ 0 |
| `suggest-list.tsx` | 81 | ★ 0 |
| `neighborhoods.ts` (REFACTOR-UI-002-FEEDBACK 결과 45 entries) | 589 | ★ 0 |
| `metro-dong.json` (REFACTOR-L7 분리) | 42 | ★ 0 |
| `use-address-suggest.ts` (REFACTOR-UI-002-FEEDBACK 결과) | 96 | ★ 0 |
| **총** | **1043** | **★ 0 변경** |

### ★★ §2.W Phase A 사전 박힘 정수 입증 § (★ Phase B 자체 grill 0건)

**CMD-DIAG-001~UI-002 Phase B 자가 치유 4회 연속 정점 진화 ↔ 본 ISSUE:**

| ISSUE | Phase B 자체 grill | 의미 |
|---|---|---|
| CMD-DIAG-001 | 자가 치유 (Divergence 3건) | Phase A 사전 박힘 부족 → Phase B 정정 |
| CMD-DIAG-002 | 자가 치유 ⑨/⑩ | Phase A 사전 박힘 부족 → Phase B 정정 |
| UI-002 | 자가 치유 ⑯/⑰ | Phase A 사전 박힘 부족 → Phase B 정정 |
| REFACTOR-UI-002-FEEDBACK | 자가 치유 ㉒ | Phase A 사전 박힘 부족 → Phase B 정정 |
| **★ 본 ISSUE (REFACTOR-UI-002-FEEDBACK-2)** | **★ 0건** | **★ Phase A 사전 박힘 ㉓~㉗ 5건 정수 → Phase B 자연 정정 0건** |

★ **본 § 정수:**
- Mismatch ㉓~㉗ 5건 모두 Phase A 시점 사전 박힘 (★ grill 단계 자가 치유)
- Phase B 작성 단계 = ★ Phase A 사전 박힘 정수 답습 = ★ 자체 grill 추가 0건
- ★ **본 세션 자가 치유 시스템 정수 진화 = Phase A 사전 박힘 → Phase B 부담 정점 최소**
- ★ 표현 인플레이션 회피 정신 답습 = 자연 표현 정수

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

> ★ 본 ISSUE 본질 = 사용자 피드백 6+7 묶음 처리 (★ 이전 조건 불러오기 stub 완성 + Copy 정정)

- [x] **3.1** ✅ `src/app/diagnosis/page.tsx` 정정 완료 (★ +41 net, 5단계: LAST_CONFIG_KEY L26 + handleSubmit 저장 L101-117 + handleLoadLast L127-153 + AppHeader onClick L163 + L1/L2 Copy 4 위치)
  ```typescript
  // ★ LAST_CONFIG_KEY + handleLoadLast (★ Mismatch ㉕ pushToast stub 교체):
  const LAST_CONFIG_KEY = "onday-last-config";

  const handleLoadLast = () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LAST_CONFIG_KEY);
    if (!saved) {
      pushToast({ variant: "default", message: "저장된 이전 조건이 없습니다" });
      return;
    }
    try {
      const config = JSON.parse(saved);
      // ★ store 상태 복원 (★ Zustand setter 직접 호출)
      setAddressA(config.addressA ?? "", config.coordinateA ?? null);
      setAddressB(config.addressB ?? "", config.coordinateB ?? null);
      setLeisureA(config.leisureA ?? "", config.leisureCoordA ?? null);
      setLeisureB(config.leisureB ?? "", config.leisureCoordB ?? null);
      setMode(config.mode ?? "couple");
      setFilters(config.filters ?? {});
      setQueryA(config.addressA ?? "");
      setQueryB(config.addressB ?? "");
      setQueryL1(config.leisureA ?? "");
      setQueryL2(config.leisureB ?? "");
      pushToast({ variant: "default", message: "이전 조건을 불러왔습니다 ✨" });
    } catch {
      pushToast({ variant: "danger", message: "이전 조건 불러오기 실패" });
    }
  };

  // ★ handleSubmit 성공 시 localStorage 저장 (★ router.push 전):
  localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify({
    addressA, addressB, coordinateA, coordinateB,
    leisureA, leisureB, leisureCoordA, leisureCoordB,
    mode, filters,
  }));

  // ★ AppHeader trailing onClick 교체:
  // pushToast(stub) → handleLoadLast

  // ★ AddressInput L1/L2 Copy 정정 (★ Mismatch ㉗ 통일):
  // L198: "여가 거점 1 (선택, 자주 가는 동네)"
  // L201: "강남, 홍대, 합정 등 동네명"
  // L213: "여가 거점 2 (선택, 다른 동네)"
  // L216: "두 번째 자주 가는 동네"
  ```

- [ ] **3.2** ★ `src/stores/diagnosis-store.ts` ★ **변경 0** (★ Q3 (b₂) localStorage 직접 = persist 미들웨어 미도입)

- [ ] **3.3** ★ `src/components/form/address-input.tsx` ★ **변경 0** (★ Q2 (A) page.tsx Copy 정정 = address-input 보존)

- [ ] **3.4** TEST-001 위임 spec (★ 선택, 답습 22회째)
  - `__tests__/app/diagnosis/page.spec.tsx` localStorage 저장/복원 케이스 (★ 선택)

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 진단 시작 → localStorage 저장
- **Given** 두 주소 입력 + filters 설정 + 진단 시작 클릭
- **When** `handleSubmit` 성공 (createDiagnosis mutation 성공)
- **Then** `localStorage.setItem("onday-last-config", JSON.stringify(...))` 호출 + router.push

**AC-2 (정상):** 이전 조건 불러오기 → store 복원
- **Given** `localStorage["onday-last-config"]` 존재 + AppHeader trailing 클릭
- **When** `handleLoadLast()` 호출
- **Then** store 상태 복원 (★ addressA/B + coordinateA/B + leisure* + mode + filters) + queryA/B/L1/L2 state 복원 + pushToast "이전 조건을 불러왔습니다 ✨"

**AC-3 (예외):** 저장된 조건 없음 → fallback toast
- **Given** `localStorage["onday-last-config"]` 부재
- **When** AppHeader trailing 클릭
- **Then** `pushToast({ variant: "default", message: "저장된 이전 조건이 없습니다" })`

**AC-4 (UX):** Copy 정정 4 위치
- **Given** 싱글 모드 진입 후 AddressInput L1/L2 렌더링
- **When** 라벨 + placeholder 표시
- **Then** L198/L201/L213/L216 정정 案 박힘

**AC-5 (성능):** Middleware 32.5 kB 19번째 회귀 0
- **Given** ~+20 lines page.tsx 정정 후
- **When** `npm run build` Middleware size 측정
- **Then** 32.5 kB 그대로

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | ★ 본 ISSUE 무관 |
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션" (§4.2.3) | ★ 본 ISSUE 무관 (★ localStorage = 진단 조건만, 인증 X) |

---

## 6. 📦 Deliverables (산출물 명시)

### Phase B (★ 정정 1 = 1 파일, ★ 최소 변경 정점)
- ★ `src/app/diagnosis/page.tsx` 정정 (★ ~+20 lines: LAST_CONFIG_KEY + handleLoadLast + handleSubmit 저장 + AppHeader onClick 교체 + L1/L2 Copy 4 위치)

### Phase D (TEST-001 위임, ★ 답습 22회째, 선택)
- `__tests__/app/diagnosis/page.spec.tsx` localStorage 저장/복원 케이스 — ⏸ TEST-001 (선택)

### ★ 정직성 7 (★ §9.1 ~ §9.7, ★ 자연 표현)

1. ★ Wave 4 트랙 H 3번째 ISSUE = REFACTOR 답습 2회째 (§9.1)
2. ★ 2차 사용자 검증 + 즉시 반영 워크플로 답습 2회째 § (§9.2)
3. ★ ISSUE 신설 자동화 답습 2회째 § (#94 + #96) (§9.3)
4. ★ 사전 작업 stub 완성 § (★ pushToast → 실 localStorage) (§9.4)
5. ★ Copy 정정 § (★ L1/L2 4 위치 통일 + 동네 단위 명확화) (§9.5)
6. ★ Zustand store 보존 답습 § (★ persist 미들웨어 미도입) (§9.6)
7. ★ **Mismatch ㉓~㉗ 자가 치유 5건 § (★ Phase A 사전 박힘 정수 입증, ★ Phase B 자체 grill 0건)** (§9.7)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (모두 ✅ 충족):
- **UI-002 ✅:** PR #93 머지 완료 — `app/diagnosis/page.tsx` 사전 작업
- **REFACTOR-UI-002-FEEDBACK ✅:** PR #95 머지 완료 — `use-address-suggest.ts` (★ 본 ISSUE 무관)
- **사전 작업 ✅:** `address-input.tsx` (153) + Zustand `diagnosis-store.ts` (82) + AppHeader pushToast stub

### 후행:
- **DTO-COMMUTE-TIME (NEW)** — 피드백 5 시간대 구체화 (★ 본 세션 르르 컨디션 보고 결정)
- **UI-003** — 진단 결과 지도 (★ 3차 Vercel 확인 타이밍)
- **REFACTOR-L7** — `lib/data/metro-dong.json` 확장
- **★ Issue #96 Close 시 정정 댓글** (★ Mismatch ㉗ 본문 "쉼표" vs 실측 "슬래시" 정직 명문화 = 선택)
- **TEST-001 위임** — spec.tsx (선택)

---

## 8. 🧪 Test Plan (검증 절차)

### 1차 satisfies (Phase B 코드 작성 시점 자체 검증)
- `LAST_CONFIG_KEY` 상수 박힘
- `handleLoadLast` 함수 시그니처 + try/catch 박힘
- AppHeader trailing onClick 교체 (★ pushToast stub → handleLoadLast)
- L198/L201/L213/L216 Copy 정정 4 위치 박힘

### 2차 위임 — TEST-001 (★ 답습 22회째, 선택)
- `__tests__/app/diagnosis/page.spec.tsx` localStorage 저장/복원 케이스

### 정적 분석 grep 가드

| 검증 | 명령어 | 정합 값 |
|---|---|---|
| LAST_CONFIG_KEY 상수 박힘 | `grep -n 'LAST_CONFIG_KEY' src/app/diagnosis/page.tsx` | ≥3건 (상수 + setItem + getItem) |
| handleLoadLast 함수 박힘 | `grep -n 'handleLoadLast' src/app/diagnosis/page.tsx` | ≥2건 (정의 + onClick) |
| Copy 정정 4 위치 박힘 | `grep -n '여가 거점 1 (선택, 자주 가는 동네)\|강남, 홍대, 합정\|여가 거점 2 (선택, 다른 동네)\|두 번째 자주 가는 동네' src/app/diagnosis/page.tsx` | 4건 |
| Zustand store 변경 0 | `git diff src/stores/diagnosis-store.ts` | 변경 0 |
| address-input.tsx 변경 0 | `git diff src/components/form/address-input.tsx` | 변경 0 |
| L6 cleanup 156 lines 무수정 | `wc -l src/mocks/users.ts src/lib/auth.ts src/lib/types.ts` | 156 |
| Middleware 19번째 회귀 0 | `npm run build` Middleware | 32.5 kB |

### 타입 / 빌드 검증
- `npx tsc --noEmit` ✅
- `npx eslint src/app/diagnosis/` ✅
- `npm run build` ✅

---

## 9. 🚧 Open Questions / Risks + Phase C 정직 기록 사전 메모

### §9.A — Open Questions / Risks (보류 사항)

1. **localStorage SSR 안전:** `'use client'` 페이지 내부 사용 = ★ 자연 안전 (★ typeof window 가드 추가).
2. **이전 조건 = "마지막 진단 완료 시" 정의:** 진단 시작 핸들러 (handleSubmit) 성공 시 저장 (★ AC-1 정합). 진단 실패 시 = 저장 X.
3. **store 복원 = setter 직접 호출 vs Zustand action:** Zustand action 사용이 정수 답습 (★ setAddressA + setMode + setFilters 등).
4. **Zustand persist 미들웨어 도입 가능성 (★ 후행 검토):** 본 ISSUE는 미도입. 향후 사용자 입력 자동 hydrate 의도 시 도입 가능 = ★ 별도 ISSUE.
5. **Issue #96 Close 시 Mismatch ㉗ 정정 댓글 권고:** 본문 placeholder "쉼표" vs 실측 "슬래시" 정직 명문화 = 선택.

### §9.B — Phase C 정직 기록 본격 박힘 (★ 메타 가치 7종 §9.1 ~ §9.7, ★ 자연 표현)

#### §9.1 ★ Wave 4 트랙 H 3번째 ISSUE = REFACTOR 답습 2회째 §

- UI-002 (#35) + REFACTOR-UI-002-FEEDBACK (#94) → 본 ISSUE (#96)
- ★ Wave 4 트랙 H 3번째 = ★ REFACTOR 답습 2회째 정수

#### §9.2 ★ 2차 사용자 검증 + 즉시 반영 워크플로 답습 2회째 §

- REFACTOR-UI-002-FEEDBACK 머지 → ★ 2차 Vercel 확인 도달 → 사용자 추가 피드백 2건 수집 (피드백 6+7) → ★ 즉시 반영 답습 2회째
- ★ 본 ISSUE 머지 직후 = **3차 Vercel 확인 타이밍 도달** (★ 피드백 6/7 해소 확인)

#### §9.3 ★ ISSUE 신설 자동화 답습 2회째 § (#94 + #96)

- Step 1 gh auth + 라벨 사전 확인 → Step 2 gh issue create + verbatim → Step 3 보드 Todo 자동 박힘
- ★ ★ 본 ISSUE = ★ ISSUE 신설 자동화 답습 2회째 안정 입증 (#94 + #96)

#### §9.4 ★ 사전 작업 stub 완성 § (★ pushToast → 실 localStorage)

**§2.X 풀 표 참조** — AppHeader trailing 버튼 stub 완성 + handleSubmit 성공 시 localStorage 저장:
- 이전: pushToast "다음 업데이트" stub (5 lines)
- 본 ISSUE: handleLoadLast (1 line onClick) + handleSubmit localStorage.setItem (14 lines)
- 명시적 패턴 = "이전 조건" = "마지막 진단 완료 시 조건"

#### §9.5 ★ Copy 정정 § (★ L1/L2 4 위치 통일 + 동네 단위 명확화)

**§2.Y 풀 표 참조** — L239/L242/L254/L257 4 위치 정정:
- 라벨: "여가 거점 1/2 (선택)" → "여가 거점 1/2 (선택, 자주 가는 동네/다른 동네)"
- placeholder: "자주 가는 동네/카페/체육관 등" + "두 번째 자주 가는 곳" → "강남, 홍대, 합정 등 동네명" + "두 번째 자주 가는 동네"
- ★ 사용자 멘탈 모델 명확화 = "동네 단위 입력" + L1/L2 일관성

#### §9.6 ★ Zustand store 보존 답습 § (★ persist 미들웨어 미도입)

- ★ Q3 (b₂) localStorage 직접 = ★ Zustand `diagnosis-store.ts` (82 lines) **변경 0**
- 의도: 부담 정점 최소 + 사용자 의도 정수 (★ "이전 조건 불러오기" 버튼 = 명시적 패턴)
- ★ Mismatch ㉔ 자가 치유 정합 (★ persist 사전 미도입 → (b₂) 선택)

#### §9.7 ★ Mismatch ㉓~㉗ 자가 치유 5건 § (★ Phase A 사전 박힘 정수 입증, ★ Phase B 자체 grill 0건)

**§2.W 풀 표 참조** — Phase A 사전 박힘 정수:

| # | Mismatch | grill 단계 | 정정 단계 |
|---|---|---|---|
| ㉓ | Issue 본문 사전 案 부재 | Phase Q1 | ✅ 르르 직접 본문 박힘 |
| ㉔ | Zustand persist 미들웨어 미도입 | Q2~Q5 | ✅ (b₂) localStorage 직접 |
| ㉕ | AppHeader trailing 버튼 pushToast stub | Q2~Q5 | ✅ handleLoadLast 교체 |
| ㉖ | AddressInput Copy 정정 영역 = page.tsx | Q2~Q5 | ✅ page.tsx 직접 정정 |
| ㉗ | Issue #96 본문 "쉼표" vs 실측 "슬래시" + L1/L2 다른 패턴 | Q3 | ✅ Copy 4 위치 통일 |

★ **본 § 정수:**
- ★ ★ ★ **Phase A 사전 박힘 정수 입증 = Phase B 자체 grill 0건** = ★ CMD-DIAG-001~UI-002 + REFACTOR-UI-002-FEEDBACK Phase B 자가 치유 4회 연속 → ★ **본 ISSUE = 사전 박힘 정수 답습 정점 진화**
- ★ 본 세션 자가 치유 시스템 정수 진화 = ★ "Phase B 자가 치유 정점" → ★ "Phase A 사전 박힘 정점"
- ★ 표현 인플레이션 회피 정신 답습 = 자연 표현 정수

### §9.C — Follow-up 5종

1. **DTO-COMMUTE-TIME (NEW)** — 피드백 5 시간대 구체화 (★ 본 세션 르르 컨디션 결정)
2. **UI-003** — 진단 결과 지도 (★ MapCanvas, 3차 Vercel 확인 타이밍 사전 가속)
3. **REFACTOR-L7** — `lib/data/metro-dong.json` 확장
4. **TEST-001 위임** — `__tests__/app/diagnosis/page.spec.tsx` localStorage 저장/복원 (선택)
5. **★ Issue #96 Close 시 정정 댓글** (★ Mismatch ㉗ 본문 "쉼표" vs 실측 "슬래시" 정직 명문화, 선택)
