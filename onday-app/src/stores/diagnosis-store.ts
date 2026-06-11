import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CandidateArea, Coordinate, DiagnosisFilters, DiagnosisMode } from "@/lib/types";
import type { DayStory } from "@/lib/insight/story";
import type { SummaryResult } from "@/lib/types/deadline";

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

// ★ 입력 좌표만 localStorage persist — 새로고침 시 지도 직장 마커·통근선 복원.
//   직장 마커/선은 coordinateA/B(입력값)에 의존하는데, candidates(숫자 마커)와 달리
//   서버 GET 복원 경로가 없어(DB에 좌표 컬럼 없음) 인메모리 리셋 시 사라졌음.
//   ★ 결과/캐시(candidates·commutePool·stories·summary)는 persist 제외 — 용량·정합상
//     기존대로 서버 GET(result-view)으로 복원. filters 도 서버 GET 복원이라 제외.
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
      name: "onday-diagnosis-input",
      storage: createJSONStorage(() => localStorage),
      // ★ 입력 좌표만 — 지도 직장 마커·통근선 복원에 필요한 최소 필드.
      //   결과(candidates)·캐시(commutePool/stories/summary)·filters 는 제외(서버 GET 복원).
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
      }),
    },
  ),
);
