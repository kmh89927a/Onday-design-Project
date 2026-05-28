import type { ErrorEvent } from "@sentry/nextjs";

// MON-001 v1.4 (Issue #73) — Sentry PII 마스킹 (REQ-NF-012-A AC).
// 이중 방어 영역:
//   (1) sendDefaultPii: false (Sentry.init 옵션) — ip/cookies/headers 자동 제거
//   (2) beforeSend 정규식 마스킹 — event 본문의 이메일/전화 [REDACTED] 치환
// client + server + edge 3종 config 동일 import (helper 분리 = 차후 주소 마스킹 확장 시 단일 영역 갱신).

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_REGEX = /010-?\d{3,4}-?\d{4}/g;

function maskPII(text: string): string {
  return text.replace(EMAIL_REGEX, "[REDACTED]").replace(PHONE_REGEX, "[REDACTED]");
}

export function maskPIIBeforeSend(event: ErrorEvent): ErrorEvent {
  if (event.message) {
    event.message = maskPII(event.message);
  }
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = maskPII(ex.value);
    }
  }
  if (event.request?.data && typeof event.request.data === "string") {
    event.request.data = maskPII(event.request.data);
  }
  return event;
}
