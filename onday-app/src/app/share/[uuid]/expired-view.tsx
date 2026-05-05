import Link from "next/link";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ExpiredViewProps {
  expiredAt: string;
}

function formatExpired(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function ExpiredView({ expiredAt }: ExpiredViewProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg p-s-5 text-center">
      <Clock aria-hidden className="size-10 text-ink-3" />
      <h1 className="mt-s-3 text-h2 font-extrabold tracking-[-0.03em] text-ink">
        만료된 공유 링크예요
      </h1>
      <p className="mt-s-2 max-w-xs text-body-sm text-ink-2">
        이 링크는 {formatExpired(expiredAt)}에 만료되었어요. 새 진단을 받아 다시
        공유해주세요.
      </p>
      <p className="mt-s-1 text-caption text-ink-3">
        만료된 링크의 개인정보는 노출되지 않아요.
      </p>
      <Link href="/diagnosis" className="mt-s-6 block">
        <Button>새 진단 시작하기</Button>
      </Link>
    </main>
  );
}
