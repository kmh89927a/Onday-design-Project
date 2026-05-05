---
name: Feature Task
title: "[Feature] CMD-DL-003: 급매 매물 0건 시 조건 완화 제안 + 신규 급매 푸시 알림 구독 처리"
labels: ['feature', 'priority:M', 'epic:Deadline', 'wave:4']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-DL-003] 급매 매물 0건 시 조건 완화 제안 + 신규 급매 푸시 알림 구독 처리
- **목적:** QRY-DL-001 매물 조회 결과 0건일 때 사용자에게 조건 완화 제안(≥3개 패턴: 가격, 지역, 평수)을 ≤1초 이내에 제공하고, 신규 급매 푸시 알림 구독 의도를 DB에 저장한다. 긴급 이사자(C-03)의 탐색 실패 경험을 방지.
- **범위:**
  - ✅ `suggestRelaxedFilters` Server Action (룰 기반, ≤1초), 조건 완화 3가지 패턴 (가격 +20%, 인근 동네 반경 +1km, 평수 ±10평), `subscribeToListingAlerts` Server Action (DB 구독 저장), `RelaxedFilterSuggestion` DTO
  - ❌ 실제 푸시 알림 발송 구현(별도 태스크), AI 기반 조건 완화(MVP는 룰 기반), 자체 매물 DB, 결제, NextAuth.js
- **복잡도:** M | **Wave:** 4 (Deadline 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용

- **REQ-FUNC-019** (§4.1.3): "시스템은 데드라인 모드에서 교집합 급매 매물이 0건인 경우, '현재 조건의 급매가 없습니다' 안내와 함께 ① 인근 동 반경 확장 제안, ② 조건 완화 슬라이더, ③ 신규 급매 푸시 알림 구독 옵션을 1초 이내에 표시해야 한다. 알림 구독 전환율을 Mixpanel로 추적해야 한다."
- **REQ-NF-001 변형** (§4.2.1): 조건 완화 제안 응답 ≤1초
- **REQ-NF-035** (§4.2.6): "에러 로그 알림 — Sentry 기본 알림 설정 사용"
- **§6.3.3** 데드라인 시퀀스: `SA→Web: (listings: [], suggestions: [...])` → `Web→User: ① 인근 동 반경 확장 제안 ② 조건 완화 슬라이더 ③ 신규 급매 푸시 알림 구독 옵션`

### 시퀀스 다이어그램 (§6.3.3) — 매물 0건 분기

```
alt 교집합 매물 0건
    SA-->Web: (listings: [], suggestions: [...])
    Web-->User: "현재 조건의 급매가 없습니다" (≤ 1초)
    Web-->User: ① 인근 동 반경 확장 제안
    Web-->User: ② 조건 완화 슬라이더
    Web-->User: ③ 신규 급매 푸시 알림 구독 옵션

    alt 알림 구독 선택
        User-->Web: 푸시 알림 구독
        Web-->SA: subscribePush(diagnosisId, filters)
        SA-->Prisma: 구독 정보 저장
        Web-->Mixpanel: track("deadline_push_subscribed")
    end
end
```

### 선행 태스크 산출물

| Task ID | 산출물 | import 경로 | 사용처 |
|---|---|---|---|
| QRY-DL-001 ✅ | `filterListings`, `ListingResult`, `ListingFilters` | `@/app/actions/deadline`, `@/lib/types/deadline` | 0건 판정 기준 |
| CMD-DL-001 ✅ | `activateDeadlineMode` | `@/app/actions/deadline` | 데드라인 모드 활성화 선행 |
| DB-003 ✅ | `model Diagnosis` | `@prisma/client` | 구독 정보 저장 대상 |
| API-002 ✅ | `DiagnosisFilters` | `@/lib/types/diagnosis` | 필터 타입 |
| API-006 ✅ | `createAppError`, `reportErrorToSentry` | `@/lib/helpers/app-error` | 에러 처리 |
| CMD-AUTH-003 ✅ | `requireAuth` | `@/lib/auth/session` | 인증 검증 |
| INFRA-005 ✅ | `aiClient` | `@/lib/ai/client` | AI 기반 확장 시 활용 (MVP는 미사용) |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/types/deadline.ts`에 조건 완화 제안 DTO 추가
  ```typescript
  export type RelaxedFilterType = 'priceMax' | 'areaRadius' | 'areaSize';

  export interface RelaxedFilterSuggestion {
    type: RelaxedFilterType;
    original: number;
    suggested: number;
    message: string;
    unit: string;         // '만원', 'km', '평'
  }

  export interface AlertSubscriptionConfig {
    frequency: 'daily' | 'weekly';
    minDiscount?: number; // 급매 할인율 기준 (%)
    filters: ListingFilters;
  }

  export interface AlertSubscriptionResult {
    subscriptionId: string;
    diagnosisId: string;
    createdAt: string;
  }
  ```

- [ ] **3.2** `app/actions/deadline.ts`에 `suggestRelaxedFilters` Server Action 구현
  ```typescript
  'use server';
  import { requireAuth } from '@/lib/auth/session';
  import { reportErrorToSentry } from '@/lib/helpers/app-error';
  import type { ListingFilters, RelaxedFilterSuggestion } from '@/lib/types/deadline';

  /**
   * 급매 매물 0건 시 조건 완화 제안 ≥3개 생성 (룰 기반, ≤1초)
   * REQ-FUNC-019: 가격/지역/평수 3가지 패턴
   */
  export async function suggestRelaxedFilters(
    diagnosisId: string,
    currentFilters: ListingFilters
  ): Promise<RelaxedFilterSuggestion[]> {
    await requireAuth();
    const suggestions: RelaxedFilterSuggestion[] = [];

    try {
      // 1. 가격 +20% 완화
      if (currentFilters.priceMax) {
        const suggestedPrice = Math.ceil(currentFilters.priceMax * 1.2);
        suggestions.push({
          type: 'priceMax',
          original: currentFilters.priceMax,
          suggested: suggestedPrice,
          message: `가격 상한을 ${currentFilters.priceMax.toLocaleString()}만원 → ${suggestedPrice.toLocaleString()}만원으로 완화`,
          unit: '만원',
        });
      } else {
        suggestions.push({
          type: 'priceMax',
          original: 0,
          suggested: 30000,
          message: '가격 상한을 3억원으로 설정해보세요',
          unit: '만원',
        });
      }

      // 2. 인근 동네 추가 (반경 +1km)
      suggestions.push({
        type: 'areaRadius',
        original: 0,
        suggested: 1,
        message: '인근 동네로 검색 반경을 1km 확장',
        unit: 'km',
      });

      // 3. 평수/면적 완화 (±10평)
      if (currentFilters.areaMin && currentFilters.areaMin > 10) {
        const suggestedArea = Math.max(0, currentFilters.areaMin - 10);
        suggestions.push({
          type: 'areaSize',
          original: currentFilters.areaMin,
          suggested: suggestedArea,
          message: `최소 면적을 ${currentFilters.areaMin}m² → ${suggestedArea}m²로 완화`,
          unit: 'm²',
        });
      } else {
        suggestions.push({
          type: 'areaSize',
          original: 0,
          suggested: 0,
          message: '면적 제한 없이 검색해보세요',
          unit: 'm²',
        });
      }

      return suggestions;
    } catch (error) {
      reportErrorToSentry(error instanceof Error ? error : new Error('RelaxedFilter suggestion failed'));
      throw error;
    }
  }
  ```

- [ ] **3.3** `app/actions/deadline.ts`에 `subscribeToListingAlerts` Server Action 구현
  ```typescript
  'use server';
  import { prisma } from '@/lib/prisma';
  import { requireAuth } from '@/lib/auth/session';
  import { reportErrorToSentry } from '@/lib/helpers/app-error';
  import type { AlertSubscriptionConfig, AlertSubscriptionResult } from '@/lib/types/deadline';

  /**
   * 신규 급매 푸시 알림 구독 — DB 저장만 (발송은 별도 태스크)
   * REQ-FUNC-019: 알림 구독 전환율 Mixpanel 추적
   */
  export async function subscribeToListingAlerts(
    diagnosisId: string,
    alertConfig: AlertSubscriptionConfig
  ): Promise<AlertSubscriptionResult> {
    const currentUser = await requireAuth();

    // 진단 소유자 검증
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
    });
    if (!diagnosis) throw new Error('DIAGNOSIS_NOT_FOUND');
    if (diagnosis.userId !== currentUser.user.id) throw new Error('DIAGNOSIS_FORBIDDEN');

    try {
      // 임시 JSONB 컬럼 — Open Questions에 영구 스키마 follow-up
      const updated = await prisma.diagnosis.update({
        where: { id: diagnosisId },
        data: {
          alertConfigJson: JSON.stringify(alertConfig),
        },
      });

      return {
        subscriptionId: `sub_${diagnosisId}`,
        diagnosisId,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      reportErrorToSentry(error instanceof Error ? error : new Error('Alert subscription failed'));
      throw error;
    }
  }
  ```

- [ ] **3.4** `lib/validators/deadline.ts`에 조건 완화 + 알림 구독 Zod 스키마 추가
  ```typescript
  import { z } from 'zod';

  export const suggestRelaxedFiltersSchema = z.object({
    diagnosisId: z.string().min(1, '진단 ID가 필요합니다'),
    currentFilters: z.object({
      priceMin: z.number().min(0).optional(),
      priceMax: z.number().min(0).optional(),
      roomType: z.enum(['apartment', 'officetel', 'villa', 'all']).optional(),
      areaMin: z.number().min(0).optional(),
      areaMax: z.number().min(0).optional(),
    }),
  });

  export const alertSubscriptionSchema = z.object({
    diagnosisId: z.string().min(1),
    alertConfig: z.object({
      frequency: z.enum(['daily', 'weekly']),
      minDiscount: z.number().min(0).max(100).optional(),
      filters: z.object({
        priceMin: z.number().min(0).optional(),
        priceMax: z.number().min(0).optional(),
        roomType: z.enum(['apartment', 'officetel', 'villa', 'all']).optional(),
        areaMin: z.number().min(0).optional(),
        areaMax: z.number().min(0).optional(),
      }),
    }),
  });
  ```

- [ ] **3.5** `prisma/schema.prisma`에 `alertConfigJson` 필드 추가 (임시 JSONB)
  ```prisma
  model Diagnosis {
    // ... 기존 필드
    alertConfigJson String? @map("alert_config_json") // 임시 JSONB — 영구 스키마 follow-up
  }
  ```

- [ ] **3.6** Mock 데이터 분기 (`NEXT_PUBLIC_USE_MOCK`)
  ```typescript
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return [
      { type: 'priceMax', original: 20000, suggested: 24000, message: '가격 상한을 2억 → 2.4억으로 완화', unit: '만원' },
      { type: 'areaRadius', original: 0, suggested: 1, message: '인근 동네로 검색 반경을 1km 확장', unit: 'km' },
      { type: 'areaSize', original: 60, suggested: 50, message: '최소 면적을 60m² → 50m²로 완화', unit: 'm²' },
    ] as RelaxedFilterSuggestion[];
  }
  ```

- [ ] **3.7** `__tests__/actions/suggest-relaxed-filters.spec.ts` — Server Action 테스트
  ```typescript
  describe('suggestRelaxedFilters (CMD-DL-003)', () => {
    it('0건 시 조건 완화 제안 ≥3개 반환', async () => {});
    it('가격 +20% 완화 제안 포함', async () => {});
    it('인근 동네 반경 확장 제안 포함', async () => {});
    it('평수 완화 제안 포함', async () => {});
    it('priceMax 미설정 시 기본값 3억 제안', async () => {});
    it('응답 ≤1초', async () => {});
    it('에러 시 Sentry 호출', async () => {});
  });
  ```

- [ ] **3.8** `__tests__/actions/subscribe-alerts.spec.ts` — 구독 Server Action 테스트
  ```typescript
  describe('subscribeToListingAlerts (CMD-DL-003)', () => {
    it('정상 구독 → DB 저장 + subscriptionId 반환', async () => {});
    it('진단 소유자 아닌 사용자 → FORBIDDEN', async () => {});
    it('존재하지 않는 diagnosisId → NOT_FOUND', async () => {});
    it('frequency: daily/weekly 정상 저장', async () => {});
    it('에러 시 Sentry 호출', async () => {});
  });
  ```

- [ ] **3.9** `__tests__/validators/deadline-relaxed.spec.ts` — Zod 스키마 테스트
  ```typescript
  describe('suggestRelaxedFiltersSchema', () => {
    it('유효한 입력 → 통과', () => {});
    it('diagnosisId 빈 문자열 → ZodError', () => {});
  });
  describe('alertSubscriptionSchema', () => {
    it('frequency: daily → 통과', () => {});
    it('frequency: hourly (비허용) → ZodError', () => {});
  });
  ```

- [ ] **3.10** 'use server' 지시어 확인: `head -1 app/actions/deadline.ts`

- [ ] **3.11** v1.3 정합성: `grep -ri "NextAuth\|payment\|AES\|model Listing" app/actions/deadline.ts lib/` → 0건

- [ ] **3.12** Prisma 마이그레이션 생성: `npx prisma migrate dev --name add-alert-config-json`

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 0건 시 조건 완화 제안 ≥3개 반환
- **Given** QRY-DL-001 `filterListings` 결과 `listings: []` (0건)
- **When** `suggestRelaxedFilters(diagnosisId, currentFilters)` 호출
- **Then** `RelaxedFilterSuggestion[]` 반환, `length >= 3`, 가격/지역/평수 3가지 type 포함

**AC-2 (성능):** 응답 ≤1초 강제
- **Given** 유효한 입력
- **When** `suggestRelaxedFilters()` 호출
- **Then** 응답 시간 ≤1,000ms. 룰 기반 산술 연산이므로 통상 <500ms

**AC-3 (정상):** 가격 +20% 완화 패턴 정확
- **Given** `currentFilters.priceMax = 20000` (2억)
- **When** `suggestRelaxedFilters()` 호출
- **Then** 제안에 `{ type: 'priceMax', original: 20000, suggested: 24000 }` 포함

**AC-4 (정상):** 알림 구독 → DB 저장
- **Given** 인증 사용자, 유효한 `diagnosisId`, `alertConfig: { frequency: 'daily' }`
- **When** `subscribeToListingAlerts(diagnosisId, alertConfig)` 호출
- **Then** `Diagnosis.alertConfigJson`에 구독 설정 JSON 저장, `subscriptionId` 반환

**AC-5 (예외):** 진단 소유자 아닌 사용자 → FORBIDDEN
- **Given** 사용자B가 사용자A의 진단에 대해 구독 시도
- **When** `subscribeToListingAlerts()` 호출
- **Then** `DIAGNOSIS_FORBIDDEN` 에러

**AC-6 (도메인 핵심):** 푸시 발송은 별도 태스크
- **Given** `subscribeToListingAlerts` 성공
- **When** 코드 전체에서 실제 푸시 발송 로직 검색
- **Then** 푸시 발송 코드 0건. DB 저장만 수행 (Open Questions에 follow-up 명시)

**AC-7 (경계):** 모든 필터 미설정 시에도 ≥3개 제안
- **Given** `currentFilters: {}` (모든 필터 비어있음)
- **When** `suggestRelaxedFilters()` 호출
- **Then** 기본값 기반 제안 ≥3개 반환 (가격 3억 기본, 반경 1km, 면적 제한 없음)

---

## 5. ⚙️ Non-Functional Constraints

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-001 변형 | "두 동선 교차 계산 응답 시간 p95 ≤ 8,000ms" (§4.2.1) — 변형: 조건 완화 제안 ≤1초 | 룰 기반 산술 연산 (DB 조회 없음). `console.time` + k6 부하 테스트로 p95 ≤1,000ms 검증 |
| REQ-NF-035 | "에러 로그 알림 — Sentry 기본 알림" (§4.2.6) | `try-catch` 블록에서 `reportErrorToSentry` 호출. Sentry 이벤트 수신 확인 |
| REQ-NF-016 | "입력값 자동 저장 — best effort" (§4.2.2) — 변형 | 구독 저장도 best effort 패턴. 실패 시 사용자에게 재시도 안내 |

---

## 6. 📦 Deliverables

- `lib/types/deadline.ts` — `RelaxedFilterSuggestion`, `AlertSubscriptionConfig`, `AlertSubscriptionResult` 타입 추가
- `app/actions/deadline.ts` — `suggestRelaxedFilters`, `subscribeToListingAlerts` Server Action 추가
- `lib/validators/deadline.ts` — `suggestRelaxedFiltersSchema`, `alertSubscriptionSchema` Zod 스키마 추가
- `prisma/schema.prisma` — `Diagnosis.alertConfigJson` 필드 추가 + 마이그레이션
- `__tests__/actions/suggest-relaxed-filters.spec.ts` (7개)
- `__tests__/actions/subscribe-alerts.spec.ts` (5개)
- `__tests__/validators/deadline-relaxed.spec.ts` (4개)

---

## 7. 🔗 Dependencies

### 선행:
- **QRY-DL-001 ✅:** `filterListings` — 0건 판정 기준, `ListingFilters` 타입
- **CMD-DL-001 ✅:** `activateDeadlineMode` — 데드라인 모드 활성화 선행
- **DB-003 ✅:** `model Diagnosis` — 구독 정보 저장 대상 (alertConfigJson 추가)
- **CMD-AUTH-003 ✅:** `requireAuth` — 인증 검증
- **INFRA-005 ✅:** `aiClient` — AI 기반 조건 완화 확장 시 활용 (MVP 미사용)

### 후행:
- **UI-010 (같은 배치):** EmptyState + RelaxedFilterSuggestions + AlertSubscription UI
- **TEST-005:** 데드라인 모드 GWT 시나리오 — 0건 시 완화 제안 검증

### Deadline 도메인 완성 기여:
- 본 태스크 완료 시 Deadline 백엔드 4/5 완료

---

## 8. 🧪 Test Plan

- **단위 테스트:**
  - `suggest-relaxed-filters.spec.ts` 7개
  - `subscribe-alerts.spec.ts` 5개
  - `deadline-relaxed.spec.ts` 4개
  - 총 16개
- **성능 검증:** `suggestRelaxedFilters` p95 ≤1,000ms (k6 부하 테스트)
- **정적 검증:**
  - `grep -ri "NextAuth\|payment\|AES" app/actions/deadline.ts` → 0건
  - 푸시 발송 코드 0건: `grep -ri "sendPush\|webPush\|pushNotification" app/ lib/` → 0건
- **Prisma 마이그레이션:** `npx prisma migrate dev` 성공 확인
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint

---

## 9. 🚧 Open Questions / Risks

1. **AI 기반 vs 룰 기반 조건 완화:** MVP는 룰 기반 (가격 +20%, 반경 +1km, 평수 ±10평). AI 기반("이 사용자에게 최적 완화 조건은?")은 INFRA-005 `aiClient` 활용하여 후속 태스크로. AI 호출 시 응답 ≤1초 보장 어려움 (Gemini API latency).
2. **푸시 알림 발송 인프라:** 본 ISSUE는 구독 의도 DB 저장만. 실제 푸시 발송은 별도 태스크 필요 (Vercel Cron + Web Push API 또는 FCM). 배치 11 범위 밖.
3. **alertConfigJson DB 스키마:** 임시 JSONB 컬럼(`alertConfigJson: String?`) 사용. 영구적으로 별도 `AlertSubscription` 테이블 생성 여부 검토 필요. MVP에서는 Diagnosis 테이블 확장으로 충분.
4. **구독 해지 UX:** 현재 구독만 구현. 구독 해지/수정 기능은 별도 태스크.
5. **Mixpanel 추적 (REQ-FUNC-019):** "알림 구독 전환율을 Mixpanel로 추적" — UI-010에서 `track("deadline_push_subscribed")` 이벤트 전송. 본 백엔드 태스크는 DB 저장만.
