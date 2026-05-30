import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Toaster } from "@/components/layout/toaster";
import { QueryProvider } from "@/providers/query-provider";
import { SessionBridge } from "@/providers/session-bridge";

import "./globals.css";

export const metadata: Metadata = {
  title: "OnDay 온데이",
  description: "두 사람의 출퇴근, 가장 합리적인 동네는?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <SessionBridge />
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
