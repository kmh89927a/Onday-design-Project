"use client";

import * as React from "react";

import { useSessionStore } from "@/stores/session";
import { useUIStore } from "@/stores/ui";

// ★ #24 게스트 제약 — 저장(찜)/공유는 로그인 사용자 전용.
//   심사관(isReviewer)은 게스트지만 차단 면제 → 세션 내에서 그대로 동작.
//   limitations 타입(no_save/no_share)은 MOCK 계약일 뿐 실 스토어 미연결이라,
//   1인 MVP 답게 세션 상태를 직접 읽어 2 액션만 게이트한다.
//   ★ 기준 = user === null (모든 비로그인) — isGuest 는 "로그인 없이 체험하기"를 누른 명시적
//     게스트에서만 true 라, 미인증 초기/로그아웃(isGuest=false, user=null) 상태가 그물을 빠져
//     나갔음. #217 favorites persist(user===null) 와 동일 기준으로 통일해 일관 차단.

type GuestAction = "save" | "share";

const GUEST_PROMPT: Record<GuestAction, string> = {
  save: "로그인하면 찜한 동네를 저장할 수 있어요",
  share: "로그인하면 공유 링크를 만들 수 있어요",
};

/**
 * 반환된 함수를 핸들러 첫 줄에서 호출.
 * 게스트면 로그인 유도 토스트를 띄우고 `true`(차단) 반환 → 호출처는 즉시 return.
 * 로그인 사용자·심사관이면 `false`.
 */
export function useGuestGate() {
  const user = useSessionStore((s) => s.user);
  const isReviewer = useSessionStore((s) => s.isReviewer);
  const pushToast = useUIStore((s) => s.pushToast);

  return React.useCallback(
    (action: GuestAction): boolean => {
      // 비로그인(게스트·미인증·로그아웃) 차단, 심사관(데모)·로그인은 면제.
      if (user === null && !isReviewer) {
        pushToast({ variant: "default", message: GUEST_PROMPT[action] });
        return true;
      }
      return false;
    },
    [user, isReviewer, pushToast],
  );
}
