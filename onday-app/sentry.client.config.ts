import * as Sentry from "@sentry/nextjs";

import { maskPIIBeforeSend } from "@/lib/helpers/sentry-pii-mask";

// DSN 이 유효한 URL 일 때만 init — 빈 값 + 잘못된 값(예: wizard 설치 명령어 오입력)
// 모두 안전하게 skip (잘못된 DSN 은 "Invalid Sentry Dsn" 으로 페이지를 깨뜨림).
// MON-001 v1.4 (Issue #73) — PII 마스킹 이중 방어: sendDefaultPii: false + beforeSend 정규식.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn && /^https?:\/\//.test(dsn)) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    debug: false,
    sendDefaultPii: false,
    beforeSend: maskPIIBeforeSend,
  });
}
