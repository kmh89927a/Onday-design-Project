# 🏠 동네궁합진단기 — 내 하루 동선 맞춤 동네 궁합 진단기

> **주말 6시간 발품을, 6초 진단으로.**
> 맞벌이 부부가 두 사람의 직장·학군·생활 동선을 동시에 만족하는 동네를 **6초 AI 진단**으로 찾는 데이터 기반 주거 의사결정 서비스.

## 🚀 라이브 URL

**https://onday-prototype-claude-design.vercel.app**

| 경로 | 설명 |
|------|------|
| `/` | → `/landing` 자동 redirect |
| `/landing` | **랜딩페이지** (고객 Hook — 9개 섹션) |
| `/login` | 로그인 / 게스트 체험 |
| `/diagnosis` | 진단 입력 (직장 주소 + 모드 선택) |
| `/diagnosis/result/[id]` | 커플 모드 결과 |
| `/single/[id]` | 싱글 모드 결과 |
| `/share/[uuid]` | 배우자 공유 링크 |
| `/deadline` | 데드라인 모드 |

## 사용자 흐름

```
Landing Page ─── CTA "지금 무료로 진단 시작하기" ───▶ Login
       │                                                │
       │ (9개 섹션: Pain Point · I/O · B&A ·             │ (카카오/네이버/게스트)
       │  5대 기능 · 페르소나 · 시장 인사이트)               ▼
       │                                          Diagnosis Input
       │                                                │
       │                                                ▼
       │                                       Result (Map + Cards)
       │                                          │         │
       │                                     Share Link  Deadline Mode
       └──────────────────────────────────────────────────────────┘
```

## Target Problem — 3040 부부의 3가지 구조적 문제

| # | 문제 | 현실 |
|---|---|---|
| 1 | 트레이드오프 마비 | 학군 좋은 곳은 직장에서 멀고, 직장 가까운 곳은 학교가 아쉬움 |
| 2 | 정보 과부하 | 학군카페·네이버 지도·부동산앱·통근앱 수동 조합 → 평균 2~3시간 |
| 3 | 미래 시뮬레이션 불가 | 아이 입학 시점·전세 만료 등 미래 변수 반영 도구 전무 |

## 5대 핵심 기능

| 기능 | 설명 | AOS |
|---|---|---|
| **F1** 두 동선 교차 진단 | 양쪽 통근 교집합 최적 동네 산출 | **4.00** |
| **F2** 배우자 공유 링크 | 비회원 미리보기 + 부부 합의 돌파 | 3.04 |
| **F3** 데드라인 모드 | 이사 마감일 역산 타임라인 | 3.80 |
| **F4** 싱글 모드 | 야간 치안·편의시설 강조 | — |
| **F5** 간이 저장 | 입력값 자동 저장 + 불러오기 | — |

## Getting Started

```bash
npm install
npm run dev
```

> http://localhost:3000 → `/landing`으로 자동 이동

## Tech Stack

| 레이어 | 기술 |
|--------|------|
| Framework | Next.js 15 App Router + TypeScript (strict) |
| Styling | Tailwind CSS v3 + shadcn/ui (Pretendard) |
| State | Zustand + TanStack Query v5 |
| Auth | Supabase Auth (카카오/네이버) — MVP는 Mock |
| DB | Prisma ORM (SQLite dev / Supabase PG prod) |
| Map | react-kakao-maps-sdk (MVP는 MapPlaceholder) |

## 랜딩페이지 설계 전략 (v2)

> **유형**: C 유형 (결과 지향형) · **달성률**: 97%

| 구분 | 요소 | 달성 |
|------|------|------|
| 코어 | 히어로 (주말 6시간→6초 + Pain 뱃지) | ✅ |
| 코어 | CTA 반복 4곳 + 3중 안전 마이크로카피 | ✅ |
| 코어 | 소셜프루프 (페르소나 리뷰 + 시장 수치) | ✅ |
| C유형 | Pain Point 3대 구조적 문제 | ✅ |
| C유형 | I/O 다이어그램 (학군 포함) | ✅ |
| C유형 | Before & After (98% 시간 절약) | ✅ |
| C유형 | 5대 기능 F1~F5 (AOS 점수) | ✅ |
| C유형 | 시장 인사이트 ($470억·경쟁자 0) | ✅ |
| C유형 | Closed Beta 2026.08 롤아웃 명시 | ✅ |

> 📄 상세: `docs/landing-page-checklist.md`

## 진행 상황

| Step | 내용 | 상태 |
|------|------|------|
| 1~12 | 프로젝트 초기화 ~ UX 정리 + Vercel 배포 | ✅ |
| 13 | 랜딩페이지 v1 (고객 Hook) | ✅ |
| **13.5** | **랜딩페이지 v2 (비즈니스 브리프 전면 반영)** | ✅ |

---

© 2026 동네궁합진단기. 모든 권리 보유.
