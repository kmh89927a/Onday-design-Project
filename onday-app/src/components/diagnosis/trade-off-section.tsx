"use client";

import * as React from "react";
import { TrendingDown, Zap, Scale } from "lucide-react";

import {
  computeTradeOff,
  type TradeOffAlt,
} from "@/features/diagnosis/trade-off";
import type { CandidateArea } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TradeOffSectionProps {
  candidates: CandidateArea[];
  /** 대체안 탭 시 해당 후보 상세 열기 (결과/싱글 공용 open). */
  onSelect?: (id: string) => void;
}

// 시세 차이(만원, 절대값) → "X.X억" / "X천만원" / "X만원".
function formatPriceDelta(manwon: number): string {
  const v = Math.abs(manwon);
  if (v >= 10000) return `${(v / 10000).toFixed(1)}억`;
  if (v >= 1000) return `${Math.round(v / 1000)}천만원`;
  return `${v}만원`;
}

function AltCard({
  alt,
  kind,
  onSelect,
}: {
  alt: TradeOffAlt;
  kind: "cheaper" | "faster";
  onSelect?: (id: string) => void;
}) {
  const { candidate: c, timeDelta, priceDelta, monthlyDelta } = alt;
  const name = `${c.gu} ${c.dong}`;
  const price = formatPriceDelta(priceDelta);
  const monthly = formatPriceDelta(monthlyDelta);

  // ★ 솔리드 토큰만 사용 — 토큰이 hsl(var(--x)) 형식(alpha placeholder 없음)이라
  //   opacity modifier(/50·/5·/30)는 색이 안 먹음. 후보 best 카드(border-primary bg-primary-soft) 패턴 답습.
  const tone =
    kind === "cheaper"
      ? {
          Icon: TrendingDown,
          badge: "더 싸게",
          chip: "bg-success text-white", // 솔리드 원/뱃지 (틴트 카드 위 대비)
          card: "border-success bg-success-soft", // 녹색 틴트 카드
        }
      : {
          Icon: Zap,
          badge: "더 빠르게",
          chip: "bg-primary text-white",
          card: "border-primary bg-primary-soft", // 파랑 틴트 카드
        };

  return (
    <button
      type="button"
      onClick={() => onSelect?.(c.id)}
      className={cn(
        "flex w-full items-start gap-s-3 rounded-lg border px-s-4 py-s-3 text-left shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        tone.card,
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          tone.chip,
        )}
      >
        <tone.Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-s-2">
          <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold", tone.chip)}>
            {tone.badge}
          </span>
          <span className="truncate text-body font-bold text-ink">{name}</span>
        </span>
        <span className="mt-1 block text-caption text-ink-2">
          {kind === "cheaper" ? (
            <>
              통근 <b className="text-ink">{timeDelta}분</b> 더 가면, 시세{" "}
              <b className="text-success">{price} 절감</b>{" "}
              <span className="text-ink-3">(월 ~{monthly})</span>
            </>
          ) : (
            <>
              시세 <b className="text-ink">{price} 더</b>{" "}
              <span className="text-ink-3">(월 ~{monthly})</span> 쓰면, 통근{" "}
              <b className="text-primary">{Math.abs(timeDelta)}분 단축</b>
            </>
          )}
        </span>
      </span>
    </button>
  );
}

export function TradeOffSection({ candidates, onSelect }: TradeOffSectionProps) {
  const result = React.useMemo(() => computeTradeOff(candidates), [candidates]);
  if (!result) return null;
  const { reference, cheaper, faster } = result;

  return (
    <section aria-label="타협 인사이트" className="space-y-s-3">
      <div className="flex items-center gap-s-2">
        <Scale aria-hidden className="size-4 text-ink-2" />
        <h2 className="text-title font-bold text-ink">타협 인사이트</h2>
        <span className="text-caption-xs text-ink-3">
          1위 {reference.dong} 기준
        </span>
      </div>

      {!cheaper && !faster ? (
        <p className="rounded-lg border border-card-border bg-surface px-s-4 py-s-3 text-body-sm text-ink-3 shadow-card">
          1위 {reference.dong}가 통근·시세 모두 가장 유리해요. 타협할 대안이 없네요.
        </p>
      ) : (
        <div className="space-y-s-2">
          {cheaper && <AltCard alt={cheaper} kind="cheaper" onSelect={onSelect} />}
          {faster && <AltCard alt={faster} kind="faster" onSelect={onSelect} />}
        </div>
      )}

      <p className="text-caption-xs text-ink-3">
        · 월 환산은 시세 차이를 연 금리 3.5% 대출로 가정한 추정이에요.
      </p>
    </section>
  );
}
