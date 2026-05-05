---
title: "Auth 도메인"
category: entities
tags: [기술, mvp]
sources: [src-srs, src-task-list, src-prd]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# Auth 도메인 (domain-auth)

## 도메인 개요

Supabase Auth 기반 OAuth 인증(카카오/네이버), 세션 관리(@supabase/ssr httpOnly cookie), 게스트 임시 체험 모드를 포함하는 인증 도메인. NextAuth.js v5에서 Supabase Auth로 전환(SRS v1.6)된 후, PKCE OAuth 흐름을 채택.

## 사용자 가치

- **핵심 페르소나**: 모든 사용자 (인증은 전 도메인의 진입 관문) — [[persona-spectrum]]
- **시나리오**: 카카오/네이버 OAuth 로그인 → 세션 생성 → 전 기능 이용 가능. OAuth 장애 시 게스트 모드(sessionStorage)
- **가치**: 1클릭 소셜 로그인으로 진입 장벽 최소화, 장애 시에도 임시 체험 가능

## 포함 태스크 (4개)

| Task ID | 1줄 요약 |
|---|---|
| CMD-AUTH-001 | Supabase Auth 카카오 OAuth Provider 설정 |
| CMD-AUTH-002 | Supabase Auth 네이버 OAuth Provider 설정 |
| CMD-AUTH-003 | Supabase Auth 세션 전략 (@supabase/ssr httpOnly cookie) |
| CMD-AUTH-004 | OAuth 장애 시 게스트 임시 체험 모드 |

## 핵심 NFR

| NFR ID | 내용 |
|---|---|
| REQ-NF-018 | httpOnly cookie, sameSite strict |
| REQ-NF-035 | Sentry 에러 추적 |

## 의존성 관계

- **의존**: DB-007 (Supabase Auth 연동 USER 정렬), API-001 (Auth DTO)
- **피의존**: TEST-008 (OAuth 로그인 GWT)

## 관련 페이지

- Entities: [[user]], [[domain-foundation]], [[domain-infra]]
- Sources: [[src-srs]], [[src-prd]]
- Concepts: [[tech-stack]], [[srs-v1.6-changes]], [[task-domains-overview]], [[architecture-patterns]], [[domain-dependencies]], [[known-follow-ups]]
