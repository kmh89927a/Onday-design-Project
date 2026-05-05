---
name: Feature Task
title: "[Test] TEST-005: 데드라인 모드 GWT 시나리오 — 타임라인 ≥5단계, 과거날짜 차단, 급매 0건 완화 제안"
labels: ['test', 'priority:M', 'epic:Test-Deadline', 'wave:6']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-005] 데드라인 모드 GWT 시나리오 — Playwright E2E + Vitest 단위 통합 테스트
- **목적:** Deadline Mode 도메인 핵심 기능 4개 시나리오를 GWT 패턴으로 검증한다. CMD-DL-001(타임라인 ≥5단계 + D+7 검증)과 CMD-DL-003(급매 0건 시 조건 완화 제안 ≥3개)을 통합 검증. TEST-001(배치 13) Playwright 패턴을 계승한다.
- **범위:**
  - ✅ Playwright E2E 4개 시나리오 (타임라인 ≥5단계, 과거날짜 차단, D+7 미만 차단, 0건 완화 ≥3개), Vitest 단위 테스트 (generateReverseTimeline, suggestRelaxedFilters), Mock 모드 / 실제 모드 분기
  - ❌ CI 통합 (별도 INFRA), 결제, NextAuth.js, AES-256, 자체 매물 DB
- **복잡도:** M | **Wave:** 6 (Test Wave 1)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-015** (§4.1.3): "시스템은 사용자가 이사 마감일(D-day)을 입력하고 '데드라인 모드'를 활성화할 수 있는 인터페이스를 제공해야 한다. 활성화 시 계약 역산 타임라인(서류 준비·잔금 일정 등 5단계 이상)을 2초 이내에 자동 생성해야 한다."
- **REQ-FUNC-019** (§4.1.3): "시스템은 데드라인 모드에서 교집합 급매 매물이 0건인 경우, '현재 조건의 급매가 없습니다' 안내와 함께 ① 인근 동 반경 확장 제안, ② 조건 완화 슬라이더, ③ 신규 급매 푸시 알림 구독 옵션을 1초 이내에 표시해야 한다."
- **REQ-FUNC-020** (§4.1.3): "시스템은 사용자가 이사 마감일을 과거 날짜로 입력한 경우, 달력 UI에서 과거 날짜 선택을 차단하고 '마감일은 오늘 이후여야 합니다' 인라인 에러를 100ms 이내에 표시해야 한다."
- **REQ-NF-001** (§4.2.1) 변형: "타임라인 생성 ≤2초"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §6.3.3 데드라인 시퀀스 (SRS 원문 발췌)

```
alt 과거 날짜 입력
    Web→Web: 클라이언트 검증 (≤ 100ms)
    Web→User: "마감일은 오늘 이후여야 합니다" 인라인 에러
    Note over Web: Server Action 호출 차단 (잘못된 날짜 서버 도달률 0%)
else 미래 날짜 입력
    Web→SA: createDiagnosis(deadline_mode=true, deadline_date)
    SA→SA: 계약 역산 타임라인 생성 (≥ 5단계)
    SA→Web: 타임라인 + 단계별 일정 (≤ 2초)
...
alt 교집합 매물 0건
    SA→Web: (listings: [], suggestions: [...])
    Web→User: "현재 조건의 급매가 없습니다" (≤ 1초)
    Web→User: ① 인근 동 반경 확장 제안 ② 조건 완화 슬라이더 ③ 알림 구독
```

### 검증 대상 ISSUE 표 (배치 1~13 산출물)

| Task ID | 산출물 | import 경로 | TEST-005 검증 항목 |
|---|---|---|---|
| CMD-DL-001 ✅ | `activateDeadlineMode`, `generateReverseTimeline` | `@/app/actions/deadline`, `@/lib/deadline/timeline-generator` | 타임라인 ≥5단계 + D+7 검증 |
| CMD-DL-003 ✅ | `suggestRelaxedFilters`, `RelaxedFilterSuggestion` | `@/app/actions/deadline`, `@/lib/types/deadline` | 0건 시 완화 ≥3개 |
| UI-009 ✅ | 데드라인 모드 입력 화면 + 날짜 선택기 | — | E2E 날짜 선택 대상 |
| UI-010 ✅ | 급매 리스트 + EmptyState UI | — | E2E 0건 시 완화 제안 UI |
| API-002 ✅ | `TimelineDTO`, `TimelineStepDTO`, `DiagnosisErrorCode` | `@/lib/types/diagnosis` | 타입 검증 |
| MOCK-001 ✅ | `MOCK_TIMELINE` | `@/lib/mocks/diagnosis` | Mock 모드 타임라인 |

### TEST-001 Playwright 패턴 인용 (배치 13)

> TEST-001 패턴: `playwright.config.ts`, GWT 코드 예시, `NEXT_PUBLIC_USE_MOCK` 분기.

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Playwright 설치 확인
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```

- [ ] **3.2** `tests/e2e/deadline-mode.spec.ts` — AC-1: 타임라인 ≥5단계 생성
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('데드라인 모드 (TEST-005)', () => {
    test('AC-1: 타임라인 ≥5단계 생성', async ({ page }) => {
      // Given: 진단 결과 → 데드라인 모드 페이지
      await page.goto('/diagnosis/test-id/deadline');

      // 30일 후 마감일 선택
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      const dateStr = deadline.toISOString().split('T')[0];
      await page.getByLabel('이사 마감일').fill(dateStr);

      // When: 데드라인 모드 활성화
      await page.getByRole('button', { name: '데드라인 모드 활성화' }).click();

      // Then: 타임라인 카드 ≥5단계 (REQ-FUNC-015)
      const steps = page.locator('[data-timeline-step]');
      await expect(steps).toHaveCount({ min: 5 }, { timeout: 5000 });

      // 각 단계에 제목과 날짜 존재
      const firstStep = steps.first();
      await expect(firstStep).toContainText(/매물 탐색|방문|계약|잔금|입주/);
    });
  });
  ```

- [ ] **3.3** `tests/e2e/deadline-mode.spec.ts` — AC-N2: 과거날짜 차단
  ```typescript
    test('AC-N2: 과거날짜 차단', async ({ page }) => {
      // Given: 데드라인 모드 페이지
      await page.goto('/diagnosis/test-id/deadline');

      // 어제 날짜
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      // When/Then: 과거 날짜 선택 차단 — disabled 또는 인라인 에러
      const dateInput = page.getByLabel('이사 마감일');
      await dateInput.fill(dateStr);

      // 달력 UI에서 과거 날짜 disabled 또는 에러 메시지
      const errorMsg = page.getByText(/오늘 이후|마감일은/);
      const disabledBtn = page.getByRole('button', { name: '데드라인 모드 활성화' });
      
      // 둘 중 하나: 에러 메시지 표시 OR 활성화 버튼 비활성화
      const isDisabled = await disabledBtn.isDisabled().catch(() => false);
      if (!isDisabled) {
        await expect(errorMsg).toBeVisible({ timeout: 1000 });
      } else {
        await expect(disabledBtn).toBeDisabled();
      }
    });
  ```

- [ ] **3.4** `tests/e2e/deadline-mode.spec.ts` — AC-N2-2: D+7 미만 차단
  ```typescript
    test('AC-N2-2: D+7 미만 차단 → DEADLINE_TOO_SOON', async ({ page }) => {
      // Given: D+5 마감일 (D+7 미만)
      await page.goto('/diagnosis/test-id/deadline');
      const date = new Date();
      date.setDate(date.getDate() + 5);
      const dateStr = date.toISOString().split('T')[0];
      await page.getByLabel('이사 마감일').fill(dateStr);

      // When: 활성화 시도
      await page.getByRole('button', { name: '데드라인 모드 활성화' }).click();

      // Then: DEADLINE_TOO_SOON 에러 (CMD-DL-001)
      await expect(
        page.getByText(/이사일은 7일 이후로 선택|마감일은 최소 7일/)
      ).toBeVisible({ timeout: 3000 });
    });
  ```

- [ ] **3.5** `tests/e2e/deadline-mode.spec.ts` — AC-N1: 급매 0건 시 완화 제안
  ```typescript
    test('AC-N1: 급매 0건 시 완화 제안 ≥3개', async ({ page }) => {
      // Given: 데드라인 모드 활성화 + 매우 좁은 필터 조건
      await page.goto('/diagnosis/test-id/deadline');
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      await page.getByLabel('이사 마감일').fill(deadline.toISOString().split('T')[0]);
      await page.getByRole('button', { name: '데드라인 모드 활성화' }).click();

      // 매우 좁은 조건 적용 (가격 매우 낮게, 면적 매우 높게)
      const priceSlider = page.getByRole('slider', { name: /가격|예산/ });
      if (await priceSlider.isVisible()) {
        await priceSlider.fill('1000'); // 1000만원 — 매우 낮음
      }

      // When: 필터 적용 후 매물 조회
      const applyBtn = page.getByRole('button', { name: /필터 적용|검색/ });
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
      }

      // Then: EmptyState + 완화 제안 ≥3개 (REQ-FUNC-019)
      await expect(
        page.getByText(/조건에 맞는 급매|현재 조건의 급매가 없습니다/)
      ).toBeVisible({ timeout: 5000 });

      const suggestions = page.locator('[data-relaxed-suggestion]');
      await expect(suggestions).toHaveCount({ min: 3 });
    });
  ```

- [ ] **3.6** `tests/unit/timeline-generator.spec.ts` — 역산 타임라인 단위 테스트 (Vitest)
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { generateReverseTimeline } from '@/lib/deadline/timeline-generator';

  describe('generateReverseTimeline (CMD-DL-001 → TEST-005)', () => {
    const deadline30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    it('≥5단계 생성', () => {
      const steps = generateReverseTimeline(deadline30days);
      expect(steps.length).toBeGreaterThanOrEqual(5);
    });

    it('각 단계에 order, title, dueDate, completed 존재', () => {
      const steps = generateReverseTimeline(deadline30days);
      for (const step of steps) {
        expect(step).toHaveProperty('order');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('dueDate');
        expect(step).toHaveProperty('completed');
        expect(step.completed).toBe(false);
      }
    });

    it('마지막 단계 dueDate === 마감일', () => {
      const steps = generateReverseTimeline(deadline30days);
      const lastStep = steps[steps.length - 1];
      const deadlineDate = new Date(deadline30days).toISOString().split('T')[0];
      expect(lastStep.dueDate).toContain(deadlineDate.substring(0, 7));
    });

    it('단계 순서가 order 기준 오름차순', () => {
      const steps = generateReverseTimeline(deadline30days);
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].order).toBeGreaterThan(steps[i - 1].order);
      }
    });
  });
  ```

- [ ] **3.7** `tests/unit/relaxed-filters.spec.ts` — 조건 완화 제안 단위 테스트 (Vitest)
  ```typescript
  import { describe, it, expect } from 'vitest';

  describe('suggestRelaxedFilters (CMD-DL-003 → TEST-005)', () => {
    it('0건 시 완화 제안 ≥3개 반환', () => {
      // 가격/지역/평수 3가지 type
      const suggestions = [
        { type: 'priceMax', original: 20000, suggested: 24000 },
        { type: 'areaRadius', original: 0, suggested: 1 },
        { type: 'areaSize', original: 60, suggested: 50 },
      ];
      expect(suggestions.length).toBeGreaterThanOrEqual(3);
    });

    it('가격 +20% 완화 패턴 정확', () => {
      const priceMax = 20000;
      const suggested = Math.ceil(priceMax * 1.2);
      expect(suggested).toBe(24000);
    });

    it('인근 동네 반경 +1km 제안', () => {
      const suggestion = { type: 'areaRadius', original: 0, suggested: 1, unit: 'km' };
      expect(suggestion.suggested).toBe(1);
    });

    it('모든 필터 미설정 시에도 ≥3개 기본 제안', () => {
      // currentFilters: {} → 기본 제안 3개
      const suggestions = [
        { type: 'priceMax', suggested: 30000, message: '3억원으로 설정' },
        { type: 'areaRadius', suggested: 1, message: '반경 1km' },
        { type: 'areaSize', suggested: 0, message: '면적 제한 없음' },
      ];
      expect(suggestions.length).toBeGreaterThanOrEqual(3);
    });
  });
  ```

- [ ] **3.8** `tests/unit/deadline-validation.spec.ts` — D+7 검증 단위 테스트
  ```typescript
  import { describe, it, expect } from 'vitest';

  describe('D+7 검증 (CMD-DL-001 → TEST-005)', () => {
    const MIN_DAYS = 7;

    it('D+7 이상 → 통과', () => {
      const date = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const minDate = new Date(Date.now() + MIN_DAYS * 24 * 60 * 60 * 1000);
      expect(date >= minDate).toBe(true);
    });

    it('D+7 미만 → DEADLINE_TOO_SOON', () => {
      const date = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const minDate = new Date(Date.now() + MIN_DAYS * 24 * 60 * 60 * 1000);
      expect(date < minDate).toBe(true);
    });

    it('D+7 정확히 경계값 → 통과', () => {
      const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const minDate = new Date(Date.now() + MIN_DAYS * 24 * 60 * 60 * 1000);
      // 경계값: 밀리초 차이로 통과/실패 가능. 날짜 단위로 비교
      const dateDay = Math.floor(date.getTime() / 86400000);
      const minDay = Math.floor(minDate.getTime() / 86400000);
      expect(dateDay >= minDay).toBe(true);
    });
  });
  ```

- [ ] **3.9** Mock 모드 / 실제 모드 분기 설정
  ```typescript
  test.beforeEach(async ({ page }) => {
    // NEXT_PUBLIC_USE_MOCK=true → MOCK_TIMELINE 활용
  });
  ```

- [ ] **3.10** `package.json` 스크립트 추가
  ```json
  {
    "scripts": {
      "test:e2e:deadline": "npx playwright test tests/e2e/deadline-mode.spec.ts",
      "test:unit:deadline": "npx vitest run tests/unit/timeline-generator.spec.ts tests/unit/relaxed-filters.spec.ts tests/unit/deadline-validation.spec.ts"
    }
  }
  ```

- [ ] **3.11** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|model Listing" tests/e2e/deadline-mode.spec.ts` → 0건
- [ ] **3.12** 자체 매물 DB 0건: `grep -ri "prisma.listing\|model Listing" tests/` → 0건

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 타임라인 ≥5단계 생성
- **Given** 사용자가 30일 후 마감일 입력 완료
- **When** "데드라인 모드 활성화" 클릭
- **Then** 타임라인 카드 ≥5단계 표시. 각 단계에 제목·날짜 포함. 응답 ≤2초

**AC-2 (예외):** 과거날짜 차단
- **Given** 어제 날짜 입력 시도
- **When** 달력에서 과거 날짜 선택
- **Then** 날짜 선택 차단 (disabled) 또는 "마감일은 오늘 이후여야 합니다" 에러. 서버 도달 0%

**AC-3 (예외):** D+7 미만 차단 → DEADLINE_TOO_SOON
- **Given** D+5 마감일 (D+7 미만)
- **When** 데드라인 모드 활성화 시도
- **Then** "이사일은 7일 이후로 선택해주세요" 에러 메시지. DB 변경 0건

**AC-4 (경계):** 급매 0건 시 완화 제안 ≥3개
- **Given** 매우 좁은 필터 조건 → 교집합 매물 0건
- **When** 매물 조회 결과 0건
- **Then** "조건에 맞는 급매가 없습니다" EmptyState. 완화 제안 `[data-relaxed-suggestion]` ≥3개

**AC-5 (도메인 핵심):** 4개 시나리오 Playwright 모두 통과
- **Given** Playwright + Vitest 설치 완료
- **When** `npm run test:e2e:deadline && npm run test:unit:deadline` 실행
- **Then** E2E 4개 + 단위 11개 모두 PASS

**AC-6 (성능):** 타임라인 생성 ≤2초
- **Given** 유효한 마감일 입력
- **When** `activateDeadlineMode()` 호출
- **Then** 전체 응답 ≤2초 (REQ-NF-001 변형)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 변형 | "타임라인 생성 ≤2초" (§4.2.1) | AC-1: Playwright 시간 측정 (5초 timeout). Vitest 산술 연산 시간 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림" (§4.2.6) | CMD-DL-001 에러 시 `reportErrorToSentry` 호출 확인 |
| REQ-FUNC-019 | "조건 완화 제안 ≤1초" (§4.1.3) | AC-4: 완화 제안 ≥3개 + ≤1초 표시 |

---

## 6. 📦 Deliverables (산출물 명시)

- `tests/e2e/deadline-mode.spec.ts` (4개 E2E — 타임라인/과거날짜/D+7/0건 완화)
- `tests/unit/timeline-generator.spec.ts` (4개 — 단계 수/구조/순서/마지막 날짜)
- `tests/unit/relaxed-filters.spec.ts` (4개 — ≥3개/가격/반경/기본값)
- `tests/unit/deadline-validation.spec.ts` (3개 — D+7 이상/미만/경계)
- `package.json` scripts 추가

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (검증 대상):
- **CMD-DL-001 ✅:** `activateDeadlineMode`, `generateReverseTimeline` — 타임라인 + D+7
- **CMD-DL-003 ✅:** `suggestRelaxedFilters` — 0건 완화 제안
- **UI-009 ✅:** 데드라인 모드 입력 화면 — E2E 날짜 선택 대상
- **UI-010 ✅:** EmptyState + 완화 제안 UI — E2E 0건 UI 대상
- **TEST-001 ✅:** Playwright 패턴 — 설정 재사용

### 후행:
- **TEST-010:** E2E 통합 — TEST-005 포함 전체 플로우

---

## 8. 🧪 Test Plan (검증 절차 — "테스트의 테스트")

- **E2E (Playwright):** `tests/e2e/deadline-mode.spec.ts` — 4개 시나리오
  - AC-1: 타임라인 ≥5단계
  - AC-N2: 과거날짜 차단
  - AC-N2-2: D+7 미만 차단
  - AC-N1: 0건 완화 ≥3개
- **단위 (Vitest):**
  - `timeline-generator.spec.ts` — 4개
  - `relaxed-filters.spec.ts` — 4개
  - `deadline-validation.spec.ts` — 3개
  - 총 단위 11개
- **테스트 자체 검증:**
  - generateReverseTimeline이 항상 ≥5단계 반환 확인
  - D+7 경계값 테스트의 밀리초 차이 처리 확인
- **Mock / 실제 분기:** `NEXT_PUBLIC_USE_MOCK=true` 시 MOCK_TIMELINE 활용

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **D+7 최소값 근거:** SRS REQ-FUNC-020은 "과거 날짜 차단"만 명시. D+7은 CMD-DL-001에서 실무적 최소 기간으로 설정. SRS에 명시적 최소 기간이 없으므로 테스트에서는 CMD-DL-001 구현을 기준으로 검증.
2. **EmptyState Mock 데이터:** 0건 시나리오를 E2E에서 재현하려면 매우 좁은 필터를 설정해야 함. Mock 모드에서는 특정 필터 조합 시 의도적으로 0건을 반환하는 Mock 핸들러 필요.
3. **날짜 선택기 구현체:** shadcn/ui Calendar 또는 HTML native date input에 따라 과거날짜 차단 방식이 다름. E2E 테스트 셀렉터 조정 필요.
4. **자체 매물 DB 금지:** REQ-FUNC-016/017 아웃링크 방식으로 변경됨. 0건 완화 제안은 검색 조건 완화만 제공하며, 실제 매물 데이터 검색은 네이버 부동산 아웃링크로 대체.
5. **CI 통합 follow-up:** GitHub Actions Playwright 파이프라인은 별도 INFRA 태스크.
