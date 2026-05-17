import * as Sentry from "@sentry/nextjs";

// DSN 미설정 시 Sentry SDK 가 자동 비활성 (silent skip).
// MON-001 에서 DSN 연결 후 실제 활성화.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
