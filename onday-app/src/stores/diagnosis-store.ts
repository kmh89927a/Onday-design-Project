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

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set(initialState),
}));
