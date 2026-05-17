import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// SENTRY_DSN 미설정 시 withSentryConfig 래핑 자체를 skip (silent skip).
// MON-001 에서 DSN 연결 후 wrapper 활성화.
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

const finalConfig: NextConfig = sentryDsn
  ? withSentryConfig(nextConfig, {
      silent: true,
    })
  : nextConfig;

export default finalConfig;
