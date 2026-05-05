---
name: Feature Task
title: "[Feature] CMD-DIAG-003: 후보 동네 AI 스코어링 엔진 구현 (Vercel AI SDK + Gemini, 구조화 출력, fallback 통근시간 기반)"
labels: ['feature', 'priority:H', 'epic:Diagnosis', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DIAG-003] 후보 동네 AI 스코어링 엔진 구현 — Vercel AI SDK + Gemini `generateObject` + Zod 구조화 출력 + fallback 통근시간 기반 정렬
- **목적 (Why):**
  - **비즈니스:** CMD-DIAG-002에서 산출한 교집합 후보 동네에 AI 기반 종합 스코어(0~100점)를 부여하여, 사용자에게 데이터 기반 의사결정 근거를 제공한다. SRS §6.7 CLD의 `ScoringEngine.score/rank` 역할을 AI로 구현한다.
  - **사용자 가치:** "어떤 동네가 더 나은가?"에 대한 객관적 근거(통근 40 / 생활편의 30 / 치안 20 / 기반시설 10)를 AI가 산출하여, 부부 합의 시간을 단축한다.
- **범위 (What):**
  - ✅ 만드는 것: `lib/diagnosis/scoring.ts` (scoreAndRank 함수), Zod `ScoringSchema` 정의, 시스템 프롬프트 (`buildScoringPrompt`), fallback 통근시간 기반 스코어링, 토큰 사용량 로깅, 입력 candidates 최대 10개 제한
  - ❌ 만들지 않는 것: AI client 생성(INFRA-005 import만), 교집합 산출(CMD-DIAG-002), 서버 저장(CMD-DIAG-004), UI 컴포넌트, 결제/NextAuth.js 코드
- **복잡도:** H
- **Wave:** 3 (Diagnosis 트랙)
- **⚠️ INFRA-005 직접 활용 (절대 준수):** 본 ISSUE에서 추가 AI client 생성 금지. `@/lib/ai/client`의 `aiModel` import만 사용.
- **⚠️ 서버 측 처리:** AI 호출은 `'use server'` Server Action 내에서 수행 (API 키 보호). Edge Function timeout과 호환되도록 8초 제한.

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-003** (§4.1.1): "시스템은 두 직장 주소를 기반으로 교집합 후보 동네를 3곳 이상 산출하고, 지도 위에 시각화해야 한다."
- **REQ-FUNC-004** (§4.1.1): "시스템은 각 후보 동네를 탭했을 때 양쪽 직장까지의 예상 출퇴근 시간(대중교통·자차)을 표시해야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms (클라이언트 API 콜 기준)"
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"
- **CON-13** (§1.2.3): "LLM 오케스트레이션은 Vercel AI SDK를 사용하여 Next.js 내부에서 직접 구현한다."
- **CON-14** (§1.2.3): "LLM 호출은 Google Gemini API를 기본으로 사용하며, 환경 변수 설정만으로 모델 교체가 가능하도록 SDK 표준 인터페이스를 준수한다."

### §6.7 CLD ScoringEngine (미정 + AI 방향성)

```
class ScoringEngine {
    +score(candidates, criteria) List~CandidateResult~
    +rank(candidates) List~CandidateResult~
}
DiagnosisClientService --> ScoringEngine : delegates
```

> ⚠️ SRS §6.7 CLD ScoringEngine은 v1.6 시점에 가중치(commute 40 / lifestyle 30 / safety 20 / infra 10)가 미정. 본 ISSUE는 일반적 부동산 스코어링 가중치를 임시 적용. SRS 보완 후 가중치 갱신 follow-up 필요.

### §6.3.1 진단 시퀀스 Actor 명단

사용자 → Next.js Client Component → 카카오 모빌리티 API → (CMD-DIAG-002 교집합 산출) → **CMD-DIAG-003 스코어링** → Server Action 저장 → 지도 시각화

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| INFRA-005 ✅ | `aiModel` (provider 분기), `generateObject` 패턴, `fallbackScoring` | `@/lib/ai/client` | AI 모델 인스턴스 — **자체 client 생성 금지** |
| CMD-DIAG-002 ✅ | `calculateIntersection()`, `IntersectionResult`, `CandidateAreaDTO[]` | `@/lib/diagnosis/intersection` | 스코어링 입력 (score=0인 후보 배열) |
| API-002 ✅ | `CandidateAreaDTO`, `CommuteInfoDTO`, `DiagnosisFilters` | `@/lib/types/diagnosis` | 입출력 타입 |
| MON-001 ✅ | `reportErrorToSentry` | `@/lib/monitoring/sentry-reporter` | AI 실패 시 Sentry 리포팅 |
| API-006 ✅ | `DiagnosisErrorCode` | `@/lib/types/diagnosis` | 에러 코드 활용 |

### CMD-DIAG-002와의 통합

- CMD-DIAG-002는 후보 동네 + 통근시간만 산출 (score=0으로 반환)
- CMD-DIAG-003은 그 결과를 받아 스코어/rank 추가
- **호출 순서:** `intersection()` → `scoreAndRank()`

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/diagnosis/scoring-schema.ts`에 Zod 구조화 출력 스키마 정의
  ```typescript
  import { z } from 'zod';

  export const ScoringSchema = z.object({
    candidates: z.array(z.object({
      candidateId: z.string(),
      score: z.number().min(0).max(100),
      rationale: z.string().max(200),
      breakdown: z.object({
        commute: z.number().min(0).max(40),
        lifestyle: z.number().min(0).max(30),
        safety: z.number().min(0).max(20),
        infra: z.number().min(0).max(10),
      }),
    })),
  });

  export type ScoringResult = z.infer<typeof ScoringSchema>;
  ```

- [ ] **3.2** `lib/diagnosis/scoring-prompt.ts`에 시스템 프롬프트 + 사용자 프롬프트 빌더 구현
  ```typescript
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';

  export const SCORING_SYSTEM_PROMPT = `
  당신은 한국 수도권 부동산·주거 환경 전문가다.
  주어진 후보 동네 정보를 바탕으로 0~100점 스코어를 산출하라.
  규칙:
  1. score는 commute(40) + lifestyle(30) + safety(20) + infra(10) 합산
  2. rationale은 200자 이내 한국어
  3. 사실 추론은 명시된 데이터에서만. 추측·가공 금지.
  4. 동일 입력에 동일 출력 (temperature: 0.1)
  5. 입력에 없는 동네 정보를 추가하지 말 것
  `.trim();

  export function buildScoringPrompt(
    candidates: CandidateAreaDTO[],
    userMode: 'couple' | 'single'
  ): string {
    const candidateData = candidates.map(c => ({
      candidateId: c.id,
      name: c.name,
      commuteA: c.commuteA.durationMinutes,
      commuteB: c.commuteB.durationMinutes,
      transfersA: c.commuteA.transfers,
      transfersB: c.commuteB.transfers,
    }));
    return `모드: ${userMode}\n후보 동네 데이터:\n${JSON.stringify(candidateData, null, 2)}`;
  }
  ```

- [ ] **3.3** `lib/diagnosis/scoring.ts`에 `scoreAndRank` 핵심 함수 구현 (INFRA-005 직접 활용)
  ```typescript
  'use server';
  import { generateObject } from 'ai';
  import { aiModel } from '@/lib/ai/client';
  import { ScoringSchema, type ScoringResult } from './scoring-schema';
  import { SCORING_SYSTEM_PROMPT, buildScoringPrompt } from './scoring-prompt';
  import { fallbackCommuteBasedScoring } from './scoring-fallback';
  import { reportErrorToSentry } from '@/lib/monitoring/sentry-reporter';
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';

  const AI_SCORING_TIMEOUT_MS = 8000;
  const MAX_CANDIDATES = 10;

  export async function scoreAndRank(
    candidates: CandidateAreaDTO[],
    userMode: 'couple' | 'single' = 'couple'
  ): Promise<CandidateAreaDTO[]> {
    if (candidates.length === 0) return [];
    if (candidates.length > MAX_CANDIDATES) {
      candidates = candidates.slice(0, MAX_CANDIDATES);
    }

    try {
      const result = await generateObject({
        model: aiModel,
        schema: ScoringSchema,
        system: SCORING_SYSTEM_PROMPT,
        prompt: buildScoringPrompt(candidates, userMode),
        temperature: 0.1,
        maxRetries: 1,
      });

      // 토큰 사용량 로깅
      if (result.usage) {
        console.log(`[AI-SCORING] tokens: prompt=${result.usage.promptTokens}, completion=${result.usage.completionTokens}`);
      }

      return applyScores(candidates, result.object);
    } catch (error) {
      reportErrorToSentry('DIAG_TRANSPORT_API_TIMEOUT' as any, error as Error, {
        domain: 'scoring', fallback: 'commute-based', candidateCount: candidates.length,
      });
      return fallbackCommuteBasedScoring(candidates);
    }
  }

  function applyScores(candidates: CandidateAreaDTO[], scoring: ScoringResult): CandidateAreaDTO[] {
    const scoreMap = new Map(scoring.candidates.map(s => [s.candidateId, s]));
    return candidates
      .map(c => {
        const s = scoreMap.get(c.id);
        return { ...c, score: s?.score ?? 0, rank: 0 };
      })
      .sort((a, b) => b.score - a.score)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
  }
  ```

- [ ] **3.4** `lib/diagnosis/scoring-fallback.ts`에 통근시간 기반 fallback 스코어링 구현
  ```typescript
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';

  export function fallbackCommuteBasedScoring(candidates: CandidateAreaDTO[]): CandidateAreaDTO[] {
    return candidates
      .map(c => {
        const avgCommute = (c.commuteA.durationMinutes + c.commuteB.durationMinutes) / 2;
        const commuteScore = Math.max(0, Math.min(40, Math.round(40 - avgCommute * 0.5)));
        const score = commuteScore; // fallback: commute 가중치만 적용
        return { ...c, score, rank: 0 };
      })
      .sort((a, b) => b.score - a.score)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
  }
  ```

- [ ] **3.5** `lib/diagnosis/scoring-cache.ts`에 캐싱 키 생성 + 메모리 캐시 구현
  ```typescript
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';
  import { LRUCache } from 'lru-cache';

  const scoringCache = new LRUCache<string, CandidateAreaDTO[]>({
    max: 50,
    ttl: 1000 * 60 * 30, // 30분
  });

  export function generateCacheKey(candidates: CandidateAreaDTO[], mode: string): string {
    const ids = candidates.map(c => c.id).sort().join(',');
    const commutes = candidates.map(c =>
      `${c.commuteA.durationMinutes}:${c.commuteB.durationMinutes}`
    ).join('|');
    return `scoring:${mode}:${ids}:${commutes}`;
  }

  export function getCachedScoring(key: string): CandidateAreaDTO[] | undefined {
    return scoringCache.get(key);
  }

  export function setCachedScoring(key: string, result: CandidateAreaDTO[]): void {
    scoringCache.set(key, result);
  }
  ```

- [ ] **3.6** `lib/diagnosis/scoring.ts`에 캐시 통합 (3.3 함수 보강)
  - `scoreAndRank` 함수 시작 시 `getCachedScoring` 조회
  - AI 결과 반환 전 `setCachedScoring` 저장
  - 동일 입력 → 동일 출력 보장 (temperature 0.1 + 캐시)

- [ ] **3.7** `lib/diagnosis/index.ts` 배럴 export 업데이트
  ```typescript
  export * from './scoring';
  export * from './scoring-schema';
  export * from './scoring-fallback';
  ```

- [ ] **3.8** `__tests__/diagnosis/scoring.spec.ts`에 스코어링 핵심 테스트
  ```typescript
  describe('scoreAndRank', () => {
    it('AI 호출 정상 시 candidates에 score/rank 부여', async () => { /* ... */ });
    it('Zod schema 검증 실패 시 fallback 발동', async () => { /* ... */ });
    it('candidates > 10개 시 상위 10개만 처리', async () => { /* ... */ });
    it('빈 candidates → 빈 배열 반환', async () => { /* ... */ });
    it('AI 실패 시 fallbackCommuteBasedScoring 호출', async () => { /* ... */ });
    it('토큰 사용량 로깅 호출', async () => { /* ... */ });
  });
  ```

- [ ] **3.9** `__tests__/diagnosis/scoring-fallback.spec.ts`에 fallback 테스트
  ```typescript
  describe('fallbackCommuteBasedScoring', () => {
    it('통근시간 짧은 순으로 높은 score', () => { /* ... */ });
    it('score 0~40 범위 보장', () => { /* ... */ });
    it('rank가 1부터 순서대로 부여', () => { /* ... */ });
  });
  ```

- [ ] **3.10** `__tests__/diagnosis/scoring-schema.spec.ts`에 Zod 스키마 테스트
  ```typescript
  describe('ScoringSchema', () => {
    it('유효한 입력 파싱 성공', () => { /* ... */ });
    it('score > 100 시 ZodError', () => { /* ... */ });
    it('commute > 40 시 ZodError', () => { /* ... */ });
    it('rationale > 200자 시 ZodError', () => { /* ... */ });
  });
  ```

- [ ] **3.11** `__tests__/diagnosis/scoring-prompt.spec.ts`에 프롬프트 빌더 테스트
  ```typescript
  describe('buildScoringPrompt', () => {
    it('couple 모드 프롬프트에 commuteA/commuteB 포함', () => { /* ... */ });
    it('single 모드 프롬프트 생성', () => { /* ... */ });
  });
  ```

- [ ] **3.12** v1.3 정합성 검증 + INFRA-005 직접 import 검증
  ```bash
  grep -r "'use server'" lib/diagnosis/scoring.ts  # → 1건 (정상)
  grep -r "aiModel" lib/diagnosis/scoring.ts       # → @/lib/ai/client import 확인
  grep -ri "NextAuth\|payment\|AES\|bcrypt" lib/diagnosis/scoring*.ts  # → 0건
  grep -r "google(" lib/diagnosis/                 # → 0건 (자체 AI client 생성 X)
  grep -r "new.*Google\|createGoogleGenerativeAI" lib/diagnosis/  # → 0건
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** AI 호출 정상 시 스코어 부여
- **Given** CMD-DIAG-002에서 산출한 `CandidateAreaDTO[]` (score=0, 5곳)
- **When** `scoreAndRank(candidates, 'couple')` 호출
- **Then** 모든 candidate에 `score` (0~100), `rank` (1~5), `breakdown` 부여. `score = commute + lifestyle + safety + infra`

**AC-2 (예외):** AI 호출 실패 시 fallback 발동
- **Given** AI API 호출이 타임아웃 또는 에러 발생
- **When** `scoreAndRank()` 실패 catch 블록 진입
- **Then** `fallbackCommuteBasedScoring(candidates)` 호출, 통근시간 기반 score 반환. `reportErrorToSentry` 호출 확인

**AC-3 (예외):** Zod schema 검증 실패 시 fallback 발동
- **Given** AI가 스키마에 맞지 않는 응답 반환 (예: score=200, commute=50)
- **When** `generateObject` 내부 Zod 검증 실패
- **Then** catch 블록에서 fallback 발동, Sentry 이벤트 발생

**AC-4 (경계):** 입력 candidates > 10개 시 상위 10개만 처리
- **Given** 15개의 `CandidateAreaDTO[]` 입력
- **When** `scoreAndRank(candidates)` 호출
- **Then** AI에 전달되는 candidates는 10개로 제한 (비용 제어)

**AC-5 (도메인 핵심):** 동일 입력 동일 출력 (재현성)
- **Given** 동일한 candidates + 동일한 userMode
- **When** `scoreAndRank()` 2회 호출
- **Then** 동일한 score/rank 반환 (temperature 0.1 + 캐시)

**AC-6 (성능):** AI 호출 8초 이내 완료
- **Given** 10개 candidates
- **When** `scoreAndRank()` 호출
- **Then** 응답 ≤ 8,000ms (REQ-NF-001 호환). 초과 시 Sentry 경고

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | `AI_SCORING_TIMEOUT_MS = 8000` 상수. AI 실패 시 fallback으로 결과 반환 보장. 전체 진단 시퀀스 내 AI 호출이 8초 이내 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림 설정 사용" (§4.2.6) | AI 실패 시 `reportErrorToSentry` 호출. tags: `{ domain: 'scoring', fallback: 'commute-based' }` |
| CON-13 | "LLM 오케스트레이션은 Vercel AI SDK를 사용하여 Next.js 내부에서 직접 구현한다." (§1.2.3) | `import { generateObject } from 'ai'` + `import { aiModel } from '@/lib/ai/client'` |
| CON-14 | "환경 변수 설정만으로 모델 교체가 가능하도록 SDK 표준 인터페이스를 준수한다." (§1.2.3) | INFRA-005의 `AI_PROVIDER` 환경변수 분기 그대로 활용. 자체 하드코딩 금지 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/diagnosis/scoring.ts` (scoreAndRank 핵심 함수 — `'use server'`)
- `lib/diagnosis/scoring-schema.ts` (Zod ScoringSchema)
- `lib/diagnosis/scoring-prompt.ts` (SCORING_SYSTEM_PROMPT + buildScoringPrompt)
- `lib/diagnosis/scoring-fallback.ts` (fallbackCommuteBasedScoring)
- `lib/diagnosis/scoring-cache.ts` (LRU 캐시 + 키 생성)
- `__tests__/diagnosis/scoring.spec.ts` (6개 케이스)
- `__tests__/diagnosis/scoring-fallback.spec.ts` (3개 케이스)
- `__tests__/diagnosis/scoring-schema.spec.ts` (4개 케이스)
- `__tests__/diagnosis/scoring-prompt.spec.ts` (2개 케이스)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **INFRA-005 ✅:** `aiModel` (lib/ai/client.ts), `generateObject` 패턴, `AI_PROVIDER` 환경변수 분기
- **CMD-DIAG-002 ✅:** `calculateIntersection()` — score=0인 CandidateAreaDTO[] 산출
- **API-002 ✅:** `CandidateAreaDTO`, `CommuteInfoDTO` 타입
- **MON-001 ✅:** `reportErrorToSentry` 함수

### 후행:
- **CMD-DIAG-004:** 진단 결과 서버 저장 — scoreAndRank 결과 포함 저장
- **UI-003:** 지도 시각화 — score/rank 기반 마커 크기·색상 분기
- **TEST-001:** 교차 진단 GWT 시나리오 — 스코어링 결과 검증

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/diagnosis/scoring.spec.ts` — 6개 케이스 (정상, AI 실패 fallback, Zod 실패, 10개 제한, 빈 배열, 토큰 로깅)
- **단위 테스트:** `__tests__/diagnosis/scoring-fallback.spec.ts` — 3개 케이스 (정렬, 범위, rank)
- **단위 테스트:** `__tests__/diagnosis/scoring-schema.spec.ts` — 4개 케이스 (유효, score 초과, commute 초과, rationale 초과)
- **단위 테스트:** `__tests__/diagnosis/scoring-prompt.spec.ts` — 2개 케이스 (couple/single 모드)
- **통합 테스트 (개발 단계):** 실제 Gemini API 호출로 `scoreAndRank` 동작 확인
- **타입 검증:** `npx tsc --noEmit` 통과
- **정적 검증:**
  ```bash
  grep -r "google(" lib/diagnosis/  # → 0건 (자체 AI client 생성 X)
  grep -ri "NextAuth\|payment\|AES\|bcrypt" lib/diagnosis/scoring*.ts  # → 0건
  ```
- **CI 게이트:** `tsc --noEmit`, Jest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **SRS §6.7 CLD ScoringEngine 가중치 보완:** v1.6 시점에 가중치(commute 40 / lifestyle 30 / safety 20 / infra 10)가 미정. 본 ISSUE는 일반적 부동산 스코어링 가중치를 임시 적용. SRS 보완 후 가중치 갱신 follow-up 필요.
2. **캐싱 키 설계:** 현재 candidate ID + 통근시간 기반 해시. 동일 동네라도 시간대 변경 시 캐시 미스 — 시간대 포함 키 확장 검토.
3. **비용 임계치:** Gemini Free Tier (60 req/min, 1,500 req/day). MVP 트래픽(50건/주)에서 충분. 확장 시 유료 전환 또는 캐시 히트율 최적화.
4. **Streaming 지원:** 현재 `generateObject`는 non-streaming. UX 향상을 위해 `streamObject`로 전환 검토 가능 (후속 태스크).
5. **lifestyle/safety/infra 데이터 소스:** 현재 AI에 통근 시간만 전달. 생활편의·치안·기반시설 데이터는 별도 외부 데이터 연동 시 프롬프트에 추가 — v1.5+에서 보강.
6. **MOCK-001 정합성:** CMD-DIAG-003 스코어링 결과의 score/breakdown 형식이 MOCK-001의 score 필드와 일치하는지 확인 필요.
