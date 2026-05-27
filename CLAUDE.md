# CLAUDE.md — OnDay (동네궁합진단기)

이 문서는 Claude Code 가 모든 세션 시작 시 자동으로 로드하는 **프로젝트 컨텍스트** 다. 본 파일은 cross-tool 글로벌 규칙 `AGENTS.md` 와 정합한다. 두 파일이 충돌하면 `AGENTS.md` 가 우선한다.

> SSoT(Single Source of Truth): `docs/00_PRD_v1.1-rev.4.md`, `docs/05_SRS_v1.7.md`. 본 파일과 두 문서가 충돌하면 PRD/SRS 가 우선한다.

---

## 1. 프로젝트 개요

**프로젝트명:** OnDay (온데이) — "내 하루 동선 맞춤 동네 궁합 진단기"

**해결 문제:** 3040 맞벌이 부부·긴급 이사자·반복 이사자가 두 사람의 출퇴근 동선 교집합 동네를 찾는 도구 부재로 발생하는 주거 미스매치, 탐색 비용 낭비, 부부 합의 실패율 70% 문제 해결.

**도메인:** 프롭테크 × 하이퍼로컬 × 초개인화 큐레이션

**MVP 핵심 기능 (Must):**
1. 두 동선 교차 진단 (지도 시각화)
2. 배우자 공유 링크 + 무료 미리보기
3. 데드라인 모드 (급매 + 계약 역산)
4. 싱글 모드 (학군 숨김 + 야간 치안)
5. 간이 저장·불러오기

**북극성 KPI:** 진단 완료 수/주 (50 → 200건)

> 페르소나·KPI·기능 상세는 `AGENTS.md §1` 참조.

---

## 2. 기술 스택 (확정)

본 프로젝트는 **단일 풀스택 프레임워크(Next.js)** 다. 프론트엔드·백엔드 분리 금지.

| 영역 | 기술 |
| --- | --- |
| 풀스택 프레임워크 | Next.js 15+ (App Router, RSC) + TypeScript |
| 서버 로직 | Server Actions / Route Handlers (별도 백엔드 서버 없음) |
| ORM | Prisma |
| DB | Supabase PostgreSQL (Prod) / SQLite (Local) |
| UI | Tailwind CSS + shadcn/ui |
| LLM | Vercel AI SDK + Google Gemini API |
| 인증 | Supabase Auth (`@supabase/ssr`) + 카카오·네이버 OAuth |
| 배포 | Vercel (Git Push 자동 배포) |
| 모니터링 | Sentry + Vercel Analytics |
| 분석 | Mixpanel / Amplitude |

**미사용 / 사용 금지 스택 (재발 방지):** Spring Boot, Java, Gradle, Apache Kafka, Redis, Thymeleaf, MySQL, NextAuth.js, Hugging Face API, OpenAI API, Python, FastAPI, LangChain, Flutter

> 스택 상세 및 SRS 근거는 `AGENTS.md §2` 참조.

---

## 3. 1인 MVP 제약 (필수 숙지)

- **개발자 컨텍스트:** 3년차 IT기획 퍼블리셔 + 초급 SW 1인 개발. 복잡한 추상화·디자인 패턴 자제. 단순·명시적 코드 선호.
- **Vercel Serverless Timeout = 10초** (REQ-FUNC-003): 외부 API 반복 호출·교차 연산은 **Server Action 이 아닌 Client Component 의 `Promise.all`** 으로 처리. Server Action 은 Geocoding·커버리지 검증·저장만 담당.
- **커버리지:** 수도권(서울·경기·인천) 한정. 비수도권 입력 시 안내 후 차단 (CON-03).
- **보안 (MVP):** TLS만 (Supabase 기본). AES-256·ISMS-P·OWASP DAST 는 GA 이후 (CON-16).
- **비용 한도:** 월 외부 API ≤ 100만원, 월 인프라 ≤ 10만원.
- **Out of Scope:** PG 결제·매물 중개·지방 커버리지·비교 뷰·시나리오 비교·행정동 매핑 (자동 코드 생성 금지).

---

## 4. 핵심 데이터 모델 (요약)

```
USER ──< DIAGNOSIS ──< SHARE_LINK
USER ──< SAVED_SEARCH (1:1 UPSERT)
```

- `USER` — Supabase Auth 연동 (auth_provider: kakao | naver)
- `DIAGNOSIS` — 진단 본체 (filters JSONB, deadline nullable)
- `SHARE_LINK` — UUID v4 entropy ≥ 128bit, 만료 30일
- `SAVED_SEARCH` — 사용자당 1건 (Rev 1.5 단순화)

> Rev 1.6 에서 `PAYMENT` 엔터티 제거. 상세 스키마는 `AGENTS.md §5` + `docs/05_SRS_v1.6.md §6.2` 참조.

---

## 5. Subagent 라우팅 (Claude 특화)

작업 성격에 따라 다음 subagent 에게 자동·수동 위임한다. 본 라우팅 표는 Phase 2-C 에서 실제 `.claude/agents/*.md` 파일이 작성된 이후 활성화된다.

> **현재 상태:** `.claude/agents/` 의 기존 8개 subagent (java-spring, jpa-querydsl, gradle, kafka-pipeline, kafka-saga, spring-redis, flutter-app, react-frontend) 는 본 프로젝트와 무관하다. Phase 2-C 작업 전까지는 본 라우팅을 **사용하지 말고**, 메인 컨텍스트에서 직접 작업한다.

| 계획된 Subagent | 사용 시점 | `.claude/agents/` 파일명 (예정) |
| --- | --- | --- |
| `next-fullstack` | App Router 페이지·레이아웃·Server Action·Route Handler 작성 | `next-fullstack.md` |
| `prisma-supabase` | Prisma schema 수정, 마이그레이션, Supabase 쿼리 | `prisma-supabase.md` |
| `vercel-ai-sdk-gemini` | Vercel AI SDK + Gemini 프롬프트·스트리밍·도구 호출 | `vercel-ai-sdk-gemini.md` |
| `tailwind-shadcn` | shadcn/ui 컴포넌트 추가, Tailwind 디자인 시스템 | `tailwind-shadcn.md` |
| `supabase-auth` | Supabase Auth httpOnly cookie, OAuth Provider 설정, 미들웨어 | `supabase-auth.md` |

수동 호출 예시: `> use the next-fullstack subagent to add the /diagnosis/[id] route handler`

---

## 6. 로컬 권한 설정 (`.claude/settings.local.json`)

현재 허용된 명령어 (변경하지 않음, Phase 2-A 범위 외):

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(npx next:*)",
      "Bash(npm install:*)",
      "Bash(npx prisma:*)",
      "Bash(npx tsx:*)"
    ]
  }
}
```

이 권한 셋은 본 프로젝트의 실제 스택(Next.js + Prisma + Node) 과 정합하다. 추가 권한이 필요하면 명시적 사용자 승인을 받는다.

---

## 7. Skills / Commands 정책

- **Skills 폴더(`.claude/skills/`) 사용 권장.** 최신 Claude Code 는 구 `.claude/commands/` 를 `Skills` 로 통합한다 (`README-claude-harness.md §4-3` 참조).
- **현재 `.claude/commands/` 에는 3개 파일**(fix-error, gitflow-commit, setup-env) 이 있으나, 이는 **폐기 예정**이며 Phase 2-B 에서 `.claude/skills/<name>/SKILL.md` 형식으로 마이그레이션한다.
- Phase 2-B 완료 전까지는 `.claude/commands/` 의 3개 명령어(`/fix-error`, `/gitflow-commit`, `/setup-env`) 를 그대로 사용할 수 있다 (도메인 비특화 메타 도구).

---

## 8. 코드 작성 원칙

- **의미 있는 주석만 작성** (WHY 중심, WHAT 은 코드로 표현). 사용되지 않거나 쓸모없어진 주석은 즉시 제거.
- **단순·명시적 코드 선호.** 1인 MVP 컨텍스트 — 불필요한 추상화·헬퍼·디자인 패턴 도입 금지.
- **`AGENTS.md §4 Out of Scope` 항목의 코드는 자동 생성하지 않는다.** 사용자가 명시적으로 요청해도 OS-XX 사유를 안내 후 진행 여부 확인.
- **에러/예외 처리**: `/fix-error` 슬래시 커맨드로 구조화된 7단계 진단 수행.
- **커밋·PR**: `/gitflow-commit` 슬래시 커맨드로 Git Flow + Conventional Commits + Draft PR 자동화.

---

## 9. 도구별 세부 가이드

- `README-common-harness.md` — cross-tool 공통 표준
- `README-claude-harness.md` — Claude Code 특화
- `README-cursor-harness.md` — Cursor 특화
- `README-gemini-harness.md` — Gemini CLI / Antigravity 특화

본 파일은 Phase 2-A SSoT 정립 결과물이다. 변경 이력은 git log 로 추적한다.
