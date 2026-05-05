# Wiki Audit Report v2

> **점검일**: 2026-04-26 | **점검 대상**: 42개 페이지 | **Phase 1 — Self-Audit**

---

## 영역 1: 내용 깊이 (Depth Audit)

### 도메인 페이지 (entities/domain-*.md) 10개

| 페이지 | 개요 ≥1문단 | 비즈니스 컨텍스트 | 사용자 가치 | 태스크 표 | NFR 정확 | 양방향 의존성 | 판정 |
|---|---|---|---|---|---|---|---|
| domain-foundation | ✅ | ✅ | ❌ 부재 | ✅ 16개 | ✅ | ✅ | M |
| domain-infra | ✅ | ✅ | ❌ 부재 | ✅ 6개 | ✅ | ✅ | M |
| domain-auth | ✅ | ❌ 약함 | ❌ 부재 | ✅ 4개 | ✅ | ✅ | M |
| domain-diagnosis | ✅ | ❌ 약함 | ❌ 부재 | ✅ 9개 | ✅ | ✅ | M |
| domain-sharelink | ✅ | ✅ | ❌ 부재 | ✅ 5개 | ✅ | ✅ | M |
| domain-deadline | ✅ | ✅ | ❌ 부재 | ✅ 5개 | ⚠️ 부분 | ✅ | M |
| domain-single | ✅ | ❌ 약함 | ❌ 부재 | ✅ 3개 | ✅ | ✅ | M |
| domain-savedsearch | ✅ | ✅ | ❌ 부재 | ✅ 2개 | ✅ | ✅ | M |
| domain-ui | ✅ | ❌ 약함 | ❌ 부재 | ✅ 14개 | ✅ | ⚠️ 단방향 | M |
| domain-test | ✅ | ❌ 약함 | ❌ 부재 | ✅ 9개 | ⚠️ 구체ID 없음 | ⚠️ 단방향 | M |

### 약점 #1: 도메인 페이지 10개 — 사용자 가치 누락
- **문제**: 10개 도메인 페이지 모두 "어떤 페르소나에게 어떤 가치를 주는가" 명시 안 됨
- **보강 방향**: 각 도메인 페이지에 `## 사용자 가치` 섹션 추가 (페르소나 ↔ 도메인 매핑)
- **우선순위**: M

### 약점 #2: domain-deadline NFR — REQ-NF-001 수치 혼동
- **문제**: domain-deadline.md에서 `REQ-NF-001 | 타임라인 생성 ≤ 2초`로 기재했으나, REQ-NF-001은 "교차 진단 응답 p95 ≤ 8초"임. 타임라인 생성 NFR은 별도 ID
- **보강 방향**: REQ-NF-001 → 적절한 NFR로 수정하거나 "타임라인 생성 ≤ 2초 (암묵적 목표)" 표기
- **우선순위**: H

### concepts/ 신규 5개 페이지

| 페이지 | 점검 항목 | 판정 |
|---|---|---|
| srs-v1.6-changes | 6가지 변경 사항 모두 영향 도메인 cross-ref | ✅ (40개 link) |
| task-domains-overview | 10개 도메인 균등 | ✅ (73개 태스크 표) |
| domain-dependencies | 6가지 핵심 의존성 | ✅ (Mermaid 포함) |
| known-follow-ups | 15개 follow-up 영향 도메인 링크 | ✅ (30개 link) |
| architecture-patterns | 7가지 패턴 구체적 맥락 | ⚠️ 코드 예시 부재 |

### 약점 #3: architecture-patterns — 코드 예시 부재
- **문제**: 7가지 패턴에 동기·구현 설명은 있으나, 코드 스니펫/pseudo-code가 전무
- **보강 방향**: 핵심 패턴 3개(Promise.allSettled, DUMMY_HASH, splitForPreview)에 TypeScript pseudo-code 추가
- **우선순위**: M

### 분류 B 업데이트 10개 — 옛 정보 잔재 점검

| 페이지 | NextAuth | AES-256 | 결제/PG | DB-009/010 | replaySearch | 판정 |
|---|---|---|---|---|---|---|
| tech-stack | ✅ "제거 목록"으로만 | ✅ "제거 목록"으로만 | ✅ 정상 | — | — | ✅ |
| share-link | — | — | — | — | — | ✅ |
| single-mode | — | — | — | ✅ "대체"로만 | — | ✅ |
| saved-search | — | — | — | — | ✅ "제거"로만 | ✅ |
| diagnosis | — | — | — | — | — | ✅ |
| user | — | — | — | — | — | ✅ |
| share-link-entity | — | ✅ "제거"로만 | — | — | — | ✅ |
| src-srs | ✅ 변경 표 내 | ✅ 변경 표 내 | — | ✅ 변경 표 내 | ✅ 변경 표 내 | ✅ |
| src-task-list | — | — | — | — | — | ✅ |
| src-implementation-plan | — | — | — | — | — | ✅ |

> **결론**: 옛 정보 잔재 0건 (모두 "제거됨/대체됨" 맥락에서만 사용)

---

## 영역 2: Cross-Reference 균형 (Link Balance Audit)

### 도메인 페이지 wiki-link 수 (기준: ≥ 8)

| 페이지 | 현재 링크 | 목표 | 부족 수 | 추가 제안 |
|---|---|---|---|---|
| domain-test | 4 | ≥8 | -4 | `[[domain-diagnosis]]`, `[[domain-sharelink]]`, `[[domain-deadline]]`, `[[domain-single]]`, `[[domain-savedsearch]]`, `[[domain-auth]]`, `[[architecture-patterns]]` |
| domain-ui | 5 | ≥8 | -3 | `[[tech-stack]]`, `[[domain-auth]]`, `[[domain-diagnosis]]`, `[[domain-sharelink]]`, `[[domain-deadline]]`, `[[domain-single]]` |
| domain-savedsearch | 5 | ≥8 | -3 | `[[domain-diagnosis]]`, `[[domain-foundation]]`, `[[architecture-patterns]]`, `[[known-follow-ups]]` |
| domain-infra | 6 | ≥8 | -2 | `[[domain-auth]]`, `[[domain-diagnosis]]`, `[[architecture-patterns]]`, `[[known-follow-ups]]` |
| domain-auth | 6 | ≥8 | -2 | `[[tech-stack]]`, `[[domain-foundation]]`, `[[architecture-patterns]]`, `[[known-follow-ups]]` |
| domain-sharelink | 6 | ≥8 | -2 | `[[domain-diagnosis]]`, `[[domain-foundation]]`, `[[domain-dependencies]]` |
| domain-deadline | 6 | ≥8 | -2 | `[[domain-foundation]]`, `[[architecture-patterns]]`, `[[domain-dependencies]]` |
| domain-diagnosis | 6 | ≥8 | -2 | `[[domain-foundation]]`, `[[domain-dependencies]]`, `[[known-follow-ups]]` |
| domain-single | 7 | ≥8 | -1 | `[[domain-foundation]]`, `[[domain-dependencies]]` |
| domain-foundation | 9 | ≥8 | 0 | ✅ |

### concepts/ 신규 페이지 (기준: ≥ 10)

| 페이지 | 현재 | 목표 | 판정 |
|---|---|---|---|
| architecture-patterns | 19 | ≥10 | ✅ |
| srs-v1.6-changes | 40 | ≥10 | ✅ |
| task-domains-overview | 17 | ≥10 | ✅ |
| domain-dependencies | 15 | ≥10 | ✅ |
| known-follow-ups | 30 | ≥10 | ✅ |

---

## 영역 3: 정합성 (Consistency Audit)

| # | 항목 | 관련 페이지 | 일치 | 발견된 모순 |
|---|---|---|---|---|
| 1 | bcrypt 강도 12 | tech-stack, share-link, share-link-entity, domain-sharelink | ✅ 일치 | — |
| 2 | 응답 시간 p95 ≤ 8s | src-srs, domain-diagnosis, domain-foundation | ⚠️ **불일치** | two-route-intersection.md 본문(L39)에 **"p95 ≤ 3초"** 잔재 |
| 3 | Auth Supabase PKCE | tech-stack, user, domain-auth, src-srs | ✅ 일치 | — |
| 4 | 싱글 정적 JSON | single-mode, domain-single | ✅ 일치 | — |
| 5 | 결제 v1.2 제거 | tech-stack, share-link, srs-v1.6-changes, log | ✅ 일치 | — |
| 6 | 태스크 합계 73개 | task-domains-overview 73행, domain-* 합계 | ⚠️ **검증 필요** | task-domains-overview 본문 73행 OK, domain 합산도 73 OK |
| 7 | Wave 1~5 구조 | src-implementation-plan, task-domains-overview | ✅ 일치 | — |

### 약점 #4: two-route-intersection.md L39 — p95 ≤ 3초 (구 데이터)
- **문제**: 분류 C 확장 시 v1.6 확장 섹션(L82)에 "p95 ≤ 8초"를 추가했으나, 기존 본문(L39)의 "p95 ≤ 3초"를 수정하지 않아 **같은 페이지 내 NFR 모순** 발생
- **보강 방향**: L39를 "p95 ≤ 8초 (REQ-NF-001)"로 수정
- **우선순위**: H

---

## 영역 4: Use Case 보강 (Use Case Audit)

| 도메인 | 사용자 시나리오 | 페르소나 연결 | Trigger→Action→Outcome |
|---|---|---|---|
| domain-foundation | ❌ 없음 | ❌ | ❌ |
| domain-infra | ❌ 없음 | ❌ | ❌ |
| domain-auth | ❌ 없음 | ❌ | ❌ |
| domain-diagnosis | ❌ 없음 | ❌ | ❌ |
| domain-sharelink | ❌ 없음 | ❌ | ❌ |
| domain-deadline | ❌ 없음 | ❌ | ❌ |
| domain-single | ❌ 없음 | ❌ | ❌ |
| domain-savedsearch | ❌ 없음 | ❌ | ❌ |
| domain-ui | ❌ 없음 | ❌ | ❌ |
| domain-test | ❌ 없음 (테스트이므로 N/A) | — | — |

### 약점 #5: 도메인 페이지 — Use Case 전무
- **문제**: 10개 도메인 페이지에 사용자 시나리오/페르소나 연결이 전혀 없음
- **보강 방향**: 5개 핵심 도메인(diagnosis, sharelink, deadline, single, savedsearch)에 **사용자 가치 + 시나리오** 섹션 추가. 나머지 5개(foundation, infra, auth, ui, test)는 기술 도메인이므로 간략 추가
- **우선순위**: M

### 약점 #6: 페르소나 ↔ 도메인 매핑 페이지 부재
- **문제**: persona-spectrum.md에 12명 페르소나가 있으나, 각 페르소나가 어떤 도메인 Flow를 타는지 매핑이 없음
- **보강 방향**: `concepts/persona-domain-flows.md` 신규 페이지 생성 — 주요 페르소나 3명 × 도메인 흐름 매핑
- **우선순위**: M

---

## 영역 5: NFR 인용 정확성 (NFR Audit)

| 페이지 | NFR ID | 기재 내용 | SRS 원본 | 일치 |
|---|---|---|---|---|
| domain-diagnosis | NF-001 | p95 ≤ 8초 | p95 ≤ 8초 | ✅ |
| domain-diagnosis | NF-004 | 필터 p95 ≤ 1,000ms | 필터 p95 ≤ 1,000ms | ✅ |
| domain-sharelink | NF-003 | SSR p95 ≤ 2,000ms | SSR p95 ≤ 2,000ms | ✅ |
| domain-sharelink | NF-006 | 링크 생성 ≤ 500ms | 링크 생성 ≤ 500ms | ✅ |
| domain-sharelink | NF-020 | bcrypt 검증 | bcrypt 검증 | ✅ |
| domain-sharelink | NF-021 | 비인가 차단 | 비인가 차단 | ✅ |
| domain-deadline | NF-001 | **타임라인 생성 ≤ 2초** | **교차 진단 p95 ≤ 8초** | ❌ **불일치** |
| domain-deadline | NF-007 | 매물 조회 ≤ 1,500ms | 매물 조회 p95 ≤ 1,500ms | ✅ |
| domain-single | NF-010 | PDF 저장 ≤ 1초 | PDF 저장 ≤ 1초 | ✅ |
| domain-savedsearch | NF-016 | best effort | best effort | ✅ |
| domain-infra | NF-022 | Rate 60/20 req/min | Rate 60/20 req/min | ✅ |
| domain-ui | NF-003 | SSR ≤ 2,000ms | SSR ≤ 2,000ms | ✅ |
| domain-ui | NF-010 | PDF ≤ 1초 | PDF ≤ 1초 | ✅ |

### 약점 #7: domain-deadline.md — REQ-NF-001 오용
- **문제**: `REQ-NF-001 | 타임라인 생성 ≤ 2초`로 기재했으나, NF-001은 "교차 진단 응답 p95 ≤ 8초"
- **보강 방향**: "타임라인 생성 ≤ 2초"는 별도 성능 목표이므로 NF-001 ID 제거, "(구현 목표)" 표기로 변경
- **우선순위**: H (=약점 #2와 동일)

---

## 영역 6: 분류 A (1차 자료) 활용성 (Reference Page Audit)

| 페이지 | 활용 가이드 | 도메인 참조 안내 | cross-ref 자연스러움 | 판정 |
|---|---|---|---|---|
| persona-spectrum | ❌ 없음 | ❌ 없음 | ✅ | M |
| market-size | ❌ 없음 | ❌ 없음 | ✅ | L |
| src-jtbd | ❌ 없음 | ❌ 없음 | ✅ | M |
| src-cjm | ❌ 없음 | ❌ 없음 | ✅ | M |
| src-aos-dos | ❌ 없음 | ❌ 없음 | ✅ | M |
| src-competitor-analysis | ❌ 없음 | ❌ 없음 | ✅ | L |
| src-market-analysis | ❌ 없음 | ❌ 없음 | ✅ | L |
| src-persona | ❌ 없음 | ❌ 없음 | ✅ | M |
| src-prd | ❌ 없음 | ❌ 없음 | ✅ | M |
| src-problem-definition | ❌ 없음 | ❌ 없음 | ✅ | L |
| src-ksf | ❌ 없음 | ❌ 없음 | ✅ | L |
| src-value-proposition | ❌ 없음 | ❌ 없음 | ✅ | L |

### 약점 #8: 분류 A 12개 — 활용 가이드 부재
- **문제**: 12개 페이지 모두 상단에 "이 페이지의 활용법" 안내가 없음. 추가된 cross-ref는 자연스러우나, 에이전트/사용자가 언제 참조해야 하는지 불분명
- **보강 방향**: 각 분류 A 페이지의 `## 관련 도메인 (v1.6)` 섹션 상단에 1줄 활용 안내 추가
- **우선순위**: L

---

## 영역 7: 메타 페이지 (Meta Page Audit)

### _schema.md

| 점검 항목 | 판정 | 문제 |
|---|---|---|
| 도메인 페이지 표준 형식 | ❌ 미정의 | entities/domain-*.md 형식이 §2.4에 없음 |
| 신규 5종 페이지 형식 | ❌ 미정의 | srs-changes, follow-ups, patterns 등 형식 미추가 |
| 원본 매핑 표 | ⚠️ 구버전 | `src-porters-forces`, `src-value-chain` 아직 ⚠️ 표시 (폐기됐으나 삭제 안 됨) |

### 약점 #9: _schema.md — 도메인 페이지 형식 미정의
- **문제**: `_schema.md §2.4`에 Entity 페이지 형식만 있고, 도메인 페이지(domain-*.md) 표준 형식이 없음
- **보강 방향**: `§2.6 도메인 페이지 형식` 추가 — 도메인 개요, 비즈니스 컨텍스트, 사용자 가치, 포함 태스크, NFR, 의존성 관계, 관련 페이지 순서 정의
- **우선순위**: M

### 약점 #10: _schema.md — 원본 매핑 표에 폐기 파일 잔재
- **문제**: `src-porters-forces.md`, `src-value-chain.md` 항목이 ⚠️ 표시로 남아있으나, 이미 폐기·삭제됨
- **보강 방향**: 해당 2행 제거 또는 ~~취소선~~ 처리
- **우선순위**: H

### overview.md

| 점검 항목 | 판정 | 문제 |
|---|---|---|
| 최신 wiki 구조 안내 | ❌ 부재 | 42개 페이지 구조 안내 없음, updated: 2026-04-23 |
| 활용 시나리오 | ❌ 부재 | 없음 |
| 도메인 페이지 안내 | ❌ 부재 | 없음 |

### 약점 #11: overview.md — 미갱신 (2026-04-23 상태)
- **문제**: updated 날짜가 4/23이며, 신규 도메인 페이지/concepts 5개 안내가 없음. wiki 활용 시나리오도 부재
- **보강 방향**: `## Wiki 구조 안내` + `## 활용 시나리오` 섹션 추가, updated 갱신
- **우선순위**: M

### index.md / log.md

| 점검 항목 | 판정 |
|---|---|
| 42개 전체 카탈로그 | ✅ |
| 카테고리 분류 정확 | ✅ |
| 신규 표시 (🆕) | ✅ |
| log 갱신 로그 | ✅ |
| log 삭제 아카이브 | ✅ |
| log 분류 A/B/C 통계 | ✅ |

---

## 종합 우선순위

| 우선순위 | 개수 | 약점 번호 | 요약 |
|---|---|---|---|
| **H (필수)** | 2 | #4, #10 | NFR p95 모순(two-route L39), _schema 폐기 파일 잔재 |
| **M (권장)** | 7 | #1, #2/#7, #3, #5, #6, #9, #11 | 사용자 가치 누락, NFR ID 오용, 코드 예시, Use Case, 페르소나 매핑, schema 형식, overview |
| **L (가능 시)** | 1 | #8 | 분류 A 활용 가이드 |
