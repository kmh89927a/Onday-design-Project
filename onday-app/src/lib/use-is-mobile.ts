"use client";

import * as React from "react";

// 네이버 매물 아웃링크 PC/모바일 분기용 — UA 기반 모바일 감지.
//   PC new.land 좌표 URL 이 모바일에서 깨지는 문제(fin.land 리다이렉트 비호환) 대응.
//   UA 는 세션 중 불변 → subscribe 는 no-op. SSR/첫 렌더는 false(PC)로 하이드레이션 후 교체
//   → useSyncExternalStore 로 set-state-in-effect 규칙 우회(deadline-banner 답습).
const MOBILE_UA = /Mobi|Android|iPhone|iPad|iPod/i;

function subscribe() {
  return () => {};
}
function getSnapshot() {
  return MOBILE_UA.test(navigator.userAgent);
}
function getServerSnapshot() {
  return false;
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
