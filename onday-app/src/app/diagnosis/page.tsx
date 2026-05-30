"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";

import { AddressInput } from "@/components/form/address-input";
import { ModeSelector } from "@/components/form/mode-selector";
// ★ DTO-COMMUTE-TIME (#98) — TimeRangeToggle 제거 + CommuteSchedulePicker 교체 (★ Mismatch ㊱).
import { CommuteSchedulePicker } from "@/components/form/commute-schedule-picker";
import type { CommuteSchedule, DiagnosisFilters } from "@/lib/types";
import { AppHeader } from "@/components/layout/app-header";
import { StickyCTABar } from "@/components/layout/sticky-cta-bar";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCreateDiagnosis } from "@/features/diagnosis/use-diagnosis";
// ★ UI-002: 사전 작업 444 lines ↔ CMD-DIAG-001 useGeocode 통합 (★ adapter Hook 패턴 § NEW).
// ★ Mismatch ⑪/⑫/⑭ 정정: useDebounce + MOCK_NEIGHBORHOODS filter → useAddressSuggest adapter (★ adapter 내부 처리).
import { useAddressSuggest } from "@/features/diagnosis/use-address-suggest";
// ★ Mismatch ⑬ 정정: isWithinSeoulMetropolitan → isWithinMetroBounds (★ CMD-DIAG-001 산출물 정합, α₁ page.tsx 책임).
import { isWithinMetroBounds } from "@/lib/diagnosis";
import { trackDiagnosisStarted } from "@/lib/analytics/mixpanel";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useUIStore } from "@/stores/ui";

// ★ REFACTOR-UI-002-FEEDBACK-2 (#96) — 이전 조건 불러오기 (localStorage 직접 + 명시적 패턴, Zustand store 보존 답습).
const LAST_CONFIG_KEY = "onday-last-config";

// ★ REFACTOR-COMMUTE-LEGACY (#102) — Issue #102 머지 이전 사용자가 timeRange 박힌 채 localStorage 저장 시 자가 치유.
//   "morning" → 평일 08:00, "evening" → 평일 18:00, "flexible"/기타 → commuteSchedule 미박힘 (사용자 재입력).
//   commuteSchedule 사전 박힘 시 = 본 ISSUE 이후 데이터 = 변환 X.
function migrateLegacyTimeRange(
  filters: Record<string, unknown>,
): DiagnosisFilters {
  const { timeRange, ...rest } = filters;
  if (rest.commuteSchedule) return rest as DiagnosisFilters;
  if (timeRange === "morning") {
    return {
      ...rest,
      commuteSchedule: {
        days: ["mon", "tue", "wed", "thu", "fri"],
        departureTime: "08:00",
      },
    } as DiagnosisFilters;
  }
  if (timeRange === "evening") {
    return {
      ...rest,
      commuteSchedule: {
        days: ["mon", "tue", "wed", "thu", "fri"],
        departureTime: "18:00",
      },
    } as DiagnosisFilters;
  }
  return rest as DiagnosisFilters;
}

export default function DiagnosisPage() {
  const router = useRouter();
  const addressA = useDiagnosisStore((s) => s.addressA);
  const addressB = useDiagnosisStore((s) => s.addressB);
  const coordinateA = useDiagnosisStore((s) => s.coordinateA);
  const coordinateB = useDiagnosisStore((s) => s.coordinateB);
  const leisureA = useDiagnosisStore((s) => s.leisureA);
  const leisureB = useDiagnosisStore((s) => s.leisureB);
  const leisureCoordA = useDiagnosisStore((s) => s.leisureCoordA);
  const leisureCoordB = useDiagnosisStore((s) => s.leisureCoordB);
  const mode = useDiagnosisStore((s) => s.mode);
  const filters = useDiagnosisStore((s) => s.filters);
  const setAddressA = useDiagnosisStore((s) => s.setAddressA);
  const setAddressB = useDiagnosisStore((s) => s.setAddressB);
  const setLeisureA = useDiagnosisStore((s) => s.setLeisureA);
  const setLeisureB = useDiagnosisStore((s) => s.setLeisureB);
  const setMode = useDiagnosisStore((s) => s.setMode);
  const setFilters = useDiagnosisStore((s) => s.setFilters);
  const setLoading = useDiagnosisStore((s) => s.setLoading);
  const setError = useDiagnosisStore((s) => s.setError);
  const setResult = useDiagnosisStore((s) => s.setResult);
  const pushToast = useUIStore((s) => s.pushToast);
  const createDiagnosis = useCreateDiagnosis();

  // typing 상태 — store와 분리해서 디바운스 적용 (select 시 store 업데이트).
  // ★ Mismatch ⑪/⑫ 정정: useDebounce + MOCK_NEIGHBORHOODS filter → useAddressSuggest adapter Hook 호출 (★ adapter 내부 디바운스 + Mock/실 분기).
  const [queryA, setQueryA] = React.useState(addressA);
  const [queryB, setQueryB] = React.useState(addressB);
  const [queryL1, setQueryL1] = React.useState(leisureA);
  const [queryL2, setQueryL2] = React.useState(leisureB);

  // Issue #112 — maxCommuteTime + budget 입력 영역 (★ 단방향 input → store 동기화, "이전 조건 불러오기" 시점 별도 sync).
  //   budget은 억 단위 input + 내부 만원 변환 (★ formatBudgetFilter "X-Y억" 표시 정합).
  //   min/max 둘 다 박힘 + > 0 시점 store budget 박힘. 그 외 = undefined.
  const [budgetMinInput, setBudgetMinInput] = React.useState(
    filters.budget ? String(filters.budget.min / 10000) : "",
  );
  const [budgetMaxInput, setBudgetMaxInput] = React.useState(
    filters.budget ? String(filters.budget.max / 10000) : "",
  );

  const syncBudget = (minStr: string, maxStr: string) => {
    const minNum = Number(minStr);
    const maxNum = Number(maxStr);
    if (minStr !== "" && maxStr !== "" && minNum > 0 && maxNum > 0) {
      setFilters({
        ...filters,
        budget: { min: minNum * 10000, max: maxNum * 10000 },
      });
    } else {
      setFilters({ ...filters, budget: undefined });
    }
  };

  const { suggestions: suggestionsA } = useAddressSuggest(queryA);
  const { suggestions: suggestionsB } = useAddressSuggest(queryB);
  const { suggestions: suggestionsL1 } = useAddressSuggest(queryL1);
  const { suggestions: suggestionsL2 } = useAddressSuggest(queryL2);

  // ★ DTO-COMMUTE-TIME (#98) — commuteSchedule DTO 정정 (★ Mismatch ㊱ store 자연 흡수).
  const commuteSchedule: CommuteSchedule | undefined = filters.commuteSchedule;
  const setCommuteSchedule = (next: CommuteSchedule | undefined) =>
    setFilters({ ...filters, commuteSchedule: next });

  const isCouple = mode === "couple";
  const isSingle = mode === "single";
  const verifiedA = Boolean(
    coordinateA && addressA === queryA && queryA.length > 0,
  );
  const verifiedB = Boolean(
    coordinateB && addressB === queryB && queryB.length > 0,
  );
  // 여가거점은 선택 사항 — verified 검증은 진단 시작 차단용 X (입력 시 좌표 저장 검증만)
  const canSubmit =
    verifiedA && (!isCouple || verifiedB) && !createDiagnosis.isPending;

  const handleSubmit = async () => {
    if (!canSubmit || !coordinateA) return;
    setLoading(true);
    try {
      const data = await createDiagnosis.mutateAsync({
        addressA,
        addressB: isCouple ? addressB : undefined,
        coordinateA,
        coordinateB: isCouple && coordinateB ? coordinateB : undefined,
        leisureA: isSingle && leisureA ? leisureA : undefined,
        leisureCoordA:
          isSingle && leisureCoordA ? leisureCoordA : undefined,
        leisureB: isSingle && leisureB ? leisureB : undefined,
        leisureCoordB:
          isSingle && leisureCoordB ? leisureCoordB : undefined,
        mode,
        filters,
      });
      setResult(data.diagnosisId, data.candidates);
      // MON-003 v1.4 부활 (Issue #127) — REQ-NF-008 funnel 시작점.
      trackDiagnosisStarted(data.diagnosisId);
      // ★ REFACTOR-UI-002-FEEDBACK-2 (#96) — 진단 시작 성공 시 localStorage 저장 (★ "이전 조건 불러오기" 버튼 호출처).
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            LAST_CONFIG_KEY,
            JSON.stringify({
              addressA, addressB, coordinateA, coordinateB,
              leisureA, leisureB, leisureCoordA, leisureCoordB,
              mode, filters,
            }),
          );
        } catch {
          // ★ localStorage quota 초과 등 silent fail (★ 진단 흐름 차단 X)
        }
      }
      const target = isSingle
        ? `/single/${data.diagnosisId}`
        : `/diagnosis/result/${data.diagnosisId}`;
      router.push(target);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "진단 요청에 실패했습니다";
      setError(msg);
      pushToast({ variant: "danger", message: msg });
    }
  };

  // ★ REFACTOR-UI-002-FEEDBACK-2 (#96) — AppHeader trailing "이전 조건 불러오기" 버튼 onClick (★ pushToast stub 교체).
  const handleLoadLast = () => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LAST_CONFIG_KEY);
      if (!saved) {
        pushToast({ variant: "default", message: "저장된 이전 조건이 없습니다" });
        return;
      }
      const config = JSON.parse(saved);
      // ★ store 상태 복원 (★ Zustand setter 직접 호출)
      setAddressA(config.addressA ?? "", config.coordinateA ?? undefined);
      setAddressB(config.addressB ?? "", config.coordinateB ?? undefined);
      setLeisureA(config.leisureA ?? "", config.leisureCoordA ?? undefined);
      setLeisureB(config.leisureB ?? "", config.leisureCoordB ?? undefined);
      setMode(config.mode ?? "couple");
      // ★ Issue #102 ㊿ — legacy timeRange → commuteSchedule 자가 치유.
      setFilters(migrateLegacyTimeRange(config.filters ?? {}));
      // ★ local query state 동기화 (★ AddressInput value prop)
      setQueryA(config.addressA ?? "");
      setQueryB(config.addressB ?? "");
      setQueryL1(config.leisureA ?? "");
      setQueryL2(config.leisureB ?? "");
      // Issue #112 — budget local state sync (★ filters.budget 자가 치유와 별개 영역).
      const nextBudget = (config.filters?.budget ?? undefined) as
        | { min: number; max: number }
        | undefined;
      setBudgetMinInput(nextBudget ? String(nextBudget.min / 10000) : "");
      setBudgetMaxInput(nextBudget ? String(nextBudget.max / 10000) : "");
      pushToast({ variant: "default", message: "이전 조건을 불러왔습니다 ✨" });
    } catch {
      pushToast({ variant: "default", message: "이전 조건 불러오기 실패" });
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-surface">
      <AppHeader
        backHref="/login"
        trailing={
          <>
            <LogoutButton />
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadLast}
            >
              <RefreshCw className="size-3.5" />
              이전 조건 불러오기
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto px-s-5 pb-[180px]">
        <header className="space-y-s-2 py-s-5">
          <p className="text-caption-xs font-bold tracking-wider text-primary">
            STEP 1 / 2
          </p>
          <h1 className="text-h3 font-extrabold leading-tight tracking-[-0.03em] text-ink">
            {isCouple ? (
              <>
                두 분의 직장 주소를
                <br />
                알려주세요
              </>
            ) : (
              <>
                직장과 여가 거점을
                <br />
                알려주세요
              </>
            )}
          </h1>
          <p className="text-body-sm text-ink-3">
            입력한 주소는 분석 후 자동 삭제돼요
          </p>
        </header>

        <section className="space-y-s-4">
          <AddressInput
            tag="A"
            label="내 직장"
            value={queryA}
            onChange={setQueryA}
            placeholder="역, 회사, 지역명으로 검색"
            suggestions={suggestionsA}
            verified={verifiedA}
            onSelect={(item) => {
              // ★ α₁ 수도권 검증 (★ CMD-DIAG-001 isWithinMetroBounds 호출 = Mismatch ⑬ 정합).
              if (item.coordinate && !isWithinMetroBounds(item.coordinate)) {
                pushToast({ variant: "danger", message: "현재 수도권만 지원됩니다" });
                return;
              }
              setAddressA(item.title, item.coordinate);
              setQueryA(item.title);
            }}
          />
          {isCouple && (
            <AddressInput
              tag="B"
              label="배우자 직장"
              value={queryB}
              onChange={setQueryB}
              placeholder="역, 회사, 지역명으로 검색"
              suggestions={suggestionsB}
              verified={verifiedB}
              onSelect={(item) => {
                // ★ α₁ 수도권 검증 (★ A와 동일 패턴).
                if (item.coordinate && !isWithinMetroBounds(item.coordinate)) {
                  pushToast({ variant: "danger", message: "현재 수도권만 지원됩니다" });
                  return;
                }
                setAddressB(item.title, item.coordinate);
                setQueryB(item.title);
              }}
            />
          )}
          {isSingle && (
            <>
              <AddressInput
                tag="L1"
                label="여가 거점 1 (선택, 자주 가는 동네)"
                value={queryL1}
                onChange={setQueryL1}
                placeholder="강남, 홍대, 합정 등 동네명"
                suggestions={suggestionsL1}
                verified={Boolean(
                  leisureCoordA && leisureA === queryL1 && queryL1.length > 0,
                )}
                onSelect={(item) => {
                  setLeisureA(item.title, item.coordinate);
                  setQueryL1(item.title);
                }}
              />
              <AddressInput
                tag="L2"
                label="여가 거점 2 (선택, 다른 동네)"
                value={queryL2}
                onChange={setQueryL2}
                placeholder="두 번째 자주 가는 동네"
                suggestions={suggestionsL2}
                verified={Boolean(
                  leisureCoordB && leisureB === queryL2 && queryL2.length > 0,
                )}
                onSelect={(item) => {
                  setLeisureB(item.title, item.coordinate);
                  setQueryL2(item.title);
                }}
              />
            </>
          )}
        </section>

        <section className="mt-s-6 space-y-s-2">
          <p className="text-caption font-bold text-ink">언제 출퇴근하세요?</p>
          <CommuteSchedulePicker
            value={commuteSchedule}
            onChange={setCommuteSchedule}
          />
        </section>

        {/* Issue #112 — 조건 입력 (★ maxCommuteTime + budget 자유 입력 + 단방향 store 동기화). */}
        <section className="mt-s-6 space-y-s-2">
          <p className="text-caption font-bold text-ink">조건 (선택)</p>
          <div className="space-y-s-3">
            <label className="flex flex-wrap items-center gap-s-2 text-body-sm text-ink-2">
              최대 출퇴근 시간
              <input
                type="number"
                min={10}
                max={120}
                value={filters.maxCommuteTime ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters({
                    ...filters,
                    maxCommuteTime: v === "" ? undefined : Number(v),
                  });
                }}
                placeholder="60"
                className="w-20 rounded-sm border border-card-border bg-surface px-s-2 py-s-1 text-body-sm font-bold text-ink tabular focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              분
            </label>
            <label className="flex flex-wrap items-center gap-s-2 text-body-sm text-ink-2">
              예산
              <input
                type="number"
                min={1}
                value={budgetMinInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setBudgetMinInput(v);
                  syncBudget(v, budgetMaxInput);
                }}
                placeholder="3"
                className="w-16 rounded-sm border border-card-border bg-surface px-s-2 py-s-1 text-body-sm font-bold text-ink tabular focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              억 ~
              <input
                type="number"
                min={1}
                value={budgetMaxInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setBudgetMaxInput(v);
                  syncBudget(budgetMinInput, v);
                }}
                placeholder="5"
                className="w-16 rounded-sm border border-card-border bg-surface px-s-2 py-s-1 text-body-sm font-bold text-ink tabular focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              억
            </label>
          </div>
        </section>

        <section className="mt-s-6 space-y-s-2">
          <p className="text-caption font-bold text-ink">진단 모드</p>
          <ModeSelector
            value={mode}
            onChange={(next) => {
              // ModeSelector는 'roommate' 미래 옵션 포함, 현재 store는 couple/single만
              if (next === "couple" || next === "single") setMode(next);
            }}
          />
        </section>
      </div>

      <StickyCTABar
        cta={
          <Button
            fullWidth
            onClick={handleSubmit}
            loading={createDiagnosis.isPending}
            disabled={!canSubmit}
            trailing={<ArrowRight />}
          >
            진단 시작
          </Button>
        }
        hint={
          isSingle
            ? "여가거점은 선택 — 입력 시 가산 점수 ↑"
            : "평균 분석 시간 4초 · 후보 6~8개 동네 추천"
        }
      />
    </main>
  );
}
