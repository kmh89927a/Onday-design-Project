---
title: "정합성 빚 — 알려진 후속 작업"
category: concepts
tags: [기술, mvp]
sources: [src-srs, src-task-list]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# 알려진 후속 작업 (Known Follow-Ups)

## 정의

현재 SRS v1.6 / TASK_LIST v1.3 기준으로 식별된 정합성 빚(Consistency Debt) 15개. 우선순위와 영향 도메인별로 분류.

## 정합성 빚 목록

| # | 항목 | 우선순위 | 영향 도메인 | 설명 |
|---|---|---|---|---|
| 1 | SRS §6.7 CLD ScoringEngine 가중치 | M | [[domain-diagnosis]] | 스코어링 기준 가중치가 SRS에 상세 미정. CMD-DIAG-003 구현 시 확정 필요 |
| 2 | UI-008 SRS 결제 키워드 정정 | M | [[domain-sharelink]] | SRS 본문에 남아있는 결제 관련 키워드를 회원가입 유도로 정정 필요 |
| 3 | 정적 JSON 에셋 데이터 수집 | H | [[domain-single]] | crime-stats.json, facilities.json, cafes.json 실제 데이터 수집·가공 미완료 |
| 4 | 동적 OG 이미지 (/api/og) | L | [[domain-sharelink]] | 카카오톡 공유 시 동적 OG 이미지 생성 API 구현 |
| 5 | 푸시 알림 발송 인프라 | L | [[domain-deadline]] | CMD-DL-003 매물 알림 구독 시 실제 푸시 발송 인프라 미구현 |
| 6 | Rate Limit 마이그레이션 (Upstash Redis) | M | [[domain-sharelink]], [[domain-infra]] | SEC-002의 인메모리 Rate Limit → Upstash Redis로 마이그레이션 |
| 7 | TEST CI 통합 (GitHub Actions) | M | [[domain-test]] | Playwright E2E 테스트의 CI 파이프라인 통합 |
| 8 | KAKAO_MAP_KEY 환경변수 보강 | L | [[domain-foundation]] | 카카오 지도 SDK 환경변수 관리 체계 문서화 |
| 9 | shadcn/ui 추가 컴포넌트 6개 | L | [[domain-infra]], [[domain-ui]] | INFRA-004 기본 설정 이후 추가 필요한 UI 컴포넌트 |
| 10 | iOS Safari window.print 검증 | L | [[domain-single]] | CMD-SINGLE-002의 window.print()가 iOS Safari에서 정상 동작하는지 검증 |
| 11 | 수도권 90% 커버리지 빌드 검증 | M | [[domain-single]] | CI 빌드 시 정적 JSON 에셋의 수도권 커버리지 90% 자동 검증 |
| 12 | 네이버 부동산 URL 스펙 변경 대응 | L | [[domain-deadline]] | CMD-DL-002의 네이버 부동산 아웃링크 URL이 스펙 변경 시 깨질 수 있음 |
| 13 | 카드 estimatedPrice 출처 | L | [[domain-deadline]] | QRY-DL-002 30분 요약 카드의 가격 데이터 출처 명확화 |
| 14 | Visual Regression (Percy/Chromatic) | L | [[domain-test]] | UI 변경 시 시각적 회귀 테스트 자동화 |
| 15 | MSW Mock handlers 통합 | L | [[domain-test]] | MOCK-001~005의 MSW 핸들러 통합 관리 체계 |

## 우선순위별 분류

| 우선순위 | 개수 | 항목 번호 |
|---|---|---|
| 🔴 H (High) | 1 | #3 |
| 🟡 M (Medium) | 5 | #1, #2, #6, #7, #11 |
| 🟢 L (Low) | 9 | #4, #5, #8, #9, #10, #12, #13, #14, #15 |

## 도메인별 분류

| 도메인 | 항목 수 | 항목 번호 |
|---|---|---|
| [[domain-single]] | 3 | #3, #10, #11 |
| [[domain-sharelink]] | 3 | #2, #4, #6 |
| [[domain-test]] | 3 | #7, #14, #15 |
| [[domain-deadline]] | 3 | #5, #12, #13 |
| [[domain-diagnosis]] | 1 | #1 |
| [[domain-infra]] | 2 | #6, #9 |
| [[domain-foundation]] | 1 | #8 |
| [[domain-ui]] | 1 | #9 |

## 관련 페이지

- Sources: [[src-srs]], [[src-task-list]]
- Concepts: [[srs-v1.6-changes]], [[task-domains-overview]], [[domain-dependencies]]
