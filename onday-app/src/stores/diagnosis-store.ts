import { create } from "zustand";
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

export const useDiagnosisStore = create<DiagnosisState>((set) => ({
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
  reset: () => set(initialState),
}));
