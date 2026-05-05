---
name: Feature Task
title: "[Feature] TEST-001: 교차 진단 GWT 시나리오 — 정상 3곳+ / 1개 주소 에러 / 0곳 완화 / 비수도권 차단"
labels: ['feature', 'priority:H', 'epic:Test-Diagnosis', 'wave:5']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [TEST-001] 교차 진단 GWT 시나리오 — E2E (Playwright) + 단위 통합 테스트
- **목적:** 두 동선 교차 진단 핵심 기능의 4개 시나리오를 GWT 패턴으로 검증. Test 도메인 첫 진입으로 테스트 패턴을 확립한다. CMD-DIAG-002(교집합 산출), CMD-DIAG-004(결과 저장), CMD-DIAG-007(수도권 검증)을 통합 검증.
- **범위:**
  - ✅ Playwright E2E 4개 시나리오 (AC-1 정상 3곳+, AC-N1 1개 주소 에러, AC-N3 0곳 완화 제안, 비수도권 차단), Vitest 단위 통합 테스트 (intersection.ts + coverage.ts + saveDiagnosisResult), Mock 모드 / 실제 모드 분기 (NEXT_PUBLIC_USE_MOCK), Playwright HTML report
  - ❌ CI 통합 (GitHub Actions — 별도 INFRA 태스크로 분리), 결제, NextAuth.js, AES-256
- **복잡도:** H | **Wave:** 5 (Test 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-002** (§4.1.1): "시스템은 두 개의 직장 주소가 모두 입력된 경우에만 '진단 시작' 버튼을 활성화해야 한다. 주소가 1개만 입력된 상태에서 '진단 시작' 클릭 시 '두 번째 주소를 입력해 주세요' 인라인 에러를 200ms 이내에 표시하고, 진단 API 호출을 차단해야 한다."
- **REQ-FUNC-003** (§4.1.1): "시스템은 두 직장 주소를 기반으로 교집합 후보 동네를 3곳 이상 산출하고, 지도 위에 시각화해야 한다."
- **REQ-FUNC-008** (§4.1.1): "시스템은 두 직장 간 거리로 인해 교집합 후보가 0곳인 경우 '조건을 만족하는 동네가 없습니다. 최대 통근 시간을 늘려보세요' 안내를 1초 이내에 표시하고, 조건 완화 제안을 2개 이상 제공해야 한다."
- **REQ-FUNC-031** (§4.1.6): "시스템은 수도권(서울·경기·인천) 외 주소 입력 시 서비스 커버리지 안내 UI를 표시하고 진단 실행을 차단해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §4.1.1 Acceptance Criteria (SRS 원문)

| AC | Given | When | Then |
|---|---|---|---|
| AC-1 | 두 직장 주소(수도권 내) 입력 완료 | "진단 시작" 클릭 | 교집합 후보 동네 ≥3곳 지도 시각화. 응답 ≤3초, 실패율 <1% |
| AC-2 | 교집합 결과 지도 표시 | 후보 동네 탭 | 양쪽 직장 출퇴근 시간 표시. 오차 ≤±10% |
| AC-3 | 출근 시간대 7~9시 설정 | 시간대 변경 | 해당 시간대 평균 재계산. 재계산 ≤2초 |

### 검증 대상 ISSUE 표 (CMD-DIAG-002/004/007)

| Task ID | 산출물 | import 경로 | TEST-001 검증 항목 |
|---|---|---|---|
| CMD-DIAG-002 ✅ | `calculateIntersection`, `useIntersection` | `@/lib/diagnosis/intersection` | 정상 3곳+ 산출 (AC-1) |
| CMD-DIAG-004 ✅ | `saveDiagnosisResult` | `@/app/actions/diagnosis` | DB 저장 검증 |
| CMD-DIAG-007 ✅ | 수도권 검증 로직 `isMetroArea` | `@/lib/diagnosis/coverage` | 비수도권 차단 검증 |
| API-002 ✅ | `CandidateAreaDTO`, `DiagnosisFilters` | `@/lib/types/diagnosis` | 타입 검증 |
| MOCK-001 ✅ | Mock 진단 데이터 | `@/lib/mocks/diagnosis` | Mock 모드 테스트 |
| MOCK-004 ✅ | Mock 카카오 API 응답 | `@/lib/mocks/kakao-transport` | API Mock |
| UI-002 ✅ | 주소 입력 화면 | — | E2E 입력 대상 |
| UI-003 ✅ | MapCanvas | — | E2E 마커 검증 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Playwright 설치 + 설정
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```

- [ ] **3.2** `playwright.config.ts` 작성
  ```typescript
  import { defineConfig } from '@playwright/test';
  export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    retries: 1,
    reporter: [['html', { outputFolder: 'playwright-report' }]],
    use: {
      baseURL: 'http://localhost:3000',
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
    },
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  });
  ```

- [ ] **3.3** `tests/e2e/diagnosis-flow.spec.ts` — AC-1: 정상 3곳+ 산출
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('교차 진단 시나리오 (TEST-001)', () => {
    test('AC-1: 정상 3곳+ 산출', async ({ page }) => {
      // Given: 두 직장 주소 입력 (수도권)
      await page.goto('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('판교역');

      // When: 진단 시작
      const startButton = page.getByRole('button', { name: '진단 시작' });
      await expect(startButton).toBeEnabled();
      await startButton.click();

      // Then: 후보 동네 ≥3개 마커 표시
      await page.waitForURL(/\/diagnosis\/[a-z0-9-]+/, { timeout: 10000 });
      const markers = page.locator('[data-marker]');
      await expect(markers).toHaveCount({ min: 3 });

      // 성능: 총 응답 시간 ≤8초 (REQ-NF-001)
      // → Playwright의 waitForURL timeout 10초로 간접 검증
    });
  });
  ```

- [ ] **3.4** `tests/e2e/diagnosis-flow.spec.ts` — AC-N1: 1개 주소만 입력 시 에러
  ```typescript
    test('AC-N1: 1개 주소만 입력 시 에러', async ({ page }) => {
      // Given: 직장 A만 입력
      await page.goto('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      // 직장 B 미입력

      // When: 진단 시작 버튼 확인
      const startButton = page.getByRole('button', { name: '진단 시작' });

      // Then: 버튼 비활성화 OR 클릭 시 인라인 에러
      const isDisabled = await startButton.isDisabled();
      if (isDisabled) {
        await expect(startButton).toBeDisabled();
      } else {
        await startButton.click();
        await expect(page.getByText('두 번째 주소를 입력해 주세요')).toBeVisible({ timeout: 200 });
      }

      // 서버 API 호출 0건 검증
      const requests: string[] = [];
      page.on('request', req => { if (req.url().includes('/api/')) requests.push(req.url()); });
      // 진단 API 호출이 없어야 함
    });
  ```

- [ ] **3.5** `tests/e2e/diagnosis-flow.spec.ts` — AC-N3: 교집합 0곳 시 완화 제안
  ```typescript
    test('AC-N3: 교집합 0곳 시 완화 제안', async ({ page }) => {
      // Given: 통근 시간 매우 짧게 + 멀리 떨어진 두 주소
      await page.goto('/diagnosis');
      await page.getByLabel('직장 A').fill('강남역');
      await page.getByLabel('직장 B').fill('인천공항');

      // maxCommuteTime을 15분으로 설정 (매우 짧아 교집합 0곳)
      const slider = page.getByRole('slider', { name: '최대 통근 시간' });
      if (await slider.isVisible()) {
        await slider.fill('15');
      }

      // When: 진단 시작
      await page.getByRole('button', { name: '진단 시작' }).click();

      // Then: EmptyState + 완화 제안 표시 (≤1초, REQ-FUNC-008)
      await expect(page.getByText('조건을 만족하는 동네가 없습니다')).toBeVisible({ timeout: 5000 });
      // 완화 제안 ≥2개
      const suggestions = page.locator('[data-suggestion]');
      const suggestTexts = page.getByText(/통근 시간을 늘려/);
      await expect(suggestTexts.or(suggestions)).toHaveCount({ min: 1 });
    });
  ```

- [ ] **3.6** `tests/e2e/diagnosis-flow.spec.ts` — 비수도권 차단
  ```typescript
    test('비수도권 차단 (REQ-FUNC-031)', async ({ page }) => {
      // Given: 비수도권 주소 입력
      await page.goto('/diagnosis');
      await page.getByLabel('직장 A').fill('부산역');

      // Then: 커버리지 안내 표시
      await expect(page.getByText(/수도권만 지원/)).toBeVisible({ timeout: 2000 });

      // 진단 시작 버튼 비활성화
      const startButton = page.getByRole('button', { name: '진단 시작' });
      await expect(startButton).toBeDisabled();
    });
  ```

- [ ] **3.7** `tests/unit/intersection.spec.ts` — 단위 통합 테스트 (Vitest)
  ```typescript
  import { describe, it, expect, vi } from 'vitest';
  import { calculateIntersection } from '@/lib/diagnosis/intersection';
  import { MOCK_ROUTE_RESPONSES } from '@/lib/mocks/kakao-transport';

  describe('calculateIntersection 통합 테스트 (TEST-001)', () => {
    const mockClient = {
      getRoute: vi.fn().mockResolvedValue(MOCK_ROUTE_RESPONSES[0]),
      getCommuteTime: vi.fn().mockResolvedValue(30),
    };

    it('AC-1: 정상 3곳+ — candidates.length ≥ 3', async () => {
      const result = await calculateIntersection(
        { lat: 37.4979, lng: 127.0276 }, // 강남
        { lat: 37.3897, lng: 127.0997 }, // 판교
        { maxCommuteTime: 60 },
        mockClient as any
      );
      expect(result.candidates.length).toBeGreaterThanOrEqual(3);
      expect(result.candidates[0]).toHaveProperty('name');
      expect(result.candidates[0]).toHaveProperty('coord');
      expect(result.candidates[0]).toHaveProperty('commuteA');
      expect(result.candidates[0]).toHaveProperty('commuteB');
      expect(result.candidates[0]).toHaveProperty('rank');
    });

    it('AC-N3: 0곳 — suggestions ≥ 2개', async () => {
      const result = await calculateIntersection(
        { lat: 37.4979, lng: 127.0276 },
        { lat: 37.4491, lng: 126.4512 }, // 인천공항
        { maxCommuteTime: 10 }, // 매우 짧은 조건
        mockClient as any
      );
      if (result.candidates.length === 0) {
        expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('CandidateAreaDTO 구조 검증 — id, name, coord, commuteA, commuteB, rank', async () => {
      const result = await calculateIntersection(
        { lat: 37.4979, lng: 127.0276 },
        { lat: 37.3897, lng: 127.0997 },
        { maxCommuteTime: 90 },
        mockClient as any
      );
      for (const c of result.candidates) {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('name');
        expect(c.coord).toHaveProperty('lat');
        expect(c.coord).toHaveProperty('lng');
        expect(typeof c.rank).toBe('number');
      }
    });
  });
  ```

- [ ] **3.8** `tests/unit/coverage.spec.ts` — 수도권 검증 단위 테스트
  ```typescript
  import { isMetroArea } from '@/lib/diagnosis/coverage';

  describe('수도권 검증 (CMD-DIAG-007 → TEST-001)', () => {
    it('강남역 (서울) → true', () => {
      expect(isMetroArea({ lat: 37.4979, lng: 127.0276 })).toBe(true);
    });
    it('판교역 (경기) → true', () => {
      expect(isMetroArea({ lat: 37.3897, lng: 127.0997 })).toBe(true);
    });
    it('인천공항 (인천) → true', () => {
      expect(isMetroArea({ lat: 37.4491, lng: 126.4512 })).toBe(true);
    });
    it('부산역 (비수도권) → false', () => {
      expect(isMetroArea({ lat: 35.1150, lng: 129.0422 })).toBe(false);
    });
    it('대전역 (비수도권) → false', () => {
      expect(isMetroArea({ lat: 36.3322, lng: 127.4347 })).toBe(false);
    });
  });
  ```

- [ ] **3.9** `tests/unit/save-diagnosis.spec.ts` — 결과 저장 검증 (CMD-DIAG-004)
  ```typescript
  describe('saveDiagnosisResult 통합 (CMD-DIAG-004 → TEST-001)', () => {
    it('정상 3곳+ → Diagnosis + CandidateArea 저장 성공', async () => {});
    it('저장 후 조회 → 동일 데이터 반환', async () => {});
    it('userId 불일치 → FORBIDDEN', async () => {});
  });
  ```

- [ ] **3.10** Mock 모드 / 실제 모드 분기 설정
  ```typescript
  // tests/e2e/diagnosis-flow.spec.ts 상단
  test.beforeEach(async ({ page }) => {
    // Mock 모드: NEXT_PUBLIC_USE_MOCK=true 시 Mock 데이터 사용
    // 실제 모드: 환경변수 미설정 시 실제 백엔드 호출
  });
  ```

- [ ] **3.11** `package.json`에 테스트 스크립트 추가
  ```json
  {
    "scripts": {
      "test:e2e": "npx playwright test",
      "test:e2e:report": "npx playwright show-report",
      "test:unit:diagnosis": "npx vitest run tests/unit/intersection.spec.ts tests/unit/coverage.spec.ts"
    }
  }
  ```

- [ ] **3.12** Playwright HTML report 생성 확인
  ```bash
  npx playwright test --reporter=html
  # → playwright-report/index.html 생성
  ```

- [ ] **3.13** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|replaySearch" tests/` → 0건

- [ ] **3.14** 응답 시간 검증: AC-1 시나리오에서 진단 시작 → 결과 표시 ≤8초 (REQ-NF-001)

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 정상 3곳+ 산출
- **Given** 두 직장 주소(수도권 내 — 강남역, 판교역) 입력 완료
- **When** "진단 시작" 버튼 클릭
- **Then** 교집합 후보 동네 ≥3곳 지도 마커 표시. 응답 ≤8초. URL 패턴 `/diagnosis/[id]`

**AC-2 (예외):** 1개 주소만 입력 시 에러 (AC-N1)
- **Given** 직장 A만 입력, 직장 B 비어있음
- **When** "진단 시작" 클릭 시도
- **Then** 버튼 비활성화 또는 인라인 에러 "두 번째 주소를 입력해 주세요". 서버 API 호출 0건

**AC-3 (경계):** 교집합 0곳 시 완화 제안 (AC-N3)
- **Given** 강남역 + 인천공항, 최대 통근 시간 15분 (매우 짧음)
- **When** 진단 시작
- **Then** "조건을 만족하는 동네가 없습니다" 안내 ≤1초. 완화 제안 ≥1개 ("통근 시간을 늘려보세요" 류)

**AC-4 (예외):** 비수도권 차단 (REQ-FUNC-031)
- **Given** "부산역" (비수도권) 입력
- **When** 수도권 검증 실행
- **Then** "현재 수도권만 지원됩니다" 안내 표시. "진단 시작" 버튼 비활성화. 비수도권 진단 실행 0건

**AC-5 (도메인 핵심):** 4개 시나리오 Playwright 모두 통과
- **Given** Playwright 설치 + 설정 완료
- **When** `npm run test:e2e` 실행
- **Then** 4개 시나리오 모두 PASS. HTML report `playwright-report/index.html` 생성

**AC-6 (도메인 핵심):** CMD-DIAG-002/004/007 통합 검증
- **Given** 단위 통합 테스트 실행
- **When** `npm run test:unit:diagnosis` 실행
- **Then** calculateIntersection 3곳+ 검증 PASS, isMetroArea 수도권/비수도권 검증 PASS, saveDiagnosisResult 저장 검증 PASS

**AC-7 (성능):** 응답 시간 p95 ≤ 8,000ms (REQ-NF-001)
- **Given** AC-1 정상 시나리오
- **When** 진단 시작 → 결과 표시 시간 측정
- **Then** ≤ 8,000ms (Playwright timeout 10초로 간접 검증)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | AC-1 Playwright 시나리오에서 `waitForURL` timeout 10초. 단위 테스트에서 performance.now() 계측 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림" (§4.2.6) | 에러 시나리오에서 Sentry 로그 전송 확인 |

---

## 6. 📦 Deliverables (산출물 명시)

- `playwright.config.ts` (Playwright 설정)
- `tests/e2e/diagnosis-flow.spec.ts` (4개 E2E 시나리오 — AC-1/AC-N1/AC-N3/비수도권)
- `tests/unit/intersection.spec.ts` (3개 — calculateIntersection 통합)
- `tests/unit/coverage.spec.ts` (5개 — isMetroArea 수도권 검증)
- `tests/unit/save-diagnosis.spec.ts` (3개 — saveDiagnosisResult)
- `package.json` scripts 추가 (test:e2e, test:e2e:report, test:unit:diagnosis)
- `playwright-report/` (HTML report — gitignore 추가)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (검증 대상):
- **CMD-DIAG-002 ✅:** `calculateIntersection` — 정상 3곳+ 산출 검증
- **CMD-DIAG-004 ✅:** `saveDiagnosisResult` — DB 저장 검증
- **CMD-DIAG-007 ✅:** `isMetroArea` — 비수도권 차단 검증
- **UI-002 ✅:** 주소 입력 화면 — E2E 입력 대상
- **UI-003 ✅:** MapCanvas — E2E 마커 검증
- **MOCK-001 ✅:** Mock 진단 데이터 — Mock 모드
- **MOCK-004 ✅:** Mock 카카오 API — API Mock

### 후행:
- **TEST-010:** E2E 통합 시나리오 — TEST-001 포함 전체 플로우
- **INFRA (follow-up):** GitHub Actions CI 통합 — Playwright 실행 파이프라인

---

## 8. 🧪 Test Plan (검증 절차)

- **E2E (Playwright):** `tests/e2e/diagnosis-flow.spec.ts` — 4개 시나리오
  - AC-1: 정상 3곳+ 마커
  - AC-N1: 1개 주소 에러
  - AC-N3: 0곳 완화 제안
  - 비수도권 차단
- **단위 통합 (Vitest):**
  - `tests/unit/intersection.spec.ts` — 3개 (calculateIntersection)
  - `tests/unit/coverage.spec.ts` — 5개 (isMetroArea)
  - `tests/unit/save-diagnosis.spec.ts` — 3개 (saveDiagnosisResult)
  - 총 단위 11개
- **성능 검증:** AC-1 시나리오 응답 ≤8초
- **Mock / 실제 분기:** `NEXT_PUBLIC_USE_MOCK=true` 시 Mock, 미설정 시 실제 백엔드
- **정적 분석:** `grep` NextAuth/payment/AES 0건
- **HTML report:** `npx playwright show-report` → 브라우저에서 결과 확인

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **CI 통합 follow-up:** GitHub Actions에서 Playwright 실행을 위한 별도 INFRA 태스크 필요 (예: INFRA-006). 본 ISSUE는 로컬 실행 가능한 테스트 시나리오 정의에 집중.
2. **Mock 모드 한계:** `NEXT_PUBLIC_USE_MOCK=true` 시 실제 카카오 API 호출 없이 Mock 데이터 사용. 실제 API 응답과의 차이로 인해 일부 시나리오가 Mock에서만 통과할 수 있음. CI 통합 시 실제 모드 테스트도 병행 필요.
3. **Playwright 브라우저 설치:** `npx playwright install` 시 Chromium/Firefox/WebKit 설치 필요. CI 환경에서 브라우저 바이너리 캐싱 정책 결정 필요.
4. **E2E 테스트 안정성:** 네트워크 지연, 비결정적 동작으로 인해 E2E 테스트가 flaky할 수 있음. `retries: 1` 설정으로 일차 대응. 지속적으로 모니터링.
5. **비수도권 검증 로직 정확도:** CMD-DIAG-007의 `isMetroArea`가 좌표 기반 바운딩 박스인지 행정구역 폴리곤인지에 따라 경계값 테스트 결과가 달라질 수 있음.
6. **진단 시작 → 결과 페이지 라우팅:** E2E에서 `waitForURL(/\/diagnosis\/[a-z0-9-]+/)` 패턴이 실제 라우팅과 일치하는지 확인 필요. Next.js App Router의 dynamic route 패턴 정합.
