import type { Metadata } from "next";

import { ResultView } from "./result-view";

export const metadata: Metadata = {
  title: "진단 결과 — 동네궁합",
  description: "교집합 후보 동네를 지도에서 확인하세요.",
};

interface DiagnosisResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function DiagnosisResultPage({
  params,
}: DiagnosisResultPageProps) {
  const { id } = await params;
  return <ResultView id={id} />;
}
