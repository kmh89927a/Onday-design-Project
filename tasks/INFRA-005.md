---
name: Feature Task
title: "[Feature] INFRA-005: Vercel AI SDK + Google Gemini API 연동 설정 (환경변수 기반 모델 교체 가능 구조)"
labels: ['feature', 'priority:H', 'epic:Infra', 'wave:1']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [INFRA-005] Vercel AI SDK + Google Gemini API 연동 설정 — 환경변수 기반 모델 교체 가능 구조 (Gemini → Claude/GPT 등)
- **목적 (Why):**
  - **비즈니스:** 배치 4에서 보류된 CMD-DIAG-003 (스코어링 엔진)의 AI 기반 스코어링 방향성을 확립한다. Vercel AI SDK의 `generateObject` 패턴으로 구조화된 출력(Zod schema)을 강제하고, 환경변수만으로 LLM provider를 교체할 수 있는 어댑터 구조를 제공한다.
  - **사용자 가치:** AI 기반 동네 추천 요약과 맞춤 인사이트로 사용자에게 개인화된 의사결정 근거를 제공한다.
- **범위 (What):**
  - ✅ 만드는 것: `lib/ai/client.ts` (provider 분기), `lib/ai/schemas.ts` (Zod 출력 스키마), `lib/ai/prompts.ts` (시스템 프롬프트), `lib/ai/generate.ts` (generateObject 래퍼), 환경변수 3개 (AI_PROVIDER/AI_MODEL/GOOGLE_GENERATIVE_AI_API_KEY), fallback 정책, 토큰 사용량 로깅 구조
  - ❌ 만들지 않는 것: 스코어링 엔진 비즈니스 로직(CMD-DIAG-003 범위), 결제 코드, NextAuth.js
- **복잡도:** M
- **Wave:** 1 (인프라 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **CON-13** (§1.2.3): "LLM 오케스트레이션은 Vercel AI SDK를 사용하여 Next.js 내부에서 직접 구현한다. 별도 Python 서버를 두지 않는다."
- **CON-14** (§1.2.3): "LLM 호출은 Google Gemini API를 기본으로 사용하며, 환경 변수 설정만으로 모델 교체가 가능하도록 SDK 표준 인터페이스를 준수한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms"
- **REQ-NF-024** (§4.2.4): "월 인프라 비용 — 무료 ~ 10만원 이하"

### §6.6 Component Diagram 인용 (AI Layer)

```
AILayer["🤖 AI Layer (C-TEC-005, 006)"]
  AISDK["Vercel AI SDK — @ai-sdk/google (Gemini) — 동네 추천 요약 · 맞춤 인사이트"]
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 태스크에서의 사용처 |
|---|---|---|
| INFRA-001 ✅ | Next.js 프로젝트 + `package.json` | AI SDK 패키지 설치 기반 |

### Unblock 표 (배치 7 신규)

| 본 ISSUE 완성 시 Unblock되는 후속 ISSUE | 효과 |
|---|---|
| CMD-DIAG-003 (스코어링 엔진) | AI SDK 기반 `generateObject`로 구조화된 스코어링 출력 가능 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** Vercel AI SDK + Provider 패키지 설치
  ```bash
  npm install ai@^3.4.0 @ai-sdk/google@^0.0.50
  npm install -D @ai-sdk/anthropic@^0.0.50 @ai-sdk/openai@^0.0.60
  ```
  - `ai`: Vercel AI SDK core
  - `@ai-sdk/google`: Google Gemini provider (기본)
  - `@ai-sdk/anthropic`, `@ai-sdk/openai`: 대체 provider (devDependencies — 교체 시 production으로 이동)

- [ ] **3.2** `lib/ai/client.ts`에 환경변수 기반 provider 분기 구현
  ```typescript
  // lib/ai/client.ts
  import { google } from '@ai-sdk/google';

  export type AIProvider = 'google' | 'anthropic' | 'openai';

  const provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) ?? 'google';
  const model: string = process.env.AI_MODEL ?? 'gemini-2.0-flash-exp';

  function createAIModel() {
    switch (provider) {
      case 'google':
        return google(model);
      case 'anthropic': {
        // dynamic import — devDependency에서 production 전환 시 활성화
        const { anthropic } = require('@ai-sdk/anthropic');
        return anthropic(model);
      }
      case 'openai': {
        const { openai } = require('@ai-sdk/openai');
        return openai(model);
      }
      default:
        return google(model);
    }
  }

  export const aiModel = createAIModel();
  export { provider as currentProvider, model as currentModel };
  ```

- [ ] **3.3** `.env.example`에 AI 환경변수 추가
  ```env
  # === AI Layer (INFRA-005, CON-13/14) ===
  AI_PROVIDER=google                          # google | anthropic | openai
  AI_MODEL=gemini-2.0-flash-exp               # 모델명
  GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
  # ANTHROPIC_API_KEY=your-anthropic-key      # provider 교체 시 활성화
  # OPENAI_API_KEY=your-openai-key            # provider 교체 시 활성화
  ```

- [ ] **3.4** `lib/ai/schemas.ts`에 Zod 기반 구조화 출력 스키마 정의
  ```typescript
  // lib/ai/schemas.ts
  import { z } from 'zod';

  /** CMD-DIAG-003 스코어링 엔진에서 사용할 출력 스키마 */
  export const scoringResultSchema = z.object({
    score: z.number().min(0).max(100).describe('동네 종합 적합도 점수 (0~100)'),
    rationale: z.string().describe('점수 근거 설명 (한국어, 2~3문장)'),
    highlights: z.array(z.string()).min(1).max(5).describe('주요 장점 리스트'),
    concerns: z.array(z.string()).max(3).describe('주의 사항 리스트'),
  });

  /** 동네 추천 요약 출력 스키마 */
  export const neighborhoodSummarySchema = z.object({
    summary: z.string().describe('동네 한 줄 요약 (한국어)'),
    commuteAnalysis: z.string().describe('통근 분석 요약'),
    lifestyleMatch: z.string().describe('라이프스타일 적합도 설명'),
  });

  export type ScoringResult = z.infer<typeof scoringResultSchema>;
  export type NeighborhoodSummary = z.infer<typeof neighborhoodSummarySchema>;
  ```

- [ ] **3.5** `lib/ai/prompts.ts`에 시스템 프롬프트 정의 (Hallucination 방지)
  ```typescript
  // lib/ai/prompts.ts
  export const SCORING_SYSTEM_PROMPT = `
당신은 한국 수도권 부동산 전문가입니다.
사용자의 두 직장 위치와 후보 동네 데이터를 기반으로 동네 적합도를 평가합니다.

규칙:
1. 제공된 데이터만 사용하세요. 데이터에 없는 정보를 추측하지 마세요.
2. 점수는 0~100 사이 정수로 반환하세요.
3. 근거는 반드시 입력 데이터에 기반해야 합니다.
4. 한국어로 응답하세요.
5. 통근 시간이 길수록 점수가 낮아야 합니다.
`.trim();

  export const SUMMARY_SYSTEM_PROMPT = `
당신은 부동산 리포트 작성 전문가입니다.
후보 동네의 핵심 정보를 간결하게 요약합니다.

규칙:
1. 1~2문장으로 요약하세요.
2. 수치 데이터가 있으면 반드시 포함하세요.
3. 주관적 판단을 최소화하세요.
`.trim();
  ```

- [ ] **3.6** `lib/ai/generate.ts`에 generateObject 래퍼 함수 작성
  ```typescript
  // lib/ai/generate.ts
  import { generateObject } from 'ai';
  import { aiModel } from './client';
  import { scoringResultSchema, neighborhoodSummarySchema, type ScoringResult, type NeighborhoodSummary } from './schemas';
  import { SCORING_SYSTEM_PROMPT, SUMMARY_SYSTEM_PROMPT } from './prompts';
  import * as Sentry from '@sentry/nextjs';

  const AI_TIMEOUT_MS = 8000; // REQ-NF-001: p95 ≤ 8,000ms

  export async function generateScoring(prompt: string): Promise<ScoringResult> {
    try {
      const result = await generateObject({
        model: aiModel,
        schema: scoringResultSchema,
        system: SCORING_SYSTEM_PROMPT,
        prompt,
        maxRetries: 1,
      });

      // 토큰 사용량 로깅
      if (result.usage) {
        console.log(`[AI] tokens: prompt=${result.usage.promptTokens}, completion=${result.usage.completionTokens}`);
      }

      return result.object;
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'ai', action: 'generateScoring' } });
      throw error;
    }
  }

  export async function generateSummary(prompt: string): Promise<NeighborhoodSummary> {
    try {
      const result = await generateObject({
        model: aiModel,
        schema: neighborhoodSummarySchema,
        system: SUMMARY_SYSTEM_PROMPT,
        prompt,
        maxRetries: 1,
      });
      return result.object;
    } catch (error) {
      Sentry.captureException(error, { tags: { domain: 'ai', action: 'generateSummary' } });
      throw error;
    }
  }
  ```

- [ ] **3.7** `lib/ai/fallback.ts`에 AI 호출 실패 시 fallback 정책 구현
  ```typescript
  // lib/ai/fallback.ts
  import type { ScoringResult } from './schemas';

  /**
   * AI 호출 실패 시 통근시간 기반 정렬로 fallback (CMD-DIAG-003에서 활용)
   * - 통근 시간이 짧을수록 높은 점수
   * - AI 없이도 기본 스코어링 가능
   */
  export function fallbackScoring(
    commuteTimeA: number, // 분
    commuteTimeB: number  // 분
  ): ScoringResult {
    const avgCommute = (commuteTimeA + commuteTimeB) / 2;
    const score = Math.max(0, Math.min(100, Math.round(100 - avgCommute)));
    return {
      score,
      rationale: `AI 분석을 일시적으로 사용할 수 없어 통근 시간 기반으로 산출했습니다. 평균 통근 시간: ${avgCommute}분`,
      highlights: [`평균 통근 시간 ${avgCommute}분`],
      concerns: ['AI 분석 미적용 — 재진단 시 상세 분석 제공'],
    };
  }
  ```

- [ ] **3.8** `__tests__/ai/client.spec.ts`에 provider 분기 테스트 (Vitest)
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest';

  describe('AI Client provider 분기', () => {
    beforeEach(() => { vi.resetModules(); });

    it('AI_PROVIDER=google → Google Gemini 모델 생성', async () => {
      vi.stubEnv('AI_PROVIDER', 'google');
      vi.stubEnv('AI_MODEL', 'gemini-2.0-flash-exp');
      const { currentProvider } = await import('@/lib/ai/client');
      expect(currentProvider).toBe('google');
    });

    it('AI_PROVIDER 미설정 → 기본 google', async () => {
      vi.stubEnv('AI_PROVIDER', '');
      const { currentProvider } = await import('@/lib/ai/client');
      expect(currentProvider).toBe('google');
    });

    it('AI_PROVIDER=anthropic → Anthropic 모델 생성', async () => {
      vi.stubEnv('AI_PROVIDER', 'anthropic');
      vi.stubEnv('AI_MODEL', 'claude-3-haiku-20240307');
      const { currentProvider } = await import('@/lib/ai/client');
      expect(currentProvider).toBe('anthropic');
    });
  });
  ```

- [ ] **3.9** `__tests__/ai/generate.spec.ts`에 generateObject 구조화 출력 테스트
  ```typescript
  describe('generateScoring', () => {
    it('구조화된 ScoringResult 스키마에 맞는 출력 반환', async () => {
      // Mock: ai/generateObject를 모킹하여 Zod 스키마 검증
      const mockResult = { score: 85, rationale: '통근 편의성 우수', highlights: ['지하철 도보 5분'], concerns: [] };
      // ... 모킹 + 검증
    });

    it('AI 호출 실패 시 Sentry.captureException 호출', async () => {
      // ... Sentry 모킹 + 에러 시나리오
    });
  });
  ```

- [ ] **3.10** `__tests__/ai/fallback.spec.ts`에 fallback 정책 테스트
  ```typescript
  import { fallbackScoring } from '@/lib/ai/fallback';

  describe('fallbackScoring', () => {
    it('통근시간 30분+30분 → 점수 70', () => {
      const result = fallbackScoring(30, 30);
      expect(result.score).toBe(70);
      expect(result.rationale).toContain('통근 시간 기반');
    });

    it('점수 0~100 범위 보장', () => {
      expect(fallbackScoring(200, 200).score).toBe(0);
      expect(fallbackScoring(0, 0).score).toBe(100);
    });
  });
  ```

- [ ] **3.11** v1.3 정합성 검증
  ```bash
  grep -ri "NextAuth\|payment\|AES\|bcrypt" lib/ai/  # → 0건
  ```

- [ ] **3.12** 비용·Rate Limit 모니터링 구조 문서화
  ```markdown
  # docs/ai-cost-policy.md
  ## Gemini Free Tier 제한
  - 60 requests/minute, 1,500 requests/day
  - Input: $0 (free), Output: $0 (free) — gemini-2.0-flash-exp
  ## 비용 임계치 모니터링
  - 토큰 사용량 console.log 로깅 (MVP)
  - MON-001 Sentry 통합 후 비용 임계치 알림 자동화 가능
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** AI_PROVIDER=google → Gemini 모델로 구조화 출력 생성
- **Given** `AI_PROVIDER=google`, `AI_MODEL=gemini-2.0-flash-exp`, `GOOGLE_GENERATIVE_AI_API_KEY` 설정
- **When** `generateScoring(prompt)` 호출
- **Then** `ScoringResult` 스키마에 맞는 JSON 반환 (score: 0~100, rationale: string, highlights: string[])

**AC-2 (정상):** AI_PROVIDER=anthropic → Claude 모델로 분기
- **Given** `AI_PROVIDER=anthropic`, `AI_MODEL=claude-3-haiku-20240307`, `ANTHROPIC_API_KEY` 설정
- **When** `createAIModel()` 호출
- **Then** Anthropic provider 인스턴스 생성, `currentProvider === 'anthropic'`

**AC-3 (예외):** AI 호출 실패 시 fallback 동작
- **Given** AI API 호출이 타임아웃 또는 에러 발생
- **When** `generateScoring()` 실패 후 `fallbackScoring(commuteA, commuteB)` 호출
- **Then** 통근시간 기반 `ScoringResult` 반환, `rationale`에 "통근 시간 기반" 포함

**AC-4 (경계):** Zod 스키마 검증 실패 → 에러
- **Given** AI가 스키마에 맞지 않는 응답 반환 (예: score가 200)
- **When** `generateObject` 내부에서 Zod 검증 수행
- **Then** Zod validation error 발생, Sentry에 기록

**AC-5 (보안/모니터링):** AI 호출 실패 시 Sentry 에러 추적
- **Given** AI API 호출 실패
- **When** catch 블록에서 `Sentry.captureException` 호출
- **Then** Sentry 이벤트에 `tags.domain=ai`, `tags.action=generateScoring` 포함

**AC-6 (경계):** 환경변수 미설정 시 기본 provider 사용
- **Given** `AI_PROVIDER` 환경변수 미설정
- **When** `lib/ai/client.ts` 모듈 로드
- **Then** `currentProvider === 'google'`, `currentModel === 'gemini-2.0-flash-exp'`

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "교차 계산 응답 시간 — p95 ≤ 8,000ms" (§4.2.1) | `AI_TIMEOUT_MS = 8000` 상수로 타임아웃 제한. fallback 정책으로 AI 실패 시에도 결과 반환 보장 |
| CON-13 | "LLM 오케스트레이션은 Vercel AI SDK를 사용하여 Next.js 내부에서 직접 구현한다." (§1.2.3) | `ai` + `@ai-sdk/google` 패키지 사용. Server Action 내에서 직접 호출 |
| CON-14 | "환경 변수 설정만으로 모델 교체가 가능하도록 SDK 표준 인터페이스를 준수한다." (§1.2.3) | `AI_PROVIDER` + `AI_MODEL` 환경변수로 google/anthropic/openai 분기 |
| REQ-NF-024 | "월 인프라 비용 — 무료 ~ 10만원 이하" (§4.2.4) | Gemini Free Tier (60 req/min, 1,500 req/day) 사용. 비용 0원 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/ai/client.ts` (환경변수 기반 provider 분기)
- `lib/ai/schemas.ts` (Zod 구조화 출력 스키마)
- `lib/ai/prompts.ts` (시스템 프롬프트 — Hallucination 방지)
- `lib/ai/generate.ts` (generateObject 래퍼 + Sentry 에러 추적)
- `lib/ai/fallback.ts` (통근시간 기반 fallback 스코어링)
- `.env.example` 확장 (AI_PROVIDER, AI_MODEL, GOOGLE_GENERATIVE_AI_API_KEY)
- `docs/ai-cost-policy.md` (비용·Rate Limit 정책)
- `__tests__/ai/client.spec.ts` (provider 분기 테스트)
- `__tests__/ai/generate.spec.ts` (구조화 출력 테스트)
- `__tests__/ai/fallback.spec.ts` (fallback 정책 테스트)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **INFRA-001 ✅:** Next.js 프로젝트 + `package.json`

### 후행:
- **CMD-DIAG-003 (스코어링 엔진):** 본 ISSUE의 `generateScoring()` + `fallbackScoring()` 활용하여 AI 기반 동네 스코어링 구현

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/ai/client.spec.ts` — Vitest 3개 (google/anthropic/기본값)
- **단위 테스트:** `__tests__/ai/generate.spec.ts` — Vitest 2개 (구조화 출력, Sentry 호출)
- **단위 테스트:** `__tests__/ai/fallback.spec.ts` — Vitest 2개 (점수 계산, 범위 보장)
- **통합 테스트 (개발 단계):** 실제 Gemini API 호출로 `generateScoring` 동작 확인
- **타입 검증:** `npx tsc --noEmit` 통과
- **정적 검증:** `grep -ri "NextAuth\|payment" lib/ai/` → 0건

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **비용 임계치 알림 자동화:** MVP에서는 토큰 사용량 console.log 로깅. MON-001 Sentry 통합 후 비용 임계치 초과 시 Sentry 알림 자동화 가능 — 별도 follow-up.
2. **fallback 정책 세부:** AI 실패 시 통근시간 기반 fallback은 최소 기능. CMD-DIAG-003 구현 시 fallback 로직 상세 설계.
3. **Gemini Free Tier 제한:** 60 req/min, 1,500 req/day. MVP 트래픽(50건/주)에서 충분. 확장 시 유료 전환 또는 provider 교체.
4. **Streaming 지원:** 현재 `generateObject`는 non-streaming. CMD-DIAG-003에서 UX 향상을 위해 `streamObject`로 전환 검토 가능.
5. **토큰 사용량 DB 저장:** MVP에서는 console.log만. 향후 토큰 사용량을 DB에 저장하여 비용 분석 대시보드 구축 가능.
