import type { Metadata } from "next";

import { LandingClient } from "./landing-client";

export const metadata: Metadata = {
  title: "동네궁합진단기 — 주말 6시간 발품을, 6초 진단으로",
  description:
    "맞벌이 부부의 직장·학군·생활 동선을 동시에 만족하는 동네를 6초 AI 진단으로 찾아드립니다. 복잡한 비교는 AI에게, 부부는 결정만.",
};

export default function LandingPage() {
  return <LandingClient />;
}
