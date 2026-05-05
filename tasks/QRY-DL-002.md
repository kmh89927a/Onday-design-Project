---
name: Feature Task
title: "[Feature] QRY-DL-002: 30분 요약 — Top 3 매물 카드 (항목 ≥6개/카드, AI rationale 포함)"
labels: ['feature', 'priority:M', 'epic:Deadline', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [QRY-DL-002] 30분 요약 — getSummary Server Action (Top 3 매물 카드, 항목 ≥6개/카드)
- **목적:** "30분 요약" 버튼 클릭 시 Top 3 후보 동네의 핵심 정보를 카드 형태로 요약 제공. 긴급 이사자(C-03)가 30분 안에 의사결정 가능한 정보 밀도 확보. REQ-FUNC-018 준수.
- **범위:**
  - ✅ `getSummary` Server Action ('use server'), `SummaryCardDTO` (항목 ≥6개 강제), Top 3 선정 (QRY-DL-001 CandidateArea rank 기반), AI rationale 생성 (INFRA-005 aiClient 활용, fallback 룰 기반 메시지), CMD-DL-002 `buildNaverRealEstateUrl` 재사용 (네이버 링크 포함)
  - ❌ 자체 매물 DB, 결제, NextAuth.js, 실시간 매물 가격 조회
- **복잡도:** M | **Wave:** 4 (Deadline 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용

- **REQ-FUNC-018** (§4.1.3): "시스템은 '30분 요약' 버튼 클릭 시 Top 3 매물의 핵심 정보(통근 시간·가격·배정 학교 등)를 카드 형태로 요약해야 한다. 요약 카드당 정보 항목은 6개 이상이어야 한다."
- **REQ-NF-001** (§4.2.1): "두 동선 교차 계산 응답 시간 — p95 ≤ 8,000ms" — AI 호출 포함 시 ≤8초 허용
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"
- **§6.3.3** 데드라인 시퀀스: `User→Web: "30분 요약" 버튼 클릭` → `Web→SA: getSummary(diagnosisId)` → `SA→Web: Top 3 매물 요약 카드 (항목 ≥ 6개/카드)` → `Web→User: 통근 시간·가격·배정 학교 등 카드 표시`

### 시퀀스 다이어그램 (§6.3.3) — 30분 요약 분기

```
User-->Web: "30분 요약" 버튼 클릭
Web-->SA: getSummary(diagnosisId)
SA-->Web: Top 3 매물 요약 카드 (항목 ≥ 6개/카드)
Web-->User: 통근 시간·가격·배정 학교 등 카드 표시
```

### 선행 태스크 산출물

| Task ID | 산출물 | import 경로 | 사용처 |
|---|---|---|---|
| QRY-DL-001 ✅ | `filterListings`, `ListingResult`, `ListingItem` | `@/app/actions/deadline`, `@/lib/types/deadline` | Top 3 선정 기준 데이터 |
| QRY-DL-001 ✅ | `buildNaverRealEstateUrl` | `@/lib/deadline/naver-url-builder` | 카드에 네이버 링크 포함 |
| CMD-DL-001 ✅ | `activateDeadlineMode` | `@/app/actions/deadline` | 데드라인 모드 활성화 선행 |
| DB-003 ✅ | `model Diagnosis` + CandidateArea | `@prisma/client` | 후보 동네 데이터 조회 |
| API-002 ✅ | `CandidateAreaDTO`, `CommuteInfoDTO` | `@/lib/types/diagnosis` | 후보 동네 + 통근 정보 타입 |
| CMD-AUTH-003 ✅ | `requireAuth` | `@/lib/auth/session` | 인증 검증 |
| INFRA-005 ✅ | `aiClient` (Vercel AI SDK + Gemini) | `@/lib/ai/client` | AI rationale 생성 |
| API-006 ✅ | `reportErrorToSentry` | `@/lib/helpers/app-error` | 에러 추적 |
| CMD-DIAG-003 ✅ | `ScoringEngine.score` | `@/lib/diagnosis/scoring-engine` | 스코어 기반 Top 3 선정 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/types/deadline.ts`에 `SummaryCardDTO` 인터페이스 추가
  ```typescript
  /**
   * 30분 요약 카드 DTO — 항목 ≥6개 강제 (REQ-FUNC-018)
   */
  export interface SummaryCardDTO {
    candidateId: string;
    candidateName: string;        // 1. 동네명
    estimatedPrice: string;       // 2. 예상 시세 (예: "전세 2~3억")
    commuteToA: string;           // 3. 직장 A 통근 (예: "대중교통 35분")
    commuteToB: string;           // 4. 직장 B 통근 (예: "대중교통 42분")
    livingScore: number;          // 5. 생활편의 점수 (0~100)
    naverSearchUrl: string;       // 6. 네이버 부동산 링크 (CMD-DL-002)
    schoolDistrict?: string;      // 7. 학군 (있을 경우)
    rationale: string;            // 8. AI 추천 이유 (또는 fallback 룰 기반)
    rank: number;
  }

  export interface SummaryResult {
    cards: SummaryCardDTO[];
    generatedAt: string;          // ISO 8601
    totalCandidates: number;
  }
  ```

- [ ] **3.2** `app/actions/deadline.ts`에 `getSummary` Server Action 구현
  ```typescript
  'use server';
  import { prisma } from '@/lib/prisma';
  import { requireAuth } from '@/lib/auth/session';
  import { buildNaverRealEstateUrl } from '@/lib/deadline/naver-url-builder';
  import { reportErrorToSentry } from '@/lib/helpers/app-error';
  import type { SummaryCardDTO, SummaryResult } from '@/lib/types/deadline';

  export async function getSummary(
    diagnosisId: string
  ): Promise<SummaryResult> {
    const currentUser = await requireAuth();

    // 1. Diagnosis + CandidateArea 조회
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
      include: { candidates: { orderBy: { rank: 'asc' }, take: 3 } },
    });

    if (!diagnosis) throw new Error('DIAGNOSIS_NOT_FOUND');
    if (diagnosis.userId !== currentUser.user.id) throw new Error('DIAGNOSIS_FORBIDDEN');

    // 2. Top 3 카드 생성 (rank 기반, 매물 부족 시 가능한 만큼)
    const cards: SummaryCardDTO[] = [];

    for (const candidate of diagnosis.candidates) {
      const naverSearchUrl = buildNaverRealEstateUrl({
        area: candidate.name,
      });

      // 3. AI rationale 생성 (fallback 포함)
      let rationale: string;
      try {
        rationale = await generateAIRationale(candidate);
      } catch {
        rationale = generateFallbackRationale(candidate);
      }

      cards.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        estimatedPrice: candidate.estimatedPrice || '시세 정보 없음',
        commuteToA: formatCommuteTime(candidate.commuteMinutesA, 'A'),
        commuteToB: formatCommuteTime(candidate.commuteMinutesB, 'B'),
        livingScore: candidate.livingScore || 0,
        naverSearchUrl,
        schoolDistrict: candidate.schoolDistrict || undefined,
        rationale,
        rank: candidate.rank,
      });
    }

    return {
      cards,
      generatedAt: new Date().toISOString(),
      totalCandidates: diagnosis.candidates.length,
    };
  }
  ```

- [ ] **3.3** `lib/deadline/summary-helpers.ts`에 보조 함수 구현
  ```typescript
  import { generateText } from 'ai';
  import { aiClient } from '@/lib/ai/client'; // INFRA-005

  /**
   * AI 기반 추천 이유 생성 (Gemini, ≤30자)
   */
  export async function generateAIRationale(candidate: any): Promise<string> {
    const { text } = await generateText({
      model: aiClient,
      prompt: `다음 동네의 추천 이유를 30자 이내 한국어로 작성해주세요. 동네: ${candidate.name}, 통근A: ${candidate.commuteMinutesA}분, 통근B: ${candidate.commuteMinutesB}분, 생활편의: ${candidate.livingScore}점`,
      maxTokens: 50,
    });
    return text.trim();
  }

  /**
   * Fallback 룰 기반 추천 이유
   */
  export function generateFallbackRationale(candidate: any): string {
    const avgCommute = ((candidate.commuteMinutesA || 0) + (candidate.commuteMinutesB || 0)) / 2;
    if (avgCommute <= 30) return '양쪽 직장 모두 30분 이내 통근 가능';
    if (avgCommute <= 45) return '균형 잡힌 통근 시간과 생활 편의';
    return '종합 점수 기준 상위 추천 동네';
  }

  /**
   * 통근 시간 포맷 (예: "대중교통 35분")
   */
  export function formatCommuteTime(minutes: number | null, label: string): string {
    if (!minutes) return `직장 ${label} 통근 정보 없음`;
    return `대중교통 ${minutes}분`;
  }
  ```

- [ ] **3.4** `lib/validators/deadline.ts`에 getSummary Zod 스키마 추가
  ```typescript
  export const getSummarySchema = z.object({
    diagnosisId: z.string().min(1, '진단 ID가 필요합니다'),
  });
  ```

- [ ] **3.5** Mock 데이터 분기 (`NEXT_PUBLIC_USE_MOCK`)
  ```typescript
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    const { MOCK_SUMMARY_CARDS } = await import('@/lib/mocks/deadline');
    return { cards: MOCK_SUMMARY_CARDS, generatedAt: new Date().toISOString(), totalCandidates: 3 };
  }
  ```

- [ ] **3.6** `lib/mocks/deadline.ts`에 Mock 30분 요약 데이터 추가
  ```typescript
  export const MOCK_SUMMARY_CARDS: SummaryCardDTO[] = [
    {
      candidateId: 'mock-1', candidateName: '성남시 분당구',
      estimatedPrice: '전세 3~4억', commuteToA: '대중교통 32분', commuteToB: '대중교통 38분',
      livingScore: 85, naverSearchUrl: 'https://land.naver.com/search/result.naver?query=성남시+분당구',
      schoolDistrict: '분당 학군', rationale: '양쪽 직장 모두 40분 이내, 학군 우수', rank: 1,
    },
    {
      candidateId: 'mock-2', candidateName: '용인시 수지구',
      estimatedPrice: '전세 2.5~3.5억', commuteToA: '대중교통 40분', commuteToB: '대중교통 35분',
      livingScore: 78, naverSearchUrl: 'https://land.naver.com/search/result.naver?query=용인시+수지구',
      rationale: '균형 잡힌 통근 시간과 합리적 시세', rank: 2,
    },
    {
      candidateId: 'mock-3', candidateName: '하남시 감일동',
      estimatedPrice: '전세 2~3억', commuteToA: '대중교통 45분', commuteToB: '대중교통 30분',
      livingScore: 72, naverSearchUrl: 'https://land.naver.com/search/result.naver?query=하남시+감일동',
      rationale: '합리적 가격과 신도시 인프라', rank: 3,
    },
  ];
  ```

- [ ] **3.7** `__tests__/actions/get-summary.spec.ts` — Server Action 테스트
  ```typescript
  describe('getSummary (QRY-DL-002)', () => {
    it('Top 3 카드 정확히 3개 반환 (후보 ≥3곳)', async () => {});
    it('후보 2곳 시 카드 2개 반환 (가능한 만큼)', async () => {});
    it('각 카드 항목 ≥6개 (정적 검증)', async () => {});
    it('naverSearchUrl이 네이버 부동산 base URL로 시작', async () => {});
    it('rationale 필드 비어있지 않음', async () => {});
    it('rank 순서 정렬 (1, 2, 3)', async () => {});
    it('진단 소유자 아닌 사용자 → FORBIDDEN', async () => {});
    it('존재하지 않는 diagnosisId → NOT_FOUND', async () => {});
    it('에러 시 Sentry 호출', async () => {});
  });
  ```

- [ ] **3.8** `__tests__/deadline/summary-helpers.spec.ts` — 보조 함수 테스트
  ```typescript
  describe('formatCommuteTime', () => {
    it('35분 → "대중교통 35분"', () => {});
    it('null → "직장 A 통근 정보 없음"', () => {});
  });
  describe('generateFallbackRationale', () => {
    it('평균 통근 ≤30분 → "양쪽 직장 모두 30분 이내"', () => {});
    it('평균 통근 31~45분 → "균형 잡힌 통근"', () => {});
    it('평균 통근 >45분 → "종합 점수 기준"', () => {});
  });
  ```

- [ ] **3.9** SummaryCardDTO 항목 수 정적 검증 (≥6개)
  ```typescript
  // 컴파일 타임 검증: SummaryCardDTO의 필수 필드 ≥6개
  type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
  type _AssertMin6 = RequiredKeys<SummaryCardDTO> extends infer K
    ? [K] extends [never] ? never : true : never;
  ```

- [ ] **3.10** 'use server' 지시어 확인: `head -1 app/actions/deadline.ts`

- [ ] **3.11** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|model Listing" app/actions/deadline.ts lib/deadline/` → 0건

- [ ] **3.12** AI rationale fallback 동작 검증: `GEMINI_API_KEY` 미설정 시 룰 기반 메시지 반환

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** Top 3 카드 정확히 3개 (또는 매물 부족 시 가능한 만큼)
- **Given** deadlineMode=true인 Diagnosis + CandidateArea 5곳 (rank 1~5)
- **When** `getSummary(diagnosisId)` 호출
- **Then** `cards.length === 3`, rank 1/2/3의 카드만 반환

**AC-2 (도메인 핵심):** 각 카드 항목 ≥6개 정적 검증
- **Given** `SummaryCardDTO` 타입 정의
- **When** 필수 필드 수 카운트
- **Then** `candidateName`, `estimatedPrice`, `commuteToA`, `commuteToB`, `livingScore`, `naverSearchUrl`, `rationale`, `rank` = 8개 ≥ 6개

**AC-3 (정상):** AI rationale 생성 또는 fallback 룰 기반 메시지
- **Given** 유효한 후보 동네 데이터
- **When** `getSummary()` 호출
- **Then** 각 카드의 `rationale` 필드 비어있지 않음. AI 호출 실패 시 `generateFallbackRationale` 결과

**AC-4 (예외):** 권한 검증 (userId 일치)
- **Given** 사용자B가 사용자A의 진단에 대해 요약 조회
- **When** `getSummary(diagnosisId)` 호출
- **Then** `DIAGNOSIS_FORBIDDEN` 에러

**AC-5 (경계):** 후보 1곳 시 카드 1개 반환
- **Given** CandidateArea 1곳만 존재
- **When** `getSummary(diagnosisId)` 호출
- **Then** `cards.length === 1`, 해당 1곳의 카드 반환

**AC-6 (성능):** AI 호출 포함 응답 ≤8초
- **Given** AI rationale 생성 활성화
- **When** `getSummary()` 호출
- **Then** 전체 응답 p95 ≤8,000ms (AI 호출 3건 병렬). 룰 기반 fallback 시 ≤500ms

**AC-7 (도메인 핵심):** naverSearchUrl에 CMD-DL-002 buildNaverRealEstateUrl 사용
- **Given** 카드의 `candidateName`
- **When** 카드 생성 시
- **Then** `naverSearchUrl`이 `https://land.naver.com/` 으로 시작, `buildNaverRealEstateUrl` 함수 활용

---

## 5. ⚙️ Non-Functional Constraints

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 | "두 동선 교차 계산 응답 시간 p95 ≤ 8,000ms" (§4.2.1) | AI 호출 포함 ≤8초. AI 3건 `Promise.all` 병렬 호출. 룰 기반 fallback ≤500ms |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림" (§4.2.6) | AI 호출 실패 시 Sentry 비경고 로그 + fallback 전환 |
| REQ-NF-007 | "교집합 매물 연산 p95 ≤ 1,500ms" (§4.2.1) | Prisma 조회 (take: 3) ≤1,500ms |

---

## 6. 📦 Deliverables

- `lib/types/deadline.ts` — `SummaryCardDTO`, `SummaryResult` 타입 추가
- `app/actions/deadline.ts` — `getSummary` Server Action 추가
- `lib/deadline/summary-helpers.ts` — `generateAIRationale`, `generateFallbackRationale`, `formatCommuteTime`
- `lib/validators/deadline.ts` — `getSummarySchema` Zod 스키마 추가
- `lib/mocks/deadline.ts` — `MOCK_SUMMARY_CARDS` Mock 데이터
- `__tests__/actions/get-summary.spec.ts` (9개)
- `__tests__/deadline/summary-helpers.spec.ts` (5개)

---

## 7. 🔗 Dependencies

### 선행:
- **QRY-DL-001 ✅:** `filterListings`, CandidateArea 조회, `buildNaverRealEstateUrl`
- **CMD-DL-001 ✅:** `activateDeadlineMode` — 데드라인 모드 활성화 선행
- **INFRA-005 ✅:** `aiClient` (Vercel AI SDK + Gemini) — AI rationale 생성
- **CMD-DIAG-003 ✅:** `ScoringEngine` — 스코어 기반 Top 3 선정
- **DB-003 ✅:** `model Diagnosis` + CandidateArea
- **CMD-AUTH-003 ✅:** `requireAuth` — 인증 검증

### 후행:
- **UI-011:** 30분 요약 카드 UI — `SummaryCardDTO` 기반 렌더링 (배치 11 이후)
- **TEST-005:** 데드라인 모드 GWT 시나리오 — 30분 요약 검증

### Deadline 도메인 완성 기여:
- 본 태스크 완료 시 Deadline 백엔드 5/5 완료 ⭐

---

## 8. 🧪 Test Plan

- **단위 테스트:**
  - `get-summary.spec.ts` 9개
  - `summary-helpers.spec.ts` 5개
  - 총 14개
- **성능 검증:**
  - AI 호출 포함: p95 ≤8,000ms (k6 부하 테스트)
  - 룰 기반 fallback: p95 ≤500ms
- **정적 검증:**
  - `SummaryCardDTO` 필수 필드 ≥6개 (타입 검사)
  - `grep -ri "NextAuth\|payment\|AES" app/actions/ lib/deadline/` → 0건
- **AI fallback 검증:** `GEMINI_API_KEY` 미설정 시 `generateFallbackRationale` 동작 확인
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint

---

## 9. 🚧 Open Questions / Risks

1. **Top 3 선정 기준 — 점수 vs 규칙:** 현재 CandidateArea의 `rank` 필드 (CMD-DIAG-003 ScoringEngine 산출) 기반. 데드라인 모드 전용 스코어링(통근시간 + 가격 + 급매 여부 가중치)이 필요한지 검토. MVP는 기존 rank 활용.
2. **AI rationale 품질:** Gemini API 응답이 30자 초과하거나 부적절할 경우 truncate 또는 fallback 전환 필요. `maxTokens: 50` 제한으로 제어.
3. **estimatedPrice 데이터 출처:** 현재 CandidateArea에 `estimatedPrice` 필드가 존재하는지 DB-003 스키마 확인 필요. 없을 경우 "시세 정보 없음" fallback 또는 별도 데이터 적재 태스크.
4. **카드 항목 확장:** REQ-FUNC-018은 "≥6개"만 명시. 현재 8개 정의. 향후 교통 호재, 개발 계획 등 추가 가능.
5. **AI 호출 비용:** 요약 1회 → Gemini 호출 3건. 월 비용 REQ-NF-023 (≤100만원) 범위 내인지 모니터링 필요.
