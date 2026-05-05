---
name: Feature Task
title: "[Feature] CMD-SHARE-003: 무료 미리보기 1곳 분리 로직 (REQ-FUNC-011 — 1곳 전체 노출, 나머지 블러/잠금)"
labels: ['feature', 'priority:M', 'epic:ShareLink', 'wave:3']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [CMD-SHARE-003] 무료 미리보기 1곳 분리 로직 — splitForPreview()
- **목적 (Why):**
  - **비즈니스:** 비로그인 사용자가 공유 링크로 접근 시, 후보 동네 1곳만 전체 정보를 노출하고 나머지는 잠금 처리하여, 회원가입/로그인 유도 funnel을 구현한다. REQ-FUNC-011의 핵심 비즈니스 로직.
  - **사용자 가치:** 비회원 배우자가 1곳의 전체 정보(출퇴근 시간, 스코어 등)를 확인하고, 나머지 후보에 대한 궁금증으로 회원가입을 유도받는다.
- **범위 (What):**
  - ✅ 만드는 것: `splitForPreview()` 함수, `LockedCandidateDTO` 타입, CTA 메시지 응답 포함, 로그인/비로그인 분기 처리
  - ❌ 만들지 않는 것: SSR 페이지(QRY-SHARE-001), UI 컴포넌트(UI-007), 공유 링크 생성/조회(CMD-SHARE-001/002), 결제 코드, NextAuth.js 코드
- **복잡도:** M
- **Wave:** 3 (ShareLink 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **REQ-FUNC-011** (§4.1.2): "배우자(비회원)가 공유 링크를 클릭하면 앱 설치 없이 모바일 웹에서 리포트 전체를 열람하고 무료 미리보기 1곳을 확인할 수 있어야 한다. 3G 환경 기준 페이지 로딩 시간은 p95 ≤ 2,000ms여야 한다."
- **REQ-FUNC-013** (§4.1.2): "비회원이 무료 미리보기 1곳을 소진한 후 추가 동네 상세 조회를 시도하면, 유료 전환 유도 화면을 표시해야 한다."
- **REQ-NF-018** (§4.2.3): "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션."
- **REQ-NF-021** (§4.2.3): "비인가 제3자 공유 링크 개인정보 접근 차단 — 비인가 접근 시 개인정보 노출 0건"

### 시퀀스 다이어그램 (§6.3.2 — 미리보기 분기)

- **핵심 분기:**
  - 비로그인(비회원) → 1곳 전체 노출 + 나머지 잠금
  - 로그인(회원) → 전체 후보 노출

### 선행 태스크 산출물 (배치 1·5)

| 선행 Task ID | 제공 산출물 | import 경로 | 본 태스크에서의 사용처 |
|---|---|---|---|
| API-003 | `CandidateAreaDTO` (via `@/lib/types/diagnosis`) | `@/lib/types/diagnosis` | 입력 후보 데이터 타입 |
| CMD-AUTH-003 | `getCurrentUser` | `@/lib/auth/session` | 로그인 여부 판단 |
| CMD-SHARE-002 | `getShareLinkData()` 결과 | `@/lib/share/get-share-link` | candidates 배열 원본 |
| MOCK-002 | `MOCK_GET_REPORT_VALID` | `@/lib/mocks/share-link` | 테스트 기대값 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** `lib/types/share-preview.ts`에 `LockedCandidateDTO` 타입 신규 정의
  ```typescript
  // lib/types/share-preview.ts
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';

  /** 잠금 상태 후보 동네 — name, coord, rank만 노출 */
  export interface LockedCandidateDTO {
    name: string;
    coord: { lat: number; lng: number };
    rank: number;
  }

  /** splitForPreview 반환 타입 */
  export interface PreviewSplitResult {
    previewCandidate: CandidateAreaDTO;
    lockedCandidates: LockedCandidateDTO[];
    ctaMessage: string | null;
  }
  ```

- [ ] **3.2** `lib/share/preview-splitter.ts`에 `splitForPreview()` 함수 구현
  ```typescript
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';
  import type { LockedCandidateDTO, PreviewSplitResult } from '@/lib/types/share-preview';

  const CTA_MESSAGE = '회원가입하면 전체 후보 동네 정보를 볼 수 있어요';

  /**
   * 비즈니스 로직 핵심 (REQ-FUNC-011):
   * - 비로그인: rank 1위 1곳 전체 노출, 나머지는 name/coord/rank만
   * - 로그인: 전체 노출 (잠금 없음)
   */
  export function splitForPreview(
    candidates: CandidateAreaDTO[],
    isAuthenticated: boolean
  ): PreviewSplitResult {
    if (candidates.length === 0) {
      throw new Error('후보 동네가 없습니다');
    }

    // 로그인 사용자 → 전체 노출
    if (isAuthenticated) {
      return {
        previewCandidate: candidates[0],
        lockedCandidates: [],
        ctaMessage: null,
      };
    }

    // 비로그인 → 1곳만 전체, 나머지 잠금
    const [first, ...rest] = candidates;
    return {
      previewCandidate: first,
      lockedCandidates: rest.map((c): LockedCandidateDTO => ({
        name: c.name,
        coord: c.coord,
        rank: c.rank,
        // commuteA, commuteB, score 등은 제외 (잠금)
      })),
      ctaMessage: rest.length > 0 ? CTA_MESSAGE : null,
    };
  }
  ```

- [ ] **3.3** `lib/types/share-preview.ts`에 전체 노출 결과 타입 추가 (로그인 사용자용)
  ```typescript
  export interface FullPreviewResult {
    allCandidates: CandidateAreaDTO[];
    ctaMessage: null;
  }
  ```

- [ ] **3.4** `__tests__/share/preview-splitter.spec.ts`에 단위 테스트 작성 (Vitest)
  ```typescript
  import { splitForPreview } from '@/lib/share/preview-splitter';
  import type { CandidateAreaDTO } from '@/lib/types/diagnosis';

  const mockCandidates: CandidateAreaDTO[] = [
    { id: 'c1', name: '마포구 합정동', coord: { lat: 37.55, lng: 126.91 }, commuteA: { durationMinutes: 25, transportType: 'transit', transfers: 1, walkingMinutes: 5 }, commuteB: { durationMinutes: 35, transportType: 'transit', transfers: 0, walkingMinutes: 8 }, score: 92, rank: 1 },
    { id: 'c2', name: '영등포구 당산동', coord: { lat: 37.53, lng: 126.90 }, commuteA: { durationMinutes: 30, transportType: 'transit', transfers: 1, walkingMinutes: 7 }, commuteB: { durationMinutes: 40, transportType: 'transit', transfers: 1, walkingMinutes: 10 }, score: 85, rank: 2 },
    { id: 'c3', name: '성동구 성수동', coord: { lat: 37.54, lng: 127.05 }, commuteA: { durationMinutes: 20, transportType: 'transit', transfers: 0, walkingMinutes: 3 }, commuteB: { durationMinutes: 45, transportType: 'transit', transfers: 2, walkingMinutes: 12 }, score: 78, rank: 3 },
  ];

  describe('splitForPreview (REQ-FUNC-011)', () => {
    it('비로그인 → 1곳 전체 + 나머지 2곳 잠금', () => {
      const result = splitForPreview(mockCandidates, false);
      expect(result.previewCandidate.id).toBe('c1');
      expect(result.previewCandidate.commuteA).toBeDefined();
      expect(result.previewCandidate.score).toBe(92);
      expect(result.lockedCandidates).toHaveLength(2);
      expect(result.lockedCandidates[0]).toHaveProperty('name');
      expect(result.lockedCandidates[0]).toHaveProperty('coord');
      expect(result.lockedCandidates[0]).toHaveProperty('rank');
      expect(result.lockedCandidates[0]).not.toHaveProperty('commuteA');
      expect(result.lockedCandidates[0]).not.toHaveProperty('score');
    });

    it('로그인 → 전체 노출, 잠금 0건', () => {
      const result = splitForPreview(mockCandidates, true);
      expect(result.previewCandidate.id).toBe('c1');
      expect(result.lockedCandidates).toHaveLength(0);
      expect(result.ctaMessage).toBeNull();
    });

    it('비로그인 → CTA 메시지 포함', () => {
      const result = splitForPreview(mockCandidates, false);
      expect(result.ctaMessage).toContain('회원가입');
    });

    it('후보 1곳만 있을 때 비로그인 → 잠금 0건, CTA 메시지 null', () => {
      const result = splitForPreview([mockCandidates[0]], false);
      expect(result.previewCandidate.id).toBe('c1');
      expect(result.lockedCandidates).toHaveLength(0);
      expect(result.ctaMessage).toBeNull();
    });

    it('빈 배열 → 에러 발생', () => {
      expect(() => splitForPreview([], false)).toThrow('후보 동네가 없습니다');
    });

    it('잠금 후보에 commuteA/B, score가 제외됨', () => {
      const result = splitForPreview(mockCandidates, false);
      const locked = result.lockedCandidates[0];
      expect(Object.keys(locked)).toEqual(['name', 'coord', 'rank']);
    });
  });
  ```

- [ ] **3.5** LockedCandidateDTO 타입 무결성 검증 — 민감 정보 제외 확인
  ```typescript
  // LockedCandidateDTO에 다음 필드가 없어야 함:
  // commuteA, commuteB, score, id
  // name, coord, rank만 포함
  ```

- [ ] **3.6** `lib/types/share-link.ts`에 PreviewSplitResult 타입 re-export 추가
  ```typescript
  // lib/types/share-link.ts 하단에 추가
  export type { LockedCandidateDTO, PreviewSplitResult } from './share-preview';
  ```

- [ ] **3.7** Storybook용 미리보기 Mock 데이터 작성 (선택)
  ```typescript
  // lib/mocks/share-link/preview-scenarios.ts
  import { splitForPreview } from '@/lib/share/preview-splitter';
  import { MOCK_CANDIDATES_NORMAL } from '@/lib/mocks/diagnosis';

  export const MOCK_PREVIEW_UNAUTHENTICATED = splitForPreview(MOCK_CANDIDATES_NORMAL, false);
  export const MOCK_PREVIEW_AUTHENTICATED = splitForPreview(MOCK_CANDIDATES_NORMAL, true);
  ```

- [ ] **3.8** v1.3 정합성 검증
  ```bash
  grep -ri "NextAuth\|payment\|AES" lib/share/preview-splitter.ts  # → 0건
  ```

- [ ] **3.9** CMD-AUTH-003 getCurrentUser 타입 확인 — isAuthenticated 판단 기준
  ```typescript
  // getCurrentUser().type === 'authenticated' → isAuthenticated = true
  // getCurrentUser().type === 'unauthenticated' || 'guest' → isAuthenticated = false
  ```

- [ ] **3.10** API-003 CandidateAreaDTO 정합성 — splitForPreview 입력 타입 일치
  ```typescript
  // CandidateAreaDTO: { id, name, coord, commuteA, commuteB, score, rank }
  // LockedCandidateDTO: { name, coord, rank } — CandidateAreaDTO의 서브셋
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** 비로그인 → 1곳만 전체 노출
- **Given** 후보 동네 3곳이 있고 사용자가 비로그인 상태
- **When** `splitForPreview(candidates, false)` 호출
- **Then** `previewCandidate`에 rank 1위의 전체 정보(commuteA, commuteB, score), `lockedCandidates`에 2곳 (name, coord, rank만)

**AC-2 (정상):** 로그인 → 전체 노출
- **Given** 후보 동네 3곳이 있고 사용자가 로그인 상태
- **When** `splitForPreview(candidates, true)` 호출
- **Then** `previewCandidate`에 rank 1위 전체, `lockedCandidates === []` (잠금 0건), `ctaMessage === null`

**AC-3 (경계):** 잠금 후보에 민감 정보 미포함
- **Given** 비로그인 상태에서 splitForPreview 호출
- **When** `lockedCandidates[0]`의 키 목록 확인
- **Then** `['name', 'coord', 'rank']`만 존재, `commuteA`, `commuteB`, `score`, `id` 미포함

**AC-4 (경계):** 후보 1곳만 있을 때 → 잠금 0건
- **Given** 후보 동네 1곳, 비로그인 상태
- **When** `splitForPreview([candidate], false)` 호출
- **Then** `lockedCandidates === []`, `ctaMessage === null`

**AC-5 (예외):** 빈 배열 → 에러
- **Given** 빈 candidates 배열
- **When** `splitForPreview([], false)` 호출
- **Then** Error 발생: "후보 동네가 없습니다"

**AC-6 (비즈니스):** CTA 메시지 포함
- **Given** 비로그인 상태 + 잠금 후보 ≥ 1곳
- **When** `splitForPreview(candidates, false)` 호출
- **Then** `ctaMessage`에 "회원가입" 키워드 포함

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| REQ-NF-018 | "인증 세션 보안 — Supabase Auth httpOnly cookie 기반 세션" (§4.2.3) | `isAuthenticated` 파라미터를 `getCurrentUser().type === 'authenticated'`로 판단. 세션 검증은 CMD-AUTH-003의 `getCurrentUser()` 의존 |
| REQ-NF-021 | "비인가 접근 시 개인정보 노출 0건" (§4.2.3) | 잠금 후보에서 commuteA/B, score 등 민감 정보 제외 검증. Vitest에서 Object.keys 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `lib/types/share-preview.ts` (LockedCandidateDTO, PreviewSplitResult 타입)
- `lib/share/preview-splitter.ts` (splitForPreview 함수)
- `lib/mocks/share-link/preview-scenarios.ts` (미리보기 Mock — 선택)
- `__tests__/share/preview-splitter.spec.ts` (단위 테스트 6개)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **API-003:** `CandidateAreaDTO` 타입 정의
- **CMD-AUTH-003:** `getCurrentUser` — isAuthenticated 판단
- **CMD-SHARE-002:** `getShareLinkData()` 결과의 candidates 배열

### 후행:
- **QRY-SHARE-001:** SSR 공유 리포트 페이지 — splitForPreview() 호출
- **UI-007:** SSR 공유 리포트 UI — LockedCandidateDTO 렌더링
- **UI-008:** 유료 전환 유도 모달 — ctaMessage 활용

---

## 8. 🧪 Test Plan (검증 절차)

- **단위 테스트:** `__tests__/share/preview-splitter.spec.ts` — Vitest 6개 (비로그인 분리, 로그인 전체, CTA 메시지, 1곳 경계, 빈 배열 에러, 민감정보 제외)
- **Storybook 테스트:** `MOCK_PREVIEW_UNAUTHENTICATED` / `MOCK_PREVIEW_AUTHENTICATED`로 UI 미리보기 검증 (UI-007 병렬)
- **타입 검증:** `npx tsc --noEmit` 통과
- **CI 게이트:** `tsc --noEmit`, Vitest 100%, ESLint 통과

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **잠금 후보 좌표 정확도 vs 프라이버시:** LockedCandidateDTO에 `coord`를 포함하면 비로그인 사용자도 지도에서 위치를 확인 가능. 프라이버시 관점에서 좌표를 더 낮은 정확도로 제공하거나 제거하는 옵션 검토 필요 — 현재는 SRS REQ-FUNC-011 원문("이름·좌표만 표시")을 따라 좌표 포함.
2. **미리보기 1곳 선정 기준:** 현재 rank 1위 (첫 번째 항목) 자동 선택. 사용자 선택 방식은 v2 이후 검토.
3. **CTA 메시지 커스터마이징:** 현재 하드코딩. i18n 또는 A/B 테스트용 동적 메시지는 v2 이후 검토.
