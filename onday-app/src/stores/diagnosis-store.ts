import { create } from "zustand";
import type { CandidateArea, Coordinate, DiagnosisFilters, DiagnosisMode } from "@/lib/types";

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

  setResult: (diagnosisId, candidates) =>
    set({ diagnosisId, candidates, isLoading: false, error: null }),

  setCommutePool: (commutePool) => set({ commutePool }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set(initialState),
}));
