---
title: "Deadline 도메인"
category: entities
tags: [기술, mvp]
sources: [src-srs, src-task-list]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# Deadline 도메인 (domain-deadline)

## 도메인 개요

데드라인 모드(F3)의 타임라인 생성, 네이버 부동산 아웃링크, 교집합 매물 조회, 매물 0건 시 조건 완화 제안, 30분 요약 카드를 담당하는 도메인. D+7 미만 차단(DEADLINE_TOO_SOON) 검증과 계약 역산 타임라인(≥5단계) 자동 생성이 핵심.

## 사용자 가치

- **핵심 페르소나**: ③박준호(긴급 이사자, D-2개월) — [[persona-spectrum]]
- **시나리오**: 이사 마감일 입력 → 계약 역산 타임라인 ≥5단계 → 네이버 부동산 아웃링크 → 30분 요약 카드
- **Pain Point**: AOS 4.00 (Severity 5.0) — 긴급 이사 시 시간 부족 — [[src-aos-dos]]

## 포함 태스크 (5개)

| Task ID | 1줄 요약 |
|---|---|
| CMD-DL-001 | 데드라인 모드 활성화 + 계약 역산 타임라인 ≥5단계 생성 |
| CMD-DL-002 | 네이버 부동산 아웃링크 URL 조합 + 새 창 열기 |
| CMD-DL-003 | 매물 0건 시 조건 완화 제안 ≥3개 + 알림 구독 |
| QRY-DL-001 | 교집합 매물 조회 (복합 인덱스) |
| QRY-DL-002 | 30분 요약 카드 (Top 3, 항목 ≥6개) |

## 핵심 NFR

| NFR ID | 내용 |
|---|---|
| (구현 목표) | 타임라인 생성 ≤ 2초 |
| REQ-NF-007 | 교집합 매물 연산 p95 ≤ 1,500ms |
| REQ-NF-035 | Sentry 에러 추적 |

## 의존성 관계

- **의존**: Diagnosis (CMD-DIAG-004), Foundation (DB-003)
- **피의존**: Test (TEST-005)

## 관련 페이지

- Entities: [[diagnosis]], [[domain-foundation]], [[domain-diagnosis]]
- Sources: [[src-srs]], [[src-aos-dos]], [[src-cjm]]
- Concepts: [[deadline-mode]], [[srs-v1.6-changes]], [[known-follow-ups]], [[task-domains-overview]], [[domain-dependencies]], [[architecture-patterns]]
