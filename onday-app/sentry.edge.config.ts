import * as Sentry from "@sentry/nextjs";

import { maskPIIBeforeSend } from "@/lib/helpers/sentry-pii-mask";

// Edge runtime (middleware, edge route handlers) 용.
// MON-001 v1.4 (Issue #73) — PII 마스킹 이중 방어: sendDefaultPii: false + beforeSend 정규식.
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  sendDefaultPii: false,
  beforeSend: maskPIIBeforeSend,
});
