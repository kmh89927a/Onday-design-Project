---
name: Feature Task
title: "[Feature] CMD-SINGLE-002: 리포트 저장 — window.print() + CSS @media print"
labels: ['feature', 'priority:L', 'epic:Single', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-SINGLE-002] 리포트 저장 — window.print() + CSS @media print 제어 (서버 호출 0건)
- **목적:** 싱글 모드 리포트를 브라우저 기본 인쇄 기능으로 PDF 저장. 서버 호출 없이 클라이언트만으로 완결.
- **범위:**
  - ✅ SaveReportButton 클라이언트 컴포넌트, CSS @media print 제어, A4 페이지 설정
  - ❌ ~~Puppeteer/wkhtmltopdf~~ (서버 PDF 금지), ~~서버 API~~ (서버 호출 0건)
- **복잡도:** L | **Wave:** 4

---

## 2. 🔗 References (Spec & Context)

### SRS 인용
- **REQ-FUNC-023** (§4.1.4): "싱글 모드 리포트 \"리포트 저장\" 클릭 시 클라이언트 브라우저의 기본 window.print() 메서드 호출과 CSS @media print 제어를 통해 PDF 저장을 안내한다."
- **REQ-NF-010** (§4.2.1): "PDF 리포트 저장 응답 시간 — ≤ 1초 (window.print() 클라이언트 호출)"

### 시퀀스 (§6.3.4)
```
User→Web: "리포트 저장" 클릭
Web→Web: CSS @media print 스타일 적용 + window.print() 호출
Note: 브라우저 기본 인쇄 다이얼로그 → PDF 저장 안내 (서버 호출 없음, ≤1초)
Web→User: 브라우저 인쇄 다이얼로그 표시
```

### 선행 태스크 산출물

| Task ID | 산출물 | 사용처 |
|---|---|---|
| INFRA-004 | shadcn/ui Button 컴포넌트 | SaveReportButton 기반 |
| CMD-SINGLE-001 | 싱글 모드 진단 결과 | 리포트 콘텐츠 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `components/single/save-report-button.tsx` — 클라이언트 컴포넌트
  ```typescript
  'use client';
  import { Button } from '@/components/ui/button';
  import { Printer } from 'lucide-react';

  export function SaveReportButton() {
    const handlePrint = () => {
      window.print();
    };
    return (
      <Button onClick={handlePrint} variant="outline" className="no-print" id="save-report-btn">
        <Printer className="mr-2 h-4 w-4" />
        리포트 저장 (PDF)
      </Button>
    );
  }
  ```

- [ ] **3.2** `app/globals.css` (또는 `app/single/print.css`)에 @media print CSS 추가
  ```css
  @media print {
    .no-print, nav, header, footer, .floating-button, [data-no-print] {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
    @page {
      size: A4;
      margin: 1cm;
    }
    body {
      color-adjust: exact;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 12pt;
    }
    .report-container {
      width: 100%;
      max-width: none;
      padding: 0;
      margin: 0;
    }
    .map-container { height: 300px !important; }
    .grade-badge { border: 1px solid #000 !important; }
  }
  ```

- [ ] **3.3** `components/single/print-header.tsx` — 인쇄 전용 헤더 (화면에서는 숨김)
  ```typescript
  export function PrintHeader({ title, date }: { title: string; date: string }) {
    return (
      <div className="hidden print-only">
        <h1>{title}</h1>
        <p>생성일: {date}</p>
        <p>내 하루 동선 맞춤 동네 궁합 진단기</p>
      </div>
    );
  }
  ```

- [ ] **3.4** 서버 호출 0건 정적 검증
  ```bash
  grep -rn "'use server'\|fetch(\|axios\|/api/" components/single/save-report-button.tsx | wc -l  # → 0
  grep -rn "Puppeteer\|wkhtmltopdf\|@react-pdf" components/single/ | wc -l  # → 0
  ```

- [ ] **3.5** `__tests__/components/save-report-button.spec.tsx` — 컴포넌트 테스트
  ```typescript
  import { render, screen, fireEvent } from '@testing-library/react';
  import { SaveReportButton } from '@/components/single/save-report-button';
  describe('SaveReportButton', () => {
    it('버튼 클릭 시 window.print() 호출', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      render(<SaveReportButton />);
      fireEvent.click(screen.getByRole('button'));
      expect(printSpy).toHaveBeenCalledTimes(1);
      printSpy.mockRestore();
    });
    it('버튼에 id="save-report-btn" 존재', () => {
      render(<SaveReportButton />);
      expect(screen.getByRole('button')).toHaveAttribute('id', 'save-report-btn');
    });
    it('버튼에 "리포트 저장 (PDF)" 텍스트 표시', () => {
      render(<SaveReportButton />);
      expect(screen.getByText(/리포트 저장/)).toBeInTheDocument();
    });
  });
  ```

- [ ] **3.6** `__tests__/components/print-css.spec.ts` — @media print CSS 검증
  ```typescript
  import { readFileSync } from 'fs';
  describe('@media print CSS', () => {
    const css = readFileSync('app/globals.css', 'utf-8');
    it('@media print 블록 존재', () => { expect(css).toContain('@media print'); });
    it('.no-print display:none 규칙 존재', () => { expect(css).toMatch(/\.no-print.*display:\s*none/s); });
    it('@page size: A4 규칙 존재', () => { expect(css).toMatch(/@page.*size:\s*A4/s); });
    it('color-adjust: exact 규칙 존재', () => { expect(css).toContain('color-adjust: exact'); });
    it('nav, header, footer 숨김 규칙 존재', () => { expect(css).toMatch(/nav.*display:\s*none/s); });
  });
  ```

- [ ] **3.7** `__tests__/components/save-report-no-server.spec.ts` — 서버 호출 0건 정적 검증
  ```typescript
  import { readFileSync } from 'fs';
  describe('CMD-SINGLE-002 서버 호출 0건 검증', () => {
    const src = readFileSync('components/single/save-report-button.tsx', 'utf-8');
    it("'use server' 0건", () => { expect(src).not.toContain("'use server'"); });
    it('fetch() 0건', () => { expect(src).not.toMatch(/fetch\s*\(/); });
    it('/api/ 호출 0건', () => { expect(src).not.toMatch(/\/api\//); });
    it('Puppeteer/wkhtmltopdf 0건', () => { expect(src).not.toMatch(/puppeteer|wkhtmltopdf|@react-pdf/i); });
  });
  ```

- [ ] **3.8** PDF 저장 다이얼로그 ≤1초 검증 (수동)
  - 브라우저에서 "리포트 저장" 클릭 → 인쇄 다이얼로그 표시 시간 측정
  - DevTools Performance 탭에서 window.print() → 다이얼로그 렌더링 시간 확인

- [ ] **3.9** Playwright E2E 스켈레톤
  ```typescript
  test('리포트 저장 버튼 → window.print 호출', async ({ page }) => {
    await page.goto('/single/test-id');
    const printPromise = page.waitForEvent('dialog'); // 또는 print 이벤트
    await page.click('#save-report-btn');
    // window.print() 호출 확인
  });
  ```

- [ ] **3.10** CI 게이트: `tsc --noEmit`, Jest 100%, ESLint

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 버튼 클릭 → window.print() 호출
- **Given** 싱글 모드 리포트 페이지 로드 완료
- **When** "리포트 저장 (PDF)" 버튼 클릭
- **Then** `window.print()` 1회 호출, 브라우저 인쇄 다이얼로그 표시

**AC-2 (도메인 핵심):** 서버 API 호출 0건 (정적 검증)
- **Given** `components/single/save-report-button.tsx`
- **When** `grep "'use server'\|fetch(\|/api/" components/single/save-report-button.tsx`
- **Then** 매칭 0건

**AC-3 (정상):** @media print CSS 동작 — 불필요 요소 숨김
- **Given** 인쇄 다이얼로그 활성 상태
- **When** CSS @media print 규칙 적용
- **Then** nav, header, footer, .no-print 요소가 숨겨짐, .print-only 요소만 표시

**AC-4 (정상):** A4 사이즈 페이지 설정
- **Given** @media print CSS
- **When** `@page` 규칙 적용
- **Then** `size: A4`, `margin: 1cm` 설정됨

**AC-5 (도메인 핵심):** 다이얼로그 표시 ≤1초
- **Given** 리포트 페이지 로드 완료
- **When** 버튼 클릭 후 인쇄 다이얼로그 표시까지 시간 측정
- **Then** ≤ 1,000ms (REQ-NF-010)

**AC-6 (예외):** Puppeteer/서버 PDF 생성 코드 0건
- **Given** 프로젝트 전체
- **When** `grep -rn "puppeteer\|wkhtmltopdf\|/api/generate-pdf" components/single/`
- **Then** 매칭 0건

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 검증 방법 |
|---|---|---|
| REQ-NF-010 | "PDF 리포트 저장 응답 시간 — ≤ 1초 (window.print() 클라이언트 호출)" (§4.2.1) | 버튼 클릭→다이얼로그 표시 시간 ≤1초 수동 검증 |

---

## 6. 📦 Deliverables

- `components/single/save-report-button.tsx` (SaveReportButton — 'use client')
- `components/single/print-header.tsx` (PrintHeader — 인쇄 전용)
- `app/globals.css` (@media print CSS 추가)
- `__tests__/components/save-report-button.spec.tsx` (3개)
- `__tests__/components/print-css.spec.ts` (5개)
- `__tests__/components/save-report-no-server.spec.ts` (4개)

---

## 7. 🔗 Dependencies

### 선행:
- **클라이언트만** — 서버 의존성 0건
- **INFRA-004 ✅:** shadcn/ui Button
- **CMD-SINGLE-001 (같은 배치):** 싱글 모드 진단 결과 (리포트 콘텐츠)

### 후행:
- **UI-013:** 야간 안전 등급 표시 UI + 리포트 저장 버튼 통합
- **TEST-006:** 싱글 모드 GWT 시나리오 — PDF 저장 검증

---

## 8. 🧪 Test Plan

- **컴포넌트:** save-report-button.spec.tsx (3개)
- **정적 검증:** print-css.spec.ts (5개), save-report-no-server.spec.ts (4개)
- **수동:** 브라우저 인쇄 다이얼로그 ≤1초, A4 레이아웃, 불필요 요소 숨김
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint

---

## 9. 🚧 Open Questions / Risks

1. **iOS Safari window.print() 동작:** iOS Safari에서 window.print()가 정상 동작하는지 확인 필요. iOS는 인쇄 다이얼로그 대신 공유 시트가 표시될 수 있음. 별도 iOS 테스트 follow-up.
2. **지도 영역 인쇄:** react-kakao-maps-sdk의 지도 영역이 @media print에서 정상 렌더링되는지 확인. Canvas 기반 지도는 인쇄 시 공백이 될 수 있음 — 지도 스크린샷을 img로 대체하는 방안 검토.
3. **color-adjust: exact 브라우저 호환성:** 배경색·그라디언트가 인쇄 시 표시되려면 color-adjust: exact 필요. 구형 브라우저 호환성 확인.
4. **PDF 파일명 제어:** window.print()는 PDF 파일명을 document.title 기반으로 생성. 리포트 페이지에서 `<title>`을 "싱글모드_리포트_YYYY-MM-DD" 형태로 동적 설정 검토.
