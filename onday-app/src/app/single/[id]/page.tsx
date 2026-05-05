import type { Metadata } from "next";

import { SingleResultView } from "./single-result-view";

export const metadata: Metadata = {
  title: "싱글 모드 결과 — 동네궁합",
  description: "야간 안전을 기준으로 1인 가구에게 맞는 동네를 추천해드려요.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SinglePage({ params }: PageProps) {
  const { id } = await params;
  return <SingleResultView id={id} />;
}
