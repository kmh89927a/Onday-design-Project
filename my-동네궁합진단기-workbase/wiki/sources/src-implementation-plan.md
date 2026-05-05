---
title: "MVP 구현 로드맵 v1.2"
category: sources
tags: [기술, mvp]
sources: []
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — 73개 태스크 구조 반영. Wave 1~5 명시: Wave 1 Foundation(8개), Wave 2 도메인(28개), Wave 3 Test(9개), Wave 4~5 UI(14개), 인프라/보안/모니터링(병렬).

# MVP 구현 로드맵 v1.2

## 문서 정보

| 항목 | 값 |
|---|---|
| 원본 파일 | `raw/assets/plan_srs_stack_alignment_implementation_v1.2.md` |
| 버전 | v1.2 |
| 작성일 | 2026-04-21 |
| 크기 | 42,339 bytes / 914 lines |

## 핵심 요약

1인 퍼블리셔급 개발자가 바이브코딩(AI 코딩 도구)으로 49일 내 MVP를 완주하기 위한 Phase별 구현 계획. v1.2에서 크롤링 제거, 서버 PDF 제거, 결제 PG 제거, 교통 API 1종 축소를 통해 56일 → 49일로 단축.

## 73개 태스크 Wave 구조

### Wave 1: Foundation (8개 — 병렬 3트랙)

| 트랙 | 태스크 |
|---|---|
| 트랙 A — 인프라 | INFRA-001 → INFRA-002, INFRA-004, INFRA-005 |
| 트랙 B — DB 스키마 | DB-001 → DB-002 ~ DB-007 |
| 트랙 C — API 계약 | API-006, API-007 |

### Wave 2: 도메인 구현 (28개)

| 트랙 | 태스크 |
|---|---|
| 트랙 D — DTO 정의 | API-001 ~ API-005 |
| 트랙 E — Mock 생성 | MOCK-001 ~ MOCK-005 |
| 트랙 F — Auth | CMD-AUTH-001 ~ CMD-AUTH-004 |
| 트랙 G — 진단 핵심 | CMD-DIAG-001 ~ CMD-DIAG-007 |
| 트랙 I — 공유 | CMD-SHARE-001 ~ CMD-SHARE-004 |
| 트랙 K — 데드라인 | CMD-DL-001 ~ CMD-DL-003 |
| 트랙 L — 싱글 | CMD-SINGLE-001 ~ CMD-SINGLE-002 |
| 트랙 M — 간이 저장 | CMD-SAVE-001, QRY-SAVE-001 |

### Wave 3: Test (9개)

| 트랙 | 태스크 |
|---|---|
| 트랙 O — 단위/통합 | TEST-001 ~ TEST-008, TEST-010 |

### Wave 4~5: UI (14개) + 인프라/보안/모니터링 (병렬)

| 트랙 | 태스크 |
|---|---|
| 트랙 H — UI | UI-001 ~ UI-014 (Mock 기반 병렬 개발) |
| 트랙 P — 보안 | SEC-002 |
| 트랙 Q — 모니터링 | MON-001 |

## 핵심 전환 원칙 (5대 원칙)

| # | 원칙 |
|---|---|
| P-1 | 단일 코드베이스 (Next.js) |
| P-2 | Server-first (DB 접근은 Server Action에서만) |
| P-3 | 인프라 최소화 (Redis, API Gateway 제거) |
| P-4 | MVP 가치 보존 |
| P-5 | 월 인프라 비용 ≤ 10만원 |

## Phase별 핵심 결정

| Phase | 핵심 결정 |
|---|---|
| Phase 0 | Supabase Auth (NextAuth 대체) |
| Phase 1 | ERD 4엔터티 (Payment/Listing 제거) |
| Phase 2 | Client Component 병렬 교차 연산 (Vercel 10초 Timeout 회피) |
| Phase 3 | 회원가입 유도 모달 (결제 모달 대체) |
| Phase 4 | 네이버 부동산 아웃링크 (크롤링 대체) |
| Phase 5 | window.print() + CSS @media print (서버 PDF 대체) |
| Phase 6 | SavedSearch UPSERT 1건 (비교 뷰 연기) |

## 실현 가능성 판정

- 총 기간: 49일 (약 10주)
- 외부 인프라: Vercel + Supabase (2개)
- 월 비용: ≤ 10만원
- 태스크: 73개 (H:10, M:36, L:27)

## 관련 Wiki 페이지

- Sources: [[src-srs]], [[src-task-list]], [[src-prd]]
- Concepts: [[tech-stack]], [[two-route-intersection]], [[task-domains-overview]], [[srs-v1.6-changes]]
- Domains: [[domain-foundation]], [[domain-infra]]
