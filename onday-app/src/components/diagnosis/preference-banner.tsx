import * as React from "react";
import { Sparkles } from "lucide-react";

import { getPreferenceTag } from "@/lib/diagnosis/preference-tags";

// 선호 태그(⑥) 결과 상단 배너 — "#안심귀가 반영한 추천이에요". 태그 없으면 미표시. 부부·싱글 공통.
export function PreferenceBanner({ priorityKey }: { priorityKey?: string }) {
  const tag = getPreferenceTag(priorityKey);
  if (!tag) return null;
  return (
    <div className="flex items-center gap-s-2 rounded-lg bg-primary-soft px-s-4 py-s-3">
      <Sparkles aria-hidden className="size-4 shrink-0 text-primary" />
      <p className="text-body-sm font-bold text-primary">
        <span className="font-extrabold">{tag.label}</span> 반영한 추천이에요
      </p>
    </div>
  );
}
