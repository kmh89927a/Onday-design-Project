"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const VIEWPORTS = [
  { label: "iPhone SE", width: 375, height: 800, note: "최소 지원 폭" },
  { label: "iPhone 14 Pro", width: 393, height: 800, note: "기본 디자인 폭" },
  { label: "iPhone 14 Pro Max", width: 430, height: 800, note: "큰 모바일" },
];

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-bg p-s-5">
      <div className="mx-auto max-w-screen-2xl space-y-s-5">
        <header className="space-y-s-2">
          <div className="flex items-center gap-s-2">
            <Badge variant="solid">_dev / preview</Badge>
            <Badge variant="ok">Step 4</Badge>
          </div>
          <h1 className="text-h2 text-ink">반응형 동시 비교</h1>
          <p className="text-body-sm text-ink-3">
            동일한 <code className="text-primary">/dev</code> 페이지를 세 개의
            모바일 폭에서 동시에 미리봅니다. iframe은 same-origin이므로 내부
            클릭/스크롤이 모두 작동합니다.
          </p>
          <div className="flex flex-wrap gap-s-2">
            <Link href="/dev">
              <Button size="sm" variant="outline">
                ← /dev 돌아가기
              </Button>
            </Link>
          </div>
        </header>

        <div className="overflow-x-auto pb-s-5">
          <div className="flex min-w-fit gap-s-5">
            {VIEWPORTS.map(({ label, width, height, note }) => (
              <figure key={width} className="flex flex-col gap-s-2">
                <figcaption className="space-y-s-1">
                  <p className="text-title font-bold text-ink">
                    {label}
                    <span className="ml-s-2 tabular text-caption text-ink-3">
                      {width}px
                    </span>
                  </p>
                  <p className="text-caption text-ink-3">{note}</p>
                </figcaption>
                <div
                  className="overflow-hidden rounded-3xl border-2 border-line bg-surface shadow-card"
                  style={{ width, height }}
                >
                  <iframe
                    src="/dev"
                    title={`${label} 미리보기`}
                    className="block h-full w-full border-0"
                  />
                </div>
              </figure>
            ))}
          </div>
        </div>

        <footer className="rounded-2xl border border-line-2 bg-surface p-s-4 text-body-sm text-ink-3 shadow-card">
          <p className="font-bold text-ink">시각 검증 가이드</p>
          <ul className="mt-s-2 space-y-s-1 list-disc pl-s-5">
            <li>각 폭에서 Tabs(Section 5) 컨텐츠가 한 줄로 압축되지 않고 세로 정렬되는지 확인</li>
            <li>375px 폭에서 Card / Sheet / Dialog 가 잘리지 않는지 확인</li>
            <li>Pretendard 한글 자간이 가독성 있게 보이는지 확인</li>
            <li>Sheet / Dialog 트리거 → 모션이 280ms 정도로 부드럽게 슬라이드 / 페이드 되는지 확인</li>
          </ul>
        </footer>
      </div>
    </main>
  );
}
