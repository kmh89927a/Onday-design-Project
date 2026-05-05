import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 저장한 동네 (즐겨찾기) — localStorage persist
// Record<areaId, true> 구조 — O(1) 조회 + JSON 직렬화 친화적
// 서버 동기화는 CMD-SAVE-001 (TanStack mutation)이 담당, 본 store는 optimistic UI 상태

interface FavoritesState {
  favorites: Record<string, true>;
  /** 즉시 토글 (optimistic) — 서버 mutation은 호출자가 별도 트리거 */
  toggleFavorite: (areaId: string) => void;
  /** 명시적 추가/제거 — 서버 응답으로 상태 동기화 시 사용 */
  add: (areaId: string) => void;
  remove: (areaId: string) => void;
  isFavorite: (areaId: string) => boolean;
  clear: () => void;
}

const initialState = {
  favorites: {} as Record<string, true>,
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      toggleFavorite: (areaId) =>
        set((state) => {
          const next = { ...state.favorites };
          if (next[areaId]) delete next[areaId];
          else next[areaId] = true;
          return { favorites: next };
        }),

      add: (areaId) =>
        set((state) => ({ favorites: { ...state.favorites, [areaId]: true } })),

      remove: (areaId) =>
        set((state) => {
          const next = { ...state.favorites };
          delete next[areaId];
          return { favorites: next };
        }),

      isFavorite: (areaId) => Boolean(get().favorites[areaId]),

      clear: () => set(initialState),
    }),
    {
      name: "onday-favorites",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
