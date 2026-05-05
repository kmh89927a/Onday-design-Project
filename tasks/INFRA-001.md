---
name: Feature Task
title: "[Feature] INFRA-001: Next.js 14 App Router 프로젝트 초기화 + Vercel 배포 파이프라인"
labels: ['feature', 'priority:H', 'epic:Infra', 'wave:1']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [INFRA-001] Next.js 14 App Router 프로젝트 초기화 + Vercel 배포 파이프라인 (Git Push 자동 배포)
- **목적 (Why):**
  - **비즈니스:** 모든 코드(DB, API, CMD, QRY, UI, TEST)의 컨테이너가 되는 Next.js 프로젝트를 부트스트랩하고, Git Push만으로 자동 배포되는 Vercel 파이프라인을 구성한다.
  - **사용자 가치:** 개발→배포→피드백 사이클을 최소화하여 MVP를 빠르게 검증할 수 있는 인프라 기반을 확보한다.
- **범위 (What):**
  - ✅ 만드는 것: Next.js 14 App Router 프로젝트, 디렉토리 구조, `package.json` 핵심 dependencies, TypeScript/ESLint 설정, Vercel 배포 연동, 환경변수 4종 설정 가이드
  - ❌ 만들지 않는 것: DB 스키마(DB-001~007), API 로직(CMD/QRY), UI 컴포넌트(UI-001~014), 결제 관련 설정, NextAuth.js 설정
- **복잡도:** M
- **Wave:** 1 (인프라 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **CON-09** (§1.2.3): "모든 서비스는 Next.js (App Router) 기반의 단일 풀스택 프레임워크로 구현한다."
- **CON-10** (§1.2.3): "서버 측 로직은 Next.js Server Actions 또는 Route Handlers를 사용하여 별도 백엔드 서버 없이 구현한다."
- **CON-12** (§1.2.3): "UI/스타일링은 Tailwind CSS + shadcn/ui를 사용하여 일관된 디자인 시스템을 강제한다."
- **CON-15** (§1.2.3): "배포 및 인프라는 Vercel 플랫폼으로 단일화한다. CI/CD 설정 없이 Git Push만으로 배포 자동화한다."
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용 (Vercel 통합)"
- **REQ-NF-024** (§4.2.4): "월 인프라 비용 (MVP 기준) — 무료 ~ 10만원 이하"

### 디렉토리 구조 (배치 1~4 ISSUE import 경로 정합성)

```
my-동네궁합진단기/
├── app/
│   ├── api/diagnosis/[id]/route.ts      # QRY-DIAG-001
│   ├── auth/callback/route.ts           # CMD-AUTH-001
│   ├── actions/diagnosis.ts             # CMD-DIAG-004 ('use server')
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── db.ts                            # DB-001 (Prisma 싱글톤)
│   ├── supabase/server.ts               # DB-007
│   ├── supabase/middleware.ts           # DB-007
│   ├── types/                           # API-001~005
│   │   ├── auth.ts
│   │   ├── diagnosis.ts
│   │   ├── share-link.ts
│   │   ├── saved-search.ts
│   │   ├── user.ts
│   │   └── errors/
│   ├── validators/                      # API-002 등
│   ├── mappers/                         # API-002 등
│   ├── constants/                       # API-006 에러 매핑
│   ├── helpers/                         # API-006 헬퍼
│   ├── mocks/                           # MOCK-001~005
│   ├── external/kakao-transport/        # API-007
│   └── diagnosis/                       # CMD-DIAG-001/002
├── prisma/
│   ├── schema.prisma                    # DB-001~007
│   ├── seed.ts
│   └── migrations/
├── middleware.ts                        # CMD-AUTH-003
├── __tests__/
├── docs/
│   └── issues/                          # → TASKS/issues/ (실제 위치)
└── public/
```

### 배치 1~4 import 경로 정합성 검증

| 기존 ISSUE | import 경로 | 디렉토리 매핑 | 정합성 |
|---|---|---|---|
| DB-001 (본 배치) | `@/lib/db` | `lib/db.ts` | ✅ |
| DB-007 | `@/lib/supabase/server`, `@/lib/supabase/middleware` | `lib/supabase/` | ✅ |
| DB-007 | `@/lib/services/user-sync` | `lib/services/user-sync.ts` | ⚠️ `lib/services/` 디렉토리 추가 필요 |
| API-001 | `@/lib/types/auth`, `@/lib/mappers/auth-mapper`, `@/lib/constants/auth-errors`, `@/lib/helpers/auth-error` | `lib/types/`, `lib/mappers/`, `lib/constants/`, `lib/helpers/` | ✅ |
| API-002 | `@/lib/types/diagnosis`, `@/lib/validators/diagnosis`, `@/lib/constants/diagnosis-errors`, `@/lib/mappers/diagnosis-mapper` | 동일 | ✅ |
| API-003 | `@/lib/types/share-link`, `@/lib/validators/share-link`, `@/lib/constants/share-link-errors` | 동일 | ✅ |
| API-005 | `@/lib/types/saved-search-api`, `@/lib/validators/saved-search-api`, `@/lib/constants/saved-search-errors` | 동일 | ✅ |
| API-007 | `@/lib/external/kakao-transport/` | `lib/external/kakao-transport/` | ✅ |
| MOCK-001~005 | `@/lib/mocks/diagnosis`, `@/lib/mocks/share-link` 등 | `lib/mocks/` | ✅ |
| CMD-DIAG-001/002 | `@/lib/diagnosis/` | `lib/diagnosis/` | ✅ |
| CMD-DIAG-004 | `@/app/actions/diagnosis` | `app/actions/diagnosis.ts` | ✅ |
| QRY-DIAG-001 | `@/app/api/diagnosis/[id]/route` | `app/api/diagnosis/[id]/route.ts` | ✅ |
| CMD-AUTH-001 | `@/app/auth/callback/route` | `app/auth/callback/route.ts` | ✅ |
| CMD-AUTH-003 | `@/middleware` | `middleware.ts` (루트) | ✅ |

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 태스크에서의 사용처 |
|---|---|---|
| None (최하위 기반) | — | INFRA-001은 모든 태스크의 시작점 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Next.js 프로젝트 생성
  ```bash
  npx -y create-next-app@latest ./ \
    --typescript --app --tailwind --eslint \
    --src-dir=false --import-alias="@/*" \
    --use-npm
  ```
  - `--app`: App Router 강제
  - `--typescript`: TypeScript 강제
  - `--tailwind`: Tailwind CSS (CON-12)
  - `--src-dir=false`: src/ 디렉토리 미사용
  - `--import-alias="@/*"`: path alias 설정

- [ ] **3.2** `package.json` dependencies 설치 — 핵심 9개+
  ```bash
  npm install @supabase/ssr@^0.5.0 @supabase/supabase-js@^2.45.0 \
    @prisma/client@^5.20.0 @sentry/nextjs@^8.0.0 \
    zod@^3.23.0 bcryptjs@^2.4.3

  npm install -D prisma@^5.20.0 @types/bcryptjs@^2.4.0 \
    vitest@^2.0.0 @playwright/test@^1.45.0 msw@^2.4.0
  ```

- [ ] **3.3** `package.json` 최종 dependencies 확인
  ```json
  {
    "dependencies": {
      "next": "^14.2.0",
      "react": "^18.3.0",
      "react-dom": "^18.3.0",
      "@supabase/ssr": "^0.5.0",
      "@supabase/supabase-js": "^2.45.0",
      "@prisma/client": "^5.20.0",
      "@sentry/nextjs": "^8.0.0",
      "zod": "^3.23.0",
      "bcryptjs": "^2.4.3"
    },
    "devDependencies": {
      "prisma": "^5.20.0",
      "typescript": "^5.5.0",
      "@types/node": "^20.0.0",
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      "@types/bcryptjs": "^2.4.0",
      "vitest": "^2.0.0",
      "@playwright/test": "^1.45.0",
      "msw": "^2.4.0",
      "tailwindcss": "^3.4.0",
      "postcss": "^8.4.0",
      "autoprefixer": "^10.4.0",
      "eslint": "^8.0.0",
      "eslint-config-next": "^14.2.0"
    }
  }
  ```

- [ ] **3.4** 디렉토리 구조 생성
  ```bash
  mkdir -p lib/{types/errors,validators,mappers,constants,helpers,mocks,services,supabase,external/kakao-transport,diagnosis}
  mkdir -p app/{api/diagnosis/[id],auth/callback,actions}
  mkdir -p prisma/migrations/manual
  mkdir -p __tests__/{db,types,validators,mappers,helpers,services,integration,mocks}
  mkdir -p docs/issues
  mkdir -p public/assets
  ```

- [ ] **3.5** `tsconfig.json` path alias 확인
  ```json
  {
    "compilerOptions": {
      "paths": { "@/*": ["./*"] }
    }
  }
  ```

- [ ] **3.6** `.env.example` 환경변수 템플릿 생성 (4종 이상)
  ```env
  # === Database (DB-001) ===
  DATABASE_PROVIDER=sqlite
  DATABASE_URL=file:./dev.db

  # === Supabase Auth (DB-007/CMD-AUTH) ===
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

  # === External API (API-007) ===
  KAKAO_REST_API_KEY=your-kakao-api-key

  # === Monitoring (REQ-NF-035) ===
  SENTRY_DSN=your-sentry-dsn
  SENTRY_AUTH_TOKEN=your-sentry-auth-token

  # === App ===
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

- [ ] **3.7** `.gitignore` 보강
  ```gitignore
  # Prisma
  prisma/dev.db
  prisma/dev.db-journal
  prisma/shadow.db

  # Environment
  .env
  .env.local
  .env.production

  # Vercel
  .vercel
  ```

- [ ] **3.8** Sentry 초기화 설정 (REQ-NF-035)
  ```bash
  npx @sentry/wizard@latest -i nextjs
  ```
  - 생성 파일: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `next.config.js` (withSentryConfig 래핑)

- [ ] **3.9** Vercel 배포 설정 (CON-15)
  - `vercel.json` 생성:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "nextjs",
    "buildCommand": "npx prisma generate && next build",
    "installCommand": "npm install"
  }
  ```
  - Vercel Dashboard에서 Git 리포지토리 연결
  - 환경변수 등록: `DATABASE_URL`, `DATABASE_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `KAKAO_REST_API_KEY`, `SENTRY_DSN`

- [ ] **3.10** 초기 랜딩 페이지 작성 — `app/page.tsx`
  ```typescript
  export default function Home() {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">내 하루 동선 맞춤 동네 궁합 진단기</h1>
        <p className="mt-4 text-lg text-gray-500">서비스 준비 중입니다.</p>
      </main>
    );
  }
  ```

- [ ] **3.11** `middleware.ts` placeholder 작성
  ```typescript
  // middleware.ts — CMD-AUTH-003에서 Supabase Auth 세션 검증 로직 추가 예정
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/server';

  export function middleware(request: NextRequest) {
    return NextResponse.next();
  }

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
  };
  ```

- [ ] **3.12** 로컬 개발 서버 실행 및 검증
  - 명령어: `npm run dev`
  - 검증: `http://localhost:3000` 접속, 랜딩 페이지 표시 확인

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** Next.js App Router 프로젝트 로컬 실행 성공
- **Given** `npx create-next-app@latest` 실행 완료, dependencies 설치 완료
- **When** `npm run dev` 실행
- **Then** `http://localhost:3000`에서 랜딩 페이지가 표시되며, 콘솔 에러 0건

**AC-2 (정상):** Vercel 자동 배포 성공
- **Given** Vercel Dashboard에서 Git 리포지토리 연결, 환경변수 설정 완료
- **When** `git push origin main` 실행
- **Then** Vercel에서 자동 빌드 + 배포 완료, Preview URL에서 랜딩 페이지 확인

**AC-3 (예외):** TypeScript 컴파일 에러 0건
- **Given** 프로젝트 초기화 + 모든 dependencies 설치 완료
- **When** `npx tsc --noEmit` 실행
- **Then** 에러 0건

**AC-4 (경계):** 환경변수 미설정 시 빌드 성공 (런타임 에러만)
- **Given** `.env`가 없는 상태에서 빌드 시도
- **When** `npm run build` 실행
- **Then** 빌드 자체는 성공 (환경변수는 런타임에 참조), 정적 페이지 생성 정상

**AC-5 (정합성):** 배치 1~4 ISSUE의 import 경로와 디렉토리 구조 일치
- **Given** 배치 1~4 ISSUE에서 사용된 모든 import 경로 (`@/lib/db`, `@/lib/types/auth`, `@/lib/supabase/server` 등)
- **When** 본 ISSUE의 디렉토리 구조와 대조
- **Then** 모든 import 경로가 실제 디렉토리/파일 위치와 매핑 가능
- **And** `lib/services/` 디렉토리가 포함되어 DB-007의 `@/lib/services/user-sync` 경로도 지원

**AC-6 (정합성):** package.json 핵심 dependencies 9개 이상
- **Given** 본 ISSUE의 `package.json` dependencies
- **When** 핵심 패키지 수 확인
- **Then** next, react, @supabase/ssr, @supabase/supabase-js, @prisma/client, @sentry/nextjs, zod, bcryptjs, prisma(dev) 등 9개 이상 포함

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용 (Vercel 통합)" (§4.2.6) | `@sentry/nextjs` 설치 + Sentry Wizard 초기화. `SENTRY_DSN` 환경변수 설정 가이드 포함 |
| REQ-NF-024 | "월 인프라 비용 (MVP 기준) — 무료 ~ 10만원 이하" (§4.2.4) | Vercel 무료 티어 사용. Hobby Plan 범위 내 배포 (Serverless Function 10초 timeout 인지) |
| CON-15 | "배포 및 인프라는 Vercel 플랫폼으로 단일화한다. Git Push만으로 배포 자동화한다." (§1.2.3) | `vercel.json` + Git 리포지토리 연결로 Push → 자동 배포 파이프라인 구성 |

---

## 6. 📦 Deliverables (산출물 명시)

- Next.js 14 App Router 프로젝트 전체 (`app/`, `lib/`, `prisma/`, `__tests__/`, `public/`, `docs/`)
- `package.json` (핵심 dependencies 9개+ + devDependencies 10개+)
- `tsconfig.json` (path alias `@/*`)
- `.env.example` (환경변수 4종: DATABASE, SUPABASE, KAKAO, SENTRY)
- `.gitignore` (Prisma + 환경파일 + Vercel)
- `vercel.json` (Vercel 배포 설정)
- `middleware.ts` (placeholder)
- `sentry.client.config.ts`, `sentry.server.config.ts` (Sentry 초기화)
- `app/page.tsx` (초기 랜딩 페이지)
- `app/layout.tsx` (루트 레이아웃)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 (이 태스크 시작 전 필요):
- **None** (최하위 기반 — 모든 태스크의 시작점)

### 후행 (이 태스크 완료 후 차례로 가능):
- **DB-001:** Prisma 초기화 — INFRA-001이 제공하는 `package.json` + `tsconfig.json` 기반
- **INFRA-002:** Supabase DB 프로비저닝
- **INFRA-004:** Tailwind + shadcn/ui 디자인 시스템
- **INFRA-005:** AI SDK 설정
- **SEC-002:** Rate Limiting Middleware
- **MON-001:** Sentry 기본 통합

---

## 8. 🧪 Test Plan (검증 절차)

- **로컬 실행:** `npm run dev` → `http://localhost:3000` 정상 표시
- **빌드 검증:** `npm run build` — 에러 0건
- **타입 검증:** `npx tsc --noEmit` — 에러 0건
- **Lint 검증:** `npm run lint` — 경고/에러 0건
- **배포 검증:** Git Push → Vercel 빌드 성공 → Preview URL 접속 가능
- **디렉토리 검증:** 배치 1~4 ISSUE의 모든 import 경로에 해당하는 디렉토리가 존재하는지 `find` 명령으로 확인
- **CI 게이트:** `tsc --noEmit`, `npm run lint`, `npm run build` 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

### 정합성 follow-up (배치 1~4 검증 결과)

| 갱신 대상 ISSUE | 갱신 사유 | 우선순위 |
|---|---|---|
| DB-007.md | `@/lib/services/user-sync` import 경로 사용 — 본 ISSUE 디렉토리 구조에 `lib/services/` 추가하여 정합 | ✅ 해결 — follow-up 없음 |
| 배치 1~4 전체 | 모든 import 경로 정합 확인됨 — follow-up 없음 | — |

### 기타 보류 사항

1. **Next.js 14 vs 15:** TASK_LIST에 `Next.js 15+`로 명시되어 있으나, SRS CON-09에서는 버전 미지정. `create-next-app@latest`가 14.x 또는 15.x를 설치할 수 있으며, App Router 지원은 동일. 어느 버전이든 호환 가능하도록 설계.
2. **Vercel 무료 티어 Serverless 10초 Timeout:** REQ-FUNC-003에서 이미 Client Component 병렬 처리로 우회 전략이 명시됨. 본 ISSUE에서는 인지만 하고, 실제 우회는 CMD-DIAG-002에서 구현.
3. **Tailwind CSS v3 vs v4:** `create-next-app --tailwind`가 설치하는 버전에 따라 설정 파일 구조가 다를 수 있음. INFRA-004(디자인 시스템)에서 상세 설정.
