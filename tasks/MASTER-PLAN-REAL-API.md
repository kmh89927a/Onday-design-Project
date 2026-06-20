---
name: Master Plan
title: "[MASTER-PLAN-REAL-API] 졸업 전 실 API 전환 마스터 플랜 (3주 목표 / 4주 여유)"
created: 2026-05-29
status: planning
---

# MASTER-PLAN-REAL-API — 졸업 전 실 API 전환 마스터 플랜

> **작성일:** 2026-05-29
> **가용 시간:** 하루 3시간 매일 (주 21시간) × 3주 = **63시간** / 4주 여유 = **84시간**
> **상태:** 계획 단계 (코드 작업 진입 전)
> **본 문서 위치:** `tasks/MASTER-PLAN-REAL-API.md`
> **선행 audit:** AUDIT-PRD-SRS-v1.4 (2026-05-27, LOG §22)
> **답습 정수:** UI-013 #59 + CMD-SINGLE-002 #56 정직 § 진화 — "갭 추가 vs 방식 차이 보존" 구분 정수 + 메모리 vs SSoT 매핑 정직 정렬

---

## §1. 목표

### 1.1. 본 마스터 플랜의 목적

**졸업 데모(2026-06-19 추정) 전에 OnDay 프로토타입을 실 사용 가능 수준으로 전환한다.** 현재 `NEXT_PUBLIC_USE_MOCK=true` 박힘 상태(mock 모드)에서 **단일 토글 + 핫스팟 4건 박힘 분기**를 활용해 실 API/실 DB로 전환.

### 1.2. "실 사용 가능 수준" 정의

- 실 사용자(친구·동기·교수)가 베타 환경(Vercel)에 접속 가능
- 카카오/네이버 실 OAuth 로그인 동작
- 두 주소 입력 → 실 카카오 모빌리티 통근시간 기반 진단 동작
- 공유 링크 = Supabase Postgres 영구 저장 (페이지 새로고침 시 휘발 X)
- 야간 안전 등급 = 정적 JSON 에셋 기반 (수도권 90% 커버리지)
- `/single` 인쇄 정합 (UI-013 + CMD-SINGLE-002 박힘 영역 유지)

### 1.3. 본 플랜의 본질 답습 (UI-013/CMD-SINGLE-002 정수 정점)

- **사전 박힘 정직 인정**: types/mapper/db wrapper/IS_MOCK 분기 = 모두 박힘
- **진짜 갭 좁힘**: stub → 실 구현 + 외부 키 등록 + 회귀 방지
- **명세 역방향 정합**: 본 작업 중 발견된 갭은 명세에 반영
- **자동 머지 X / ISSUE Close X** = 르르 직접 처리 (본 마스터 플랜 전체)

---

## §2. 범위 (포함 vs 연기)

### 2.1. 졸업 전 포함 영역 (Tier 0 + Tier 1 + Tier 2)

| Tier | 영역 | 범위 |
|---|---|---|
| **Tier 0** | 르르 직접 영역 (키 등록) | 카카오 디벨로퍼 + Supabase 프로젝트 + Vercel env |
| **Tier 1** | 코드 작업 (6 묶음) | DB persist + 카카오 모빌리티 + Supabase Auth + 야간 안전 JSON + 회귀 방지 + ISSUE 정합 |
| **Tier 2** | 의존 자동 동작 | 공유 링크 영구 저장 + SavedSearch persist + Deadline 아웃링크 |

### 2.2. 졸업 후 v1.5+ 연기 영역 (정직 인정)

| ID | 영역 | 연기 사유 | 부활 시점 |
|---|---|---|---|
| **REQ-NF-005** | Cron 4시간 갱신 | MVP mock = 갱신할 실 데이터 없음. INFRA-003 Cron 제거 결정 정합 (TASK_LIST §38) | 실 부동산 API 연동 시점 |
| **REQ-NF-013** | 교통 정합 ±10% | MVP mock = 카카오맵 비교 의미 X | 실 카카오 모빌리티 본격 연동 시점 |
| **OS-03** | 지방 커버리지 | 1인 MVP 범위 축소 (수도권 한정 CON-03) | v1.5+ |
| **OS-06** | 비교 뷰 | 1인 MVP 범위 축소 (비교 UI 복잡도 과다) | v1.5+ |
| **OS-08** | 행정동 변경 매핑 | 1인 MVP 범위 축소 (분기 갱신 매핑 테이블 유지 비용) | v1.5+ |
| **REQ-FUNC-026~028** | 비교 뷰/시나리오/행정동 | Out of Scope (PRD §7-2) | v1.5+ |
| **REQ-FUNC-013/014** | 결제 유도 모달 | PRD §7-2 rev.4 결제 도메인 MVP 제외 | Open Beta+ |
| **REQ-FUNC-035~037** | 학교/교통호재/시나리오 | Should/Could 카테고리 (졸업 데모 본질 외) | v1.5+ |
| **부동산 직접 API** | 매물 직접 크롤링 | REQ-FUNC-016 정합 — 네이버 부동산 아웃링크로 대체 | v1.5+ |

### 2.3. 본 플랜에서 의도적으로 제외하는 것

- **#4 INFRA-005 Vercel AI SDK + Gemini** — 졸업 데모 본질 외 (LLM 사용처 0건 박힘). 졸업 후 연기.
- **#72 SEC-002 Rate Limiting** — Best effort 영역 (REQ-NF-022). 베타 트래픽 폭주 X = 우선순위 낮음.
- **#63~71 TEST-001~010** — INFRA-TEST-001 (#135) 선행 후 (졸업 전 1건만 박힘 시도 가능).
- **PRD 결제 유도(#39 미박힘)** — MVP 제외.

---

## §3. Tier 0 — 르르 직접 영역 (외부 키 등록 체크리스트)

> **소요 시간:** 르르 영역 + 외부 처리 대기 (반나절 ~ 며칠).
> **본 마스터 플랜 가용 63시간에 포함 X** (병행 진행).

### 3.1. 카카오 디벨로퍼 등록 + 키 발급

- [ ] [카카오 디벨로퍼](https://developers.kakao.com) 가입 + 애플리케이션 등록 ("OnDay 프로토타입")
- [ ] **JavaScript 키 발급** → `NEXT_PUBLIC_KAKAO_MAP_KEY` (지도 SDK용)
- [ ] **REST API 키 발급** → `NEXT_PUBLIC_KAKAO_REST_API_KEY` (주소 자동완성용)
- [ ] **카카오 모빌리티 API 키 발급** → `KAKAO_MOBILITY_API_KEY` (실 통근시간용)
  - ⚠️ 카카오 모빌리티는 별도 비즈 검토 필요 (1~2주 대기 가능성). **Week 1 시작 시 즉시 신청 박힘**.
- [ ] **Web 도메인 등록** → 카카오 디벨로퍼 콘솔에서 `https://onday-design-project.vercel.app` + `http://localhost:3000` 박힘

### 3.2. 카카오/네이버 OAuth Provider 설정

- [ ] [카카오 로그인 Redirect URI](https://kapi.kakao.com) 등록 → Supabase Auth callback URL 박힘
- [ ] [네이버 개발자센터](https://developers.naver.com) 애플리케이션 등록 + Client ID/Secret 발급
- [ ] **네이버 로그인 Redirect URI** → Supabase Auth callback 박힘

### 3.3. Supabase 프로젝트 생성

- [ ] [Supabase 대시보드](https://supabase.com/dashboard) 프로젝트 생성 ("onday-mvp")
- [ ] **DATABASE_URL** → `postgresql://...supabase.co:5432/postgres` 박힘
- [ ] **NEXT_PUBLIC_SUPABASE_URL** + **NEXT_PUBLIC_SUPABASE_ANON_KEY** 발급
- [ ] **SUPABASE_SERVICE_ROLE_KEY** 발급 (RLS 우회용, 신중 영역)
- [ ] **Auth Provider 등록** = 대시보드 → Authentication → Providers → Kakao 활성 + Naver 활성
  - Kakao: Client ID = 카카오 REST API 키, Client Secret = 카카오 Admin 키
  - Naver: Client ID/Secret = 네이버 개발자센터에서 발급

### 3.4. Vercel 환경변수 등록

- [ ] Vercel 대시보드 → Project → Settings → Environment Variables
- [ ] 다음 8개 박힘:
  - `NEXT_PUBLIC_KAKAO_MAP_KEY`
  - `NEXT_PUBLIC_KAKAO_REST_API_KEY`
  - `KAKAO_MOBILITY_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL` (Supabase Postgres connection string)
  - `NEXT_PUBLIC_USE_MOCK=false` (★ 전환 트리거)

### 3.5. dev 환경 `.env.local` 갱신

- [ ] `onday-app/.env.local`에 Vercel과 동일한 8개 박힘
- [ ] `npx prisma migrate dev` 실행 → Postgres 마이그레이션 생성

---

## §4. Tier 1 — 코드 작업 (의존성 순서 + 작업량 추정)

### 4.1. 작업 묶음 6개 (의존성 순서)

| # | 작업 묶음 | 의존 | 추정 시간 | 사전 박힘 % | 진짜 갭 |
|---|---|---|---|---|---|
| **W1-1** | Supabase DB 어댑터 교체 | Tier 0 (DATABASE_URL) | **M (8~12h)** | ~85% (db.ts wrapper 100% 박힘) | schema provider 변경 + Prisma adapter + 마이그레이션 + seed |
| **W1-2** | Supabase Auth 활성 | Tier 0 (Auth Provider) | **S (3~5h)** | ~80% (IS_MOCK 분기 + signInWithOAuth 박힘) | callback 라우트 검증 + 세션 유지 검증 |
| **W2-1** | 카카오 모빌리티 client.ts 실 구현 | Tier 0 (MOBILITY_API_KEY) | **M (8~12h)** | ~70% (types + mapper 박힘, client stub) | fetch + timeout + retry + Error 변환 |
| **W2-2** | ScoringEngine 실 통근시간 통합 | W2-1 | **M (5~8h)** | ~60% (mock-calculator Haversine 박힘) | mock-calculator → 실 통근시간 활용 + api/diagnosis/route.ts Production 영역 박힘 |
| **W3-1** | 야간 안전 정적 JSON + safety-grade.ts | (독립 — 외부 키 불필요) | **M (5~8h)** | ~40% (sample JSON 박힘, safety-stats deterministic) | 경찰청 실 데이터 수집 + safety-grade.ts + coverage-check.ts |
| **W3-2** | 회귀 방지 + ISSUE 정합 정리 | W1~W2~W3 완료 | **S (3~5h)** | — | dev/Vercel 양방향 검증 + 30+ ISSUE Close 정합 |

**총 추정: 32~50시간** (가용 63시간 / 84시간 대비 충분 영역).

### 4.2. W1-1 Supabase DB 어댑터 교체 — 정밀 분석

**사전 박힘 (~85%):**
- `src/lib/db.ts` = Prisma 호환 wrapper (`prisma.diagnosis.create/findUnique`, `prisma.shareLink.create/findUnique/update`, `prisma.savedSearch.upsert/findUnique`) 박힘
- 호출자(api/diagnosis/route.ts, api/share/* 등) = `prisma.<model>.<method>` 동일 API 박힘 → **호출자 변경 0**
- `prisma/schema.prisma` = User/Diagnosis/ShareLink/SavedSearch 4모델 박힘 (SQLite provider)
- `prisma/seed.ts` = minimal 박힘 (mock-user-001)
- db.ts 주석에 박힘: "Step 13 will swap this out for Supabase Postgres (driver adapter pattern); routes use the same prisma.<model>.<method> API so no caller changes are needed at that point"

**진짜 갭:**
1. `prisma/schema.prisma` provider `sqlite` → `postgresql` 박힘
2. `filters` / `candidates` String → `Json` 타입 변경 (PostgreSQL JSONB 활용)
3. `src/lib/db.ts` in-memory wrapper → `PrismaClient + @prisma/adapter-pg` 박힘
4. `npx prisma migrate dev` → 초기 마이그레이션 생성
5. `prisma/seed.ts` PostgreSQL 호환 갱신 (`PrismaBetterSqlite3` → `PrismaPg`)
6. `package.json` deps: `@prisma/adapter-pg` 추가 + `@prisma/adapter-better-sqlite3` 제거
7. `tsconfig` 갱신 (필요 시 seed.ts 포함)
8. Vercel 빌드 시 `prisma generate` 실행 정합 (postinstall script 박힘 가능)

### 4.3. W1-2 Supabase Auth 활성 — 정밀 분석

**사전 박힘 (~80%):**
- `@supabase/ssr ^0.10.3` + `@supabase/supabase-js ^2.105.4` deps 박힘
- `src/lib/auth.ts` = IS_MOCK 분기 박힘 (`!IS_MOCK` 영역 박힘 추정)
- `src/components/auth/login-form.tsx` = IS_MOCK 분기 박힘 ("실 OAuth: Step 12 Postgres 마이그 후 supabase.auth.signInWithOAuth 활성" 주석 박힘)
- `src/lib/types/auth.ts` = Session 타입 import 박힘
- `src/app/auth/` = callback 라우트 박힘 (추정)

**진짜 갭:**
1. `NEXT_PUBLIC_USE_MOCK=false` 박힌 후 실 supabase.auth.signInWithOAuth 호출 검증
2. callback 라우트 (`/auth/callback`) = `@supabase/ssr` 세션 교환 박힘 확인
3. `middleware.ts` 박힘 (세션 보호 라우트 영역) — 추정 미박힘
4. Supabase Auth httpOnly cookie 세션 검증 (REQ-NF-018)
5. 로그인/로그아웃 dev 환경 수동 검증
6. Vercel 환경 OAuth redirect URL 정합 (kakao/naver 등록 URL 박힘 영역)

### 4.4. W2-1 카카오 모빌리티 client.ts 실 구현 — 정밀 분석

**사전 박힘 (~70%):**
- `src/lib/external/kakao-transport/types.ts` = **100% 박힘** (DTO 8종 + IKakaoTransportClient + Config + DEFAULT_KAKAO_CONFIG)
- `src/lib/external/kakao-transport/mapper.ts` = **100% 박힘** (`mapKakaoResponseToCommuteInfo`: Kakao Response → CommuteInfoDTO)
- `src/lib/external/kakao-transport/client.ts` = **스텁만 박힘** (getRoute + getCommuteTime = throw Error)
- `src/lib/external/kakao-transport/index.ts` = barrel export 박힘
- `DEFAULT_KAKAO_CONFIG` = timeoutMs 5000, maxRetries 1, retryDelayMs 500 (REQ-FUNC-007 정합)

**진짜 갭 (client.ts 실 구현):**
1. `getRoute(request)` 박힘:
   - `fetch(baseUrl + '/v1/directions', { headers: { Authorization: 'KakaoAK ${apiKey}' }, body: JSON.stringify(request) })`
   - `AbortController` 타임아웃 박힘 (config.timeoutMs)
   - 응답 status code 200 검증
   - retry 로직 박힘 (config.maxRetries 박힘, config.retryDelayMs 박힘)
   - 에러 시 `KakaoTransportError` 변환 박힘
2. `getCommuteTime(origin, destination, departureTime?)` 박힘:
   - `getRoute` 호출
   - `mapKakaoResponseToCommuteInfo` 활용 → CommuteInfo 반환
3. 카카오 모빌리티 API 응답 spec 검증 (실 호출 후 mapper 정합 확인)
4. 에러 케이스 검증 (네트워크 실패, 타임아웃, 잘못된 좌표 등)

### 4.5. W2-2 ScoringEngine 실 통근시간 통합 — 정밀 분석

**사전 박힘 (~60%):**
- `src/features/diagnosis/mock-calculator.ts` = Haversine 기반 통근시간 추정 + 안전등급/편의시설/카페 가산 점수 박힘
- `src/lib/diagnosis/intersection.ts` = Promise.allSettled 박힘 (REQ-FUNC-003 정합, Vercel 10s 우회)
- `src/app/api/diagnosis/route.ts:57` = `// Production: TODO — Kakao Mobility API + AI scoring` + `"Production mode not implemented" 501` 박힘
- `mock-user-001` 박힘 (Production 영역도 동일 userId 활용 가능)

**진짜 갭:**
1. `api/diagnosis/route.ts` Production 영역 박힘:
   - IS_MOCK=false 시 = `KakaoTransportClient.getCommuteTime` 활용
   - candidates 후보 동네 N개 × `Promise.allSettled([getCommuteTime(addressA, candidate), getCommuteTime(addressB, candidate)])`
   - 부분 실패 허용 (mock-calculator Promise.allSettled 정수 답습)
2. ScoringEngine 실 통근시간 활용 박힘:
   - mock-calculator의 `scoreCandidate` 함수 → 실 통근시간 인자로 활용
   - 안전등급/편의시설/카페 가산은 그대로 활용 (mock 데이터)
3. Vercel 10s timeout 검증 (Client Component Promise.all 패턴 정합)
4. 실패 시 fallback 박힘 (REQ-FUNC-007 — 5s 타임아웃 + 1회 재시도 + "잠시 후 다시 시도해주세요" 토스트)

### 4.6. W3-1 야간 안전 정적 JSON + safety-grade.ts — 정밀 분석

**사전 박힘 (~40%):**
- `public/data/crime-stats.json` = **986B sample 박힘** (작은 데이터)
- `public/data/facilities.json` = 1.2KB sample 박힘
- `src/features/single/safety-stats.ts` = deterministic 매핑만 박힘 (A→0.84, B→1.32, C→2.18, D→3.04)
- `src/mocks/neighborhoods.ts` = safetyGrade 필드 30+ 항목 박힘
- UI-013 박힘 = SafetyGradeBadge + SafetyBar + 인쇄 흑백 border

**진짜 갭:**
1. 경찰청 공공데이터 수집 → 수도권 90% 커버리지 박힘 (1,234개 행정동 추정)
   - **공공데이터포털 또는 경찰청 데이터 직접 다운로드** = 르르 영역 (CSV → JSON 변환)
   - 자동/스크립트 X = 1회성 박힘 정합
2. `public/data/crime-stats.json` 갱신 → 수도권 1,234개 행정동 박힘
3. `src/lib/single-mode/safety-grade.ts` 신설 = `getNightSafetyGrade(coord)` 박힘:
   - `getNearbyCrimeStats(coord, 1000)` = 반경 1km 행정동 추출
   - 평균 nightIncidentRate 계산 → A/B/C/D 등급 매핑 (THRESHOLDS A:0.5/B:1.0/C:2.0)
4. `src/lib/single-mode/coverage-check.ts` 신설 = 90% 커버리지 CI 검증 박힘
5. `scripts/check-coverage.ts` 신설 = `npm run check:coverage` 박힘
6. `src/features/single/safety-stats.ts` → `safety-grade.ts` 호출로 갱신 (deterministic 매핑 폐기)
7. `src/app/single/[id]/single-result-view.tsx` fallbackGrade 영역 = nearby=0 → D + "데이터 없음" 표기 (UI-013 §28 AC-6 정직 §)

### 4.7. W3-2 회귀 방지 + ISSUE 정합 정리

**회귀 검증 영역:**
- dev 환경 = mock 모드 (USE_MOCK=true) 정상 동작 보존 확인
- Vercel 환경 = 실 모드 (USE_MOCK=false) 정상 동작 확인
- 양방향 토글 = 어느 한 쪽 깨지면 안 됨

**ISSUE Close 정합 영역 (졸업 전 정리):**
- 현재 OPEN 50건 중 실제 박힘 = 30+ 건 추정 (메모리 박힘 vs ISSUE 갭)
- 본 마스터 플랜 완료 시 추가 Close = #2, #21~24, #27~33 등 약 20건

---

## §5. 3주 주차별 배치 (하루 3시간 기준)

### 5.1. Week 0 (병행 — 본 플랜 0시간 차지 X)

**르르 영역 (Tier 0):**
- 카카오 디벨로퍼 등록 + 키 3개 발급 (특히 모빌리티 비즈 검토 즉시 신청)
- 네이버 개발자센터 등록 + 키 발급
- Supabase 프로젝트 생성 + Auth Provider 설정
- Vercel env vars 8개 박힘

**대기 시간 활용:**
- 경찰청 공공데이터 다운로드 + CSV → JSON 변환 (W3-1 선행 박힘)

### 5.2. Week 1 — DB + Auth 영역 (21시간)

| 일 | 작업 | 시간 |
|---|---|---|
| Mon | **W1-1 시작** — schema provider 변경 + `@prisma/adapter-pg` 설치 + Prisma migrate dev | 3h |
| Tue | **W1-1 계속** — db.ts 어댑터 교체 (PrismaClient + adapter-pg) | 3h |
| Wed | **W1-1 완료** — seed.ts PostgreSQL 갱신 + dev 환경 검증 + 회귀 검증 (mock 모드 보존) | 3h |
| Thu | **W1-2 시작** — `@supabase/ssr` 세션 셋업 + callback 라우트 검증 | 3h |
| Fri | **W1-2 계속** — IS_MOCK=false 박힘 + 실 OAuth 검증 (kakao/naver) | 3h |
| Sat | **W1-2 완료** — middleware.ts 세션 보호 + dev/Vercel 검증 | 3h |
| Sun | **Week 1 회고 + 회귀 검증** | 3h |

**Week 1 산출물:**
- Supabase Postgres 실 DB 박힘 (in-memory → 영구 저장)
- Supabase Auth 실 OAuth 박힘 (mock → 실 로그인)
- 공유 링크 영구 저장 (Tier 2 자동 동작 — 새로고침해도 유지)
- SavedSearch persist (Tier 2 자동 동작)

### 5.3. Week 2 — 카카오 모빌리티 영역 (21시간)

| 일 | 작업 | 시간 |
|---|---|---|
| Mon | **W2-1 시작** — KakaoTransportClient.getRoute fetch + Authorization header + 응답 검증 | 3h |
| Tue | **W2-1 계속** — AbortController 타임아웃 + retry 로직 박힘 | 3h |
| Wed | **W2-1 계속** — KakaoTransportError 변환 + getCommuteTime mapper 통합 | 3h |
| Thu | **W2-1 완료** — 실 카카오 API 호출 검증 + 에러 케이스 검증 | 3h |
| Fri | **W2-2 시작** — api/diagnosis/route.ts Production 영역 박힘 (IS_MOCK=false) | 3h |
| Sat | **W2-2 계속** — ScoringEngine 실 통근시간 통합 + Promise.allSettled 패턴 답습 | 3h |
| Sun | **W2-2 완료** — Vercel 10s timeout 검증 + REQ-FUNC-007 fallback 토스트 | 3h |

**Week 2 산출물:**
- 카카오 모빌리티 실 API 호출 박힘 (실 통근시간 기반 진단)
- ScoringEngine 실 데이터 박힘 (mock + 실 통근시간 하이브리드)
- /diagnosis 결과 페이지 = 실 후보 동네 + 실 통근시간 박힘

### 5.4. Week 3 — 야간 안전 + 통합 검증 (21시간)

| 일 | 작업 | 시간 |
|---|---|---|
| Mon | **W3-1 시작** — public/data/crime-stats.json 수도권 1,234개 박힘 (Week 0 준비분 활용) | 3h |
| Tue | **W3-1 계속** — lib/single-mode/safety-grade.ts 신설 (nearby 검색 + 등급 매핑) | 3h |
| Wed | **W3-1 완료** — coverage-check.ts + scripts/check-coverage.ts + safety-stats.ts 갱신 | 3h |
| Thu | **W3-2 시작** — ISSUE Close 정합 정리 (메모리 vs GitHub 매핑 20+ 건) | 3h |
| Fri | **W3-2 계속** — dev/Vercel 양방향 회귀 검증 + 베타 시나리오 박힘 | 3h |
| Sat | **통합 검증** — 졸업 데모 시나리오 end-to-end 박힘 (§8 정합) | 3h |
| Sun | **Week 3 회고 + 명세 갱신** (SRS/PRD/tasks 정합 정리) | 3h |

**Week 3 산출물:**
- 야간 안전 등급 = 실 경찰청 데이터 기반 박힘 (수도권 90%)
- ISSUE 정합 정리 (30+ 건 Close)
- 베타 데모 시나리오 박힘 (실 사용 가능 수준)

### 5.5. Week 4 — 여유 버퍼 + 발표 준비 (21시간)

| 일 | 작업 | 시간 |
|---|---|---|
| Mon~Tue | Week 1~3 미진행 영역 + 회귀 대응 | 6h |
| Wed | Lighthouse 점수 보강 (PERF-OPTIMIZE-IMAGES + 번들) | 3h |
| Thu | Sentry 알림 정합 + Mixpanel 이벤트 검증 | 3h |
| Fri | 발표 데모 시나리오 박힘 (5분 시연 영역) | 3h |
| Sat | 졸업 발표 PT + 데모 리허설 | 3h |
| Sun | 최종 점검 + 버퍼 | 3h |

**Week 4 산출물:**
- 베타 환경 안정 박힘 (Lighthouse 90+ / Sentry 알림 정합)
- 졸업 발표 자료 + 데모 박힘

---

## §6. 회귀 방지 전략

### 6.1. 단일 토글 박힘 위치 명시

`NEXT_PUBLIC_USE_MOCK` 분기 4건 (전부 박힘):
1. `src/app/api/diagnosis/route.ts:6,24` — IS_MOCK=true → mock-calculator / false → 501
2. `src/features/diagnosis/use-address-suggest.ts:26,76,83,88` — USE_MOCK=true → mock 주소 / false → 실 카카오 REST API
3. `src/components/auth/login-form.tsx:17,32` — IS_MOCK=true → setUser 즉시 / false → supabase.auth.signInWithOAuth
4. `src/lib/auth.ts:4,30` — IS_MOCK 분기 박힘

### 6.2. 회귀 검증 시나리오 (각 작업 후 박힘)

| 시나리오 | 박힘 영역 |
|---|---|
| **dev 모드 (USE_MOCK=true)** | 모든 mock 동작 보존 — 회귀 0 |
| **Vercel preview (USE_MOCK=false)** | 실 API 동작 박힘 |
| **dev 모드에서 부분 실 키 박힘** | 예: KAKAO_MAP_KEY만 박힘 / 다른 키 미박힘 → 지도만 실 SDK, 나머지 mock 동작 정합 |

### 6.3. 회귀 위험 핫스팟

1. **map-canvas.tsx fallback 분기 깨짐 위험** — UI-003 답습 = appKey 박힘 시 SDK / 미박힘 시 placeholder. 분기 절대 깨면 안 됨.
2. **db.ts 인터페이스 정합 위험** — Prisma wrapper와 실 PrismaClient API 차이 (특히 `include`, `where`, `data` 시그니처). 호출자 0 변경 원칙 사수.
3. **Supabase callback 라우트 누락 위험** — `/auth/callback` 라우트 미박힘 시 OAuth 인증 실패. middleware.ts 정합 필수.
4. **카카오 모빌리티 API 응답 형식 변경 위험** — mapper.ts에서 처리. 실 호출 후 mapper 정합 검증.
5. **Vercel 10s timeout 위험** — Server Action X / Client Component Promise.all 박힘 정합 검증 (REQ-FUNC-003).

### 6.4. 회귀 검증 도구

- `npm run lint` — 0 errors / 10 warnings baseline 유지
- `npx tsc --noEmit` — pass 유지
- `npm run build` — `/single/[id]` 9.36 kB 등 사이즈 회귀 0
- **dev 수동 검증** — 각 페이지 정상 동작 박힘
- **Vercel preview 검증** — `feat/*` 브랜치 push 시 자동 preview 박힘

---

## §7. ISSUE 매핑 (작업 ↔ GitHub ISSUE)

### 7.1. 졸업 전 Close 대상 (Tier 1 완료 시)

| 작업 | ISSUE | 영역 |
|---|---|---|
| **W1-1 Supabase DB** | #2 INFRA-002 | Supabase DB 프로비저닝 |
| **W1-1 Supabase DB** | #28 CMD-DIAG-004 | 진단 결과 저장 (DB persist) |
| **W1-1 Supabase DB** | #32 QRY-DIAG-001 | 진단 결과 조회 (DB) |
| **W1-1 Supabase DB** | #39 CMD-SHARE-001 | 공유 링크 생성 (실 DB) |
| **W1-1 Supabase DB** | #40 QRY-SHARE-001 | 공유 리포트 SSR |
| **W1-1 Supabase DB** | #41 CMD-SHARE-002 | viewCount 증가 |
| **W1-1 Supabase DB** | #42 CMD-SHARE-003 | 만료 링크 안내 |
| **W1-1 Supabase DB** | #43 CMD-SHARE-004 | 비밀번호 검증 (bcrypt) |
| **W1-1 Supabase DB** | #60 CMD-SAVE-001 | 입력값 자동 저장 (best effort) |
| **W1-1 Supabase DB** | #61 QRY-SAVE-001 | 저장된 조건 불러오기 |
| **W1-2 Supabase Auth** | #21 CMD-AUTH-001 | 카카오 OAuth Provider |
| **W1-2 Supabase Auth** | #22 CMD-AUTH-002 | 네이버 OAuth Provider |
| **W1-2 Supabase Auth** | #23 CMD-AUTH-003 | @supabase/ssr 세션 |
| **W1-2 Supabase Auth** | #24 CMD-AUTH-004 | 게스트 임시 체험 |
| **W2-1 카카오 모빌리티** | #30 CMD-DIAG-006 | 교통 API 타임아웃 핸들링 |
| **W2-1 카카오 모빌리티** | #33 QRY-DIAG-002 | 출퇴근 시간 조회 |
| **W2-2 ScoringEngine** | #27 CMD-DIAG-003 | ScoringEngine |
| **W2-2 ScoringEngine** | #29 CMD-DIAG-005 | 조건 필터 실시간 적용 |
| **W2-2 ScoringEngine** | #31 CMD-DIAG-007 | 수도권 커버리지 검증 |
| **W3-1 야간 안전** | #57 QRY-SINGLE-001 | 야간 안전 등급 (A~D) |
| **W3-1 야간 안전** | #55 CMD-SINGLE-001 | 싱글 모드 진단 |
| **W3-2 ISSUE 정합** | #34 UI-001 | 소셜 로그인 페이지 (PR로 박힘) |
| **W3-2 ISSUE 정합** | #36 UI-003 | 지도 시각화 (PR #104 박힘) |
| **W3-2 ISSUE 정합** | #37 UI-004 | 후보 동네 상세 패널 (박힘) |
| **W3-2 ISSUE 정합** | #38 UI-005 | 조건 필터 UI (박힘) |
| **W3-2 ISSUE 정합** | #44 UI-006 | 공유 링크 생성 버튼 (박힘) |
| **W3-2 ISSUE 정합** | #46 UI-008 | 회원가입 유도 모달 (박힘) |
| **W3-2 ISSUE 정합** | #47~51 Deadline | 데드라인 트랙 5건 (박힘 — 아웃링크) |
| **W3-2 ISSUE 정합** | #53~54 Deadline UI | UI-010/011 (박힘) |
| **W3-2 ISSUE 정합** | #58 UI-012 | 싱글 모드 진단 화면 (박힘) |
| **W3-2 ISSUE 정합** | #62 UI-014 | 이전 조건 불러오기 UI (박힘) |
| **W3-2 ISSUE 정합** | #3 INFRA-004 | Tailwind + shadcn 설정 (박힘) |
| **W3-2 ISSUE 정합** | #114 BEST-BADGE 정정 | bug fix (박힘) |

**Close 대상 ≈ 30+ 건** (졸업 전 완료 영역).

### 7.2. 졸업 후 연기 (OPEN 유지)

| ISSUE | 사유 |
|---|---|
| **#4 INFRA-005** Vercel AI SDK + Gemini | 졸업 데모 본질 외 (LLM 사용처 0건) |
| **#63~71 TEST-001~010** | INFRA-TEST-001 (#135) 선행 후 |
| **#72 SEC-002** Rate Limiting | Best effort (REQ-NF-022) |
| **#114 BEST-BADGE** | 박힘 — Close 가능 (Week 3 정합) |
| **#135 INFRA-TEST-001** | 졸업 후 본격 spec 박힘 시 활용 |

---

## §8. 검증 기준 (졸업 데모 시나리오)

### 8.1. End-to-End 시나리오 (5분 데모)

1. **랜딩 → 로그인 (실 OAuth)**
   - `https://onday-design-project.vercel.app` 접속
   - "카카오로 1초 만에 시작" → 실 카카오 OAuth 동작 → Supabase Auth httpOnly cookie 박힘
   - 데모용 별도 계정 박힘 (개인 카카오 노출 회피)

2. **진단 입력 (실 주소 자동완성)**
   - 두 직장 주소 입력 (예: "강남역", "여의도")
   - 실 카카오 REST API 자동완성 동작 박힘
   - 모드 = 커플 / 데드라인 선택

3. **진단 결과 (실 통근시간)**
   - "진단 시작" 클릭
   - Client Component Promise.all = 실 카카오 모빌리티 호출 박힘
   - 3개 이상 후보 동네 = 실 통근시간 기반 점수 박힘
   - 지도 = 실 카카오 Maps SDK 마커 박힘 (UI-003 정합)

4. **공유 링크 (실 DB persist)**
   - "공유 링크 생성" → UUID v4 박힘
   - 다른 브라우저(시크릿 모드)에서 링크 접속 → SSR 박힘
   - 무료 미리보기 1곳 박힘 + 출처 배지 박힘

5. **싱글 모드 (실 안전 데이터)**
   - 싱글 모드 진입 → 야간 안전 등급 = 실 경찰청 데이터 기반 박힘
   - SafetyBar 색 보존 + SafetyGradeBadge 흑백 (UI-013 + CMD-SINGLE-002 박힘)
   - "리포트 저장" → 인쇄 다이얼로그 ≤1초 박힘 (REQ-NF-010)

### 8.2. 검증 체크리스트

| 항목 | 박힘 |
|---|---|
| ✅ 실 카카오 OAuth 로그인 | W1-2 |
| ✅ 실 카카오 REST API 자동완성 | Tier 0 + 분기 박힘 |
| ✅ 실 카카오 Maps SDK 마커 | Tier 0 (UI-003 박힘) |
| ✅ 실 카카오 모빌리티 통근시간 | W2-1 + W2-2 |
| ✅ 실 Supabase Postgres DB persist | W1-1 |
| ✅ 실 야간 안전 데이터 | W3-1 |
| ✅ Vercel 10s timeout 회피 | W2-2 |
| ✅ 인쇄 정합 (UI-013 + CMD-SINGLE-002 박힘) | 사전 박힘 |
| ✅ Sentry 에러 추적 | 사전 박힘 (#73 MON-001) |
| ✅ Mixpanel 진단 시간 추적 | 사전 박힘 (#127 MON-003) |
| ✅ Lighthouse 90+ (Performance) | Week 4 보강 |

### 8.3. 정상 동작 정의 (각 작업 후)

| 작업 | 정상 동작 |
|---|---|
| W1-1 완료 | dev/Vercel = SQLite/Postgres 양방향 동작 (USE_MOCK 토글) |
| W1-2 완료 | 실 카카오/네이버 로그인 → httpOnly cookie 세션 유지 |
| W2-1 완료 | 실 좌표 → 실 통근시간 박힘 (5초 이내) |
| W2-2 완료 | 실 진단 = 3개 이상 후보 동네 + 실 점수 박힘 |
| W3-1 완료 | 수도권 좌표 → 실 등급 박힘 / 비수도권 → "데이터 없음" |
| W3-2 완료 | OPEN ISSUE 50건 → 20건 이하 박힘 (30+ Close) |

---

## §9. 정직 평가 (3주 가능 여부)

### 9.1. 가용 시간 vs 추정 작업량

- **가용 시간 = 63시간** (3주 × 21시간/주)
- **추정 작업량 = 32~50시간** (6 묶음 정밀 분석)
- **여유 = 13~31시간** (Week 4 84시간 기준 = 34~52시간 여유)

### 9.2. 빠듯 영역 (위험 묶음)

| 묶음 | 위험 사유 |
|---|---|
| **W1-1 Supabase DB** | Prisma adapter 패턴 + Postgres 마이그레이션 = 첫 경험 시 시간 분산 위험 |
| **W2-1 카카오 모빌리티 client** | 실 API 응답 형식 미검증 영역 + retry/timeout 정합 = 가장 큰 단일 작업 |
| **W3-1 야간 안전 정적 JSON** | **경찰청 데이터 수집/변환 = 르르 영역 (Week 0 선행 필수)** |

### 9.3. 여유 영역

- **W1-2 Supabase Auth** = IS_MOCK 분기 박힘 + supabase 메서드 박힘 = 검증 위주
- **W2-2 ScoringEngine** = mock-calculator 박힘 + W2-1 결과 활용 = 통합 위주
- **W3-2 회귀/ISSUE 정합** = 검증 + Close 작업 = 시간 압축 가능

### 9.4. Week 4 미루기 후보 (3주 빠듯 시)

| 후보 | 사유 |
|---|---|
| **W3-1 일부** (커버리지 90% 미달 시 50%로 박힘) | 졸업 데모는 50% 박힘으로도 박힘 (수도권 일부 동) |
| **W3-2 ISSUE Close 정합 전체** | 30+ 건 → 20건만 박힘 (가장 명확한 ISSUE 우선) |
| **Sentry/Mixpanel 정합 검증** | Week 4 발표 준비 시 박힘 |

### 9.5. 본 플랜의 정직 평가

- **3주 가능 영역 ✅** — 추정 50시간 < 가용 63시간 (~20% 여유)
- **4주 안전 영역 ✅✅** — 추정 50시간 < 가용 84시간 (~40% 여유)
- **위험 영역**: W2-1 카카오 모빌리티 client (10시간+ 단일 묶음) + W3-1 데이터 수집 (Week 0 선행 필수)
- **사전 박힘 정수 정점 답습** (UI-013 / CMD-SINGLE-002 진화):
  - 평균 사전 박힘 % = (85+80+70+60+40)/5 = **~67%**
  - 진짜 갭 = stub → 실 구현 + 외부 키 + 데이터 수집
  - "갭 추가 vs 방식 차이 보존" 구분 정수 답습

### 9.6. 본 플랜 진행 결정 트리

1. **Week 0 (병행) 완료 여부** = Tier 0 키 등록 + 모빌리티 비즈 검토 신청 박힘?
2. **Week 1 완료 시 점검** = Supabase 양방향 동작 박힘? → Week 2 진입
3. **Week 2 완료 시 점검** = 실 통근시간 박힘? → Week 3 진입
4. **Week 3 완료 시 점검** = 실 사용 가능 수준 박힘? → Week 4 발표 준비 / 미달 시 Week 4 보강

---

## §10. 본 플랜 운영 원칙

### 10.1. UI-013 / CMD-SINGLE-002 답습 정수 사수

- **자동 머지 X / ISSUE Close X** = 르르 직접 처리
- **사전 박힘 정직 인정** + **명세 역방향 정합 갱신**
- **"갭 추가 vs 방식 차이 보존" 구분 정수** = 본 플랜 전체 적용
- **각 작업 묶음 = 별도 브랜치 + Draft PR** (UI-013 PR #136 + CMD-SINGLE-002 PR #137 답습)
- **각 작업 ISSUE_REGISTER_LOG § 박힘** (정직 § 누적)

### 10.2. 본 플랜의 본질

- **본 마스터 플랜 자체 = 코드 X = 계획 박힘**
- **각 작업 묶음 = 실제 코드 작업 = 별도 ISSUE 본질 박힘**
- **본 플랜 = 졸업 전 작업 묶음의 SSoT** (작업 순서 + 의존성 + 검증 기준)
- **본 플랜 갱신 = 작업 진행 중 실제 경험 반영 정수**

### 10.3. 본 플랜 vs 기존 명세

- **본 플랜 = 실행 계획 (작업 순서 + 시간 분배)**
- **명세 (tasks/CMD-DIAG-006.md 등) = 작업 사양 (AC + GWT)**
- **SRS v1.7 = 요구사항 (REQ-FUNC + REQ-NF)**
- 본 플랜이 SRS/명세보다 작업 흐름·시간 분배 영역에 우선

---

## §11. 본 플랜 후속 작업

본 플랜 승인 시 (르르 직접):

1. **Week 0 시작 (Tier 0 르르 영역)**:
   - 카카오 디벨로퍼 등록 + 키 3개 발급 신청
   - Supabase 프로젝트 생성
   - Vercel env vars 박힘
2. **Week 1 시작 시점** = 새 브랜치 `feat/REAL-API-W1-SUPABASE-DB` 분기 (UI-013 답습)
3. **각 작업 묶음 완료 시 Draft PR + 르르 직접 머지** (자동 머지 X)
4. **본 플랜 자체 = 별도 브랜치 `docs/MASTER-PLAN-REAL-API`** → Draft PR → 르르 직접 머지

---

_본 마스터 플랜 = 졸업 전 실 API 전환의 SSoT. 코드 X = 계획 박힘. 작업 진행 중 갱신 정수._
_답습 정수: UI-013 #59 + CMD-SINGLE-002 #56 = "갭 추가 vs 방식 차이 보존" 구분 정수 + 메모리 vs SSoT 매핑 정직 정렬._
_자동 머지 X / ISSUE Close X = 르르 직접 처리._
