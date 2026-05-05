---
title: "SRS v1.6 변경 사항"
category: concepts
tags: [기술, mvp]
sources: [src-srs]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# SRS v1.6 변경 사항

## 정의

SRS Rev 1.1 ~ Rev 1.6에 걸쳐 진행된 핵심 단순화 변경 사항의 종합 정리 페이지. MVP 스코프 축소와 기술 스택 전환의 근거를 한 페이지에서 조망.

## Rev 1.1 단순화 (DB/기능 제거)

| 제거 항목 | 구버전 | 변경 | 영향 도메인 |
|---|---|---|---|
| DB-009 | 경찰청 범죄 통계 캐시 테이블 | 정적 JSON 에셋 (public/data/crime-stats.json) | [[domain-single]] |
| DB-010 | 교육부 학교 배정 Seed 테이블 | 정적 JSON 에셋 (public/data/facilities.json) | [[domain-single]] |
| CMD-SAVE-003 | 시나리오별 동선 변화 비교 | 제거 | [[domain-savedsearch]] |
| FUNC-027 | 시나리오 비교 | 제거 | [[domain-savedsearch]] |
| FUNC-028 | 행정동 변경 감지 | 제거 | [[domain-savedsearch]] |
| replaySearch() | API-005 내 재실행 메서드 | 제거 | [[domain-savedsearch]] |
| CMD-CRON-001~002 | 크롤링/배치 갱신 | 제거 | [[domain-infra]] |
| QRY-SAVE-001 | 재계산·비교 뷰 | "폼 채우기"만 남김 | [[domain-savedsearch]] |

## Rev 1.2 단순화 (결제 도메인 전면 제거)

| 제거 항목 | 구버전 | 영향 |
|---|---|---|
| DB-005 | PAYMENT 테이블 | 스키마 제거 |
| API-004 | Payment DTO | 제거 |
| API-008 | 토스페이먼츠 PG 연동 | 제거 |
| CMD-PAY-001~003 | 결제 로직 | 제거 |
| QRY-PAY-001 | 결제 이력 조회 | 제거 |
| MOCK-003 | 결제 Mock | 제거 |
| TEST-009 | 결제 GWT 테스트 | 제거 |
| UI-015 | 결제 UI | 제거 |

> **대체**: WTP(Willingness-To-Pay) 설문 측정으로 유료 전환 가능성 사전 검증

## Rev 1.6 단순화 (인증·보안 전환)

| 항목 | 구버전 | 신버전 | 근거 |
|---|---|---|---|
| 인증 | NextAuth.js v5 | **Supabase Auth** (PKCE OAuth) | CON-18 |
| 암호화 | AES-256 애플리케이션 레벨 | **TLS만** (Supabase 기본) | CON-16 |
| bcrypt | 사용자 비밀번호 해싱 | **ShareLink 비밀번호 전용** (강도 12) | REQ-NF-020 |
| 공유 링크 WTP | 결제 전환 모달 | **회원가입 유도 모달** (UI-008) | REQ-FUNC-014 |

## 영향 매트릭스

| 변경 | 영향받는 wiki 페이지 |
|---|---|
| Supabase Auth 전환 | [[tech-stack]], [[user]], [[domain-auth]], [[domain-foundation]] |
| 결제 도메인 제거 | [[share-link]], [[share-link-entity]], [[domain-sharelink]] |
| DB-009/010 제거 | [[single-mode]], [[domain-single]] |
| 시나리오 비교 제거 | [[saved-search]], [[domain-savedsearch]] |
| AES-256 제거 | [[tech-stack]], [[share-link-entity]] |
| bcrypt 용도 변경 | [[share-link-entity]], [[architecture-patterns]] |

## 관련 페이지

- Sources: [[src-srs]], [[src-task-list]], [[src-implementation-plan]]
- Concepts: [[tech-stack]], [[share-link]], [[single-mode]], [[architecture-patterns]]
- Entities: [[user]], [[diagnosis]], [[saved-search]], [[share-link-entity]]
- Domains: [[domain-foundation]], [[domain-auth]], [[domain-diagnosis]], [[domain-sharelink]], [[domain-single]], [[domain-savedsearch]]
