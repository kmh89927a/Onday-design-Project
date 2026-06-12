"use client";

import { ArrowUpRight, Clock, GraduationCap } from "lucide-react";

import { NaverMobileNote } from "@/components/data/naver-mobile-note";
import { Badge } from "@/components/ui/badge";
import {
  buildNaverMobileMapUrl,
  buildNaverRealEstateUrl,
  buildSchoolSearchUrl,
} from "@/lib/deadline/naver-url-builder";
import { getNearestSchool } from "@/lib/schools-index";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { DiagnosisMode } from "@/lib/types";
import type { ListingItem } from "@/lib/types/deadline";

// 급매 매물 카드 — 정보 표시 + 네이버 부동산 아웃링크 (자체 매물 DB 없음, REQ-FUNC-016).
// 학군 PR2 — 인근 초등학교 한 줄 + 네이버 검색 아웃링크 (REQ-FUNC-018 "학교" 충족).
//   ★ 카드를 div 로 감싸고 부동산/학교 두 아웃링크를 형제로 둠 (<a> 중첩 금지).
//   ★ 싱글 모드(#55 정합): 학군 숨김 → 학교 줄 미렌더(부부만 표시). 30분 요약 카드와 동일 원칙.
//   ★ rank 배지 = 지도 마커 숫자(동네 점수 순위)와 시각 일관(회색 원+흰 숫자, map-marker 답습) →
//     매물↔마커 매칭(같은 동네 매물끼리 같은 순위). 1 동네 : 1~3 매물.
// 보안: target="_blank" + rel="noopener noreferrer" (window.opener 차단 + Referer 미전송).

interface ListingCardProps {
  listing: ListingItem;
  mode: DiagnosisMode;
  rank?: number; // 동네 점수 순위(지도 마커 숫자와 매칭). 없으면 배지 미표시.
}

export function ListingCard({ listing, mode, rank }: ListingCardProps) {
  // 네이버 매물 링크 — 모바일은 PC 좌표 URL 비호환 → 동네명 지도검색으로 분기(클라 시점).
  const isMobile = useIsMobile();
  // 모바일=동네명 지도검색, PC=좌표 new.land + 거래유형(매매/전세 → A1/B1) + 아파트.
  const url = isMobile
    ? buildNaverMobileMapUrl(listing.areaName)
    : buildNaverRealEstateUrl(listing.coordinate, {
        dealType: listing.dealType === "매매" ? "maemae" : "jeonse",
        roomType: "apartment",
      });
  // 좌표 최근접 초등학교 (PR1 사전계산). 싱글은 학군 숨김(#55) → 부부만 조회·표시.
  const school = mode === "couple" ? getNearestSchool(listing.neighborhoodId) : null;

  return (
    <div className="overflow-hidden rounded-lg border border-card-border bg-surface shadow-card">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${rank ? `추천 ${rank}위 동네 ` : ""}${listing.areaName} ${listing.dealType} ${listing.priceLabel}, ${isMobile ? "네이버 지도에서 동네 탐색" : "네이버 부동산에서 보기"} (새 창)`}
        className="flex items-center gap-s-3 px-s-4 py-s-3 transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        {/* 지도 마커 숫자(동네 순위)와 시각 일관 — 회색 원 + 흰 숫자 (map-marker 답습). */}
        {rank != null && (
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-3 text-[11px] font-extrabold text-white"
          >
            {rank}
          </span>
        )}
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

      {/* 모바일은 좌표 딥링크 비호환 → 지도 검색 연결 안내(작고 연한 톤). */}
      {isMobile && <NaverMobileNote className="px-s-4 pb-s-2" />}

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
