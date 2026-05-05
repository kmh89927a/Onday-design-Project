---
title: "User 엔터티"
category: entities
tags: [데이터, mvp]
sources: [src-srs]
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — SRS v1.6 / TASK_LIST v1.3 반영. password/bcrypt hash 필드(USER 모델) 제거 → OAuth-only(Supabase Auth). USER 모델 간소화: id, email, provider(kakao/naver), createdAt. 게스트 모드(sessionStorage 기반, DB 미저장) 반영.

# User — 사용자 엔터티

## 정의

서비스에 OAuth(카카오/네이버)로 인증한 사용자. Supabase `auth.users.id`를 참조하며, 진단(Diagnosis)과 저장된 검색(SavedSearch)의 소유자.

## 속성 (Prisma Schema — DB-002)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | Supabase auth.users.id와 일치 |
| `email` | String (unique) | 이메일 |
| `provider` | String | "kakao" \| "naver" |
| `createdAt` | DateTime | 생성일 |

> ⚠️ `password`, `bcrypt hash` 필드는 v1.6에서 **제거**됨. OAuth-only 인증 체계로 사용자 비밀번호 자체가 불필요.

## 관계

```
User 1 ──→ N Diagnosis (creates)
User 1 ──→ 0..1 SavedSearch (saves)
```

## 비즈니스 규칙

1. **OAuth-only**: Supabase Auth를 통해 카카오/네이버 OAuth로만 인증 (REQ-FUNC-029)
2. 모드 선택은 진단(Diagnosis) 엔터티의 `mode` 필드에서 관리 (couple/single)
3. **RLS**(Row Level Security): `auth.uid()::text = user_id` 조건으로 본인 데이터만 접근
4. **게스트 모드**: OAuth 장애 시 sessionStorage 기반 임시 체험. DB에 저장하지 않음 (CMD-AUTH-004)

## 관련 페이지

- Entities: [[diagnosis]], [[saved-search]], [[share-link-entity]], [[domain-auth]], [[domain-foundation]]
- Sources: [[src-srs]], [[src-implementation-plan]]
- Concepts: [[tech-stack]], [[srs-v1.6-changes]]
