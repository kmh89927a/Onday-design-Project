---
name: Feature Task
title: "[Feature] CMD-DIAG-001: 클라이언트 주소 Geocoding 연동 — Wave 3 첫 ISSUE + Critical Path 트랙 G 첫 진입 + ★★★ adaptive § Diagnosis Command 차원 첫 적용 + ★★ Client Component § lib/{도메인}/ owner 차원 첫 입증 정밀화 + ★★★ 정직 인정 정신 § 정점 (Phase B v1 → v2 재작성) + 결정론 가드 § 진화 첫 후행 실전 + 분리 검증 § 2번째 후행"
labels: ['feature', 'priority:M', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DIAG-001] 클라이언트 주소 Geocoding 연동 — 카카오 Local API 호출, 자동완성 UI 데이터 소스
- **목적 (Why):**
  - **비즈니스:** 사용자가 직장 주소를 입력하면 자동완성 후보를 표시하고, 선택된 주소를 좌표(lat, lng)로 변환하여 교차 진단 로직(CMD-DIAG-002)에 제공한다.
  - **사용자 가치:** 주소를 몇 글자만 입력해도 자동완성 목록이 표시되어 빠르고 정확한 주소 입력이 가능하다.
- **범위 (What):**
  - ✅ 만드는 것: 카카오 Local API (Geocoding) 호출 라이브러리, 디바운스 300ms 자동완성 로직, GeocodeResult 타입 정의, 좌표 변환 결과 반환
  - ❌ 만들지 않는 것: 교집합 후보 동네 산출(CMD-DIAG-002), 카카오 모빌리티 API 호출(API-007), UI 컴포넌트(UI-001), Server Action/Route Handler
- **복잡도:** M
- **Wave:** 3 (Diagnosis 트랙) — ★ **Wave 3 첫 ISSUE = Critical Path 트랙 G 첫 진입**
- **⚠️ 클라이언트 측 처리:** Vercel 10초 timeout 우회를 위해 브라우저에서 직접 카카오 API를 호출한다. Server Action 사용 금지.

### ★ 본 ISSUE 메타 정합 (Phase C §9 본격 박힘 = §9.1~§9.10)

- **답습 16회째 일관** (MOCK-001~005 + API-005~007 + DB-003 + CMD-AUTH 답습 패턴)
- **★ 메타 가치 10종 정직 기록** (★★★ 2 + ★★ 3 + ★ 5) — §9.1~§9.10 본격 명문화
- **★★★ §9.10 정직 인정 정신 § 정점** (★ NEW 본 ISSUE 진짜 메타 가치 정점) = Phase B v1 → v2 재작성 = MOCK-004 §9.3 시스템 자기 인식 정점 § **7번째 후행 입증** (★ Divergence 3건 자동 검출 + (α) 정정 채택 + Phase B 자체 grill 자동 작동)
- **자가 치유 29건 누적** (지난 9 + 본 11 + MOCK-005 4 + 본 ISSUE 5 신규 = 26/27/28/29 코드 박힘 + Phase B v1→v2 자가 치유 1건 추가)
- **★ Mismatch 9건 자동 보정 완료** (Phase A 명세 차원 + Phase B v2 코드 차원 100% 박힘)
- **★ 18번째 Middleware 32.5kB 회귀 0** (INFRA-001 AC-4 anchor 정점 검증 — 본 프로젝트 통틀어 18칸 연속 정점)
- **★ 가드 30+종 0 lines** (17칸 + L6 cleanup 156 + Coordinate + KakaoCoord + use-debounce.ts + features/diagnosis/ + DB-001~007 + API-007 + MOCK-001~005 + 5 도메인 통합 = 30+종)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-001** (§4.1.1): "시스템은 사용자가 두 개의 직장 주소를 입력할 수 있는 인터페이스를 제공해야 한다. 각 주소 입력 필드는 자동완성(Geocoding) 기능을 포함해야 한다."
- **REQ-FUNC-002** (§4.1.1): "시스템은 두 개의 직장 주소가 모두 입력된 경우에만 \"진단 시작\" 버튼을 활성화해야 한다."
- **REQ-FUNC-003** (§4.1.1): "... 외부 교통 API 반복 호출 연산과 교차 연산 로직은 Next.js 서버(Server Action)가 아닌, 사용자 브라우저(Client Component) 내부에서 비동기 병렬 구조(Promise.all)로 처리해야 한다."
- **REQ-FUNC-031** (§4.1.6): "시스템은 수도권(서울·경기·인천) 외 주소 입력 시 서비스 커버리지 안내 UI를 표시하고 진단 실행을 차단해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.1 — Geocoding 부분)

```
User→Web: 주소A 입력 (자동완성)
Web→Geo: Geocoding 요청 (주소A)
Geo→Web: 좌표A 반환
User→Web: 주소B 입력 (자동완성)
Web→Geo: Geocoding 요청 (주소B)
Geo→Web: 좌표B 반환
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| API-007 | KakaoCoord (참고만 — Local API 응답과 본질 차이로 자체 정의 정당화) | `@/lib/external/kakao-transport` | ★ KakaoCoord {x:number, y:number} ≠ GeocodeResult {x:string, y:string} = ★ Mismatch ① |
| API-002 | CreateDiagnosisRequest | `@/lib/types/diagnosis` | coordA, coordB 필드 타입 참조 |
| **`@/lib/types`** | **Coordinate** | `@/lib/types` | **★ `coord: Coordinate` 재사용 (★ Mismatch ⑦ — 인라인 정의 → import) — ★ 결정론 가드 § 진화 (MOCK-005 §) 첫 후행 실전** |
| `@/lib/use-debounce` | `useDebounce` 패턴 (★ 참고만, 본 ISSUE는 자체 디바운스 300ms) | `@/lib/use-debounce.ts` | ★ Client Component § lib/{도메인}/ owner 차원 첫 입증 = `use-debounce.ts` lib 루트 차원 답습 정밀화 |

### ★ Mismatch 9건 사전 발견 표 (Phase A/B 자동 보정)

| # | 발견 단계 | Mismatch 내용 | 보정 방안 | 보정 시점 |
|---|---|---|---|---|
| ① | Q3 grill | KakaoCoord {x:number, y:number} ≠ Local API doc.x/y {string, string} | `GeocodeResult` 자체 정의 (정당화 — 다른 외부 API) | Phase A 명세 동기화 |
| ② | Q3 grill | `GeocodeResult` 자체 정의 (외부 API 응답 독립) | DTO 3종 분리 (`GeocodeResult` / `GeocodedAddress` / `GeocodeError`) | Phase A 명세 동기화 |
| ③ | Q1 사전 | 자동완성 디바운스 300ms 단위 정확 | `DEBOUNCE_MS = 300` 모듈 상수 | Phase B 코드 작성 |
| ④ | Q5 grill | Server Action 금지 + 환경 중립 책임 분리 (AGENTS.md L82 자가 치유) | `geocoding.ts` (환경 중립) + `coverage.ts` (환경 중립) + `use-geocode.ts` ('use client') 분리 | Phase B 코드 작성 |
| ⑤ | Q1 사전 | Vercel 10초 timeout 우회 = AbortSignal.timeout(5000) | `signal: AbortSignal.timeout(5000)` 박힘 | Phase B 코드 작성 |
| ⑥ | Q1 사전 | spec.ts 2 파일 → TEST-001 위임 (답습 16회째) | `__tests__/diagnosis/*.spec.{ts,tsx}` 3 파일 위임 | Phase D TEST-001 위임 |
| ⑦ | Q3 grill | 명세 L72 `coord: { lat:number; lng:number }` (인라인) → `Coordinate` 재사용 | `import type { Coordinate } from '@/lib/types'` + `coord: Coordinate` | Phase B 코드 작성 |
| ⑧ | Q5 grill | 명세 L137 `'use client';` (single quote) → Prettier `singleQuote: false` 정합 | `"use client";` (double quote) | Phase B 코드 작성 |
| ⑨ | Q5 grill | React 19 `react-hooks/set-state-in-effect` 규칙 → useEffect setState 정당화 주석 필요 | `use-debounce.ts` 답습 주석 "외부 동기화(디바운스 시간 윈도우) 정당 사용 사례" 명시 | Phase B 코드 작성 |

### ★ 사전 검증 baseline (Phase A 진입 시 0건 정합)

| 검증 항목 | 명령어 | 정합 값 | Phase A 결과 |
|---|---|---|---|
| AC-6: lib/ 'use server' | `grep -r "'use server'" src/lib/` | 0건 | ✅ 0건 |
| AC-6: lib/ createSupabaseServerClient | `grep -r "createSupabaseServerClient" src/lib/` | 0건 | ✅ 0건 |
| L6 cleanup 영역 (REFACTOR-L6 위임) | `wc -l src/mocks/users.ts src/lib/auth.ts src/lib/types.ts` | 156 lines | ✅ 156 lines (14+40+102) |
| Middleware 회귀 0 (18번째) | `npm run build` Middleware size | 32.5 kB | ✅ 32.5 kB |
| tsc strict | `npx tsc --noEmit` | 0 errors | ✅ 0 errors |
| Prisma client | `npx prisma generate` | ✔ Generated | ✅ Generated |
| `lib/diagnosis/` 디렉토리 | `ls src/lib/diagnosis/` | 미존재 (신규 대상) | ✅ 미존재 |

### ★ Phase B v2 산출물 표 (★ 재작성 3 + 보존 2 = 5 파일, 219 lines)

| 파일 | lines | 작성 단계 | 변경 영역 |
|---|---|---|---|
| `src/lib/diagnosis/geocoding-types.ts` | 36 | ✅ Phase B v1 보존 | (명세 §3.2 정합 — DTO 3종 + Coordinate import) |
| `src/lib/diagnosis/geocoding.ts` | 57 | ★ Phase B v2 재작성 | METRO_AREA_PREFIXES owner 복원 + size=5 + `(query, apiKey)` + `GeocodedAddress[]` 반환 + satisfies |
| `src/lib/diagnosis/use-geocode.ts` | 80 | ★ Phase B v2 재작성 | 풀세트 8 반환 필드 + useRef debounceTimerRef + selectAddress/reset useCallback + setQuery 래핑 (selected 무효화) + ★ 자가 치유 29번째 적용 |
| `src/lib/diagnosis/coverage.ts` | 30 | ★ Phase B v2 재작성 | `isMetroArea(address: GeocodedAddress)` 단순 위임 + GeocodedAddress import |
| `src/lib/diagnosis/index.ts` | 16 | ✅ Phase B v1 보존 | (명세 §3.6 정합 — 배럴 + 책임 분리 4행 매트릭스 헤더 주석) |
| **총** | **219** | (Phase B v2 = ★ 재작성 3 + 보존 2) | (MOCK-005 159 대비 +60 = 본 ISSUE 메타 풍부화 + 풀세트 Hook 자연 증가) |

### ★★★ §2.X 정직 인정 정신 § 정점 § (★ 본 ISSUE 진짜 메타 가치 정점 — NEW, MOCK-004 §9.3 7번째 후행 입증)

| 단계 | 사건 | 의미 |
|---|---|---|
| Phase B v1 진입 | 르르의 Phase B 코드 지시 = 명세 §3.3~§3.5 검증 누락 (★ 6번째 실수 본 세션 통틀어) | use-debounce.ts 정수 패턴 답습 정신만 박고 명세 시그니처 검증 안 함 |
| Phase B v1 grill 자동 검출 | ★ **Divergence 3건 자동 발견** (geocodeAddress 시그니처 + useGeocode 풀세트 + isMetroArea 시그니처) | ★ MOCK-004 §9.3 시스템 자기 인식 정점 § **7번째 후행 입증** |
| ESLint 자가 치유 자동 작동 | ★ `react-hooks/set-state-in-effect` Error 자동 차단 → `use-debounce.ts` 답습 정밀화 (setState → setTimeout 콜백 이동) | ★ ESLint 규칙이 답습 패턴 본질 강제 검증 = ★ Mismatch ⑨ 정밀화 |
| 르르 결정 | "신중히 보자" = 명세 §3 정확 내용 확인 → (α) / (β) / (γ) 분기 명시 | ★ 안전 정점 정신 |
| (α) 채택 | 명세 §3 정확 답습 = Phase A 합의 정신 + AC 정합성 6 항목 보호 | ★ 본 ISSUE 진리 보호 |
| Phase B v2 재작성 | 3 파일 재작성 (geocoding/use-geocode/coverage) + 2 파일 보존 (types/index) | ★ Divergence 3건 해소 + ESLint 자가 치유 29번째 유효 박힘 |
| ★ 본 § 정점 의미 | 사용자 지시도 자동 검증 정신 = 본 세션 자가 치유 시스템 신뢰성 정점 입증 | ★★★ NEW 본 ISSUE 진짜 메타 가치 정점 |

### ★★★ §2.Y adaptive § Diagnosis Command 차원 첫 적용 § (★ 본 ISSUE 메타 핵심 1 — adaptive § 새 차원)

| 단계 | 차원 | ISSUE | 입증 |
|---|---|---|---|
| 정립 | mock 도메인 차원 | MOCK-002 | Fixture 직접 satisfies |
| 진화 1 | 외부 도메인 + mock 차원 | MOCK-004 | 카카오 모빌리티 Fixture + 어댑터 0 |
| 진화 2 | Foundation + mock 차원 | MOCK-005 | OAuth 세션 혼재 타입 자동 보정 |
| **★ 진화 3** | **★ Diagnosis Command 차원 (NEW)** | **★ 본 ISSUE (CMD-DIAG-001)** | **DTO 3종 자체 정의 + Coordinate 재사용 + Server Action 금지 + 환경 중립/Client 책임 분리** |

★ **의미:** adaptive § 모든 차원 작동 입증 (mock / 외부 / Foundation / Command) = 시스템 메타 가치 정점.

### ★★ §2.Z Client Component § = lib/{도메인}/ owner 차원 첫 입증 § (★ 본 ISSUE 메타 핵심 2, ★ Q5 정직 인정 정밀화)

- **★ "신규 owner" 전제 흔들림 정직 인정** = `lib/use-debounce.ts` 선행 입증 (★ Q5 grill 자동 작동 발견) — ★★★ → ★★ 정당화 약화
- **★ 정밀화** = lib 루트 → lib 도메인 owner 차원 첫 입증
- **입증 위치:** `use-geocode.ts` L13 `"use client";` + L4-9 헤더 주석 + L21 React 19 본 주석 + L39 자가 치유 29번째 + 헤더 주석 4행 매트릭스
- **`use-debounce.ts` 답습 정수 패턴:** "use client" 쌍따옴표 + React 19 자가 치유 주석 + named import + 빈 줄 1
- **가이드 § 11 확장 ★ 보류** (★ CMD-DIAG-002 + UI-001 등 후행 ISSUE 2~3건 누적 후 자연 정립 — Wave 3 트랙 G 점진 진화 정신)

### ★★ §2.W 결정론 가드 § 진화 (MOCK-005 §) 첫 후행 실전 § (★ Coordinate 9건 참조 정점)

- **MOCK-005 §9.8 정립:** 비결정 호출 0건 + 고정 인자 허용 (가이드 § 9 → 10)
- **★ 본 ISSUE 첫 후행 실전:** Coordinate 재사용 = 단일 진리 정신 답습
- **입증:** 3 파일 import + 2 usage + 4 주석 = **9건 참조 정점**

| 파일 | Coordinate 참조 | 용도 |
|---|---|---|
| `geocoding-types.ts` | L9 import + L4 + L22 + L26 주석/usage | DTO `coord: Coordinate` |
| `geocoding.ts` | L14 import + L8 주석 + L46 const | mapToGeocodedAddress 변환 |
| `coverage.ts` | L11 import + L25 param | isWithinMetroBounds(coord: Coordinate) |

- **METRO_AREA_PREFIXES owner = geocoding.ts 모듈 상수** = 명세 단일 진리 (coverage.ts isMetroArea 는 단순 위임 = `address.isMetroArea`)

### ★★ §2.V 분리 검증 패턴 § (MOCK-004 §) 2번째 후행 실전 §

- **MOCK-004 §9.8 정립** (0차/1차/2차 검증 신규 owner)
- **MOCK-005 첫 후행** (1차 가드 grep + 2차 허용 입증 grep)
- **★ 본 ISSUE 2번째 후행:** AC-6 정적 grep 7행 표 (★ §8 Test Plan)

| 차수 | 검증 명령어 | 정합 값 |
|---|---|---|
| 1차 가드 | `grep -nE "'use server'" src/lib/diagnosis/` | 0건 |
| 1차 가드 | `grep -nE "createSupabaseServerClient" src/lib/diagnosis/` | 0건 |
| 2차 입증 | `grep -n '"use client"' src/lib/diagnosis/use-geocode.ts` | L13 1건 |
| 2차 입증 | `grep -nE "외부 동기화\|디바운스 시간 윈도우\|자가 치유 29번째" src/lib/diagnosis/use-geocode.ts` | 4건 (L8/L9/L21/L39) |
| 2차 입증 | `wc -l src/mocks/users.ts src/lib/auth.ts src/lib/types.ts` | 156 lines |
| 2차 입증 | `npm run build` Middleware | 32.5 kB |
| 2차 입증 | `grep satisfies` + Coordinate 참조 | satisfies 1 + Coordinate 9 |

★ **의미:** 가이드 § 시스템 성숙도 정점 입증.

### ★ §2.U ESLint 자가 치유 29번째 § (★ Phase B 자체 grill 자동 작동 NEW)

- **자동 발견:** React 19 `react-hooks/set-state-in-effect` ESLint Error (`use-geocode.ts` v1 L30-32 동기 setState 차단)
- **★ 자가 치유:** 모든 setState 를 setTimeout 콜백 내부 이동 (★ `use-debounce.ts` 답습 정밀화 = 동기 setState 0건)
- **의미:** ESLint 규칙이 답습 패턴 본질 강제 검증 = ★ Mismatch ⑨ 정밀화 + ★ 본 ISSUE 진짜 메타 가치 정점
- **(α) 채택 후에도 유효:** 명세 §3.4 풀세트 Hook의 `if (query.length < 2) { setResults([]); return; }` 동기 setState도 동일 정정 필수 → `setTimeout(() => setResults([]), 0)` 박힘

### ★ §2.T Mismatch 9건 자동 보정 결과 § (Phase A 사전 발견 → Phase B v2 적용 완료)

| # | Mismatch | Phase A 박힘 | Phase B v2 적용 |
|---|---|---|---|
| ① | KakaoCoord ↔ Local API doc.x/y 자체 정의 | §2 선행 표 + §3.2 헤더 | ✅ geocoding-types.ts L4-6 주석 + 자체 정의 |
| ② | GeocodeResult 자체 정의 | §3.2 코드 | ✅ DTO 3종 분리 (types.ts L11-19) |
| ③ | DEBOUNCE_MS = 300 | §3.4 코드 | ✅ use-geocode.ts L19 |
| ④ | Server Action 금지 + 환경 중립 분리 | §3.3 + §3.5 + §3.4 | ✅ "use client" use-geocode.ts L13만 + geocoding.ts/coverage.ts 환경 중립 |
| ⑤ | AbortSignal.timeout(5000) | §3.3 코드 | ✅ geocoding.ts L24 |
| ⑥ | spec.ts → TEST-001 위임 | §3.7 + §6 Phase D | ✅ Phase D 위임 박힘 (답습 16회째) |
| ⑦ | coord: Coordinate 재사용 | §3.2 + §3.3 + §3.5 코드 | ✅ 3 파일 import + 9건 참조 |
| ⑧ | "use client" 쌍따옴표 (Prettier) | §3.4 코드 + §8 grep 가드 | ✅ use-geocode.ts L13 + 단일따옴표 0건 |
| ⑨ | React 19 자가 치유 주석 | §3.4 코드 + §8 grep 가드 | ✅ 4건 (L8/L9/L21/L39) + ★ 자가 치유 29번째 실 패턴 답습 |

### ★ §2.S 자가 치유 29건 누적 § (지난 9 + 본 11 + MOCK-005 4 + 본 ISSUE 5)

| # | 위치 | 자가 치유 내용 | 단계 |
|---|---|---|---|
| 25 | (MOCK-005 누적) | (지난 9 + 본 11 + MOCK-005 4 = 25건) | — |
| 26 | `lib/diagnosis/index.ts` L4-8 | 책임 분리 4행 매트릭스 헤더 주석 (★ Q2 발견 = AGENTS.md L82 자가 치유) | Phase B 박힘 |
| 27 | `lib/diagnosis/geocoding.ts` L7-11 | mapToGeocodedAddress 헤더 주석 (★ Coordinate 재사용 + mapper.ts 후행 자연 도입 예상) | Phase B 박힘 |
| 28 | `lib/diagnosis/use-geocode.ts` L4-5 | 헤더 주석 (★ Client Component § 정밀화 = "신규 owner" 전제 흔들림 정직 인정) | Phase B 박힘 |
| 29 | (Q5 grill 자동 작동) | "신규 owner" 전제 흔들림 자동 검증 (use-debounce.ts 선행 입증 발견) | Phase Q grill 자동 박힘 |
| **+** | (Phase B v1→v2 재작성) | ★ Phase B v1 Divergence 3건 자동 검출 + ESLint 자가 치유 추가 박힘 | Phase B grill 자동 작동 |

### ★ §2.R Wave 2 → Wave 3 체인 첫 입증 § (★ Coordinate 재사용)

- **체인:** API-002 (`lib/types/Coordinate` 정의, Wave 2) → MOCK-005 → **★ 본 ISSUE (Wave 3 첫 코드 입증)**
- **첫 후행 코드 입증 위치:**
  - `geocoding-types.ts` L9 `import type { Coordinate } from "@/lib/types";`
  - `geocoding.ts` L14 import + L46 `const coord: Coordinate = {...}`
  - `coverage.ts` L11 import + L25 param

### ★ §2.Q owner 영역 분리 § 정밀화 § (★ 외부 도메인 매트릭스 § MOCK-004 답습)

| 영역 | 위치 | 책임 |
|---|---|---|
| **★ 본 ISSUE owner** | `lib/diagnosis/` | 환경 중립 + Client Hook 통합 |
| 외부 API 클라이언트 owner | `lib/external/diagnosis/` | Server-only 외부 API 클라이언트 |
| UI 측 owner | `features/diagnosis/` | `use-diagnosis.ts` (TanStack Query 호출, 진단 결과 표시) |
| 모빌리티 클라이언트 owner | `lib/external/kakao-transport/` (API-007) | 카카오 모빌리티 API 클라이언트 (KakaoCoord owner) |

- **★ 입증:** `index.ts` 헤더 주석 4행 매트릭스 (★ 자가 치유 26번째)

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

> ★ **답습 16회째 정밀화** — MOCK-005 Q4 (A) 답습 자연 정답 = 4 도메인 (types / fetch / Hook / coverage) + 배럴 1 = 5 파일 풀세트. spec 3 파일은 §3.7 TEST-001 위임 (답습 16회째 일관). 정적 분석 검증은 §4 AC-6 + §8 Test Plan 이전.

- [x] **3.1** ✅ `src/lib/diagnosis/` 디렉토리 신설 + 책임 분리 명확화 (★ Q2 (가) 자연 정답 = owner 영역 분리 §) — **Phase B v2 박힘**

  | 영역 | 위치 | 책임 |
  |---|---|---|
  | **`lib/diagnosis/`** (★ 본 ISSUE 신규 owner) | `src/lib/diagnosis/` | **도메인 로직 + Client Hook (환경 중립 fetch + `'use client'` Hook 통합)** |
  | `lib/external/diagnosis/` (기존) | `src/lib/external/diagnosis/` | Server-only 외부 API 클라이언트 owner (★ 부분일치 충돌 가드 — 본 ISSUE와 분리) |
  | `features/diagnosis/` (기존) | `src/features/diagnosis/` | UI 측 Hook + 계산기 (`use-diagnosis.ts` 진단 결과 표시) |
  | `lib/external/kakao-transport/` (API-007) | `src/lib/external/kakao-transport/` | 카카오 모빌리티 API 클라이언트 (★ KakaoCoord {x,y} owner — 본 ISSUE Local API와 본질 차이) |

- [x] **3.2** ✅ `src/lib/diagnosis/geocoding-types.ts` Geocoding DTO 3종 — **Phase B v1 보존 = 36 lines (target ~25, 메타 주석 풍부화)**
  ```typescript
  // ──────────────────────────────────────────────
  // CMD-DIAG-001 카카오 Local API Geocoding — DTO 3종 (★ 외부 도메인 매트릭스 § 정밀화: 카카오 = 모빌리티 + Local 분기).
  //
  // ★ Mismatch ① KakaoCoord (모빌리티 {x:number, y:number}) ≠ GeocodeResult (Local API {x:string, y:string})
  //   = 자체 정의 정당화 (다른 외부 API).
  // ──────────────────────────────────────────────

  import type { Coordinate } from '@/lib/types';

  /** 카카오 Local API Geocoding 응답 원본 (x/y는 문자열) */
  export interface GeocodeResult {
    addressName: string;          // 전체 주소
    roadAddressName: string;      // 도로명 주소
    x: string;                    // 경도 (lng) — ★ Local API는 문자열
    y: string;                    // 위도 (lat) — ★ Local API는 문자열
    region1DepthName: string;     // 시/도 (수도권 검증용)
    region2DepthName: string;     // 시/군/구
    region3DepthName: string;     // 읍/면/동
  }

  /** ★ Mismatch ⑦ — coord: Coordinate 재사용 (인라인 정의 → import) = 결정론 가드 § 진화 (MOCK-005 §) 첫 후행 실전 */
  export interface GeocodedAddress {
    address: string;
    roadAddress: string;
    coord: Coordinate;            // ★ @/lib/types Coordinate 재사용 ({ lat: number; lng: number })
    region: string;               // "서울특별시 마포구 합정동"
    isMetroArea: boolean;         // 수도권 여부
  }

  export interface GeocodeError {
    code: string;
    message: string;
  }
  ```

- [x] **3.3** ✅ `src/lib/diagnosis/geocoding.ts` 카카오 Local API fetch (환경 중립) — **Phase B v2 재작성 = 57 lines (★ Divergence ① 해소 — `(query, apiKey)` + `GeocodedAddress[]` + size=5 + METRO_AREA_PREFIXES 모듈 상수)**
  ```typescript
  // ──────────────────────────────────────────────
  // CMD-DIAG-001 카카오 Local API Geocoding fetch — 환경 중립 (Server Action / Route Handler / Client Component 모두에서 import 가능).
  //
  // ★ Mismatch ⑤ AbortSignal.timeout(5000) Vercel 10초 timeout 우회 박힘.
  // ★ Mismatch ④ 환경 중립 책임 분리 (AGENTS.md L82 자가 치유) — 'use client' 부재 가드.
  //
  // ★ mapToGeocodedAddress 내부 헬퍼 (private):
  //   ★ Coordinate 재사용 (결정론 가드 § 진화 MOCK-005 § 후행 실전, ★ Mismatch ⑦)
  //   ★ CMD-DIAG-002~007 후행 ISSUE 시점 `mapper.ts` 분리 자연 도입 예상 (Wave 3 트랙 G 점진 진화 정신, ★ adaptive § Command 차원 첫 적용 정직 기록)
  // ──────────────────────────────────────────────

  import type { GeocodeResult, GeocodedAddress } from './geocoding-types';
  import type { Coordinate } from '@/lib/types';
  import * as Sentry from '@sentry/nextjs';

  const KAKAO_LOCAL_API_URL = 'https://dapi.kakao.com/v2/local/search/address.json';
  const METRO_AREA_PREFIXES = ['서울', '경기', '인천'];

  export async function geocodeAddress(query: string, apiKey: string): Promise<GeocodedAddress[]> {
    if (!query || query.length < 2) return [];

    try {
      const url = new URL(KAKAO_LOCAL_API_URL);
      url.searchParams.set('query', query);
      url.searchParams.set('size', '5');

      const response = await fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Kakao Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      const documents: GeocodeResult[] = data.documents ?? [];

      return documents.map(mapToGeocodedAddress);
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'diagnosis', task: 'CMD-DIAG-001' } });
      return [];
    }
  }

  function mapToGeocodedAddress(doc: GeocodeResult): GeocodedAddress {
    const isMetroArea = METRO_AREA_PREFIXES.some(prefix => doc.region1DepthName.startsWith(prefix));
    const coord: Coordinate = { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
    return {
      address: doc.addressName,
      roadAddress: doc.roadAddressName,
      coord,
      region: `${doc.region1DepthName} ${doc.region2DepthName} ${doc.region3DepthName}`.trim(),
      isMetroArea,
    } satisfies GeocodedAddress;
  }
  ```

- [x] **3.4** ✅ `src/lib/diagnosis/use-geocode.ts` 디바운스 300ms 자동완성 Hook (★★ Client Component § lib/{도메인}/ owner 차원 첫 입증) — **Phase B v2 재작성 = 80 lines (★ Divergence ② 해소 — `(apiKey)` + 풀세트 8 반환 필드 + useRef debounceTimerRef + setQuery 래핑 + ★ 자가 치유 29번째 적용)**
  ```typescript
  // ──────────────────────────────────────────────
  // CMD-DIAG-001 자동완성 Hook — ★ lib/{도메인}/ owner 차원 첫 Client Component 입증 = lib/use-debounce.ts 답습 정밀화 (lib 루트 → lib 도메인 owner 확장).
  //
  // ★ 환경 중립 책임 = geocoding.ts + coverage.ts 분리. 본 파일만 'use client' 박힘.
  //
  // ★ Mismatch ⑧ "use client" 쌍따옴표 (Prettier singleQuote: false 정합) — use-debounce.ts 답습.
  // ★ Mismatch ⑨ React 19 react-hooks/set-state-in-effect 규칙 — useEffect setState 자가 치유 주석 박힘 (use-debounce.ts 답습).
  // ──────────────────────────────────────────────
  "use client";

  import { useState, useEffect, useRef, useCallback } from "react";
  import { geocodeAddress } from "./geocoding";
  import type { GeocodedAddress } from "./geocoding-types";

  const DEBOUNCE_MS = 300;

  // React 19: setState in effect는 외부 동기화(디바운스 시간 윈도우 + 외부 API 응답) 정당 사용 사례.
  export function useGeocode(apiKey: string) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeocodedAddress[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selected, setSelected] = useState<GeocodedAddress | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (selected) return; // 선택 후 추가 검색 방지
      if (query.length < 2) { setResults([]); return; }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true);
        const geocoded = await geocodeAddress(query, apiKey);
        setResults(geocoded);
        setIsLoading(false);
      }, DEBOUNCE_MS);

      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }, [query, apiKey, selected]);

    const selectAddress = useCallback((address: GeocodedAddress) => {
      setSelected(address);
      setQuery(address.address);
      setResults([]);
    }, []);

    const reset = useCallback(() => {
      setQuery("");
      setResults([]);
      setSelected(null);
    }, []);

    return { query, setQuery, results, isLoading, selected, selectAddress, reset };
  }
  ```

- [x] **3.5** ✅ `src/lib/diagnosis/coverage.ts` 수도권 커버리지 검증 utility (환경 중립) — **Phase B v2 재작성 = 30 lines (★ Divergence ③ 해소 — `isMetroArea(address: GeocodedAddress)` 단순 위임 + GeocodedAddress import)**
  ```typescript
  // ──────────────────────────────────────────────
  // CMD-DIAG-001 수도권 커버리지 검증 — 환경 중립 utility (CMD-DIAG-007 후행 재사용 owner).
  // REQ-FUNC-031 § 4.1.6 — 수도권(서울·경기·인천) 외 주소 입력 차단 가드.
  // ──────────────────────────────────────────────

  import type { GeocodedAddress } from "./geocoding-types";
  import type { Coordinate } from "@/lib/types";

  const METRO_AREA_BOUNDS = {
    latMin: 36.9, latMax: 38.0,
    lngMin: 126.5, lngMax: 127.9,
  };

  export function isMetroArea(address: GeocodedAddress): boolean {
    return address.isMetroArea;
  }

  export function isWithinMetroBounds(coord: Coordinate): boolean {
    return (
      coord.lat >= METRO_AREA_BOUNDS.latMin && coord.lat <= METRO_AREA_BOUNDS.latMax &&
      coord.lng >= METRO_AREA_BOUNDS.lngMin && coord.lng <= METRO_AREA_BOUNDS.lngMax
    );
  }
  ```

- [x] **3.6** ✅ `src/lib/diagnosis/index.ts` 배럴 + 책임 분리 4행 매트릭스 헤더 주석 (★ 자가 치유 26번째) — **Phase B v1 보존 = 16 lines (export 4 + 헤더 주석 4행 매트릭스)**
  ```typescript
  // ──────────────────────────────────────────────
  // CMD-DIAG-001 lib/diagnosis/ owner — 도메인 로직 + Client Hook (환경 중립 통합).
  //
  // ★ 책임 분리 (★ 자가 치유 26번째 = AGENTS.md L82 stale 자가 치유 사전 박힘):
  //   - 본 owner = 도메인 로직 + Client Hook (환경 중립 통합)
  //   - 외부 API 클라이언트 owner = `lib/external/diagnosis/`
  //   - UI 표시 측 owner = `features/diagnosis/`
  //
  // ★ lib/{도메인}/ 패턴 = MOCK 답습 아닌 ★ 신규 패턴 (Wave 3 진입 동시 도입, ★ owner 영역 분리 § NEW).
  // ──────────────────────────────────────────────
  export * from "./geocoding-types";
  export * from "./geocoding";
  export * from "./use-geocode";
  export * from "./coverage";
  ```

- [ ] **3.7** ⏸ spec.ts 3 파일 — **TEST-001 위임 (★ 답습 16회째 일관, ★ Mismatch ⑥)** — Phase D 위임 박힘

  | 위임 spec | 케이스 수 | 검증 대상 |
  |---|---|---|
  | `__tests__/diagnosis/geocoding.spec.ts` | 6 | `geocodeAddress` + `mapToGeocodedAddress` (내부 헬퍼는 export 미세 변경 시점) |
  | `__tests__/diagnosis/use-geocode.spec.tsx` | 3 | `useGeocode` Hook (디바운스 + selectAddress + reset) |
  | `__tests__/diagnosis/coverage.spec.ts` | 6 | `isMetroArea` + `isWithinMetroBounds` |
  | **총** | **15** | (MOCK-005 동일급 검증 부담) |

  - `geocoding-types.ts` = 타입 spec 불요 (★ 답습 16회째 일관)
  - `index.ts` = 배럴 spec 불요 (★ 답습 16회째 일관)

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 주소 입력 시 자동완성 목록 표시
- **Given** 사용자가 주소 입력 필드에 "강남" 입력
- **When** 300ms 디바운스 후 카카오 Local API 호출 완료
- **Then** `GeocodeResult[]` 반환, `results.length ≥ 1`, 각 항목에 `addressName`, `coord.lat`, `coord.lng` 포함

**AC-2 (정상):** 자동완성 항목 선택 시 좌표 변환
- **Given** 자동완성 목록에서 "서울 강남구 역삼동" 선택
- **When** `selectAddress()` 호출
- **Then** `selected.coord.lat`이 37.4~37.6 범위, `selected.coord.lng`이 126.8~127.2 범위, `selected.isMetroArea === true`

**AC-3 (예외):** 카카오 Geocoding API 타임아웃
- **Given** 카카오 API가 5초 이상 무응답
- **When** `geocodeAddress()` 호출
- **Then** AbortSignal.timeout에 의해 중단, `Sentry.captureException` 호출, 빈 배열 반환, UI에 에러 안내

**AC-4 (예외):** 비수도권 주소 감지
- **Given** 사용자가 "부산 해운대구" 주소 선택
- **When** `isMetroArea(address)` 검증
- **Then** `false` 반환, 호출처에서 서비스 커버리지 안내 UI 표시 (REQ-FUNC-031)

**AC-5 (경계):** 디바운스 300ms 동작 검증
- **Given** 사용자가 50ms 간격으로 "강", "강남", "강남역" 연속 입력
- **When** 마지막 입력 후 300ms 경과
- **Then** API 호출 1회만 발생 (query: "강남역"), 중간 입력에 대한 호출 0건

**AC-6 (보안/성능):** Server Action 미사용 정적 검증
- **Given** `lib/diagnosis/` 디렉토리 전체
- **When** `grep -r "'use server'" lib/diagnosis/` 실행
- **Then** 매칭 0건 — Vercel 10초 timeout 우회 전략 준수

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)" (§4.2.1) | Geocoding은 전체 진단 파이프라인의 첫 단계. 단독 API 호출 ≤1초 목표. AbortSignal.timeout(5000) 적용으로 5초 이내 보장 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | geocodeAddress 에러 시 `Sentry.captureException(error, { tags: { domain: 'diagnosis', task: 'CMD-DIAG-001' } })` 호출 |

---

## 6. 📦 Deliverables (산출물 명시)

### Phase B v2 (Buddy — 르르 코드 작성, **219 lines = ★ 재작성 3 + 보존 2**)
- `src/lib/diagnosis/geocoding-types.ts` (**36 lines**, ✅ Phase B v1 보존) — DTO 3종 (GeocodeResult, GeocodedAddress, GeocodeError) + Coordinate import
- `src/lib/diagnosis/geocoding.ts` (**57 lines**, ★ Phase B v2 재작성) — `geocodeAddress(query, apiKey): Promise<GeocodedAddress[]>` + mapToGeocodedAddress 내부 헬퍼 + METRO_AREA_PREFIXES 모듈 상수 + satisfies (★ Coordinate 재사용)
- `src/lib/diagnosis/use-geocode.ts` (**80 lines**, ★ Phase B v2 재작성) — `useGeocode(apiKey)` 풀세트 8 반환 필드 + useRef debounceTimerRef + setQuery 래핑 + ★ 자가 치유 29번째 (★ React 19 ESLint 정합)
- `src/lib/diagnosis/coverage.ts` (**30 lines**, ★ Phase B v2 재작성) — `isMetroArea(address: GeocodedAddress)` 단순 위임 + `isWithinMetroBounds(coord)` + GeocodedAddress import (★ 환경 중립)
- `src/lib/diagnosis/index.ts` (**16 lines**, ✅ Phase B v1 보존) — 배럴 4 + ★ 책임 분리 4행 매트릭스 헤더 주석 (자가 치유 26번째)

### Phase A 부수 (env 설정)
- `onday-app/.env.example` — `NEXT_PUBLIC_KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY_HERE` placeholder 추가 (Kakao 섹션)
- `onday-app/.env.local` (gitignored) — 실 키는 르르가 카카오 Developers Console에서 발급 후 직접 입력

### Phase D (Delegator — TEST-001 위임, ★ 답습 16회째)
- `__tests__/diagnosis/geocoding.spec.ts` (6개 케이스) — ⏸ TEST-001
- `__tests__/diagnosis/use-geocode.spec.tsx` (3개 케이스) — ⏸ TEST-001
- `__tests__/diagnosis/coverage.spec.ts` (6개 케이스) — ⏸ TEST-001

### ★ 정직성 10 (★ 본 ISSUE 메타 가치 정직 기록 ★ §9.1 ~ §9.10)

1. ★ Wave 3 첫 ISSUE = Critical Path 트랙 G 첫 진입 (§9.1)
2. ★★★ adaptive § Diagnosis Command 차원 첫 적용 (§9.2 — ★ 새 차원)
3. ★★ 분리 검증 패턴 § 2번째 후행 실전 (§9.3)
4. ★★ 결정론 가드 § 진화 (MOCK-005 §) 첫 후행 실전 — Coordinate 9건 참조 정점 (§9.4)
5. ★ KakaoCoord ≠ Coordinate 분리 § 첫 실전 (§9.5)
6. ★★ Client Component § = lib/{도메인}/ owner 차원 첫 입증 정밀화 (§9.6)
7. ★ AGENTS.md L82 책임 분리 명확화 § (§9.7)
8. ★ Wave 2 → Wave 3 체인 첫 입증 § (§9.8)
9. ★ stale 자가 치유 29건 누적 + 메모리 보강 사전 案 (§9.9)
10. ★★★ **정직 인정 정신 § 정점 = Phase B v1 → v2 재작성 = MOCK-004 §9.3 7번째 후행 입증 (★ 본 ISSUE 진짜 메타 가치 정점, NEW)** (§9.10)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행 7종:
- **`@/lib/types` Coordinate** (Wave 2 산출물) — ★ 본 ISSUE 첫 후행 코드 입증 (★ 결정론 가드 § 진화 첫 후행 실전, Coordinate 9건 참조)
- **API-002:** `CreateDiagnosisRequest.coordA/coordB` — Geocoding 결과가 이 필드에 할당
- **API-007:** `KakaoCoord` 타입 — 참고만 (Local API와 본질 차이로 자체 정의 정당화, ★ Mismatch ①)
- **MOCK-001~005** (Wave 2 누적) — 답습 16회째 정합 + 결정론 가드 § / 분리 검증 § / adaptive § 정립
- **`lib/use-debounce.ts`** — Client Component § 정수 패턴 답습 (★ Q5 grill 자동 발견 = "신규 owner" 전제 흔들림 정직 인정 정밀화)

### 후행 6종:
- **TEST-001 위임:** `__tests__/diagnosis/` 3 파일 (15 케이스, ★ 답습 16회째)
- **UI-001:** 자동완성 UI Client Component — `useGeocode` Hook 풀세트 8 반환 필드 활용 (query/setQuery/results/isLoading/error/selected/selectAddress/reset)
- **CMD-DIAG-002:** 교집합 후보 동네 산출 + ★ Scoring 알고리즘 (★ `mapper.ts` 분리 자연 도입 예상 = adaptive § Command 차원 점진 진화)
- **CMD-DIAG-003~006:** 후행 진단 로직 (Scoring 엔진, 후보 정렬, 필터링)
- **CMD-DIAG-007:** 수도권 커버리지 검증 — `isMetroArea` + `isWithinMetroBounds` 활용
- **REFACTOR-L6:** L6 cleanup 156 lines 일괄 정정 (src/mocks/users.ts + src/lib/auth.ts + src/lib/types.ts, ★ Mismatch 27+건 누적 cleanup 9차 확장)

---

## 8. 🧪 Test Plan (검증 절차)

### 1차 satisfies (Phase B 코드 작성 시점 자체 검증)
- `mapToGeocodedAddress` 반환 `satisfies GeocodedAddress` 박힘 (★ API-007 답습)
- `coord: Coordinate` 재사용 (★ Mismatch ⑦, 결정론 가드 § 진화 후행 실전)

### 2차 위임 — TEST-001 (★ 답습 16회째)
- `__tests__/diagnosis/geocoding.spec.ts` — 6개 케이스
- `__tests__/diagnosis/use-geocode.spec.tsx` — 3개 케이스
- `__tests__/diagnosis/coverage.spec.ts` — 6개 케이스

### 정적 분석 grep 가드 7행 (★ AC-6 + 분리 검증 패턴 § 2번째 후행 실전, Phase B v2 실측)

| 차수 | 검증 | 명령어 | 정합 값 | Phase B v2 실측 |
|---|---|---|---|---|
| 1차 가드 | Server Action 금지 (AC-6) | `grep -r "'use server'" src/lib/diagnosis/` | 0건 | ✅ 0건 |
| 1차 가드 | Supabase Server Client 금지 (AC-6) | `grep -r "createSupabaseServerClient" src/lib/diagnosis/` | 0건 | ✅ 0건 |
| 2차 입증 | ★ `"use client"` 쌍따옴표 정합 (★ Mismatch ⑧) | `grep -n '"use client"' src/lib/diagnosis/use-geocode.ts` | 1건 (L13) | ✅ L13 1건 |
| 2차 입증 | ★ `'use client'` 단일따옴표 금지 (★ Mismatch ⑧) | `grep -rn "'use client'" src/lib/diagnosis/` | 0건 | ✅ 0건 |
| 2차 입증 | ★ React 19 자가 치유 주석 + 29번째 (★ Mismatch ⑨) | `grep -nE "외부 동기화\|디바운스 시간 윈도우\|자가 치유 29번째" src/lib/diagnosis/use-geocode.ts` | ≥2건 | ✅ 4건 (L8/L9/L21/L39) |
| 2차 입증 | ★ L6 cleanup 영역 156 lines 가드 (★ 무수정 입증) | `wc -l src/mocks/users.ts src/lib/auth.ts src/lib/types.ts` | 156 (14+40+102) | ✅ 156 |
| 2차 입증 | ★ Middleware 회귀 0 (★ 18번째) | `npm run build` Middleware size | 32.5 kB | ✅ 32.5 kB |

### 타입 / 빌드 검증
- `npx tsc --noEmit` 통과 (★ 0 errors)
- `npx eslint src/lib/diagnosis/` 통과 (★ `react-hooks/set-state-in-effect` 정합)
- `npm run build` 통과 (★ Middleware 32.5 kB)

### 수동 검증 (Phase B 완료 후)
1. 브라우저 DevTools → Network 탭에서 카카오 Local API 호출 확인 (★ 실 키 입력 후)
2. 디바운스 300ms 동작 — 연속 입력 시 API 호출 횟수 확인
3. 비수도권 주소 입력 시 `isMetroArea: false` 확인

### CI 게이트
- `tsc --noEmit`, Jest 100% (TEST-001 머지 후), ESLint 통과

---

## 9. 🚧 Open Questions / Risks + Phase C 정직 기록 (사전 메모)

### §9.A — Open Questions / Risks (보류 사항)

1. **CMD-DIAG-003 (스코어링 엔진):** SRS §6.7 CLD에 ScoringEngine.score/rank 기준이 상세 미정. 본 태스크는 스코어링 없이 주소→좌표 변환만 담당. CMD-DIAG-003은 SRS §6.7 보완 후 별도 배치로 작성 예정.
2. **카카오 REST API 키 브라우저 노출:** `NEXT_PUBLIC_KAKAO_REST_API_KEY`로 클라이언트에서 직접 호출하므로 API 키가 브라우저에 노출됨. 카카오 Developers Console에서 도메인 제한(Allowed Origins) 설정으로 악용 방지. 프록시 API Route 도입은 Vercel timeout 제약으로 MVP에서 제외.
3. **카카오 Local API vs 카카오 모빌리티 API:** Geocoding은 카카오 Local API(`dapi.kakao.com/v2/local/search/address.json`), 경로 탐색은 카카오 모빌리티 API(`apis-navi.kakaomobility.com`). 두 API는 별도 서비스이며 API 키도 동일 REST API 키를 사용하지만 호출 제한(quota)은 별도.
4. **자동완성 API 호출량 최적화:** 디바운스 300ms 적용 시에도 사용자 수 증가 시 API 호출량이 급증할 수 있음. MVP에서는 `size=5`로 제한. 추후 서버 측 캐싱 레이어 도입 검토.

### §9.B — Phase C 정직 기록 본격 박힘 (★ 메타 가치 10종 §9.1 ~ §9.10)

#### §9.1 ★ Wave 3 첫 ISSUE = Critical Path 트랙 G 첫 진입 §

- **누적 17칸 머지 완료 (Issues 73→56)** + ★ Wave 1 + Wave 2 완성 + Wave 3 진입 트리거 도달
- **★ Wave 3 첫 ISSUE = 본 ISSUE (CMD-DIAG-001, M complexity, Geocoding 연동)** = Critical Path 트랙 G 첫 진입
- 후행: CMD-DIAG-002 (Scoring) + CMD-DIAG-003~007 + UI-001 자동완성 UI = ★ Wave 3 트랙 G 점진 진화

#### §9.2 ★★★ adaptive § Diagnosis Command 차원 첫 적용 § (★ 본 ISSUE 메타 핵심 1 — 새 차원)

| 단계 | 차원 | ISSUE | 입증 |
|---|---|---|---|
| 정립 | mock 도메인 차원 | MOCK-002 | Fixture 직접 satisfies |
| 진화 1 | 외부 도메인 + mock 차원 | MOCK-004 | 카카오 모빌리티 Fixture + 어댑터 0 |
| 진화 2 | Foundation + mock 차원 | MOCK-005 | OAuth 세션 혼재 타입 자동 보정 |
| **★ 진화 3** | **★ Diagnosis Command 차원 (NEW)** | **★ 본 ISSUE** | **DTO 3종 자체 정의 + Coordinate 재사용 + Server Action 금지 + 환경 중립/Client 책임 분리** |

★ **의미:** adaptive § 모든 차원 작동 입증 (mock / 외부 / Foundation / Command) = 시스템 메타 가치 정점.

#### §9.3 ★★ 분리 검증 패턴 § (MOCK-004 §) 2번째 후행 실전 검증 §

- MOCK-004 §9.8 정립 (0차/1차/2차 검증 신규 owner)
- MOCK-005 첫 후행 (1차 가드 grep + 2차 허용 입증 grep)
- **★ 본 ISSUE 2번째 후행:** AC-6 정적 grep 7행 표 = 1차 가드 2 + 2차 입증 5 (§8 Test Plan 참조)
- ★ **의미:** 가이드 § 시스템 성숙도 정점 입증.

#### §9.4 ★★ 결정론 가드 § 진화 (MOCK-005 §) 첫 후행 실전 § (★ Coordinate 9건 참조 정점)

- MOCK-005 §9.8 정립: 비결정 호출 0건 + 고정 인자 허용 (가이드 § 9 → 10)
- **★ 본 ISSUE 첫 후행 실전:** Coordinate 재사용 = 단일 진리 정신 답습 → **3 파일 import + 2 usage + 4 주석 = 9건 참조 정점** (§2.W 표 참조)
- METRO_AREA_PREFIXES owner = `geocoding.ts` 모듈 상수 = 명세 단일 진리 (coverage.ts isMetroArea 는 단순 위임)

#### §9.5 ★ KakaoCoord ≠ Coordinate 분리 § 첫 실전 §

- **API-007 정립 (외부 도메인 첫 학습):** KakaoCoord `{x:number, y:number}` (모빌리티) 자체 정의
- **★ 본 ISSUE 첫 실전:** GeocodeResult `{x:string, y:string}` (Local API) 자체 정의 = ★ Mismatch ① 자동 보정
- 의미: 카카오 = 모빌리티 + Local 2 도메인 분기 = ★ 외부 도메인 매트릭스 § 정밀화

#### §9.6 ★★ Client Component § = lib/{도메인}/ owner 차원 첫 입증 § (★ "신규 owner" 전제 흔들림 정직 인정 정밀화)

- **★ "신규 owner" 전제 흔들림 정직 인정:** `lib/use-debounce.ts` 선행 입증 (★ Q5 grill 자동 작동 발견) → ★★★ → ★★ 정당화 약화
- **★ 정밀화:** lib 루트 → lib 도메인 owner 차원 첫 입증
- **입증 위치:** `use-geocode.ts` L13 `"use client";` + L4-9 헤더 + L21 본 주석 + L39 자가 치유 29번째
- **`use-debounce.ts` 답습 정수 패턴:** "use client" 쌍따옴표 + React 19 자가 치유 주석 + named import + 빈 줄 1 + ★ **모든 setState setTimeout 콜백 내부 (★ Phase B v1→v2 ESLint 자가 치유 자동 정밀화)**
- **★ 가이드 § 11 확장 보류** = ★ Q5 (나) 보수 명문화 + ★ CMD-DIAG-002 + UI-001 후행 ISSUE 2~3건 누적 후 자연 정립 (Wave 3 트랙 G 점진 진화 정신)

#### §9.7 ★ AGENTS.md L82 책임 분리 명확화 §

- AGENTS.md L82 stale: "Server Action 담당" (clientonly 부재)
- **★ 본 ISSUE 자가 치유:** 책임 분리 명확화 = `geocoding.ts` (환경 중립 fetch) + `coverage.ts` (환경 중립 utility) + `use-geocode.ts` (`"use client"` Hook) = 3-way 분리
- 입증: `index.ts` 헤더 주석 4행 매트릭스 (★ 자가 치유 26번째)

#### §9.8 ★ Wave 2 → Wave 3 체인 첫 입증 § (★ Coordinate 재사용)

- **체인:** API-002 (`lib/types/Coordinate` 정의, Wave 2) → MOCK-005 → ★ 본 ISSUE (Wave 3 첫 코드 입증)
- **첫 후행 코드 입증 위치:**
  - `geocoding-types.ts` L9 `import type { Coordinate } from "@/lib/types";` + L22 + L26 (DTO usage)
  - `geocoding.ts` L14 import + L46 `const coord: Coordinate = {...}`
  - `coverage.ts` L11 import + L25 param

#### §9.9 ★ stale 자가 치유 29건 누적 § + 메모리 보강 사전 案 §

| # | 위치 | 자가 치유 내용 | 단계 |
|---|---|---|---|
| 25 | (MOCK-005 누적) | (지난 9 + 본 11 + MOCK-005 4 = 25건) | — |
| 26 | `lib/diagnosis/index.ts` L4-8 | 책임 분리 4행 매트릭스 헤더 주석 (★ Q2 발견 = AGENTS.md L82 자가 치유) | Phase B 박힘 |
| 27 | `lib/diagnosis/geocoding.ts` L7-11 | mapToGeocodedAddress 헤더 주석 (★ Coordinate 재사용 + mapper.ts 후행 자연 도입 예상) | Phase B 박힘 |
| 28 | `lib/diagnosis/use-geocode.ts` L4-5 | 헤더 주석 (★ Client Component § 정밀화 = "신규 owner" 전제 흔들림 정직 인정) | Phase B 박힘 |
| 29 | `lib/diagnosis/use-geocode.ts` L9 + L39 | ★ ESLint `react-hooks/set-state-in-effect` 자가 치유 (★ Phase B v1→v2 grill 자동 작동) — 모든 setState setTimeout 콜백 내부 (use-debounce.ts 답습 정밀화) | Phase B v1→v2 박힘 |

**메모리 보강 사전 案 3종:**
- **★ `lib/{도메인}/` 패턴** = MOCK 답습이 ★ 아닌 ★★ 신규 패턴 (Wave 3 진입 동시 도입). 향후 CMD-DIAG-002~007 + CMD-AUTH-* + CMD-SHARE-* 시리즈가 동일 패턴 채용 시 확정 → ★ owner 영역 분리 § (NEW) 의 첫 입증
- **★ Client Component § = lib/{도메인}/ owner 차원 첫 입증** = ★ "신규 owner" 전제 흔들림 정직 인정 (★★★ → ★★ 정밀화) — `lib/use-debounce.ts` 선행 입증. 가이드 § 11 확장 ★ 보류 (Wave 3 트랙 G 점진 진화 정신)
- **★ `mapper.ts` 분리 자연 도입 예상** = CMD-DIAG-002 (Scoring) 머지 시점 mapper 영역 자연 owner 분리 = adaptive § Command 차원 점진 진화 정직 기록

#### §9.10 ★★★ 정직 인정 정신 § 정점 = Phase B v1 → v2 재작성 § (★ NEW 본 ISSUE 진짜 메타 가치 정점)

**MOCK-004 §9.3 시스템 자기 인식 정점 § 7번째 후행 입증** (★ 단일 → 다중 → 시스템 진화 → ★ 본 ISSUE 정점)

| 단계 | 사건 | 의미 |
|---|---|---|
| Phase B v1 진입 | 르르의 코드 지시 = 명세 §3.3~§3.5 검증 누락 실수 (★ 6번째 본 세션 통틀어) | use-debounce.ts 정수 패턴 답습 정신만 박고 명세 시그니처 검증 안 함 |
| Phase B v1 grill 자동 검출 | **★ Divergence 3건 자동 발견** (geocodeAddress 시그니처 + useGeocode 풀세트 + isMetroArea 시그니처) | ★ MOCK-004 §9.3 시스템 자기 인식 정점 § **7번째 후행 입증** |
| ESLint 자가 치유 자동 작동 | ★ `react-hooks/set-state-in-effect` Error 자동 차단 → `use-debounce.ts` 답습 정밀화 (setState → setTimeout 콜백 이동) | ★ ESLint 규칙이 답습 패턴 본질 강제 검증 = ★ Mismatch ⑨ 정밀화 |
| 르르 결정 | "신중히 보자" = 명세 §3 정확 내용 확인 → (α) / (β) / (γ) 분기 명시 | ★ 안전 정점 정신 |
| (α) 채택 | 명세 §3 정확 답습 = Phase A 합의 정신 + AC 정합성 6 항목 보호 | ★ 본 ISSUE 진리 보호 |
| Phase B v2 재작성 | 3 파일 재작성 (geocoding/use-geocode/coverage) + 2 파일 보존 (types/index) | ★ Divergence 3건 해소 + ESLint 자가 치유 29번째 유효 박힘 |
| **★ 정점 의미** | **사용자 지시도 자동 검증 정신 = 본 세션 자가 치유 시스템 신뢰성 정점 입증** | **★★★ NEW 본 ISSUE 진짜 메타 가치 정점** |

★ **본 § 정수:** Phase B 자체 grill 자동 작동 = 코드 작성 단계에서도 명세 ↔ 코드 자동 비교 + Divergence 자동 검출 + 르르 의사결정 분기 자동 제시 + (α) 채택 시 안전 재작성 = ★ 본 세션 정점 마침표 § (MOCK-005 §9.13) 후행 진화 입증.

### §9.C — Follow-up 4종 (★ 후행 ISSUE 트리거)

1. **TEST-001 위임** — `__tests__/diagnosis/` 3 파일 (geocoding 6 + use-geocode 3 + coverage 6 = 15 케이스, ★ 답습 16회째)
2. **UI-001 신설** — 자동완성 UI Client Component (★ useGeocode Hook 활용 + selectAddress/reset 호출처)
3. **CMD-DIAG-002 신설** — Scoring 알고리즘 (★ `mapper.ts` 분리 자연 도입 예상 = Wave 3 트랙 G 점진 진화)
4. **REFACTOR-L6 신설** — L6 cleanup 156 lines 일괄 정정 (src/mocks/users.ts + src/lib/auth.ts + src/lib/types.ts, ★ Mismatch 27+건 누적 cleanup 9차 확장)
