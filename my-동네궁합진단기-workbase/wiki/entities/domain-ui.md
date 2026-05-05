---
title: "UI 도메인"
category: entities
tags: [기술, mvp]
sources: [src-srs, src-task-list, src-prd, src-cjm]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# UI 도메인 (domain-ui)

## 도메인 개요

14개 UI/UX 프론트엔드 태스크를 포함하는 도메인. Mock 데이터(MOCK-001~005)를 활용하여 백엔드와 병렬 개발 가능하며, INFRA-004(shadcn/ui)가 선행 조건. 모바일 퍼스트 반응형 설계, Server/Client 컴포넌트 분리, shadcn/ui 기반 디자인 시스템을 적용한다.

## 사용자 가치

- **핵심 페르소나**: 모든 사용자 — UI는 사용자가 직접 접하는 유일한 레이어 — [[persona-spectrum]]
- **CJM 기반 설계**: [[src-cjm]]의 발견→탐색→결정→공유 여정을 14개 UI 태스크로 구체화
- **설계 원칙**: 모바일 퍼스트 반응형, Server/Client 컴포넌트 분리, shadcn/ui 기반

## 포함 태스크 (14개)

| Task ID | 1줄 요약 |
|---|---|
| UI-001 | 소셜 로그인 페이지 (카카오/네이버 + 게스트 안내) |
| UI-002 | 주소 입력 화면 (자동완성 + 모드 선택) |
| UI-003 | 진단 결과 지도 시각화 (react-kakao-maps-sdk) |
| UI-004 | 후보 동네 상세 정보 패널 |
| UI-005 | 조건 필터 (통근시간 슬라이더 + 예산 범위) |
| UI-006 | 공유 링크 생성 버튼 + 클립보드 복사 |
| UI-007 | SSR 공유 리포트 페이지 (미리보기 1곳 + OG) |
| UI-008 | 회원가입 유도 모달 (뒤로가기 복귀 + 이탈 방지) |
| UI-009 | 데드라인 모드 입력 화면 (날짜 선택기 + 타임라인) |
| UI-010 | 급매 매물 리스트 + 지도 동시 표시 |
| UI-011 | 30분 요약 카드 (Top 3, 항목 ≥6개) |
| UI-012 | 싱글 모드 진단 화면 (직장+여가 입력) |
| UI-013 | 야간 안전 등급 표시 + 리포트 저장 버튼 |
| UI-014 | 이전 조건 불러오기 버튼 + 폼 자동 채움 |

## 핵심 NFR

| NFR ID | 내용 |
|---|---|
| REQ-NF-003 | SSR 로딩 p95 ≤ 2,000ms |
| REQ-NF-010 | PDF 저장 ≤ 1초 |

## 의존성 관계

- **의존**: INFRA-004 (shadcn/ui), MOCK-001~005
- **피의존**: (독립적으로 테스트 가능)

## 관련 페이지

- Entities: [[persona-spectrum]], [[domain-infra]], [[domain-diagnosis]], [[domain-sharelink]], [[domain-deadline]], [[domain-single]], [[domain-savedsearch]]
- Sources: [[src-cjm]], [[src-prd]], [[src-srs]]
- Concepts: [[tech-stack]], [[task-domains-overview]], [[known-follow-ups]], [[domain-dependencies]]
