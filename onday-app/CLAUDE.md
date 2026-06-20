# Onday — 동네궁합 진단기

## 프로젝트 개요
두 사람의 출퇴근지·예산·선호 시간대를 입력하면 통근시간·안전등급·편의시설을 종합해 살기 좋은 동네를 추천하는 모바일 우선 웹앱.

## Tech Stack
- Next.js 15 App Router + TypeScript (strict)
- Tailwind CSS v3 + shadcn/ui (Pretendard 폰트)
- react-hook-form + Zod (폼 검증)
- Zustand (글로벌 상태) + TanStack Query v5 (서버 상태)
- Supabase Auth (카카오/네이버 OAuth) — 실 연동 (mock 은 `NEXT_PUBLIC_USE_MOCK_AUTH=true` 토글로만)
- Prisma 7 ORM + Supabase PostgreSQL (로컬·프로덕션 단일 — sqlite 이원화 폐지, PrismaPg 드라이버 어댑터)
- react-kakao-maps-sdk (MVP는 MapPlaceholder)

### 데이터 (DB)
- 실제 영구 저장 = Supabase Postgres (`src/lib/db.ts` = PrismaPg 어댑터, in-memory 아님).
- 4 모델: `User` · `Diagnosis` · `ShareLink` · `SavedSearch` (`prisma/schema.prisma`).
- 진단·공유링크·저장검색이 콜드스타트/세션을 넘어 유지(공유 링크 다중 세션 지속).
- 찜(favorites)은 별개 — 클라이언트 localStorage.

## 디렉토리 구조
- `src/app/` — Next.js App Router 라우트
- `src/components/` — UI 컴포넌트 (ui/form/data/card/map/deadline/share/sheet/layout)
- `src/features/` — 도메인별 hooks/actions/utils
- `src/stores/` — Zustand 스토어
- `src/lib/` — DB, auth, types, validators, external API clients
- `src/mocks/` — Mock 데이터 + handlers
- `src/providers/` — React context providers

## 코드 규칙
- PascalCase (컴포넌트), camelCase (함수/변수), kebab-case (파일)
- 한 함수 50줄 이하
- 같은 UI 2번 이상 → 컴포넌트 추출
- TypeScript strict, optional vs required 명확
- key 명시, React.memo (비용 큰 컴포넌트), useCallback (콜백)

## 디자인 보존 규칙
- ../design-input/screens/*.html이 시각적 truth (onday-app/ 외부, claude-design/ 직속)
- 토큰명 ../design-input/design-tokens.md 그대로 유지
- 안전등급 뱃지: letter + label + 색 3중 표기
- 포커스 링 2px brand + 2px offset 모든 인터랙티브 요소
- prefers-reduced-motion 시 모든 애니메이션 0.01ms

## 자료 우선순위 (충돌 시)
모든 경로는 onday-app/ 외부 (`../`) — claude-design/ 직속 또는 그 아래.
1. ../docs/05_SRS_v1.6.md  (정본; tasks/docs/에 사본)
2. ../my-동네궁합진단기-workbase/wiki/concepts/architecture-patterns.md
3. ../my-동네궁합진단기-workbase/wiki/concepts/tech-stack.md
4. ../docs/00_PRD_v1.1-rev.4.md
5. ../tasks/  (UI-XXX.md, CMD-DIAG-*.md, API-*.md 등)
6. ../design-input/  (screens/*.html · components-spec.md · design-tokens.md · interactions-spec.md)

추가 wiki concepts (참고): deadline-mode, single-mode, share-link, two-route-intersection,
persona-domain-flows, domain-dependencies, market-size, known-follow-ups, srs-v1.6-changes,
task-domains-overview. 한국어 통합본은 `../my-동네궁합진단기-workbase/llm-wiki.ko.md`.

## 실행 모드
- **기본 = real 모드** (`NEXT_PUBLIC_USE_MOCK=false`, `NEXT_PUBLIC_USE_MOCK_AUTH=false`) — Supabase Postgres + 실 외부 API.
- `NEXT_PUBLIC_USE_MOCK=true` = 외부 의존성 Mock (개발용 선택 토글). DB 는 항상 Postgres — sqlite/in-memory 경로 없음.
- env 검증: `src/lib/env.ts` 의 `getServerEnv`/`getClientEnv` (Zod) 가 누락/형식오류를 진입점에서 차단(#6).

## 현재 진행 상황

| Step | 내용 | 상태 | 커밋 |
|------|------|------|------|
| 1 | 프로젝트 초기화 + 토큰 통합 계획 | 완료 | `64c6239` |
| 2 | 디자인 토큰 검증 (globals.css + tailwind.config.ts + 샘플 페이지) | 완료 | `4824109` |
| 3 | Mock 인프라 (Prisma, API 4개, Haversine, Zustand, TanStack Query) | 완료 | `7ba116b` |
| 4 | shadcn/ui base 9개 + onday 토큰 + Base UI data-props 호환 + 3폭 검증 페이지 | 완료 | `493e219` |
| 5 | 31개 커스텀 컴포넌트 (5-Layer + primary-pastel 토큰) | 완료 | `d586380` |
| 6 | /dev 가드 + Zustand 3 store 분리(session/favorites/ui) + Toaster 글로벌 | 완료 | `d1c6f0e` `db809fc` |
| 7 | /login 페이지 + OAuth Mock + 게스트 체험 + Logo 컴포넌트 | 완료 | `3b6d701` |
| 8 | /diagnosis 입력 페이지 + TimeRangeToggle + AddressInput 자동완성 + result placeholder | 완료 | `4a3b345` |
| 9 | /diagnosis/result/[id] 결과 페이지 (CandidateCard + MapCanvas + FilterPanel 결합) | 완료 | `a1c4fde` |
| 9.5 | 서울 동네 확장 (12 → 22, 권역 다양성 + 안전 A~D) | 완료 | `d10a686` |
| 10 | DetailSheet 연동 (카드/마커 클릭, Heart persist, TimeSlotSelector) | 완료 | `55761b4` |
| 10.5 | MOCK_NEIGHBORHOODS × 3 필드 (lines/listingsCount/avgArea) | 완료 | `8554b67` |
| 11 | /share/[uuid] + /deadline + /single/[id] 본 작업 + 공유 실 흐름 + a11y fix | 완료 | `3a387d7` |
| 11.5 | /single Layer 토글 (야간안전/편의시설/카페) | 완료 | `0a18916` |
| 11.6 | /single PDF window.print + @media print 보강 | 완료 | `b806b57` |
| 11.7 | /diagnosis single 모드 여가거점 입력 (L1/L2) | 완료 | `e00333d` |
| 11.8 | 여가거점 점수 계산 (mock-calculator + API forward) | 완료 | `3846fee` |
| 11.10 | Deadline 인앱 알림 (DeadlineBell + DeadlineBanner) | 완료 | `94cf1c5` |
| 11.9 | 디자인 큐레이션 (key 안정화 + a11y + print + 색 시스템 통합) | 완료 | `de5b78d` |
| 12 | UX 정리(친화 문구·매물 외부 링크) + in-memory store + 루트 redirect + Vercel 배포 | 완료 | `3b0fbf5` `a5bee2a` `bda1188` `b7f78b6` |
| 13 | /landing 랜딩페이지 (C유형 결과지향형: Hero+I/O+B&A+VP+SP+CTA) + 루트 redirect /landing | 완료 | — |
| 13.5 | 랜딩페이지 v2 (비즈니스 브리프 전면 반영: Pain+학군+F1~F5+페르소나+시장) — 97% 달성 | 완료 | — |

## 🚀 라이브 URL
**https://onday-design-project.vercel.app**
- `/` → `/landing` 자동 redirect (Step 13 변경: 기존 `/login` → `/landing`)
- 랜딩페이지 CTA → `/login` → `/diagnosis` 진단 흐름
- real 모드 — Supabase Postgres 영구 저장 (구 in-memory store 폐지, `src/lib/db.ts` = PrismaPg 어댑터)
- 베타 테스트 가능 수준

## 다음 시작 지점
**베타 운영 + 7주차 부트캠프 진도**
- 친구 공유 → 베타 테스트 피드백 수집
- 부트캠프 7주차(월요일) 진도 진행
- Tier 2~5 강화는 9~12주차 일정에 맞춰

### Step 13 후보 (운영 안정화 — 베타 피드백 후 우선순위 조정)
- ✅ (완료) Supabase Postgres 연결 — `src/lib/db.ts` 가 PrismaPg 드라이버 어댑터로 교체됨,
  in-memory → 영구 저장 전환 완료(진단·공유링크·저장검색, share link 다중 세션 유지).
  추가로 `/api/health` DB ping(#10) + `lib/env.ts` Zod env 검증(#6) 도입.
- Lighthouse 측정 + 모바일 viewport(375px) 실기 검증
- Sentry 연결 (`NEXT_PUBLIC_SENTRY_DSN`)
- Kakao Map SDK 연결 (현재는 `MapPlaceholder`)

## Step 12 잔여 cleanup (Step 13+)
- 잔존 `key={i}` (low-risk): `dev/page.tsx`, `map-placeholder.tsx`
- 잔존 hsl 인라인: `button.tsx` / `mode-selector.tsx`의 disabled `hsl(220 30% 84%)` — 별도 token 검토
- ✅ (완료) `better-sqlite3` / `@prisma/adapter-better-sqlite3` 제거 — `@prisma/adapter-pg` + `pg` 로 전환됨

## 주의사항
- 한글 인코딩: Write 후 반드시 `grep -rn $'\xef\xbf\xbd'` 로 검증
- Prisma 7: `@/generated/prisma/client` 경로 사용 (index.ts 없음)
- shadcn v4: `@base-ui/react` 사용 (Radix 아님), oklch 덮어쓰기 주의
- **PrismaClient는 `globalThis` 핀 필수** — Next.js dev HMR 시 모듈 재로딩으로 커넥션 풀이 새로 열리는 누수 방지 (`src/lib/db.ts` 의 `__ondayPrisma`). Vercel warm 람다에서도 같은 풀 재사용. (구 in-memory Map 방식은 폐지 — 이제 Supabase Postgres 영구 저장.)
- **`src/generated/prisma/`는 `.gitignore`** — 의존하는 파일은 `tsconfig exclude`로 빼야 Vercel 빌드 통과 (`prisma/seed.ts` 사례).
- **React 19 ESLint 규칙**: `react-hooks/set-state-in-effect`가 useEffect → setState 패턴을 차단. localStorage 같은 외부 store는 `useSyncExternalStore`로 (`deadline-banner.tsx` 참고).

## webpack 청크 캐시 손상 패턴 (Step 6, Step 8 재발 확인)
신규 라우트 + middleware/store 동시 추가 시 `.next/` 청크 그래프 stale.
**증상**: `Cannot find module './XXX.js'` 런타임 에러 (`/login`, `/diagnosis` 등)
**해결**: dev 서버 재시작 + 캐시 삭제 (1줄):
```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; rm -rf .next && npm run dev
```
**예방**: Step 단위 큰 변경(신규 페이지 + middleware/store) 후 dev 재시작 권장

## Playboard — 운영 SoT (★ 동시 갱신 규칙)

OnDay는 화면·기능·기술기획의 **운영 현황을 Playboard**로 단일 관리한다.

- **SoT**: `src/lib/playboard/registry.ts` (화면 9 · 사용자 flow 5 · 기술기획 항목 · mission-critical 6영역 · `SCREEN_SPECS`[화면별 5종: 요구사항·게이트·데이터계약·예외·NFR] · `AREA_SPECS`[영역별 제어 스펙] · `CONVERGENCE`[갭 후속]).
- **상황판**: `/playboard`(인덱스·커버리지 매트릭스·흐름) → `/playboard/[id]`(화면 상세) → `/playboard/flow/[type]`(흐름). 정적 렌더, registry만 참조(진단·DB import 0).

### ★ 동시 갱신 규칙 (앞으로 이렇게 운영한다)
다음 변경 시 **`registry.ts`를 같은 PR에서 함께 갱신**한다:
- **요구사항 변경/추가** → 해당 화면 `SCREEN_SPECS[*].requirements` 또는 `AREA_SPECS` 갱신.
- **화면/라우트 신설·제거** → `SCREENS`(+ 스크린샷)·`USER_FLOWS` 갱신.
- **구현 완료/이연/범위변경** → 해당 항목 `status` 갱신(`implemented`/`deferred`/`unimplemented`/`unplanned` 또는 `SpecStatus`).
- **갭의 이슈화/해소** → `CONVERGENCE` 항목 `status`·`link` 갱신.

### ★ 4-상태 분류 의미 (정직성 핵심)
`AREA_SPECS` 제어와 매트릭스 표기는 "갭"을 뭉뚱그리지 않는다:
- **implemented** — 코드 `file:line` 또는 플랫폼 기본(Vercel·Supabase).
- **deferred** — SRS/CON이 **GA 이후·v1.5+로 명시 결정**(예: AES-256 = CON-16, 관측성 SLO = CON-17). **★ 미기획 아님**.
- **unimplemented** — REQ-NF 요구는 문서화 / 코드 없음(예: WAF REQ-NF-022).
- **unplanned** — SRS/PRD에도 없음(순수 미기획, 예: DB 자동 롤백). 현재 1건.

> 모든 항목은 `evidence`(SRS/PRD/CON ID 또는 코드 `file:line`)를 둔다 — 추측·창작 금지. 근거 없으면 `unplanned`로 정직 표기.
