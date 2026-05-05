---
name: Feature Task
title: "[Feature] CMD-SINGLE-001: 싱글 모드 진단 — createDiagnosis(mode=single) + 정적 JSON 에셋"
labels: ['feature', 'priority:M', 'epic:Single', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-SINGLE-001] 싱글 모드 진단 — createDiagnosis(mode=single) + 학군·가족 항목 자동 숨김 + 야간 치안/편의시설/카페 레이어 기본 활성
- **목적 (Why):**
  - **비즈니스:** 이직 후 이사자(A-01) 등 1인 가구 사용자가 학군·가족 등 불필요 항목 없이 야간 치안·편의시설·카페 중심의 간소화된 진단을 받을 수 있게 한다.
  - **사용자 가치:** 싱글 모드 선택 시 학군·가족 관련 항목이 자동 숨김되고, 야간 치안·편의시설·카페 레이어가 기본 활성화되어 1인 가구 맞춤 진단을 제공한다.
- **범위 (What):**
  - ✅ 만드는 것: `startSingleModeDiagnosis` Server Action, mode='single' 강제 설정, 학군·가족 필드 제거 로직, 정적 JSON 에셋 로드 패턴 (`public/data/`), 야간 치안/편의시설/카페 레이어 활성화 플래그
  - ❌ 만들지 않는 것: ~~DB-009 범죄 캐시 테이블~~ (Rev 1.1 제거), ~~DB-010 학교 Seed~~ (제거), UI 컴포넌트(UI-012 범위), 야간 등급 산출(QRY-SINGLE-001 범위)
- **복잡도:** M
- **Wave:** 4 (Single Mode 트랙)

### ⚠️ Rev 1.1 변경 사항 (필수 인지)

> **CMD-SINGLE-001:** DB-009 의존성 제거, 앱 내 정적 JSON 에셋 직접 참조로 변경.
> → DB-009/DB-010 참조 **절대 금지**. `prisma.crimeStats.findMany()` 등 DB 호출 **절대 0건**.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-021** (§4.1.4): "시스템은 \"싱글 모드\" 선택 시 직장 + 여가 거점 2곳을 입력할 수 있는 인터페이스를 제공해야 한다. 입력 완료 시 학군·가족 관련 항목을 결과에서 자동 숨김 처리하고, 야간 치안·편의시설·카페 밀집도 레이어를 기본 활성화해야 한다. 불필요 항목 노출은 0건이어야 한다."
- **REQ-FUNC-022** (§4.1.4): "시스템은 싱글 모드 후보 동네 탭 시 야간(22~06시) 범죄 발생 건수 기반 안전 등급(A~D)을 표시해야 한다."
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### Rev 1.1 변경 사항 인용 (TASK_LIST v1.3)

> | Task ID | 변경 내용 |
> |---|---|
> | CMD-SINGLE-001 | DB-009 의존성 제거, 정적 JSON 에셋 직접 참조로 변경 |

### 시퀀스 다이어그램 (§6.3.4 싱글 모드)

- **참여 Actor:** 이직 후 이사자(A-01), Next.js Client Component, Server Action(createDiagnosis), Prisma ORM
- **핵심 메시지:**
  ```
  User→Web: "싱글 모드" 선택 + 직장·여가 2곳 입력
  Web→SA: createDiagnosis(mode=single, 직장 좌표, 여가 좌표)
  SA→SA: 학군·가족 항목 필터링 제외 플래그 설정
  SA→SA: 교집합 후보 동네 산출 (CMD-DIAG-002 활용)
  SA→SA: 정적 JSON 에셋에서 치안·편의시설·카페 데이터 로드
  SA→Prisma: Diagnosis 결과 저장 (mode=single)
  SA→Web: 후보 동네 (학군 항목 0건, 치안·편의시설 레이어 활성)
  ```

### 선행 태스크 산출물 (배치 1~11)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-003 | `model Diagnosis` (mode: couple/single) | `@prisma/client` | mode='single' 저장 |
| API-002 | `CreateDiagnosisRequest`, `DiagnosisFilters`, `CandidateAreaDTO`, `ServiceMode` | `@/lib/types/diagnosis` | 입출력 타입, mode enum |
| CMD-DIAG-002 | `calculateIntersection` | `@/lib/diagnosis/intersection` | 교집합 산출 활용 |
| CMD-DIAG-004 | `saveDiagnosisResult` | `@/app/actions/diagnosis` | 결과 저장 (mode=single 분기) |
| CMD-AUTH-003 | `getCurrentUser`, `requireAuth` | `@/lib/auth/session` | 인증 검증 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `public/data/crime-stats.json`에 수도권 동별 범죄 통계 정적 JSON 에셋 생성
  ```json
  [
    { "dongCode": "1168010100", "dongName": "역삼1동", "coord": { "lat": 37.4999, "lng": 127.0374 }, "nightIncidentRate": 0.8, "totalIncidents": 45, "nightIncidents": 12, "quarter": "2026Q1" },
    ...
  ]
  ```
  - 수도권 행정동 ≥90% 커버리지 (QRY-SINGLE-001에서 검증)

- [ ] **3.2** `public/data/facilities.json`에 편의시설 정적 JSON 에셋 생성
  ```json
  [
    { "id": "fac-001", "name": "CU 역삼점", "type": "convenience_store", "coord": { "lat": 37.5001, "lng": 127.0375 } },
    ...
  ]
  ```

- [ ] **3.3** `public/data/cafes.json`에 카페 정적 JSON 에셋 생성
  ```json
  [
    { "id": "cafe-001", "name": "스타벅스 역삼역점", "coord": { "lat": 37.5002, "lng": 127.0376 } },
    ...
  ]
  ```

- [ ] **3.4** `lib/single-mode/static-data.ts`에 정적 JSON 로드 유틸리티 작성
  ```typescript
  import crimeStatsData from '@/public/data/crime-stats.json';
  import facilitiesData from '@/public/data/facilities.json';
  import cafesData from '@/public/data/cafes.json';

  export interface CrimeStatEntry {
    dongCode: string; dongName: string;
    coord: { lat: number; lng: number };
    nightIncidentRate: number; totalIncidents: number; nightIncidents: number;
    quarter: string;
  }

  export interface FacilityEntry {
    id: string; name: string; type: string;
    coord: { lat: number; lng: number };
  }

  export function isWithinRadius(
    center: { lat: number; lng: number },
    point: { lat: number; lng: number },
    radiusMeters: number
  ): boolean {
    const R = 6371e3;
    const dLat = (point.lat - center.lat) * Math.PI / 180;
    const dLng = (point.lng - center.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(center.lat*Math.PI/180) * Math.cos(point.lat*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) <= radiusMeters;
  }

  export function getNearbyFacilities(coord: { lat: number; lng: number }, radiusM = 1000) {
    return (facilitiesData as FacilityEntry[]).filter(f => isWithinRadius(coord, f.coord, radiusM));
  }

  export function getNearbyCafes(coord: { lat: number; lng: number }, radiusM = 1000) {
    return (cafesData as FacilityEntry[]).filter(c => isWithinRadius(coord, c.coord, radiusM));
  }

  export function getNearbyCrimeStats(coord: { lat: number; lng: number }, radiusM = 1000) {
    return (crimeStatsData as CrimeStatEntry[]).filter(c => isWithinRadius(coord, c.coord, radiusM));
  }
  ```

- [ ] **3.5** `lib/single-mode/single-diagnosis.ts`에 싱글 모드 진단 함수 작성
  ```typescript
  import type { CandidateAreaDTO, DiagnosisFilters } from '@/lib/types/diagnosis';
  import { getNearbyFacilities, getNearbyCafes, getNearbyCrimeStats } from './static-data';

  const SINGLE_MODE_HIDDEN_FIELDS = ['schoolDistrict', 'familySize', 'schoolZone', 'childAge'] as const;

  export interface SingleModeCandidateDTO extends Omit<CandidateAreaDTO, 'commuteB'> {
    nightSafetyData: { crimeCount: number; incidentRate: number };
    facilityCount: number;
    cafeCount: number;
  }

  export function sanitizeSingleModeCandidate(candidate: any): any {
    const sanitized = { ...candidate };
    for (const field of SINGLE_MODE_HIDDEN_FIELDS) {
      delete sanitized[field];
    }
    return sanitized;
  }

  export function enrichWithSingleModeData(
    candidates: CandidateAreaDTO[]
  ): SingleModeCandidateDTO[] {
    return candidates.map(c => {
      const crimeStats = getNearbyCrimeStats(c.coord);
      const facilities = getNearbyFacilities(c.coord);
      const cafes = getNearbyCafes(c.coord);
      const sanitized = sanitizeSingleModeCandidate(c);
      return {
        ...sanitized,
        nightSafetyData: {
          crimeCount: crimeStats.reduce((sum, s) => sum + s.nightIncidents, 0),
          incidentRate: crimeStats.length > 0
            ? crimeStats.reduce((sum, s) => sum + s.nightIncidentRate, 0) / crimeStats.length
            : 0,
        },
        facilityCount: facilities.length,
        cafeCount: cafes.length,
      };
    });
  }

  export function getSingleModeDefaultLayers(): string[] {
    return ['nightSafety', 'facilities', 'cafes'];
  }
  ```

- [ ] **3.6** `app/actions/single-mode.ts`에 싱글 모드 Server Action 작성
  ```typescript
  'use server';
  import { requireAuth } from '@/lib/auth/session';
  import { saveDiagnosisResult } from './diagnosis';
  import { enrichWithSingleModeData, getSingleModeDefaultLayers } from '@/lib/single-mode/single-diagnosis';
  import type { SaveDiagnosisInput } from '@/lib/types/diagnosis';
  import * as Sentry from '@sentry/nextjs';

  export async function startSingleModeDiagnosis(input: {
    addressA: string; coordA: { lat: number; lng: number };
    filters: any; candidates: any[];
  }) {
    const currentUser = await requireAuth();
    const enriched = enrichWithSingleModeData(input.candidates);
    const diagnosisInput: SaveDiagnosisInput = {
      addressA: input.addressA,
      addressB: input.addressA, // 싱글: 동일 주소
      coordA: input.coordA,
      coordB: input.coordA,
      filters: { ...input.filters, mode: 'single' },
      mode: 'single',
      candidates: enriched as any,
    };
    return saveDiagnosisResult(diagnosisInput);
  }
  ```

- [ ] **3.7** `__tests__/single-mode/single-diagnosis.spec.ts`에 단위 테스트
  ```typescript
  describe('sanitizeSingleModeCandidate', () => {
    it('학군·가족 필드 제거 — schoolDistrict/familySize/schoolZone/childAge 0건', () => { /* ... */ });
    it('기존 필드(name, coord, score) 유지', () => { /* ... */ });
  });
  describe('enrichWithSingleModeData', () => {
    it('nightSafetyData, facilityCount, cafeCount 추가', () => { /* ... */ });
    it('정적 JSON에서 데이터 로드 (DB 호출 0건)', () => { /* ... */ });
  });
  describe('getSingleModeDefaultLayers', () => {
    it('nightSafety, facilities, cafes 3개 레이어 반환', () => { /* ... */ });
  });
  ```

- [ ] **3.8** `__tests__/single-mode/static-data.spec.ts`에 정적 JSON 로드 테스트
  ```typescript
  describe('정적 JSON 에셋 로드', () => {
    it('crime-stats.json 정상 로드', () => { /* ... */ });
    it('facilities.json 정상 로드', () => { /* ... */ });
    it('cafes.json 정상 로드', () => { /* ... */ });
    it('isWithinRadius 거리 계산 정확', () => { /* ... */ });
  });
  ```

- [ ] **3.9** DB-009/DB-010 미참조 정적 검증
  ```bash
  grep -rn "crimeStats\|CachedPolice\|DB-009\|DB-010\|schoolSeed" lib/single-mode/ app/actions/single-mode.ts | wc -l  # → 0
  grep -rn "prisma\.crimeStats\|prisma\.schoolZone" lib/single-mode/ | wc -l  # → 0
  ```

- [ ] **3.10** `__tests__/single-mode/rev11-compliance.spec.ts`에 Rev 1.1 정합성 테스트
  ```typescript
  import { readFileSync } from 'fs';
  describe('CMD-SINGLE-001 Rev 1.1 정합성', () => {
    const files = [
      readFileSync('lib/single-mode/static-data.ts', 'utf-8'),
      readFileSync('lib/single-mode/single-diagnosis.ts', 'utf-8'),
      readFileSync('app/actions/single-mode.ts', 'utf-8'),
    ].join('\n');
    it('DB-009/DB-010 참조 0건', () => { expect(files).not.toMatch(/DB-009|DB-010|CachedPolice|crimeCache/i); });
    it('prisma.crimeStats 호출 0건', () => { expect(files).not.toMatch(/prisma\.crimeStats|prisma\.schoolZone/i); });
    it('학군·가족 필드 노출 0건', () => {
      // enrichWithSingleModeData 결과에서 검증
    });
  });
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** mode='single' 진단 정상 활성화
- **Given** 사용자가 "싱글 모드" 선택 + 직장·여가 주소 입력 완료
- **When** `startSingleModeDiagnosis(input)` 호출
- **Then** Diagnosis 저장 시 `mode === 'single'`, 후보 동네에 nightSafetyData·facilityCount·cafeCount 포함

**AC-2 (도메인 핵심):** 학군·가족 필드 응답 0건 (정적 검증)
- **Given** 싱글 모드 진단 결과
- **When** 응답의 candidates 배열 전체 검사
- **Then** `schoolDistrict`, `familySize`, `schoolZone`, `childAge` 필드가 모든 항목에서 존재하지 않음

**AC-3 (도메인 핵심):** 야간 치안/편의시설/카페 레이어 기본 활성
- **Given** 싱글 모드 진단 완료
- **When** `getSingleModeDefaultLayers()` 호출
- **Then** `['nightSafety', 'facilities', 'cafes']` 반환 — 3개 레이어 모두 기본 ON

**AC-4 (Rev 1.1 핵심):** DB-009/DB-010 호출 0건 (grep 정적 검증)
- **Given** `lib/single-mode/` + `app/actions/single-mode.ts` 전체
- **When** `grep -rn "prisma.crimeStats\|DB-009\|DB-010" lib/single-mode/ app/actions/single-mode.ts` 실행
- **Then** 매칭 0건 — 정적 JSON 에셋만 사용

**AC-5 (정상):** 정적 JSON 에셋 로드 동작
- **Given** `public/data/crime-stats.json` 파일 존재
- **When** `getNearbyCrimeStats({ lat: 37.5, lng: 127.0 })` 호출
- **Then** 반경 1km 내 범죄 통계 엔트리 반환 (DB 호출 0건)

**AC-6 (예외):** 비수도권 좌표 입력 시 차단
- **Given** 여가 거점 좌표가 비수도권 (부산)
- **When** 수도권 커버리지 검증 (CMD-DIAG-007 활용)
- **Then** "수도권만 지원됩니다" 안내, 진단 실행 차단

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | Server Action catch 블록에서 `Sentry.captureException` 호출 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `public/data/crime-stats.json` (수도권 동별 범죄 통계 정적 JSON)
- `public/data/facilities.json` (편의시설 정적 JSON)
- `public/data/cafes.json` (카페 정적 JSON)
- `lib/single-mode/static-data.ts` (정적 JSON 로드 + 반경 검색)
- `lib/single-mode/single-diagnosis.ts` (sanitize + enrich + default layers)
- `app/actions/single-mode.ts` (startSingleModeDiagnosis Server Action)
- `__tests__/single-mode/single-diagnosis.spec.ts` (6개 케이스)
- `__tests__/single-mode/static-data.spec.ts` (4개 케이스)
- `__tests__/single-mode/rev11-compliance.spec.ts` (3개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **DB-003 ✅:** Diagnosis 스키마 (mode 컬럼 couple/single)
- **CMD-DIAG-002 ✅:** `calculateIntersection` — 교집합 산출 활용
- **CMD-DIAG-004 ✅:** `saveDiagnosisResult` — mode=single 분기 저장
- **정적 JSON 에셋:** 본 ISSUE에서 정의 (`public/data/`)

### 후행:
- **QRY-SINGLE-001:** 야간 안전 등급 A~D — 정적 JSON 에셋 활용
- **CMD-SINGLE-002:** 리포트 저장 — 싱글 모드 결과 기반
- **UI-012:** 싱글 모드 진단 화면 UI

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/single-mode/single-diagnosis.spec.ts` — 6개 케이스
- **단위 테스트:** `__tests__/single-mode/static-data.spec.ts` — 4개 케이스
- **정적 검증:** `__tests__/single-mode/rev11-compliance.spec.ts` — 3개 케이스 (DB-009/010 0건, prisma.crimeStats 0건)
- **정적 분석:** `grep -rn "DB-009\|DB-010" lib/single-mode/ app/actions/single-mode.ts | wc -l` → 0건
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **정적 JSON 에셋 갱신 주기:** 범죄 통계는 분기별 갱신(경찰청 공공데이터 기준). 연 1회 vs 분기별 갱신 정책 결정 필요. 데이터 수집·가공 프로세스는 별도 태스크.
2. **정적 JSON 파일 크기:** 수도권 전체 행정동 범죄 통계 + 편의시설 + 카페 데이터가 수 MB에 달할 수 있음. Next.js static import 시 번들 크기 영향 검토. 필요 시 dynamic import 또는 fetch로 전환.
3. **CMD-DIAG-002와의 통합 방식:** calculateIntersection은 클라이언트에서 실행. 싱글 모드에서는 addressB = addressA로 처리하는데, 이 경우 교집합 로직이 단일 주소 기반으로 올바르게 동작하는지 확인 필요.
4. **여가 거점 입력 방식:** REQ-FUNC-021은 "직장 + 여가 거점 2곳"을 요구. 현재 CreateDiagnosisRequest는 addressA/addressB만 존재. 싱글 모드에서 addressA=직장, addressB=여가로 매핑할지 별도 필드 추가할지 확정 필요.
