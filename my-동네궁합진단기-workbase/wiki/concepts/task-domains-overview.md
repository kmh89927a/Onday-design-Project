---
title: "태스크 도메인 개요"
category: concepts
tags: [기술, mvp]
sources: [src-task-list]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# 태스크 도메인 개요 (Task Domains Overview)

## 정의

73개 개발 태스크를 10개 도메인별로 분류한 마스터 인덱스. 각 도메인의 태스크 구성, Wave 배치, 복잡도 분포를 한 페이지에서 조망.

## 도메인별 인덱스

### 1. Foundation (16개) — [[domain-foundation]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| DB-001 | Prisma 프로젝트 초기화 | L |
| DB-002 | USER 테이블 스키마 | L |
| DB-003 | DIAGNOSIS 테이블 스키마 | M |
| DB-004 | SHARE_LINK 테이블 스키마 | L |
| DB-006 | SAVED_SEARCH 테이블 스키마 | L |
| DB-007 | Supabase Auth 연동 USER 정렬 | L |
| API-001 | Auth 도메인 DTO | M |
| API-002 | Diagnosis 도메인 DTO | M |
| API-003 | ShareLink 도메인 DTO | M |
| API-005 | SavedSearch 도메인 DTO | L |
| API-006 | 공통 에러 코드 체계 | M |
| API-007 | 카카오 모빌리티 API 인터페이스 | L |
| MOCK-001 | 진단 결과 Mock 데이터 | L |
| MOCK-002 | 공유 링크 Mock 데이터 | L |
| MOCK-004 | 카카오 API Mock 응답 | L |
| MOCK-005 | OAuth 소셜 로그인 Mock | L |

### 2. Infra (4개) — [[domain-infra]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| INFRA-001 | Next.js 프로젝트 초기화 + Vercel 배포 | M |
| INFRA-002 | Supabase PostgreSQL DB 프로비저닝 | L |
| INFRA-004 | Tailwind + shadcn/ui 디자인 시스템 | L |
| INFRA-005 | Vercel AI SDK + Gemini 연동 | M |

### 3. Auth (4개) — [[domain-auth]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| CMD-AUTH-001 | 카카오 OAuth Provider | H |
| CMD-AUTH-002 | 네이버 OAuth Provider | M |
| CMD-AUTH-003 | 세션 전략 (@supabase/ssr) | M |
| CMD-AUTH-004 | 게스트 임시 체험 모드 | L |

### 4. Diagnosis (9개) — [[domain-diagnosis]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| CMD-DIAG-001 | 클라이언트 주소 Geocoding | M |
| CMD-DIAG-002 | 교집합 후보 동네 산출 | H |
| CMD-DIAG-003 | 스코어링 엔진 | H |
| CMD-DIAG-004 | 진단 결과 서버 저장 | M |
| CMD-DIAG-005 | 조건 필터 실시간 적용 | M |
| CMD-DIAG-006 | 교통 API 타임아웃 핸들링 | M |
| CMD-DIAG-007 | 수도권 커버리지 검증 | L |
| QRY-DIAG-001 | 진단 결과 조회 | L |
| QRY-DIAG-002 | 출퇴근 시간 조회 | M |

### 5. ShareLink (5개) — [[domain-sharelink]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| CMD-SHARE-001 | 공유 링크 생성 | M |
| CMD-SHARE-002 | viewCount 증가 | L |
| CMD-SHARE-003 | 만료 링크 안내 | M |
| CMD-SHARE-004 | 비밀번호 검증 (bcrypt) | L |
| QRY-SHARE-001 | SSR 공유 리포트 열람 | H |

### 6. Deadline (5개) — [[domain-deadline]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| CMD-DL-001 | 데드라인 모드 활성화 + 타임라인 | H |
| CMD-DL-002 | 네이버 부동산 아웃링크 URL | L |
| CMD-DL-003 | 매물 0건 시 조건 완화 + 알림 | M |
| QRY-DL-001 | 교집합 매물 조회 | M |
| QRY-DL-002 | 30분 요약 카드 | M |

### 7. Single (3개) — [[domain-single]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| CMD-SINGLE-001 | 싱글 모드 진단 | M |
| QRY-SINGLE-001 | 야간 안전 등급 조회 | M |
| CMD-SINGLE-002 | 리포트 저장 (window.print) | L |

### 8. SavedSearch (2개) — [[domain-savedsearch]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| CMD-SAVE-001 | 입력값 자동 저장 (UPSERT) | M |
| QRY-SAVE-001 | 저장된 조건 불러오기 | L |

### 9. UI (14개) — [[domain-ui]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| UI-001 | 소셜 로그인 페이지 | L |
| UI-002 | 주소 입력 화면 | M |
| UI-003 | 진단 결과 지도 시각화 | H |
| UI-004 | 후보 동네 상세 정보 패널 | M |
| UI-005 | 조건 필터 UI | M |
| UI-006 | 공유 링크 생성 버튼 | L |
| UI-007 | SSR 공유 리포트 페이지 | H |
| UI-008 | 회원가입 유도 모달 | M |
| UI-009 | 데드라인 입력 화면 | M |
| UI-010 | 급매 매물 리스트 + 지도 | M |
| UI-011 | 30분 요약 카드 | L |
| UI-012 | 싱글 모드 진단 화면 | M |
| UI-013 | 야간 안전 등급 + 리포트 저장 | L |
| UI-014 | 이전 조건 불러오기 | L |

### 10. Test (9개) — [[domain-test]]

| Task ID | 기능명 | 복잡도 |
|---|---|---|
| TEST-001 | 교차 진단 GWT 시나리오 | H |
| TEST-002 | 교통 API 타임아웃 | M |
| TEST-003 | 공유 링크 GWT 시나리오 | H |
| TEST-004 | 공유 링크 보안 | M |
| TEST-005 | 데드라인 모드 GWT | M |
| TEST-006 | 싱글 모드 GWT | M |
| TEST-007 | 간이 저장 시나리오 | L |
| TEST-008 | OAuth 로그인 GWT | M |
| TEST-010 | E2E 통합 시나리오 | H |

### 11. Security + Monitoring (2개)

| Task ID | 기능명 | 복잡도 | 도메인 |
|---|---|---|---|
| SEC-002 | Rate Limiting | M | [[domain-infra]] |
| MON-001 | Sentry 기본 통합 | M | [[domain-infra]] |

## 복잡도 분포

| 복잡도 | 개수 | 비율 |
|---|---|---|
| H (High) | 10 | 13.7% |
| M (Medium) | 36 | 49.3% |
| L (Low) | 27 | 37.0% |
| **합계** | **73** | 100% |

## 관련 페이지

- Sources: [[src-task-list]], [[src-srs]], [[src-implementation-plan]]
- Concepts: [[srs-v1.6-changes]], [[domain-dependencies]]
