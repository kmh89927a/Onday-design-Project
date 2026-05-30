"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { DiagnosisInput, DiagnosisResult } from "@/lib/types";
import { runRealDiagnosis } from "@/features/diagnosis/run-real-diagnosis";

// ★ W2: production(USE_MOCK=false) = 클라 오케스트레이션(B2 — ODsay /api/commute Promise.all).
//   mock(USE_MOCK=true) = 기존 단일 POST(서버 Haversine 계산) 무변경 = 회귀 격리.
const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

async function createDiagnosis(input: DiagnosisInput) {
  if (!IS_MOCK) {
    return runRealDiagnosis(input);
  }
  const res = await fetch("/api/diagnosis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "진단 요청에 실패했습니다");
  }
  return res.json();
}

async function fetchDiagnosis(id: string): Promise<DiagnosisResult> {
  const res = await fetch(`/api/diagnosis/${id}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "진단 결과를 불러올 수 없습니다");
  }
  return res.json();
}

export function useCreateDiagnosis() {
  return useMutation({
    mutationFn: createDiagnosis,
  });
}

export function useDiagnosis(id: string | null) {
  return useQuery({
    queryKey: ["diagnosis", id],
    queryFn: () => fetchDiagnosis(id!),
    enabled: !!id,
  });
}
