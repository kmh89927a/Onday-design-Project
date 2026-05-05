---
title: "Diagnosis 도메인"
category: entities
tags: [기술, mvp]
sources: [src-srs, src-task-list]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# Diagnosis 도메인 (domain-diagnosis)

## 도메인 개요

서비스의 핵심 기능(F1: 두 동선 교차 진단)을 구현하는 도메인. 주소 Geocoding, 교통 API 병렬 호출(Promise.allSettled), 교집합 후보 동네 산출, AI 스코어링, 결과 저장(Prisma Transaction), 필터링을 포함한다. 73개 태스크 중 9개를 포함하며, CMD-DIAG-002(교집합 산출)가 전체 서비스의 핵심 엔진이다.

## 사용자 가치

- **핵심 페르소나**: ①김지영(맞벌이 부부), ②이수현(맹모삼천지교), ④최영호(반복 이사) — [[persona-spectrum]]
- **시나리오**: 두 직장 주소 입력 → 교집합 3곳+ 지도 표시 → 필터로 조건 좁히기 → 최적 동네 선정
- **해결하는 JTBD**: "두 사람의 통근 시간을 동시에 줄이면서 아이 학군도 유지하는 동네를 찾는다" — [[src-jtbd]]
- **Pain Point**: AOS 4.00 (중요도 5.0, 만족도 1.0) — 20개 Pain Point 중 공동 1위 — [[src-aos-dos]]

## 포함 태스크 (9개)

| Task ID | 1줄 요약 |
|---|---|
| CMD-DIAG-001 | 클라이언트 주소 Geocoding (카카오 Geocoding API) |
| CMD-DIAG-002 | 교집합 후보 동네 산출 (Promise.allSettled 병렬) |
| CMD-DIAG-003 | 후보 동네 스코어링 엔진 (Vercel AI SDK) |
| CMD-DIAG-004 | 진단 결과 서버 저장 (Prisma Transaction) |
| CMD-DIAG-005 | 조건 필터 실시간 적용 |
| CMD-DIAG-006 | 교통 API 타임아웃 핸들링 (5초+1회 재시도) |
| CMD-DIAG-007 | 수도권 커버리지 검증 |
| QRY-DIAG-001 | 진단 결과 조회 (GET /api/diagnosis/[id]) |
| QRY-DIAG-002 | 출퇴근 시간 조회 |

## 핵심 NFR

| NFR ID | 내용 |
|---|---|
| REQ-NF-001 | 교차 진단 응답 p95 ≤ 8초 |
| REQ-NF-004 | 필터 응답 p95 ≤ 1,000ms |
| REQ-NF-035 | Sentry 에러 추적 |

## 의존성 관계

- **의존**: Foundation (DB-003, API-002, API-007)
- **피의존**: ShareLink (CMD-SHARE-001), Deadline (CMD-DL-001), Single (CMD-SINGLE-001), Test (TEST-001, TEST-002)

## 관련 페이지

- Entities: [[diagnosis]], [[persona-spectrum]], [[domain-foundation]]
- Sources: [[src-srs]], [[src-jtbd]], [[src-aos-dos]]
- Concepts: [[two-route-intersection]], [[architecture-patterns]], [[task-domains-overview]], [[domain-dependencies]], [[known-follow-ups]]
