"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";

import {
  AddressInput,
  type AddressSuggestion,
} from "@/components/form/address-input";
import { ModeSelector } from "@/components/form/mode-selector";
import {
  TimeRangeToggle,
  type TimeRange,
} from "@/components/form/time-range-toggle";
import { AppHeader } from "@/components/layout/app-header";
import { StickyCTABar } from "@/components/layout/sticky-cta-bar";
import { Button } from "@/components/ui/button";
import { useCreateDiagnosis } from "@/features/diagnosis/use-diagnosis";
import { useDebounce } from "@/lib/use-debounce";
import { MOCK_NEIGHBORHOODS } from "@/mocks/neighborhoods";
import { useDiagnosisStore } from "@/stores/diagnosis-store";
import { useUIStore } from "@/stores/ui";

const SUGGESTION_LIMIT = 5;

function searchNeighborhoods(query: string): AddressSuggestion[] {
  const q = query.trim();
  if (!q) return [];
  return MOCK_NEIGHBORHOODS.filter(
    (n) =>
      n.dong.includes(q) || n.gu.includes(q) || `${n.gu} ${n.dong}`.includes(q),
  )
    .slice(0, SUGGESTION_LIMIT)
    .map((n) => ({
      id: n.id,
      title: `${n.gu} ${n.dong}`,
      sub: `매가 ${(n.avgPrice / 10000).toFixed(1)}억 · 안전등급 ${n.safetyGrade}`,
      kind: "지역" as const,
      coordinate: n.coordinate,
    }));
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

  // typing 상태 — store와 분리해서 debounce 적용 (select 시 store 업데이트)
  const [queryA, setQueryA] = React.useState(addressA);
  const [queryB, setQueryB] = React.useState(addressB);
  const [queryL1, setQueryL1] = React.useState(leisureA);
  const [queryL2, setQueryL2] = React.useState(leisureB);
  const debouncedA = useDebounce(queryA, 240);
  const debouncedB = useDebounce(queryB, 240);
  const debouncedL1 = useDebounce(queryL1, 240);
  const debouncedL2 = useDebounce(queryL2, 240);

  const suggestionsA = React.useMemo(
    () => searchNeighborhoods(debouncedA),
    [debouncedA],
  );
  const suggestionsB = React.useMemo(
    () => searchNeighborhoods(debouncedB),
    [debouncedB],
  );
  const suggestionsL1 = React.useMemo(
    () => searchNeighborhoods(debouncedL1),
    [debouncedL1],
  );
  const suggestionsL2 = React.useMemo(
    () => searchNeighborhoods(debouncedL2),
    [debouncedL2],
  );

  const timeRange: TimeRange =
    (filters.timeRange as TimeRange | undefined) ?? "morning";
  const setTimeRange = (next: TimeRange) =>
    setFilters({ ...filters, timeRange: next });

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

  return (
    <main className="flex min-h-screen flex-col bg-surface">
      <AppHeader
        backHref="/login"
        trailing={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              pushToast({
                variant: "default",
                message: "이전 조건 불러오기는 다음 업데이트에 추가됩니다 ✨",
              })
            }
          >
            <RefreshCw className="size-3.5" />
            이전 조건 불러오기
          </Button>
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
                setAddressB(item.title, item.coordinate);
                setQueryB(item.title);
              }}
            />
          )}
          {isSingle && (
            <>
              <AddressInput
                tag="L1"
                label="여가 거점 1 (선택)"
                value={queryL1}
                onChange={setQueryL1}
                placeholder="자주 가는 동네/카페/체육관 등"
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
                label="여가 거점 2 (선택)"
                value={queryL2}
                onChange={setQueryL2}
                placeholder="두 번째 자주 가는 곳"
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
          <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
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
