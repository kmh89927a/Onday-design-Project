# Project Instructions — OnDay (동네궁합진단기)

이 파일은 Antigravity, Cursor, Claude Code, Gemini CLI 등 다수의 AI 도구가 공통으로 읽는 **cross-tool 글로벌 규칙(Global Rules)** 이다. 모든 AI 에이전트는 작업 시작 시 본 파일의 모든 섹션을 컨텍스트로 로드한다.

> SSoT(Single Source of Truth): `docs/00_PRD_v1.1-rev.4.md`, `docs/05_SRS_v1.7.md`. 본 파일과 두 문서가 충돌하면 PRD/SRS 가 우선한다.

---

## §1. 프로젝트 비전

**프로젝트명:** OnDay (온데이) — 정식 명칭 "내 하루 동선 맞춤 동네 궁합 진단기"

**해결하려는 문제:** 이사를 앞둔 3040 맞벌이 부부·긴급 이사자·반복 이사자가 **두 사람의 출퇴근 동선을 동시에 만족하는 동네를 찾을 도구가 시장에 존재하지 않아** 발생하는 주거 미스매치, 탐색 비용 낭비(평균 4.2개월·임장 12회), 부부 합의 실패율 70%, 심리적 고립감 문제를 해결한다.

**도메인:** 프롭테크 × 하이퍼로컬 × 초개인화 큐레이션 (3각 교차점)

**핵심 페르소나 (MVP 타겟):**
- C-01 맞벌이 부부 (두 동선 교차 + 배우자 합의)
- C-02 맹모삼천지교 (학군 + 광역버스 착석 통합)
- C-03 긴급 이사자 (데드라인 급매 필터링, WTP 가장 높음)
- C-04 반복 이사자 (입력값 저장·재탐색)
- A-01 이직 후 이사자 (싱글 모드 간소화)

**MVP 핵심 기능 (5종, Must):**
1. 두 동선 교차 진단 (주소 2개 → 교집합 동네 지도 시각화)
2. 배우자 공유 링크 (URL + 무료 미리보기 1곳 + 데이터 출처 배지)
3. 데드라인 모드 (이사 기한 → 급매 우선 + 계약 역산 타임라인)
4. 싱글 모드 (학군 숨김 + 야간 치안·라이프스타일 레이어)
5. 간이 저장·불러오기 (best effort 자동 저장, Rev 1.5 축소)

**북극성 KPI:** 진단 완료 수 / 주 (Closed Beta 50건/주 → Open Beta 200건/주)
**보조 KPI:** WTP 설문 응답률 ≥ 30%, 배우자 공유 링크 클릭률 ≥ 40%, D+7 리텐션 ≥ 25%, NPS ≥ 50

---

## §2. 기술 스택 (확정)

본 프로젝트는 **단일 풀스택 프레임워크(Next.js)** 로 구현한다. 프론트엔드와 백엔드를 별도 서버로 분리하지 않는다.

| 영역 | 기술 | 근거 (SRS) |
| --- | --- | --- |
| **풀스택 프레임워크** | Next.js 15+ (App Router, RSC) | CON-09 |
| **서버 측 로직** | Next.js Server Actions / Route Handlers (별도 백엔드 서버 없음) | CON-10 |
| **언어** | TypeScript | (관행) |
| **ORM** | Prisma | CON-11 |
| **DB (Production)** | Supabase PostgreSQL | CON-11 |
| **DB (Local Dev)** | SQLite | CON-11 |
| **UI / 스타일링** | Tailwind CSS + shadcn/ui | CON-12 |
| **LLM 통합** | Vercel AI SDK (Next.js 내부) | CON-13 |
| **LLM Provider** | Google Gemini API (환경변수로 교체 가능) | CON-14 |
| **인증** | Supabase Auth (`@supabase/ssr`) + 카카오·네이버 OAuth (Supabase External Provider 설정) | CON-18, REQ-FUNC-029 |
| **배포·인프라** | Vercel (Git Push 자동 배포, 별도 CI/CD 없음) | CON-15 |
| **모니터링** | Sentry (기본 알림) + Vercel Analytics/Speed Insights | REQ-NF-035~037 |
| **분석** | Mixpanel / Amplitude | REQ-NF-026~034 |
| **자동 작업** | Vercel Cron Job (급매 4시간 주기 갱신 등) | REQ-NF-005 |

**명시적 사용 금지 / 미사용 스택 (재발 방지용):**
- Spring Boot / Java / Gradle / Maven — 미사용
- Python / FastAPI / LangChain — 미사용 (LLM 오케스트레이션은 Vercel AI SDK)
- Apache Kafka — 미사용
- Redis (Lettuce, Redisson) — 미사용
- Thymeleaf, JSP — 미사용
- MySQL — 미사용 (DB 는 Supabase PostgreSQL / SQLite)
- NextAuth.js — 미사용 (Supabase Auth 로 대체, CON-18 명시)
- Hugging Face API, OpenAI API — 미사용 (LLM 은 Gemini)
- Flutter — 미사용 (모바일은 모바일 웹 PWA)

---

## §3. 1인 MVP 제약 (개발 컨텍스트)

본 프로젝트는 **3년차 IT기획 퍼블리셔 + 초급 SW 배경의 1인 개발자** 가 MVP/PMF 검증을 위해 구현 가능한 범위로 스코프가 축소되었다 (SRS Rev 1.5).

**개발자 컨텍스트가 코드 생성에 미치는 영향:**
- 복잡한 추상화·디자인 패턴 도입 자제. 단순·명시적 코드 선호.
- 풀스택 단일 프레임워크 활용 (Next.js 내부에서 모든 것 처리, 마이크로서비스 분리 금지)
- 라이브러리·의존성 추가는 신중. shadcn/ui 와 Vercel AI SDK 같이 공식 권장 자산 우선.

**플랫폼 제약:**
- **Vercel 무료 티어 Serverless Timeout = 10초** (REQ-FUNC-003, §6.3.1)
  - 외부 교통 API 반복 호출·교차 연산은 **Server Action 이 아닌 Client Component 의 `Promise.all` 병렬 구조** 로 처리한다.
  - Server Action 은 Geocoding·커버리지 검증·결과 저장만 담당.
- 비용 한도: 월 외부 API 호출 ≤ 100만원, 월 인프라 비용 ≤ 10만원 (REQ-NF-023, 024)

**서비스 커버리지:**
- MVP: 수도권(서울·경기·인천) 한정 (CON-03, ADR-003)
- 비수도권 주소 입력 시 커버리지 안내 UI 표시 후 진단 차단

**보안 (MVP 단계):**
- TLS/SSL (Supabase 기본 전송 암호화) 만 적용 (CON-16)
- AES-256 PII 암호화·ISMS-P·OWASP DAST 는 **MVP 에서 제외**, GA 이후 검토
- 인증 세션: Supabase Auth httpOnly cookie + sameSite strict + CSRF 내장 (REQ-NF-018)
- 공유 링크: UUID v4 entropy ≥ 128bit, 만료 30일 (REQ-NF-020)

---

## §4. Out of Scope (MVP)

다음 항목은 MVP 에서 **명시적으로 제외**되며, AI 에이전트는 이 영역의 코드·설계를 자동 생성하지 않는다 (SRS §1.2.2):

| # | 제외 범위 | 사유 / 예정 Phase |
| --- | --- | --- |
| OS-01 | 매물 중개 / 계약 체결 | 부동산 중개업 라이선스 필요 / v1+ |
| OS-02 | 학원 셔틀 종점 DB | TAM 협소, 파트너십 필수 / v2 |
| OS-03 | 지방(비수도권) 커버리지 | 데이터 부족 / v1.5+ |
| OS-04 | 복수 목적지 모드 (5개 거점) | 알고리즘 복잡도 O(n²) / v2 |
| OS-06 | 이전 탐색 비교 뷰 | 1인 MVP 범위 축소 / v1.5+ |
| OS-07 | 시나리오 3개 비교 | 다중 시나리오 연산 복잡도 / v2 |
| OS-08 | 행정동 변경 감지·매핑 | 유지 비용 / v1.5+ |
| OS-09 | **결제 시스템** (PG 연동, 웹훅, 구독) | WTP 는 사전 설문으로 측정 / Open Beta+ |

---

## §5. 핵심 데이터 모델

Prisma schema 로 정의하며, `DATABASE_URL` 환경변수로 SQLite(로컬) / Supabase PostgreSQL(프로덕션) 전환.

```
USER ||--o{ DIAGNOSIS : creates
USER ||--o{ SAVED_SEARCH : saves
DIAGNOSIS ||--o{ SHARE_LINK : shared_via
```

| 엔터티 | 핵심 필드 | 비고 |
| --- | --- | --- |
| `USER` | `id` UUID PK, `email`, `auth_provider`(kakao\|naver), `mode`(couple\|single) | Supabase Auth 연동 |
| `DIAGNOSIS` | `id` UUID PK, `user_id` FK, `deadline` nullable, `status`(processing\|completed\|expired), `filters` JSONB, `mode`, `deadline_mode` | 진단 결과 본체 |
| `SHARE_LINK` | `id` UUID PK, `diagnosis_id` FK, `unique_url` UNIQUE, `password_hash` nullable, `view_count`, `free_preview_used`, `expires_at` | UUID v4, 30일 만료 |
| `SAVED_SEARCH` | `user_id` PK/FK, `search_params` JSONB, `saved_at` | 사용자당 1건 UPSERT (Rev 1.5 단순화) |

> Rev 1.5 에서 `ViewLog`, `DongMap` 엔터티가 제거되었다. Rev 1.6 에서 `PAYMENT` 엔터티·관계가 제거되었다 (결제 MVP 제외).

---

## §6. 성능 NFR (요약)

| 항목 | 기준 | 측정 |
| --- | --- | --- |
| 두 동선 교차 계산 응답 | p95 ≤ 8,000ms (클라이언트 API 콜 기준) | Vercel Analytics + Sentry Performance |
| 일반 페이지 로딩 | p95 ≤ 1,500ms (3G 모바일) | Lighthouse / Vercel Speed Insights |
| 공유 링크 페이지 로딩 | p95 ≤ 2,000ms (비회원·3G) | 동일 |
| 필터 적용·재계산 | p95 ≤ 1,000ms (클라이언트 캐싱) | Vercel Analytics |
| 공유 링크 생성 | ≤ 500ms | Vercel Analytics |
| 급매 데이터 갱신 주기 | ≤ 4시간 (Vercel Cron) | Cron 실행 로그 |
| 평균 탐색 완료 시간 | p50 ≤ 10분 | Mixpanel `diagnosis_started` → `diagnosis_completed` |
| 서버 5xx 오류율 | ≤ 0.5% | Sentry |
| 가용성 | Best Effort (무료 티어 수용) | Vercel Status |

---

## §7. 외부 API 의존성

| ID | 외부 시스템 | 용도 | 제약 |
| --- | --- | --- | --- |
| EXT-01 | 카카오 모빌리티 API | 대중교통 경로·환승·소요시간 | 일 50만 건 무료 tier |
| EXT-03 | 국토교통부 실거래가 API | 전·월세 실거래가 | 일 1,000건 |
| EXT-04 | 경찰청 범죄 통계 API | 야간 치안 데이터 | 분기 갱신 |
| EXT-05 | 교육부 학교 배정 구역 | 초등 배정 폴리곤 | 연 1회 갱신 |
| EXT-07 | OAuth Provider (카카오·네이버) | 소셜 로그인 — Supabase External OAuth Provider 로 구성 | OAuth 2.0 |
| EXT-08 | 매물 데이터 소스 (네이버 부동산 등) | **아웃링크** 방식만 (조건 파라미터 결합 후 새 창) | 직접 크롤링 폐기 |

**장애 우회 원칙:** 복잡한 다중 폴백·캐시 DB 파이프라인은 MVP 에서 제외. 단순 에러 모달 + Graceful Degradation 만 적용 (SRS §3.1.1).

---

## §8. 도구별 세부 가이드

도구별 차별점(Subagent, Skills, Workflows, Hooks)은 다음 README 를 참조한다:

- `README-common-harness.md` — 공통 표준(`AGENTS.md`, `.agents/skills/`)
- `README-claude-harness.md` — Claude Code 특화 (`CLAUDE.md`, `.claude/agents`, `.claude/skills`)
- `README-cursor-harness.md` — Cursor 특화 (`.cursor/rules`, `.cursor/skills`, `.cursor/agents`, `.cursor/hooks.json`)
- `README-gemini-harness.md` — Gemini CLI / Antigravity 특화 (`.agents/rules`, `.agents/skills`, `.agents/workflows`, `.gemini/agents`)

본 파일은 Phase 2-A SSoT 정립 결과물이다. 변경 이력은 git log 로 추적한다.
