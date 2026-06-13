import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CandidateArea, Coordinate, DiagnosisFilters, DiagnosisMode } from "@/lib/types";
import type { DayStory } from "@/lib/insight/story";
import type { SummaryResult } from "@/lib/types/deadline";
import { useSessionStore } from "./session";

// persist localStorage key — 게스트/심사관 진입·로그아웃 시 직접 제거에도 재사용(단일 소스).
export const DIAGNOSIS_PERSIST_KEY = "onday-diagnosis-input";
// "이전 조건 불러오기"(diagnosis/page.tsx)가 직접 localStorage 에 쓰는 키 — 직장 주소 포함.
//   persist store 가 아니므로 저장 시 모드 게이팅 + 진입/로그아웃 제거를 호출처에서 한다.
export const LAST_CONFIG_KEY = "onday-last-config";

interface DiagnosisState {
  // Input
  addressA: string;
  addressB: string;
  coordinateA: Coordinate | null;
  coordinateB: Coordinate | null;
  // single 모드 여가거점 (Figma 비전)
  leisureA: string;
  leisureB: string;
  leisureCoordA: Coordinate | null;
  leisureCoordB: Coordinate | null;
  mode: DiagnosisMode;
  filters: DiagnosisFilters;
  deadlineDate: string | null;

  // Result
  diagnosisId: string | null;
  candidates: CandidateArea[];
  // ★ 거래유형/예산 토글 재필터용 통근 캐시 — real 진단의 prefilter 12개 풀(실 transit/자차 통근 보존,
  //   예산필터 전). 토글 시 이 풀을 재필터해 통근 열화·API 재호출 0. mock·재오픈 시 빈 배열(재실행 fallback).
  commutePool: CandidateArea[];
  // 동네 하루 미리보기 세션 캐시 — candidateId → Gemini 스토리. 시트 close/reopen·탭 이동 시 재호출 0.
  //   진단 스코프(맵 전체가 현재 진단 것)라 키=candidate.id 로 충분. setResult/reset 시 비움(다른 통근데이터 → 재생성).
  stories: Record<string, DayStory>;
  // 30분 요약(데드라인) 세션 캐시 — Top3 카드 한 묶음. "30분 요약" 재클릭/탭 재방문 시 재호출 0.
  //   진단 스코프 — setResult/reset 시 비움(새 진단이면 통근/후보 달라짐 → 재생성).
  summary: SummaryResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAddressA: (address: string, coordinate?: Coordinate) => void;
  setAddressB: (address: string, coordinate?: Coordinate) => void;
  setLeisureA: (address: string, coordinate?: Coordinate) => void;
  setLeisureB: (address: string, coordinate?: Coordinate) => void;
  setMode: (mode: DiagnosisMode) => void;
  setFilters: (filters: DiagnosisFilters) => void;
  setDeadlineDate: (date: string | null) => void;
  setResult: (id: string, candidates: CandidateArea[]) => void;
  setStory: (candidateId: string, story: DayStory) => void;
  setSummary: (summary: SummaryResult) => void;
  setCommutePool: (pool: CandidateArea[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  addressA: "",
  addressB: "",
  coordinateA: null,
  coordinateB: null,
  leisureA: "",
  leisureB: "",
  leisureCoordA: null,
  leisureCoordB: null,
  mode: "couple" as DiagnosisMode,
  filters: {},
  deadlineDate: null,
  diagnosisId: null,
  candidates: [],
  commutePool: [],
  stories: {},
  summary: null,
  isLoading: false,
  error: null,
};

// ★ 입력 좌표 + 데드라인 결과(candidates·deadlineDate) localStorage persist.
//   ① 입력 좌표(coordinateA/B 등): 새로고침 시 지도 직장 마커·통근선 복원(#209).
//   ② candidates·deadlineDate: 데드라인 페이지(/deadline)는 정적 라우트(URL [id] 없음)라
//      result-view 식 서버 GET 복원이 불가능 → 외부 링크(네이버) 후 모바일 뒤로가기 reload 시
//      candidates 가 리셋돼 "급매 매물·30분 요약" 이 빈 값이 됐음. 둘을 persist 해 reload 에도 유지.
//      · candidates: 급매 매물·요약 파생 소스. 새 진단 시 setResult 가 덮어씀(staleness 자동 정합).
//      · deadlineDate: D-day. 데드라인 페이지가 candidates 와 함께 쓰는 화면 상태.
//   ★ diagnosisId 는 persist 제외 — result/single 의 복원 가드(inSync = storeId === id)가
//     reload 때 true 가 되면 서버 GET 이 건너뛰어져 filters(persist 제외) 복원이 깨짐. 제외해야
//     result/single 의 GET 복원 흐름이 무변경 유지된다(데드라인은 diagnosisId 를 쓰지 않음).
//   ★ 캐시(commutePool·stories·summary)·filters 는 여전히 제외 — 무겁고 재생성/서버 GET 가능.
//   session/favorites 와 동일 패턴(zustand persist), 별도 storage key.
export const useDiagnosisStore = create<DiagnosisState>()(
  persist(
    (set) => ({
      ...initialState,

      setAddressA: (address, coordinate) =>
        set({ addressA: address, ...(coordinate && { coordinateA: coordinate }) }),

      setAddressB: (address, coordinate) =>
        set({ addressB: address, ...(coordinate && { coordinateB: coordinate }) }),

      setLeisureA: (address, coordinate) =>
        set({ leisureA: address, ...(coordinate && { leisureCoordA: coordinate }) }),

      setLeisureB: (address, coordinate) =>
        set({ leisureB: address, ...(coordinate && { leisureCoordB: coordinate }) }),

      setMode: (mode) => set({ mode }),
      setFilters: (filters) => set({ filters }),
      setDeadlineDate: (deadlineDate) => set({ deadlineDate }),

      // 새 진단 결과 = 통근데이터 달라짐 → 옛 스토리·요약 무효(stories·summary 비움 → 재생성).
      //   입력 좌표는 진단 생성 직전 setAddress* 로 이미 새 값이 박힘 → setResult 가 따로 손댈 필요 없음.
      setResult: (diagnosisId, candidates) =>
        set({
          diagnosisId,
          candidates,
          stories: {},
          summary: null,
          isLoading: false,
          error: null,
        }),

      setStory: (candidateId, story) =>
        set((s) => ({ stories: { ...s.stories, [candidateId]: story } })),

      setSummary: (summary) => set({ summary }),

      setCommutePool: (commutePool) => set({ commutePool }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      // reset = 새 진단 시작 등에서 입력 좌표까지 초기화 → persist 블롭도 비워져 옛 좌표 잔존 0.
      reset: () => set(initialState),
    }),
    {
      name: DIAGNOSIS_PERSIST_KEY,
      // ★ 로그인(카카오)만 입력 좌표·결과 persist — 게스트/심사관(user=null)은 localStorage 에
      //   아무것도 안 남김(심사관 토스트 "회원 정보에 저장되지 않아요" 정합).
      //   ★ 분기는 쓰기(setItem)에서만 — 그 시점엔 모드 확정(진입 후 입력)이라 안전. 게스트면
      //     '쓰기만 건너뜀'(키 미생성). 기존 blob 제거는 진입(login-form)·로그아웃(session-bridge)
      //     의 removeItem 이 전담 — 여기서 삭제까지 하면 로그인 rehydrate 쓰기(init 시 user=null,
      //     Supabase 비동기 setUser 전)가 blob 을 지워 복원 회귀가 나므로 삭제는 하지 않는다.
      //   ★ 읽기(getItem)도 게이팅하지 않음 — 같은 init-시점 user=null 이유. partialize {} 는
      //     빈 blob 을 남겨 "키 없음" 을 못 지키므로 미사용(storage 분기로 키 자체를 안 만든다).
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => {
          if (useSessionStore.getState().user === null) return;
          localStorage.setItem(name, value);
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
      // 입력 좌표(마커·통근선 #209) + candidates·deadlineDate(데드라인 reload #214).
      //   diagnosisId·filters·캐시(commutePool/stories/summary)는 제외.
      partialize: (s) => ({
        addressA: s.addressA,
        addressB: s.addressB,
        coordinateA: s.coordinateA,
        coordinateB: s.coordinateB,
        leisureA: s.leisureA,
        leisureB: s.leisureB,
        leisureCoordA: s.leisureCoordA,
        leisureCoordB: s.leisureCoordB,
        mode: s.mode,
        candidates: s.candidates,
        deadlineDate: s.deadlineDate,
      }),
    },
  ),
);
