# Wiki Schema — 동네궁합진단기 지식베이스

> **역할:** 이 파일은 LLM 에이전트가 Wiki를 읽고, 쓰고, 유지보수할 때 따라야 할 규칙을 정의합니다.
> **마지막 수정:** 2026-04-26 (v1.6 갱신 — 도메인 페이지 형식 추가, 폐기 매핑 제거)

---

## 1. 디렉토리 구조

```
wiki/
├── _schema.md          # 이 파일 — Wiki 운영 규칙
├── index.md            # 콘텐츠 카탈로그 (카테고리별 전체 페이지 목록)
├── log.md              # 시간순 이력 (Ingest/Query/Lint 기록)
├── overview.md         # 프로젝트 전체 개요 — 한 페이지 요약
│
├── sources/            # 원본 문서 요약 페이지 (1 source = 1 page)
│   ├── src-prd.md
│   ├── src-srs.md
│   └── ...
│
├── entities/           # 핵심 도메인 엔터티 페이지
│   ├── user.md
│   ├── diagnosis.md
│   └── ...
│
└── concepts/           # 비즈니스·기술 개념 페이지
    ├── two-route-intersection.md
    ├── deadline-mode.md
    └── ...
```

## 2. 페이지 규칙

### 2.1 Frontmatter (YAML)

모든 Wiki 페이지는 아래 형식의 YAML frontmatter로 시작합니다:

```yaml
---
title: "페이지 제목"
category: sources | entities | concepts | meta
tags: [태그1, 태그2]
sources: [src-prd, src-srs]       # 이 페이지의 근거가 되는 source 페이지들
created: 2026-04-23
updated: 2026-04-23
status: active | draft | deprecated
---
```

### 2.2 내부 링크

- Wiki 내부 링크는 `[[파일명]]` 형식을 사용합니다 (Obsidian 호환).
- 예: `[[src-prd]]`, `[[diagnosis]]`, `[[two-route-intersection]]`
- 링크 텍스트를 다르게 표시: `[[src-prd|PRD v0.1-rev.4]]`

### 2.3 Source 페이지 형식

```markdown
## 문서 정보
| 항목 | 값 |
|---|---|
| 원본 파일 | `raw/assets/파일명.md` |
| 버전 | v1.6 |
| 작성일 | 2026-04-18 |

## 핵심 요약
(3~5문장)

## 주요 내용
(구조화된 요약)

## 관련 Wiki 페이지
- [[entity-page]]
- [[concept-page]]
```

### 2.4 Entity 페이지 형식

```markdown
## 정의
(1~2문장 정의)

## 속성
(데이터 모델, 필드 목록)

## 동작 / 비즈니스 규칙
(이 엔터티에 적용되는 규칙)

## 관련 페이지
- Sources: [[src-srs]]
- Concepts: [[concept-page]]
- Entities: [[other-entity]]
```

### 2.5 Concept 페이지 형식

> 아래는 기능·비즈니스 개념 페이지의 표준 형식입니다.

```markdown
## 정의
(1~2문장)

## 상세
(개념의 상세 설명, 로직, 알고리즘)

## 근거
(왜 이 개념이 필요한지 — 데이터/연구 기반)

## MVP 구현 상태
- ✅ 포함 / ❌ 제외 / ➖ 연기

## 관련 페이지
```

### 2.6 도메인 페이지 형식 (domain-*.md)

> entities/domain-*.md는 TASK_LIST v1.3의 도메인 단위 인덱스 페이지입니다.

```markdown
## 도메인 개요
(2~3문장: 이 도메인의 역할, 핵심 기능, 왜 필요한지)

## 사용자 가치
- 페르소나: [[persona-spectrum]] 중 누구?
- 핵심 시나리오: Trigger → Action → Outcome

## 포함 태스크 (N개)
| Task ID | 1줄 요약 |
|---|---|
| ... | ... |

## 핵심 NFR
| NFR ID | 내용 |
|---|---|

## 의존성 관계
- **의존**: ...
- **피의존**: ...

## 관련 페이지
- Entities: [[...]]
- Sources: [[...]]
- Concepts: [[...]]
```

---

## 3. 운영 워크플로우

### 3.1 Ingest (수집)

1. `raw/assets/`에 새 문서가 추가되면:
2. 문서를 읽고 `sources/src-{이름}.md` 요약 페이지 생성
3. 기존 entity/concept 페이지 중 영향받는 페이지 업데이트
4. 필요하면 새 entity/concept 페이지 생성
5. `index.md` 업데이트
6. `log.md`에 Ingest 기록 추가

### 3.2 Query (질의)

1. 질문을 받으면 `index.md`에서 관련 페이지 검색
2. 관련 페이지를 읽고 답변 합성
3. 유용한 답변은 새 concept 페이지로 저장 가능

### 3.3 Lint (점검)

1. 페이지 간 모순 검사
2. 고아 페이지 (인바운드 링크 없음) 식별
3. 누락된 교차 참조 추가
4. 오래된 정보 갱신 필요 표시

## 4. 태그 체계

| 태그 | 용도 |
|---|---|
| `#mvp` | MVP 범위 내 항목 |
| `#v1-이후` | MVP 이후 로드맵 항목 |
| `#비즈니스` | 비즈니스/기획 관련 |
| `#기술` | 기술 아키텍처/구현 관련 |
| `#사용자` | 사용자 연구/페르소나 관련 |
| `#시장` | 시장 분석/경쟁사 관련 |
| `#데이터` | 데이터 모델/외부 API 관련 |

## 5. 원본 문서 매핑

| 원본 파일 | Wiki Source 페이지 | 상태 |
|---|---|---|
| `00_PRD_v1.1-rev.4.md` | `src-prd.md` | ✅ |
| `05_SRS_v1.6.md` | `src-srs.md` | ✅ |
| `06_TASK_LIST_v1.3.md` | `src-task-list.md` | ✅ |
| `06_value-proposition-sheet_V2_(Rooted).md` | `src-value-proposition.md` | ✅ |
| `10_jtbd-interview-report.md` | `src-jtbd.md` | ✅ |
| `2_competents-analysis.md` | `src-competitor-analysis.md` | ✅ |
| `4_ksf-report.md` | `src-ksf.md` | ✅ |
| `5_problem-definition.md` | `src-problem-definition.md` | ✅ |
| `6_TAM-SAM-SOM+MarketSegment.md` | `src-market-analysis.md` | ✅ |
| `7_persona-spectrum-map.md` | `src-persona.md` | ✅ |
| `8_customer-journey-map.md` | `src-cjm.md` | ✅ |
| `9_aos-dos-analysis.md` | `src-aos-dos.md` | ✅ |
| `plan_srs_stack_alignment_implementation_v1.2.md` | `src-implementation-plan.md` | ✅ |
