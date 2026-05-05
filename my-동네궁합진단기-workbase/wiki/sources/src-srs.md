---
title: "SRS v1.6 — 소프트웨어 요구사항 명세서"
category: sources
tags: [기술, mvp, 데이터]
sources: []
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — SRS 버전 v1.6 명시. Rev 1.1 단순화 변경 사항 표 추가 (결제 도메인 제거(v1.2), DB-009/DB-010 제거(Rev 1.1), 시나리오 비교 제거, NextAuth→Supabase Auth, AES-256 제거, replaySearch() 제거).

# SRS v1.6 — 소프트웨어 요구사항 명세서

## 문서 정보

| 항목 | 값 |
|---|---|
| 원본 파일 | `raw/assets/05_SRS_v1.6.md` |
| 버전 | **Rev 1.6** |
| 작성일 | 2026-04-18 (Rev 1.6: 2026-04-21) |
| 크기 | 82,383 bytes / 1,355 lines |
| 표준 | ISO/IEC/IEEE 29148:2018 |

## 핵심 요약

동네궁합진단기 MVP의 기능 요구사항(REQ-FUNC-001~031), 비기능 요구사항(REQ-NF), ERD(4개 엔터티), 시퀀스 다이어그램(6건), UseCase 다이어그램, 컴포넌트 다이어그램, 클래스 다이어그램을 포함하는 기술 최상위 문서. Rev 1.6에서 Supabase Auth 전환, 결제 전면 제거, WTP 설문 측정 도입.

## 주요 내용

### 1. 기능 요구사항 (REQ-FUNC)

| 기능 그룹 | REQ 범위 | 핵심 |
|---|---|---|
| F1 두 동선 교차 | FUNC-001~008 | 주소 입력 → Geocoding → 교통 API 병렬 호출 → 교집합 산출 |
| F2 배우자 공유 | FUNC-009~014 | UUID v4 링크, 30일 만료, 무료 미리보기 1곳, 회원가입 유도 모달 |
| F3 데드라인 모드 | FUNC-015~020 | 계약 역산 타임라인, 네이버 부동산 아웃링크 |
| F4 싱글 모드 | FUNC-021~024 | 학군 숨김, 야간 치안(A~D), window.print() |
| F5 간이 저장 | FUNC-025 | UPSERT 1건, best effort, Geocoding 재검증 |
| 인증 | FUNC-029 | Supabase Auth, 카카오/네이버 OAuth |

### 2. ERD (4개 엔터티)

- **[[user]]** — Supabase auth.users.id 참조, OAuth-only
- **[[diagnosis]]** — 진단 결과, mode(couple/single), deadline, score
- **[[share-link-entity]]** — UUID 공유 토큰, bcrypt 12 비밀번호(optional), 30일 만료
- **[[saved-search]]** — PK=user_id, UPSERT, searchParams(JSON)

### 3. Rev 1.1 ~ 1.6 단순화 변경 사항

| 변경 항목 | 구버전 | 신버전 | Rev |
|---|---|---|---|
| 결제 도메인 | Toss Payments, CMD-PAY 등 | **제거** (WTP 설문 대체) | 1.2 |
| DB-009 범죄 통계 캐시 | DB 테이블 | **정적 JSON 에셋** | 1.1 |
| DB-010 학교 배정 Seed | DB 테이블 | **정적 JSON 에셋** | 1.1 |
| 시나리오 비교 | FUNC-027, CMD-SAVE-003 | **제거** | 1.1 |
| 인증 | NextAuth.js v5 | **Supabase Auth** (PKCE OAuth) | 1.6 |
| 암호화 | AES-256 애플리케이션 레벨 | **TLS만** (CON-16) | 1.6 |
| replaySearch() | API-005 포함 | **제거** | 1.1 |
| bcrypt | 사용자 비밀번호 | **ShareLink 비밀번호 전용** (강도 12) | 1.6 |

> 상세: [[srs-v1.6-changes]]

### 4. 제약사항 (Constraints)

| ID | 내용 |
|---|---|
| CON-07 | 교통 API 카카오 1종만, 장애 시 에러 모달 |
| CON-16 | 전송 암호화 Supabase TLS |
| CON-18 | Supabase Auth (NextAuth 대체) |

### 5. 비기능 요구사항 핵심

- 교차 진단 응답 p95 ≤ 8초 (NF-001)
- 공유 페이지 HTML 스트리밍 ≤ 2초 (NF-003)
- PDF 저장(window.print) ≤ 1초 (NF-010)
- Rate Limiting: 인증 유저 60req/min, 비인증 20req/min (NF-022)

### 6. 시퀀스 다이어그램 (6건)

1. 교차 진단 상세 플로우 (Client 병렬 호출)
2. 배우자 공유 링크 플로우 (SSR + 회원가입 유도)
3. 데드라인 모드 플로우 (타임라인 + 아웃링크)
4. 싱글 모드 플로우 (치안 + window.print)
5. 간이 저장·불러오기 플로우 (UPSERT + Geocoding)
6. 인증 플로우 (Supabase Auth + OAuth)

### 7. 버전 이력

| Rev | 핵심 변경 |
|---|---|
| 1.1 | UseCase/ERD/Component/Class Diagram 추가 |
| 1.2 | Next.js App Router 단일 풀스택 + **결제 도메인 제거** |
| 1.3 | 상세 시퀀스 다이어그램 6건, Transport Adapter 폴백 |
| 1.4 | Client Component 병렬, window.print() 전환 |
| 1.5 | F5 간이 저장 축소, NFR 완화, ERD 단순화, **DB-009/DB-010 제거** |
| 1.6 | **Supabase Auth 전환**, AES-256 제거, WTP 설문 |

## 관련 Wiki 페이지

- Entities: [[user]], [[diagnosis]], [[share-link-entity]], [[saved-search]]
- Concepts: [[two-route-intersection]], [[share-link]], [[deadline-mode]], [[single-mode]], [[tech-stack]], [[srs-v1.6-changes]]
- Sources: [[src-prd]], [[src-implementation-plan]], [[src-task-list]]
- Domains: [[domain-foundation]], [[domain-diagnosis]], [[domain-sharelink]], [[domain-auth]]
