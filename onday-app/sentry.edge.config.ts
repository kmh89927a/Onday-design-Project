import * as Sentry from "@sentry/nextjs";

// Edge runtime (middleware, edge route handlers) 용.
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
