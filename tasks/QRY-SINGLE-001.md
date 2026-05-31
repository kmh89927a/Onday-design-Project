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

### ⚠️ Rev 1.2 (2026-05-31, #57 W3-1 착수): 명세 역방향 정합 — 현실에 맞게 명세 갱신 (코드가 SSoT)

Rev 1.1 의 전제(동단위 crime-stats.json + 좌표 반경검색)가 데이터 가용성 실측 후 변경됨. 코드를 명세에 억지로 맞추지 않고, 명세를 현실로 갱신. ★ ㊧ Mismatch 5건은 `ISSUE_REGISTER_LOG.md` 에 기록.

| 항목 | Rev 1.1 (구) | Rev 1.2 (신) | 사유 |
|---|---|---|---|
| 조회 함수 | `getNightSafetyGrade(coord)` 좌표 반경 1km 검색 | `getSafetyByGu(gu)` 시군구 룩업 | 동단위 데이터 미수집 → 좌표 반경검색 물리적 불가 |
| 데이터 해상도 | 동(dong) 단위 `crime-stats.json` + `nightIncidentRate` | 시군구 단위 `safety-index.json` (행안부 등급 + CCTV) | 동단위 수집 졸업 전 불가, 시군구는 공공데이터 즉시 가용 |
| 안전 정의 | 야간(22~06시) 범죄 발생건수 | **종합 안전지수** = 범죄(행안부 지역안전지수)×0.7 + CCTV 밀집도×0.3 | 야간 전용 공개통계 부재 + "종합" 요구 |
| 커버리지(AC-2) | 동 1,234개 중 90% | **수도권 66 시군구 100%** (서울25+인천10+경기31) | 측정 단위 동→시군구. CI `check:coverage` 기준 변경 |
| 비수도권(AC-4) | `'D'` + "데이터 없음" | `{grade:null, status:"no_data"}` ("데이터 없음", **'D' 아님**) | 'D'(실제 위험)과 데이터 없음 혼동 = 정직성 위반 |
| 경기 일반구 | (명시 없음) | 시 단위 타협 ("성남시 분당구"→"성남시"). 정규화 함수로 추후 경찰서 단위 세분화 | 행안부/CCTV가 경기를 시 단위 제공 |

**산출물 (Rev 1.2):** `src/lib/data/safety-index.json`(신규, 위치 변경 public→src/lib/data), `src/features/single/safety-index.ts`(`getSafetyByGu`/`normalizeGu`), `scripts/check-coverage.ts`(기준 변경). `safety-stats.ts` 는 보존(표시 함수 grade-key 유지, 등급 소스만 교체). **UI 표현(no_data 배지/회색)은 #59 UI-013 분리.** USE_MOCK=true 유지, 정적 import (Vercel timeout 무관).

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
