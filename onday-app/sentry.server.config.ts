import * as Sentry from "@sentry/nextjs";

import { maskPIIBeforeSend } from "@/lib/helpers/sentry-pii-mask";

// SENTRY_DSN (server-only) 우선, NEXT_PUBLIC_SENTRY_DSN fallback. 둘 다 미설정 시 silent skip.
// MON-001 v1.4 (Issue #73) — PII 마스킹 이중 방어: sendDefaultPii: false + beforeSend 정규식.
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  sendDefaultPii: false,
  beforeSend: maskPIIBeforeSend,
});
