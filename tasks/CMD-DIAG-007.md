---
name: Feature Task
title: "[Feature] CMD-DIAG-007: 수도권 커버리지 검증 (비수도권 좌표 차단 + 안내 UI 데이터)"
labels: ['feature', 'priority:L', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DIAG-007] 수도권 커버리지 검증 — 비수도권 좌표 차단 + OUT_OF_COVERAGE 에러 + 안내 메시지 데이터
- **목적 (Why):**
  - **비즈니스:** MVP는 수도권(서울·경기·인천)만 지원. 비수도권 주소 입력 시 명확한 안내로 사용자 혼란을 방지한다.
  - **사용자 가치:** 비수도권 주소 입력 시 "현재 수도권만 지원됩니다" 안내와 함께 진단 실행을 차단하여, 불필요한 대기 시간을 제거한다.
- **범위 (What):**
  - ✅ 만드는 것: `lib/diagnosis/coverage.ts` (SEOUL_METROPOLITAN_BOUNDS 상수, isWithinSeoulMetropolitan 검증 함수, OUT_OF_COVERAGE 에러 데이터)
  - ❌ 만들지 않는 것: Geocoding(CMD-DIAG-001), 안내 UI 컴포넌트(UI-002), 행정동 매핑
- **복잡도:** L
- **Wave:** 3 (Diagnosis 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-031** (§4.1.6): "시스템은 수도권(서울·경기·인천) 외 주소 입력 시 서비스 커버리지 안내 UI를 표시하고 진단 실행을 차단해야 한다."
- **REQ-FUNC-024** (§4.1.4): "시스템은 싱글 모드에서 여가 거점 주소가 서비스 커버리지 밖(비수도권)인 경우, \"해당 지역은 현재 수도권만 지원됩니다\" 안내를 500ms 이내에 표시하고 지원 지역 목록을 제공해야 한다. 커버리지 밖 주소로의 진단 실행은 0건이어야 한다."
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"
- **CON-03** (§1.2.3): "MVP 수도권(서울·경기·인천) 한정"
- **REQ-NF-041** (§4.2.7): "시스템은 v1.5 지방 확장 시 지역 코드 추가만으로 커버리지를 확장할 수 있는 설계여야 한다."

### §6.3.1 진단 시퀀스 (커버리지 검증 부분)

```
Web→Web: 수도권 커버리지 클라이언트 검증
alt 비수도권 주소 포함
    Web→User: 커버리지 안내 UI (≤ 500ms)
    Note: 진단 API 호출 차단
else 수도권 내
    Note: 교집합 산출 진행
```

### §6.3.4 싱글 모드 시퀀스 (커버리지 검증)

```
alt 여가 거점이 비수도권
    Web→User: "수도권만 지원됩니다" 안내 (≤ 500ms) + 지원 지역 목록
    Note: 진단 실행 차단 (커버리지 밖 진단 실행 0건)
```

### §6.5 UseCase Diagram 인용

```
UC-10: 싱글 모드 진단 — REQ-FUNC-021, 024 — Actor: A-01(이직 후 이사)
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| CMD-DIAG-001 ✅ | `geocodeAddress()`, `GeocodedAddress` (좌표) | `@/lib/diagnosis/geocoding` | Geocoding 결과 좌표를 즉시 검증 |
| API-002 ✅ | `DiagnosisErrorCode.ADDRESS_OUT_OF_COVERAGE` | `@/lib/types/diagnosis` | 에러 코드 활용 |

### CMD-DIAG-001과의 통합

- Geocoding(CMD-DIAG-001) 결과 좌표를 **즉시** 검증
- 검증 실패 시 후속 진단 진행 **차단**
- 호출 순서: `geocodeAddress()` → `isWithinSeoulMetropolitan()` → (통과 시) `calculateIntersection()`

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/diagnosis/coverage.ts`에 수도권 좌표 범위 상수 정의
  ```typescript
  export const SEOUL_METROPOLITAN_BOUNDS = {
    latMin: 37.0,   // 평택 남쪽
    latMax: 38.0,   // 양주 북쪽
    lngMin: 126.5,  // 김포 서쪽
    lngMax: 127.5,  // 광주 동쪽
  } as const;

  export const SUPPORTED_REGIONS = ['서울특별시', '경기도', '인천광역시'] as const;
  ```

- [ ] **3.2** `lib/diagnosis/coverage.ts`에 `isWithinSeoulMetropolitan` 검증 함수 구현
  ```typescript
  export function isWithinSeoulMetropolitan(coord: { lat: number; lng: number }): boolean {
    const { latMin, latMax, lngMin, lngMax } = SEOUL_METROPOLITAN_BOUNDS;
    return coord.lat >= latMin && coord.lat <= latMax
      && coord.lng >= lngMin && coord.lng <= lngMax;
  }
  ```

- [ ] **3.3** `lib/diagnosis/coverage.ts`에 커버리지 검증 결과 인터페이스 + 검증 함수 구현
  ```typescript
  import { DiagnosisErrorCode } from '@/lib/types/diagnosis';

  export interface CoverageCheckResult {
    isValid: boolean;
    errorCode?: typeof DiagnosisErrorCode.ADDRESS_OUT_OF_COVERAGE;
    message?: string;
    supportedRegions?: readonly string[];
  }

  export function checkCoverage(
    coordA: { lat: number; lng: number },
    coordB: { lat: number; lng: number }
  ): CoverageCheckResult {
    const aValid = isWithinSeoulMetropolitan(coordA);
    const bValid = isWithinSeoulMetropolitan(coordB);

    if (!aValid || !bValid) {
      return {
        isValid: false,
        errorCode: DiagnosisErrorCode.ADDRESS_OUT_OF_COVERAGE,
        message: '현재 수도권(서울·경기·인천)만 지원됩니다. 향후 확대 예정입니다.',
        supportedRegions: SUPPORTED_REGIONS,
      };
    }
    return { isValid: true };
  }
  ```

- [ ] **3.4** `lib/diagnosis/coverage.ts`에 단일 좌표 검증 함수 추가 (싱글 모드 여가 거점용)
  ```typescript
  export function checkSingleCoverage(
    coord: { lat: number; lng: number }
  ): CoverageCheckResult {
    if (!isWithinSeoulMetropolitan(coord)) {
      return {
        isValid: false,
        errorCode: DiagnosisErrorCode.ADDRESS_OUT_OF_COVERAGE,
        message: '해당 지역은 현재 수도권만 지원됩니다.',
        supportedRegions: SUPPORTED_REGIONS,
      };
    }
    return { isValid: true };
  }
  ```

- [ ] **3.5** `lib/diagnosis/index.ts` 배럴 export 업데이트
  ```typescript
  export * from './coverage';
  ```

- [ ] **3.6** `__tests__/diagnosis/coverage.spec.ts`에 커버리지 검증 테스트 (7개 케이스)
  ```typescript
  import { isWithinSeoulMetropolitan, SEOUL_METROPOLITAN_BOUNDS } from '@/lib/diagnosis/coverage';

  describe('isWithinSeoulMetropolitan', () => {
    it('수도권 좌표 (강남구 역삼동 37.4979, 127.0364) → true', () => {
      expect(isWithinSeoulMetropolitan({ lat: 37.4979, lng: 127.0364 })).toBe(true);
    });

    it('비수도권 좌표 (부산 35.1796, 129.0756) → false', () => {
      expect(isWithinSeoulMetropolitan({ lat: 35.1796, lng: 129.0756 })).toBe(false);
    });

    it('경계값 하한 (lat 37.0, lng 126.5) → true', () => {
      expect(isWithinSeoulMetropolitan({ lat: 37.0, lng: 126.5 })).toBe(true);
    });

    it('경계값 상한 (lat 38.0, lng 127.5) → true', () => {
      expect(isWithinSeoulMetropolitan({ lat: 38.0, lng: 127.5 })).toBe(true);
    });

    it('경계값 바로 밖 (lat 36.99) → false', () => {
      expect(isWithinSeoulMetropolitan({ lat: 36.99, lng: 127.0 })).toBe(false);
    });

    it('인천 (lat 37.4563, lng 126.7052) → true', () => {
      expect(isWithinSeoulMetropolitan({ lat: 37.4563, lng: 126.7052 })).toBe(true);
    });

    it('대전 (lat 36.3504, lng 127.3845) → false', () => {
      expect(isWithinSeoulMetropolitan({ lat: 36.3504, lng: 127.3845 })).toBe(false);
    });
  });
  ```

- [ ] **3.7** `__tests__/diagnosis/coverage-check.spec.ts`에 통합 검증 테스트 (4개 케이스)
  ```typescript
  import { checkCoverage, checkSingleCoverage, SUPPORTED_REGIONS } from '@/lib/diagnosis/coverage';

  describe('checkCoverage', () => {
    const seoulCoord = { lat: 37.5665, lng: 126.9780 };
    const busanCoord = { lat: 35.1796, lng: 129.0756 };

    it('두 좌표 모두 수도권 → isValid: true', () => {
      const result = checkCoverage(seoulCoord, { lat: 37.4563, lng: 126.7052 });
      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeUndefined();
    });

    it('좌표A 비수도권 → isValid: false + OUT_OF_COVERAGE', () => {
      const result = checkCoverage(busanCoord, seoulCoord);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBeDefined();
    });

    it('좌표B 비수도권 → isValid: false + supportedRegions 포함', () => {
      const result = checkCoverage(seoulCoord, busanCoord);
      expect(result.isValid).toBe(false);
      expect(result.supportedRegions).toEqual(SUPPORTED_REGIONS);
    });

    it('안내 메시지에 "수도권" 포함', () => {
      const result = checkCoverage(busanCoord, seoulCoord);
      expect(result.message).toContain('수도권');
    });
  });

  describe('checkSingleCoverage (싱글 모드)', () => {
    it('수도권 좌표 → isValid: true', () => {
      const result = checkSingleCoverage({ lat: 37.5665, lng: 126.9780 });
      expect(result.isValid).toBe(true);
    });

    it('비수도권 좌표 → 안내 메시지에 "수도권만 지원" 포함', () => {
      const result = checkSingleCoverage({ lat: 35.1796, lng: 129.0756 });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('수도권만 지원');
    });
  });
  ```

- [ ] **3.8** `__tests__/diagnosis/coverage-static.spec.ts`에 정적 검증
  ```typescript
  describe('비수도권 진단 실행 0건 정적 검증', () => {
    it('checkCoverage 실패 시 calculateIntersection 호출 불가 (타입 레벨)', () => {
      // CoverageCheckResult.isValid === false일 때 후속 호출 차단 로직 확인
    });
  });
  ```

- [ ] **3.9** v1.3 정합성 검증
  ```bash
  grep -ri "NextAuth\|payment\|AES\|bcrypt\|행정동매핑" lib/diagnosis/coverage.ts  # → 0건
  ```

- [ ] **3.10** TypeScript 타입 호환성: `npx tsc --noEmit`

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 수도권 좌표 통과
- **Given** 강남구 역삼동 좌표 (lat: 37.4979, lng: 127.0364)
- **When** `isWithinSeoulMetropolitan({ lat: 37.4979, lng: 127.0364 })` 호출
- **Then** `true` 반환

**AC-2 (예외):** 비수도권 차단 + OUT_OF_COVERAGE 에러
- **Given** 부산 좌표 (lat: 35.1796, lng: 129.0756)
- **When** `checkCoverage(seoulCoord, busanCoord)` 호출
- **Then** `isValid: false`, `errorCode: 'DIAG_ADDRESS_OUT_OF_COVERAGE'`, `message`에 "수도권" 포함

**AC-3 (경계):** 경계값 통과
- **Given** 경계값 좌표 (lat: 37.0, lng: 126.5) — 수도권 최남서단
- **When** `isWithinSeoulMetropolitan({ lat: 37.0, lng: 126.5 })` 호출
- **Then** `true` 반환 (경계값 포함)

**AC-4 (경계):** 경계값 바로 밖 차단
- **Given** 경계값 바로 밖 좌표 (lat: 36.99, lng: 126.5)
- **When** `isWithinSeoulMetropolitan({ lat: 36.99, lng: 126.5 })` 호출
- **Then** `false` 반환

**AC-5 (도메인 핵심):** 비수도권 진단 실행 0건 정적 검증
- **Given** `checkCoverage` 결과가 `isValid: false`
- **When** 후속 로직에서 `calculateIntersection` 호출 시도
- **Then** 호출 차단 (비수도권 진단 실행 0건)

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | 비수도권 시도 시 Sentry breadcrumb 기록 (추적 목적) |
| REQ-NF-041 | "v1.5 지방 확장 시 지역 코드 추가만으로 커버리지를 확장할 수 있는 설계" (§4.2.7) | `SEOUL_METROPOLITAN_BOUNDS` 상수 분리로 확장 용이 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/diagnosis/coverage.ts` (SEOUL_METROPOLITAN_BOUNDS, isWithinSeoulMetropolitan, checkCoverage, checkSingleCoverage, SUPPORTED_REGIONS)
- `__tests__/diagnosis/coverage.spec.ts` (7개 케이스)
- `__tests__/diagnosis/coverage-check.spec.ts` (4개 케이스)
- `__tests__/diagnosis/coverage-static.spec.ts` (1개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **CMD-DIAG-001 ✅:** Geocoding 결과 좌표 → 즉시 검증
- **API-002 ✅:** `DiagnosisErrorCode.ADDRESS_OUT_OF_COVERAGE`

### 후행:
- **UI-002:** 주소 입력 화면 — 커버리지 검증 결과 기반 안내 UI 표시
- **TEST-001:** 교차 진단 GWT 시나리오 — 비수도권 차단 검증

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/diagnosis/coverage.spec.ts` — 7개 케이스 (수도권, 비수도권, 경계값 4종, 인천, 대전)
- **단위 테스트:** `__tests__/diagnosis/coverage-check.spec.ts` — 4개 케이스 (양쪽 수도권, A 비수도권, B 비수도권, 메시지)
- **정적 검증:** `__tests__/diagnosis/coverage-static.spec.ts` — 1개 케이스 (진단 실행 0건)
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **수도권 좌표 범위 정확도:** 현재 직사각형(lat 37.0~38.0, lng 126.5~127.5) 바운딩 박스. 실제 행정 경계는 불규칙 — 경계 근처(예: 평택 남단, 이천 동단)에서 오판 가능. v1.5에서 GeoJSON 폴리곤 기반으로 정밀화 검토.
2. **확장성 (REQ-NF-041 호환):** `SEOUL_METROPOLITAN_BOUNDS` 상수를 배열(또는 Map)로 확장하면 지방 추가 가능. v1.5에서 `SUPPORTED_REGIONS_MAP` 패턴으로 전환 — 지역 코드 추가만으로 커버리지 확장.
   ```typescript
   // v1.5 확장 예시
   export const COVERAGE_REGIONS: Record<string, BoundsRect> = {
     'seoul-metropolitan': { latMin: 37.0, latMax: 38.0, lngMin: 126.5, lngMax: 127.5 },
     'busan': { latMin: 35.0, latMax: 35.3, lngMin: 128.8, lngMax: 129.2 },
   };
   ```
3. **클라이언트 vs 서버 이중 검증:** 현재 클라이언트 측 검증만 수행. 서버에서도 이중 검증(defense in depth) 필요한지 — MVP에서는 클라이언트만으로 충분하나, 보안 강화 시 Server Action 내부에서도 `isWithinSeoulMetropolitan` 호출 추가.
4. **경계 영역 UX:** 경계값 바로 안쪽(예: lat 37.01)의 동네는 실질적으로 비수도권에 가까울 수 있음. "경계 지역" 경고를 별도 표시하는 UX 패턴 검토 가능 — v1.5+.
5. **싱글 모드 좌표 검증 통합:** `checkSingleCoverage` 함수는 CMD-DIAG-001 Geocoding 결과에 즉시 적용. 싱글 모드 UI(UI-002)에서 여가 거점 입력 후 실시간 검증 트리거 필요.
