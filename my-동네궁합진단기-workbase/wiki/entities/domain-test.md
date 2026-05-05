---
title: "Test 도메인"
category: entities
tags: [기술, mvp]
sources: [src-srs, src-task-list]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# Test 도메인 (domain-test)

## 도메인 개요

SRS에 명시된 Acceptance Criteria를 Given/When/Then 기반 테스트 코드로 변환한 9개 테스트 태스크를 포함하는 도메인. Playwright E2E 테스트(TEST-010)와 도메인별 GWT 단위 테스트를 포함하며, Wave 5에서 모든 로직 구현 완료 후 실행한다.

## 사용자 가치

- **내부 사용자**: 개발자 + CI 파이프라인 — 모든 도메인의 AC를 코드로 검증
- **커버리지**: Auth(TEST-008), Diagnosis(TEST-001~002), ShareLink(TEST-003~004), Deadline(TEST-005), Single(TEST-006), SavedSearch(TEST-007), E2E(TEST-010)
- **가치**: SRS §4.1~4.2의 AC를 GWT 테스트 코드로 변환 → 회귀 방지 + 배포 신뢰성 확보

## 포함 태스크 (9개)

| Task ID | 1줄 요약 |
|---|---|
| TEST-001 | 교차 진단 GWT 시나리오 (정상 3곳+, 에러, 0곳 완화, 비수도권) |
| TEST-002 | 교통 API 타임아웃 핸들링 (5초+재시도, 무한 로딩 0건) |
| TEST-003 | 공유 링크 GWT 시나리오 (생성 ≤500ms, 만료, 미리보기) |
| TEST-004 | 공유 링크 보안 (UUID entropy, bcrypt, 비인가 차단) |
| TEST-005 | 데드라인 모드 GWT (타임라인 ≥5단계, 과거날짜, 0건 완화) |
| TEST-006 | 싱글 모드 GWT (학군 0건, 야간 등급, window.print) |
| TEST-007 | 간이 저장 시나리오 (best effort, geocoding 실패) |
| TEST-008 | OAuth 로그인 GWT (카카오/네이버, 세션, 게스트) |
| TEST-010 | E2E 통합 시나리오 (회원가입→진단→공유→리포트 열람) |

## 핵심 NFR

| NFR ID | 내용 |
|---|---|
| 전체 | SRS §4.1~4.2의 모든 AC를 테스트 코드로 검증 |

## 의존성 관계

- **의존**: Auth, Diagnosis, ShareLink, Deadline, Single, SavedSearch (모든 로직 도메인)
- **피의존**: 없음 (최종 검증)

## 관련 페이지

- Entities: [[domain-auth]], [[domain-diagnosis]], [[domain-sharelink]], [[domain-deadline]], [[domain-single]], [[domain-savedsearch]]
- Sources: [[src-srs]], [[src-task-list]]
- Concepts: [[task-domains-overview]], [[known-follow-ups]], [[architecture-patterns]], [[domain-dependencies]], [[tech-stack]]
