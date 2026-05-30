import * as Sentry from "@sentry/nextjs";

import { maskPIIBeforeSend } from "@/lib/helpers/sentry-pii-mask";

// SENTRY_DSN (server-only) 우선, NEXT_PUBLIC_SENTRY_DSN fallback.
// DSN 이 유효한 URL 일 때만 init — 빈 값 + 잘못된 값 모두 안전 skip.
// MON-001 v1.4 (Issue #73) — PII 마스킹 이중 방어: sendDefaultPii: false + beforeSend 정규식.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn && /^https?:\/\//.test(dsn)) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    debug: false,
    sendDefaultPii: false,
    beforeSend: maskPIIBeforeSend,
  });
}
