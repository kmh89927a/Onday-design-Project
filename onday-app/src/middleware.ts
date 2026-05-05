import { NextResponse } from "next/server";

// Production 배포 시 /dev/* 라우트 외부 노출 차단.
// dev 환경에서는 그대로 통과 — _dev 시각 검증 페이지 접근 가능.
// matcher: /dev 자체와 모든 하위 경로 (/dev/preview 등)
export function middleware() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dev", "/dev/:path*"],
};
