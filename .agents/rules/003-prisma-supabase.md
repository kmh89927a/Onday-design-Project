---
description: Prisma ORM + Supabase PostgreSQL(Prod) / SQLite(Local) 데이터 가이드. Prisma schema / migration / DB 클라이언트 코드 편집 시 발동.
globs: ["prisma/**/*", "*.prisma", "**/prisma/**/*", "**/db/**/*", "**/supabase/**/*"]
alwaysApply: false
---
# OnDay — Prisma + Supabase Data Guide

본 룰은 Prisma schema·마이그레이션·DB 접근 코드 편집 시 자동 주입된다. `AGENTS.md §5` 와 `docs/05_SRS_v1.6.md §6.2` 의 데이터 모델을 SSoT 로 한다.

## DB 환경 분기

| 환경 | DB | 설정 |
| --- | --- | --- |
| 로컬 개발 | SQLite | `DATABASE_URL="file:./dev.db"` |
| 프로덕션 | Supabase PostgreSQL | `DATABASE_URL=<Supabase 연결 문자열>` |

`prisma/schema.prisma` 의 `datasource` 블록은 단일 정의로 유지하고, `DATABASE_URL` 환경변수만으로 전환 가능하도록 설계한다 (CON-11). provider 가 sqlite↔postgresql 로 달라질 경우 native 타입 차이(예: `Json` vs `Jsonb`)를 주의한다.

## 핵심 데이터 모델 (ERD)

```
USER ──< DIAGNOSIS ──< SHARE_LINK
USER ──< SAVED_SEARCH (1:1 UPSERT)
```

### USER

- `id` UUID PK
- `email` VARCHAR(255) UNIQUE NOT NULL
- `auth_provider` ENUM (`kakao` | `naver`) — Supabase Auth 연동
- `mode` ENUM (`couple` | `single`) DEFAULT `couple`
- `created_at`, `updated_at` TIMESTAMP

### DIAGNOSIS

- `id` UUID PK
- `user_id` FK → USER.id
- `deadline` DATE NULLABLE (데드라인 모드 시 필수)
- `status` ENUM (`processing` | `completed` | `expired`) DEFAULT `processing`
- `filters` JSONB NOT NULL (최대 통근 시간, 예산, 시간대 등)
- `mode` ENUM (`couple` | `single`)
- `deadline_mode` BOOLEAN DEFAULT FALSE
- `created_at` TIMESTAMP

### SHARE_LINK

- `id` UUID PK
- `diagnosis_id` FK → DIAGNOSIS.id
- `unique_url` VARCHAR(255) UNIQUE — **UUID v4, entropy ≥ 128bit** (REQ-NF-020)
- `password_hash` VARCHAR(255) NULLABLE (열람 비밀번호 옵션)
- `view_count` INT DEFAULT 0
- `free_preview_used` BOOLEAN DEFAULT FALSE
- `expires_at` DATE — 생성일 + 30일 (REQ-FUNC-010)
- `created_at` TIMESTAMP

### SAVED_SEARCH (Rev 1.5 단순화)

- `user_id` PK/FK → USER.id (UNIQUE, 사용자당 1건 UPSERT)
- `search_params` JSONB NOT NULL
- `saved_at` TIMESTAMP

## 제거된 엔터티 (자동 복원 금지)

- `ViewLog` — Rev 1.5 에서 제거 (열람 로그 별도 테이블 불필요)
- `DongMap` — Rev 1.5 에서 제거 (행정동 매핑 테이블 유지 비용)
- `PAYMENT` — Rev 1.6 에서 제거 (결제 MVP 제외)
- `COMMUTE_POINT`, `CANDIDATE_AREA` — SRS 1.6 ERD 에서 단순화 (응답 시 JSONB 또는 별도 계산 결과로 처리)

## 작성 원칙

- **마이그레이션은 적층 방식** (`prisma migrate dev --name <description>`). 기존 마이그레이션 파일 수정 금지.
- **신규 엔터티 추가 시 PRD/SRS 근거 명시** 필수. SRS 에 없는 엔터티 추가 금지.
- **JSONB 컬럼**(`filters`, `search_params`) 의 스키마는 TypeScript 타입(`zod` 등으로 런타임 검증) 으로 별도 명시.
- **타임스탬프**: PostgreSQL 은 `TIMESTAMPTZ` 권장. SQLite 는 `DATETIME` 사용.
- **PK 는 UUID v4** (분산 ID 안전성). Supabase 의 `gen_random_uuid()` 또는 Prisma `@default(uuid())` 사용.
- **인덱스**: FK 컬럼 (`user_id`, `diagnosis_id`) + 조회 패턴 컬럼 (`status`, `expires_at`).

## Supabase Auth 연동

- USER 테이블의 `id` 는 Supabase Auth 의 `auth.users.id` (UUID) 와 일치시킨다.
- Supabase RLS (Row Level Security) 를 활성화하여 사용자가 본인 데이터에만 접근하도록 설정한다 (DIAGNOSIS, SAVED_SEARCH).
- SHARE_LINK 는 공유 토큰 기반 접근이므로 RLS 정책에서 별도 처리 (anon role 에 `unique_url` 매칭 SELECT 허용).

## See also

- `AGENTS.md §5` — 핵심 데이터 모델 요약
- `002-tech-stack.md` — Next.js + Server Actions 가이드
- `docs/05_SRS_v1.6.md §6.2` — ERD·엔터티 명세 (SSoT)
- `docs/05_SRS_v1.6.md` Rev 1.5/1.6 Changelog — 제거 엔터티 사유
