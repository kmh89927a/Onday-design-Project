"use client";

import * as React from "react";
import { Heart, X, ExternalLink } from "lucide-react";

import { SafetyGradeBadge } from "@/components/data/safety-grade-badge";
import { BottomSheet } from "@/components/sheet/bottom-sheet";
import { IconButton } from "@/components/ui/icon-button";
import { formatPrice } from "@/features/diagnosis/result-utils";
import { buildNaverRealEstateUrl } from "@/lib/deadline/naver-url-builder";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/stores/favorites";
import type { DiagnosisMode } from "@/lib/types";

const MODE_LABEL: Record<DiagnosisMode, string> = {
  couple: "부부",
  single: "싱글",
};

type ModeFilter = "all" | DiagnosisMode;

// 헤더 우측 하트 — 찜 개수 배지 + 탭 시 찜 목록 바텀시트. 부부·싱글 공통.
//   찜은 favorites store(localStorage 스냅샷)에서 직접 읽어 모드 무관 재사용.
export function FavoritesMenu() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const remove = useFavoritesStore((s) => s.remove);
  const [open, setOpen] = React.useState(false);
  const [modeFilter, setModeFilter] = React.useState<ModeFilter>("all");

  // 최근 찜 먼저.
  const items = React.useMemo(
    () => Object.values(favorites).sort((a, b) => b.savedAt - a.savedAt),
    [favorites],
  );
  const count = items.length;
  const coupleCount = items.filter((i) => i.mode === "couple").length;
  const singleCount = items.filter((i) => i.mode === "single").length;
  const visibleItems =
    modeFilter === "all"
      ? items
      : items.filter((i) => i.mode === modeFilter);

  return (
    <>
      <span className="relative inline-flex">
        <IconButton
          icon={<Heart className={cn(count > 0 && "fill-danger text-danger")} />}
          ariaLabel={`찜한 동네 ${count}곳 보기`}
          onClick={() => setOpen(true)}
        />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-extrabold leading-4 text-white ring-2 ring-surface"
          >
            {count}
          </span>
        )}
      </span>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="찜한 동네 목록"
      >
        <div className="px-s-5 pb-s-6 pt-s-2">
          <h2 className="text-title font-extrabold text-ink">
            찜한 동네 {count > 0 && <span className="text-primary">{count}</span>}
          </h2>

          {count > 0 && (
            <div
              role="tablist"
              aria-label="찜 모드 분류"
              className="mt-s-3 flex rounded-full bg-bg p-0.5"
            >
              {(
                [
                  ["all", "전체", count],
                  ["couple", "부부", coupleCount],
                  ["single", "싱글", singleCount],
                ] as const
              ).map(([m, label, n]) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={modeFilter === m}
                  onClick={() => setModeFilter(m)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-full px-s-2 py-s-2 text-caption font-bold transition-colors",
                    modeFilter === m
                      ? "bg-surface text-ink shadow-card"
                      : "text-ink-3",
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold leading-[18px]",
                      m === "all"
                        ? "bg-ink/10 text-ink-2"
                        : m === "couple"
                          ? "bg-primary/15 text-primary"
                          : "bg-success-soft text-success",
                    )}
                  >
                    {n}
                  </span>
                </button>
              ))}
            </div>
          )}

          {count === 0 ? (
            <div className="mt-s-5 rounded-lg border border-card-border bg-bg p-s-6 text-center">
              <Heart aria-hidden className="mx-auto size-7 text-ink-3" />
              <p className="mt-s-3 text-body font-bold text-ink">
                아직 찜한 동네가 없어요
              </p>
              <p className="mt-s-1 text-body-sm text-ink-3">
                마음에 드는 동네의 하트를 눌러 저장하세요
              </p>
            </div>
          ) : visibleItems.length === 0 ? (
            <p className="mt-s-5 text-center text-body-sm text-ink-3">
              이 모드에 찜한 동네가 없어요
            </p>
          ) : (
            <ul className="mt-s-4 space-y-s-3">
              {visibleItems.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-s-3 rounded-lg border border-card-border bg-surface px-s-4 py-s-3 shadow-card"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-s-2">
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold",
                          it.mode === "couple"
                            ? "bg-primary/10 text-primary"
                            : "bg-success-soft text-success",
                        )}
                      >
                        {MODE_LABEL[it.mode]}
                      </span>
                      <p className="truncate text-body font-bold text-ink">
                        {it.gu} {it.dong}
                      </p>
                      {it.safetyGrade ? (
                        <SafetyGradeBadge grade={it.safetyGrade} />
                      ) : (
                        <span className="shrink-0 text-caption-xs font-bold text-primary">
                          {it.score}점
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-caption text-ink-3">
                      통근 {it.commuteA}분
                      {it.commuteB != null && ` · 배우자 ${it.commuteB}분`} ·{" "}
                      {formatPrice(it.priceRange)}
                    </p>
                  </div>

                  <a
                    href={buildNaverRealEstateUrl(
                      `${it.gu} ${it.dong}`,
                      it.priceRange ? { priceMax: it.priceRange.max } : {},
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${it.gu} ${it.dong} 매물 보기`}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-ink-3 hover:text-ink"
                  >
                    <ExternalLink aria-hidden className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    aria-label={`${it.gu} ${it.dong} 찜 해제`}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-ink-3 hover:text-danger"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
