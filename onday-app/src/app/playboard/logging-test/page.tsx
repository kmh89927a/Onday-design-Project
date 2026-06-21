import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDeploymentEnv } from "@/lib/health";
import { LoggingTestClient } from "./logging-test-client";

// 로깅 점검(운영자 테스트) 페이지 — Playboard 안의 dev 전용 도구.
// ★ production 차단: 운영자(나)만 보는 도구라 production 에선 notFound(). 개발·프리뷰에서만 노출.
//   force-dynamic 으로 요청 시점 env 평가(빌드 시점 고정 방지).

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "로깅 점검 — Playboard",
  robots: { index: false, follow: false },
};

export default function LoggingTestPage() {
  if (getDeploymentEnv() === "production") notFound();
  return <LoggingTestClient />;
}
