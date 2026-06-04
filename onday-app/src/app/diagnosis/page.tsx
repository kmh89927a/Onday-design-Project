"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";

import { AddressInput } from "@/components/form/address-input";
import { ModeSelector } from "@/components/form/mode-selector";
// ★ DTO-COMMUTE-TIME (#98) — TimeRangeToggle 제거 + CommuteSchedulePicker 교체 (★ Mismatch ㊱).
import { CommuteSchedulePicker } from "@/components/form/commute-schedule-picker";
import type { CommuteSchedule, DealType, DiagnosisFilters } from "@/lib/types";
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
import { cn } from "@/lib/utils";
import { PREFERENCE_TAGS } from "@/lib/diagnosis/preference-tags";

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
  // 여가거점2 점진 공개 — 처음엔 L1만, "+ 추가"로 L2 노출. 이미 값 있으면(불러오기) 자동 노출.
  const [showL2, setShowL2] = React.useState(() => Boolean(leisureB));

  // Issue #112 — maxCommuteTime + budget 입력 영역 (★ 단방향 input → store 동기화, "이전 조건 불러오기" 시점 별도 sync).
  //   budget은 억 단위 input + 내부 만원 변환 (★ formatBudgetFilter "X-Y억" 표시 정합).
  //   min/max 둘 다 박힘 + > 0 시점 store budget 박힘. 그 외 = undefined.
  // 전세/매매 = 억~억 단일 금액. 월세는 별도 입력(아래) — 억 input 은 비전세 시 비움.
  const isWolseBudget = filters.budget?.dealType === "wolse";
  const [budgetMinInput, setBudgetMinInput] = React.useState(
    filters.budget && !isWolseBudget ? String(filters.budget.min / 10000) : "",
  );
  const [budgetMaxInput, setBudgetMaxInput] = React.useState(
    filters.budget && !isWolseBudget ? String(filters.budget.max / 10000) : "",
  );
  // 월세 전용 — 보증금 상한(억) + 월세 상한(만원). 월세 상한이 主(필수), 보증금은 옵션.
  const [depositMaxInput, setDepositMaxInput] = React.useState(
    isWolseBudget && filters.budget?.depositMax
      ? String(filters.budget.depositMax / 10000)
      : "",
  );
  const [monthlyMaxInput, setMonthlyMaxInput] = React.useState(
    isWolseBudget ? String(filters.budget!.max) : "",
  );
  const [dealType, setDealType] = React.useState<DealType>(
    filters.budget?.dealType ?? "jeonse",
  );

  // 전세/매매 — 억~억 단일 금액 범위.
  const syncBudget = (minStr: string, maxStr: string, dt: DealType = dealType) => {
    const minNum = Number(minStr);
    const maxNum = Number(maxStr);
    if (minStr !== "" && maxStr !== "" && minNum > 0 && maxNum > 0) {
      setFilters({
        ...filters,
        budget: { dealType: dt, min: minNum * 10000, max: maxNum * 10000 },
      });
    } else {
      setFilters({ ...filters, budget: undefined });
    }
  };

  // 월세 — 월세 상한(만원, 必) + 보증금 상한(억→만원, 옵션). 월세 상한 없으면 budget 해제.
  //   Infinity 미저장(JSON null화 방지) — 보증금 미입력 시 depositMax=undefined(필터가 ??로 처리).
  const syncWolse = (depStr: string, monStr: string) => {
    const monNum = Number(monStr);
    if (monStr !== "" && monNum > 0) {
      const depNum = Number(depStr);
      const hasDep = depStr !== "" && depNum > 0;
      setFilters({
        ...filters,
        budget: {
          dealType: "wolse",
          min: 0,
          max: monNum,
          depositMax: hasDep ? depNum * 10000 : undefined,
        },
      });
    } else {
      setFilters({ ...filters, budget: undefined });
    }
  };

  // 거래유형 변경 — dealType 반영 + 해당 입력값으로 budget 재동기화.
  const handleDealType = (dt: DealType) => {
    setDealType(dt);
    if (dt === "wolse") syncWolse(depositMaxInput, monthlyMaxInput);
    else syncBudget(budgetMinInput, budgetMaxInput, dt);
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
      // 불러온 조건에 여가거점2가 있으면 입력창 펼침(점진 공개 자동 해제).
      setShowL2(Boolean(config.leisureB));
      // Issue #112 — budget local state sync (★ filters.budget 자가 치유와 별개 영역).
      const nextBudget = (config.filters?.budget ?? undefined) as
        | {
            dealType?: DealType;
            min: number;
            max: number;
            depositMax?: number;
          }
        | undefined;
      const nextIsWolse = nextBudget?.dealType === "wolse";
      setBudgetMinInput(
        nextBudget && !nextIsWolse ? String(nextBudget.min / 10000) : "",
      );
      setBudgetMaxInput(
        nextBudget && !nextIsWolse ? String(nextBudget.max / 10000) : "",
      );
      setDepositMaxInput(
        nextIsWolse && nextBudget?.depositMax
          ? String(nextBudget.depositMax / 10000)
          : "",
      );
      setMonthlyMaxInput(nextIsWolse ? String(nextBudget!.max) : "");
      setDealType(nextBudget?.dealType ?? "jeonse");
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
                  // ★ UI-012 AC-5 (#58) — 여가거점 수도권 검증 (REQ-FUNC-024, 직장 A와 동일 가드).
                  if (item.coordinate && !isWithinMetroBounds(item.coordinate)) {
                    pushToast({ variant: "danger", message: "현재 수도권만 지원됩니다" });
                    return;
                  }
                  setLeisureA(item.title, item.coordinate);
                  setQueryL1(item.title);
                }}
              />
              {showL2 ? (
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
                    // ★ UI-012 AC-5 (#58) — 여가거점 수도권 검증 (REQ-FUNC-024, 직장 A와 동일 가드).
                    if (item.coordinate && !isWithinMetroBounds(item.coordinate)) {
                      pushToast({ variant: "danger", message: "현재 수도권만 지원됩니다" });
                      return;
                    }
                    setLeisureB(item.title, item.coordinate);
                    setQueryL2(item.title);
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowL2(true)}
                  className="flex w-full items-center justify-center gap-s-1 rounded-md border border-dashed border-card-border bg-surface px-s-3 py-s-2 text-body-sm font-bold text-ink-2 transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  + 자주 가는 동네 추가
                </button>
              )}
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
            {/* 거래유형(전세/매매/월세) — 선택 시 예산 입력칸·라벨 전환. */}
            <div className="space-y-s-2">
              <p className="text-body-sm text-ink-2">거래유형</p>
              <div className="flex gap-s-2" role="group" aria-label="거래유형 선택">
                {(
                  [
                    { key: "jeonse", label: "전세" },
                    { key: "maemae", label: "매매" },
                    { key: "wolse", label: "월세" },
                  ] as const
                ).map((opt) => {
                  const active = dealType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleDealType(opt.key)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-sm border px-s-3 py-s-1 text-body-sm font-bold transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-card-border bg-surface text-ink-2 hover:brightness-95",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {dealType === "wolse" ? (
              <div className="space-y-s-2">
                <label className="flex flex-wrap items-center gap-s-2 text-body-sm text-ink-2">
                  보증금
                  <input
                    type="number"
                    min={0}
                    value={depositMaxInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDepositMaxInput(v);
                      syncWolse(v, monthlyMaxInput);
                    }}
                    placeholder="1"
                    className="w-16 rounded-sm border border-card-border bg-surface px-s-2 py-s-1 text-body-sm font-bold text-ink tabular focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                  억 이하
                </label>
                <label className="flex flex-wrap items-center gap-s-2 text-body-sm text-ink-2">
                  월세
                  <input
                    type="number"
                    min={1}
                    value={monthlyMaxInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMonthlyMaxInput(v);
                      syncWolse(depositMaxInput, v);
                    }}
                    placeholder="100"
                    className="w-20 rounded-sm border border-card-border bg-surface px-s-2 py-s-1 text-body-sm font-bold text-ink tabular focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                  만원 이하
                </label>
                <p className="text-caption text-ink-3">
                  동네 시세는 전월세전환율 기준 추정값입니다.
                </p>
              </div>
            ) : (
              <label className="flex flex-wrap items-center gap-s-2 text-body-sm text-ink-2">
                {dealType === "maemae" ? "매매가" : "전세 보증금"}
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
            )}
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

        {/* 선호 태그(⑥) — 단일 선택, 점수 가중(priorityBonus). 부부·싱글 공통. */}
        <section className="mt-s-6 space-y-s-2">
          <p className="text-caption font-bold text-ink">
            어떤 동네가 좋아요?{" "}
            <span className="font-normal text-ink-3">(선택 · 취향 반영)</span>
          </p>
          <div
            role="radiogroup"
            aria-label="선호 태그"
            className="flex flex-wrap gap-s-2"
          >
            {PREFERENCE_TAGS.map((t) => {
              const active = filters.priorities?.[0] === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      priorities: active ? [] : [t.key],
                    })
                  }
                  className={cn(
                    "rounded-full border px-s-3 py-s-2 text-body-sm font-bold transition-colors",
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-card-border bg-surface text-ink-2 hover:bg-bg",
                    "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
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
