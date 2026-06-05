"use client";

import { ArrowUpRight, Clock, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buildNaverRealEstateUrl, buildSchoolSearchUrl } from "@/lib/deadline/naver-url-builder";
import { getNearestSchool } from "@/lib/schools-index";
import type { ListingItem } from "@/lib/types/deadline";

// 급매 매물 카드 — 정보 표시 + 네이버 부동산 아웃링크 (자체 매물 DB 없음, REQ-FUNC-016).
// 학군 PR2 — 인근 초등학교 한 줄 + 네이버 검색 아웃링크 (REQ-FUNC-018 "학교" 충족).
//   ★ 카드를 div 로 감싸고 부동산/학교 두 아웃링크를 형제로 둠 (<a> 중첩 금지).
// 보안: target="_blank" + rel="noopener noreferrer" (window.opener 차단 + Referer 미전송).

interface ListingCardProps {
  listing: ListingItem;
}

export function ListingCard({ listing }: ListingCardProps) {
  const url = buildNaverRealEstateUrl(listing.areaName, { roomType: "apartment" });
  // 좌표 최근접 초등학교 (PR1 사전계산). 없으면 학교 줄 미렌더 (빈 값/에러 표시 금지).
  const school = getNearestSchool(listing.neighborhoodId);

  return (
    <div className="overflow-hidden rounded-lg border border-card-border bg-surface shadow-card">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${listing.areaName} ${listing.dealType} ${listing.priceLabel}, 네이버 부동산에서 보기 (새 창)`}
        className="flex items-center gap-s-3 px-s-4 py-s-3 transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
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

      {school && (
        <a
          href={buildSchoolSearchUrl(school.name)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`인근 초등학교 ${school.name}, 네이버 검색 (새 창)`}
          className="flex items-center gap-1 border-t border-card-border px-s-4 py-s-2 text-caption text-ink-3 transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          <GraduationCap aria-hidden className="size-3 shrink-0" />
          인근 초등학교:
          <span className="truncate font-bold text-primary">{school.name}</span>
          <ArrowUpRight aria-hidden className="size-3 shrink-0" />
        </a>
      )}
    </div>
  );
}
