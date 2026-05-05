---
title: "Wiki 인덱스"
category: meta
created: 2026-04-23
updated: 2026-04-26
---

# 동네궁합진단기 Wiki — 인덱스

> 총 **43개 페이지** | 최종 업데이트: 2026-04-26 (v2.1 보강 — 도메인 사용자 가치, 코드 예시, 페르소나 매핑)

---

## 📋 메타

| 페이지 | 설명 |
|---|---|
| [[_schema]] | Wiki 운영 규칙 (디렉토리, 페이지 형식, 워크플로우) |
| [[overview]] | 프로젝트 전체 개요 — 한 페이지 조망 |
| [[log]] | 시간순 이력 (Ingest/Query/Lint) |

---

## 📚 Sources (13개)

### 핵심 기획·기술 문서

| 페이지 | 원본 | 상태 |
|---|---|---|
| [[src-prd]] | PRD v0.1-rev.4 — 제품 요구사항 | ✅ |
| [[src-srs]] | SRS v1.6 — 소프트웨어 요구사항 명세서 | ✅ 갱신 |
| [[src-task-list]] | Task List v1.3 — 개발 태스크 목록 | ✅ 갱신 |
| [[src-implementation-plan]] | MVP 구현 로드맵 v1.2 | ✅ 갱신 |

### 비즈니스 전략

| 페이지 | 원본 | 상태 |
|---|---|---|
| [[src-value-proposition]] | Value Proposition Sheet V2 | ✅ |
| [[src-problem-definition]] | 문제 정의서 | ✅ |
| [[src-ksf]] | 핵심 성공 요인 (KSF) | ✅ |
| [[src-market-analysis]] | TAM-SAM-SOM + 시장 세그먼트 | ✅ |
| [[src-competitor-analysis]] | 경쟁사 분석 (5곳) | ✅ |

### 사용자 연구

| 페이지 | 원본 | 상태 |
|---|---|---|
| [[src-jtbd]] | JTBD 인터뷰 리포트 | ✅ |
| [[src-persona]] | 페르소나 스펙트럼 맵 (12명) | ✅ |
| [[src-cjm]] | 고객 여정 지도 (5명 상세) | ✅ |
| [[src-aos-dos]] | AOS/DOS 기회 분석 (20개 Pain Point) | ✅ |

---

## 🏗️ Entities (15개)

### 핵심 데이터 엔터티

| 페이지 | 설명 | 태그 |
|---|---|---|
| [[user]] | User 엔터티 — OAuth-only (Supabase Auth) | `#데이터` `#mvp` |
| [[diagnosis]] | Diagnosis 엔터티 — 교차 진단 결과 + AI 스코어링 | `#데이터` `#mvp` |
| [[share-link-entity]] | ShareLink 엔터티 — UUID v4 + bcrypt 12 | `#데이터` `#mvp` |
| [[saved-search]] | SavedSearch 엔터티 — best effort UPSERT | `#데이터` `#mvp` |
| [[persona-spectrum]] | 페르소나 스펙트럼 — 12명 분류 | `#사용자` |

### 도메인 인덱스 (🆕 10개)

| 페이지 | 설명 | 태스크 수 |
|---|---|---|
| [[domain-foundation]] | Foundation — DB/API/Mock 기반 | 16 |
| [[domain-infra]] | Infra — 인프라/보안/모니터링 | 6 |
| [[domain-auth]] | Auth — Supabase Auth OAuth | 4 |
| [[domain-diagnosis]] | Diagnosis — 두 동선 교차 진단 | 9 |
| [[domain-sharelink]] | ShareLink — 배우자 공유 링크 | 5 |
| [[domain-deadline]] | Deadline — 데드라인 모드 | 5 |
| [[domain-single]] | Single — 싱글 모드 | 3 |
| [[domain-savedsearch]] | SavedSearch — 간이 저장 | 2 |
| [[domain-ui]] | UI — 프론트엔드 14개 화면 | 14 |
| [[domain-test]] | Test — GWT 시나리오 + E2E | 9 |

---

## 💡 Concepts (11개)

### 기능 개념

| 페이지 | 설명 | MVP | 태그 |
|---|---|---|---|
| [[two-route-intersection]] | F1 두 동선 교차 진단 — 서비스 정체성 | ✅ | `#mvp` `#기술` |
| [[share-link]] | F2 배우자 공유 링크 — 바이럴 루프 | ✅ | `#mvp` `#비즈니스` |
| [[deadline-mode]] | F3 데드라인 모드 — 긴급 이사 | ✅ | `#mvp` `#기술` |
| [[single-mode]] | F4 싱글 모드 — 학군 숨김, 치안 강조 | ✅ | `#mvp` `#기술` |
| [[tech-stack]] | 기술 스택 — Next.js + Supabase + Vercel | ✅ | `#기술` |
| [[market-size]] | 시장 규모 — TAM-SAM-SOM + 경쟁 환경 | — | `#시장` `#비즈니스` |

### v1.6 신규 개념 (🆕 5개)

| 페이지 | 설명 | 태그 |
|---|---|---|
| [[srs-v1.6-changes]] | SRS v1.6 핵심 변경 사항 종합 | `#기술` |
| [[task-domains-overview]] | 73개 태스크 10개 도메인별 인덱스 | `#기술` |
| [[domain-dependencies]] | 도메인 간 의존성 다이어그램 | `#기술` |
| [[known-follow-ups]] | 정합성 빚 15개 (우선순위별) | `#기술` |
| [[architecture-patterns]] | 시니어급 아키텍처 패턴 7가지 | `#기술` |
| [[persona-domain-flows]] | 페르소나별 도메인 흐름 매핑 (🆕) | `#사용자` |

---

## 📊 통계

| 카테고리 | 페이지 수 | 상태 |
|---|---|---|
| Sources | 13 | ✅ 13 (3개 갱신) |
| Entities | 15 | ✅ 15 (5기존 + 10신규) |
| Concepts | 11 | ✅ 11 (6기존 + 5신규) |
| Meta | 3 | ✅ 3 |
| **합계** | **42** | |
