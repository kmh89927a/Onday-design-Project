"use client";

import * as React from "react";

// 네이버 매물 아웃링크 PC/모바일 분기용 — UA 기반 모바일 감지.
//   PC new.land 좌표 URL 이 모바일에서 깨지는 문제(fin.land 리다이렉트 비호환) 대응.
//
// ★ 하이드레이션 안전 — 서버·클라 첫 렌더는 항상 false(PC)로 두고, 마운트 후에만 실제 UA 반영.
//   getServerSnapshot=false 뿐 아니라 getSnapshot 도 mounted 전엔 false 를 반환(클라 첫 스냅샷도
//   서버와 동일) → 첫 페인트 = 서버 HTML 일치 → 미스매치 0. mount 후 subscribe 에서 1회 알림으로
//   false→실제값 전환(모바일은 아주 짧게 PC 보였다가 즉시 전환). setState-in-effect 미사용
//   (외부 store 로 접어넣어 useSyncExternalStore 와 규칙 둘 다 만족 — deadline-banner 답습).
const MOBILE_UA = /Mobi|Android|iPhone|iPad|iPod/i;

let mounted = false;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // 첫 구독(마운트 후 passive effect) 시 1회 mounted 전환 + 알림 → false→실제 UA 재평가.
  if (!mounted) {
    mounted = true;
    listeners.forEach((l) => l());
  }
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): boolean {
  return mounted && MOBILE_UA.test(navigator.userAgent);
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
