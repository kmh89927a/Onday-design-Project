# Harness Audit Report v1.0

**문서 ID:** HARNESS-AUDIT-001
**작성일:** 2026-05-16
**감사 범위:** `prototypes/design/` 직속 레벨의 harness 4종(.agents/.claude/.cursor/.gemini) + 4 README + AGENTS.md + CLAUDE.md, docs/ PRD(v1.1-rev.4)·SRS(v1.6) (읽기 전용)
**감사자:** Claude Code (자동 audit)
**상태:** Draft (Phase 1 — 기존 파일 수정 금지)

---

## 0. 핵심 요약 (Executive Summary)

| 항목 | 결과 |
| --- | --- |
| 실제 프로젝트 | **OnDay 온데이 (동네궁합진단기)** — Next.js 15 + Prisma + Supabase + Vercel AI SDK + Gemini + Vercel 배포 |
| Harness 4종 정렬도 | **❌ 거의 0%** — 모든 harness 가 잘못된 스택(Spring Boot/Java/Python/Kafka/Redis)을 기술 |
| 유일한 정합 항목 | `.claude/settings.local.json` permissions (Next.js/Prisma) |
| 잘못 기술된 프로젝트 (잔재) | "AI Co-Pilot for First-time Founders" (사업계획서 작성), "Pollosseum" (group id), 일반 Spring Boot CRUD |
| 우선 권고 | Phase 2 재정립 즉시 착수. 5개 솔루션 전체 rebuild (이전 잔재는 archive 또는 삭제) |

> **결론:** 현재 harness 는 OnDay 프로젝트의 자산이 아니라 **이전 강의·다른 프로젝트의 템플릿 잔재**다. AI 에이전트가 이 컨텍스트로 작업하면 PRD/SRS 와 정반대 방향의 코드를 생성한다. 부분 수정으로 회복할 수 없으며, 5개 솔루션 모두 재작성이 필요하다.

---

## 1. 현재 Harness 인벤토리

### 1-1. 솔루션별 파일·정의 수

| 솔루션 | 파일/폴더 | 정의된 규칙·아티팩트 수 | 상태 |
| --- | --- | ---: | --- |
| **Antigravity / Gemini CLI** | `.agents/rules/` | 3 (`001`,`002`,`003`) | ⚠️ 템플릿 비어있음 + 타 프로젝트 스택 |
| Antigravity 공용 | `.agents/workflows/` | 2 (rule 생성, srs→task) | ✅ 메타 도구, 재사용 가능 |
| Antigravity 공용 | `.agents/skills/` | **0 (디렉토리 부재)** | ❌ README-common이 권장하는 표준 위치 미생성 |
| **Claude Code** | `.claude/agents/` | 8 (java-spring, react-frontend, flutter-app, gradle, jpa-querydsl, kafka-pipeline, kafka-saga, spring-redis) | ❌ 8개 모두 PRD/SRS 와 무관한 스택 |
| Claude Code | `.claude/commands/` | 3 (fix-error, gitflow-commit, setup-env) | ✅ 도메인 비특화 (재사용 가능) |
| Claude Code | `.claude/skills/` | **0 (디렉토리 부재)** | ⚠️ README-claude 권장 위치 미사용 (`commands/` 만 존재) |
| Claude Code | `.claude/settings.local.json` | 5 (npm run, npx next, npm install, npx prisma, npx tsx) | ✅ **유일하게 PRD/SRS 와 정합** |
| **Cursor** | `.cursor/rules/` | 3 (`001`,`002`,`003`) | ⚠️ 001 비어있는 템플릿, 002 stale 스택 |
| Cursor | `.cursor/agents/` | 1 (document-updater) | ✅ 메타 도구, 재사용 가능 |
| Cursor | `.cursor/skills/` | 21 (100·101·102·200·201·202·300·301·**302×2**·**303×2**·**304×2**·**305×2**·**306×2**·307·generate-cursor-rule·generate-tasks-from-srs) | ❌ 번호 충돌 5건 + 도메인 무관 다수 |
| Cursor | `.cursor/hooks.json` | **0 (파일 부재)** | ⚠️ README-cursor 권장 항목 미설정 |
| **Gemini CLI / Antigravity** | `.gemini/agents/` | 1 (readme-architect) | ❌ README-gemini 가 요구하는 다른 디렉토리 모두 부재 |
| Gemini | `.gemini/rules/`·`skills/`·`workflows/` | **0 (디렉토리 부재)** | ❌ 사실상 미구성 |
| **루트 글로벌** | `AGENTS.md` | 1 파일, 71 줄 | ❌ "AI Co-Pilot for Founders" 콘텐츠 (다른 프로젝트) |
| 루트 글로벌 | `CLAUDE.md` | 1 파일, 105 줄 | ❌ Spring + Thymeleaf + Redis + Kafka (PRD 와 무관) |
| **가이드 README** | 4 파일 | README-common/claude/cursor/gemini | ✅ 일반 가이드로서 품질 양호, 단 본 프로젝트 적용 사례 0 |

### 1-2. 발견된 "이전 프로젝트 잔재" 증거

| 위치 | 잔재 흔적 | 추정 원본 프로젝트 |
| --- | --- | --- |
| `AGENTS.md` §001 Vision | "Submission Wizard", "Financial Auto-Engine", "PMF Diagnostic", "HWP/PDF Export" | AI Co-Pilot for First-time Founders (사업계획서) |
| `AGENTS.md` §002 | Spring Boot 4.0.0 + Java 21 + Python FastAPI + LangChain + Google Gemini + MySQL | AI Co-Pilot |
| `.agents/rules/001` | `[PROJECT NAME]`, `[Description]` 등 미치환 placeholder | 빈 템플릿 |
| `.agents/rules/002` | Spring Boot 4.0.0 + Java 21 + Python + FastAPI + LangChain + MySQL | AI Co-Pilot |
| `.agents/rules/003` | "Wizard Latency: Step transitions < 800ms", "HWP/PDF 100% match" | AI Co-Pilot |
| `.cursor/rules/001` | `[PROJECT NAME]`, `[Description]` 미치환 | 빈 템플릿 |
| `.cursor/rules/002` | Thymeleaf + Redis + Kafka + Hugging Face/OpenAI | (또 다른 프로젝트 — 가칭 "Spring 전통 풀스택") |
| `.cursor/skills/301-gradle` | `group = 'com.pollosseum'` | "Pollosseum" 프로젝트 (강의용?) |
| `.cursor/skills/306-three-tier-architecture` | `BusinessPlanController`, `BusinessPlanService`, `BusinessPlanRepository` 예시 | AI Co-Pilot (사업계획서) |
| `CLAUDE.md` §2 | Spring Boot 3.x + Redis + Kafka + Thymeleaf | "Spring 전통 풀스택" |

> **결론:** 최소 **3개 이상의 서로 다른 이전 프로젝트** 컨텍스트가 harness 에 동시에 잔존하며, 그 어느 것도 OnDay/동네궁합진단기 아니다.

---

## 2. PRD/SRS 정렬도 매트릭스

### 2-1. PRD/SRS 핵심 항목 추출 (Ground Truth)

| 항목 | PRD/SRS 정의 (Ground Truth) | 근거 |
| --- | --- | --- |
| **G1. 프로젝트명** | 내 하루 동선 맞춤 동네 궁합 진단기 (OnDay) | PRD 표제 |
| **G2. 도메인** | 프롭테크 + 하이퍼로컬 + 초개인화 큐레이션 | PRD §1-2 |
| **G3. 핵심 페르소나** | 3040 맞벌이 부부·맹모삼천지교·긴급 이사·반복 이사·이직 후 이사 | PRD §2 |
| **G4. 풀스택 프레임워크** | **Next.js 15+ (App Router)** 단일 (FE/BE 분리 금지) | SRS CON-09, CON-10 |
| **G5. 서버 측 로직** | Server Actions / Route Handlers (별도 백엔드 서버 없음) | SRS CON-10, §3.3 |
| **G6. DB·ORM** | **Prisma ORM** + SQLite(로컬) / **Supabase PostgreSQL**(프로덕션) | SRS CON-11, §6.2 |
| **G7. UI·스타일링** | **Tailwind CSS + shadcn/ui** | SRS CON-12 |
| **G8. LLM 통합** | **Vercel AI SDK** (Next.js 내부) + **Google Gemini API** | SRS CON-13, CON-14 |
| **G9. 배포·인프라** | **Vercel** 단일 (Git Push 자동 배포) | SRS CON-15 |
| **G10. 인증** | **Supabase Auth (@supabase/ssr)** + 카카오/네이버 OAuth (NextAuth 사용 금지) | SRS CON-18, REQ-FUNC-029 |
| **G11. 모니터링** | Sentry (기본 알림) + Vercel Analytics + Mixpanel/Amplitude | SRS §4.2.6 |
| **G12. 외부 API** | 카카오 모빌리티(교통), 국토부 실거래가, 경찰청 범죄통계, 교육부 학교배정, 매물 아웃링크 | SRS §3.1 |
| **G13. 지역 커버리지** | 수도권(서울·경기·인천) 한정 | SRS CON-03, ADR-003 |
| **G14. Out of Scope** | PG 결제·매물 중개·지방 커버리지·시나리오 비교·행정동 매핑·AES-256·OWASP DAST | SRS §1.2.2 |
| **G15. 1인 MVP 제약** | Vercel 무료 티어 10초 Serverless Timeout → 무거운 연산은 Client Component 에서 Promise.all | SRS REQ-FUNC-003, §6.3.1 |
| **G16. 성능 NFR** | 교차 계산 p95 ≤ 8s (clt), 페이지 로딩 p95 ≤ 1.5s, 공유 링크 p95 ≤ 2s | SRS §4.2.1 |
| **G17. 북극성 KPI** | 진단 완료 수/주 (50 → 200건) | PRD §1-4, SRS REQ-NF-026 |
| **G18. 보안 (MVP)** | TLS 만 (Supabase 기본). AES-256·ISMS-P 제외 | SRS CON-16, REQ-NF-018 |
| **G19. 데이터 모델** | USER / DIAGNOSIS / SHARE_LINK / SAVED_SEARCH (PAYMENT 제거) | SRS §6.2 |
| **G20. 개발자 컨텍스트** | 1인 개발 / 3년차 IT기획 퍼블리셔 + 초급 SW | SRS Rev 1.5 changelog |

### 2-2. 정렬도 매트릭스 (✅ 정합 / ⚠️ 부분 정합 / ❌ 부재·오정합)

| Ground Truth | `AGENTS.md` | `CLAUDE.md` | `.agents/` | `.claude/` | `.cursor/` | `.gemini/` |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| G1. 프로젝트명 (OnDay) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G2. 도메인 (프롭테크) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G3. 페르소나 (맞벌이·긴급이사) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G4. Next.js 단일 풀스택 | ❌ (Spring) | ❌ (Spring) | ❌ (Spring) | ❌ (Spring agents) | ❌ (Spring skills) | ❌ |
| G5. Server Actions / Route Handlers | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G6. Prisma + Supabase PG | ❌ (MySQL+JPA) | ❌ (Redis+JPA) | ❌ (MySQL+JPA) | ❌ (jpa-querydsl agent) | ❌ (303-mysql-jpa) | ❌ |
| G7. Tailwind + shadcn/ui | ⚠️ (Tailwind만) | ⚠️ (Tailwind만) | ❌ | ⚠️ (react-frontend Tailwind만, Vite 가정) | ⚠️ (306-vite-tailwind) | ❌ |
| G8. Vercel AI SDK + Gemini | ❌ (LangChain) | ❌ (HF/OpenAI) | ❌ (LangChain) | ❌ | ❌ (HF/OpenAI) | ❌ |
| G9. Vercel 배포 | ❌ | ❌ | ❌ | ✅ (settings.local) | ❌ | ❌ |
| G10. Supabase Auth (카카오·네이버) | ❌ (Google·Kakao OAuth2) | ❌ | ❌ | ❌ | ❌ (Kakao만 언급) | ❌ |
| G11. Sentry + Vercel + Mixpanel | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G12. 외부 API (카카오모빌리티 등) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G13. 수도권 한정 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G14. Out-of-Scope (결제·중개) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G15. Vercel 10s Timeout 회피 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G16. 성능 NFR | ⚠️ (다른 수치) | ❌ | ⚠️ (다른 수치) | ❌ | ❌ | ❌ |
| G17. 북극성 KPI (진단 완료 수) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G18. TLS만 (AES-256 제외) | ❌ (AES-256 명시) | ❌ | ❌ (AES-256 명시) | ❌ | ❌ | ❌ |
| G19. 데이터 모델 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| G20. 1인 개발 컨텍스트 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**정합 셀 비율: 1 / 120 ≈ 0.8% (⚠️ 5건 포함 시 ≈ 5%)**

> `.claude/settings.local.json`이 유일하게 PRD/SRS 와 정합. 나머지 모든 harness 자산은 잘못된 방향성을 제공한다.

---

## 3. 솔루션 간 일관성 검토

### 3-1. 동일 규칙이 다르게 표현된 항목

| 규칙 | AGENTS.md | CLAUDE.md | .agents/rules | .cursor/rules | .claude/agents | 비고 |
| --- | --- | --- | --- | --- | --- | --- |
| **Spring Boot 버전** | 4.0.0 | 3.x (CLAUDE.md §2) | 4.0.0 | (미명시) | 3.x (java-spring.md) | ⚠️ AGENTS 와 CLAUDE 가 메이저 버전 충돌 |
| **Java 버전** | 21 | 17+ | 21 | (미명시) | 17+ | ⚠️ 동일 충돌 |
| **DB** | MySQL 8.x | (CLAUDE 미명시) | MySQL 8.x | (미명시) | (jpa-querydsl 일반) | ⚠️ |
| **LLM Provider** | Google Gemini (Internal Gateway) | Hugging Face + OpenAI | Google Gemini | Hugging Face + OpenAI | (미명시) | ❌ Gemini vs HF/OpenAI 충돌 |
| **OAuth** | (미명시) | Google + KakaoTalk | (미명시) | Google + KakaoTalk | (미명시) | ⚠️ |
| **AES-256 암호화** | (미명시) | (미명시) | TLS+AES-256 명시 | (미명시) | (미명시) | ❌ SRS 는 "제외" |
| **Frontend** | Vite+React+TS | React+Tailwind | Vite+React+TS | React+Tailwind | react-frontend → Vite | ❌ 실제는 Next.js |
| **Python FastAPI 사용 여부** | "AI/Doc Engine" 으로 사용 | (CLAUDE 미명시) | 사용 명시 | (없음) | (없음) | ❌ 일관성 없음, 실제로 미사용 |

### 3-2. 한 솔루션에만 있고 다른 곳에 없는 규칙

| 규칙 | 존재 위치 | 부재 위치 | 영향 |
| --- | --- | --- | --- |
| Git Flow / Conventional Commits | `.claude/commands/gitflow-commit.md`, `.cursor/skills/102`, `.cursor/skills/200` | `.agents/`, `.gemini/`, AGENTS.md, CLAUDE.md | Gemini/Antigravity 사용자는 커밋 규칙을 모름 |
| 7단계 에러 진단 | `.claude/commands/fix-error.md`, `.cursor/skills/100` | `.agents/`, `.gemini/`, AGENTS.md, CLAUDE.md | 동일 |
| Build & Env Setup | `.claude/commands/setup-env.md`, `.cursor/skills/101` | `.agents/`, `.gemini/` | 동일 |
| GitHub Issue 자동화 (`gh` CLI) | `.cursor/skills/202` | 모두 (Claude 포함) | Claude 사용자도 동일 절차 필요 |
| Document Updater (커밋 전 docs 동기화) | `.cursor/agents/document-updater.md` | 모두 | 동일 |
| 3-tier 아키텍처 | `.cursor/skills/306-three-tier-architecture` | 모두 | (단, OnDay 는 Next.js 라 3-tier 부적합 → 실제로는 모두 부재가 맞음) |
| Redis Lettuce vs Redisson | `.claude/agents/spring-redis.md`, `.cursor/skills/303-spring-redis` | 모두 | (OnDay 는 Redis 사용 안 함) |
| Kafka pipeline / saga | `.claude/agents/kafka-*`, `.cursor/skills/304·305-kafka` | 모두 | (OnDay 는 Kafka 사용 안 함) |
| Flutter | `.claude/agents/flutter-app.md`, `.cursor/skills/307-flutter` | 모두 | (OnDay 는 모바일 앱 아님) |
| Python FastAPI | `.cursor/skills/302-python-fastapi` | 모두 | (OnDay 는 Python 사용 안 함) |
| OG 리치 프리뷰 (`generateMetadata`) | 없음 | 모두 | SRS §6.3.2 에 명시된 핵심 기능, 어떤 harness 도 안내 안 함 |
| Next.js Server Actions 가이드 | 없음 | 모두 | 핵심 기술, 가이드 0건 |
| Vercel 10초 Timeout 회피 패턴 | 없음 | 모두 | SRS REQ-FUNC-003 에 명시된 핵심 제약, 어떤 harness 도 안내 안 함 |
| Prisma schema 베스트프랙티스 | 없음 | 모두 | DB 의 SSoT, 가이드 0건 |
| Supabase Auth (@supabase/ssr) | 없음 | 모두 | 인증 기본 스택, 가이드 0건 |

### 3-3. 번호 충돌 (`.cursor/skills/`)

| 번호 | 충돌 파일 1 | 충돌 파일 2 | 조치 필요 |
| --- | --- | --- | --- |
| 302 | `302-jpa-querydsl-dynamic-query-rules` | `302-python-fastapi-rules` | 둘 다 OnDay 무관 → 삭제 또는 archive |
| 303 | `303-database-mysql-jpa-rules` | `303-spring-redis-lettuce-redisson-rules` | 둘 다 무관 |
| 304 | `304-api-rest-design-rules` | `304-kafka-data-pipeline-rules` | REST 일부 적용 가능 / kafka 무관 |
| 305 | `305-api-swagger-testing-rules` | `305-kafka-msa-saga-pattern-rules` | Swagger 무관 (Next.js → Swagger 사용 안 함) / kafka 무관 |
| 306 | `306-react-vite-tailwind-rules` | `306-three-tier-architecture-rules` | 둘 다 부적합 (Vite 아님 / 3-tier 아님) |

> 번호 충돌은 cursor 에이전트가 어느 스킬을 우선 로드할지 알 수 없게 만든다. `generate-cursor-rule` 메타 가이드(`.cursor/skills/generate-cursor-rule`)는 "단일 책임 원칙"과 "번호 대역 규약(001-099/100-199/200-299/300-399)"을 명시하지만, 실제 파일들이 그 규약을 위반함.

---

## 4. README 가이드 vs 현재 상태 갭

### 4-1. README-common-harness.md 권장 vs 현실

| 권장 항목 | 현재 상태 | 갭 |
| --- | --- | --- |
| `AGENTS.md` 에 공통 글로벌 규칙 작성 | AGENTS.md 존재하나 "AI Co-Pilot for Founders" 콘텐츠 | ❌ 콘텐츠 전면 재작성 필요 |
| `.agents/skills/` 디렉토리에 공용 스킬 중앙화 | **디렉토리 부재** (.agents/ 하위에 `rules/`+`workflows/` 만) | ❌ skills/ 미생성 |
| Symlink 로 `.cursor/skills`, `.claude/skills` 공유 | Symlink 0건. 각 솔루션이 독립적으로 정의 | ❌ 중복 유지보수 |
| 도구별 차별점은 README-{cursor/gemini/claude}-harness 참조 | README 가이드는 4개 모두 존재, 양호 | ✅ |

### 4-2. README-cursor-harness.md 권장 vs 현실

| 권장 항목 | 현재 상태 | 갭 |
| --- | --- | --- |
| `/create-rule` 슬래시로 Rule 생성 | 사용 흔적 없음, 수동 작성 | ⚠️ |
| `.cursor/rules/*.mdc` (`alwaysApply`·`globs`) | 3개 존재 (`001/002/003`) but `alwaysApply: true` 무차별 사용 + `globs` 모두 비어있음 | ⚠️ 토큰 비효율 |
| `.cursor/skills/<name>/SKILL.md` | 21개 존재. 번호 충돌 5건 + 도메인 오정합 다수 | ❌ |
| `disable-model-invocation: true` 가 필요한 메타 도구에 설정 | `generate-cursor-rule`·`generate-tasks-from-srs` 만 설정됨 | ✅ |
| `.cursor/agents/*.md` | 1개 (document-updater) | ⚠️ 부족 |
| `.cursor/hooks.json` | **부재** | ❌ Cursor 권장 4대 도구 중 1개 누락 |
| `alwaysApply` 최소화 + Skills 위주 온디맨드 | rules 3개 모두 `alwaysApply: true` | ❌ 토큰 낭비 |
| 영어 작성 권장 | rules 는 한국어, skills 는 영어/한국어 혼재 | ⚠️ 일관성 부족 |
| `/migrate-to-skills` 로 구형 commands 통합 | 적용 여부 불명, `.cursor/commands/` 디렉토리는 부재 | ✅ (이미 skills 구조) |

### 4-3. README-claude-harness.md 권장 vs 현실

| 권장 항목 | 현재 상태 | 갭 |
| --- | --- | --- |
| `CLAUDE.md` (항상 적용 컨텍스트) | 존재. 105줄. 단, 잘못된 스택 | ❌ |
| `.claude/skills/*/SKILL.md` 로 통합 (구 commands 대체) | **부재**. 여전히 `.claude/commands/` 사용 중 (3개) | ⚠️ 구 형식 잔존 |
| `context: fork` 프론트매터로 메인 컨텍스트 보호 | 미사용 | ⚠️ |
| `.claude/agents/*.md` (YAML frontmatter, tools, model, skills 주입) | 8개 존재. frontmatter 양호. `skills:` preload 미사용 | ⚠️ |
| `settings.local.json` 명시적 권한 | 5개 권한 설정. 단, Next.js/Prisma 만 (정합) | ✅ 유일한 정합 자산 |
| `/plugin marketplace add` 활용 | 적용 흔적 없음 | ⚠️ |

### 4-4. README-gemini-harness.md 권장 vs 현실

| 권장 항목 | 현재 상태 | 갭 |
| --- | --- | --- |
| `.agents/rules/*.md` (Rules — `globs`, `alwaysApply`) | 3개 존재. 잘못된 스택. `globs` 모두 `["**/*"]` | ❌ |
| `.agents/skills/*/SKILL.md` (Skills) | **디렉토리 부재** | ❌ |
| `.agents/workflows/*.md` (Workflows — 매크로) | 2개 존재. 메타 도구. ✅ | ✅ |
| `.gemini/agents/*.md` (Subagents — `tools`, `model: inherit`) | 1개 (readme-architect). `tools: [read_file, glob]`, `model: inherit` 적용 | ⚠️ 단 1개로 부족 |
| Gemini CLI `--context` 로 스킬 주입 사용 | 적용 사례 없음 | ⚠️ |
| `AGENTS.md` 공통 활용 | AGENTS.md 존재하나 잘못된 콘텐츠 | ❌ |

---

## 5. 우선순위 보강 항목 (Top 10)

> 평가 기준: ① PRD/SRS 와의 정렬도, ② 해당 갭이 AI 에이전트의 즉시 오류 생성 위험에 미치는 영향, ③ 보강 시 다른 항목 보강에 미치는 의존성.

| # | 갭 / 보강 항목 | 영향 솔루션 | 현재 상태 | 권장 조치 | 추정 공수 |
| --- | --- | --- | --- | --- | --- |
| **1** | **AGENTS.md 전면 재작성** (OnDay 비전·페르소나·Next.js 단일 풀스택) | 모든 도구 (공통 글로벌) | "Founders Co-Pilot" 콘텐츠 71줄 | PRD §1~2 + SRS CON-09~CON-18 반영 100~120줄로 재작성 | **2h** |
| **2** | **CLAUDE.md 전면 재작성** (Next.js + Prisma + Supabase + Vercel AI SDK) | Claude Code | Spring+Thymeleaf+Redis+Kafka 콘텐츠 105줄 | AGENTS.md 와 정합. Subagent 라우팅 표 재작성 (java-spring → next-fullstack 등) | **2h** |
| **3** | **`.agents/rules/001~003` 재작성** | Antigravity, Gemini | 001 비어있는 템플릿 + 002·003 stale 스택 | 001 OnDay 개요, 002 Next.js 스택, 003 1인 MVP 가이드라인 | **2h** |
| **4** | **`.cursor/rules/001~003` 재작성** | Cursor | 001 비어있는 템플릿 + 002·003 stale 스택 | `.agents/rules` 와 정합. `alwaysApply` 는 001 만, 002·003 은 `globs` 로 한정 | **1.5h** |
| **5** | **`.claude/agents/` 폐기·재구성** (8개 agents 중 7개 무관) | Claude Code | java-spring, jpa-querydsl, gradle, kafka-pipeline, kafka-saga, spring-redis, flutter-app 모두 OnDay 무관. react-frontend 는 Vite 가정 | 7개 archive 후 `next-fullstack`, `prisma-supabase`, `vercel-ai-sdk-gemini`, `tailwind-shadcn`, `supabase-auth` 등 신규 작성. react-frontend 는 Next.js App Router 로 수정 | **6h** |
| **6** | **`.cursor/skills/` 정리·재구성** (21개 중 11개 무관 + 번호 충돌 5건) | Cursor | 300-307 대역에서 OnDay 무관 다수 + 번호 충돌 | 무관 11개 archive, 번호 충돌 해소, OnDay 핵심 5개 신규 작성 (Next.js Server Actions, Prisma, Supabase Auth, Vercel AI SDK, Tailwind+shadcn) | **8h** |
| **7** | **`.gemini/` 구조 보강** | Gemini CLI / Antigravity | `agents/readme-architect.md` 1개만 | README-gemini 권장 구조에 맞춰 `.gemini/agents/` 2~3개 추가 + `.agents/skills/` 의 OnDay-specific 스킬 공유 | **3h** |
| **8** | **`.agents/skills/` 디렉토리 신설** (Cross-tool 공유 표준) | 모든 도구 | 디렉토리 부재 | README-common 권장 표준 위치 생성. 도메인 비특화 스킬(7단계 에러 진단, gitflow, build-env, gh issue handling) 을 여기 중앙화 후 `.cursor/skills`·`.claude/skills` 에 symlink | **3h** |
| **9** | **`.claude/commands/` → `.claude/skills/` 마이그레이션** | Claude Code | 구 commands 형식 3개 (fix-error, gitflow-commit, setup-env) | README-claude 권장 형식(`.claude/skills/<name>/SKILL.md`)으로 이전. `context: fork` 도입 검토 | **2h** |
| **10** | **OnDay-specific 핵심 가이드 신규 작성** (어떤 harness 에도 없음) | 모두 | 0건 | ① Vercel 10s Timeout 회피(Client Promise.all) ② Server Actions vs Route Handlers 선택 ③ Prisma + Supabase 환경 분기 ④ Supabase Auth httpOnly cookie ⑤ Vercel Cron Job 패턴 ⑥ OG 리치 프리뷰 ⑦ Sentry + Mixpanel 연동 | **10h** |

**총 추정 공수: ~40h (1인 약 5~7 영업일)**

---

## 6. Phase 2 재정립 권장 순서

### 6-1. 의존성 그래프

```
[1] AGENTS.md (공통 글로벌)  ←── 모든 솔루션이 참조하는 SSoT
        │
        ├──> [2] CLAUDE.md      (Claude 가 항상 로드)
        ├──> [3] .agents/rules  (Antigravity/Gemini 가 로드)
        ├──> [4] .cursor/rules  (Cursor 가 로드)
        │
[8] .agents/skills/ 중앙화  ←── 공용 스킬 (gitflow, fix-error 등)
        │
        ├──> [9]  .claude/skills/ (마이그레이션)
        ├──> [6]  .cursor/skills/ (정리·재구성)
        └──> [7]  .gemini/ + .agents/skills 공유
                  │
                  └──> [5] .claude/agents/ + .cursor/agents 재구성
                            │
                            └──> [10] OnDay-specific 가이드 (Next.js, Prisma, Supabase 등)
```

### 6-2. 권장 진행 순서 (Phase 2)

| 순서 | 작업 | 의존성 | 산출물 |
| --- | --- | --- | --- |
| **Phase 2-A**<br>(SSoT 정립) | #1 AGENTS.md 재작성 | 없음 | OnDay 비전·페르소나·Next.js 스택·1인 MVP 제약을 100~120줄로 압축 |
| Phase 2-A | #2 CLAUDE.md 재작성 | #1 | AGENTS.md 와 정합 + Claude 특화 (skills/agents 라우팅, settings.local 명시) |
| Phase 2-A | #3 `.agents/rules/` 재작성 | #1 | 001 (개요·alwaysApply), 002 (Next.js 스택·alwaysApply), 003 (개발 가이드·globs로 한정) |
| Phase 2-A | #4 `.cursor/rules/` 재작성 | #1, #3 | `.agents/rules` 와 1:1 매핑 (cursor 는 `.mdc` 확장자) |
| **Phase 2-B**<br>(공용 스킬 중앙화) | #8 `.agents/skills/` 디렉토리 신설 | 없음 (병렬 가능) | 도메인 비특화 스킬 7~10개 중앙화 + symlink 설계 |
| Phase 2-B | #9 `.claude/commands/` → `.claude/skills/` 마이그레이션 | #8 | 구 commands 형식 폐기, `SKILL.md` 표준 적용 |
| **Phase 2-C**<br>(Subagent 재구성) | #5 `.claude/agents/` 정리 | #2 | 무관 7개 archive + OnDay 특화 5~7개 신규 |
| Phase 2-C | #6 `.cursor/skills/` 정리 | #4, #8 | 번호 충돌 5건 해소 + 무관 11개 archive + 신규 OnDay 스킬 5개 |
| Phase 2-C | #7 `.gemini/` 구조 보강 | #3, #8 | `.gemini/agents/` 2~3개 추가 |
| **Phase 2-D**<br>(OnDay 특화 가이드) | #10 신규 가이드 7종 작성 | #2, #5, #6 | Vercel Timeout 회피·Server Actions·Prisma·Supabase Auth·Vercel Cron·OG 프리뷰·Sentry+Mixpanel |
| **Phase 2-E**<br>(검증) | 5개 솔루션 교차 검증 | 전체 | 동일 질문(예: "두 동선 교차 진단 API 구현해줘")을 5개 도구에 던졌을 때 모두 Next.js Server Action + Prisma + 카카오 모빌리티 API 로 일관된 답변이 나오는지 회귀 테스트 |

### 6-3. 의사결정 포인트 (Phase 2 진입 전 사용자 확인 필요)

| 결정 사항 | 옵션 A | 옵션 B | 권장 |
| --- | --- | --- | --- |
| 잘못된 자산(Spring/Java/Kafka 등) 처리 | 삭제 | `_archive/` 폴더로 이동 후 README 에 "이전 강의 자료" 표기 | **옵션 B** — 강의 자료로 재활용 가능, 학습 흔적 보존 |
| AGENTS.md 작성 언어 | 한국어 | 영어 (README-cursor 권장) | **한국어** — 사용자 컨텍스트(한국어 PRD/SRS) 우선 |
| Symlink 사용 여부 | 사용 (README-common 권장) | 각 도구에 사본 유지 | **사용** — git 추적·플랫폼 차이는 별도 검토 필요 |
| `.claude/commands/` 즉시 폐기 vs 단계적 마이그레이션 | 즉시 폐기 | 마이그레이션 후 보존 | **즉시 폐기** — Claude 최신 가이드와 일치 |
| `.cursor/hooks.json` 도입 여부 | MVP 단계에서 도입 | GA 이후 도입 | **MVP 보류** — 1인 개발자 유지보수 부담, SRS Rev 1.5 의 "단순화" 원칙과 일치 |

---

## 부록 A. 감사 대상 외 파일 (참고용 — 본 audit 의 수정 대상 아님)

- `onday-app/` 내부 (단, `onday-app/public/images/` 와 `tasks/07_GANTT_CHART_v1.x.md` 는 git untracked. 본 audit 와 무관)
- `design-input/`, `my-동네궁합진단기-workbase/`, `onday-app-git-backup-20260505.tar.gz`
- `docs/` 내 PRD/SRS 외 파일 (현재는 없음)
- `tasks/`, `.git/`, `.DS_Store`, `.gitignore`

## 부록 B. Audit 절차 메모

- 본 audit 는 기존 파일 0건 수정. `docs/HARNESS_AUDIT_v1.0.md` 신규 생성만 수행.
- 5개 솔루션(AGENTS.md/CLAUDE.md/.agents/.claude/.cursor/.gemini) 전체 파일을 1차 정독 후 PRD v1.1-rev.4 §1~7, SRS v1.6 §1~6 와 교차 검증.
- "Ground Truth" 20개 항목은 SRS CON-01~CON-18 의 기술 제약 및 REQ-FUNC/REQ-NF 정의를 직접 인용.
- 본 리포트는 Phase 2 재정립의 입력으로 사용되며, Phase 2 진행 시 본 리포트는 갱신되지 않고 v1.0 으로 동결한다 (변경 이력은 v1.1 신규 발행으로 관리).

---

**End of HARNESS_AUDIT_v1.0**
