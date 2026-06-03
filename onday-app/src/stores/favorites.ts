import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { CandidateArea, DiagnosisMode, SafetyGrade } from "@/lib/types";

// 저장한 동네 (즐겨찾기) — localStorage persist.
// ★ id만 저장하면 새로고침 후 후보 상세(이름·등급·통근·시세)를 못 그림(diagnosis-store는 메모리).
//   → 찜 시점에 표시용 스냅샷을 함께 저장해 세션 밖에서도 "찜 목록"을 그릴 수 있게 한다.
//   서버 동기화는 CMD-SAVE-001 (TanStack mutation) 담당, 본 store는 optimistic + 로컬 캐시.

export interface FavoriteItem {
  id: string;
  gu: string;
  dong: string;
  score: number;
  /** 싱글=야간안전 등급(resolveGrade). 부부는 없을 수 있음 → 목록은 점수로 fallback. */
  safetyGrade?: SafetyGrade;
  commuteA: number;
  commuteB?: number;
  priceRange?: { min: number; max: number };
  mode: DiagnosisMode;
  savedAt: number;
}

// 후보 → 찜 스냅샷. grade는 호출처가 모드별 소스로 넘김(싱글=resolveGrade).
export function toFavoriteSnapshot(
  c: CandidateArea,
  mode: DiagnosisMode,
  grade?: SafetyGrade,
  savedAt: number = Date.now(),
): FavoriteItem {
  return {
    id: c.id,
    gu: c.gu,
    dong: c.dong,
    score: c.score,
    safetyGrade: grade ?? c.safetyGrade,
    commuteA: c.commuteA.time,
    commuteB: c.commuteB?.time,
    priceRange: c.priceRange,
    mode,
    savedAt,
  };
}

interface FavoritesState {
  favorites: Record<string, FavoriteItem>;
  /** 즉시 토글 (optimistic) — 추가 시 스냅샷 필요. 서버 mutation은 호출자가 별도 트리거. */
  toggleFavorite: (item: FavoriteItem) => void;
  remove: (areaId: string) => void;
  isFavorite: (areaId: string) => boolean;
  clear: () => void;
}

const initialState = {
  favorites: {} as Record<string, FavoriteItem>,
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      toggleFavorite: (item) =>
        set((state) => {
          const next = { ...state.favorites };
          if (next[item.id]) delete next[item.id];
          else next[item.id] = item;
          return { favorites: next };
        }),

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
      version: 1,
      // v0(Record<id,true>)는 스냅샷이 없어 복원 불가 → 초기화. 이후 찜은 스냅샷 저장됨.
      migrate: () => ({ favorites: {} }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
