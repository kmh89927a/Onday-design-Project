// 상세 로그 적재 — 클라이언트 emitter (로거 1단계 토대).
// ★ Mixpanel 대체 아님 — 원본 raw 보관용 DB 적재(역할 분담, EVENT_LOGGER_UTM_PLAN.md §0).
// ★ best-effort — sendBeacon fire-and-forget. 실패·미지원·서버 부재 시 no-op(앱·기존 track 영향 0).
// ★ PII 0 — 타입 화이트리스트(mode/method/count/daysLeft/diagnosisId)만. 주소·토큰·역명은 인자에 없음.
// ★ visitorId = 익명(visitor-id.ts 재사용). UTM 부착은 3단계(본 1단계 범위 밖).

import { getVisitorId } from "@/lib/logging/visitor-id";
import { getUtm } from "@/lib/logging/utm-session";

export interface EventAttrs {
  mode?: "couple" | "single";
  method?: "kakao" | "guest" | "reviewer";
  count?: 1 | 2;
  daysLeft?: number;
  diagnosisId?: string;
}

/** 이벤트 1건을 /api/events 로 비차단 전송. 실패해도 절대 throw 안 함. */
export function logEvent(eventName: string, attrs: EventAttrs = {}): void {
  if (typeof window === "undefined") return;
  try {
    const payload: Record<string, unknown> = { eventName };
    if (attrs.mode !== undefined) payload.mode = attrs.mode;
    if (attrs.method !== undefined) payload.method = attrs.method;
    if (attrs.count !== undefined) payload.count = attrs.count;
    if (attrs.daysLeft !== undefined) payload.daysLeft = attrs.daysLeft;
    if (attrs.diagnosisId !== undefined) payload.diagnosisId = attrs.diagnosisId;

    const visitorId = getVisitorId();
    if (visitorId) payload.visitorId = visitorId;

    // ★ first-touch utm 부착(2단계). 없으면(직접 유입) 생략 — 에러 0.
    const utm = getUtm();
    if (utm) payload.props = JSON.stringify(utm);

    const body = JSON.stringify(payload);

    // sendBeacon — 페이지 언로드 중에도 안전, UI 블로킹 0.
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
      return;
    }
    // 폴백 — sendBeacon 미지원 환경.
    void fetch("/api/events", {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } catch {
    // best-effort — 절대 throw 안 함.
  }
}
