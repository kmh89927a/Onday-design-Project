---
title: "Task List v1.3 — 개발 태스크 목록"
category: sources
tags: [기술, mvp]
sources: []
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — TASK_LIST 버전 v1.3 명시. 73개 태스크 도메인별 분류 표 추가. task-domains-overview 신규 페이지 링크.

# Task List v1.3 — 개발 태스크 목록

## 문서 정보

| 항목 | 값 |
|---|---|
| 원본 파일 | `raw/assets/06_TASK_LIST_v1.3.md` |
| 버전 | **v1.3** |
| 작성일 | 2026-04-22 |
| 크기 | 42,962 bytes / 559 lines |
| 태스크 총 수 | **73개** |

## 핵심 요약

SRS v1.6 기반 73개 개발 태스크의 상세 목록. 10개 도메인으로 분류되며, Wave 1~5 실행 순서로 구조화. 각 태스크에 Issue 상태, AC 요약, NFR 매핑이 포함되어 AI 에이전트의 자동 Issue 생성을 지원.

## 도메인별 태스크 분류 (73개)

| 도메인 | 태스크 수 | 주요 태스크 ID |
|---|---|---|
| Foundation (DB/API/Mock) | 16 | DB-001~007, API-001~007 |
| Infra | 4 | INFRA-001~002, INFRA-004~005 |
| Auth | 4 | CMD-AUTH-001~004 |
| Diagnosis | 9 | CMD-DIAG-001~007, QRY-DIAG-001~002 |
| ShareLink | 5 | CMD-SHARE-001~004, QRY-SHARE-001 |
| Deadline | 5 | CMD-DL-001~003, QRY-DL-001~002 |
| Single | 3 | CMD-SINGLE-001~002, QRY-SINGLE-001 |
| SavedSearch | 2 | CMD-SAVE-001, QRY-SAVE-001 |
| Mock | 4 | MOCK-001~002, MOCK-004~005 |
| Test | 9 | TEST-001~008, TEST-010 |
| Security | 1 | SEC-002 |
| Monitoring | 1 | MON-001 |
| UI | 14 | UI-001~014 |

> 상세 인덱스: [[task-domains-overview]]

## Wave 실행 순서

| Wave | 범위 | 태스크 수 |
|---|---|---|
| Wave 1 | 인프라 초기화 + DB + API + Mock | 8 (병렬) |
| Wave 2 | DTO 정의 + Mock 생성 | 28 (계약 완성) |
| Wave 3 | 핵심 로직 (Auth + Diagnosis + Test) | 9 (테스트) |
| Wave 4~5 | UI 14개 + 파생 기능 | 14 (UI) |
| 병렬 | 인프라/보안/모니터링 | (INFRA, SEC, MON) |

## 복잡도 통계

| 복잡도 | 태스크 수 |
|---|---|
| High (H) | 10 |
| Medium (M) | 36 |
| Low (L) | 27 |
| **합계** | **73** |

## AI Agent Guide

- `status: ✅ 작성완료` — 73개 전체 작성 완료 (2026-04-26 기준)
- 각 태스크의 AC(Acceptance Criteria) 요약 포함
- NFR(비기능 요구사항) 매핑으로 성능 기준 명시

## 관련 Wiki 페이지

- Sources: [[src-srs]], [[src-implementation-plan]]
- Concepts: [[tech-stack]], [[task-domains-overview]], [[srs-v1.6-changes]]
- Domains: [[domain-foundation]], [[domain-infra]], [[domain-auth]], [[domain-diagnosis]], [[domain-sharelink]], [[domain-deadline]], [[domain-single]], [[domain-savedsearch]], [[domain-ui]], [[domain-test]]
