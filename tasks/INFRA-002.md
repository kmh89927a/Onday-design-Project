---
name: Feature Task
title: "[Feature] INFRA-002: Supabase PostgreSQL 프로덕션 DB 프로비저닝 + DATABASE_URL 환경변수 설정"
labels: ['feature', 'priority:H', 'epic:Infra', 'wave:1']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [INFRA-002] Supabase PostgreSQL 프로덕션 DB 프로비저닝 + DATABASE_URL 환경변수 설정
- **목적 (Why):**
  - **비즈니스:** DB-001에서 정의한 `DATABASE_PROVIDER=postgres` 분기의 프로덕션 절반을 실제 Supabase 프로젝트로 명문화한다. 로컬 SQLite 개발 환경에서 프로덕션 Supabase PostgreSQL로 전환 시 환경변수만 변경하면 되는 구조를 완성한다.
  - **사용자 가치:** 프로덕션 DB가 프로비저닝되어야 실 사용자 데이터를 수용할 수 있으며, 이후 모든 배포(DB-002~DB-007 마이그레이션 적용)가 가능해진다.
- **범위 (What):**
  - ✅ 만드는 것: Supabase 프로젝트 생성 가이드, DATABASE_URL 환경변수 설정, Connection Pooling 구성, `prisma migrate deploy` CI/CD 스크립트, 백업 정책 문서, `.env.production` 템플릿
  - ❌ 만들지 않는 것: 개별 모델 정의(DB-002~007 범위), Prisma schema 변경, SQLite 관련 코드, AES-256 암호화, NextAuth.js, 결제 관련 스키마
- **복잡도:** L
- **Wave:** 1 (인프라 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **CON-11** (§1.2.3): "데이터베이스는 Prisma ORM + SQLite(로컬 개발) / Supabase PostgreSQL(프로덕션)을 사용한다."
- **CON-15** (§1.2.3): "배포 및 인프라는 Vercel 플랫폼으로 단일화한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-012** (§4.2.2): "서버 오류율 (5xx 응답) — ≤ 0.5%"
- **REQ-NF-024** (§4.2.4): "월 인프라 비용 (MVP 기준) — 무료 ~ 10만원 이하"
- **§6.2.0 ERD 주석**: "Prisma의 datasource 설정에서 환경 변수(DATABASE_URL)만 변경하면 DB 전환이 가능하다."

### §6.6 Component Diagram 인용 (Data Store)

```
DataStore["💾 Data Store (C-TEC-003)"]
  PrismaORM["Prisma ORM"]
  DevDB[("SQLite — 로컬 개발")]
  ProdDB[("Supabase PostgreSQL — 프로덕션")]
```

### 선행 태스크 산출물 (배치 1~6)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| INFRA-001 | Next.js 프로젝트 부트스트랩, `vercel.json`, `.env.example` | — | Vercel 배포 파이프라인 기반, 환경변수 템플릿 확장 |
| DB-001 | `prisma/schema.prisma` (datasource 설정), `lib/db.ts` 싱글톤, `.env` | `@/lib/db` | `DATABASE_PROVIDER=postgresql` 분기 발동 시 본 ISSUE의 Supabase URL이 `DATABASE_URL`으로 주입됨 |

### Unblock 표 (배치 7 신규)

| 본 ISSUE 완성 시 Unblock되는 후속 ISSUE | 효과 |
|---|---|
| 모든 prod 배포 (DB-002~DB-007 마이그레이션 적용) | DB-001의 `DATABASE_PROVIDER=postgres` 분기가 실제 동작 |
| CMD-DIAG-004, CMD-SHARE-001 등 Server Action | 프로덕션 DB에 실 데이터 저장 가능 |
| DB-007 RLS 정책 | Supabase Postgres에서 RLS 네이티브 동작 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Supabase Dashboard에서 프로젝트 생성
  - URL: `https://supabase.com/dashboard/new/`
  - **Region:** Northeast Asia (Tokyo) `ap-northeast-1` — 한국 사용자 latency 최적 (~30ms)
  - **Pricing Plan:** Free Tier (MVP)
  - **Database Password:** 최소 16자 강력한 비밀번호 생성 (1Password 또는 `openssl rand -base64 24`)
  - **Organization:** 프로젝트 전용 Organization 생성 또는 기존 사용

- [ ] **3.2** Connection String 복사 및 환경변수 설정
  - Supabase Dashboard → Settings → Database → Connection String
  - **URI Mode** 선택 (Transaction 모드 X → Session 모드)
  ```env
  # .env.production
  DATABASE_PROVIDER=postgresql
  DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
  ```

- [ ] **3.3** `prisma/schema.prisma`에 `directUrl` 추가 (Connection Pooling 호환)
  ```prisma
  // prisma/schema.prisma — DB-001에서 정의한 datasource 확장
  datasource db {
    provider  = env("DATABASE_PROVIDER")   // "sqlite" | "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")          // Prisma migrate용 direct connection
  }
  ```
  - **`DATABASE_URL`:** pgBouncer 경유 (포트 6543) — 앱 런타임 연결
  - **`DIRECT_URL`:** direct connection (포트 5432) — `prisma migrate deploy` 전용

- [ ] **3.4** Vercel Dashboard에서 환경변수 등록
  - Vercel Project → Settings → Environment Variables
  - **Production 환경:**
    - `DATABASE_PROVIDER` = `postgresql`
    - `DATABASE_URL` = `postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
    - `DIRECT_URL` = `postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`
  - **Preview/Development 환경:**
    - `DATABASE_PROVIDER` = `sqlite`
    - `DATABASE_URL` = `file:./dev.db`

- [ ] **3.5** `.env.example` 확장 — 프로덕션 DB 연결 정보 가이드
  ```env
  # === Database (DB-001 + INFRA-002) ===
  # 로컬 개발: sqlite / file:./dev.db
  # 프로덕션: postgresql / postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  DATABASE_PROVIDER=sqlite
  DATABASE_URL=file:./dev.db
  # Prisma migrate용 direct connection (프로덕션 only)
  # DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
  ```

- [ ] **3.6** 프로덕션 마이그레이션 배포 스크립트 작성
  ```bash
  # scripts/migrate-prod.sh
  #!/bin/bash
  set -e
  echo "🔄 Running Prisma production migration..."

  # Dry-run 검증
  npx prisma migrate diff \
    --from-migrations ./prisma/migrations \
    --to-schema-datamodel ./prisma/schema.prisma \
    --exit-code

  # 마이그레이션 적용
  npx prisma migrate deploy

  echo "✅ Production migration complete"
  ```

- [ ] **3.7** `vercel.json` buildCommand 확장 — 프로덕션 빌드 시 마이그레이션 포함
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "nextjs",
    "buildCommand": "npx prisma generate && npx prisma migrate deploy && next build",
    "installCommand": "npm install"
  }
  ```

- [ ] **3.8** Connection Pooling 설정 검증 — PgBouncer 호환
  ```typescript
  // lib/db.ts — DB-001 싱글톤 확장 (Connection Limit 설정)
  export const prisma = global.prismaGlobal ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  ```
  - Supabase Free Tier: 최대 동시 연결 60개 (pgBouncer transaction mode)
  - Vercel Serverless: 함수당 1 connection → pgBouncer 필수

- [ ] **3.9** 백업 정책 문서 작성 — `docs/db-backup-policy.md`
  ```markdown
  # DB 백업 정책

  ## Supabase Free Tier (MVP)
  - 자동 백업: 일 1회 (Supabase 기본 제공)
  - PITR (Point-in-Time Recovery): **미지원** (Pro 이상)
  - 보관 기간: 7일

  ## 수동 백업 (MVP 보조)
  pg_dump -h db.[ref].supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql

  ## Pro 전환 기준
  - DB 용량 500MB 도달 시 (Free: 500MB / Pro: 8GB)
  - PITR 필요 시 (금융 수준 복구)
  - 동시 연결 60개 초과 시
  ```

- [ ] **3.10** RLS 호환성 검증 — DB-007과의 정합성
  - Supabase Postgres는 RLS (Row Level Security) 네이티브 지원
  - DB-007의 `prisma/migrations/manual/001_user_auth_fk.sql` RLS 정책이 본 환경에서 동작
  ```sql
  -- DB-007 RLS 정책 (프로덕션에서 실행)
  ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "user_own_data" ON "User"
    USING (auth.uid()::text = id::text);
  ```
  - 검증: Supabase SQL Editor에서 RLS 정책 적용 → 타 사용자 데이터 접근 차단 확인

- [ ] **3.11** 프로덕션 DB 연결 테스트
  ```typescript
  // __tests__/db/prod-connection.spec.ts
  import { prisma } from '@/lib/db';

  describe('프로덕션 DB 연결 검증 (INFRA-002)', () => {
    // CI에서만 실행 — DATABASE_PROVIDER=postgresql 환경
    const isPostgres = process.env.DATABASE_PROVIDER === 'postgresql';

    (isPostgres ? it : it.skip)('Supabase Postgres 연결 성공', async () => {
      const result = await prisma.$queryRaw`SELECT current_database() as db_name`;
      expect(result).toBeDefined();
    });

    (isPostgres ? it : it.skip)('pgBouncer 경유 연결 확인', async () => {
      const result = await prisma.$queryRaw`SHOW server_version`;
      expect(result).toBeDefined();
    });
  });
  ```

- [ ] **3.12** Sentry 에러 추적 연동 확인
  - DB 연결 실패 시 `Sentry.captureException` 호출 구조 검증
  ```typescript
  // lib/db.ts에 에러 핸들링 추가 (MON-001 완성 후 활성화)
  // prisma.$on('error', (e) => Sentry.captureException(e));
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** Supabase Postgres 프로덕션 DB 연결 성공
- **Given** `DATABASE_PROVIDER=postgresql`, `DATABASE_URL=postgresql://...supabase.com:6543/postgres?pgbouncer=true` 환경변수 설정
- **When** `npx prisma db pull` 또는 `prisma.$queryRaw\`SELECT 1\`` 실행
- **Then** Supabase Postgres에 정상 연결, 쿼리 결과 반환, 연결 latency ≤ 100ms (Tokyo region)

**AC-2 (정상):** 프로덕션 마이그레이션 배포 성공
- **Given** `prisma/migrations/` 디렉토리에 DB-001~DB-007의 마이그레이션 파일이 존재
- **When** `npx prisma migrate deploy` 실행 (DIRECT_URL 사용)
- **Then** 모든 마이그레이션이 순서대로 적용, `_prisma_migrations` 테이블에 기록, 롤백 없음

**AC-3 (예외):** DATABASE_URL 형식 오류 시 명확한 에러
- **Given** `DATABASE_URL=invalid_url`로 잘못 설정
- **When** `npx prisma validate` 또는 앱 시작 시도
- **Then** `Error: Invalid connection string` 또는 동등한 명확한 에러 메시지 표시

**AC-4 (경계):** Connection Pooling (pgBouncer) 동작 검증
- **Given** `DATABASE_URL`에 `?pgbouncer=true` 쿼리 파라미터 포함
- **And** `DIRECT_URL`에 포트 5432 직접 연결
- **When** 앱 런타임에서 Prisma 쿼리 실행 + `prisma migrate deploy` 실행
- **Then** 런타임은 pgBouncer(6543)로 연결, 마이그레이션은 direct(5432)로 연결. 두 연결 모두 성공

**AC-5 (보안):** RLS 정책 동작 검증
- **Given** DB-007의 RLS 정책이 프로덕션 DB에 적용된 상태
- **When** 사용자 A의 세션으로 사용자 B의 데이터 접근 시도
- **Then** RLS 정책에 의해 빈 결과 반환 (개인정보 노출 0건)

**AC-6 (정합성):** DB-001 환경 분기와 완전 호환
- **Given** DB-001의 `datasource db { provider = env("DATABASE_PROVIDER") }` 설정
- **When** `DATABASE_PROVIDER=postgresql`, `DATABASE_URL=postgresql://...supabase` 환경변수 주입
- **Then** Prisma가 postgresql provider로 동작, `npx prisma validate` 통과, `npx prisma generate` 성공

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | Tokyo region 선택으로 한국 사용자 DB latency 최소화 (~30ms). pgBouncer connection pooling으로 연결 오버헤드 최소화 |
| REQ-NF-024 | "월 인프라 비용 — 무료 ~ 10만원 이하" (§4.2.4) | Supabase Free Tier 사용 (0원). 500MB DB + 60 동시연결 + 500K Auth MAU |
| CON-11 | "데이터베이스는 Prisma ORM + SQLite(로컬 개발) / Supabase PostgreSQL(프로덕션)을 사용한다." (§1.2.3) | `DATABASE_PROVIDER` 환경변수 분기로 SQLite↔Postgres 전환. `DIRECT_URL` 추가로 pgBouncer 호환 |

---

## 6. 📦 Deliverables (산출물 명시)

- `prisma/schema.prisma` 수정 (directUrl 추가)
- `.env.production` 템플릿 (DATABASE_URL + DIRECT_URL)
- `.env.example` 확장 (프로덕션 연결 정보 가이드)
- `vercel.json` 수정 (buildCommand에 `prisma migrate deploy` 추가)
- `scripts/migrate-prod.sh` (프로덕션 마이그레이션 스크립트)
- `docs/db-backup-policy.md` (백업 정책 문서)
- `__tests__/db/prod-connection.spec.ts` (프로덕션 연결 테스트)
- Vercel Dashboard 환경변수 등록 (Production/Preview 분리)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 태스크 시작 전 필요):

- **INFRA-001 ✅:** Next.js 프로젝트 + Vercel 배포 파이프라인
- **DB-001 ✅:** Prisma 초기화 + datasource 환경변수 기반 전환 구조

### 후행 (이 태스크 완료 후 차례로 가능):

- **모든 프로덕션 배포:** DB-002~DB-007 마이그레이션이 프로덕션 DB에 적용 가능
- **DB-007 RLS 정책:** Supabase Postgres에서 RLS 네이티브 동작 확인
- **CMD-DIAG-004, CMD-SHARE-001~004:** 프로덕션 DB에 실 데이터 저장

---

## 8. 🧪 Test Plan (검증 절차)

- **연결 테스트:** `__tests__/db/prod-connection.spec.ts` — Vitest (Postgres 환경에서만 실행)
  1. Supabase Postgres 연결 성공
  2. pgBouncer 경유 연결 확인
- **마이그레이션 테스트:**
  1. `npx prisma migrate diff --exit-code` — 스키마/마이그레이션 정합성
  2. `npx prisma migrate deploy` — 프로덕션 마이그레이션 적용 (staging 환경)
- **CLI 검증:**
  1. `npx prisma validate` — 스키마 유효성 (postgresql provider)
  2. `npx prisma generate` — Prisma Client 타입 생성
- **Vercel 배포 검증:** Git Push → Vercel 빌드 시 `prisma migrate deploy` 실행 확인
- **RLS 검증:** Supabase SQL Editor에서 `auth.uid()` 기반 정책 동작 확인

---

## 9. 🚧 Open Questions / Risks (보류 사항)

### DB-001과의 정합성 명시

> DB-001의 `DATABASE_PROVIDER=postgres` 분기 발동 시 본 ISSUE의 Supabase URL이 `DATABASE_URL` 환경변수로 주입됨. DB-001의 `datasource db { provider = env("DATABASE_PROVIDER") }` 설정과 1:1 대응.

### 기타 보류 사항

1. **Pro 전환 기준:**
   - DB 용량 500MB 도달 시 (Free: 500MB / Pro: 8GB)
   - PITR 필요 시
   - 동시 연결 60개 초과 시 (MAU 증가)
   - 예상 전환 시점: Open Beta (2026-09~) 이후

2. **한국 Region 가용성:** Supabase는 현재 한국 직접 region이 없으므로 Tokyo (ap-northeast-1) 사용. Seoul region 추가 시 마이그레이션 검토.

3. **Shadow Database 제한:** Supabase Free Tier에서 `prisma migrate dev`의 shadow database 생성이 제한될 수 있음. 로컬 개발에서는 SQLite 사용, 프로덕션에서는 `prisma migrate deploy`만 사용하여 우회.

4. **Connection Limit:** Supabase Free Tier 60 동시연결. Vercel Serverless 함수가 cold start 시 연결을 새로 생성하므로, pgBouncer transaction mode가 필수. 트래픽 증가 시 connection_limit 파라미터 조정 필요.

5. **백업 자동화:** Free Tier에서는 수동 `pg_dump` 스크립트로 보조 백업. Pro 전환 시 PITR 활성화하여 자동 복구 체계 구축.
