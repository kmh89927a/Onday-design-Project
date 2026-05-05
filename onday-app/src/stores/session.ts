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
  /** OAuth 콜백 성공 시 호출 — 게스트 모드 종료 */
  setUser: (user: SessionUser) => void;
  /** 게스트 체험 모드 진입 — Mock 모드에서도 동일 동작 */
  enterGuestMode: () => void;
  /** 로그아웃 — user/guest 모두 초기화 */
  signOut: () => void;
}

const initialState = {
  user: null,
  isGuest: false,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user, isGuest: false }),
      enterGuestMode: () => set({ user: null, isGuest: true }),
      signOut: () => set(initialState),
    }),
    {
      name: "onday-session",
      storage: createJSONStorage(() => localStorage),
      // 서버 state(예: 진단 결과)는 별도 store 또는 TanStack Query 책임
      partialize: (state) => ({ user: state.user, isGuest: state.isGuest }),
    },
  ),
);
