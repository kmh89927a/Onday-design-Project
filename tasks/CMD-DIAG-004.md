---
name: Feature Task
title: "[Feature] CMD-DIAG-004: 진단 결과 서버 저장 — saveDiagnosisResult Server Action (Prisma Transaction)"
labels: ['feature', 'priority:M', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DIAG-004] 진단 결과 서버 저장 — saveDiagnosisResult Server Action, Prisma $transaction으로 Diagnosis + CandidateArea 정합성 보장
- **목적 (Why):**
  - **비즈니스:** 클라이언트에서 산출한 교집합 후보 동네를 서버에 영구 저장하여, 결과 재조회·공유 링크 생성·이전 조건 불러오기가 가능하게 한다.
  - **사용자 가치:** 진단 결과가 DB에 저장되어 재방문 시 이전 결과를 확인하고, 배우자에게 공유할 수 있다.
- **범위 (What):**
  - ✅ 만드는 것: saveDiagnosisResult Server Action ('use server'), Prisma $transaction (Diagnosis + CandidateArea 동시 INSERT), 인증 검증 (게스트 차단), Sentry 에러 핸들링
  - ❌ 만들지 않는 것: 교집합 산출(CMD-DIAG-002), 스코어링(CMD-DIAG-003), 조회 API(QRY-DIAG-001), 결제 관련 코드
- **복잡도:** M
- **Wave:** 3 (Diagnosis 트랙)
- **⚠️ Server Action ('use server'):** CMD-DIAG-001/002와 달리 본 태스크는 서버 측 처리. DB 저장은 Server Action이 적절.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-003** (§4.1.1): "시스템은 두 직장 주소를 기반으로 교집합 후보 동네를 3곳 이상 산출하고, 지도 위에 시각화해야 한다."
- **REQ-FUNC-029** (§4.1.6): "시스템은 Supabase Auth(@supabase/ssr)를 사용하여 카카오·네이버 소셜 로그인을 지원해야 한다. 세션은 Supabase Auth가 발급하는 httpOnly cookie로 관리한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션. sameSite strict 적용."
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"

### 시퀀스 다이어그램 (§6.3.1 — 저장 부분)

```
Web→SA: saveDiagnosisResult(진단 결과)
SA→SA: Supabase Auth 세션 검증 (getCurrentUser)
SA→DB: Prisma.$transaction { Diagnosis.create + CandidateArea.createMany }
DB→SA: 저장 완료
SA→Web: DiagnosisDTO 응답
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| DB-003 | Prisma Diagnosis + CandidateArea 모델 | `@prisma/client` | $transaction INSERT 대상 |
| API-002 | CreateDiagnosisRequest, CandidateAreaDTO, DiagnosisDTO, DiagnosisErrorCode | `@/lib/types/diagnosis` | 입출력 타입 |
| API-002 | createDiagnosisSchema (Zod) | `@/lib/validators/diagnosis` | 서버 측 유효성 검증 |
| API-002 | mapDiagnosisToDTO | `@/lib/mappers/diagnosis-mapper` | Prisma → DTO 변환 |
| CMD-AUTH-003 | getCurrentUser, requireAuth | `@/lib/auth/session` | 인증 검증 |
| API-001 | AuthErrorCode, createAuthError | `@/lib/types/auth`, `@/lib/helpers/auth-error` | 인증 에러 |
| CMD-DIAG-002 | calculateIntersection (결과) | — | 클라이언트에서 산출한 candidates를 서버로 전송 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/types/diagnosis.ts`에 SaveDiagnosisInput 타입 추가
  ```typescript
  // API-002 확장
  export interface SaveDiagnosisInput {
    addressA: string;
    addressB: string;
    coordA: { lat: number; lng: number };
    coordB: { lat: number; lng: number };
    filters: DiagnosisFilters;
    mode: 'couple' | 'single';
    deadlineDate?: string | null;
    candidates: CandidateAreaDTO[];
  }
  ```

- [ ] **3.2** `lib/validators/diagnosis.ts`에 saveDiagnosisInputSchema Zod 스키마 추가
  ```typescript
  export const saveDiagnosisInputSchema = createDiagnosisSchema.extend({
    coordA: z.object({ lat: z.number(), lng: z.number() }),
    coordB: z.object({ lat: z.number(), lng: z.number() }),
    candidates: z.array(z.object({
      id: z.string(),
      name: z.string().min(1),
      coord: z.object({ lat: z.number(), lng: z.number() }),
      commuteA: z.object({ durationMinutes: z.number(), transportType: z.enum(['transit', 'car']), transfers: z.number(), walkingMinutes: z.number() }),
      commuteB: z.object({ durationMinutes: z.number(), transportType: z.enum(['transit', 'car']), transfers: z.number(), walkingMinutes: z.number() }),
      score: z.number(),
      rank: z.number().int().min(1),
    })).min(1, '후보 동네가 최소 1곳 이상이어야 합니다'),
  });
  ```

- [ ] **3.3** `app/actions/diagnosis.ts`에 saveDiagnosisResult Server Action 구현
  ```typescript
  'use server';
  import { prisma } from '@/lib/prisma';
  import { requireAuth } from '@/lib/auth/session';
  import { saveDiagnosisInputSchema } from '@/lib/validators/diagnosis';
  import { mapDiagnosisToDTO } from '@/lib/mappers/diagnosis-mapper';
  import { DiagnosisErrorCode } from '@/lib/types/diagnosis';
  import type { SaveDiagnosisInput } from '@/lib/types/diagnosis';
  import type { DiagnosisDTO } from '@/lib/types/diagnosis';
  import * as Sentry from '@sentry/nextjs';

  export async function saveDiagnosisResult(
    input: SaveDiagnosisInput
  ): Promise<DiagnosisDTO> {
    // 1. 인증 검증 — 게스트 차단
    const currentUser = await requireAuth();

    // 2. 입력 유효성 검증
    const parsed = saveDiagnosisInputSchema.parse(input);

    try {
      // 3. Prisma $transaction — Diagnosis + CandidateArea 동시 INSERT
      const result = await prisma.$transaction(async (tx) => {
        const diagnosis = await tx.diagnosis.create({
          data: {
            userId: currentUser.user.id,
            status: 'completed',
            filters: parsed.filters as any,
            mode: parsed.mode,
            deadlineMode: !!parsed.deadlineDate,
            deadline: parsed.deadlineDate ? new Date(parsed.deadlineDate) : null,
          },
        });

        await tx.candidateArea.createMany({
          data: parsed.candidates.map((c) => ({
            diagnosisId: diagnosis.id,
            name: c.name,
            coordLat: c.coord.lat,
            coordLng: c.coord.lng,
            commuteAJson: c.commuteA as any,
            commuteBJson: c.commuteB as any,
            score: c.score,
            rank: c.rank,
          })),
        });

        return await tx.diagnosis.findUniqueOrThrow({
          where: { id: diagnosis.id },
          include: { candidates: { orderBy: { rank: 'asc' } } },
        });
      });

      // 4. Prisma → DTO 변환
      return mapDiagnosisToDTO(result, result.candidates);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { domain: 'diagnosis', task: 'CMD-DIAG-004' },
        extra: { userId: currentUser.user.id },
      });
      throw new Error(DiagnosisErrorCode.SAVE_FAILED);
    }
  }
  ```

- [ ] **3.4** `lib/mappers/diagnosis-mapper.ts` 확장 — CandidateArea Prisma → CandidateAreaDTO 변환 로직 추가
  ```typescript
  import type { Diagnosis, CandidateArea } from '@prisma/client';
  import type { GetDiagnosisResponse, DiagnosisDTO, CandidateAreaDTO, CommuteInfoDTO } from '@/lib/types/diagnosis';

  export function mapDiagnosisToDTO(
    diagnosis: Diagnosis,
    candidates: CandidateArea[]
  ): GetDiagnosisResponse {
    return {
      diagnosis: {
        id: diagnosis.id,
        userId: diagnosis.userId,
        deadline: diagnosis.deadline?.toISOString() ?? null,
        status: diagnosis.status as any,
        filters: diagnosis.filters as any,
        mode: diagnosis.mode as any,
        deadlineMode: diagnosis.deadlineMode,
        createdAt: diagnosis.createdAt.toISOString(),
      },
      candidates: candidates.map(mapCandidateToDTO),
    };
  }

  function mapCandidateToDTO(c: CandidateArea): CandidateAreaDTO {
    return {
      id: c.id,
      name: c.name,
      coord: { lat: c.coordLat, lng: c.coordLng },
      commuteA: c.commuteAJson as CommuteInfoDTO,
      commuteB: c.commuteBJson as CommuteInfoDTO,
      score: c.score,
      rank: c.rank,
    };
  }
  ```

- [ ] **3.5** `__tests__/actions/save-diagnosis.spec.ts`에 Server Action 단위 테스트
  ```typescript
  describe('saveDiagnosisResult', () => {
    it('인증된 사용자 — Diagnosis + CandidateArea 3건 동시 저장 성공', async () => { /* ... */ });
    it('게스트 사용자 — AUTH_REQUIRED 에러 발생', async () => { /* ... */ });
    it('유효하지 않은 input — ZodError 발생', async () => { /* ... */ });
    it('트랜잭션 원자성 — CandidateArea 일부 실패 시 Diagnosis도 롤백', async () => { /* ... */ });
    it('에러 시 Sentry.captureException 호출', async () => { /* ... */ });
  });
  ```

- [ ] **3.6** `__tests__/actions/save-diagnosis-transaction.spec.ts`에 트랜잭션 롤백 시나리오 테스트
  ```typescript
  describe('Prisma $transaction 롤백 검증', () => {
    it('CandidateArea.createMany 실패 시 Diagnosis도 생성되지 않음', async () => {
      // Prisma 에러 시뮬레이션 (잘못된 FK 등)
      // 트랜잭션 후 prisma.diagnosis.findMany() 결과 0건 확인
    });
    it('Diagnosis.create 실패 시 CandidateArea도 생성되지 않음', async () => { /* ... */ });
  });
  ```

- [ ] **3.7** `__tests__/mappers/diagnosis-mapper-extended.spec.ts`에 CandidateArea 변환 테스트
  ```typescript
  describe('mapDiagnosisToDTO — CandidateArea 포함', () => {
    it('Prisma CandidateArea → CandidateAreaDTO 변환 정확', () => { /* ... */ });
    it('commuteAJson JSONB → CommuteInfoDTO 타입 캐스팅', () => { /* ... */ });
    it('candidates가 rank 순으로 정렬', () => { /* ... */ });
  });
  ```

- [ ] **3.8** 정적 분석: 'use server' 명시 확인
  ```bash
  head -1 app/actions/diagnosis.ts  # → 'use server'
  ```

- [ ] **3.9** userId 클라이언트 입력 차단 검증
  ```typescript
  // saveDiagnosisResult 내부에서 userId는 세션에서 추출
  // SaveDiagnosisInput에 userId 필드 없음
  // grep -r "userId.*input\." app/actions/diagnosis.ts → 0건
  ```

- [ ] **3.10** `lib/constants/diagnosis-errors.ts`에 SAVE_FAILED 에러 메시지 추가
  ```typescript
  export const DIAGNOSIS_ERROR_MAP = {
    [DiagnosisErrorCode.SAVE_FAILED]: '진단 결과 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    // ... 기존 에러 코드
  };
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** Diagnosis + CandidateArea 동시 저장 성공
- **Given** 인증된 사용자 + 유효한 SaveDiagnosisInput (candidates 3건 포함)
- **When** `saveDiagnosisResult(input)` 호출
- **Then** Diagnosis 1건 + CandidateArea 3건 DB INSERT, 반환값이 DiagnosisDTO 형식, `status === 'completed'`

**AC-2 (예외):** 게스트 사용자 저장 차단
- **Given** 게스트 모드(GuestSession) 활성 상태
- **When** `saveDiagnosisResult(input)` 호출
- **Then** `requireAuth()` 에서 AuthErrorCode.SESSION_INVALID 에러 throw, DB INSERT 0건

**AC-3 (예외):** Prisma $transaction 롤백 — 원자성 보장
- **Given** CandidateArea.createMany에서 DB 에러 발생
- **When** 트랜잭션 실행
- **Then** Diagnosis도 INSERT되지 않음 (롤백), `Sentry.captureException` 호출, DiagnosisErrorCode.SAVE_FAILED 에러 반환

**AC-4 (경계):** 유효하지 않은 입력 — Zod 검증 실패
- **Given** candidates 빈 배열 `[]`
- **When** `saveDiagnosisResult(input)` 호출
- **Then** ZodError 발생, "후보 동네가 최소 1곳 이상이어야 합니다" 메시지, DB INSERT 0건

**AC-5 (보안):** userId 세션 추출 — 클라이언트 입력 불신
- **Given** SaveDiagnosisInput에 userId 필드 없음
- **When** saveDiagnosisResult 내부에서 `currentUser.user.id` 사용
- **Then** 클라이언트가 임의 userId를 주입할 수 없음, DB에 저장된 userId가 세션의 userId와 일치

**AC-6 (보안):** Sentry 에러 통합
- **Given** DB 저장 중 에러 발생
- **When** catch 블록 실행
- **Then** `Sentry.captureException(error, { tags: { domain: 'diagnosis', task: 'CMD-DIAG-004' }, extra: { userId } })` 호출

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | 저장은 전체 진단 파이프라인의 마지막 단계. $transaction 단독 p95 ≤ 500ms 목표 |
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션" (§4.2.3) | requireAuth()로 세션 검증, userId 세션 추출 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | catch 블록에서 Sentry.captureException 호출 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `app/actions/diagnosis.ts` (saveDiagnosisResult Server Action — 'use server')
- `lib/types/diagnosis.ts` (SaveDiagnosisInput 타입 추가 — API-002 확장)
- `lib/validators/diagnosis.ts` (saveDiagnosisInputSchema 추가)
- `lib/mappers/diagnosis-mapper.ts` (CandidateArea 변환 로직 추가)
- `lib/constants/diagnosis-errors.ts` (SAVE_FAILED 에러 메시지 추가)
- `__tests__/actions/save-diagnosis.spec.ts` (5개 케이스)
- `__tests__/actions/save-diagnosis-transaction.spec.ts` (2개 케이스)
- `__tests__/mappers/diagnosis-mapper-extended.spec.ts` (3개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **DB-003:** Prisma Diagnosis + CandidateArea 모델
- **API-002:** CreateDiagnosisRequest, CandidateAreaDTO, DiagnosisDTO, DiagnosisErrorCode, createDiagnosisSchema, mapDiagnosisToDTO
- **CMD-AUTH-003:** getCurrentUser, requireAuth
- **CMD-DIAG-002:** calculateIntersection 결과 (클라이언트에서 전송)

### 후행:
- **QRY-DIAG-001:** GET /api/diagnosis/[id] — 저장된 결과 조회
- **CMD-SHARE-001:** 공유 링크 생성 — 저장된 Diagnosis ID 참조
- **CMD-DL-001:** 데드라인 모드 — deadlineMode 활용

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/actions/save-diagnosis.spec.ts` — 5개 (정상, 게스트 차단, Zod 실패, 트랜잭션 에러, Sentry)
- **단위 테스트:** `__tests__/actions/save-diagnosis-transaction.spec.ts` — 2개 (롤백 시나리오)
- **단위 테스트:** `__tests__/mappers/diagnosis-mapper-extended.spec.ts` — 3개 (CandidateArea 변환)
- **수동 검증:** Prisma Studio에서 Diagnosis + CandidateArea 데이터 확인
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **CMD-DIAG-003 (스코어링 엔진):** SRS §6.7 CLD에 ScoringEngine.score/rank 기준 미정. 현재 클라이언트에서 전송된 score/rank 값을 그대로 저장. CMD-DIAG-003 완료 후 스코어링 로직 통합.
2. **mapDiagnosisToDTO 반환 타입:** API-002에서 `GetDiagnosisResponse`로 정의했으나, saveDiagnosisResult는 `DiagnosisDTO`만 반환 필요. 타입 불일치 시 API-002 갱신 follow-up.
3. **대용량 candidates:** 현재 3~10건으로 예상하지만, 향후 확장 시 createMany 성능 이슈 가능. MVP에서는 무시.
