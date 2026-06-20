---
title: "Lighthouse baseline — 2026-05 (REQ-NF-002 측정 셋업 시점)"
issue: "#126"
task: "NFR-PERF-PAGE-LOAD"
measurement_date: "(르르 Phase D 측정 시 갱신)"
production_url: "https://onday-design-project.vercel.app"
---

# Lighthouse baseline — 2026-05

## 1. Background

**SRS REQ-NF-002 (v1.7 §4.2.1):** "일반 페이지 로딩 시간 — p95 ≤ 1,500ms (3G 모바일 환경 기준). 측정 방법: Lighthouse/WebPageTest + Vercel Speed Insights"

**본 문서 영역:** Issue #126 NFR-PERF-PAGE-LOAD Phase D 측정 셋업 시점 baseline 기록. Speed Insights 셋업 + Lighthouse 1회 측정 결과.

**Phase B 한계 §:** 본 baseline = lab 측정 1회. 실 p95 = Vercel Speed Insights Dashboard 1주 데이터 수집 후 확인 답습 (실 사용자 트래픽 의존).

---

## 2. 측정 방법

### 2.1 Lighthouse (lab 측정)

**도구:** Chrome DevTools Lighthouse 탭 (또는 `npx lighthouse <URL> --view`)

**환경:**
- 모바일 + 3G throttling (Slow 4G 또는 Fast 3G)
- 시크릿 창 (확장 프로그램 영향 격리)
- Performance + Best Practices + SEO + Accessibility 카테고리

**대상 페이지 (일반 페이지 = REQ-NF-002 정합):**
- `/` (또는 `/landing`) — 랜딩
- `/login` — 인증 진입
- `/diagnosis` — 진단 입력 폼

> 동적 페이지 (`/diagnosis/result/[id]`, `/share/[uuid]`) = 측정 가능하나 본 baseline 영역 외 (REQ-NF-003 영역 = 공유 페이지 p95 ≤ 2,000ms 별도).

### 2.2 Vercel Speed Insights (runtime 측정)

**도구:** `@vercel/speed-insights` (본 PR 셋업)

**측정 지표 (Google 2024-03 표준):**
- **LCP** (Largest Contentful Paint) — 목표 ≤ 2.5s
- **INP** (Interaction to Next Paint) — 목표 ≤ 200ms (★ 2024-03 FID Deprecated → INP 정직 정정)
- **CLS** (Cumulative Layout Shift) — 목표 ≤ 0.1

**확인 위치:** Vercel Dashboard → 프로젝트 → Speed Insights 탭 (배포 + 1주 트래픽 후 데이터 들어옴)

---

## 3. 측정 결과 (Phase D — 르르 측정 후 갱신)

### 3.1 Lighthouse 점수 — 랜딩 (`/` 또는 `/landing`)

| 카테고리 | 점수 | 비고 |
|---|---:|---|
| Performance | TBD | |
| Accessibility | TBD | |
| Best Practices | TBD | |
| SEO | TBD | |

**Core Web Vitals:**

| 지표 | 측정값 | 목표 | 평가 |
|---|---:|---:|---|
| LCP | TBD ms | ≤ 2,500 ms | TBD |
| INP | TBD ms | ≤ 200 ms | TBD |
| CLS | TBD | ≤ 0.1 | TBD |

**페이지 로딩 (REQ-NF-002 p95 ≤ 1,500ms):**

| 시점 | 측정값 | 목표 | 평가 |
|---|---:|---:|---|
| FCP (First Contentful Paint) | TBD ms | — | TBD |
| Speed Index | TBD ms | — | TBD |
| TTI (Time to Interactive) | TBD ms | — | TBD |

### 3.2 Lighthouse 점수 — 진단 입력 (`/diagnosis`)

(동일 표 형태 — 르르 측정 후 갱신)

### 3.3 Lighthouse 점수 — 로그인 (`/login`)

(동일 표 형태 — 르르 측정 후 갱신)

---

## 4. 측정 결과 해석

### 4.1 p95 ≤ 1,500ms 달성 여부

(르르 측정 후 갱신 — 미달 시 별도 PERF-OPTIMIZE-* ISSUE 신설 답습)

### 4.2 핫스팟 사전 영역 (Phase B 정적 점검 — 차후 최적화 후보)

| 영역 | 현재 박힘 | 차후 최적화 ISSUE 후보 |
|---|---|---|
| `next/image` 사용 | ❌ 0건 (Phase B grep) | **PERF-OPTIMIZE-IMAGES** 후보 — `<img>` → `<Image>` 전환 = LCP 점수 영향 |
| `loading="lazy"` / `priority` | ❌ 0건 | 같이 PERF-OPTIMIZE-IMAGES 영역 |
| `public/` 자산 | 48K (작음) | 영향 X |
| 동적 import / Code splitting | (Phase D 빌드 측정 후 확인) | 차후 영역 |

★ 본 ISSUE = 측정 셋업만 = 위 영역 최적화 X. 측정 결과 미달 시 별도 ISSUE 답습.

### 4.3 ⚠️ MON-003 (Issue #127) 머지 이후 baseline 재측정 TODO (2026-05-28 신설 NEW)

★ ★ **현 baseline = MON-003 이전 측정값** = mixpanel-browser 추가 전 영역 = **무효화 가능성 박힘**.

**원인 — MON-003 PR #134 Bundle 크기 회귀:**

| 영역 | MON-003 이전 (baseline 측정 시점) | MON-003 이후 | 회귀 |
|---|---:|---:|---:|
| Middleware | 32.5 kB | 41.6 kB | +9.1 kB |
| `/diagnosis` First Load JS | 142 kB | 345 kB | +203 kB |
| `/` First Load JS | 102 kB | 180 kB | +78 kB |

**재측정 영역 박힘 (MON-003 머지 후):**
- /diagnosis (warm 97점 baseline 무효화 가능성)
- / 또는 /login (NFR-PERF-PAGE-LOAD-LANDING 답습)
- LCP/INP/CLS 변화 확인

★ **트리거 조건:** MON-003 PR #134 머지 완료 후 + Speed Insights 실 데이터 1주 후 둘 다 갱신 답습.

★ **차후 ISSUE 후보 = PERF-OPTIMIZE-BUNDLE-SIZE** ([[issue_register_log §27]] 참조). 재측정 결과 미달 시 트리거 답습.

---

## 5. Vercel Speed Insights 실 데이터 (1주 후 갱신)

배포 후 1주 트래픽 수집 후 Vercel Dashboard Speed Insights 탭 데이터 박힘:

| 페이지 | p75 LCP | p95 LCP | p75 INP | p95 INP | p75 CLS | p95 CLS | 페이지뷰 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `/login` | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `/diagnosis` | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

★ Phase B 한계 § 답습: 1인 MVP = 실 사용자 트래픽 제한 = 르르 본인/지인 데이터 위주 = 통계적 유의미성 한계.

---

## 6. 차후 작업 영역

| 후속 ISSUE 후보 | 영역 | 트리거 |
|---|---|---|
| **PERF-LIGHTHOUSE-CI-AUTOMATION** | GitHub Actions + lighthouserc.json + PR 코멘트 자동화 | Issue #126 본문 AC-1/AC-4 분리 영역 (㊧ Mismatch 8번째) |
| **PERF-OPTIMIZE-IMAGES** | `<img>` → `next/image` 전환 + lazy/priority | 본 baseline LCP 미달 시 |
| **PERF-OPTIMIZE-FONTS** | Pretendard 폰트 preload + display=swap | 본 baseline FCP 미달 시 |
| **PERF-OPTIMIZE-BUNDLE-SIZE** (NEW — 2026-05-28) | Sentry + Mixpanel dynamic import (지연 로드) + tree-shaking 점검 | MON-003 PR #134 머지 후 Bundle 회귀 (/diagnosis +203kB, Middleware +9.1kB) — Speed Insights 실 데이터 미달 또는 baseline 재측정 미달 시 트리거 |
| **NFR-PERF-PAGE-LOAD-LANDING** (NEW — 2026-05-28 baseline 측정 후) | / 또는 /login baseline 별도 측정 | /diagnosis(동적) 1페이지만 측정 = 일반 페이지 영역 외 |
| **MON-003 Mixpanel** | ✅ Issue #127 PR #134 머지 대기 (analytics 영역) | (완료 트리거 — Bundle 회귀 발견 → PERF-OPTIMIZE-BUNDLE-SIZE 후속) |

---

_본 문서 신설: 2026-05-28 (Issue #126 NFR-PERF-PAGE-LOAD 측정 셋업 시점)._
_갱신 1: 2026-05-28 (MON-003 PR #134 Bundle 회귀 정직 § + §4.3 baseline 재측정 TODO 신설 + §6 차후 ISSUE 후보 갱신 — PERF-OPTIMIZE-BUNDLE-SIZE + NFR-PERF-PAGE-LOAD-LANDING NEW)._
