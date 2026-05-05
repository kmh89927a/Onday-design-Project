---
title: "프로젝트 개요 — 동네궁합진단기"
category: meta
tags: [mvp, 비즈니스, 기술]
sources: [src-prd, src-srs, src-problem-definition]
created: 2026-04-23
updated: 2026-04-26
status: active
---

# 동네궁합진단기 — 프로젝트 개요

## 한 줄 요약

> **맞벌이 부부가 두 사람의 직장·학군·생활 동선을 동시에 만족하는 동네를 10분 안에 찾을 수 있는 데이터 기반 주거 의사결정 서비스**

## 문제 정의

이사를 앞둔 3040 부부는 **세 가지 구조적 문제**에 직면합니다:

1. **트레이드오프 마비** — 학군 좋은 동네는 직장에서 멀고, 직장 가까운 동네는 학교가 아쉬움. 어느 쪽을 포기해도 후회가 남는 구조.
2. **정보 과부하** — 학군 카페, 네이버 지도, 부동산 앱, 통근 앱을 따로 뒤지다 지침. 두 사람의 조건을 동시에 넣을 수 있는 도구가 없음.
3. **미래 시뮬레이션 불가** — 아이 입학 시점, 전세 만료 등 미래 변수를 고려한 동선 예측을 직접 하기 어려움.

> 상세: [[src-problem-definition]], [[src-value-proposition]]

## 북극성 지표 (North Star KPI)

| KPI | 목표값 | 측정 방법 |
|---|---|---|
| 🌟 **진단 완료 수/주** | 50 → 200건/주 | 서버 로그 |
| WTP 설문 응답률 | ≥ 30% | Mixpanel |
| 배우자 공유 링크 클릭률 | ≥ 40% | ShareLink.viewCount |
| 공유 → 2nd 유저 전환율 | ≥ 15% | Amplitude |
| NPS | ≥ 50 | 설문 |

> 상세: [[src-prd]]

## 핵심 타깃 사용자

| 세그먼트 | 코드 | 설명 | 우선순위 |
|---|---|---|---|
| 맞벌이 부부 | C-01 | 두 직장 + 학군 교차 최적화 | **MVP 1순위** |
| 맹모삼천지교 | C-02 | 학군 최우선 + 광역버스 환승 | MVP |
| 긴급 이사자 | C-03 | D-2개월 내 데드라인 이사 | MVP |
| 반복 이사자 | C-04 | 2년 주기 발령 교사/공무원 | MVP |
| 이직 후 이사 (싱글) | A-01 | 직장 + 여가 거점 최적화 | MVP (싱글 모드) |

> 상세: [[persona-spectrum]], [[src-persona]], [[src-cjm]]
> 페르소나별 도메인 흐름: [[persona-domain-flows]]

## MVP 기능 (5대 Feature)

| # | 기능 | 설명 | 관련 REQ |
|---|---|---|---|
| F1 | [[two-route-intersection]] | 두 직장 주소 → 교차 동선 → 후보 동네 지도 | FUNC-001~008 |
| F2 | [[share-link]] | 배우자 공유 링크 + 무료 미리보기 1곳 | FUNC-009~014 |
| F3 | [[deadline-mode]] | 이사 마감일 역산 타임라인 + 네이버 부동산 아웃링크 | FUNC-015~020 |
| F4 | [[single-mode]] | 싱글 모드 (학군 숨김, 치안·편의시설 강조) | FUNC-021~024 |
| F5 | [[saved-search]] | 입력값 자동 저장 + 불러오기 (간이 버전) | FUNC-025 |

> 상세: [[src-srs]], [[src-implementation-plan]]

## 기술 스택

| 레이어 | 기술 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | 단일 풀스택 |
| 인증 | Supabase Auth (@supabase/ssr) | 카카오/네이버 OAuth |
| DB | Prisma ORM → SQLite(Dev) / Supabase PG(Prod) | |
| UI | Tailwind CSS v4 + shadcn/ui | |
| 지도 | react-kakao-maps-sdk | 카카오 지도 |
| 교통 API | 카카오 모빌리티 (1종, MVP) | CON-07 |
| AI | Vercel AI SDK + Gemini | 선택적 |
| 배포 | Vercel | 무료 티어 |
| 모니터링 | Sentry + Vercel Analytics | |

> 상세: [[tech-stack]], [[src-implementation-plan]]

## MVP 범위 외 (Out of Scope)

- ❌ 결제 시스템 (WTP 설문으로 대체)
- ❌ 직접 매물 크롤링 (네이버 부동산 아웃링크)
- ❌ 서버 PDF 생성 (window.print() 대체)
- ❌ 다중 교통 API 폴백 (카카오 1종만)
- ❌ 비교 뷰 / 시나리오 3개 비교
- ❌ 비수도권 지역

## 일정

| Phase | 내용 | 기간 |
|---|---|---|
| Phase 0-1 | 환경 설정 + DB/Auth | Day 1~8 |
| Phase 2 | F1 두 동선 교차 진단 | Day 9~18 |
| Phase 3 | F2 배우자 공유 링크 | Day 19~24 |
| Phase 4 | F3 데드라인 모드 | Day 25~30 |
| Phase 5 | F4 싱글 모드 | Day 31~35 |
| Phase 6 | F5 간이 저장 | Day 36~37 |
| Phase 7 | AI 레이어 (선택) | Day 38~43 |
| Phase 8 | 배포 + 운영 | Day 44~49 |
| **합계** | | **49일** |

> 상세: [[src-implementation-plan]], [[src-task-list]]

## 시장 기회

- **글로벌 프롭테크 TAM**: ~$470억 (2025년, CAGR 16%)
- **국내 프롭테크**: ~2.3조원 (2023년, 9.1% 성장)
- **현실적 SAM**: 연간 60~180억원 (Bottom-up 추정)
- **폐업 사유 1위**: 입지·업종 선정 실패 (25.0%)

> 상세: [[market-size]], [[src-market-analysis]]

## Wiki 구조 안내 (v1.6)

이 Wiki는 **43개 페이지**로 구성됩니다:

| 카테고리 | 페이지 수 | 핵심 페이지 |
|---|---|---|
| **Sources** | 13 | [[src-srs]], [[src-task-list]], [[src-implementation-plan]] |
| **Entities** | 15 | [[diagnosis]], [[user]], + 도메인 인덱스 10개 |
| **Concepts** | 12 | [[srs-v1.6-changes]], [[task-domains-overview]], [[architecture-patterns]], [[persona-domain-flows]] |
| **Meta** | 4 | [[_schema]], [[index]], [[log]], overview (이 페이지) |

> 전체 카탈로그: [[index]]

## 활용 시나리오

| # | 시나리오 | 시작 페이지 |
|---|---|---|
| 1 | "SRS v1.6에서 뭐가 바뀌었지?" | [[srs-v1.6-changes]] |
| 2 | "Diagnosis 도메인에 어떤 태스크가 있지?" | [[domain-diagnosis]] → [[task-domains-overview]] |
| 3 | "Promise.allSettled 패턴 코드 예시 보고 싶어" | [[architecture-patterns]] |
| 4 | "맞벌이 부부 김지영이 어떤 Flow를 타지?" | [[persona-domain-flows]] |
| 5 | "아직 해결 안 된 기술 빚이 뭐가 있지?" | [[known-follow-ups]] |
| 6 | "도메인 간 의존성과 Critical Path는?" | [[domain-dependencies]] |
