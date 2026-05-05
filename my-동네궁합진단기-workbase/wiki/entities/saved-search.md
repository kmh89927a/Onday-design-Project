---
title: "SavedSearch 엔터티"
category: entities
tags: [데이터, mvp]
sources: [src-srs]
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — SRS v1.6 / TASK_LIST v1.3 반영. 재계산 로직/비교 뷰/시나리오 비교 제거 → "저장된 값을 입력 폼에 채우기"만(Rev 1.1 단순화). best effort UPSERT(REQ-NF-016), 저장 실패 시 사용자 미통지(Sentry 기록만), geocoding 재검증→실패 시 "다시 입력해주세요" 안내.

# SavedSearch — 저장된 검색 엔터티

## 정의

사용자의 마지막 진단 입력 조건을 저장하는 엔터티. 사용자당 1건만 유지(UPSERT)하며, 재방문 시 이전 조건을 복원하는 데 사용.

## 속성 (Prisma Schema)

| 필드 | 타입 | 설명 |
|---|---|---|
| `userId` | UUID (PK, FK → User) | 사용자 ID (1:1) |
| `searchParams` | JSON | 저장된 검색 조건 (주소, 필터 등) |
| `savedAt` | DateTime | 저장 시각 |

## 관계

```
User 1 ──→ 0..1 SavedSearch (PK = userId)
```

## 비즈니스 규칙

1. **Best effort UPSERT** (REQ-NF-016): 세션 종료/앱 종료 시 `beforeunload` 이벤트로 저장 시도
2. **저장 실패 시 사용자 미통지**: 실패 시 Sentry 기록만 남김 (사용자 알림 ❌)
3. **불러오기**: 재방문 시 "이전 조건 불러오기" 버튼 → 주소·필터 폼 자동 채움 (≤ 1초)
4. **Geocoding 재검증**: 불러온 주소가 유효한지 카카오 Geocoding으로 재확인. 실패 시 "다시 입력해주세요" 안내
5. **Rev 1.1 제거 항목**: 비교 뷰(FUNC-026), 시나리오 비교(FUNC-027), 행정동 매핑(FUNC-028), replaySearch() — 모두 v1 이후 연기

## 관련 태스크

- CMD-SAVE-001: 입력값 자동 저장
- QRY-SAVE-001: 저장된 조건 불러오기

## 관련 페이지

- Entities: [[user]], [[diagnosis]], [[domain-savedsearch]]
- Sources: [[src-srs]]
- Concepts: [[srs-v1.6-changes]], [[known-follow-ups]]
