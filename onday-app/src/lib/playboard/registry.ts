// Playboard SoT 레지스트리 (Phase A — 데이터 모델만, UI 없음).
//
// ★ 격리 원칙: 이 파일은 진단·DB·API·use-diagnosis 등 앱 로직을 절대 import 하지 않는다.
//   타입도 인라인 정의(앱 타입 미참조)하여 결합 0. 하드코딩 메타데이터만 — 실 사용자 데이터 X.
// ★ 정직성: status="implemented" 는 file:line 근거 보유, 미기획은 "gap" 으로 명시. 과장·창작 금지.
//   빈 매트릭스 셀 = 갭(미기획)으로 솔직히 드러낸다.
//
// 이후 수렴(PRD 갱신·신규 이슈)의 착지점. Phase B(UI)·404 가드는 별도.

// ──────────────────────────────────────────────────────────────────────────
// 타입 정의 (인라인 — 앱 타입 미참조)
// ──────────────────────────────────────────────────────────────────────────

export type ImplStatus = "implemented" | "partial" | "excluded" | "gap";

export type UserType =
  | "couple" // 맞벌이 부부
  | "single" // 1인 가구
  | "guest" // 비로그인 체험
  | "reviewer" // 채용 담당/심사관
  | "share-recipient"; // 공유 링크 수신자(배우자)

/** 화면 노드 — 한 화면의 메타·역할·스크린샷·상태. */
export interface ScreenNode {
  id: string;
  url: string;
  title: string;
  role: string;
  userTypes: UserType[];
  /** #226/#228 캡처 자산(앱 외부 e2e/screenshots). 없으면 null. */
  screenshot: string | null;
  /** 모드별 추가 캡처(예: 싱글 입력). */
  altScreenshots?: string[];
  status: ImplStatus;
  note?: string;
  // 향후 수렴용(구조만, 현재 비움):
  prdRefs?: string[];
  issueRefs?: string[];
}

/** 사용자 flow — 화면 id 순서 배열. */
export interface UserFlow {
  id: UserType;
  label: string;
  persona: string;
  screens: string[]; // ScreenNode.id 순서
}

/** mission-critical 6영역. */
export type CriticalAreaId =
  | "auth-session" // 인증·세션
  | "access-control" // 접근제어
  | "data-integrity" // 데이터 무결성·백업
  | "resilience" // 장애·복구
  | "observability" // 관측성
  | "performance"; // 성능·캐시

/** 기술기획 항목 — 구현된 기술적 고려. */
export interface TechItem {
  id: string;
  area: CriticalAreaId;
  title: string;
  point: string; // 기술 포인트(무엇을·왜)
  evidence: string[]; // file:line 근거 (implemented 면 필수)
  status: ImplStatus;
  prdRefs?: string[];
  issueRefs?: string[];
}

/** mission-critical 영역 — 매핑된 기술항목 + 갭 명시. */
export interface CriticalArea {
  id: CriticalAreaId;
  label: string;
  /** 이 영역을 충족하는 TechItem.id[]. */
  techItemIds: string[];
  /** 이 영역이 행사되는 화면 id[] (빈 셀=미행사=잠재 갭). */
  exercisedOnScreens: string[];
  status: ImplStatus; // implemented | partial | gap
  /** partial/gap 사유 — 무엇이 비어 있는지 솔직히. */
  gapNote?: string;
}

// ──────────────────────────────────────────────────────────────────────────
// 1. 화면 노드 (9: 8 화면 + /share 별도)
// ──────────────────────────────────────────────────────────────────────────

export const SCREENS: ScreenNode[] = [
  {
    id: "landing",
    url: "/landing",
    title: "랜딩",
    role: "서비스 가치 노출 — Hero·Before/After·페르소나·시장·CTA (루트 / 에서 redirect)",
    userTypes: ["couple", "single", "guest", "reviewer"],
    screenshot: "e2e/screenshots/couple_step_1_landing.png",
    status: "implemented",
  },
  {
    id: "login",
    url: "/login",
    title: "로그인",
    role: "카카오 OAuth(mock/실) + 게스트 체험 + 심사관 원클릭 진입",
    userTypes: ["couple", "single", "guest", "reviewer"],
    screenshot: "e2e/screenshots/couple_step_2_login.png",
    status: "implemented",
    note: "MVP 인증은 mock 토글 지원(NEXT_PUBLIC_USE_MOCK_AUTH). 네이버는 GA 이연.",
  },
  {
    id: "diagnosis-input",
    url: "/diagnosis",
    title: "진단 입력",
    role: "STEP 1/2 — 모드 토글(커플/싱글), 직장/여가 주소, 필터·예산·선호",
    userTypes: ["couple", "single", "guest", "reviewer"],
    screenshot: "e2e/screenshots/couple_step_3_addresses.png",
    altScreenshots: ["e2e/screenshots/single_step_1_input.png"],
    status: "implemented",
  },
  {
    id: "couple-result",
    url: "/diagnosis/result/[id]",
    title: "커플 결과",
    role: "두 직장 동선 교집합 후보 — 지도·필터바·후보 카드·DetailSheet",
    userTypes: ["couple", "guest", "reviewer"],
    screenshot: "e2e/screenshots/couple_step_4_result.png",
    status: "implemented",
  },
  {
    id: "single-result",
    url: "/single/[id]",
    title: "싱글 결과",
    role: "직장+여가거점 — 야간 안전 등급(A~D) 중심 추천 + 지도",
    userTypes: ["single", "guest", "reviewer"],
    screenshot: "e2e/screenshots/single_step_2_result.png",
    status: "implemented",
  },
  {
    id: "detail-sheet",
    url: "/diagnosis/result/[id]#detail",
    title: "후보 상세 시트(DetailSheet)",
    role: "후보 클릭 시 바텀시트 — 점수·매물·지도·통근 A/B·스트레스·찜/공유",
    userTypes: ["couple", "single", "guest", "reviewer"],
    screenshot: "e2e/screenshots/playboard_detail_sheet.png",
    status: "implemented",
  },
  {
    id: "deadline-input",
    url: "/deadline",
    title: "이사 데드라인 — 입력",
    role: "이사 마감일 입력(최소 7일 후) → 5단계 체크리스트 자동 생성 트리거",
    userTypes: ["couple", "single", "reviewer"],
    screenshot: "e2e/screenshots/playboard_deadline_input.png",
    status: "implemented",
  },
  {
    id: "deadline-timeline",
    url: "/deadline",
    title: "이사 데드라인 — D-day 타임라인",
    role: "D-day 카운트다운 + 계약 역산 체크리스트(D-30~D-Day) + 교집합 급매 매물",
    userTypes: ["couple", "single", "reviewer"],
    screenshot: "e2e/screenshots/playboard_deadline_timeline.png",
    status: "implemented",
  },
  {
    id: "share",
    url: "/share/[uuid]",
    title: "공유 리포트(배우자 미리보기)",
    role: "공유 링크 수신자가 무료 미리보기 — 로그인 불요(서버 컴포넌트)",
    userTypes: ["share-recipient"],
    screenshot: null,
    status: "excluded",
    note: "캡처 제외: 서버 컴포넌트가 prisma.shareLink.findUnique(실 DB 읽기) 호출 → mock 인터셉트 범위 밖. 실 DB 안전 위해 Playboard 캡처에서 분리(별도 표기).",
  },
];

// ──────────────────────────────────────────────────────────────────────────
// 2. 사용자 flow (5유형)
// ──────────────────────────────────────────────────────────────────────────

export const USER_FLOWS: UserFlow[] = [
  {
    id: "couple",
    label: "커플(맞벌이)",
    persona: "3040 맞벌이 부부 — 두 직장 동선 교집합 동네 탐색",
    screens: ["landing", "login", "diagnosis-input", "couple-result", "detail-sheet", "deadline-timeline"],
  },
  {
    id: "single",
    label: "싱글(1인 가구)",
    persona: "1인 가구 — 직장+여가거점 기준 야간 안전 중시",
    screens: ["landing", "login", "diagnosis-input", "single-result", "detail-sheet"],
  },
  {
    id: "guest",
    label: "게스트(비로그인 체험)",
    persona: "가입 전 체험 — 진단은 되나 찜/공유는 게이트 제한",
    screens: ["landing", "login", "diagnosis-input", "couple-result"],
  },
  {
    id: "reviewer",
    label: "심사관(채용 담당)",
    persona: "채용 담당자 데모 — 원클릭 풀기능(저장/공유 차단 면제)",
    screens: ["login", "diagnosis-input", "couple-result", "deadline-timeline"],
  },
  {
    id: "share-recipient",
    label: "공유 수신자(배우자)",
    persona: "공유 링크 수신 — 로그인 없이 무료 미리보기",
    screens: ["share"],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// 3. 기술기획 항목 (10 — 이미 구현, file:line 근거)
// ──────────────────────────────────────────────────────────────────────────

export const TECH_ITEMS: TechItem[] = [
  {
    id: "vercel-timeout-avoidance",
    area: "performance",
    title: "Vercel 10초 timeout 회피 — 클라 오케스트레이션",
    point: "외부 API 반복 호출/교차 연산을 Server Action 이 아닌 클라이언트 Promise.all(B2)로 처리해 Vercel 함수 10초 제한을 우회.",
    evidence: ["src/features/diagnosis/use-diagnosis.ts:7", "src/features/diagnosis/run-real-diagnosis.ts:69", "src/features/diagnosis/run-real-diagnosis.ts:91"],
    status: "implemented",
  },
  {
    id: "mock-real-split",
    area: "data-integrity",
    title: "mock/real 분기",
    point: "NEXT_PUBLIC_USE_MOCK 토글 — mock=Haversine 오프라인 계산, real=ODsay/Kakao. 테스트·개발이 실 외부 의존 없이 동작.",
    evidence: ["src/app/api/diagnosis/route.ts:7", "src/features/diagnosis/use-diagnosis.ts:9"],
    status: "implemented",
  },
  {
    id: "persist-hydration-guard",
    area: "performance",
    title: "persist 하이드레이션 가드",
    point: "Zustand persist 로 candidates·deadlineDate 복원하되 diagnosisId 는 persist 제외 — reload 시 inSync 가드로 서버 GET/필터 복원 일관성 보장.",
    evidence: ["src/stores/diagnosis-store.ts:159"],
    status: "implemented",
  },
  {
    id: "env-zod-validation",
    area: "data-integrity",
    title: "환경변수 Zod 런타임 검증",
    point: "getServerEnv(시크릿)/getClientEnv(NEXT_PUBLIC) 분리 + Zod — env 누락을 진입점에서 명확히 차단(Preview 500 사고 방지).",
    evidence: ["src/lib/env.ts:47", "src/lib/env.ts:78"],
    status: "implemented",
  },
  {
    id: "migrate-guardrail",
    area: "data-integrity",
    title: "마이그레이션 가드레일",
    point: "파괴적 마이그레이션(dev/reset)이 비-로컬(클라우드) DB 를 향하면 거부(override 필요) — 1인 개발 실수 방지.",
    evidence: ["scripts/db/guarded-migrate.mjs"],
    status: "implemented",
  },
  {
    id: "health-check",
    area: "resilience",
    title: "헬스체크 DB ping",
    point: "/api/health 가 prisma.$queryRaw SELECT 1 로 DB 연결 검증 + env/region — 장애를 503으로 즉시 가시화. connection string 미노출.",
    evidence: ["src/lib/health.ts:37", "src/app/api/health/route.ts"],
    status: "implemented",
  },
  {
    id: "map-svg-fallback",
    area: "resilience",
    title: "지도 SVG fallback",
    point: "카카오 SDK 키 부재/로드 실패 시 SVG placeholder(격자+한강+마커+연결선)로 degrade — 무한 스피너/백지 방지.",
    evidence: ["src/components/map/map-canvas.tsx:91", "src/components/map/map-canvas.tsx:136"],
    status: "implemented",
  },
  {
    id: "e2e-db-zero-write",
    area: "data-integrity",
    title: "E2E DB 쓰기 0 (라우트 인터셉트)",
    point: "Playwright page.route 로 /api/diagnosis 를 fixture 응답 → prisma.create 미실행. 실 클라우드 DB(351 rows) 무변경으로 화면 캡처.",
    evidence: ["e2e/happy-path.spec.ts:6", "e2e/playboard.spec.ts"],
    status: "implemented",
  },
  {
    id: "safety-data-provenance",
    area: "data-integrity",
    title: "안전등급 데이터 출처·재현성",
    point: "야간 안전 등급 = 행안부 지역안전지수(범죄)×0.7 + 시군구 CCTV 밀집도×0.3. 결측은 'no_data'로 정직 표기(거짓값 금지).",
    evidence: ["src/features/single/safety-index.ts:7", "src/lib/data/DATA_PROVENANCE.md"],
    status: "implemented",
  },
  {
    id: "share-link-security",
    area: "access-control",
    title: "공유 링크 보안",
    point: "UUID v4 unique_url + 만료(expiresAt) + 선택 bcrypt 비밀번호(passwordHash) + 무료 미리보기 1회 플래그.",
    evidence: ["prisma/schema.prisma:47", "prisma/schema.prisma:48", "prisma/schema.prisma:51"],
    status: "implemented",
  },
  {
    id: "sentry-error-tracking",
    area: "observability",
    title: "Sentry 에러 트래킹 + PII 마스킹",
    point: "@sentry/nextjs config(client/server/edge) 로 init, reportErrorToSentry 헬퍼 + PII 마스킹(sendDefaultPii:false). 실 호출(심사관 진입·API 에러)에서 captureMessage/Exception. DSN 미설정 시 silent no-op.",
    evidence: ["sentry.client.config.ts", "src/lib/helpers/sentry-error.ts", "src/lib/helpers/sentry-pii-mask.ts:5", "src/components/auth/login-form.tsx:91", "src/app/api/sentry-test/route.ts:17"],
    status: "implemented",
  },
  {
    id: "mixpanel-analytics",
    area: "observability",
    title: "Mixpanel 진단 퍼널 분석",
    point: "mixpanel-browser lazy init(window·token·initialized 가드, ip:false 익명화). 진단 시작/완료 이벤트 트래킹(이메일/주소 등 PII 미포함). token 미설정 시 no-op.",
    evidence: ["src/lib/analytics/mixpanel.ts:13", "src/app/diagnosis/page.tsx:202", "src/app/diagnosis/result/[id]/result-view.tsx:73"],
    status: "implemented",
  },
];

// ──────────────────────────────────────────────────────────────────────────
// 4. mission-critical 6영역 (매핑 + ★ 갭 명시)
// ──────────────────────────────────────────────────────────────────────────

export const CRITICAL_AREAS: CriticalArea[] = [
  {
    id: "auth-session",
    label: "인증·세션",
    techItemIds: ["mock-real-split"],
    exercisedOnScreens: ["login", "diagnosis-input"],
    status: "partial",
    gapNote:
      "Supabase Auth + 카카오 OAuth + 게스트/심사관 세션은 구현(login-form.tsx). 단 MVP 는 mock 토글 의존이고, 세션 만료/refresh 의 운영 검증은 미정 — 영역으로서 'partial'.",
  },
  {
    id: "access-control",
    label: "접근제어",
    techItemIds: ["share-link-security"],
    exercisedOnScreens: ["couple-result", "single-result", "share"],
    status: "partial",
    gapNote:
      "게스트 게이트(찜/공유 차단, use-guest-gate.ts)·심사관 면제·/dev 프로덕션 404 가드는 구현. ★ GAP: 미인증 라우트 보호(미인증 redirect)는 게스트 흐름 보존을 위해 #24 로 이연 — 라우트 레벨 인증 가드는 미기획.",
  },
  {
    id: "data-integrity",
    label: "데이터 무결성·백업",
    techItemIds: ["mock-real-split", "env-zod-validation", "migrate-guardrail", "e2e-db-zero-write", "safety-data-provenance"],
    exercisedOnScreens: ["diagnosis-input", "couple-result", "single-result"],
    status: "partial",
    gapNote:
      "env 검증·마이그레이션 가드레일·E2E 격리·데이터 출처 정직성은 구현. ★ GAP: 자동 DB 백업/복원 전략(스케줄 백업·PITR)은 미기획. expand/contract 는 DB_SPEC 문서만, 실 적용 이력 없음(현재 prisma/migrations = init 1개 기준 — 마이그레이션 증가 시 갱신 필요한 동적 사실).",
  },
  {
    id: "resilience",
    label: "장애·복구",
    techItemIds: ["health-check", "map-svg-fallback"],
    exercisedOnScreens: ["couple-result", "single-result", "detail-sheet"],
    status: "partial",
    gapNote:
      "헬스체크(#10)·지도 SVG fallback 구현. 코드 롤백은 Vercel 1-click(인프라). ★ GAP: DB 마이그레이션 자동 롤백/게이트형 워크플로우·CI 자동 마이그레이션은 미기획(DB_SPEC §10.4 권장만).",
  },
  {
    id: "observability",
    label: "관측성",
    techItemIds: ["sentry-error-tracking", "mixpanel-analytics", "health-check"],
    exercisedOnScreens: ["landing", "diagnosis-input", "couple-result"],
    status: "partial",
    gapNote:
      "Sentry 에러 트래킹·Mixpanel 진단 퍼널·헬스 구조화 로그 배선됨(위 techItemIds). ★ GAP: SLO/알람 임계·대시보드·로그 집계 파이프라인은 미정. Sentry Uptime/Vercel Analytics 운영 설정은 외부(콘솔). Sentry DSN·Mixpanel token 미설정 시 no-op(런타임 안전, 운영 활성화는 env 설정 의존).",
  },
  {
    id: "performance",
    label: "성능·캐시",
    techItemIds: ["vercel-timeout-avoidance", "persist-hydration-guard"],
    exercisedOnScreens: ["diagnosis-input", "couple-result", "deadline-timeline"],
    status: "partial",
    gapNote:
      "Vercel 10초 timeout 회피(클라 Promise.all)·persist 캐시·TanStack Query 캐시·insight 캐시 구현. ★ GAP: 페이지 레벨 ISR/CDN 캐시 전략·Lighthouse 예산 게이트는 미기획(perf baseline 측정만).",
  },
];

// ──────────────────────────────────────────────────────────────────────────
// 5. 커버리지 매트릭스 구조 (영역 × 화면 — 빈 셀 = 갭)
// ──────────────────────────────────────────────────────────────────────────

export interface CoverageCell {
  area: CriticalAreaId;
  screen: string;
  /** true = 해당 화면에서 영역이 행사됨. false = 미행사(잠재 갭). */
  exercised: boolean;
}

/** CRITICAL_AREAS.exercisedOnScreens 로부터 (영역×화면) 전수 셀 생성. 빈 셀이 곧 갭. */
export function buildCoverageMatrix(): CoverageCell[] {
  const cells: CoverageCell[] = [];
  for (const area of CRITICAL_AREAS) {
    for (const screen of SCREENS) {
      cells.push({
        area: area.id,
        screen: screen.id,
        exercised: area.exercisedOnScreens.includes(screen.id),
      });
    }
  }
  return cells;
}

// ──────────────────────────────────────────────────────────────────────────
// 6. 향후 수렴 (구조만 — PRD 갱신·신규 이슈 착지점)
// ──────────────────────────────────────────────────────────────────────────

export interface ConvergenceRef {
  /** 수렴 종류 — prd 갱신, 신규 이슈, 갭 후속. */
  kind: "prd-update" | "new-issue" | "gap-followup";
  /** 연결 대상 — screen/tech/area id. */
  targetId: string;
  title: string;
  status: "open" | "merged" | "planned";
  link?: string; // PR/이슈 URL 등
}

/** 현재 비움 — Phase B+ 수렴 시 append. 빈 배열 = 아직 수렴 항목 없음(정직). */
export const CONVERGENCE: ConvergenceRef[] = [];

// ──────────────────────────────────────────────────────────────────────────
// 7. 화면별 기술스펙 5종 (요구사항·게이트·데이터계약·예외·NFR)
//    ★ 전부 실제 근거(file:line)만. status: implemented(근거 있음)/partial/gap(미기획)/
//      na(정적·프레젠테이셔널=실제 없음)/out-of-scope(요구는 있으나 MVP 범위 밖).
//    ★ 추측 0 — 근거 없는 칸은 채우지 않고 status 로 정직 표기.
//    evidence: SRS 는 프로젝트 루트 기준 docs/...:line, 코드는 onday-app 기준 src/...:line.
//    nfr 은 CriticalAreaId 참조만(정의는 CRITICAL_AREAS — 중복 정의 X).
// ──────────────────────────────────────────────────────────────────────────

export type SpecStatus = "implemented" | "partial" | "gap" | "na" | "out-of-scope";

export interface SpecItem {
  text: string;
  evidence: string[]; // file:line (없을 수 있음 — na/gap)
  status?: SpecStatus; // 기본 implemented
}

export interface ScreenSpec {
  requirements: SpecItem[];
  gates: SpecItem[];
  dataContracts: SpecItem[];
  exceptions: SpecItem[];
  nfr: CriticalAreaId[]; // 참조만 — 정의는 CRITICAL_AREAS
}

export const SCREEN_SPECS: Record<string, ScreenSpec> = {
  landing: {
    requirements: [
      { text: "PRD/SRS 에 랜딩 전용 기능 요구 없음 (Step 13 디자인 작업물 — 가치 노출 마케팅 페이지)", evidence: [], status: "gap" },
    ],
    gates: [
      { text: "공개 — 인증 게이트 없음. 미들웨어는 /dev 만 차단·세션 갱신", evidence: ["src/middleware.ts:13"], status: "na" },
    ],
    dataContracts: [
      { text: "정적 페이지 — API/DB 호출 없음 (라우터 이벤트만)", evidence: [], status: "na" },
    ],
    exceptions: [
      { text: "정적 콘텐츠 — 에러/로딩 상태 없음", evidence: [], status: "na" },
    ],
    nfr: ["observability"],
  },

  login: {
    requirements: [
      { text: "REQ-FUNC-029 — Supabase Auth 기반 카카오·네이버 소셜 로그인 (httpOnly cookie 세션)", evidence: ["docs/05_SRS_v1.7.md:513"] },
      { text: "REQ-NF-018 — 인증 세션 보안: httpOnly cookie + sameSite strict + CSRF(Supabase 내장)", evidence: ["docs/05_SRS_v1.7.md:561"] },
    ],
    gates: [
      { text: "공개 — 미들웨어 세션 갱신. IS_MOCK_AUTH 분기(mock 즉시 로그인 / real OAuth redirect)", evidence: ["src/middleware.ts:19", "src/components/auth/login-form.tsx:40"] },
    ],
    dataContracts: [
      { text: "real: supabase.auth.signInWithOAuth({ provider:'kakao' }) → /auth/callback", evidence: ["src/components/auth/login-form.tsx:54"] },
      { text: "세션: SessionUser { id, nickname, provider } → useSessionStore.setUser", evidence: ["src/stores/session.ts:42"] },
    ],
    exceptions: [
      { text: "OAuth 실패 → try/catch → danger 토스트(err.message ?? '로그인에 실패했어요')", evidence: ["src/components/auth/login-form.tsx:67"] },
    ],
    nfr: ["auth-session"],
  },

  "diagnosis-input": {
    requirements: [
      { text: "REQ-FUNC-001/002 — 두 직장 주소 입력 + 자동완성(Geocoding), 2개 입력 시에만 진단 활성", evidence: ["docs/05_SRS_v1.7.md:412", "docs/05_SRS_v1.7.md:413"] },
      { text: "REQ-FUNC-005/006 — 출근 시간대 재계산(p95≤2s) + 필터(통근·예산) 실시간(p95≤1s)", evidence: ["docs/05_SRS_v1.7.md:416", "docs/05_SRS_v1.7.md:417"] },
      { text: "REQ-FUNC-021/024 — 싱글 모드(직장+여가 2곳, 학군 숨김) + 비수도권 안내(≤500ms)", evidence: ["docs/05_SRS_v1.7.md:477", "docs/05_SRS_v1.7.md:480"] },
      { text: "REQ-FUNC-031 — 수도권 외 주소 안내 UI + 진단 차단", evidence: ["docs/05_SRS_v1.7.md:514"] },
    ],
    gates: [
      { text: "공개 진입(미들웨어 세션갱신만). '이전 조건 불러오기' 저장은 로그인 유저만", evidence: ["src/app/diagnosis/page.tsx:205"], status: "partial" },
    ],
    dataContracts: [
      { text: "POST /api/diagnosis — req: diagnosisInputSchema(주소·좌표·filters·mode·deadline)", evidence: ["src/lib/validators/diagnosis.ts:8"] },
      { text: "res: { diagnosisId, candidates[], pool?, timeline? }", evidence: ["src/app/api/diagnosis/route.ts:52"] },
      { text: "DB: Diagnosis(userId·filters JSON·candidates JSON·mode·deadline)", evidence: ["prisma/schema.prisma:24"] },
    ],
    exceptions: [
      { text: "수도권 밖 주소 선택 → isWithinMetroBounds 차단 + 토스트", evidence: ["src/app/diagnosis/page.tsx:337"] },
      { text: "canSubmit 가드(verifiedA && verifiedB && !isPending)", evidence: ["src/app/diagnosis/page.tsx:176"] },
      { text: "진단 요청 실패 → try/catch → setError + danger 토스트", evidence: ["src/app/diagnosis/page.tsx:179"] },
      { text: "localStorage quota 초과 → silent fail(진단 흐름 차단 X)", evidence: ["src/app/diagnosis/page.tsx:215"] },
    ],
    nfr: ["auth-session", "data-integrity", "observability", "performance"],
  },

  "couple-result": {
    requirements: [
      { text: "REQ-FUNC-003/004 — 교집합 후보 3곳+ 지도 시각화(≤3s) + 양쪽 통근시간(오차≤±10%)", evidence: ["docs/05_SRS_v1.7.md:414", "docs/05_SRS_v1.7.md:415"] },
      { text: "REQ-FUNC-007 — 교통 API 타임아웃 시 토스트 + 자동 재시도 1회(총≤10s). ★ 재시도 로직 미구현(코드는 catch→토스트만)", evidence: ["docs/05_SRS_v1.7.md:418"], status: "gap" },
      { text: "REQ-FUNC-008 — 교집합 0곳 안내 + 조건 완화 제안 2개+ (#125)", evidence: ["docs/05_SRS_v1.7.md:419"] },
      { text: "REQ-FUNC-012 — 모든 데이터 항목 출처 배지 + 업데이트 일자(투명도 100%)", evidence: ["docs/05_SRS_v1.7.md:438"] },
    ],
    gates: [
      { text: "URL id 진입. 저장/공유는 useGuestGate(user===null && !isReviewer 차단)", evidence: ["src/features/auth/use-guest-gate.ts:36"] },
      { text: "복원: inSync(진단직후 store) / 직접접속 시 GET /api/diagnosis/[id]", evidence: ["src/app/diagnosis/result/[id]/result-view.tsx:58"] },
    ],
    dataContracts: [
      { text: "GET /api/diagnosis/[id] → { candidates[], filters, mode, deadline, status }", evidence: ["src/app/api/diagnosis/[id]/route.ts:22"] },
      { text: "DetailSheet props(candidate{name,score,pills,commutes,metrics}, map, CTA)", evidence: ["src/components/sheet/detail-sheet.tsx:39"] },
    ],
    exceptions: [
      { text: "로딩 → ResultSkeleton / 에러 → ErrorState(다시 입력)", evidence: ["src/app/diagnosis/result/[id]/result-view.tsx:77"] },
      { text: "빈 후보 → EmptyState + 완화 제안(generateRelaxationSuggestions, #125)", evidence: ["src/app/diagnosis/result/[id]/result-view.tsx:79"] },
      { text: "지도 SDK 실패/6초 타임아웃 → SVG placeholder fallback", evidence: ["src/components/map/map-canvas.tsx:89", "src/components/map/map-canvas-kakao.tsx:102"] },
    ],
    nfr: ["access-control", "data-integrity", "resilience", "observability", "performance"],
  },

  "single-result": {
    requirements: [
      { text: "REQ-FUNC-021 — 싱글 모드 학군·가족 숨김, 야간치안·편의·카페 레이어 기본 활성", evidence: ["docs/05_SRS_v1.7.md:477"] },
      { text: "REQ-FUNC-022 — 야간(22~06시) 범죄 기반 안전 등급 A~D (수도권 90%+)", evidence: ["docs/05_SRS_v1.7.md:478"] },
      { text: "REQ-FUNC-023 — 리포트 저장 window.print() + @media print (≤1s)", evidence: ["docs/05_SRS_v1.7.md:479"] },
    ],
    gates: [
      { text: "URL id 진입. 저장/공유 useGuestGate(커플과 동일)", evidence: ["src/features/auth/use-guest-gate.ts:36"] },
    ],
    dataContracts: [
      { text: "GET /api/diagnosis/[id] + 싱글 매퍼(resolveGrade·buildSinglePills/Metrics)", evidence: ["src/app/single/[id]/single-result-view.tsx:78"] },
    ],
    exceptions: [
      { text: "안전등급 no_data → resolveGrade null → '준비중' 표기 + 정렬 후순위", evidence: ["src/app/single/[id]/single-result-view.tsx:75"] },
      { text: "로딩 → SingleSkeleton / 에러·빈결과 → EmptyState", evidence: ["src/app/single/[id]/single-result-view.tsx:266"] },
    ],
    nfr: ["access-control", "data-integrity", "resilience"],
  },

  "detail-sheet": {
    requirements: [
      { text: "전용 요구 없음 — REQ-FUNC-004(통근 표시)·012(출처 배지)로 부분 커버", evidence: ["docs/05_SRS_v1.7.md:415", "docs/05_SRS_v1.7.md:438"], status: "partial" },
    ],
    gates: [
      { text: "부모(result/single)가 open prop 제어. 찜/공유는 부모 useGuestGate", evidence: ["src/app/diagnosis/result/[id]/result-content.tsx:398"] },
    ],
    dataContracts: [
      { text: "DetailSheetProps(open, candidate, onLike/liked, onShare, map, CTA)", evidence: ["src/components/sheet/detail-sheet.tsx:39"] },
    ],
    exceptions: [
      { text: "프레젠테이셔널 — 자체 예외 없음(상태는 부모가 관리)", evidence: [], status: "na" },
    ],
    nfr: ["resilience"],
  },

  "deadline-input": {
    requirements: [
      { text: "REQ-FUNC-015 — 이사 마감일 입력 + 데드라인 모드 → 5단계 타임라인 자동 생성(≤2s)", evidence: ["docs/05_SRS_v1.7.md:456"] },
      { text: "REQ-FUNC-020 — 과거 날짜 차단 + '마감일은 오늘 이후여야 합니다' 인라인 에러(≤100ms)", evidence: ["docs/05_SRS_v1.7.md:461"] },
    ],
    gates: [
      { text: "공개 — deadlineDate 미설정 시 입력 폼(인증 게이트 없음)", evidence: ["src/app/deadline/page.tsx:151"], status: "na" },
    ],
    dataContracts: [
      { text: "date input + validateDeadline → setDeadlineDate(persist)", evidence: ["src/app/deadline/page.tsx:56", "src/app/deadline/page.tsx:146"] },
    ],
    exceptions: [
      { text: "날짜 검증: 과거 → 오늘 이후 안내 / D+7 미만 → 최소 7일 후 안내", evidence: ["src/app/deadline/page.tsx:56"] },
    ],
    nfr: [], // ★ registry 영역 0 매핑 = 커버리지 갭 (NFR 미기획)
  },

  "deadline-timeline": {
    requirements: [
      { text: "REQ-FUNC-015 — 계약 역산 타임라인 5단계+ 자동 생성", evidence: ["docs/05_SRS_v1.7.md:456"] },
      { text: "REQ-FUNC-016/018 — 교집합 동네 네이버 부동산 아웃링크 + 30분 요약 카드(항목 6개+)", evidence: ["docs/05_SRS_v1.7.md:457", "docs/05_SRS_v1.7.md:459"] },
      { text: "REQ-FUNC-019 — 급매 0건 시 반경 확장·조건 완화·푸시 구독 안내(≤1s)", evidence: ["docs/05_SRS_v1.7.md:460"] },
    ],
    gates: [
      { text: "deadlineDate !== null 일 때 타임라인 뷰(조건부 렌더)", evidence: ["src/app/deadline/page.tsx:151"] },
    ],
    dataContracts: [
      { text: "buildTimeline(days) + candidates(store) + POST /api/summary(Top3 요약)", evidence: ["src/app/deadline/page.tsx:100"] },
    ],
    exceptions: [
      { text: "후보 0 → '진단을 먼저 하세요' 안내 / 요약 실패 → 클라 fallback rationale", evidence: ["src/app/deadline/page.tsx:90"] },
    ],
    nfr: ["performance"],
  },

  share: {
    requirements: [
      { text: "REQ-FUNC-009/010/011 — UUID v4 공유 링크(entropy≥128bit) + 만료 30일 + 비회원 전체 열람(미리보기 1곳)", evidence: ["docs/05_SRS_v1.7.md:435", "docs/05_SRS_v1.7.md:436", "docs/05_SRS_v1.7.md:437"] },
      { text: "REQ-NF-020/021 — 공유 보안: entropy≥128bit, 비밀번호 옵션, 비인가 개인정보 접근 차단", evidence: ["docs/05_SRS_v1.7.md:562", "docs/05_SRS_v1.7.md:563"] },
      { text: "REQ-FUNC-013/014 — 미리보기 소진 후 유료 전환 유도. ★ MVP 범위 밖(PG 결제 Out-of-Scope)", evidence: ["docs/05_SRS_v1.7.md:439", "docs/05_SRS_v1.7.md:440"], status: "out-of-scope" },
    ],
    gates: [
      { text: "getShareData(uuid): 미존재 → notFound(404) / 만료 → ExpiredView / 유효 → 미리보기 1곳만 전체", evidence: ["src/app/share/[uuid]/page.tsx:14", "src/app/share/[uuid]/page.tsx:79"] },
    ],
    dataContracts: [
      { text: "prisma.shareLink.findUnique({ uniqueUrl }) include diagnosis → ShareData(preview, locked[])", evidence: ["src/app/share/[uuid]/page.tsx:15"] },
      { text: "POST /api/share — req: { diagnosisId, password? } → res: { shareUrl, expiresAt }", evidence: ["src/lib/validators/diagnosis.ts:44", "src/app/api/share/route.ts:52"] },
    ],
    exceptions: [
      { text: "not-found → notFound() / 만료 → ExpiredView / 보안: 미리보기 외 {id,name}만 전달", evidence: ["src/app/share/[uuid]/page.tsx:79", "src/app/share/[uuid]/page.tsx:35"] },
    ],
    nfr: ["access-control"],
  },
};

// ──────────────────────────────────────────────────────────────────────────
// 8. mission-critical 영역별 제어 스펙 (Phase C)
//    ★ "갭" 대부분이 순수 미기획이 아님 — SRS §4.2 + PRD §5 + CON 에 근거.
//    4-상태로 정직 분류:
//      implemented   — 코드 구현(file:line) 또는 플랫폼 기본(Vercel/Supabase)
//      deferred      — SRS/CON 이 GA 이후·v1.5+ 로 명시 결정 (★ 미기획 아님 — 의도적 스코핑)
//      unimplemented — REQ-NF 요구는 문서화 / 코드 없음
//      unplanned     — SRS/PRD 에도 없음 (순수 미기획, 소수)
//    evidence: 코드는 onday-app 기준 src/..., SRS/PRD 는 루트 기준 docs/...:line.
// ──────────────────────────────────────────────────────────────────────────

export type ControlStatus = "implemented" | "deferred" | "unimplemented" | "unplanned";

export interface ControlItem {
  text: string;
  status: ControlStatus;
  evidence: string[];
  note?: string;
}

export const AREA_SPECS: Record<CriticalAreaId, { controls: ControlItem[] }> = {
  "auth-session": {
    controls: [
      { text: "REQ-NF-018 — Supabase Auth httpOnly cookie + sameSite strict + CSRF(Supabase 내장)", status: "implemented", evidence: ["docs/05_SRS_v1.7.md:561", "src/lib/supabase/server.ts", "src/lib/supabase/keys.ts"] },
      { text: "CON-18 — 인증 = Supabase Auth(@supabase/ssr), 카카오 OAuth Provider", status: "implemented", evidence: ["docs/05_SRS_v1.7.md:198", "src/components/auth/login-form.tsx:54"] },
      { text: "인증 플로우 QA — Closed Beta 전 완료(REQ-NF-018 측정란)", status: "deferred", evidence: ["docs/05_SRS_v1.7.md:561"], note: "운영 QA 시점 결정. 세션 refresh 는 @supabase/ssr 미들웨어가 담당." },
    ],
  },
  "access-control": {
    controls: [
      { text: "REQ-NF-020 — 공유 링크 보안: UUID v4 + 만료 30일 + bcrypt 비밀번호 옵션", status: "implemented", evidence: ["docs/05_SRS_v1.7.md:562", "prisma/schema.prisma:47", "prisma/schema.prisma:51"] },
      { text: "게스트 게이트(찜/공유 차단) + 심사관 면제 + /dev 프로덕션 404", status: "implemented", evidence: ["src/features/auth/use-guest-gate.ts:36", "src/middleware.ts:13"] },
      { text: "REQ-NF-022 — 악성 트래픽 차단: WAF + Rate Limiter(IP당 분당 60req)", status: "unimplemented", evidence: ["docs/05_SRS_v1.7.md:564", "docs/00_PRD_v1.1-rev.4.md:280"], note: "요구 문서화 / 코드 없음. Vercel Firewall·Rate Limit 후보." },
      { text: "REQ-NF-021 — 비인가 제3자 공유 링크 개인정보 접근 차단(침투 테스트)", status: "unimplemented", evidence: ["docs/05_SRS_v1.7.md:563"], note: "서버 컴포넌트가 미리보기 1곳만 전체 전달(부분 충족), 침투 테스트는 미수행." },
      { text: "미인증 라우트 보호(미인증 redirect) — 게스트 흐름 보존 위해 #24 로 이연", status: "deferred", evidence: ["src/middleware.ts:8"], note: "미들웨어는 세션 갱신만, 라우트 보호는 의도적 이연." },
    ],
  },
  "data-integrity": {
    controls: [
      { text: "환경변수 Zod 검증(getServerEnv/getClientEnv) + 마이그레이션 가드레일", status: "implemented", evidence: ["src/lib/env.ts:47", "scripts/db/guarded-migrate.mjs"] },
      { text: "REQ-NF-016 — 입력값 자동 저장 best-effort(실패 시 미통지)", status: "implemented", evidence: ["docs/05_SRS_v1.7.md:555", "src/app/diagnosis/page.tsx:205"] },
      { text: "데이터 백업 RPO ≤ 1시간 — Supabase Cloud 자동 일일 백업(플랫폼 기본)", status: "implemented", evidence: ["docs/00_PRD_v1.1-rev.4.md:260"], note: "Supabase 무료 티어 daily backup 으로 충족. app-side PITR 명시 설정은 미확인." },
      { text: "AES-256 PII 암호화 — CON-16 으로 GA 이후 결정(MVP 는 TLS 전송 암호화만)", status: "deferred", evidence: ["docs/05_SRS_v1.7.md:196"], note: "Rev 1.5 결정 — 미기획 아님." },
    ],
  },
  resilience: {
    controls: [
      { text: "REQ-NF-011 — 헬스체크 /api/health DB ping + 5분 주기(MON-001)", status: "implemented", evidence: ["docs/05_SRS_v1.7.md:552", "src/app/api/health/route.ts", "src/lib/health.ts:37"] },
      { text: "지도 SVG fallback — 카카오 SDK 실패/타임아웃 시 degrade", status: "implemented", evidence: ["src/components/map/map-canvas.tsx:91"] },
      { text: "코드 롤백(Vercel 1-click) + DB 복원(Supabase) — 플랫폼 기본", status: "implemented", evidence: ["docs/00_PRD_v1.1-rev.4.md:260"], note: "플랫폼 제공 — 앱 설정 불필요." },
      { text: "교통 API 장애 fallback(카카오↔네이버 ADR) — 실 API 미연동이라 v1.5+ 까지 보류", status: "deferred", evidence: ["docs/00_PRD_v1.1-rev.4.md:422"], note: "ADR 결정됨, MVP mock 이라 미적용." },
      { text: "DB 마이그레이션 자동 롤백/게이트형 워크플로우 — SRS/PRD 명시 없음", status: "unplanned", evidence: [], note: "★ 순수 미기획. DB_SPEC §10.4 권장만." },
    ],
  },
  observability: {
    controls: [
      { text: "REQ-NF-012/035 — Sentry 에러 트래킹 + PII 마스킹(sendDefaultPii:false)", status: "implemented", evidence: ["docs/05_SRS_v1.7.md:593", "src/lib/helpers/sentry-error.ts", "src/lib/helpers/sentry-pii-mask.ts:5"] },
      { text: "REQ-NF-008 — Mixpanel 진단 퍼널(p50 탐색 시간) + 헬스 구조화 로그", status: "implemented", evidence: ["docs/05_SRS_v1.7.md:544", "src/lib/analytics/mixpanel.ts:13", "src/app/api/health/route.ts"] },
      { text: "SLO/알람 임계·커스텀 슬랙 연동·이상 감지 자동화 — CON-17 로 GA 이후 결정", status: "deferred", evidence: ["docs/05_SRS_v1.7.md:197", "docs/05_SRS_v1.7.md:593"], note: "★ 갭 아님 — Rev 1.5 결정: MVP 는 Sentry 기본 알림만, 커스텀은 GA 이후(REQ-NF-035~038)." },
    ],
  },
  performance: {
    controls: [
      { text: "Vercel 10초 timeout 회피(클라 Promise.all) + REQ-NF-004 클라 캐싱(persist·Query·insight)", status: "implemented", evidence: ["docs/05_SRS_v1.7.md:540", "src/features/diagnosis/use-diagnosis.ts:7", "src/stores/diagnosis-store.ts:159"] },
      { text: "CDN/엣지 정적 서빙 — Vercel 플랫폼 기본", status: "implemented", evidence: ["docs/00_PRD_v1.1-rev.4.md:260"], note: "플랫폼 제공." },
      { text: "REQ-NF-002 — 페이지 로딩 p95 ≤ 1.5s: Lighthouse CI 게이트(NFR-PERF-PAGE-LOAD)", status: "unimplemented", evidence: ["docs/05_SRS_v1.7.md:538", "docs/perf/baseline-2026-05.md"], note: "baseline 측정 완료(#126), CI 자동 게이트는 미구현." },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────────
// 레지스트리 루트
// ──────────────────────────────────────────────────────────────────────────

export const PLAYBOARD_REGISTRY = {
  screens: SCREENS,
  flows: USER_FLOWS,
  techItems: TECH_ITEMS,
  criticalAreas: CRITICAL_AREAS,
  screenSpecs: SCREEN_SPECS,
  areaSpecs: AREA_SPECS,
  convergence: CONVERGENCE,
} as const;
