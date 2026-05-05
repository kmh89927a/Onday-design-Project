---
title: "Diagnosis 엔터티"
category: entities
tags: [데이터, mvp]
sources: [src-srs, src-task-list]
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — SRS v1.6 / TASK_LIST v1.3 반영. 시나리오 비교 필드/결제 관련 필드 제거. DB-003 컬럼 명시(mode, deadlineMode, deadline, score), 73개 태스크 중 Diagnosis 도메인 14개, AI 스코어링(CMD-DIAG-003 → INFRA-005), Vercel Timeout 회피(Promise.allSettled) 반영.

# Diagnosis — 진단 엔터티

## 정의

사용자의 동선 교차 진단 결과. 두 주소(또는 싱글 모드의 직장+여가)를 입력하면 교차 연산을 통해 후보 동네를 산출하고, 그 결과를 저장하는 핵심 엔터티.

## 속성 (Prisma Schema — DB-003)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | 진단 고유 ID |
| `userId` | UUID (FK → User) | 소유 사용자 |
| `mode` | String | "couple" \| "single" |
| `deadlineMode` | Boolean | 데드라인 모드 활성화 여부 |
| `deadline` | DateTime? | 데드라인 모드 시 마감일 |
| `score` | Float? | AI 스코어링 결과 (CMD-DIAG-003) |
| `status` | String | "processing" \| "completed" \| "expired" |
| `filters` | JSON | 사용자 필터 조건 (통근시간, 예산 등) |
| `createdAt` | DateTime | 생성일 |

## 관계

```
User 1 ──→ N Diagnosis
Diagnosis 1 ──→ N CandidateArea (Prisma Transaction 원자성)
Diagnosis 1 ──→ N ShareLink
```

## 도메인 태스크 (14개 / 73개)

| 카테고리 | 태스크 ID |
|---|---|
| DB | DB-003 |
| API | API-002 |
| Command | CMD-DIAG-001 ~ CMD-DIAG-007 |
| Query | QRY-DIAG-001, QRY-DIAG-002 |
| Test | TEST-001, TEST-002 |

## 비즈니스 규칙

1. 교차 연산은 **Client Component**에서 **Promise.allSettled** 병렬로 수행 — Vercel 10초 Serverless Timeout 회피 ([[architecture-patterns]])
2. 결과 저장은 **Server Action**을 통해 **Prisma Transaction**(Diagnosis + CandidateArea 원자성) 보장
3. 교집합 0곳 시 조건 완화 제안 ≥ 2개 표시 (REQ-FUNC-008)
4. 수도권(서울/경기/인천) 외 주소 입력 시 차단 (REQ-FUNC-031)
5. **AI 스코어링** (CMD-DIAG-003): Vercel AI SDK(INFRA-005) 활용, ScoringEngine.score/rank 구현
6. 교통 API 타임아웃 5초 + 1회 재시도 (CMD-DIAG-006)

## 관련 페이지

- Entities: [[user]], [[share-link-entity]], [[domain-diagnosis]]
- Sources: [[src-srs]], [[src-task-list]]
- Concepts: [[two-route-intersection]], [[deadline-mode]], [[single-mode]], [[architecture-patterns]], [[srs-v1.6-changes]]
