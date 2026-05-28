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
