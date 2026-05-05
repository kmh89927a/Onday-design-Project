---
title: "Foundation 도메인"
category: entities
tags: [기술, mvp]
sources: [src-srs, src-task-list, src-implementation-plan]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# Foundation 도메인 (domain-foundation)

## 도메인 개요

프로젝트의 데이터 기반(DB 스키마), API 통신 계약(DTO), Mock 데이터를 포함하는 최하위 기반 도메인. 모든 후속 도메인 태스크는 이 도메인의 산출물(Prisma 스키마, DTO 타입, Mock 데이터)을 import하여 사용하므로, Wave 1에서 최우선으로 완료해야 한다.

DB-001(Prisma 초기화)이 전체 스키마 체인의 출발점이며, API-006(공통 에러 코드)은 모든 API 도메인에 adaptLegacyMap() 어댑터를 제공한다.

## 사용자 가치

- **내부 사용자**: 개발자 + AI 에이전트 — 모든 도메인이 Foundation의 산출물(Prisma 스키마, DTO, Mock)을 import
- **가치**: Wave 1에서 최우선 완료 → 후속 모든 도메인(Auth, Diagnosis, ShareLink 등) unblock

## 포함 태스크 (16개)

| Task ID | 1줄 요약 |
|---|---|
| DB-001 | Prisma 프로젝트 초기화 및 datasource 설정 |
| DB-002 | USER 테이블 Prisma 스키마 정의 |
| DB-003 | DIAGNOSIS 테이블 Prisma 스키마 정의 |
| DB-004 | SHARE_LINK 테이블 Prisma 스키마 정의 |
| DB-006 | SAVED_SEARCH 테이블 Prisma 스키마 정의 |
| DB-007 | Supabase Auth 연동 USER 스키마 정렬 |
| API-001 | Auth 도메인 DTO 정의 |
| API-002 | Diagnosis 도메인 Request/Response DTO |
| API-003 | ShareLink 도메인 DTO |
| API-005 | SavedSearch 도메인 DTO |
| API-006 | 공통 에러 코드 체계 (adaptLegacyMap) |
| API-007 | 카카오 모빌리티 API 클라이언트 인터페이스 |
| MOCK-001 | 진단 결과 Mock 데이터 |
| MOCK-002 | 공유 링크 열람 Mock 데이터 |
| MOCK-004 | 카카오 모빌리티 API Mock 응답 |
| MOCK-005 | OAuth 소셜 로그인 Mock 데이터 |

## 핵심 NFR

| NFR ID | 내용 |
|---|---|
| REQ-NF-001 | 교차 진단 응답 p95 ≤ 8초 (스키마 인덱스 설계 영향) |

## 의존성 관계

- **피의존**: 모든 도메인(Auth, Diagnosis, ShareLink 등)이 Foundation에 의존
- **의존**: INFRA-001 (Next.js 프로젝트) → DB-001 출발

## 관련 페이지

- Entities: [[diagnosis]], [[user]], [[share-link-entity]], [[saved-search]]
- Sources: [[src-implementation-plan]], [[src-srs]], [[src-task-list]]
- Concepts: [[tech-stack]], [[task-domains-overview]], [[domain-dependencies]], [[architecture-patterns]], [[known-follow-ups]]
