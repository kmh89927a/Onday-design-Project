---
title: "SavedSearch 도메인"
category: entities
tags: [기술, mvp]
sources: [src-srs, src-task-list]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# SavedSearch 도메인 (domain-savedsearch)

## 도메인 개요

간이 저장·불러오기(F5)의 입력값 자동 저장(best effort UPSERT)과 저장된 조건 불러오기를 담당하는 도메인. Rev 1.1 단순화로 비교 뷰, 시나리오 비교, replaySearch()가 모두 제거되어 "저장된 값을 입력 폼에 채우기"만 구현한다. 저장 실패 시 사용자 미통지(Sentry 기록만).

## 사용자 가치

- **핵심 페르소나**: ⑤최영호(반복 이사자, 2년 주기 발령) — [[persona-spectrum]]
- **시나리오**: 재방문 → "이전 조건 불러오기" 버튼 → 주소·필터 폼 자동 채움 (≤ 1초) → 조건 수정 후 재진단
- **가치**: 반복 입력 제거로 시간 절약, 재방문 유저 리텐션 향상

## 포함 태스크 (2개)

| Task ID | 1줄 요약 |
|---|---|
| CMD-SAVE-001 | 입력값 자동 저장 (best effort UPSERT, beforeunload) |
| QRY-SAVE-001 | 저장된 조건 불러오기 (폼 자동 채움 + geocoding 재검증) |

## 핵심 NFR

| NFR ID | 내용 |
|---|---|
| REQ-NF-016 | 저장 best effort (실패 허용) |
| REQ-NF-035 | Sentry 에러 추적 |

## 의존성 관계

- **의존**: Foundation (DB-006, API-005)
- **피의존**: Test (TEST-007)

## 관련 페이지

- Entities: [[saved-search]], [[user]], [[diagnosis]], [[domain-foundation]], [[domain-diagnosis]]
- Sources: [[src-srs]], [[src-cjm]]
- Concepts: [[srs-v1.6-changes]], [[task-domains-overview]], [[architecture-patterns]], [[known-follow-ups]], [[domain-dependencies]]
