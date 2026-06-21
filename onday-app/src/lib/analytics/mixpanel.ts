import mixpanel from "mixpanel-browser";

// MON-003 v1.4 부활 (Issue #127) — REQ-NF-008 평균 탐색 완료 시간 p50 ≤ 10분 측정.
//   diagnosis_started → diagnosis_completed funnel = Mixpanel Dashboard p50 자동 계산.
//
// 가드 영역:
//   (1) Module-level lazy init (window 가드 + Token 가드 + initialized 플래그)
//   (2) Token 미설정 시 noop (AC-5 사수 — mock 환경 + 르르 미등록 환경 모두 안전)
//   (3) PII 마스킹 이중 방어 (Sentry PII 답습 진화):
//       - mixpanel.init({ ip: false }) — SDK 자동 ip 추적 제거 + 익명 distinct_id 자동
//       - track properties = { diagnosis_id, timestamp } 만 = 이메일/전화/주소 미포함

let initialized = false;

function ensureInit(): boolean {
  if (initialized) return true;
  if (typeof window === "undefined") return false;

  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return false;

  mixpanel.init(token, {
    ip: false,
    persistence: "localStorage",
    debug: process.env.NODE_ENV !== "production",
  });
  initialized = true;
  return true;
}

export function trackDiagnosisStarted(diagnosisId: string): void {
  if (!ensureInit()) return;
  mixpanel.track("diagnosis_started", {
    diagnosis_id: diagnosisId,
    timestamp: Date.now(),
  });
}

export function trackDiagnosisCompleted(diagnosisId: string): void {
  if (!ensureInit()) return;
  mixpanel.track("diagnosis_completed", {
    diagnosis_id: diagnosisId,
    timestamp: Date.now(),
  });
}

// ── 상단 퍼널 5종 (11주차 수요 — AARRR_NSM_PROPOSAL.md G2 해소: 진단 제출 前 이탈 가시화) ──
//   ★ 기존 패턴 동일: ensureInit(token no-op·ip:false) + 비식별 속성만.
//   ★ PII 0 — 주소·좌표·역 이름·이메일 절대 미포함. 유형/카운트/모드 같은 카테고리만.

export function trackLandingViewed(): void {
  if (!ensureInit()) return;
  mixpanel.track("landing_viewed", { timestamp: Date.now() });
}

export function trackLoginEntered(method: "kakao" | "guest" | "reviewer"): void {
  if (!ensureInit()) return;
  mixpanel.track("login_entered", { method, timestamp: Date.now() });
}

export function trackDiagnosisInputViewed(mode: "couple" | "single"): void {
  if (!ensureInit()) return;
  mixpanel.track("diagnosis_input_viewed", { mode, timestamp: Date.now() });
}

// ★ count = 확정된 주소 순번(1=A, 2=B). 주소 title·coordinate·역 이름은 절대 담지 않는다(재식별 차단).
export function trackAddressVerified(count: 1 | 2): void {
  if (!ensureInit()) return;
  mixpanel.track("address_verified", { count, timestamp: Date.now() });
}

// ★ mode 만 — /diagnosis 입력 화면엔 deadline 입력이 없다(deadline 은 별도 /deadline 라우트).
//   설계의 has_deadline 은 deadline 발 제출 지점이 생기면 그때 추가(없는 값 만들지 않음).
export function trackDiagnosisSubmitClicked(mode: "couple" | "single"): void {
  if (!ensureInit()) return;
  mixpanel.track("diagnosis_submit_clicked", { mode, timestamp: Date.now() });
}

// ── Referral·Retention 4종 (11주차 수요 — AARRR_NSM_PROPOSAL.md 보완 10개의 나머지) ──
//   ★ 기존 패턴 동일 + PII 0. ★★ 공유 토큰(shareUrl/uniqueUrl)·주소(addressA/B)·역 이름 절대 미포함.
//   share_link_signup 은 제외 — share→login CTA 에 attribution 연결이 없어 측정 불가(억지 창작 금지, 후속 과제).

// ★ diagnosis_id = 내부 uuid(기존 diagnosis_started 패턴). 공유 토큰(uniqueUrl)은 담지 않는다.
export function trackShareLinkCreated(diagnosisId: string, mode: "couple" | "single"): void {
  if (!ensureInit()) return;
  mixpanel.track("share_link_created", { diagnosis_id: diagnosisId, mode, timestamp: Date.now() });
}

// ★ mode 만 — share 페이지 data 의 uniqueUrl·addressA/B 는 절대 담지 않는다(재식별 차단).
export function trackShareLinkClicked(mode: "couple" | "single"): void {
  if (!ensureInit()) return;
  mixpanel.track("share_link_clicked", { mode, timestamp: Date.now() });
}

// ★ mode 만 — 불러온 config 의 주소는 절대 담지 않는다.
export function trackSavedSearchLoaded(mode: "couple" | "single"): void {
  if (!ensureInit()) return;
  mixpanel.track("saved_search_loaded", { mode, timestamp: Date.now() });
}

// ★ days_left(숫자)만 — ISO 날짜 대신 D-day 로 환원(식별성 0).
export function trackDeadlineModeActivated(daysLeft: number): void {
  if (!ensureInit()) return;
  mixpanel.track("deadline_mode_activated", { days_left: daysLeft, timestamp: Date.now() });
}
