---
name: NFR Task
title: "[NFR] NFR-PERF-PAGE-LOAD: 일반 페이지 로딩 p95 ≤ 1500ms 측정 셋업 (REQ-NF-002)"
labels: ['nfr', 'priority:must', 'type:nfr', 'area:perf', 'epic:Measurement', 'wave:5', 'complexity:m']
assignees: []
---

## 0. 🎯 본 ISSUE 영역 (2026-05-28 신설)

**Issue #126 NFR-PERF-PAGE-LOAD** = REQ-NF-002 "일반 페이지 로딩 p95 ≤ 1,500ms (3G 모바일)" 측정 셋업.

**범위:** 측정 도구 통합만. 성능 최적화 X (미달 시 별도 PERF-OPTIMIZE-* ISSUE 신설 답습).

**삭제 영역 (정직 인정 박힘):**
- ❌ ~~Lighthouse CI GitHub Actions 자동화~~ → **PERF-LIGHTHOUSE-CI-AUTOMATION 별도 ISSUE 분리** (㊧ Mismatch 8번째 영역 진화 정직 §)
- ❌ ~~`@vercel/analytics` 동시 설치~~ → MON-003 Mixpanel 영역 (CLAUDE.md §2 답습)

---

## 1. 🎯 Summary

- **기능명:** [NFR-PERF-PAGE-LOAD] Vercel Speed Insights 셋업 + Lighthouse baseline 측정 (REQ-NF-002)
- **목적 (Why):**
  - **비즈니스:** 3G 모바일 사용자 (3040 맞벌이 부부 페르소나) 경험 보호 = 페이지 로딩 p95 ≤ 1,500ms SLA 모니터링 셋업
  - **사용자 가치:** 느린 페이지 = 이탈 = 진단 완료 KPI 미달. 측정 가능 상태 = 운영 의사결정 기반
- **범위 (What):**
  - ✅ 만드는 것: `@vercel/speed-insights` 설치 + `<SpeedInsights />` layout.tsx 배치 + Lighthouse 수동 baseline + `docs/perf/baseline-2026-05.md` 기록
  - ❌ 만들지 않는 것: Lighthouse CI 자동화 (별도 ISSUE), 성능 최적화 (이미지/폰트/번들), @vercel/analytics
- **복잡도:** M
- **Wave:** 5 (Measurement 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용

- **REQ-NF-002** (§4.2.1, v1.7): "일반 페이지 로딩 시간 — p95 ≤ 1,500ms (3G 모바일 환경 기준). 측정 방법: Lighthouse/WebPageTest + Vercel Speed Insights"

### PRD 인용

- PRD §5-1 비기능 요구사항 — 페이지 로딩 성능 SLA

### TASK_LIST 매핑

- `tasks/06_TASK_LIST_v1_4.md` Step 4-D (성능 측정 — v1.4 신설) NFR-PERF-PAGE-LOAD 행
- v1.4 audit 정합 회복 (v1.3까지 REQ-NF-002 측정 task 0건)

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `@vercel/speed-insights` 설치
  ```bash
  cd onday-app && npm install @vercel/speed-insights
  ```

- [ ] **3.2** `app/layout.tsx`에 `<SpeedInsights />` 배치
  ```tsx
  import { SpeedInsights } from "@vercel/speed-insights/next";
  // ...
  <body>
    <QueryProvider>{children}</QueryProvider>
    <Toaster />
    <SpeedInsights />
  </body>
  ```

- [ ] **3.3** `npm run build` 통과 검증 (TypeScript + Next.js 빌드)

- [ ] **3.4** Lighthouse 수동 baseline 측정 (르르 영역)
  - Chrome DevTools Lighthouse 탭 또는 `npx lighthouse <URL> --view`
  - 환경: 모바일 + 3G throttling + 시크릿 창
  - 대상: `/` (또는 `/landing`), `/login`, `/diagnosis` 3개 페이지
  - Production URL = `https://onday-design-project.vercel.app` (실 라이브 확정. 옛 `onday-prototype-claude-design`는 무관 프로토타입)

- [ ] **3.5** `docs/perf/baseline-2026-05.md` 측정 결과 기록
  - Performance / Accessibility / Best Practices / SEO 점수
  - Core Web Vitals: LCP / **INP** / CLS (★ 2024-03 FID Deprecated → INP 정직 정정)
  - FCP / Speed Index / TTI

- [ ] **3.6** Vercel Dashboard Speed Insights 활성 확인
  - 배포 후 (1주 트래픽 수집) Vercel Dashboard → 프로젝트 → Speed Insights 탭 데이터 들어오는지 확인

- [ ] **3.7** Phase B 한계 § 명시 (시각 검증 + 1주 데이터 수집 한계)
  - 측정 셋업 시점 = 실 p95 데이터 X
  - 1인 MVP = 실 사용자 트래픽 제한 = 르르 본인/지인 데이터 위주

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (도구 통합 — Speed Insights):**
- **Given** Next.js App
- **When** `@vercel/speed-insights` 통합 + `<SpeedInsights />` layout.tsx 배치
- **Then** Production 배포 후 Vercel Dashboard Speed Insights 탭 활성 + p75/p95 LCP/INP/CLS 측정 데이터 1주 후 들어옴

**AC-2 (도구 통합 — Lighthouse):**
- **Given** Production URL 확정
- **When** Chrome DevTools Lighthouse 측정 (모바일 + 3G throttling)
- **Then** Performance/Accessibility/Best Practices/SEO 점수 + Core Web Vitals 측정 + `docs/perf/baseline-2026-05.md` 기록

**AC-3 (목표 모니터링):**
- **Given** AC-1 + AC-2 활성
- **When** Vercel Speed Insights Dashboard 1주 후 확인
- **Then** 주요 페이지 p95 페이지 로딩 시간 표시. 목표 1,500ms 대비 모니터링 가능

**AC-4 (Core Web Vitals 측정):**
- **Given** AC-1 활성
- **When** Speed Insights 측정
- **Then** **LCP / INP / CLS** 측정 가능 (★ 르르 prompt FID → INP 정직 정정, Google 2024-03 표준)

**AC-N1 (영역 한정):**
- **Given** 본 ISSUE = 측정 셋업
- **When** Lighthouse baseline 미달 (p95 > 1,500ms 또는 CWV 미달)
- **Then** **별도 PERF-OPTIMIZE-* ISSUE 신설** (예: PERF-OPTIMIZE-IMAGES, PERF-OPTIMIZE-FONTS). 본 ISSUE에서 최적화 작업 X

**AC-N2 (Lighthouse CI 자동화 영역 한정):**
- **Given** Issue #126 본문 AC-1/AC-4 = Lighthouse CI GitHub Actions + lighthouserc.json + PR 코멘트
- **When** 본 ISSUE 작업 영역 판정
- **Then** **별도 PERF-LIGHTHOUSE-CI-AUTOMATION ISSUE 신설 영역**. 본 ISSUE는 Speed Insights 셋업 + 수동 baseline만

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 검증 방법 |
|---|---|---|
| REQ-NF-002 | "일반 페이지 로딩 p95 ≤ 1,500ms (3G)" (§4.2.1) | Speed Insights Dashboard p95 + Lighthouse baseline |

---

## 6. 📦 Deliverables (산출물 명시)

- `onday-app/package.json` + `package-lock.json` — `@vercel/speed-insights` dependency 추가
- `onday-app/src/app/layout.tsx` — `<SpeedInsights />` 컴포넌트 배치
- `docs/perf/baseline-2026-05.md` — Lighthouse baseline 기록 (SSoT 영역)
- `tasks/NFR-PERF-PAGE-LOAD.md` — 본 명세 (신설)
- `tasks/ISSUE_REGISTER_LOG.md` — #126 § +1 (Phase B 한계 § 13번째 누적)

---

## 7. 🔗 Dependencies (의존성)

### 선행
- **INFRA-001** ✅ (Next.js 15 + Vercel 배포)

### 후행 (별도 ISSUE 영역)
- **PERF-LIGHTHOUSE-CI-AUTOMATION** (신설 예정) — Issue #126 본문 AC-1/AC-4 영역
- **PERF-OPTIMIZE-IMAGES** (신설 후보) — baseline 미달 시
- **PERF-OPTIMIZE-FONTS** (신설 후보) — baseline 미달 시
- **MON-003** (#127) — Mixpanel/Amplitude (analytics 영역, 본 ISSUE 영역 외)

---

## 8. 🧪 Test Plan (검증 절차)

- **빌드 검증:** `npm run build` 통과 (TypeScript strict + Next.js 빌드)
- **layout.tsx 박힘 검증:** `grep -n "SpeedInsights" src/app/layout.tsx` → 2건 (import + JSX)
- **Production 배포 후 검증 (르르 영역):**
  1. Vercel 자동 배포 완료 확인
  2. Production URL 접속 → Network 탭에서 `_vercel/speed-insights/script.js` 로딩 확인
  3. 1주 후 Vercel Dashboard Speed Insights 탭 데이터 확인
- **Lighthouse 수동 측정 (르르 영역):**
  1. Production URL Chrome DevTools Lighthouse 측정 (모바일 + 3G)
  2. 결과를 `docs/perf/baseline-2026-05.md` TBD 영역에 갱신

---

## 9. 🚧 Phase B 한계 § (13번째 누적 진화)

**누적 영역:**
- 11번째 = #52 UI-009 = HTML5 min attribute clamp 진짜 본질 정점 (시각 검증 박힘 정수)
- 12번째 = #45 UI-007 = 부착 layer 분기 + source pool mismatch + Issue 본문 vs SSoT mismatch
- **13번째 = #126 NFR-PERF-PAGE-LOAD = 측정 셋업 vs 실 데이터 수집 분리 + 1주 데이터 의존 + 1인 MVP 실 사용자 트래픽 제한 + FID→INP 정직 정정 + ㊧ Mismatch 8번째 영역 (Lighthouse CI 분리)**

**본 ISSUE Phase B 한계:**
- 정적 검증 = `grep "SpeedInsights" layout.tsx` 박힘 확인 만 가능
- 실 p95 데이터 = Vercel Dashboard Speed Insights 1주 트래픽 수집 후 = 본 ISSUE 완료 시점 측정 X
- 1인 MVP = 실 사용자 트래픽 제한 = 통계적 유의미성 한계 답습
- Lighthouse baseline = lab 측정 1회 = 실 사용자 환경 (네트워크/디바이스/배경 작업) 미반영

---

## 10. ⚠️ 정직 § (Issue 본문 vs 본 명세 mismatch)

### 10.1 Lighthouse CI 자동화 영역 (㊧ Mismatch 8번째 영역 진화)

| 영역 | Issue #126 본문 AC | 본 명세 (르르 grill 합의) |
|---|---|---|
| AC-1 | Lighthouse CI 활성 (GitHub Actions) | @vercel/speed-insights 설치 + layout.tsx 배치 |
| AC-4 | PR 본문 Lighthouse 점수 자동 노출 | Core Web Vitals (LCP/INP/CLS) 측정 가능 |

★ **정직 인정 박힘:**
- Issue #126 본문 = Lighthouse CI 자동화 영역 박힘
- 본 명세 = Speed Insights 셋업 + 수동 baseline 영역만
- **차후 영역 = PERF-LIGHTHOUSE-CI-AUTOMATION 별도 ISSUE 신설** 답습
- 분리 근거: Speed Insights(runtime) vs Lighthouse CI(lab) = 영역 분리 자연 + 1인 MVP 작업량 제한

### 10.2 르르 prompt AC-4 FID → INP 정직 정정

- 르르 prompt AC-4 = "Core Web Vitals 측정 가능 (LCP/**FID**/CLS)"
- **★ FID 2024-03 Deprecated → INP 공식 대체** (Google 표준)
- Vercel Speed Insights = INP 측정 (FID 측정 X)
- 본 명세 AC-4 = LCP / **INP** / CLS 박힘 (정직 정정)

### 10.3 르르 prompt @vercel/analytics 제외 (CLAUDE.md §2 답습)

- 르르 prompt = "(선택) @vercel/analytics도 함께"
- **★ CLAUDE.md §2 분석 도구 = Mixpanel / Amplitude** 명시
- analytics(페이지뷰/이벤트) = MON-003 영역 = 본 ISSUE 영역 외
- 본 명세 = `@vercel/speed-insights` 단독 설치

---

_본 명세 신설: 2026-05-28 (Issue #126 NFR-PERF-PAGE-LOAD 진입 시점). v1.4 audit Step 4-D (성능 측정 신설) 정합._
