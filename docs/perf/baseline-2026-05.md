---
title: "Lighthouse baseline — 2026-05 (REQ-NF-002 측정 셋업 시점)"
issue: "#126"
task: "NFR-PERF-PAGE-LOAD"
measurement_date: "2026-05-28"
measurement_target: "Preview URL (feat/NFR-PERF-PAGE-LOAD-MEASURE 브랜치)"
measurement_pages: "/diagnosis 1개 (★ /, /login 별도 측정 = 차후 영역 정직 인정)"
production_baseline: "차후 영역 (Preview vs Production 분리 측정 답습)"
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

**환경 (2026-05-28 실 측정):**
- Chrome DevTools Lighthouse, Mobile, throttling
- Preview URL (feat/NFR-PERF-PAGE-LOAD-MEASURE 브랜치)
- 페이지: `/diagnosis` 1개 (★ /, /login 차후 영역)

**★ ★ Cold start 편차 정직 § (2026-05-28 발견 — Phase B 한계 § 정수 NEW):**

| 측정 | Performance | FCP | LCP | TBT | CLS | SI |
|---|---:|---:|---:|---:|---:|---:|
| 1차 (cold start) | **63** 🔴 | 5.6s | 6.6s | 0ms | 0 | 5.6s |
| 2차 (warm) | **97** 🟢 | 1.7s | 2.5s | 0ms | 0 | 1.7s |

★ 발견 본질: Preview Lighthouse = cold start 편차 큼 (같은 URL/페이지 = 63 → 97). 차후 측정 시 **warm 상태 2~3회 평균 답습 정수**.

**대상 페이지 (일반 페이지 = REQ-NF-002 정합 — 차후 영역):**
- `/` (또는 `/landing`) — 랜딩 → TBD (차후 측정)
- `/login` — 인증 진입 → TBD (차후 측정)
- `/diagnosis` — 진단 입력 폼 → **✅ 본 baseline 측정 완료 (2026-05-28)**

★ 정직 인정 §: /diagnosis = 동적 페이지 (지도 + 진단 로직) = REQ-NF-002 "일반 페이지" 영역 엄밀히는 외. 일반 페이지 baseline = `/` 또는 `/login` 별도 측정 차후 답습.

> 동적 페이지 (`/diagnosis/result/[id]`, `/share/[uuid]`) = 측정 가능하나 본 baseline 영역 외 (REQ-NF-003 영역 = 공유 페이지 p95 ≤ 2,000ms 별도).

### 2.2 Vercel Speed Insights (runtime 측정)

**도구:** `@vercel/speed-insights` (본 PR 셋업)

**측정 지표 (Google 2024-03 표준):**
- **LCP** (Largest Contentful Paint) — 목표 ≤ 2.5s
- **INP** (Interaction to Next Paint) — 목표 ≤ 200ms (★ 2024-03 FID Deprecated → INP 정직 정정)
- **CLS** (Cumulative Layout Shift) — 목표 ≤ 0.1

**확인 위치:** Vercel Dashboard → 프로젝트 → Speed Insights 탭 (배포 + 1주 트래픽 후 데이터 들어옴)

---

## 3. 측정 결과

### 3.1 Lighthouse 점수 — 랜딩 (`/` 또는 `/landing`) — 차후 영역

★ 정직 인정: 본 baseline 미측정. /diagnosis 측정 우선 (사용자 영역). `/` 또는 `/landing` = 일반 정적 페이지 = REQ-NF-002 진짜 정합 영역 = 차후 측정 답습.

### 3.2 Lighthouse 점수 — 진단 입력 (`/diagnosis`) — ✅ 2026-05-28 측정 완료

**측정 환경:** Chrome DevTools Lighthouse, Mobile, Preview URL, warm 상태 2차 (cold start 편차 §2.1 답습)

| 카테고리 | 점수 | 비고 |
|---|---:|---|
| Performance | **97** 🟢 | 무거운 페이지(지도+진단 로직)치고 양호 |
| Accessibility | (미기록) | — |
| Best Practices | (미기록) | — |
| SEO | (미기록) | — |

**Core Web Vitals:**

| 지표 | 측정값 | 목표 | 평가 |
|---|---:|---:|---|
| LCP | **2.5s** | ≤ 2,500 ms | 🟢 임계값 정확 충족 (개선 여지 박힘) |
| INP | TBD | ≤ 200 ms | 실 사용자 인터랙션 데이터 = Vercel Speed Insights 1주 후 |
| CLS | **0** | ≤ 0.1 | 🟢 |

**페이지 로딩 (REQ-NF-002 p95 ≤ 1,500ms):**

| 시점 | 측정값 | 목표 | 평가 |
|---|---:|---:|---|
| FCP (First Contentful Paint) | **1.7s** | — | 🟢 |
| Speed Index | **1.7s** | — | 🟢 |
| TBT (Total Blocking Time) | **0ms** | — | 🟢 |

★ 본 측정 → REQ-NF-002 p95 ≤ 1,500ms 영역 = Lighthouse FCP/SI 1.7s = lab 1회 측정 1500ms 초과. Phase B 한계 § 답습 = lab 측정 1회 vs 실 사용자 p95 분리 (Speed Insights 1주 후 진짜 p95 박힘).

### 3.3 Lighthouse 점수 — 로그인 (`/login`) — 차후 영역

★ 정직 인정: 본 baseline 미측정. 차후 측정 답습 (`/` + `/login` 둘 다 일반 페이지 영역).

---

## 4. 측정 결과 해석

### 4.1 p95 ≤ 1,500ms 달성 여부 (2026-05-28 /diagnosis 측정 기준)

★ **분리 영역 정직 인정:**
- **Lighthouse lab 측정 (warm)** = Performance 97, FCP 1.7s, LCP 2.5s, SI 1.7s. /diagnosis 무거운 페이지치고 양호.
- **REQ-NF-002 "p95 ≤ 1,500ms" 영역** = lab 1회 측정 FCP/SI 1.7s = 1500ms 초과. **그러나 lab vs 실 사용자 p95 분리** = 진짜 p95 = Vercel Speed Insights Dashboard 1주 트래픽 후 박힘.
- **현 시점 평가:** REQ-NF-002 충족/미달 판정 불가 = Phase B 한계 § 답습 = 측정 셋업만 박힘 = 1주 후 실 데이터로 평가 답습.
- **★ 차후 일반 페이지 측정 영역:** /, /login 측정 = /diagnosis(동적)와 다른 결과 가능. 일반 페이지 p95 별도 baseline 답습.

### 4.2 핫스팟 사전 영역 (Phase B 정적 점검 + 측정 발견 — 차후 최적화 후보)

| 영역 | 현재 박힘 | 차후 최적화 ISSUE 후보 |
|---|---|---|
| `next/image` 사용 | ❌ 0건 (Phase B grep) | **PERF-OPTIMIZE-IMAGES** 후보 — `<img>` → `<Image>` 전환 = LCP 2.5s 양호하나 개선 여지 박힘 |
| `loading="lazy"` / `priority` | ❌ 0건 | 같이 PERF-OPTIMIZE-IMAGES 영역 |
| `public/` 자산 | 48K (작음) | 영향 X |
| 동적 import / Code splitting | (빌드 측정 후 확인) | 차후 영역 |
| **form field id/name 누락** (NEW — Lighthouse Issues 탭 발견) | ★ 측정 시 발견 | **A11Y-FORM-FIELD-LABELS** 후보 — 접근성 영역 ISSUE 신설 답습 |

★ 본 ISSUE = 측정 셋업만 = 위 영역 최적화 X. 측정 결과 미달 시 별도 ISSUE 답습.

### 4.3 ★ ★ Cold start 편차 정직 § (Phase B 한계 § 정수 NEW)

**발견 본질:** Preview URL Lighthouse 측정 = cold start vs warm 편차 큼 (같은 URL/페이지, /diagnosis):

| 측정 | Performance | FCP | LCP | SI |
|---|---:|---:|---:|---:|
| 1차 (cold) | 63 🔴 | 5.6s | 6.6s | 5.6s |
| 2차 (warm) | 97 🟢 | 1.7s | 2.5s | 1.7s |

**baseline 채택값 = 2차 (warm) 정합.** 이유: cold start = Vercel serverless lambda 첫 호출 = 실 사용자 첫 진입 환경 일부 반영하나 lab 측정 1회 = 편차 큼 = 실 baseline 부정확.

**Phase B 한계 § 정수 NEW (#126 13번째 누적 진화에 추가):**
- Preview URL Lighthouse = cold start 편차 큼 = warm 상태 2~3회 평균 답습 필수
- 차후 측정 시 = 1차 측정 무시 + 2~3회 warm 측정 후 평균/중앙값 답습
- Production baseline 별도 측정 = Vercel Production = warm 상태 유지 답습 (Preview = 매번 cold start 박힘)
- ★ memory 답습 차후 추가: "Lighthouse Preview 측정 = cold/warm 편차 큼"

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
| **PERF-OPTIMIZE-IMAGES** | `<img>` → `next/image` 전환 + lazy/priority | LCP 2.5s 임계값 = 개선 여지 박힘 (양호하나 여유 X) |
| **PERF-OPTIMIZE-FONTS** | Pretendard 폰트 preload + display=swap | 본 baseline FCP 미달 시 |
| **A11Y-FORM-FIELD-LABELS** (NEW) | form field id/name 누락 영역 정정 | Lighthouse Issues 탭 발견 (2026-05-28) — 접근성 영역 |
| **NFR-PERF-PAGE-LOAD-LANDING** (NEW) | / 또는 /login baseline 별도 측정 | 본 baseline = /diagnosis(동적) 1페이지만 측정 = 일반 페이지 영역 외 |
| **MON-003 Mixpanel** | 페이지뷰/이벤트 분석 (analytics 영역) | CLAUDE.md §2 답습 = 본 ISSUE 영역 외 |

---

_본 문서 신설: 2026-05-28 (Issue #126 NFR-PERF-PAGE-LOAD 측정 셋업 시점)._
_갱신 1: 2026-05-28 (/diagnosis Preview Lighthouse warm 측정 완료. ★ Cold start 편차 정수 §4.3 신설 NEW + form field a11y 핫스팟 발견 NEW + /, /login 차후 영역 정직 인정)._
