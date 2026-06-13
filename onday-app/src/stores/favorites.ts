import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  CandidateArea,
  Coordinate,
  DealType,
  DiagnosisMode,
  SafetyGrade,
} from "@/lib/types";
import { useSessionStore } from "./session";

// persist localStorage key — 게스트/심사관 진입·로그아웃 시 직접 제거에도 재사용(단일 소스).
export const FAVORITES_PERSIST_KEY = "onday-favorites";

// 저장한 동네 (즐겨찾기) — localStorage persist.
// ★ id만 저장하면 새로고침 후 후보 상세(이름·등급·통근·시세)를 못 그림(diagnosis-store는 메모리).
//   → 찜 시점에 표시용 스냅샷을 함께 저장해 세션 밖에서도 "찜 목록"을 그릴 수 있게 한다.
//   서버 동기화는 CMD-SAVE-001 (TanStack mutation) 담당, 본 store는 optimistic + 로컬 캐시.

export interface FavoriteItem {
  id: string;
  gu: string;
  dong: string;
  // 네이버 부동산 좌표 기반 아웃링크용 — 레거시 스냅샷은 미보유(optional) → 링크만 생략.
  coordinate?: Coordinate;
  score: number;
  /** 싱글=야간안전 등급(resolveGrade). 부부는 없을 수 있음 → 목록은 점수로 fallback. */
  safetyGrade?: SafetyGrade;
  commuteA: number;
  commuteB?: number;
  priceRange?: { min: number; max: number };
  // 진단 시점 거래유형 + 월세 추정 — 시세 표시 정합(월세 "보증금/월 추정", 매매 "추정").
  //   레거시 스냅샷은 미보유 → 전세로 간주(formatPrice 경로).
  dealType?: DealType;
  wolseEstimate?: { deposit: number; monthly: number };
  mode: DiagnosisMode;
  savedAt: number;
}

// 후보 → 찜 스냅샷. grade는 호출처가 모드별 소스로 넘김(싱글=resolveGrade).
//   dealType은 진단 filters.dealType(budget 과 독립) — 시세 표시용. wolseEstimate는 후보에 이미 박힘.
export function toFavoriteSnapshot(
  c: CandidateArea,
  mode: DiagnosisMode,
  grade?: SafetyGrade | null,
  dealType?: DealType,
  savedAt: number = Date.now(),
): FavoriteItem {
  return {
    id: c.id,
    gu: c.gu,
    dong: c.dong,
    coordinate: c.coordinate,
    score: c.score,
    // 야간안전 등급 = 호출처가 getSafetyByGu(resolveGrade)로 넘긴 grade 만 사용.
    //   null(no_data) / undefined(부부) 둘 다 배지 없이 점수 표시 — stale mock 폴백 제거(#192/#193).
    safetyGrade: grade ?? undefined,
    commuteA: c.commuteA.time,
    commuteB: c.commuteB?.time,
    priceRange: c.priceRange,
    dealType,
    wolseEstimate: c.wolseEstimate,
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
      name: FAVORITES_PERSIST_KEY,
      version: 1,
      // v0(Record<id,true>)는 스냅샷이 없어 복원 불가 → 초기화. 이후 찜은 스냅샷 저장됨.
      migrate: () => ({ favorites: {} }),
      // ★ 로그인(카카오)만 찜 persist — 게스트/심사관(user=null)은 localStorage 에 안 남김
      //   (회원 정보 미저장 정합, #216 좌표·이전조건과 동일). 찜 로직(toggleFavorite/remove/
      //   스냅샷)은 무변경 — storage 계층만 게이팅 → 세션 내 찜은 동작, 새로고침 후 persist 만 빠짐.
      //   ★ setItem 에서 user===null 이면 '쓰기만 건너뜀'(키 미생성). 삭제까지 하면 rehydrate 쓰기
      //     (init 시 로그인도 user=null, Supabase 비동기)가 로그인 찜을 지워 회귀 → 삭제는 진입·
      //     로그아웃이 전담. getItem 도 게이팅 안 함(같은 init-시점 user=null 이유).
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => {
          if (useSessionStore.getState().user === null) return;
          localStorage.setItem(name, value);
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
    },
  ),
);
