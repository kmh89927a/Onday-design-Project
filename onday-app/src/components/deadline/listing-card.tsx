"use client";

import { ArrowUpRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buildNaverRealEstateUrl } from "@/lib/deadline/naver-url-builder";
import type { ListingItem } from "@/lib/types/deadline";

// 급매 매물 카드 — 정보 표시 + 네이버 부동산 아웃링크 (자체 매물 DB 없음, REQ-FUNC-016).
// 보안: target="_blank" + rel="noopener noreferrer" (window.opener 차단 + Referer 미전송).

interface ListingCardProps {
  listing: ListingItem;
}

export function ListingCard({ listing }: ListingCardProps) {
  const url = buildNaverRealEstateUrl(listing.areaName, { roomType: "apartment" });

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${listing.areaName} ${listing.dealType} ${listing.priceLabel}, 네이버 부동산에서 보기 (새 창)`}
      className="flex items-center gap-s-3 rounded-lg border border-card-border bg-surface px-s-4 py-s-3 shadow-card transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-s-2">
          <p className="truncate text-body-sm font-bold text-ink">
            {listing.areaName}
          </p>
          <Badge variant="danger" size="xs">
            급매 -{listing.discountPercent}%
          </Badge>
        </div>
        <p className="text-caption text-ink-2">
          {listing.dealType} {listing.priceLabel} · {listing.pyeong}평
        </p>
        <p className="flex items-center gap-1 text-caption-xs text-ink-3">
          <Clock aria-hidden className="size-3" />
          등록 {listing.elapsedDays}일 경과
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-0.5 text-caption font-bold text-primary">
        네이버
        <ArrowUpRight aria-hidden className="size-3.5" />
      </span>
    </a>
  );
}
