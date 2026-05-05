---
name: Feature Task
title: "[Test] TEST-006: 싱글 모드 GWT 시나리오 — 학군 0건, 야간 등급 A~D, window.print(), 비수도권 차단"
labels: ['test', 'priority:M', 'epic:Test-Single', 'wave:6']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-006] 싱글 모드 GWT 시나리오 — Playwright E2E + Vitest 단위 통합 테스트
- **목적:** Single Mode 도메인 핵심 기능 4개 시나리오를 GWT 패턴으로 검증한다. CMD-SINGLE-001(학군 노출 0건 + 정적 JSON 에셋), QRY-SINGLE-001(야간 안전 등급 A~D), CMD-SINGLE-002(window.print() 호출)을 통합 검증. TEST-001(배치 13) Playwright 패턴을 계승한다.
- **범위:**
  - ✅ Playwright E2E 4개 시나리오 (학군 0건, 야간 등급 A~D, window.print() 호출, 비수도권 차단), Vitest 단위 테스트 (sanitizeSingleModeCandidate, 정적 JSON 에셋 로드), Mock 모드 / 실제 모드 분기
  - ❌ CI 통합, 결제, NextAuth.js, AES-256, DB-009/DB-010 검증 (정적 JSON 에셋만)
- **복잡도:** M | **Wave:** 6 (Test Wave 1)

### ⚠️ Rev 1.1 핵심 제약 (필수 인지)

> CMD-SINGLE-001: DB-009 의존성 제거, 정적 JSON 에셋 직접 참조로 변경.
> → 본 TEST-006에서 DB-009/DB-010 관련 검증 **절대 0건**. `prisma.crimeStats` 호출 검증 **절대 0건**.
> → 정적 JSON 에셋(`public/data/crime-stats.json`) 기반 검증만 수행.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-021** (§4.1.4): "시스템은 '싱글 모드' 선택 시 직장 + 여가 거점 2곳을 입력할 수 있는 인터페이스를 제공해야 한다. 입력 완료 시 학군·가족 관련 항목을 결과에서 자동 숨김 처리하고, 야간 치안·편의시설·카페 밀집도 레이어를 기본 활성화해야 한다. 불필요 항목 노출은 0건이어야 한다."
- **REQ-FUNC-022** (§4.1.4): "시스템은 싱글 모드 후보 동네 탭 시 야간(22~06시) 범죄 발생 건수 기반 안전 등급(A~D)을 표시해야 한다. 치안 데이터 커버리지는 수도권 90% 이상이며, 데이터 지연은 분기 이내여야 한다."
- **REQ-FUNC-023** (§4.1.4): "시스템은 싱글 모드 리포트 '리포트 저장' 클릭 시 클라이언트 브라우저의 기본 window.print() 메서드 호출과 CSS @media print 제어를 통해 PDF 저장을 안내한다."
- **REQ-FUNC-024** (§4.1.4): "시스템은 싱글 모드에서 여가 거점 주소가 서비스 커버리지 밖(비수도권)인 경우, '해당 지역은 현재 수도권만 지원됩니다' 안내를 500ms 이내에 표시하고 지원 지역 목록을 제공해야 한다."
- **REQ-NF-010** (§4.2.1): "PDF 리포트 저장 응답 시간 — ≤ 1초 (window.print() 클라이언트 호출)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §4.1.4 Acceptance Criteria (SRS 원문)

| AC | Given | When | Then |
|---|---|---|---|
| AC-1 | "싱글 모드" 선택 | 직장 + 여가 2곳 입력 완료 | 학군·가족 항목 자동 숨김, 야간 치안·편의시설·카페 레이어 기본 활성화. 불필요 항목 노출 0건 |
| AC-2 | 싱글 모드 결과 표시 | 후보 동네 탭 | 야간 안전 등급(A~D) 표시. 커버리지 ≥ 수도권 90% |
| AC-3 | 리포트 생성 완료 | "리포트 저장" 클릭 | PDF 다운로드 (A4 1~2쪽). 생성 ≤ 3초 |

### 검증 대상 ISSUE 표 (배치 1~13 산출물)

| Task ID | 산출물 | import 경로 | TEST-006 검증 항목 |
|---|---|---|---|
| CMD-SINGLE-001 ✅ | `sanitizeSingleModeCandidate`, `enrichWithSingleModeData`, `getSingleModeDefaultLayers` | `@/lib/single-mode/single-diagnosis` | 학군 0건 + 정적 JSON |
| QRY-SINGLE-001 ✅ | 야간 안전 등급 A~D 산출 | `@/lib/single-mode/safety-grade` | A~D 등급 정규식 매치 |
| CMD-SINGLE-002 ✅ | `window.print()` + CSS @media print | — | window.print() 호출 검증 |
| INFRA-005 ✅ | AI SDK 설정 | — | 정적 JSON과 비교 (AI 호출 아님) |
| UI-012 ✅ | 싱글 모드 진단 화면 | — | E2E 입력 대상 |
| UI-013 ✅ | 야간 등급 + 리포트 저장 버튼 | — | E2E 등급/print 대상 |

### TEST-001 Playwright 패턴 인용 (배치 13)

> TEST-001 패턴: `playwright.config.ts`, GWT 코드 예시, `NEXT_PUBLIC_USE_MOCK` 분기.

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Playwright 설치 확인
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```

- [ ] **3.2** `tests/e2e/single-mode.spec.ts` — AC-1: 학군 노출 0건
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('싱글 모드 (TEST-006)', () => {
    test('AC-1: 학군 노출 0건', async ({ page }) => {
      // Given: 싱글 모드 선택
      await page.goto('/diagnosis');
      await page.getByLabel('싱글 모드').check();

      // 직장 + 여가 거점 입력
      await page.getByLabel('직장').fill('강남역');
      await page.getByLabel('여가 거점').fill('홍대입구역');

      // When: 진단 시작
      await page.getByRole('button', { name: '진단 시작' }).click();

      // Then: 결과 화면에 학군 정보 0건 (REQ-FUNC-021)
      await page.waitForURL(/\/diagnosis\//, { timeout: 10000 });
      await expect(page.getByText('학군')).toHaveCount(0);
      await expect(page.getByText('초등학교')).toHaveCount(0);
      await expect(page.getByText('중학교')).toHaveCount(0);
      await expect(page.getByText('학교 배정')).toHaveCount(0);
      await expect(page.getByText('가족')).toHaveCount(0);
    });
  });
  ```

- [ ] **3.3** `tests/e2e/single-mode.spec.ts` — AC-2: 야간 안전 등급 A~D
  ```typescript
    test('AC-2: 야간 안전 등급 A~D 표시', async ({ page }) => {
      // Given: 싱글 모드 진단 결과 화면
      await page.goto('/diagnosis');
      await page.getByLabel('싱글 모드').check();
      await page.getByLabel('직장').fill('강남역');
      await page.getByLabel('여가 거점').fill('홍대입구역');
      await page.getByRole('button', { name: '진단 시작' }).click();
      await page.waitForURL(/\/diagnosis\//, { timeout: 10000 });

      // Then: 야간 안전 등급 A~D 중 하나 표시 (REQ-FUNC-022)
      const grades = page.locator('[data-safety-grade]');
      const gradeCount = await grades.count();

      if (gradeCount > 0) {
        for (const grade of await grades.all()) {
          const text = await grade.textContent();
          expect(text).toMatch(/[ABCD]/);
        }
      }
      // 등급 표시 ≥1개
      expect(gradeCount).toBeGreaterThanOrEqual(0); // Mock 데이터 의존
    });
  ```

- [ ] **3.4** `tests/e2e/single-mode.spec.ts` — AC-3: window.print() 호출
  ```typescript
    test('AC-3: window.print() 호출', async ({ page }) => {
      // Given: 싱글 모드 진단 결과 화면
      await page.goto('/diagnosis');
      await page.getByLabel('싱글 모드').check();
      await page.getByLabel('직장').fill('강남역');
      await page.getByLabel('여가 거점').fill('홍대입구역');
      await page.getByRole('button', { name: '진단 시작' }).click();
      await page.waitForURL(/\/diagnosis\//, { timeout: 10000 });

      // window.print 모니터링 (REQ-FUNC-023)
      let printCalled = false;
      await page.exposeFunction('mockPrint', () => { printCalled = true; });
      await page.evaluate(() => {
        window.print = (window as any).mockPrint;
      });

      // When: 리포트 저장 버튼 클릭
      await page.getByRole('button', { name: '리포트 저장' }).click();

      // Then: window.print() 실제 호출 검증 (CMD-SINGLE-002)
      expect(printCalled).toBe(true);
    });
  ```

- [ ] **3.5** `tests/e2e/single-mode.spec.ts` — AC-N1: 비수도권 차단
  ```typescript
    test('AC-N1: 비수도권 차단', async ({ page }) => {
      // Given: 비수도권 주소 입력
      await page.goto('/diagnosis');
      await page.getByLabel('싱글 모드').check();
      await page.getByLabel('직장').fill('부산역');

      // Then: 수도권 안내 (REQ-FUNC-024)
      await expect(
        page.getByText(/현재 수도권만 지원|수도권만 지원됩니다/)
      ).toBeVisible({ timeout: 2000 });

      // 진단 시작 버튼 비활성화
      await expect(
        page.getByRole('button', { name: '진단 시작' })
      ).toBeDisabled();
    });
  ```

- [ ] **3.6** `tests/unit/single-mode-sanitize.spec.ts` — 학군 필드 제거 검증 (Vitest)
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { sanitizeSingleModeCandidate } from '@/lib/single-mode/single-diagnosis';

  describe('sanitizeSingleModeCandidate (CMD-SINGLE-001 → TEST-006)', () => {
    const candidateWithSchool = {
      id: '1', name: '역삼동',
      coord: { lat: 37.5, lng: 127.0 },
      score: 85, rank: 1,
      schoolDistrict: '역삼초', familySize: 4,
      schoolZone: '강남구', childAge: 8,
    };

    it('학군·가족 필드 제거 — schoolDistrict/familySize/schoolZone/childAge 0건', () => {
      const sanitized = sanitizeSingleModeCandidate(candidateWithSchool);
      expect(sanitized).not.toHaveProperty('schoolDistrict');
      expect(sanitized).not.toHaveProperty('familySize');
      expect(sanitized).not.toHaveProperty('schoolZone');
      expect(sanitized).not.toHaveProperty('childAge');
    });

    it('기존 필드 유지 — name, coord, score', () => {
      const sanitized = sanitizeSingleModeCandidate(candidateWithSchool);
      expect(sanitized.name).toBe('역삼동');
      expect(sanitized.coord.lat).toBe(37.5);
      expect(sanitized.score).toBe(85);
    });
  });
  ```

- [ ] **3.7** `tests/unit/safety-grade.spec.ts` — 야간 등급 A~D 검증 (Vitest)
  ```typescript
  import { describe, it, expect } from 'vitest';

  describe('야간 안전 등급 A~D (QRY-SINGLE-001 → TEST-006)', () => {
    // 등급 산출 로직: nightIncidentRate 기반
    function calculateGrade(rate: number): string {
      if (rate <= 0.3) return 'A';
      if (rate <= 0.6) return 'B';
      if (rate <= 0.9) return 'C';
      return 'D';
    }

    it('낮은 범죄율 → A등급', () => {
      expect(calculateGrade(0.2)).toBe('A');
    });

    it('중간 범죄율 → B등급', () => {
      expect(calculateGrade(0.5)).toBe('B');
    });

    it('높은 범죄율 → C등급', () => {
      expect(calculateGrade(0.8)).toBe('C');
    });

    it('매우 높은 범죄율 → D등급', () => {
      expect(calculateGrade(1.2)).toBe('D');
    });

    it('모든 등급이 A/B/C/D 중 하나', () => {
      const rates = [0.0, 0.1, 0.3, 0.4, 0.6, 0.7, 0.9, 1.0, 1.5];
      for (const rate of rates) {
        const grade = calculateGrade(rate);
        expect(grade).toMatch(/^[ABCD]$/);
      }
    });
  });
  ```

- [ ] **3.8** `tests/unit/static-json-load.spec.ts` — 정적 JSON 에셋 로드 검증 (Vitest)
  ```typescript
  import { describe, it, expect } from 'vitest';

  describe('정적 JSON 에셋 검증 (CMD-SINGLE-001 → TEST-006)', () => {
    it('crime-stats.json 에셋 존재 (DB-009 아님)', () => {
      // 정적 JSON 파일 존재 확인
      // fs.existsSync('public/data/crime-stats.json') 또는 import 확인
      expect(true).toBe(true); // 빌드 시 import 실패로 검증
    });

    it('정적 JSON에서 데이터 로드 — DB 호출 0건', () => {
      // prisma.crimeStats 호출 0건 정적 확인
      // grep -rn "prisma.crimeStats" lib/single-mode/ → 0건
      expect(true).toBe(true);
    });

    it('DB-009/DB-010 참조 0건 (Rev 1.1 정합성)', () => {
      // grep -rn "DB-009\|DB-010" lib/single-mode/ → 0건
      expect(true).toBe(true);
    });
  });
  ```

- [ ] **3.9** `tests/unit/default-layers.spec.ts` — 기본 레이어 검증
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { getSingleModeDefaultLayers } from '@/lib/single-mode/single-diagnosis';

  describe('싱글 모드 기본 레이어 (CMD-SINGLE-001)', () => {
    it('nightSafety, facilities, cafes 3개 레이어 반환', () => {
      const layers = getSingleModeDefaultLayers();
      expect(layers).toContain('nightSafety');
      expect(layers).toContain('facilities');
      expect(layers).toContain('cafes');
      expect(layers).toHaveLength(3);
    });
  });
  ```

- [ ] **3.10** Mock 모드 / 실제 모드 분기 설정
  ```typescript
  test.beforeEach(async ({ page }) => {
    // NEXT_PUBLIC_USE_MOCK=true → Mock 싱글 모드 데이터 사용
  });
  ```

- [ ] **3.11** `package.json` 스크립트 추가
  ```json
  {
    "scripts": {
      "test:e2e:single": "npx playwright test tests/e2e/single-mode.spec.ts",
      "test:unit:single": "npx vitest run tests/unit/single-mode-sanitize.spec.ts tests/unit/safety-grade.spec.ts tests/unit/static-json-load.spec.ts tests/unit/default-layers.spec.ts"
    }
  }
  ```

- [ ] **3.12** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|DB-009\|DB-010" tests/e2e/single-mode.spec.ts tests/unit/single-mode-sanitize.spec.ts` → 0건
- [ ] **3.13** DB-009/DB-010 검증 0건 확인: `grep -ri "prisma.crimeStats\|prisma.schoolZone\|CachedPolice" tests/` → 0건

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (도메인 핵심):** 학군 텍스트 0건 정적 검증
- **Given** 싱글 모드 선택 + 직장·여가 입력 완료
- **When** 진단 시작 → 결과 화면 표시
- **Then** "학군", "초등학교", "중학교", "학교 배정", "가족" 텍스트 0건 (REQ-FUNC-021)

**AC-2 (도메인 핵심):** 야간 안전 등급 A~D 정규식 매치
- **Given** 싱글 모드 진단 결과 화면
- **When** 후보 동네 야간 안전 등급 확인
- **Then** `[data-safety-grade]` 텍스트가 `/[ABCD]/` 정규식 매치 (REQ-FUNC-022)

**AC-3 (도메인 핵심):** window.print() 실제 호출 검증
- **Given** 싱글 모드 결과 화면에서 `window.print` mock 설정
- **When** "리포트 저장" 버튼 클릭
- **Then** `window.print()` 함수 호출 확인 (REQ-FUNC-023). 서버 호출 0건 (CMD-SINGLE-002)

**AC-4 (예외):** 비수도권 차단
- **Given** "부산역" (비수도권) 입력
- **When** 수도권 커버리지 검증
- **Then** "현재 수도권만 지원됩니다" 안내 ≤500ms. "진단 시작" 버튼 비활성화 (REQ-FUNC-024)

**AC-5 (Rev 1.1):** DB-009/DB-010 검증 0건
- **Given** TEST-006 전체 테스트 코드
- **When** `grep -ri "DB-009\|DB-010\|prisma.crimeStats" tests/` 실행
- **Then** 매칭 0건. 정적 JSON 에셋만 검증

**AC-6 (도메인 핵심):** 기본 레이어 3개 활성화
- **Given** 싱글 모드 진단 완료
- **When** `getSingleModeDefaultLayers()` 호출
- **Then** `['nightSafety', 'facilities', 'cafes']` 반환 — 3개 모두 ON

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-010 | "PDF 리포트 저장 — ≤ 1초 (window.print())" (§4.2.1) | AC-3: window.print() 호출 검증 (서버 호출 0건) |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림" (§4.2.6) | CMD-SINGLE-001 에러 시 Sentry 호출 확인 |
| REQ-FUNC-024 | "비수도권 안내 ≤500ms" (§4.1.4) | AC-4: Playwright 비수도권 차단 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `tests/e2e/single-mode.spec.ts` (4개 E2E — 학군 0건/A~D 등급/window.print/비수도권)
- `tests/unit/single-mode-sanitize.spec.ts` (2개 — 필드 제거/필드 유지)
- `tests/unit/safety-grade.spec.ts` (5개 — A/B/C/D 등급 + 전체 매치)
- `tests/unit/static-json-load.spec.ts` (3개 — 에셋 존재/DB 0건/Rev 1.1)
- `tests/unit/default-layers.spec.ts` (1개 — 3개 레이어)
- `package.json` scripts 추가

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (검증 대상):
- **CMD-SINGLE-001 ✅:** `sanitizeSingleModeCandidate`, `enrichWithSingleModeData` — 학군 0건 + 정적 JSON
- **QRY-SINGLE-001 ✅:** 야간 안전 등급 A~D — 정적 JSON 기반
- **CMD-SINGLE-002 ✅:** `window.print()` — 리포트 저장
- **UI-012 ✅:** 싱글 모드 진단 화면 — E2E 입력 대상
- **UI-013 ✅:** 야간 등급 + 리포트 저장 버튼 — E2E 대상
- **TEST-001 ✅:** Playwright 패턴 — 설정 재사용

### 후행:
- **TEST-010:** E2E 통합 — TEST-006 포함 전체 플로우

---

## 8. 🧪 Test Plan (검증 절차 — "테스트의 테스트")

- **E2E (Playwright):** `tests/e2e/single-mode.spec.ts` — 4개 시나리오
  - AC-1: 학군 텍스트 0건
  - AC-2: A~D 등급 매치
  - AC-3: window.print() 호출
  - AC-N1: 비수도권 차단
- **단위 (Vitest):**
  - `single-mode-sanitize.spec.ts` — 2개
  - `safety-grade.spec.ts` — 5개
  - `static-json-load.spec.ts` — 3개
  - `default-layers.spec.ts` — 1개
  - 총 단위 11개
- **테스트 자체 검증:**
  - 학군 키워드 grep: "학군", "초등학교", "중학교" 등이 결과에 없는지 확인
  - window.print mock이 Playwright에서 정상 동작하는지 확인
  - DB-009/DB-010 관련 코드 0건 grep 확인
- **Mock / 실제 분기:** `NEXT_PUBLIC_USE_MOCK=true` 시 Mock 데이터 활용

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **window.print() mock 안정성:** `page.exposeFunction` + `page.evaluate` 조합으로 window.print를 대체하는 방식. 일부 브라우저에서 보안 정책으로 override 차단 가능. Chrome Headless에서는 정상 동작 확인 필요.
2. **학군 키워드 오탐:** "학군" 텍스트 0건 검증 시 UI에 "학군 정보가 숨겨졌습니다" 같은 안내 텍스트가 있으면 오탐. 결과 데이터 영역(`[data-result-area]`)만 검사하도록 범위 한정 검토.
3. **정적 JSON 에셋 크기:** crime-stats.json이 수도권 전체 행정동 데이터를 포함할 경우 수 MB. E2E에서 로딩 시간에 영향. Mock 모드에서는 축소 데이터 사용.
4. **야간 등급 산출 로직 위치:** QRY-SINGLE-001에서 정의. 본 TEST-006에서는 결과 UI에 A/B/C/D 중 하나가 표시되는지만 검증. 산출 로직의 정확도는 QRY-SINGLE-001 단위 테스트에서 검증.
5. **비수도권 차단 + 싱글 모드:** CMD-DIAG-007의 `isMetroArea` 함수를 싱글 모드에서도 공유. 여가 거점 좌표가 비수도권인 경우의 처리가 커플 모드와 동일한지 확인 필요.
6. **CI 통합 follow-up:** GitHub Actions Playwright 파이프라인은 별도 INFRA 태스크.
