---
name: Feature Task
title: "[Feature] INFRA-001: Next.js 15+ App Router 프로젝트 초기화 + Vercel 배포 파이프라인 (기존 onday-app/ 베이스)"
labels: ['feature', 'priority:H', 'epic:Infra', 'wave:1']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [INFRA-001] Next.js 15+ App Router 프로젝트 초기화 + Vercel 배포 파이프라인 (Git Push 자동 배포) — 기존 onday-app/ 베이스 인정 + 명세 대비 갭 보충
- **목적 (Why):**
  - **비즈니스:** 모든 코드(DB, API, CMD, QRY, UI, TEST)의 컨테이너가 되는 Next.js 프로젝트를 부트스트랩하고, Git Push만으로 자동 배포되는 Vercel 파이프라인을 구성한다.
  - **사용자 가치:** 개발→배포→피드백 사이클을 최소화하여 MVP를 빠르게 검증할 수 있는 인프라 기반을 확보한다.
- **범위 (What):**
  - ✅ 만드는 것: Next.js 15+ App Router 프로젝트 (기존 onday-app/ 베이스), 누락 디렉토리/패키지 보강, `package.json` 핵심 dependencies 14+, TypeScript/ESLint 설정 정합 확인, Vercel 배포 파이프라인 (vercel.json), 환경변수 8종 설정 가이드 (.env.example)
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
onday-app/                                # 기존 onday-app/ 베이스 (신규 부트스트랩 없음)
├── src/
│   ├── app/
│   │   ├── api/diagnosis/[id]/route.ts      # QRY-DIAG-001
│   │   ├── auth/callback/route.ts           # CMD-AUTH-001
│   │   ├── actions/diagnosis.ts             # CMD-DIAG-004 ('use server')
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── db.ts                            # DB-001 (Prisma 싱글톤)
│   │   ├── supabase/server.ts               # DB-007
│   │   ├── supabase/middleware.ts           # DB-007
│   │   ├── types/                           # API-001~005
│   │   │   ├── auth.ts
│   │   │   ├── diagnosis.ts
│   │   │   ├── share-link.ts
│   │   │   ├── saved-search.ts
│   │   │   ├── user.ts
│   │   │   └── errors/                      # (INFRA-001 신규)
│   │   ├── validators/                      # API-002 등 (기존)
│   │   ├── utils/                           # (기존: clipboard.ts 등)
│   │   ├── mappers/                         # API-002 등 (INFRA-001 신규)
│   │   ├── constants/                       # API-006 에러 매핑 (INFRA-001 신규)
│   │   ├── helpers/                         # API-006 헬퍼 (INFRA-001 신규)
│   │   ├── services/                        # DB-007 user-sync 등 (INFRA-001 신규)
│   │   ├── external/kakao-transport/        # API-007 (INFRA-001 신규)
│   │   └── supabase/                        # DB-007 server/middleware (INFRA-001 신규)
│   ├── mocks/                               # MOCK-001~005 (현실: src/mocks/, NOT src/lib/mocks/)
│   ├── features/                            # 도메인별 hooks/actions/utils (현실 구조)
│   │   ├── diagnosis/                       # CMD-DIAG-001/002 (현실: src/features/diagnosis/, NOT src/lib/diagnosis/)
│   │   ├── deadline/
│   │   ├── share/
│   │   └── single/
│   ├── components/                          # UI 컴포넌트 (기존, UI-001~014 후행)
│   ├── stores/                              # Zustand (기존)
│   ├── providers/                           # React context (기존)
│   ├── generated/prisma/                    # Prisma generated client (.gitignore 됨)
│   └── middleware.ts                        # CMD-AUTH-003 (현 dev guard 보존, auth 검증 통합 예정)
├── prisma/
│   ├── schema.prisma                        # DB-001~007
│   ├── seed.ts
│   └── migrations/
├── __tests__/                               # (INFRA-001 신규: db/types/validators/mappers/helpers/services/integration/mocks 8개 서브)
├── public/
├── next.config.ts                           # withSentryConfig silent skip 패턴 (INFRA-001 수정)
├── vercel.json                              # (INFRA-001 신규)
├── sentry.client.config.ts                  # (INFRA-001 신규, placeholder)
├── sentry.server.config.ts                  # (INFRA-001 신규, placeholder)
├── sentry.edge.config.ts                    # (INFRA-001 신규, placeholder)
├── .env.example                             # 8종 환경변수
├── .gitignore
├── package.json                             # dependencies 13, devDependencies 13
└── tsconfig.json                            # path alias: @/* → ./src/*
```

### 배치 1~4 import 경로 정합성 검증

**tsconfig path alias 전제:** `"paths": { "@/*": ["./src/*"] }` — 즉 `@/foo` 는 실제 `src/foo` 로 해석된다.

| 기존 ISSUE | import 경로 | 실제 파일 위치 | 정합성 |
|---|---|---|---|
| DB-001 | `@/lib/db` | `src/lib/db.ts` | ✅ |
| DB-007 | `@/lib/supabase/server`, `@/lib/supabase/middleware` | `src/lib/supabase/` (INFRA-001 신규) | ✅ |
| DB-007 | `@/lib/services/user-sync` | `src/lib/services/user-sync.ts` (INFRA-001 신규 디렉토리) | ✅ |
| API-001 | `@/lib/types/auth`, `@/lib/mappers/auth-mapper`, `@/lib/constants/auth-errors`, `@/lib/helpers/auth-error` | `src/lib/types/`, `src/lib/mappers/`, `src/lib/constants/`, `src/lib/helpers/` (INFRA-001 신규) | ✅ |
| API-002 | `@/lib/types/diagnosis`, `@/lib/validators/diagnosis`, `@/lib/constants/diagnosis-errors`, `@/lib/mappers/diagnosis-mapper` | 동일 (src/lib/* 매핑) | ✅ |
| API-003 | `@/lib/types/share-link`, `@/lib/validators/share-link`, `@/lib/constants/share-link-errors` | 동일 (src/lib/* 매핑) | ✅ |
| API-005 | `@/lib/types/saved-search-api`, `@/lib/validators/saved-search-api`, `@/lib/constants/saved-search-errors` | 동일 (src/lib/* 매핑) | ✅ |
| API-007 | `@/lib/external/kakao-transport/` | `src/lib/external/kakao-transport/` (INFRA-001 신규) | ✅ |
| MOCK-001~005 | `@/mocks/diagnosis`, `@/mocks/share-link` 등 | `src/mocks/` (현실 경로, E.X1: 명세를 현실로 갱신 — 코드 이동 없음) | ✅ |
| CMD-DIAG-001/002 | `@/features/diagnosis/` | `src/features/diagnosis/` (현실 경로, E.X2: 명세를 현실로 갱신 — 코드 이동 없음) | ✅ |
| CMD-DIAG-004 | `@/app/actions/diagnosis` | `src/app/actions/diagnosis.ts` | ✅ |
| QRY-DIAG-001 | `@/app/api/diagnosis/[id]/route` | `src/app/api/diagnosis/[id]/route.ts` | ✅ |
| CMD-AUTH-001 | `@/app/auth/callback/route` | `src/app/auth/callback/route.ts` | ✅ |
| CMD-AUTH-003 | `@/middleware` | `src/middleware.ts` (기존 dev guard 보존, CMD-AUTH-003 에서 auth 검증 통합) | ✅ |

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 태스크에서의 사용처 |
|---|---|---|
| None (최하위 기반) | — | INFRA-001은 모든 태스크의 시작점 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [x] **3.1** Next.js 프로젝트 (기존 onday-app/ 베이스 인정 — 신규 부트스트랩 없음)
  > 본 명령은 historical reference. 실제 INFRA-001 은 `onday-app/` 기존 코드 위에 보강만 수행한다.
  > 신규 create-next-app 실행 시 기존 산출물(prisma/schema.prisma, src/components/ 31종, src/features/, src/stores/ 등) 전부 손실.
  ```bash
  # historical reference (실제 실행 안 함)
  npx -y create-next-app@latest ./ \
    --typescript --app --tailwind --eslint \
    --src-dir=true --import-alias="@/*" \
    --use-npm
  ```
  - `--app`: App Router 강제
  - `--typescript`: TypeScript 강제
  - `--tailwind`: Tailwind CSS (CON-12)
  - `--src-dir=true`: src/ 디렉토리 사용 (현실 onday-app/ 정합, path alias `@/* → ./src/*`)
  - `--import-alias="@/*"`: path alias 설정

- [x] **3.2** `package.json` dependencies 설치 — INFRA-001 에서 누락분 8종 보강
  > onday-app/ 에 이미 설치되어 있던 것: next ^15.5.15, react ^19.2.5, react-dom ^19.2.5, @prisma/client ^7.8.0, prisma ^7.8.0, zod ^4.3.6, tailwindcss ^3.4.19, typescript ^5, ESLint ^9 등
  > 본 ISSUE 에서 실제 설치한 8종 (Next 15/React 19 호환 latest):
  ```bash
  npm install @supabase/ssr@^0.10 @supabase/supabase-js@^2.105 \
    @sentry/nextjs@^10 bcryptjs@^3

  npm install -D @types/bcryptjs@^2.4 vitest@^4 \
    @playwright/test@^1.60 msw@^2.14
  ```
  > 추가로 `npm audit fix` (--force 없음) 적용 — 9 → 5 (high 2건 + moderate 2건 해결, 잔여 5건은 SEC-002 위임).

- [ ] **3.3** `package.json` 최종 dependencies 확인
  ```json
  {
    "dependencies": {
      "next": "^15.5.15",
      "react": "^19.2.5",
      "react-dom": "^19.2.5",
      "@supabase/ssr": "^0.10.3",
      "@supabase/supabase-js": "^2.105.4",
      "@prisma/client": "^7.8.0",
      "@sentry/nextjs": "^10.53.1",
      "zod": "^4.3.6",
      "bcryptjs": "^3.0.3",
      "@base-ui/react": "^1.4.1",
      "@prisma/adapter-better-sqlite3": "^7.8.0",
      "@tanstack/react-query": "^5.100.6",
      "zustand": "^5.0.12"
    },
    "devDependencies": {
      "prisma": "^7.8.0",
      "typescript": "^5",
      "@types/node": "^20",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      "@types/bcryptjs": "^2.4.6",
      "vitest": "^4.1.6",
      "@playwright/test": "^1.60.0",
      "msw": "^2.14.6",
      "tailwindcss": "^3.4.19",
      "postcss": "^8.5.12",
      "autoprefixer": "^10.5.0",
      "eslint": "^9",
      "eslint-config-next": "16.2.4"
    }
  }
  ```
  > 명세 v1.0 (Next 14/React 18/Prisma 5/Zod 3) 대비 메이저 상향. CLAUDE.md §2 "Next.js 15+" 정합. 본 버전 표는 onday-app 현 상태를 SSoT 로 추인한다. **주의:** bcryptjs v3 (ESM 전환), vitest v4 (config schema 변경) — §9 Open Questions 참조.

- [x] **3.4** 디렉토리 구조 보강 (INFRA-001 신규 7 + 8 = 15 디렉토리)
  > onday-app 에 이미 있던 것: `src/app/`, `src/lib/{utils,validators}`, `src/components/`, `src/features/`, `src/mocks/`, `src/stores/`, `src/providers/`, `src/generated/prisma/`, `prisma/`, `public/`, `docs/`.
  > 본 ISSUE 에서 실제 보강한 것 (`.gitkeep` 으로 빈 디렉토리 git 추적):
  ```bash
  mkdir -p src/lib/{types/errors,mappers,constants,helpers,services,supabase,external/kakao-transport}
  mkdir -p __tests__/{db,types,validators,mappers,helpers,services,integration,mocks}
  mkdir -p src/app/actions src/app/auth/callback
  ```
  > 기존 `src/lib/utils/`, `src/lib/validators/` 는 보존 (clipboard.ts 등 기존 파일 그대로).

- [x] **3.5** `tsconfig.json` path alias 확인 (onday-app 현 상태 정합)
  ```json
  {
    "compilerOptions": {
      "paths": { "@/*": ["./src/*"] }
    }
  }
  ```
  > `--src-dir=true` 채택의 결과. 모든 `@/foo` import 는 `src/foo` 로 해석. 후속 ISSUE 의 `@/lib/...`, `@/mocks/...`, `@/features/...` import 도 동일 규칙 적용.

- [x] **3.6** `.env.example` 환경변수 템플릿 (8종, onday-app 현 상태 정합)
  ```env
  # Supabase (DB-007/CMD-AUTH)
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=

  # Kakao (API-007)
  NEXT_PUBLIC_KAKAO_MAP_KEY=
  KAKAO_MOBILITY_API_KEY=

  # AI (INFRA-005)
  AI_PROVIDER=google
  GOOGLE_GENERATIVE_AI_API_KEY=

  # App
  NEXT_PUBLIC_USE_MOCK=true
  NEXT_PUBLIC_APP_URL=http://localhost:3000

  # Sentry (REQ-NF-035, MON-001)
  NEXT_PUBLIC_SENTRY_DSN=
  # SENTRY_AUTH_TOKEN: source map upload 용. MON-001에서 실제 값 설정.
  SENTRY_AUTH_TOKEN=

  # Database (DB-001)
  DATABASE_PROVIDER=sqlite
  DATABASE_URL=file:./dev.db
  ```
  > 명세 v1.0 의 `KAKAO_REST_API_KEY`, `SENTRY_DSN` (server-only) 대신 onday-app 현 키 (`NEXT_PUBLIC_KAKAO_MAP_KEY` + `KAKAO_MOBILITY_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`) 채택. `SENTRY_AUTH_TOKEN` 만 INFRA-001 에서 신규 추가. sentry.server.config.ts 는 `SENTRY_DSN || NEXT_PUBLIC_SENTRY_DSN` fallback 패턴이라 양쪽 호환.

- [x] **3.7** `.gitignore` 보강 (onday-app 기존 항목 보존 + `.env.production` 1줄 추가)
  > onday-app 에 이미 있던 항목: `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`, `.vercel`, `prisma/dev.db`, `prisma/dev.db-journal`, `*.db` (glob), `/src/generated/prisma`, `.sentryclirc` 등.
  > INFRA-001 신규 추가 (명세 §3.7 정합):
  ```gitignore
  .env.production
  ```
  > `prisma/shadow.db` 는 `*.db` glob 으로 이미 포괄. `/src/generated/prisma` 는 기존 line 57 에 이미 존재 — `vercel.json` 의 `npx prisma generate` 가 매 빌드마다 생성해도 repo 추적 안 됨 (Phase 초반 리스크 #3 해결).

- [x] **3.8** Sentry 초기화 설정 (REQ-NF-035) — Wizard 대체, 수동 placeholder 작성
  > `npx @sentry/wizard@latest -i nextjs` 은 인터랙티브 + Sentry 계정 인증 필요 → 1인 MVP 단계에서 회피.
  > INFRA-001 에서는 수동 placeholder 3종 + `next.config.ts` silent skip 패턴 래핑.
  - 생성 파일:
    - `sentry.client.config.ts` — `process.env.NEXT_PUBLIC_SENTRY_DSN` 참조
    - `sentry.server.config.ts` — `SENTRY_DSN || NEXT_PUBLIC_SENTRY_DSN` fallback
    - `sentry.edge.config.ts` — server 와 동일 fallback
  - `next.config.ts` 수정: **silent skip 패턴** — DSN 환경변수가 없으면 `withSentryConfig` 래핑 자체를 skip (env-less build 무해).
    ```typescript
    const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    const finalConfig: NextConfig = sentryDsn
      ? withSentryConfig(nextConfig, { silent: true })
      : nextConfig;
    export default finalConfig;
    ```
  - MON-001 단계에서 DSN 연결 + Source map upload (SENTRY_AUTH_TOKEN) 활성화.

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
  - **Vercel Dashboard 작업 (사용자 수동, INFRA-001 종료 시점 action item):** Git 리포지토리 연결
  - **환경변수 등록 (Vercel Dashboard, 사용자 수동):** `DATABASE_URL`, `DATABASE_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_KAKAO_MAP_KEY`, `KAKAO_MOBILITY_API_KEY`, `AI_PROVIDER`, `GOOGLE_GENERATIVE_AI_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_USE_MOCK`, `NEXT_PUBLIC_APP_URL`
  > **AC-2 자동화 한계:** Vercel Dashboard 연동·env 등록은 CLI 자동화 불가. INFRA-001 = `vercel.json` 생성까지 = AC-2 사전 조건 완료. 실제 배포 검증은 사용자 수동 수행.

- [x] **3.10** 초기 랜딩 페이지 — `src/app/page.tsx` (onday-app 기존, 본 ISSUE 에서 수정 없음)
  > onday-app 에 이미 `/` → `/landing` redirect + `src/app/landing/landing-client.tsx` 본문 작성 완료. INFRA-001 단계에서는 손대지 않음.

- [x] **3.10-historical** (참고용) 명세 v1.0 의 placeholder 예시
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

- [x] **3.11** `middleware.ts` — 현 `src/middleware.ts` 보존, CMD-AUTH-003 에서 통합
  > onday-app/src/middleware.ts 에 이미 작동 중인 **dev guard** 존재: production 에서 `/dev/*` 라우트를 404 차단 (`/dev` 시각 검증 페이지가 prod 노출 안 되도록).
  > INFRA-001 단계에서 이 파일을 명세 placeholder 로 덮어쓰면 기능 회귀 → **본 ISSUE 에서 손대지 않음 (Phase D.2 폐기 결정).**
  > CMD-AUTH-003 에서 Supabase Auth 세션 검증 로직 추가 시 dev guard 와 한 파일에 통합 예정 (matcher 병합 또는 별도 함수 chain).
  ```typescript
  // 현재 src/middleware.ts (보존):
  import { NextResponse } from "next/server";

  export function middleware() {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  export const config = {
    matcher: ["/dev", "/dev/:path*"],
  };
  ```

- [x] **3.12** 로컬 개발 서버 실행 및 검증
  - 명령어: `npm run dev` (onday-app/ 안에서)
  - 검증: `http://localhost:3000` 접속, `/landing` redirect 확인 (onday-app 기존 랜딩 페이지)
  - INFRA-001 추가 검증: `npx tsc --noEmit` exit 0 + env-less `npm run build` exit 0 + 13개 라우트 정상 빌드 (Phase F 참조)

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

**AC-5 (정합성):** 배치 1~4 ISSUE의 import 경로와 디렉토리 구조 일치 (tsconfig path alias `@/* → ./src/*` 기준)
- **Given** 배치 1~4 ISSUE에서 사용된 모든 import 경로 (`@/lib/db`, `@/lib/types/auth`, `@/lib/supabase/server`, `@/mocks/*`, `@/features/diagnosis/*` 등)
- **When** 본 ISSUE의 onday-app/ 디렉토리 구조와 대조
- **Then** 모든 import 경로가 실제 `src/...` 위치와 매핑 가능
- **And** `src/lib/services/` 디렉토리가 INFRA-001 신규 보강으로 추가되어 DB-007의 `@/lib/services/user-sync` 경로도 지원

**AC-6 (정합성):** package.json 핵심 dependencies 9개 이상
- **Given** 본 ISSUE의 `package.json` dependencies
- **When** 핵심 패키지 수 확인
- **Then** next, react, react-dom, @supabase/ssr, @supabase/supabase-js, @prisma/client, @sentry/nextjs, zod, bcryptjs 등 9개 이상 + 기존 onday-app 의 @base-ui/react, @tanstack/react-query, zustand, @prisma/adapter-better-sqlite3 포함 → 13+ 충족

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용 (Vercel 통합)" (§4.2.6) | `@sentry/nextjs@^10` 설치 + 수동 placeholder (sentry.{client,server,edge}.config.ts) + `next.config.ts` silent skip 래핑. `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` 환경변수 가이드 포함. 실제 DSN 연결은 MON-001. |
| REQ-NF-024 | "월 인프라 비용 (MVP 기준) — 무료 ~ 10만원 이하" (§4.2.4) | Vercel 무료 티어 사용. Hobby Plan 범위 내 배포 (Serverless Function 10초 timeout 인지) |
| CON-15 | "배포 및 인프라는 Vercel 플랫폼으로 단일화한다. Git Push만으로 배포 자동화한다." (§1.2.3) | `vercel.json` + Git 리포지토리 연결로 Push → 자동 배포 파이프라인 구성 |

---

## 6. 📦 Deliverables (산출물 명시)

### INFRA-001 신규 산출물 (onday-app/ 안에 추가)
- `onday-app/vercel.json` (Vercel 배포 설정)
- `onday-app/sentry.client.config.ts` (Sentry client placeholder)
- `onday-app/sentry.server.config.ts` (Sentry server placeholder, DSN fallback)
- `onday-app/sentry.edge.config.ts` (Sentry edge placeholder)
- `onday-app/src/lib/{types/errors,mappers,constants,helpers,services,supabase,external/kakao-transport}/.gitkeep` (7종)
- `onday-app/__tests__/{db,types,validators,mappers,helpers,services,integration,mocks}/.gitkeep` (8종)

### INFRA-001 수정 산출물
- `onday-app/next.config.ts` (`withSentryConfig` silent skip 패턴 추가)
- `onday-app/package.json` (dependencies 4종 + devDependencies 4종 추가, 합 13+13)
- `onday-app/package-lock.json` (deps + audit fix 패치 반영)
- `onday-app/.env.example` (`SENTRY_AUTH_TOKEN` 1줄 추가)
- `onday-app/.gitignore` (`.env.production` 1줄 추가)

### INFRA-001 명세 갱신 산출물
- `tasks/INFRA-001.md` (본 문서 — 현실 추인: 버전, 디렉토리, path alias, .env.example, middleware 보존 등)

### onday-app 기존 산출물 (INFRA-001 에서 손대지 않음 — 보존)
- `onday-app/src/app/` (page.tsx, layout.tsx, landing, login, diagnosis, deadline, share, single, dev, api)
- `onday-app/src/middleware.ts` (dev guard, CMD-AUTH-003 에서 통합)
- `onday-app/src/lib/{utils,validators}/` (기존 파일 보존)
- `onday-app/src/{components,features,stores,providers,mocks,generated}/` (기존 보존)
- `onday-app/prisma/{schema.prisma,seed.ts,migrations/}` (DB-001 영역)
- `onday-app/tsconfig.json`, `eslint.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json` (기존)

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

- **로컬 실행:** `npm run dev` (onday-app/ 안에서) → `http://localhost:3000` → `/landing` redirect 정상 표시
- **빌드 검증:** `npm run build` — exit 0, 13개 라우트 정상 빌드
- **env-less 빌드 검증 (AC-4):** `.env`/`.env.local` 임시 백업 후 `npm run build` — exit 0 (silent skip 패턴 작동)
- **타입 검증:** `npx tsc --noEmit` — 에러 0건 (Phase B/C/D 각 단계에서 회귀 검증 통과)
- **Lint 검증:** `npm run lint` — 기존 warning 6건 (landing-client.tsx unused vars, INFRA-001 범위 외)
- **배포 검증 (AC-2):** vercel.json 생성 = 사전 조건 완료. 실제 Git Push → Vercel 빌드는 사용자 수동 (Dashboard 연동 + env 등록 후).
- **디렉토리 검증:** 배치 1~4 ISSUE의 모든 import 경로(`@/lib/...`, `@/mocks/...`, `@/features/...`)가 `src/...` 위치와 매핑 가능한지 `find` 로 확인
- **CI 게이트:** `tsc --noEmit`, `npm run build` 통과 (lint warning 은 후속 ISSUE 영역)

---

## 9. 🚧 Open Questions / Risks (보류 사항)

### 정합성 follow-up (배치 1~4 검증 결과)

| 갱신 대상 ISSUE | 갱신 사유 | 우선순위 |
|---|---|---|
| DB-007.md | `@/lib/services/user-sync` import 경로 사용 — INFRA-001 에서 `src/lib/services/` 신규 생성으로 정합 | ✅ 해결 |
| MOCK-001~005 | 명세 v1.0 의 `@/lib/mocks/...` 경로 → INFRA-001 갱신본은 `@/mocks/...` (현실 src/mocks/ 정합). MOCK-* ISSUE 의 import 경로 명세도 동일 갱신 필요 | follow-up |
| CMD-DIAG-001/002 | 명세 v1.0 의 `@/lib/diagnosis/...` 경로 → INFRA-001 갱신본은 `@/features/diagnosis/...` (현실 src/features/diagnosis/ 정합). CMD-DIAG-* ISSUE 의 import 경로 명세도 동일 갱신 필요 | follow-up |
| 배치 1~4 전체 | 위 2종 외 import 경로 정합 확인됨 | — |

### 기타 보류 사항

1. **~~Next.js 14 vs 15~~** ✅ **CLOSED** — Next 15.5.15 확정 (onday-app 현 상태 + CLAUDE.md §2 "Next.js 15+" 정합). 명세 v1.0 의 `^14.2.0` 표기는 본 ISSUE 에서 `^15.5.15` 로 갱신됨.
2. **Vercel 무료 티어 Serverless 10초 Timeout:** REQ-FUNC-003에서 이미 Client Component 병렬 처리로 우회 전략이 명시됨. 본 ISSUE에서는 인지만 하고, 실제 우회는 CMD-DIAG-002에서 구현.
3. **Tailwind CSS v3 vs v4:** onday-app 현 상태 = Tailwind v3.4.19. INFRA-004(디자인 시스템)에서 상세 설정 (현재 v3 유지 가능성 높음).
4. **bcryptjs v3 (ESM 전환) 주의:** 명세 v1.0 의 `^2.4.3` 대비 v3.0.3 메이저 점프. v2 의 `import bcrypt from 'bcryptjs'` (CommonJS default) 형식이 v3 에서는 ESM named export 패턴으로 변경됨. **CMD-SHARE-001 / CMD-SHARE-004 (ShareLink 비번 hash) 작업 시 import 형식 + hash/compare API 호환성 확인 필수.** 호환성 깨지면 v2 로 다운그레이드 또는 사용처에서 import 형식 수정.
5. **vitest v4 (config schema 변경) 주의:** 명세 v1.0 의 `^2.0.0` 대비 v4.1.6 메이저 2단계 점프. v2 의 `vitest.config.ts` schema 가 v4 에서 일부 옵션 deprecated / 신규 옵션 추가. **TEST-* (vitest config 작성) 작업 시 v4 schema 기준으로 작성 필수.** plugin (@vitejs/plugin-react 등) 추가 설치 필요할 수 있음 — INFRA-001 에서는 미설치, TEST-* 에서 결정.
6. **SEC-002 follow-up (`npm audit` 잔여 5건):** INFRA-001 에서 `npm audit fix` (--force 없음) 적용 후 5건 (모두 moderate) 잔존. 해결하려면 `--force` 필요 (prisma v7→v6, next v15→v9 메이저 다운그레이드 동반 — 사실상 프로젝트 재작성). **SEC-002 에서 재평가** — Rate Limiting Middleware 와 함께 보안 정책 통합 검토.
7. **AC-2 자동화 한계:** Vercel Dashboard 연동 + 환경변수 등록은 CLI 자동화 불가. INFRA-001 종료 시점에 사용자 수동 action item 으로 분리 (vercel.json 생성까지 = 사전 조건 완료).
