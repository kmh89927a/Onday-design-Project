---
name: Feature Task
title: "[Feature] CMD-DIAG-005: 조건 필터 실시간 적용 (클라이언트 사이드 캐싱 기반, p95 ≤1,000ms)"
labels: ['feature', 'priority:M', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DIAG-005] 조건 필터 실시간 적용 — 클라이언트 사이드 캐싱 기반 필터링 + 지도 갱신
- **목적 (Why):**
  - **비즈니스:** 사용자가 최대 통근 시간, 예산 등 필터 조건을 변경할 때 결과가 즉시 갱신되어 탐색 시간을 단축한다.
  - **사용자 가치:** 필터 슬라이더 조작 시 실시간(≤1초)으로 지도와 리스트가 갱신되어, 직관적인 조건 탐색 경험을 제공한다.
- **범위 (What):**
  - ✅ 만드는 것: `lib/diagnosis/filter.ts` (applyFilters 순수 함수), `lib/diagnosis/use-filtered-candidates.ts` (React Hook — useMemo + debounce 200ms), 빈 결과 시 완화 제안 함수
  - ❌ 만들지 않는 것: 교집합 산출(CMD-DIAG-002), 스코어링(CMD-DIAG-003), 필터 UI(UI-005), Server Action/Route Handler
- **복잡도:** M
- **Wave:** 3 (Diagnosis 트랙)
- **⚠️ 클라이언트 사이드 처리 (절대 준수):** Server Action 사용 금지. `'use client'` 컴포넌트 또는 환경 중립 라이브러리로 구현.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-006** (§4.1.1): "시스템은 조건 필터(최대 통근 시간, 예산)를 적용했을 때 조건에 맞지 않는 후보를 실시간 필터링하고 지도를 갱신해야 한다. 필터 적용 응답은 p95 ≤ 1,000ms여야 한다."
- **REQ-FUNC-008** (§4.1.1): "시스템은 두 직장 간 거리로 인해 교집합 후보가 0곳인 경우 \"조건을 만족하는 동네가 없습니다. 최대 통근 시간을 늘려보세요\" 안내를 1초 이내에 표시하고, 조건 완화 제안을 2개 이상 제공해야 한다."
- **REQ-FUNC-003** (§4.1.1): "외부 교통 API 반복 호출 연산과 교차 연산 로직은 ... 사용자 브라우저(Client Component) 내부에서 ... 처리해야 한다."
- **REQ-NF-004** (§4.2.1): "필터 적용 / 재계산 응답 시간 — p95 ≤ 1,000ms (클라이언트 사이드 캐싱 활용)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §6.3.1 진단 시퀀스 (필터 적용 부분)

```
User→Web: 조건 필터(최대 통근 시간, 예산) 적용
Web→Web: 클라이언트 캐싱 데이터에서 필터링 (서버 호출 X)
Web→User: 실시간 지도 갱신 (≤ 1,000ms)
alt 필터 결과 0곳:
    Web→User: "조건을 만족하는 동네가 없습니다" + 조건 완화 제안 ≥ 2개 (≤ 1초)
```

### §6.5 UseCase Diagram 인용

```
UC-03: 조건 필터 적용 — REQ-FUNC-006 — Actor: C-01(맞벌이 부부), C-02(맹모삼천지교)
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| CMD-DIAG-002 ✅ | `IntersectionResult`, `CandidateAreaDTO[]` | `@/lib/diagnosis/intersection` | 필터링 대상 원본 데이터 |
| API-002 ✅ | `CandidateAreaDTO`, `CommuteInfoDTO`, `DiagnosisFilters` | `@/lib/types/diagnosis` | 필터 조건 + 후보 타입 |
| CMD-DIAG-003 ✅ | `scoreAndRank` 결과 (score 포함 후보) | `@/lib/diagnosis/scoring` | 스코어 포함 후보에 필터 적용 |
| MOCK-001 ✅ | `MOCK_CANDIDATES_NORMAL` | `@/lib/mocks/diagnosis` | 테스트 시 Mock 데이터 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/diagnosis/filter.ts`에 순수 필터 함수 구현 (환경 중립)
  ```typescript
  import type { CandidateAreaDTO, DiagnosisFilters } from '@/lib/types/diagnosis';

  export function applyFilters(
    candidates: CandidateAreaDTO[],
    filters: DiagnosisFilters
  ): CandidateAreaDTO[] {
    return candidates.filter(c => {
      if (filters.maxCommuteTime != null) {
        if (c.commuteA.durationMinutes > filters.maxCommuteTime) return false;
        if (c.commuteB.durationMinutes > filters.maxCommuteTime) return false;
      }
      return true;
    });
  }

  export function generateFilterSuggestions(filters: DiagnosisFilters): string[] {
    const suggestions: string[] = [];
    if (filters.maxCommuteTime && filters.maxCommuteTime < 60) {
      suggestions.push(`최대 통근 시간을 ${filters.maxCommuteTime + 15}분으로 늘려보세요`);
    }
    if (filters.maxCommuteTime && filters.maxCommuteTime < 90) {
      suggestions.push(`최대 통근 시간을 ${filters.maxCommuteTime + 30}분으로 늘려보세요`);
    }
    if (filters.budgetMax) suggestions.push('예산 범위를 넓혀보세요');
    return suggestions;
  }
  ```

- [ ] **3.2** `lib/diagnosis/use-filtered-candidates.ts`에 React Hook 구현 (`'use client'`)
  ```typescript
  'use client';
  import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
  import { applyFilters } from './filter';
  import type { CandidateAreaDTO, DiagnosisFilters } from '@/lib/types/diagnosis';

  const DEBOUNCE_MS = 200;

  export function useFilteredCandidates(candidates: CandidateAreaDTO[]) {
    const [filters, setFilters] = useState<DiagnosisFilters>({});
    const [debouncedFilters, setDebouncedFilters] = useState<DiagnosisFilters>({});
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const updateFilters = useCallback((newFilters: Partial<DiagnosisFilters>) => {
      const merged = { ...filters, ...newFilters };
      setFilters(merged);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setDebouncedFilters(merged), DEBOUNCE_MS);
    }, [filters]);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const filtered = useMemo(() => {
      const start = performance.now();
      const result = applyFilters(candidates, debouncedFilters);
      const elapsed = performance.now() - start;
      if (elapsed > 1000) console.warn(`[FILTER] p95 violation: ${elapsed.toFixed(0)}ms`);
      return result;
    }, [candidates, debouncedFilters]);

    return { filtered, filters, updateFilters, totalCount: candidates.length, filteredCount: filtered.length };
  }
  ```

- [ ] **3.3** `lib/diagnosis/index.ts` 배럴 export 업데이트 — `filter`, `use-filtered-candidates` 추가

- [ ] **3.4** `__tests__/diagnosis/filter.spec.ts`에 순수 필터 함수 테스트 (6개 케이스)
  ```typescript
  import { applyFilters } from '@/lib/diagnosis/filter';
  import { MOCK_CANDIDATES_NORMAL } from '@/lib/mocks/diagnosis';

  describe('applyFilters', () => {
    const candidates = MOCK_CANDIDATES_NORMAL; // commuteA: 20~80분

    it('maxCommuteTime 적용 — 초과 후보 제외', () => {
      const result = applyFilters(candidates, { maxCommuteTime: 40 });
      result.forEach(c => {
        expect(c.commuteA.durationMinutes).toBeLessThanOrEqual(40);
        expect(c.commuteB.durationMinutes).toBeLessThanOrEqual(40);
      });
    });

    it('maxCommuteTime 미설정 — 전체 통과', () => {
      const result = applyFilters(candidates, {});
      expect(result.length).toBe(candidates.length);
    });

    it('commuteA만 초과 — 해당 후보 제외', () => {
      const mockCandidates = [
        { ...candidates[0], commuteA: { durationMinutes: 50 }, commuteB: { durationMinutes: 30 } },
      ];
      const result = applyFilters(mockCandidates as any, { maxCommuteTime: 40 });
      expect(result.length).toBe(0);
    });

    it('commuteB만 초과 — 해당 후보 제외', () => {
      const mockCandidates = [
        { ...candidates[0], commuteA: { durationMinutes: 30 }, commuteB: { durationMinutes: 50 } },
      ];
      const result = applyFilters(mockCandidates as any, { maxCommuteTime: 40 });
      expect(result.length).toBe(0);
    });

    it('빈 candidates → 빈 배열', () => {
      expect(applyFilters([], { maxCommuteTime: 60 })).toEqual([]);
    });

    it('100개 후보 필터링 ≤ 100ms', () => {
      const largeCandidates = Array.from({ length: 100 }, (_, i) => ({
        ...candidates[0], id: `c-${i}`,
      }));
      const start = performance.now();
      applyFilters(largeCandidates as any, { maxCommuteTime: 60 });
      expect(performance.now() - start).toBeLessThan(100);
    });
  });
  ```

- [ ] **3.5** `__tests__/diagnosis/use-filtered-candidates.spec.tsx`에 Hook 테스트 (4개 케이스)
  ```typescript
  import { renderHook, act } from '@testing-library/react';
  import { useFilteredCandidates } from '@/lib/diagnosis/use-filtered-candidates';

  describe('useFilteredCandidates', () => {
    it('초기 상태: 모든 후보 표시', () => {
      const { result } = renderHook(() => useFilteredCandidates(mockCandidates));
      expect(result.current.filteredCount).toBe(mockCandidates.length);
    });

    it('updateFilters 호출 → 200ms 디바운스 후 필터 적용', async () => {
      const { result } = renderHook(() => useFilteredCandidates(mockCandidates));
      act(() => result.current.updateFilters({ maxCommuteTime: 30 }));
      // 디바운스 200ms 대기
      await new Promise(r => setTimeout(r, 250));
      expect(result.current.filteredCount).toBeLessThan(mockCandidates.length);
    });

    it('빈 결과 시 filteredCount === 0', async () => {
      const { result } = renderHook(() => useFilteredCandidates(mockCandidates));
      act(() => result.current.updateFilters({ maxCommuteTime: 1 }));
      await new Promise(r => setTimeout(r, 250));
      expect(result.current.filteredCount).toBe(0);
    });

    it('필터 변경 시 filtered 배열 갱신', async () => {
      const { result } = renderHook(() => useFilteredCandidates(mockCandidates));
      const originalFiltered = result.current.filtered;
      act(() => result.current.updateFilters({ maxCommuteTime: 40 }));
      await new Promise(r => setTimeout(r, 250));
      expect(result.current.filtered).not.toBe(originalFiltered);
    });
  });
  ```

- [ ] **3.6** `__tests__/diagnosis/filter-suggestions.spec.ts`에 완화 제안 테스트 (2개 케이스)
  ```typescript
  import { generateFilterSuggestions } from '@/lib/diagnosis/filter';

  describe('generateFilterSuggestions', () => {
    it('maxCommuteTime < 60 시 제안 ≥ 1개', () => {
      const suggestions = generateFilterSuggestions({ maxCommuteTime: 30 });
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions[0]).toContain('45분');
    });

    it('budgetMax 설정 시 예산 제안 포함', () => {
      const suggestions = generateFilterSuggestions({ budgetMax: 500 });
      expect(suggestions.some(s => s.includes('예산'))).toBe(true);
    });
  });
  ```

- [ ] **3.7** `__tests__/diagnosis/filter-perf.spec.ts`에 성능 벤치마크
  ```typescript
  it('100개 후보 applyFilters ≤ 1,000ms', () => {
    const candidates = Array.from({ length: 100 }, generateMockCandidate);
    const start = performance.now();
    applyFilters(candidates, { maxCommuteTime: 60 });
    expect(performance.now() - start).toBeLessThan(1000);
  });
  ```

- [ ] **3.8** 정적 분석: Server Action 미사용 검증
  ```bash
  grep -r "'use server'" lib/diagnosis/filter*.ts lib/diagnosis/use-filtered*.ts  # → 0건
  ```

- [ ] **3.9** `lib/diagnosis/use-filtered-candidates.ts`에 성능 계측 (performance.now) 추가 — 1초 초과 시 콘솔 경고

- [ ] **3.10** TypeScript 타입 호환성 확인: `npx tsc --noEmit`

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 필터 적용 시 결과 갱신
- **Given** 10개 후보, `maxCommuteTime: 40분`
- **When** `applyFilters(candidates, { maxCommuteTime: 40 })` 호출
- **Then** commuteA ≤ 40 AND commuteB ≤ 40인 후보만 반환

**AC-2 (예외):** 빈 결과 처리
- **Given** 10개 후보, `maxCommuteTime: 10분` (모든 후보 초과)
- **When** 필터 적용
- **Then** `filtered.length === 0`, `generateFilterSuggestions` 반환 suggestions ≥ 2개

**AC-3 (경계):** 100개+ 후보에서도 1초 이내
- **Given** 100개 `CandidateAreaDTO[]`
- **When** `applyFilters(candidates, { maxCommuteTime: 60 })` 호출
- **Then** 처리 시간 ≤ 1,000ms (REQ-NF-004)

**AC-4 (도메인 핵심):** 디바운스 200ms 적용
- **Given** 필터 슬라이더를 빠르게 5회 연속 조작
- **When** 마지막 조작 후 200ms 경과
- **Then** `applyFilters`는 1회만 호출

**AC-5 (보안):** Server Action 사용 0건 정적 검증
- **Given** `lib/diagnosis/filter.ts`, `lib/diagnosis/use-filtered-candidates.ts`
- **When** `grep -r "'use server'"` 실행
- **Then** 매칭 0건

**AC-6 (성능):** p95 ≤ 1,000ms 검증 — 필터 + 렌더링 포함
- **Given** 클라이언트 캐싱된 10개 후보, 사용자가 maxCommuteTime 슬라이더 조작
- **When** 디바운스 후 `useMemo` 내부 `applyFilters` 재계산
- **Then** 필터링 완료까지 p95 ≤ 1,000ms (performance.now 계측)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-004 | "필터 적용 / 재계산 응답 시간 — p95 ≤ 1,000ms (클라이언트 사이드 캐싱 활용)" (§4.2.1) | `useMemo` 내부 `performance.now()` 계측. 1초 초과 시 콘솔 경고. 벤치마크 100개+ 후보 테스트 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 필터 로직 에러 시 Sentry 전송 (Hook 내부 try-catch) |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/diagnosis/filter.ts` (applyFilters 순수 함수 + generateFilterSuggestions 완화 제안)
- `lib/diagnosis/use-filtered-candidates.ts` (useFilteredCandidates React Hook — `'use client'` + 디바운스 200ms + performance 계측)
- `__tests__/diagnosis/filter.spec.ts` (6개 케이스)
- `__tests__/diagnosis/use-filtered-candidates.spec.tsx` (4개 케이스)
- `__tests__/diagnosis/filter-suggestions.spec.ts` (2개 케이스)
- `__tests__/diagnosis/filter-perf.spec.ts` (1개 벤치마크)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **CMD-DIAG-002 ✅:** `CandidateAreaDTO[]` — 필터링 대상 원본 데이터
- **API-002 ✅:** `DiagnosisFilters` — 필터 조건 타입

### 후행:
- **UI-005:** 조건 필터 UI — `useFilteredCandidates` Hook 활용
- **UI-003:** 지도 시각화 — filtered candidates로 마커 갱신

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/diagnosis/filter.spec.ts` — 6개 케이스
- **컴포넌트 테스트:** `__tests__/diagnosis/use-filtered-candidates.spec.tsx` — 4개 케이스
- **단위 테스트:** `__tests__/diagnosis/filter-suggestions.spec.ts` — 2개 케이스
- **벤치마크:** `__tests__/diagnosis/filter-perf.spec.ts` — 100개 후보 1초 이내
- **정적 검증:** Server Action 미사용 grep 검증
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **디바운스 시간 (200ms 적정성):** 사용자 테스트에서 조정 가능 (100~300ms 범위).
2. **필터 항목 확장:** 현재 maxCommuteTime, budgetMin/Max. 교통수단·환승 횟수 필터는 v1.5+.
3. **지도 갱신 연동:** React state 변경 → 지도 re-render. 성능 이슈 시 `React.memo`/`useDeferredValue` 적용 검토.
4. **budgetMin/budgetMax 데이터 소스:** `CandidateAreaDTO`에 예산 필드 없음 — 매물 연동 시 추가.
