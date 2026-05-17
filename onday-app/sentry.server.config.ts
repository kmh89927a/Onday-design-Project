import * as Sentry from "@sentry/nextjs";

// SENTRY_DSN (server-only) 우선, NEXT_PUBLIC_SENTRY_DSN fallback.
// 둘 다 미설정 시 silent skip.
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
