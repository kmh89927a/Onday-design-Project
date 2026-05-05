---
name: Feature Task
title: "[Feature] QRY-SINGLE-001: 야간 안전 등급 A~D 조회 — 정적 JSON 에셋 기반"
labels: ['feature', 'priority:M', 'epic:Single', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [QRY-SINGLE-001] 야간 안전 등급(A~D) 조회 — 정적 JSON 에셋 기반 (수도권 90% 커버리지)
- **목적:** 1인 가구(A-01)가 후보 동네의 야간 치안을 A~D 등급으로 즉시 확인. 정적 JSON 메모리 로드로 <100ms 응답.
- **범위:**
  - ✅ `getNightSafetyGrade` 함수, 90% 커버리지 CI 검증 스크립트, SafetyGrade 타입
  - ❌ ~~DB-009~~ (Rev 1.1 제거), UI(UI-013 범위), 데이터 수집/크롤링
- **복잡도:** M | **Wave:** 4

### ⚠️ Rev 1.1: DB-009 의존성 제거, 정적 JSON 에셋 기반으로 변경. DB 호출 0건.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용
- **REQ-FUNC-022** (§4.1.4): "싱글 모드 후보 동네 탭 시 야간(22~06시) 범죄 발생 건수 기반 안전 등급(A~D)을 표시. 치안 데이터 커버리지는 수도권 90% 이상, 데이터 지연은 분기 이내."
- **REQ-NF-001** (§4.2.1): 정적 JSON 메모리 로드 — <100ms 목표
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### Rev 1.1 변경 사항 인용
> | QRY-SINGLE-001 | DB-009 의존성 제거, 정적 JSON 에셋 기반으로 변경 |

### 시퀀스 (§6.3.4)
```
User→Web: 후보 동네 탭
Web→Web: getNightSafetyGrade(coord) — 정적 JSON 메모리 검색
Web→User: 야간 안전 등급(A~D) 표시 (커버리지 ≥ 수도권 90%)
```

### 선행 태스크 산출물

| Task ID | 산출물 | import 경로 | 사용처 |
|---|---|---|---|
| CMD-SINGLE-001 (같은 배치) | `crime-stats.json`, `getNearbyCrimeStats`, `isWithinRadius`, `CrimeStatEntry` | `@/lib/single-mode/static-data` | 범죄 통계 + 반경 검색 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/single-mode/safety-grade.ts` — 등급 산출 함수
  ```typescript
  import { getNearbyCrimeStats } from './static-data';
  export type SafetyGrade = 'A' | 'B' | 'C' | 'D';
  export interface NightSafetyResult {
    grade: SafetyGrade; avgIncidentRate: number;
    nearbyDongCount: number; description: string;
  }
  const THRESHOLDS = { A: 0.5, B: 1.0, C: 2.0 } as const;
  const DESCRIPTIONS: Record<SafetyGrade, string> = {
    A: '매우 안전', B: '안전', C: '보통', D: '주의',
  };
  export function getNightSafetyGrade(coord: { lat: number; lng: number }): NightSafetyResult {
    const nearby = getNearbyCrimeStats(coord, 1000);
    if (nearby.length === 0) return { grade: 'D', avgIncidentRate: 0, nearbyDongCount: 0, description: '데이터 없음' };
    const avg = nearby.reduce((s, n) => s + n.nightIncidentRate, 0) / nearby.length;
    const grade: SafetyGrade = avg < THRESHOLDS.A ? 'A' : avg < THRESHOLDS.B ? 'B' : avg < THRESHOLDS.C ? 'C' : 'D';
    return { grade, avgIncidentRate: avg, nearbyDongCount: nearby.length, description: DESCRIPTIONS[grade] };
  }
  ```

- [ ] **3.2** `lib/single-mode/coverage-check.ts` — 90% 커버리지 검증
  ```typescript
  import crimeStatsData from '@/public/data/crime-stats.json';
  const TOTAL_METRO_DONGS = 1234;
  export function checkCoverage() {
    const uniqueDongs = new Set((crimeStatsData as any[]).map(d => d.dongCode));
    const ratio = uniqueDongs.size / TOTAL_METRO_DONGS;
    return { covered: uniqueDongs.size, total: TOTAL_METRO_DONGS, ratio, pass: ratio >= 0.9 };
  }
  ```

- [ ] **3.3** `scripts/check-coverage.ts` — CI 빌드 시 실행 CLI
  ```typescript
  import { checkCoverage } from '../lib/single-mode/coverage-check';
  const r = checkCoverage();
  console.log(`Coverage: ${r.covered}/${r.total} = ${(r.ratio*100).toFixed(1)}%`);
  if (!r.pass) { console.error('❌ < 90%'); process.exit(1); }
  console.log('✅ Passed');
  ```

- [ ] **3.4** `lib/single-mode/index.ts` 배럴 export 업데이트
- [ ] **3.5** `__tests__/single-mode/safety-grade.spec.ts` — 6개 케이스
  ```typescript
  describe('getNightSafetyGrade', () => {
    it('avgRate < 0.5 → A등급', () => { /* ... */ });
    it('avgRate 0.5~0.99 → B등급', () => { /* ... */ });
    it('avgRate 1.0~1.99 → C등급', () => { /* ... */ });
    it('avgRate ≥ 2.0 → D등급', () => { /* ... */ });
    it('nearby 0건 → D등급 + "데이터 없음"', () => { /* ... */ });
    it('반환값에 grade/avgIncidentRate/nearbyDongCount/description 포함', () => { /* ... */ });
  });
  ```

- [ ] **3.6** `__tests__/single-mode/coverage-check.spec.ts` — 3개 케이스
- [ ] **3.7** DB 호출 0건 정적 검증: `grep -rn "prisma\." lib/single-mode/safety-grade.ts | wc -l` → 0
- [ ] **3.8** Rev 1.1 정합성 테스트: DB-009 참조 0건, prisma 호출 0건, 정적 JSON import 사용 확인
- [ ] **3.9** `package.json`에 `"check:coverage": "npx tsx scripts/check-coverage.ts"` 추가
- [ ] **3.10** CI 파이프라인에 `npm run check:coverage` 단계 추가 검토

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 좌표 → A~D 등급 반환
- **Given** 수도권 좌표 (강남구 lat=37.5, lng=127.0)
- **When** `getNightSafetyGrade(coord)` 호출
- **Then** grade ∈ {A,B,C,D}, avgIncidentRate ≥ 0, description 한국어

**AC-2 (도메인 핵심):** 수도권 90% 커버리지 (CI 빌드 검증)
- **Given** `public/data/crime-stats.json`
- **When** `checkCoverage()` 실행
- **Then** ratio ≥ 0.9, pass === true. 미달 시 CI 빌드 실패

**AC-3 (도메인 핵심):** 정적 JSON 직접 로드 (DB 호출 0건)
- **Given** `lib/single-mode/safety-grade.ts`
- **When** `grep "prisma\." lib/single-mode/safety-grade.ts`
- **Then** 매칭 0건

**AC-4 (경계):** 비수도권 좌표 → D등급 + "데이터 없음"
- **Given** 부산 좌표 (lat=35.1, lng=129.0)
- **When** `getNightSafetyGrade(coord)` 호출
- **Then** grade='D', description='데이터 없음'

**AC-5 (경계):** 등급 경계값 — avgRate 정확히 0.5 → B등급
- **Given** avgIncidentRate = 0.5
- **When** 등급 산출
- **Then** B등급 (0.5 ≤ rate < 1.0)

**AC-6 (Rev 1.1):** DB-009 참조 0건
- **Given** `lib/single-mode/` 전체
- **When** `grep "DB-009\|CachedPolice" lib/single-mode/`
- **Then** 매칭 0건

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 검증 방법 |
|---|---|---|
| REQ-NF-001 | "교차 계산 p95 ≤ 8,000ms" — 등급 산출은 <100ms | performance.now() 측정 |
| REQ-NF-035 | "Sentry 기본 알림" (§4.2.6) | 에러 시 Sentry.captureException |

---

## 6. 📦 Deliverables

- `lib/single-mode/safety-grade.ts`
- `lib/single-mode/coverage-check.ts`
- `lib/single-mode/index.ts` (업데이트)
- `scripts/check-coverage.ts`
- `__tests__/single-mode/safety-grade.spec.ts` (6개)
- `__tests__/single-mode/coverage-check.spec.ts` (3개)
- `__tests__/single-mode/safety-grade-rev11.spec.ts` (3개)

---

## 7. 🔗 Dependencies

### 선행:
- **CMD-SINGLE-001 (같은 배치):** 정적 JSON 에셋 + static-data 유틸리티

### 후행:
- **UI-013:** 야간 안전 등급 표시 UI
- **TEST-006:** 싱글 모드 GWT 시나리오

---

## 8. 🧪 Test Plan

- **단위:** safety-grade.spec.ts (6개), coverage-check.spec.ts (3개)
- **정적 검증:** safety-grade-rev11.spec.ts (3개)
- **CI 빌드:** `npm run check:coverage` — 90% 미달 시 실패
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint

---

## 9. 🚧 Open Questions / Risks

1. **비수도권 좌표 처리:** 'D' vs NULL — UI-013에서 "데이터 없음" 시 등급 미표시 vs 'D' 표시 중 선택 필요.
2. **TOTAL_METRO_DONGS 정확값:** 1,234는 추정. 행정안전부 공식 수치 확인 필요.
3. **등급 임계값 조정:** 초기 설정(0.5/1.0/2.0)은 데이터 분포 기반 조정 필요.
4. **정적 JSON 갱신 주기:** 분기별 vs 연 1회 — 별도 INFRA 태스크로 분리.
