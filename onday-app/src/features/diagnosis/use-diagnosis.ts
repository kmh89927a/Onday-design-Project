"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { DiagnosisInput, DiagnosisResult } from "@/lib/types";

async function createDiagnosis(input: DiagnosisInput) {
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
