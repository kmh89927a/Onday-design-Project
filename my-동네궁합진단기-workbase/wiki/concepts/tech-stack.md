---
title: "기술 스택"
category: concepts
tags: [기술, mvp]
sources: [src-srs, src-implementation-plan, src-task-list]
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — SRS v1.6 / TASK_LIST v1.3 반영. NextAuth.js 제거→Supabase Auth, AES-256 제거→TLS만, Payment 도메인 제거, bcrypt는 ShareLink 비밀번호 전용(강도 12), 추가 라이브러리(react-kakao-maps-sdk, react-hook-form, zod, Vercel AI SDK + Gemini, Sentry, MSW, Playwright) 명시.

# 기술 스택 (Tech Stack)

## 정의

동네궁합진단기 MVP의 기술 아키텍처. "C-TEC"(Consolidated Technology) 원칙에 따라 단일 Next.js 풀스택으로 구성.

## 아키텍처 원칙

| # | 원칙 | 설명 |
|---|---|---|
| P-1 | 단일 코드베이스 | 프론트·백 분리 없이 Next.js 단일 프로젝트 |
| P-2 | Server-first | DB 접근은 Server Actions/Route Handlers에서만 |
| P-3 | 인프라 최소화 | Redis, API Gateway, 별도 배치 서버 제거 |
| P-4 | MVP 가치 보존 | 기술 전환이 UX 저하시키지 않아야 |
| P-5 | 비용 현실화 | 월 인프라 ≤ 10만원 |

## 스택 상세

### 코어

| 레이어 | 기술 | 버전/비고 |
|---|---|---|
| 프레임워크 | Next.js (App Router) | 15 |
| ORM | Prisma | SQLite(Dev) / Supabase PG(Prod) |
| 인증 | Supabase Auth | @supabase/ssr, PKCE OAuth, 카카오/네이버 |
| UI | Tailwind CSS + shadcn/ui | v4 |
| 폼 관리 | react-hook-form + zod | 런타임 스키마 검증 |

### 클라이언트

| 라이브러리 | 용도 |
|---|---|
| react-kakao-maps-sdk | 지도 시각화 (KAKAO_MAP_KEY 환경변수) |
| @supabase/ssr | 브라우저 인증 클라이언트 |
| react-hook-form | 폼 상태 관리 |
| zod | 입력값 런타임 검증 |

### 서버 / AI

| 라이브러리 | 용도 |
|---|---|
| Vercel AI SDK | AI 프로바이더 추상화 (INFRA-005) |
| @ai-sdk/google (Gemini) | 기본 AI 프로바이더 |
| bcrypt (강도 12) | ShareLink 비밀번호 해싱 전용 |

### 외부 API

| API | 용도 | MVP 사용 |
|---|---|---|
| 카카오 모빌리티 | 교통 데이터 (유일) | ✅ CON-07 |
| 카카오 Geocoding | 주소 → 좌표 | ✅ |
| 국토교통부 | 실거래가 | ✅ |
| 경찰청 범죄 통계 | 정적 JSON (public/data/crime-stats.json) | ✅ |
| 교육부 학교 배정 구역 | 정적 JSON (public/data/facilities.json) | ✅ |
| Google Gemini | AI 스코어링 (CMD-DIAG-003) | ✅ INFRA-005 |
| 네이버 부동산 | 매물 아웃링크 (EXT-08) | ✅ |

### 배포·모니터링

| 서비스 | 용도 |
|---|---|
| Vercel | 배포 (무료 티어) |
| Sentry | 에러 추적 + 성능 모니터링 (MON-001) |
| Vercel Analytics | 성능 모니터링 |

### 테스트

| 도구 | 용도 |
|---|---|
| Playwright | E2E 테스트 (TEST-010) |
| MSW (Mock Service Worker) | API Mock 핸들러 |

### 암호화·보안

| 항목 | v1.6 상태 | 비고 |
|---|---|---|
| 전송 암호화 | Supabase TLS | CON-16 |
| 애플리케이션 레벨 암호화 | ❌ 제거 | AES-256 불필요 (TLS 충분) |
| bcrypt | ShareLink 비밀번호 전용 | 강도 12 + DUMMY_HASH (Timing Attack 방지) |
| 사용자 비밀번호 | ❌ 없음 | OAuth-only (Supabase Auth) |

## v1.2 → v1.6 제거 목록

| 제거 항목 | 사유 |
|---|---|
| NextAuth.js v5 | → Supabase Auth (PKCE OAuth) |
| AES-256 애플리케이션 레벨 암호화 | → TLS만 사용 (CON-16) |
| Toss Payments SDK | → 결제 도메인 v1.2에서 제거 |
| bcrypt 사용자 비밀번호 | → OAuth-only, bcrypt는 ShareLink 전용 |
| Vercel Cron 크롤링 | → 아웃링크 대체 |
| @react-pdf/renderer | → window.print() |
| 네이버/ODsay 교통 API | → 카카오 1종 |

## 관련 페이지

- Entities: [[user]], [[diagnosis]], [[domain-foundation]], [[domain-infra]]
- Sources: [[src-srs]], [[src-implementation-plan]], [[src-task-list]]
- Concepts: [[two-route-intersection]], [[srs-v1.6-changes]], [[architecture-patterns]]
