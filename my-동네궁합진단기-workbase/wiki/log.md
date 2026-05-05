---
title: "Wiki 이력 로그"
category: meta
created: 2026-04-23
updated: 2026-04-26
---

# Wiki 이력 로그 (Log)

> 시간순 기록. 각 항목은 `## [날짜] 작업유형 | 설명` 형식.

---

## [2026-04-26] strengthen | 자기 점검 및 보강 (v2 → v2.1)

### 3-Phase Self-Audit 결과

- **Phase 1**: 7개 영역 점검, 11개 약점 발견 (H:2, M:7, L:1)
- **Phase 2**: 전 약점 보강 완료
- **Phase 3**: 재검증 통과

### 우선순위 H 처리 (2건)

| 약점 | 수정 내용 |
|---|---|
| two-route-intersection.md NFR p95 모순 | L39 "≤ 3초" → "≤ 8초 (REQ-NF-001)" 정정 |
| _schema.md 폐기 파일 잔재 | src-porters-forces, src-value-chain 행 제거 + §2.6 도메인 페이지 형식 추가 |

### 우선순위 M 처리 (7건)

| 약점 | 수정 내용 |
|---|---|
| domain-* 사용자 가치 누락 | 10개 도메인 페이지에 `## 사용자 가치` 섹션 추가 |
| domain-deadline NFR-001 오용 | "(구현 목표)" 표기로 변경 |
| architecture-patterns 코드 예시 부재 | Promise.allSettled, DUMMY_HASH, splitForPreview 3개에 TS pseudo-code 추가 |
| 도메인 페이지 Use Case 전무 | 사용자 가치 섹션에 시나리오 포함 |
| 페르소나↔도메인 매핑 부재 | `concepts/persona-domain-flows.md` 신규 생성 |
| _schema §2.6 도메인 형식 미정의 | 도메인 페이지 표준 형식 추가 |
| overview.md 미갱신 | Wiki 구조 안내 + 활용 시나리오 6가지 추가 |

### 통계

| 지표 | 보강 전 | 보강 후 | 변화 |
|---|---|---|---|
| 총 페이지 수 | 42 | 43 | +1 (persona-domain-flows) |
| 총 wiki-link | 511 | 664 | +153 |
| 도메인 페이지 최소 링크 | 4 | 11 | +7 |
| 정합성 모순 | 1건 | 0건 | ✅ |
| NFR 인용 오류 | 1건 | 0건 | ✅ |

### 신규 페이지

- `concepts/persona-domain-flows.md` — 핵심 페르소나 3명 × 도메인 흐름 매핑

---

## [2026-04-26] update | 살아있는 거울 모드 — SRS v1.6 / TASK_LIST v1.3 반영 Wiki 갱신

### 작업 내용

Wiki를 "고정된 기록물"이 아닌 "최신 진실의 거울"로 갱신. 기존 페이지를 3단계로 분류 처리:

- **분류 A (보존)**: 12개 1차 자료 페이지 — 본문 수정 금지, `## 관련 도메인 (v1.6)` cross-reference만 추가
- **분류 B (업데이트)**: 10개 구버전 정보 페이지 — 신버전으로 본문 갱신 + 변경 이력 섹션 추가
- **분류 C (확장)**: 2개 페이지 — 본문 유지 + `## v1.6 확장 정보` 섹션 추가
- **신규 생성**: 15개 페이지 (concepts/ 5개, entities/ 10개)

### 분류 A 보존 (12개 — 본문 미수정, cross-reference만 추가)

| 페이지 | 추가된 cross-reference |
|---|---|
| entities/persona-spectrum.md | `[[domain-ui]]`, `[[domain-diagnosis]]` |
| concepts/market-size.md | `[[domain-foundation]]` |
| sources/src-jtbd.md | `[[domain-diagnosis]]`, `[[domain-sharelink]]` |
| sources/src-cjm.md | `[[domain-ui]]`, `[[domain-diagnosis]]` |
| sources/src-aos-dos.md | `[[domain-diagnosis]]`, `[[domain-deadline]]`, `[[domain-sharelink]]` |
| sources/src-competitor-analysis.md | `[[domain-foundation]]` |
| sources/src-market-analysis.md | `[[domain-foundation]]`, `[[domain-deadline]]` |
| sources/src-persona.md | `[[domain-ui]]`, `[[domain-single]]` |
| sources/src-prd.md | `[[domain-auth]]`, `[[domain-ui]]`, `[[domain-diagnosis]]` |
| sources/src-problem-definition.md | `[[domain-diagnosis]]` |
| sources/src-ksf.md | `[[domain-sharelink]]`, `[[domain-diagnosis]]` |
| sources/src-value-proposition.md | `[[domain-diagnosis]]`, `[[domain-sharelink]]` |

### 분류 B 업데이트 (10개 — 본문 갱신)

| 페이지 | 제거된 옛 정보 | 추가된 새 정보 |
|---|---|---|
| concepts/tech-stack.md | NextAuth.js, AES-256, Payment 도메인 | Supabase Auth(PKCE), bcrypt 12 ShareLink전용, react-kakao-maps-sdk, zod, MSW, Playwright |
| concepts/share-link.md | 결제 단계 ≤3, 유료 전환 흐름 | splitForPreview, 회원가입 유도 모달(UI-008), DUMMY_HASH |
| concepts/single-mode.md | DB-009 범죄통계 캐시, DB-010 학교배정 Seed | 정적 JSON 에셋, 야간 A~D, 수도권 90% CI검증, window.print() |
| entities/saved-search.md | 재계산, 비교뷰, 시나리오비교 | Rev 1.1 단순화(폼채우기만), best effort UPSERT, Sentry기록만 |
| entities/diagnosis.md | 시나리오비교 필드, 결제 필드 | DB-003 score컬럼, 14개태스크, AI스코어링, Promise.allSettled |
| entities/user.md | password, bcrypt hash | OAuth-only, provider(kakao/naver), 게스트모드(sessionStorage) |
| entities/share-link-entity.md | AES-256 필드, 결제 메타데이터 | uuid(UUID v4), bcrypt 12 optional, splitForPreview |
| sources/src-srs.md | 구버전 참조 | v1.6 명시, Rev 1.1~1.6 변경사항 표, srs-v1.6-changes 링크 |
| sources/src-task-list.md | 구버전 Wave 구조 | v1.3 명시, 73개 도메인별 분류표, task-domains-overview 링크 |
| sources/src-implementation-plan.md | 구 Phase 구조 | Wave 1~5 명시(Foundation 8, 도메인 28, Test 9, UI 14) |

### 분류 C 확장 (2개 — 본문 유지 + 섹션 추가)

| 페이지 | 추가된 섹션 |
|---|---|
| concepts/deadline-mode.md | `## v1.6 확장 정보`: 타임라인 ≥5단계, D+7 차단, 네이버 아웃링크, 0건 완화 제안 ≥3개 |
| concepts/two-route-intersection.md | `## v1.6 확장 정보`: Promise.allSettled, 5초+1회재시도, p95 ≤8초 |

### 신규 생성 (15개)

**concepts/ (5개)**

| 페이지 | 제목 |
|---|---|
| concepts/srs-v1.6-changes.md | SRS v1.6 변경 사항 |
| concepts/task-domains-overview.md | 태스크 도메인 개요 (73개 인덱스) |
| concepts/domain-dependencies.md | 도메인 간 의존성 |
| concepts/known-follow-ups.md | 정합성 빚 15개 |
| concepts/architecture-patterns.md | 아키텍처 패턴 7가지 |

**entities/ (10개)**

| 페이지 | 제목 |
|---|---|
| entities/domain-foundation.md | Foundation 도메인 (16개 태스크) |
| entities/domain-infra.md | Infra 도메인 (6개 태스크) |
| entities/domain-auth.md | Auth 도메인 (4개 태스크) |
| entities/domain-diagnosis.md | Diagnosis 도메인 (9개 태스크) |
| entities/domain-sharelink.md | ShareLink 도메인 (5개 태스크) |
| entities/domain-deadline.md | Deadline 도메인 (5개 태스크) |
| entities/domain-single.md | Single 도메인 (3개 태스크) |
| entities/domain-savedsearch.md | SavedSearch 도메인 (2개 태스크) |
| entities/domain-ui.md | UI 도메인 (14개 태스크) |
| entities/domain-test.md | Test 도메인 (9개 태스크) |

### 삭제된 정보 아카이브

다음 정보는 구버전(SRS v1.5 이전)에서 사실이었으나 v1.6에서 제거됨:

| 항목 | 구버전 내용 | 제거 사유 |
|---|---|---|
| NextAuth.js v5 | 인증 프레임워크 | → Supabase Auth (PKCE OAuth) |
| AES-256 애플리케이션 레벨 암호화 | PII 암호화 | → TLS만 사용 (CON-16) |
| 결제 도메인 (Payment) | Toss Payments SDK | → WTP 설문 대체 (MVP 제외) |
| DB-005 PAYMENT 테이블 | 결제 스키마 | → 제거 |
| DB-009 범죄 통계 캐시 | DB 테이블 | → 정적 JSON 에셋 |
| DB-010 학교 배정 Seed | DB 테이블 | → 정적 JSON 에셋 |
| bcrypt 사용자 비밀번호 | USER 모델 비밀번호 해싱 | → OAuth-only |
| 시나리오 비교 (FUNC-027) | 검색 조건 비교 뷰 | → v1 이후 연기 |
| replaySearch() | 검색 재실행 | → 제거 |
| CSRF 토큰 검증 | NextAuth 보안 | → Supabase Auth 기본 보안 |

---

## [2026-04-23] cleanup | Porter's 5 Forces, Value Chain 원본 폐기 처리

Porter's 5 Forces(`1_porters-foreces.md`), Value Chain(`3_value-chain.md`) 원본 미완성 파일을 폐기 처리함. 해당 분석 내용은 Problem Definition / KSF 문서에 각각 통합됨을 확인.

### 수행 내용

1. **Wiki 페이지 삭제**: `src-porters-forces.md`, `src-value-chain.md` 제거
2. **카탈로그 정리**: `index.md`에서 미완성 섹션 및 해당 항목 제거, Sources 15→13개
3. **통합 안내 추가**: Porter's 분석 → `src-problem-definition.md`, Value Chain → `src-ksf.md`에 통합 블록 추가
4. **원본 아카이브**: `raw/_archive/`로 이동 (DEPRECATED 접미사)

### 영향 받은 파일

- ❌ 삭제: `wiki/sources/src-porters-forces.md`, `wiki/sources/src-value-chain.md`
- ✏️ 수정: `wiki/index.md`, `wiki/sources/src-problem-definition.md`, `wiki/sources/src-ksf.md`, `wiki/log.md`
- 📦 아카이브: `raw/_archive/1_porters-foreces_DEPRECATED.md`, `raw/_archive/3_value-chain_DEPRECATED.md`

---

## [2026-04-23] ingest | 초기 지식베이스 구축 (Batch Ingest — 15개 원본 문서)

### 작업 내용

`raw/assets/` 디렉토리의 15개 원본 문서를 분석하여 Wiki 지식베이스의 초기 구조를 구축했습니다.

### 생성된 파일 목록

**Schema & Meta (3개)**
- `_schema.md` — Wiki 운영 규칙
- `index.md` — 콘텐츠 카탈로그
- `overview.md` — 프로젝트 전체 개요

**Sources (15개)**
- `sources/src-prd.md` ← `00_PRD_v1.1-rev.4.md`
- `sources/src-srs.md` ← `05_SRS_v1.6.md`
- `sources/src-task-list.md` ← `06_TASK_LIST_v1.3.md`
- `sources/src-implementation-plan.md` ← `plan_srs_stack_alignment_implementation_v1.2.md`
- `sources/src-value-proposition.md` ← `06_value-proposition-sheet_V2_(Rooted).md`
- `sources/src-jtbd.md` ← `10_jtbd-interview-report.md`
- `sources/src-market-analysis.md` ← `6_TAM-SAM-SOM+MarketSegment.md`
- `sources/src-persona.md` ← `7_persona-spectrum-map.md`
- `sources/src-cjm.md` ← `8_customer-journey-map.md`
- `sources/src-aos-dos.md` ← `9_aos-dos-analysis.md`
- `sources/src-problem-definition.md` ← `5_problem-definition.md`
- `sources/src-competitor-analysis.md` ← `2_competents-analysis.md`
- `sources/src-ksf.md` ← `4_ksf-report.md`
- `sources/src-porters-forces.md` ← `1_porters-foreces.md` ⚠️ 원본 미완성
- `sources/src-value-chain.md` ← `3_value-chain.md` ⚠️ 원본 미완성

**Entities (5개)**
- `entities/user.md` — User 엔터티
- `entities/diagnosis.md` — Diagnosis 엔터티
- `entities/share-link-entity.md` — ShareLink 엔터티
- `entities/saved-search.md` — SavedSearch 엔터티
- `entities/persona-spectrum.md` — 12명 페르소나

**Concepts (6개)**
- `concepts/two-route-intersection.md` — F1 두 동선 교차 진단
- `concepts/share-link.md` — F2 배우자 공유 링크
- `concepts/deadline-mode.md` — F3 데드라인 모드
- `concepts/single-mode.md` — F4 싱글 모드
- `concepts/tech-stack.md` — 기술 스택
- `concepts/market-size.md` — 시장 규모

### 발견된 이슈

1. `1_porters-foreces.md` — 원본에 문제정의서 초안이 잘못 덮어씌워져 있음. → ✅ 폐기 처리 (2026-04-23)
2. `3_value-chain.md` — 원본에 KSF 내용이 잘못 기입됨. → ✅ 폐기 처리 (2026-04-23)

### 다음 단계 (추천)

- [x] ~~Porter's Five Forces 원본 재작성 후 재ingest~~ → 폐기, `src-problem-definition.md`에 통합
- [x] ~~가치 사슬 분석 원본 재작성 후 재ingest~~ → 폐기, `src-ksf.md`에 통합
- [x] ~~Lint 패스 실행~~ → 2026-04-26 갱신에서 교차 참조 보강
- [ ] F5 간이 저장 concept 페이지 추가 (`saved-search-concept.md`)
