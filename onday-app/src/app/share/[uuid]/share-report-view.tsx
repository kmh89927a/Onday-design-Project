"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

import { LockedCard } from "@/components/share/locked-card";
import { ReportCard } from "@/components/share/report-card";
import { ShareHero } from "@/components/share/share-hero";
import { Button } from "@/components/ui/button";
import { splitForPreview } from "@/features/diagnosis/mock-calculator";
import { buildReportStats } from "@/features/share/preview-stats";
import type { CandidateArea } from "@/lib/types";

interface ShareData {
  uniqueUrl: string;
  diagnosisId: string;
  addressA: string;
  addressB: string | null;
  mode: "couple" | "single";
  candidates: CandidateArea[];
  expiresAt: string;
}

interface ShareReportViewProps {
  data: ShareData;
}

function expiryChipText(expiresAt: string): string {
  const days = Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000),
  );
  return `익명 · ${days}일 한정`;
}

export function ShareReportView({ data }: ShareReportViewProps) {
  const { preview, locked } = splitForPreview(data.candidates);
  const total = data.candidates.length;
  const lockedCount = locked.length;

  return (
    <main className="flex min-h-screen flex-col bg-bg pb-[120px]">
      <div className="px-s-5 pt-s-4">
        <ShareHero
          brand="동네궁합 · 공유 리포트"
          brandLogo={
            <span className="grid size-7 place-items-center rounded-md bg-white/15 backdrop-blur-sm">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 14l7-7 7 7M8 14v6h8v-6"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11" r="1.6" fill="#fff" />
              </svg>
            </span>
          }
          expiryChip={expiryChipText(data.expiresAt)}
          title={
            <>
              두 사람의 합리적인
              <br />
              후보 동네 {total}곳이 도착했어요
            </>
          }
          badges={[
            {
              kind: "official",
              source: "공공데이터포털",
              updatedAt: "2026.04",
            },
            {
              kind: "aggregated",
              source: "카카오 모빌리티",
              updatedAt: "2026.04.01",
            },
            {
              kind: "estimate",
              source: "통근 추정",
              updatedAt: "—",
            },
          ]}
        />
      </div>

      <section className="mt-s-5 space-y-s-3 px-s-5" aria-label="공유 후보">
        {preview && (
          <ReportCard
            name={`${preview.gu} ${preview.dong}`}
            score={preview.score}
            stats={buildReportStats(preview)}
            preview
          />
        )}
        {locked.map((c) => (
          <LockedCard key={c.id}>
            <ReportCard
              name={`${c.gu} ${c.dong}`}
              score={c.score}
              stats={buildReportStats(c)}
            />
          </LockedCard>
        ))}
      </section>

      {lockedCount > 0 && (
        <footer className="fixed inset-x-0 bottom-0 z-sticky border-t border-card-border bg-surface/95 px-s-5 py-s-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
          <p className="mb-s-2 flex items-center justify-center gap-s-2 text-caption text-ink-3">
            <Lock aria-hidden className="size-3.5" />
            <span>
              나머지 후보{" "}
              <span className="tabular font-bold text-ink">{lockedCount}</span>곳은
              회원만 볼 수 있어요
            </span>
          </p>
          <Link href="/login">
            <Button fullWidth trailing={<ArrowRight />}>
              회원가입하고 전체 후보 보기
            </Button>
          </Link>
        </footer>
      )}
    </main>
  );
}
