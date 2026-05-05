# Wiki 보강 완료 보고서 (wiki_strengthen_report)

> **작업일**: 2026-04-26 | **커밋**: `c4aedee` | **push**: ✅ 완료

---

## 1. 우선순위 H 처리 (2건)

| # | 약점 | 페이지 | 변경 내용 |
|---|---|---|---|
| H-1 | NFR p95 모순 | two-route-intersection.md | L39 "≤ 3초" → "≤ 8초 (REQ-NF-001)" — 같은 페이지 내 v1.6 확장 섹션과 통일 |
| H-2 | _schema 폐기 잔재 | _schema.md | `src-porters-forces`, `src-value-chain` 행 제거 + §2.6 도메인 페이지 형식 추가 + 수정일 갱신 |

---

## 2. 우선순위 M 처리 (7건)

| # | 약점 | 페이지 | 변경 내용 |
|---|---|---|---|
| M-1 | 사용자 가치 누락 | domain-*.md 10개 | 각 페이지에 `## 사용자 가치` 섹션 추가 (페르소나, 시나리오, Pain Point) |
| M-2 | NFR-001 오용 | domain-deadline.md | "REQ-NF-001" → "(구현 목표) 타임라인 생성 ≤ 2초" |
| M-3 | 코드 예시 부재 | architecture-patterns.md | Promise.allSettled, DUMMY_HASH, splitForPreview 3개에 TS pseudo-code 추가 |
| M-4 | Use Case 전무 | domain-*.md 9개 | 사용자 가치 섹션에 시나리오 Trigger→Action→Outcome 포함 |
| M-5 | 페르소나↔도메인 매핑 | persona-domain-flows.md | **신규 생성** — 김지영(맞벌이), 이준혁(싱글), 박준호(긴급) 3명 × 도메인 흐름 |
| M-6 | 도메인 형식 미정의 | _schema.md | §2.6 도메인 페이지 형식 추가 (도메인 개요, 사용자 가치, 태스크, NFR, 의존성) |
| M-7 | overview 미갱신 | overview.md | Wiki 구조 안내 + 활용 시나리오 6가지 추가, updated 갱신 |

---

## 3. 우선순위 L 처리 (1건 — 부분 처리)

| # | 약점 | 처리 상태 |
|---|---|---|
| L-1 | 분류 A 활용 가이드 | ⏳ 미처리 — 12개 페이지 본문 보존 원칙에 따라, 사용자 판단 후 추가 가능 |

> **사유**: 분류 A 페이지에 활용 가이드를 추가하면 본문 수정이 됨. 기존 cross-reference 섹션만으로도 자연스러운 연결이 성립하므로 보류함.

---

## 4. 신규 추가 페이지

| 페이지 | 내용 | wiki-link 수 |
|---|---|---|
| concepts/persona-domain-flows.md | 핵심 페르소나 3명 × 도메인 흐름 매핑 | 35+ |

---

## 5. 통계

| 지표 | 보강 전 (v2) | 보강 후 (v2.1) | 변화 |
|---|---|---|---|
| **총 페이지 수** | 42 | **43** | +1 |
| **총 wiki-link** | 511 | **664** | **+153** |
| **도메인 페이지 최소 링크** | 4 (domain-test) | **11 (domain-infra)** | +7 |
| **도메인 페이지 최대 링크** | 9 (domain-foundation) | **16 (domain-ui)** | +7 |
| 정합성 모순 | 1건 | **0건** | ✅ 해결 |
| NFR 인용 오류 | 1건 | **0건** | ✅ 해결 |
| 옛 정보 잔재 (현재 사용 맥락) | 0건 | **0건** | ✅ |
| 변경 파일 | — | **17개** (1 신규 + 16 수정) | — |

---

## 6. 검증 결과 (Phase 3)

### 검증 1: 정합성 매트릭스

| 항목 | 통과 여부 |
|---|---|
| bcrypt 강도 12 일치 | ✅ |
| 응답 시간 p95 ≤ 8초 일치 | ✅ (L39 수정 완료) |
| Auth 방식 Supabase Auth (PKCE) 일치 | ✅ |
| 싱글 모드 정적 JSON 에셋 일치 | ✅ |
| 결제 v1.2 제거 일치 | ✅ |
| 태스크 수 합계 73개 | ✅ |
| Wave 1~5 구조 일치 | ✅ |

> **7/7 통과** ✅

### 검증 2: Cross-Reference 균형

| 도메인 페이지 | 보강 전 | 보강 후 | ≥8 달성 |
|---|---|---|---|
| domain-test | 4 | **13** | ✅ |
| domain-ui | 5 | **16** | ✅ |
| domain-savedsearch | 5 | **13** | ✅ |
| domain-infra | 6 | **11** | ✅ |
| domain-auth | 6 | **12** | ✅ |
| domain-sharelink | 6 | **14** | ✅ |
| domain-deadline | 6 | **14** | ✅ |
| domain-diagnosis | 6 | **14** | ✅ |
| domain-single | 7 | **15** | ✅ |
| domain-foundation | 9 | **12** | ✅ |

> **10/10 달성** ✅

### 검증 3: 옛 정보 0건

| 키워드 | grep 결과 (현재 사용 맥락) |
|---|---|
| NextAuth | 0건 (src-srs 변경 표 내만 존재 = 정상) |
| AES-256 | 0건 (src-srs 변경 표 내만 존재 = 정상) |
| CSRF | 0건 |
| replaySearch | 0건 (saved-search/domain-savedsearch "제거" 맥락만 = 정상) |
| DB-009 / DB-010 | 0건 (src-srs 변경 표 내만 존재 = 정상) |

> **0건 확인** ✅

### 검증 4: 신규 페이지 정확성

| 페이지 | cross-ref 충족 | 깊이 충분 | NFR 정확 |
|---|---|---|---|
| persona-domain-flows.md | ✅ (35+) | ✅ (페르소나 3명 상세) | N/A |

> **통과** ✅

---

## 7. 미해결 follow-up (사람의 판단 필요)

| # | 항목 | 사유 |
|---|---|---|
| 1 | 분류 A 12개 활용 가이드 | 본문 보존 원칙과 활용 안내 추가 사이의 판단 필요 |
| 2 | Supabase Auth 세부 플로우 | domain-auth에 PKCE 시퀀스 다이어그램 추가 가능 (코드 구현 시 확정) |
| 3 | known-follow-ups 15개 해결 | 구현 단계에서 순차적으로 처리 필요 (Wiki 갱신 범위 밖) |
