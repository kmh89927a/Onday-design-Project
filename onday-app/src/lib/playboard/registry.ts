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
// 레지스트리 루트
// ──────────────────────────────────────────────────────────────────────────

export const PLAYBOARD_REGISTRY = {
  screens: SCREENS,
  flows: USER_FLOWS,
  techItems: TECH_ITEMS,
  criticalAreas: CRITICAL_AREAS,
  convergence: CONVERGENCE,
} as const;
