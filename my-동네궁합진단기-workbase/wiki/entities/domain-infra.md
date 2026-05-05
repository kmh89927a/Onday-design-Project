---
title: "Infra 도메인"
category: entities
tags: [기술, mvp]
sources: [src-srs, src-task-list, src-implementation-plan]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# Infra 도메인 (domain-infra)

## 도메인 개요

프로젝트 인프라 초기화, 디자인 시스템 설정, AI SDK 연동, 보안(Rate Limiting), 모니터링(Sentry)을 포함하는 운영 기반 도메인. INFRA-001이 프로젝트 전체의 출발점이며, INFRA-004(shadcn/ui)는 UI 14개 태스크를 unblock하고, INFRA-005(AI SDK)는 CMD-DIAG-003 AI 스코어링을 unblock한다.

## 사용자 가치

- **내부 사용자**: 개발자 (1인 퍼블리셔) — 프로젝트 초기화부터 배포까지 전 과정의 기반
- **가치**: INFRA-004가 UI 14개 태스크를 unblock, INFRA-005가 AI 스코어링을 unblock. 단일 Critical Path의 출발점

## 포함 태스크 (6개)

| Task ID | 1줄 요약 |
|---|---|
| INFRA-001 | Next.js 15 App Router 프로젝트 초기화 + Vercel 배포 |
| INFRA-002 | Supabase PostgreSQL DB 프로비저닝 |
| INFRA-004 | Tailwind CSS + shadcn/ui 디자인 시스템 초기 설정 |
| INFRA-005 | Vercel AI SDK + Google Gemini API 연동 |
| SEC-002 | Next.js Middleware Rate Limiting |
| MON-001 | Sentry 기본 통합 (에러 추적 + 알림) |

## 핵심 NFR

| NFR ID | 내용 |
|---|---|
| REQ-NF-022 | Rate Limiting: 인증 60req/min, 비인증 20req/min |
| REQ-NF-035 | Sentry 에러 추적 |

## 의존성 관계

- **피의존**: Foundation(DB-001), UI 전체(INFRA-004), Diagnosis AI(INFRA-005)
- **의존**: 없음 (최초 출발점)

## 관련 페이지

- Entities: [[domain-foundation]], [[domain-auth]], [[domain-diagnosis]]
- Sources: [[src-implementation-plan]], [[src-srs]], [[src-task-list]]
- Concepts: [[tech-stack]], [[task-domains-overview]], [[domain-dependencies]], [[architecture-patterns]], [[known-follow-ups]]
