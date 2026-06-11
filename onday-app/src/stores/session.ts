import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 사용자 인증 / 게스트 모드 — localStorage persist
// CMD-AUTH-001~004 연동 (Supabase OAuth 콜백 후 setUser 호출)

export interface SessionUser {
  id: string;
  nickname: string;
  provider: "kakao" | "naver";
  avatarUrl?: string;
}

interface SessionState {
  user: SessionUser | null;
  isGuest: boolean;
  /** 심사관(채용 담당자) 데모 모드 — 게스트지만 저장/공유 차단 면제(세션 내 동작) */
  isReviewer: boolean;
  /** OAuth 콜백 성공 시 호출 — 게스트/심사관 모드 종료 */
  setUser: (user: SessionUser) => void;
  /** 게스트 체험 모드 진입 — Mock 모드에서도 동일 동작 (저장/공유 제약 O) */
  enterGuestMode: () => void;
  /** 심사관 데모 모드 진입 — 게스트 인프라 재사용 + 차단 면제 (CMD-AUTH-004) */
  enterReviewerMode: () => void;
  /** 게스트→인증 전환 시 게스트 세션 플래그 정리 (찜=favorites store 는 보존) */
  clearGuestSession: () => void;
  /** 로그아웃 — user/guest 모두 초기화 */
  signOut: () => void;
}

const initialState = {
  user: null,
  isGuest: false,
  isReviewer: false,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user, isGuest: false, isReviewer: false }),
      enterGuestMode: () => set({ user: null, isGuest: true, isReviewer: false }),
      enterReviewerMode: () => set({ user: null, isGuest: true, isReviewer: true }),
      clearGuestSession: () => set({ isGuest: false, isReviewer: false }),
      signOut: () => set(initialState),
    }),
    {
      // ★ CMD-AUTH-004 — sessionStorage: 탭 종료 시 게스트/심사관 모드 소멸.
      //   찜(onday-favorites)은 별도 store(localStorage) 로 보존 — 본 전환과 무관.
      name: "onday-session",
      storage: createJSONStorage(() => sessionStorage),
      // 서버 state(예: 진단 결과)는 별도 store 또는 TanStack Query 책임
      partialize: (state) => ({
        user: state.user,
        isGuest: state.isGuest,
        isReviewer: state.isReviewer,
      }),
    },
  ),
);
