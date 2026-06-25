// GA4 이벤트 전송 — gtag(클라) thin wrapper (S2, 로거 3번째 sink, additive).
// ★ Mixpanel·자체DB 대체 아님 — 동일 11종 이벤트의 GA4(학습+BigQuery) 경로. 역할 분담: ga4-decision-log.md §0.
// ★ env-guarded noop: gtag 미로딩(키 미설정 시 google-analytics.tsx 가 마운트 0) → window.gtag 부재 → 조용히 no-op.
// ★ best-effort — 실패·미지원·서버 사이드 시 no-op(앱·Mixpanel·자체DB·진단 영향 0, throw 0).
// ★ PII 0 — 호출부(mixpanel.ts)가 비식별 화이트리스트 속성만 전달(주소·좌표·토큰·이메일 없음).

type GaParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 로 이벤트 1건 전송. gtag 부재(키 미설정·미로딩) 시 no-op. 절대 throw 안 함. */
export function gaEvent(name: string, params?: GaParams): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag !== "function") return; // 키 미설정·gtag 미로딩 → noop(회귀 0)
    window.gtag("event", name, params ?? {});
  } catch {
    // best-effort — 절대 throw 안 함.
  }
}
