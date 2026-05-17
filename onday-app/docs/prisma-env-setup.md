# Prisma 환경 설정 가이드 (Prisma 7 + adapter)

> **이 문서의 위치**: `onday-app/docs/prisma-env-setup.md`
> **역할**: 현 onday-app 의 Prisma 7 환경 설정 + DB 전환 정책의 **기준 문서**
> **자매 문서**: 실제 SQLite → Postgres 이주 절차·RLS SQL 은 [`migration-to-postgres.md`](./migration-to-postgres.md) 참조

---

## 0. ★ 현실 불일치 경고 (먼저 읽기)

`migration-to-postgres.md` 는 4/29 시점 가정(`provider = env("DATABASE_PROVIDER")`)으로 작성됨.
현 `prisma/schema.prisma` 는 다음 패턴 (Prisma 7 + adapter) 이다:

- **schema.prisma**: `provider = "sqlite"` **하드코딩**
- **prisma.config.ts**: runtime `url = process.env["DATABASE_URL"]` override
- **lib/db.ts**: PrismaClient 가 아님 — **`src/lib/db.ts` = Vercel demo 용 in-memory store**

env-based provider (`provider = env("DATABASE_PROVIDER")`) 전환은 **INFRA-002 시점**.
현재 환경 설정의 기준 문서는 본 문서(`prisma-env-setup.md`)다.

---

## 1. ★ in-memory store 예고 (DB-001 핵심 메모)

현 `src/lib/db.ts` 는 **PrismaClient 가 아니라 in-memory Map store** 다.
이유: Vercel serverless filesystem 이 read-only + ephemeral 이므로 SQLite 가 prod 에서 동작 불가.

```typescript
// src/lib/db.ts (현 상태 발췌)
// In-memory store for the Vercel demo deploy.
// Pin stores to globalThis so Next.js dev mode HMR doesn't wipe them between
// requests (and so warm Vercel lambda instances reuse the same Maps).
export const prisma = {
  diagnosis: { create, findUnique },
  shareLink: { create, findUnique, update },
  savedSearch: { upsert, findUnique },
};
```

모든 API 라우트 (`src/app/api/diagnosis/*`, `src/app/api/share/*`, `src/app/api/save/*`) 가
`import { prisma } from '@/lib/db'` 로 이 fake API 를 사용한다.

**실 PrismaClient 싱글톤으로의 swap 은 INFRA-002 (Supabase Postgres 프로비저닝) 시점에 수행한다.**
DB-001 단계에서는 in-memory 를 **그대로 보존**하고, Prisma 인프라(schema/migrations/config) 만 준비된 상태로 둔다.

---

## 2. 현재 Prisma 7 환경 구조

### 2-1. 파일 구성

| 파일 | 역할 |
| --- | --- |
| `prisma/schema.prisma` | datasource (`provider = "sqlite"`) + generator (`provider = "prisma-client"`) + 4모델 (User/Diagnosis/ShareLink/SavedSearch) |
| `prisma.config.ts` | Prisma 7 신 파일. schema/migrations path + `datasource.url = process.env["DATABASE_URL"]` runtime override |
| `prisma/migrations/20260429125124_init/` | 4/29 작성 init migration (4모델 CREATE TABLE) |
| `prisma/seed.ts` | `PrismaBetterSqlite3` adapter 사용. DB-001 단계에서 seed runner 미설정 (tsx 부재) |
| `src/generated/prisma/` | `npx prisma generate` 산출물. `.gitignore` 됨 |
| `src/lib/db.ts` | **in-memory store** (위 §1 참조) |

### 2-2. Prisma 7 신패턴 — generator

```prisma
generator client {
  provider = "prisma-client"      // ← v5 의 "prisma-client-js" 가 아님
  output   = "../src/generated/prisma"
}
```

- v5 의 `provider = "prisma-client-js"` → v7 에서 `"prisma-client"` 로 변경
- `output` 명시 필수. 결과는 `src/generated/prisma/` 에 생성됨
- import 경로: `import { PrismaClient } from "@/generated/prisma/client"` (path alias `@/* → ./src/*` 정합)
- ⚠️ v7 generated 디렉토리에는 `index.ts` 가 없음. `/client` 서브 경로 필수

### 2-3. Prisma 7 신패턴 — prisma.config.ts

```typescript
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

- v5 까지는 schema.prisma 의 `url = env("DATABASE_URL")` 직접 인용
- v7 부터는 `prisma.config.ts` 에서 datasource override 가능 (schema 의 url 줄 생략 가능)

### 2-4. Prisma 7 신패턴 — better-sqlite3 driver adapter

```typescript
// prisma/seed.ts (현 상태)
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:prisma/dev.db" });
const prisma = new PrismaClient({ adapter });
```

- v7 의 driver adapter 패턴. SQLite 의 경우 `@prisma/adapter-better-sqlite3` 필요
- 단 INFRA-002 시점에 Postgres 로 전환하면 adapter 불필요 (네이티브 PostgreSQL driver 사용)

---

## 3. 로컬 개발 환경 (SQLite)

### 3-1. .env 설정

```env
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
```

### 3-2. CLI 명령 (DB-001 npm scripts)

| 명령 | 용도 |
| --- | --- |
| `npm run db:validate` | schema 문법 검증 (`npx prisma validate`) |
| `npm run db:generate` | Prisma Client 생성 (`src/generated/prisma/` 갱신) |
| `npm run db:migrate:dev` | 새 migration 생성·적용 (dev) |
| `npm run db:push` | schema → DB 직접 적용 (migration 미생성) |
| `npm run db:studio` | Prisma Studio (DB GUI) |
| `npm run db:seed` | ⚠️ tsx 부재로 `prisma.seed` 미설정 — 후속 ISSUE 에서 결정 |
| `npm run db:migrate:deploy` | prod migration 적용 (CI/Vercel) |

### 3-3. 로컬 동작 흐름

1. `npm install` → `postinstall` hook 으로 자동 `npx prisma generate`
2. `npm run db:validate` → schema 문법 OK
3. (스키마 변경 시) `npm run db:migrate:dev --name <description>`
4. **현 시점에는 API 라우트가 in-memory store 사용 → 로컬 SQLite 파일(dev.db) 은 실제 read/write 되지 않음**

---

## 4. 프로덕션 전환 (Supabase Postgres) — INFRA-002 시점

> 상세 절차·Supabase 프로젝트 생성·RLS SQL 은 [`migration-to-postgres.md`](./migration-to-postgres.md) 참조.
> 단 그 문서의 §3-3 schema 조정 부분(`provider = env(...)`) 은 현실과 불일치 — INFRA-002 에서 schema 갱신 시 정합화.

### 4-1. INFRA-002 시점에 할 일 (요약)

1. Supabase 프로젝트 생성 + connection string 획득 (`migration-to-postgres.md §3-1`)
2. `prisma/schema.prisma` 의 datasource provider 갱신 — `"sqlite"` → `env("DATABASE_PROVIDER")`
3. `src/lib/db.ts` 의 in-memory store 폐기 → 실 PrismaClient 싱글톤으로 swap
4. 환경변수 `DATABASE_PROVIDER=postgresql`, `DATABASE_URL=postgresql://...`
5. `npm run db:migrate:deploy` (또는 `migration-to-postgres.md §3-4` 의 `reset` + `migrate dev`)
6. RLS 정책 수동 적용 (`migration-to-postgres.md §3-5`)
7. Vercel env 등록 (`migration-to-postgres.md §3-6`)

### 4-2. 실 PrismaClient 싱글톤 (INFRA-002 시점 작성 예정)

```typescript
// src/lib/db.ts (INFRA-002 시점 swap 후 예시)
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = global.prismaGlobal ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
```

---

## 5. SQLite ↔ Postgres 차이 주의점

상세 비교 + 워크어라운드는 [`migration-to-postgres.md §2`](./migration-to-postgres.md) 참조. 핵심만:

| 항목 | SQLite (현재 schema) | Postgres (INFRA-002 후) |
| --- | --- | --- |
| `@db.JsonB` | `TEXT` 로 매핑 (현 schema 는 `String` 직접 사용, JSON.parse 처리) | 네이티브 JSONB |
| `@db.Uuid` | `TEXT` 로 매핑 (현 schema 는 `@default(uuid())` 사용) | 네이티브 UUID |
| RLS | 미지원 — Mock 단일 사용자 전제로 회피 | `prisma/migrations/manual/` 에 수동 SQL |
| ENUM | 미지원 → `String` + `@map` 사용 | 네이티브 ENUM 가능 |
| 동시 쓰기 | 단일 사용자 한정 | pgbouncer + connection pool (Supabase 무료 티어 제한 주의) |
| Vercel serverless | ❌ filesystem read-only — 사용 불가 | ✅ Supabase pooler 경유 가능 |

---

## 6. 본 문서 vs migration-to-postgres.md 역할 분담

| 문서 | 역할 | 갱신 주체 |
| --- | --- | --- |
| **`prisma-env-setup.md`** (본 문서) | 현 Prisma 7 환경 구조 + in-memory note + 신패턴 가이드 | DB-001 (현재) → INFRA-002 시점 §1 in-memory 메모 갱신 |
| **`migration-to-postgres.md`** | 실제 Postgres 이주 절차 + RLS SQL | 4/29 작성 보존, INFRA-002 시점에 schema 가정 갱신 |

---

## 7. References

- 명세: [`tasks/DB-001.md`](../../tasks/DB-001.md) — 본 ISSUE
- 명세: [`tasks/INFRA-002.md`](../../tasks/INFRA-002.md) — 실 PrismaClient swap 시점
- SRS: [`docs/05_SRS_v1.6.md`](../../docs/05_SRS_v1.6.md) §6.2.0 ERD, CON-11
- Prisma 7 docs: <https://www.prisma.io/docs>
