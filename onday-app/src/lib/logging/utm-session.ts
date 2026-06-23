// UTM 유입경로 — 익명 세션 전파 (로거 2단계 / plan S3).
// ★ 쿠키 0 — sessionStorage 만 사용(탭 스코프, 탭 종료 시 소멸). 게스트 세션 모델과 동일 프라이버시 등급.
// ★ first-touch — 최초 유입값 보존(이미 있으면 덮어쓰지 않음). 직접 유입(utm 없음)이면 아무것도 저장 안 함.
// ★ PII 0 — 표준 5종(캠페인 메타)만. 전체 referrer·쿼리스트링 통째 저장 금지.
// ★ best-effort — sessionStorage 차단·파싱 실패 시 no-op(앱·로거·track 영향 0).

const KEY = "onday_utm";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

/** URL 쿼리에서 utm 5종을 first-touch 로 sessionStorage 에 저장. utm 없으면 no-op. */
export function captureUtm(search: string | URLSearchParams): void {
  if (typeof window === "undefined") return;
  try {
    const params = typeof search === "string" ? new URLSearchParams(search) : search;
    const found: Utm = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) found[k] = v.slice(0, 200); // 길이 캡(과대 입력 방지)
    }
    if (Object.keys(found).length === 0) return; // 직접 유입 — 저장 안 함
    if (window.sessionStorage.getItem(KEY)) return; // ★ first-touch — 최초값 보존
    window.sessionStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // best-effort
  }
}

/** 저장된 first-touch utm 스냅샷. 없거나 실패 시 null. */
export function getUtm(): Utm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Utm;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
