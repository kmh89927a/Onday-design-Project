# BUILD_INSTRUCTIONS — Claude Code 첫 명령

아래 코드블록 전체를 복사해서 Claude Code(또는 Antigravity)에 첫 메시지로 붙여넣으세요.

---

````
이 폴더는 동네 궁합 진단기(Onday) — 한국 프롭테크 앱의 디자인 핸드오프 번들이야.

# 입력 자료 (필수 읽기 순서)
1. design-tokens.md       — 색상, 폰트, 간격, 컴포넌트 토큰 (Tailwind/shadcn 변환 가능)
2. components-spec.md     — 31개 React 컴포넌트의 Props/상태/접근성 명세
3. interactions-spec.md   — 라우팅 맵(35개 액션) + 상태 관리 + Next.js App Router 구조
4. screens/               — 정적 HTML 레퍼런스 (디자인 톤 100% 보존용 — 시각적 truth)

# 변환 코드 스니펫 (그대로 프로젝트에 복사)
- tailwind-config-snippet.ts → tailwind.config.ts
- globals-css-snippet.css    → src/app/globals.css

# 추가 컨텍스트 (반드시 함께 읽기)
- ../tasks/                                  — UI-001~014, CMD-XXX, QRY-XXX 기능 명세
                                               (마스터: 06_TASK_LIST_v1.3.md)
- ../../SRS-from-PRD-동네궁합진단기/         — SRS 문서 (선택 참조 / 충돌 시 최우선)

위 두 폴더가 없거나 비어있으면 알려줘.
충돌 시 우선순위: SRS > tasks > 이 번들

# Tech Stack (확정 — 다른 안 제안 금지)
- Next.js 14 App Router + TypeScript (strict)
- Tailwind CSS + shadcn/ui (Pretendard 폰트 — globals-css-snippet.css에 CDN 포함)
- 폼: react-hook-form + Zod
- 글로벌 상태: Zustand
- 서버 상태: TanStack Query (v5)
- 지도: react-kakao-maps-sdk (Mock 우선, env로 키 주입)
- 인증: Supabase Auth (@supabase/ssr) — 카카오/네이버 OAuth provider
- ORM: Prisma
- 모니터링: Sentry
- 테스트: Vitest (단위) + Playwright (e2e 1 happy path) + axe (a11y)
- 라우팅 패턴: parallel + intercepted route로 /diagnosis/result/[id] 모달 구현

# 빌드 목표
7개 라우트(/login, /diagnosis, /diagnosis/result, /diagnosis/result/[id],
/share/[uuid], /deadline, /single)와 31개 컴포넌트를 production 품질로,
백엔드 없이 Mock으로 즉시 실행 가능한 풀스택 데모.

# 첫 작업 — 분석 only (코드 변경 절대 금지)

## Step 1. 자료 읽기
README.md → BUILD_INSTRUCTIONS.md(이 파일) → design-tokens.md →
interactions-spec.md → components-spec.md → screens/index.html →
screens/*.html(7개) 순으로 읽고, ../tasks/ 와 ../../SRS-... 도 훑어.
각 문서에서 발견한 충돌 / 모호한 점은 따로 메모.

## Step 2. 토큰 통합 계획
tailwind-config-snippet.ts와 globals-css-snippet.css를 Next.js 14 App Router
프로젝트 구조에 어떻게 통합할지 표로 정리:
- 어느 파일에 어떻게 복사 / merge 할지
- shadcn/ui 초기화(components.json) 시 cssVariables: true 설정
- Pretendard 로딩 전략 (CDN vs next/font)
- darkMode 설정 (디자인은 라이트만이지만 토큰은 예약됨)

## Step 3. 31개 컴포넌트 빌드 우선순위 (의존성 그래프)
components-spec.md의 카테고리(Layout/Navigation/Action/Form/Display/Card/
Surface/Map/Composite)를 기준으로 의존성 그래프를 그리고, 빌드 순서를
ASCII 또는 마크다운 표로 제시. shadcn 베이스(Button/Input/Sheet/Dialog/
Tabs/Slider/Toast 등)부터 → primitive → composite 순.

## Step 4. Mock 인프라 설계
백엔드 없이 동작하도록:
- Supabase Auth Mock (/app/api/auth/* 또는 Supabase local)
  · 카카오/네이버 OAuth 시뮬레이션
  · 게스트 세션 (24h cookie)
- /app/api/* Route Handlers로 Mock 응답 (또는 MSW)
- /mocks/data/*.ts 시드 (후보 동네 12개, 안전격자, 통근시간, 공유 리포트)
- TanStack Query 키 매트릭스 (interactions-spec.md §6 그대로 채택 가능)
- 좋아요/공유 mutation — optimistic update 정책
- react-kakao-maps-sdk → MapPlaceholder 컴포넌트로 교체 가능한 구조

## Step 5. 12단계 빌드 계획
다음 12단계로 작업을 쪼개서 각 단계의 산출물·완료 조건·예상 파일 목록을 표로:

1.  환경 셋업 (Next.js 14 + TS strict + Tailwind + ESLint/Prettier + Husky)
2.  디자인 토큰 적용 (tailwind.config.ts + globals.css + shadcn init + Pretendard)
3.  Mock 인프라 (Supabase mock + MSW + 시드 데이터 + TanStack Query 셋업)
4.  shadcn 베이스 컴포넌트 (Button/Input/Sheet/Dialog/Tabs/Slider/Toast 등)
5.  31개 커스텀 컴포넌트 (의존성 순서대로 — Step 3 결과 참고)
6.  글로벌 상태 store (session, favorites, ui — Zustand)
7.  /login + Supabase OAuth Mock + 게스트 진입
8.  /diagnosis + react-hook-form + 자동완성 (240ms debounce)
9.  /diagnosis/result + 지도 + 카드 + 필터 (URL 동기화 200ms debounce)
10. /diagnosis/result/[id] intercepted route + DetailSheet + 좋아요
11. /share/[uuid] (LockedCard 게이팅) + /deadline (캘린더+타임라인) + /single
12. 통합/테스트/배포 (a11y 검수 axe + reduced-motion + Lighthouse + Playwright 1 happy path + Sentry + Vercel 배포 가이드)

각 단계마다 예상 소요 시간(시간 단위)도 같이.

## Step 6. 폴더 구조 + 위험 요소
- src/ 트리를 마크다운으로 그려서 보여줘 (interactions-spec.md §3 상태 저장 위치 매트릭스 반영)
- 위험/가정 표:
  · 자료 간 충돌 (어느 쪽을 따를지 제안)
  · Mock으로 시뮬레이션 어려운 부분 (실제 통근시간 API 등)
  · 한국어 폰트 라이선스 / 로딩 FOUT
  · 모바일 키보드 + 바텀시트 충돌 (iOS Safari visualViewport)
  · 그 외 발견 사항

# 디자인 보존 규칙 (절대 위반 금지)
- screens/*.html이 시각적 truth. 픽셀/간격/컬러/radius 임의 변경 금지.
- 토큰 이름은 design-tokens.md 그대로 (--primary, --s-3, --shadow-card 등).
- Pretendard 한글 폰트 기본. OAuth 컬러는 로그인 외 사용 금지.
- 안전등급 뱃지는 letter + label + 색 3중 표기 필수 (색맹 대응).
- 포커스 링 2px brand + 2px offset, 모든 인터랙티브 요소에 적용.
- prefers-reduced-motion 시 모든 애니메이션 0.01ms로 단축 (globals.css 자동 처리).

# 출력 양식
Step 1~6을 순서대로, 각 Step은 마크다운 헤더(##)로 구분. 표는 마크다운 표.
**아직 코드는 절대 쓰지 마.** Step 6까지 끝나고 내가 "Go"라고 하면
그때부터 Step 1(환경 셋업)부터 자율 빌드.

# 에이전트 질문 가이드 (막히면)
- 자료에 답이 없으면 추측하지 말고 질문할 것.
- 자료 간 모순이 있으면 표로 정리해서 어느 쪽을 따를지 제안하고 컨펌 받기.
- screens/*.html과 spec이 다르면 screens/를 시각 기준으로, spec을 구조 기준으로 채택.
  그래도 모호하면 질문.
- ../tasks/와 SRS는 이 번들보다 우선. 단 디자인은 screens/* 우선.

준비 됐으면 Step 1부터 시작해.
````

---

## 부록: 명령 사용 전 체크리스트

- [ ] `handoff-bundle.zip`을 풀어서 작업 디렉터리에 두었다
- [ ] `../tasks/` 폴더가 존재하고 UI-XXX/CMD-XXX/QRY-XXX 태스크가 채워져 있다
- [ ] `../../SRS-from-PRD-동네궁합진단기/` 폴더가 존재한다
- [ ] Supabase 프로젝트 생성 + 카카오/네이버 OAuth provider 설정 일정 확인
- [ ] Kakao Map SDK 키 발급 일정 확인 (Mock으로 시작 → 나중에 env 주입)
- [ ] Pretendard CDN 사용 정책 확인 (사내망 차단 없는지)

## 부록: 분석 후 "Go"를 받으면

Claude Code가 자율적으로 12단계를 진행합니다. 중간에 다음 시점마다 사용자 컨펌을 받도록 명령에 명시되어 있습니다:
- Step 2 완료 후 (토큰 적용 검증 — 토큰 컬러 샘플 페이지를 보여주고 컨펌)
- Step 5 완료 후 (31개 컴포넌트 — Storybook 또는 단일 데모 페이지로 전수 확인)
- Step 11 완료 후 (7개 라우트 통합 — 실제 흐름 데모 후 Step 12로)
