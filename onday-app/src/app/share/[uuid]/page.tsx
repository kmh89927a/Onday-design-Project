import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import type { CandidateArea } from "@/lib/types";

import { ExpiredView } from "./expired-view";
import { ShareReportView } from "./share-report-view";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

async function getShareData(uuid: string) {
  const shareLink = await prisma.shareLink.findUnique({
    where: { uniqueUrl: uuid },
    include: { diagnosis: true },
  });
  if (!shareLink) return { type: "not-found" as const };
  if (shareLink.expiresAt < new Date()) {
    return {
      type: "expired" as const,
      expiredAt: shareLink.expiresAt.toISOString(),
    };
  }

  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: { viewCount: { increment: 1 } },
  });

  const candidates: CandidateArea[] = JSON.parse(
    shareLink.diagnosis.candidates,
  );
  return {
    type: "valid" as const,
    data: {
      uniqueUrl: shareLink.uniqueUrl,
      diagnosisId: shareLink.diagnosisId,
      addressA: shareLink.diagnosis.addressA,
      addressB: shareLink.diagnosis.addressB ?? null,
      mode: shareLink.diagnosis.mode as "couple" | "single",
      candidates,
      expiresAt: shareLink.expiresAt.toISOString(),
    },
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  return {
    title: "동네궁합 진단 결과를 확인해보세요",
    description:
      "두 직장 동선이 만나는 최적의 동네 — 무료 미리보기 1곳 제공",
    openGraph: {
      title: "동네궁합 — 후보 동네 리포트",
      description: "두 직장 동선이 만나는 최적의 동네 — 무료 미리보기 1곳 제공",
      type: "website",
      siteName: "동네궁합",
      url: `/share/${uuid}`,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { uuid } = await params;
  const result = await getShareData(uuid);

  if (result.type === "not-found") notFound();
  if (result.type === "expired")
    return <ExpiredView expiredAt={result.expiredAt} />;
  return <ShareReportView data={result.data} />;
}
