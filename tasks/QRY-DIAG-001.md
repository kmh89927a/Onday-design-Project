---
name: Feature Task
title: "[Feature] QRY-DIAG-001: 진단 결과 조회 — GET /api/diagnosis/[id] Route Handler"
labels: ['feature', 'priority:L', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [QRY-DIAG-001] 진단 결과 조회 — GET /api/diagnosis/[id] Route Handler, p95 ≤ 1,500ms, 권한 검증
- **목적 (Why):**
  - **비즈니스:** 저장된 진단 결과를 API로 조회하여, 프론트엔드 재렌더링·공유 링크 리포트·이전 결과 확인 기능을 지원한다.
  - **사용자 가치:** 진단 완료 후 언제든 이전 결과를 재조회하고, 공유 링크를 통해 배우자에게 전달할 수 있다.
- **범위 (What):**
  - ✅ 만드는 것: GET /api/diagnosis/[id] Route Handler, 권한 검증 (userId 일치 확인), Prisma include 단일 쿼리, mapDiagnosisToDTO 응답 매핑, 에러 핸들링 (404, 403, 401)
  - ❌ 만들지 않는 것: 진단 생성(CMD-DIAG-004), 공유 리포트 조회(QRY-SHARE-001), 결제 관련 코드
- **복잡도:** L
- **Wave:** 3 (Diagnosis 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **§6.1 API-02**: "GET /api/diagnosis/[id] — 진단 결과 조회. Route Handler. Supabase Session. p95 ≤ 1,500ms"
- **REQ-FUNC-003** (§4.1.1): "시스템은 두 직장 주소를 기반으로 교집합 후보 동네를 3곳 이상 산출하고, 지도 위에 시각화해야 한다."
- **REQ-FUNC-004** (§4.1.1): "시스템은 각 후보 동네를 탭했을 때 양쪽 직장까지의 예상 출퇴근 시간(대중교통·자차)을 표시해야 한다."
- **REQ-FUNC-029** (§4.1.6): "시스템은 Supabase Auth(@supabase/ssr)를 사용하여 카카오·네이버 소셜 로그인을 지원해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용."
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### §6.1 API-02 명세 (API Endpoint List)

| 항목 | 값 |
|---|---|
| Method | GET |
| Endpoint | `/api/diagnosis/[id]` |
| 설명 | 진단 결과 조회 |
| 요청 Body | — (URL 파라미터 `id` 사용) |
| 응답 Body | `diagnosis: Diagnosis`, `candidates: array[CandidateArea]` |
| 구현 방식 | Route Handler |
| 인증 | Supabase Session |
| 응답 시간 목표 | p95 ≤ 1,500ms |

### 에러 응답 표준 (HTTP Status + Error Code 매핑)

| HTTP Status | Error Code | 사용자 메시지 | 발생 조건 |
|---|---|---|---|
| 401 | DIAGNOSIS_FORBIDDEN | "로그인이 필요합니다." | 미인증 또는 게스트 사용자 |
| 403 | DIAGNOSIS_FORBIDDEN | "접근 권한이 없습니다." | 다른 사용자의 진단 조회 시도 |
| 404 | DIAGNOSIS_NOT_FOUND | "진단 결과를 찾을 수 없습니다." | 존재하지 않는 ID |
| 500 | INTERNAL_ERROR | "서버 오류가 발생했습니다." | DB 쿼리 에러 등 |

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-003 | Prisma Diagnosis + CandidateArea 모델, `@@index([userId, createdAt])` | `@prisma/client` | Prisma include 조회, 인덱스 활용 |
| API-002 | GetDiagnosisResponse, DiagnosisDTO, CandidateAreaDTO, DiagnosisErrorCode | `@/lib/types/diagnosis` | 응답 타입 + 에러 코드 |
| API-002 | mapDiagnosisToDTO | `@/lib/mappers/diagnosis-mapper` | Prisma → DTO 변환 |
| CMD-AUTH-003 | getCurrentUser (CurrentUser 유니온 타입) | `@/lib/auth/session` | 세션 검증 — type: 'authenticated' | 'guest' | 'unauthenticated' |
| API-001 | AuthErrorCode | `@/lib/types/auth` | 인증 에러 코드 |
| CMD-DIAG-004 | saveDiagnosisResult | `@/app/actions/diagnosis` | 데이터 선 저장 (본 Route Handler의 데이터 원천) |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `app/api/diagnosis/[id]/route.ts`에 GET Route Handler 구현
  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { prisma } from '@/lib/prisma';
  import { getCurrentUser } from '@/lib/auth/session';
  import { mapDiagnosisToDTO } from '@/lib/mappers/diagnosis-mapper';
  import { DiagnosisErrorCode } from '@/lib/types/diagnosis';
  import * as Sentry from '@sentry/nextjs';

  export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      // 1. 인증 검증
      const currentUser = await getCurrentUser();
      if (currentUser.type === 'unauthenticated') {
        return NextResponse.json(
          { error: DiagnosisErrorCode.DIAGNOSIS_FORBIDDEN, message: '로그인이 필요합니다.' },
          { status: 401 }
        );
      }
      if (currentUser.type === 'guest') {
        return NextResponse.json(
          { error: DiagnosisErrorCode.DIAGNOSIS_FORBIDDEN, message: '게스트 모드에서는 조회할 수 없습니다.' },
          { status: 401 }
        );
      }

      // 2. Prisma include 단일 쿼리 (N+1 방지)
      const diagnosis = await prisma.diagnosis.findUnique({
        where: { id: params.id },
        include: { candidates: { orderBy: { rank: 'asc' } } },
      });

      // 3. 존재하지 않는 ID
      if (!diagnosis) {
        return NextResponse.json(
          { error: DiagnosisErrorCode.DIAGNOSIS_NOT_FOUND, message: '진단 결과를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 4. 권한 검증 — userId 일치 확인
      if (diagnosis.userId !== currentUser.user.id) {
        return NextResponse.json(
          { error: DiagnosisErrorCode.DIAGNOSIS_FORBIDDEN, message: '접근 권한이 없습니다.' },
          { status: 403 }
        );
      }

      // 5. Prisma → DTO 변환
      const response = mapDiagnosisToDTO(diagnosis, diagnosis.candidates);
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'diagnosis', task: 'QRY-DIAG-001' } });
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
  ```

- [ ] **3.2** `__tests__/api/diagnosis-get.spec.ts`에 Route Handler 단위 테스트
  ```typescript
  describe('GET /api/diagnosis/[id]', () => {
    it('인증된 사용자 + 유효한 ID → 200 + GetDiagnosisResponse', async () => { /* ... */ });
    it('미인증 → 401 + DIAGNOSIS_FORBIDDEN', async () => { /* ... */ });
    it('게스트 → 401 + DIAGNOSIS_FORBIDDEN', async () => { /* ... */ });
    it('존재하지 않는 ID → 404 + DIAGNOSIS_NOT_FOUND', async () => { /* ... */ });
    it('다른 사용자의 진단 → 403 + DIAGNOSIS_FORBIDDEN', async () => { /* ... */ });
    it('서버 에러 → 500 + Sentry.captureException 호출', async () => { /* ... */ });
  });
  ```

- [ ] **3.3** `__tests__/api/diagnosis-get-performance.spec.ts`에 성능 테스트 스켈레톤
  ```typescript
  describe('GET /api/diagnosis/[id] 성능', () => {
    it('Prisma include 단일 쿼리로 N+1 방지 — SQL 쿼리 ≤2회', async () => { /* ... */ });
    it('응답 시간 p95 ≤ 1,500ms (로컬 SQLite 기준)', async () => { /* ... */ });
  });
  ```

- [ ] **3.4** `__tests__/api/diagnosis-get-auth.spec.ts`에 권한 시나리오 통합 테스트
  ```typescript
  describe('GET /api/diagnosis/[id] 권한 검증', () => {
    it('User A의 진단을 User B가 조회 시도 → 403', async () => { /* ... */ });
    it('User A의 진단을 User A가 조회 → 200', async () => { /* ... */ });
  });
  ```

- [ ] **3.5** Prisma include 쿼리 최적화 확인
  - `prisma.$queryRawUnsafe('EXPLAIN ...')` 또는 Prisma 로그로 SQL 쿼리 수 ≤ 2 확인
  - `include: { candidates: ... }` 사용으로 JOIN 1회

- [ ] **3.6** 정적 분석: DiagnosisErrorCode 사용 검증
  ```bash
  grep -c "DiagnosisErrorCode" app/api/diagnosis/\[id\]/route.ts  # → ≥3
  ```

- [ ] **3.7** 응답 헤더에 Cache-Control 설정
  ```typescript
  // 진단 결과는 변경 가능 → no-cache
  return NextResponse.json(response, {
    status: 200,
    headers: { 'Cache-Control': 'private, no-cache' },
  });
  ```

- [ ] **3.8** API 응답 형식 표준화 검증
  ```typescript
  // 성공: { diagnosis: DiagnosisDTO, candidates: CandidateAreaDTO[] }
  // 에러: { error: string, message: string }
  ```

- [ ] **3.9** TypeScript 타입 안전성 확인
  - `npx tsc --noEmit` 통과
  - Route Handler 반환 타입이 `NextResponse<GetDiagnosisResponse | ErrorResponse>` 형식

- [ ] **3.10** Sentry 통합 검증
  ```bash
  grep -c "Sentry.captureException" app/api/diagnosis/\[id\]/route.ts  # → ≥1
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 인증된 사용자의 진단 결과 조회 성공
- **Given** User A가 로그인 상태이고, User A의 Diagnosis + CandidateArea 3건이 DB에 존재
- **When** `GET /api/diagnosis/{id}` 요청
- **Then** HTTP 200, 응답 body에 `diagnosis` + `candidates` 포함, `candidates.length === 3`, rank 순 정렬

**AC-2 (예외):** 미인증 사용자 접근 차단
- **Given** 세션 쿠키가 없는 브라우저
- **When** `GET /api/diagnosis/{id}` 요청
- **Then** HTTP 401, `error: 'DIAG_FORBIDDEN'`

**AC-3 (예외):** 다른 사용자의 진단 접근 차단
- **Given** User A 로그인 상태, User B의 Diagnosis ID로 요청
- **When** `GET /api/diagnosis/{userB_diagnosis_id}` 요청
- **Then** HTTP 403, `error: 'DIAG_FORBIDDEN'`, `message: '접근 권한이 없습니다.'`

**AC-4 (예외):** 존재하지 않는 ID
- **Given** 유효하지 않은 UUID로 요청
- **When** `GET /api/diagnosis/{invalid_id}` 요청
- **Then** HTTP 404, `error: 'DIAG_NOT_FOUND'`

**AC-5 (성능):** 응답 시간 p95 ≤ 1,500ms
- **Given** Diagnosis + CandidateArea 10건 규모 데이터
- **When** 100회 반복 요청
- **Then** p95 ≤ 1,500ms, Prisma include로 N+1 방지 (SQL 쿼리 ≤ 2회)

**AC-6 (보안):** Sentry 에러 추적
- **Given** DB 쿼리 중 에러 발생
- **When** catch 블록 실행
- **Then** `Sentry.captureException(error, { tags: { domain: 'diagnosis', task: 'QRY-DIAG-001' } })` 호출, HTTP 500 반환

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | GET 조회는 p95 ≤ 1,500ms 목표 (§6.1 API-02). Prisma include 단일 쿼리 + 인덱스 활용 |
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션" (§4.2.3) | getCurrentUser()로 세션 검증, diagnosis.userId === session.userId 비교 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | catch 블록에서 Sentry.captureException 호출 |

---

## 6. 📦 Deliverables (산출물 명시)

- `app/api/diagnosis/[id]/route.ts` (GET Route Handler)
- `__tests__/api/diagnosis-get.spec.ts` (6개 케이스)
- `__tests__/api/diagnosis-get-performance.spec.ts` (2개 케이스)
- `__tests__/api/diagnosis-get-auth.spec.ts` (2개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **DB-003:** Prisma Diagnosis + CandidateArea 모델 + 인덱스
- **API-002:** GetDiagnosisResponse, DiagnosisErrorCode, mapDiagnosisToDTO
- **CMD-AUTH-003:** getCurrentUser
- **CMD-DIAG-004:** saveDiagnosisResult — 데이터가 DB에 존재해야 조회 가능

### 후행:
- **QRY-SHARE-001:** 공유 리포트 SSR 열람 — 유사한 권한 검증 패턴 참조
- **UI-003:** 진단 결과 지도 시각화 — 이 API로 데이터 fetch

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/api/diagnosis-get.spec.ts` — 6개 (정상, 미인증, 게스트, 404, 403, 500)
- **성능 테스트:** `__tests__/api/diagnosis-get-performance.spec.ts` — 2개 (N+1 방지, p95)
- **통합 테스트:** `__tests__/api/diagnosis-get-auth.spec.ts` — 2개 (권한 시나리오)
- **수동 검증:** `curl` 또는 Postman으로 각 HTTP 상태 코드 확인
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **CMD-DIAG-003 (스코어링 엔진):** SRS §6.7 CLD에 ScoringEngine.score/rank 기준 미정. 현재 조회 시 DB에 저장된 score/rank 값을 그대로 반환. CMD-DIAG-003 완료 후 스코어링 반영.
2. **페이지네이션:** 현재 단일 진단 조회만 구현. 사용자별 진단 목록 조회(GET /api/diagnosis?page=1)는 별도 QRY 태스크로 추가 필요.
3. **공유 링크를 통한 조회:** 비회원이 공유 토큰으로 접근하는 경우는 QRY-SHARE-001에서 별도 구현. 본 Route Handler는 인증된 소유자만 접근 가능.
4. **DB-003 인덱스 활용 확인:** `@@index([userId, createdAt(sort: Desc)])` 인덱스가 `findUnique({ where: { id } })` 쿼리에는 직접 사용되지 않으나, 향후 사용자별 진단 목록 조회 시 활용. 단일 조회는 PK 인덱스 활용.
