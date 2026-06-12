import { NAVER_MOBILE_NOTE } from "@/lib/deadline/naver-url-builder";
import { cn } from "@/lib/utils";

// 모바일에서 매물 CTA 가 좌표 딥링크 대신 네이버 지도 검색으로 연결됨을 알리는 마이크로카피.
//   작고 연한(muted) 다정한 톤. CTA 버튼 바로 아래에 둠. PC 에서는 렌더하지 않는다.
export function NaverMobileNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-caption-xs leading-relaxed text-ink-3", className)}>
      {NAVER_MOBILE_NOTE}
    </p>
  );
}
