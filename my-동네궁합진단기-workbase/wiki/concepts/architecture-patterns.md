---
title: "아키텍처 패턴"
category: concepts
tags: [기술, mvp]
sources: [src-srs, src-task-list, src-implementation-plan]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# 아키텍처 패턴 (Architecture Patterns)

## 정의

동네궁합진단기 MVP에서 채택한 시니어급 아키텍처 패턴 7가지. 각 패턴의 동기, 구현 방식, 영향받는 도메인을 정리.

## 패턴 목록

### 1. adaptLegacyMap() 어댑터 패턴

- **동기**: API-006 공통 에러 코드 체계에서 레거시 에러 코드를 신규 체계로 변환
- **구현**: `adaptLegacyMap()` 함수로 구 에러 코드 → 신규 Application Error Code 매핑
- **위치**: API-006 → API-001~005에서 import
- **영향**: [[domain-foundation]]

### 2. Vercel Timeout 우회 — Promise.allSettled

- **동기**: Vercel 무료 티어 Serverless Function 10초 Timeout 제약
- **구현**: 교통 API 호출과 교차 연산을 Server가 아닌 **Client Component**에서 수행. `Promise.allSettled`로 부분 실패 허용
- **위치**: CMD-DIAG-002 (클라이언트 교집합 산출)
- **장점**: 일부 API 실패 시에도 성공한 결과로 부분 산출 → 사용자 경험 보존
- **영향**: [[domain-diagnosis]], [[domain-deadline]]

```typescript
// CMD-DIAG-002 pseudo-code
const results = await Promise.allSettled(
  candidateAreas.map(area =>
    fetchTransitTime(area, { timeout: 5000, retries: 1 })
  )
);
const succeeded = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
// 실패 항목 → Sentry 로깅, 성공 항목으로 부분 산출
```

### 3. Timing Attack 방지 — DUMMY_HASH

- **동기**: 비밀번호 미설정 공유 링크에서 bcrypt.compare() 실행 여부로 비밀번호 존재 여부를 추론하는 Timing Attack 차단
- **구현**: `passwordHash === null`인 경우에도 사전 정의된 `DUMMY_HASH`와 bcrypt.compare() 실행 → 응답 시간 균일화
- **위치**: CMD-SHARE-004 (비밀번호 검증)
- **영향**: [[domain-sharelink]]

```typescript
// CMD-SHARE-004 pseudo-code
const DUMMY_HASH = '$2b$12$...'; // 사전 생성된 bcrypt 해시
const hashToCompare = link.passwordHash ?? DUMMY_HASH;
const isValid = await bcrypt.compare(inputPassword, hashToCompare);
if (!link.passwordHash) return true; // 비밀번호 미설정 → 항상 통과
return isValid;
```

### 4. AI provider 환경변수 분기

- **동기**: AI 프로바이더를 google/anthropic/openai 중 환경변수로 교체 가능하게
- **구현**: Vercel AI SDK의 `createAI()` 팩토리에서 `AI_PROVIDER` 환경변수로 분기. 기본값: `google` (Gemini)
- **위치**: INFRA-005 (Vercel AI SDK 연동)
- **영향**: [[domain-infra]], [[domain-diagnosis]]

### 5. 무료 미리보기 1곳 분리 — splitForPreview

- **동기**: 공유 링크 열람 시 1곳만 무료로 보여주고 나머지를 잠금하는 비즈니스 로직
- **구현**: `splitForPreview(candidateAreas)` 함수로 배열에서 1곳 분리 → { preview: CandidateArea, locked: CandidateArea[] }
- **위치**: QRY-SHARE-001 (SSR 공유 리포트)
- **영향**: [[domain-sharelink]]

```typescript
// QRY-SHARE-001 pseudo-code
function splitForPreview(areas: CandidateArea[]) {
  const [preview, ...locked] = areas.sort((a, b) => b.score - a.score);
  return { preview, locked };
}
// preview: 무료 공개 1곳 (최고 점수)
// locked: 잠금 ≥2곳 → 비로그인 클릭 시 UI-008 회원가입 유도 모달
```

### 6. Prisma Transaction — Diagnosis + CandidateArea 원자성

- **동기**: 진단 결과와 후보 동네 데이터의 정합성 보장
- **구현**: `prisma.$transaction([])` 내에서 Diagnosis 생성 + CandidateArea N건 생성을 원자적으로 수행
- **위치**: CMD-DIAG-004 (진단 결과 서버 저장)
- **영향**: [[domain-diagnosis]], [[domain-foundation]]

### 7. Static JSON Assets 패턴 (DB-009/DB-010 제거 후 대체)

- **동기**: 경찰청 범죄 통계(DB-009), 학교 배정 구역(DB-010) 테이블을 제거하고 정적 JSON 파일로 대체하여 DB 부하와 배치 의존성 제거
- **구현**: `public/data/` 디렉토리에 JSON 파일 배치 → 클라이언트에서 fetch() 또는 import로 직접 참조
- **파일**: `crime-stats.json`, `facilities.json`, `cafes.json`
- **장점**: DB 쿼리 0건, CDN 캐싱 가능, 배치 Job 불필요
- **영향**: [[domain-single]]

## 패턴 ↔ 도메인 매트릭스

| 패턴 | Foundation | Infra | Auth | Diagnosis | ShareLink | Deadline | Single | SavedSearch | UI | Test |
|---|---|---|---|---|---|---|---|---|---|---|
| adaptLegacyMap() | ✅ | | | | | | | | | |
| Promise.allSettled | | | | ✅ | | ✅ | | | | |
| DUMMY_HASH | | | | | ✅ | | | | | |
| AI provider 분기 | | ✅ | | ✅ | | | | | | |
| splitForPreview | | | | | ✅ | | | | | |
| Prisma Transaction | ✅ | | | ✅ | | | | | | |
| Static JSON Assets | | | | | | | ✅ | | | |

## 관련 페이지

- Sources: [[src-srs]], [[src-task-list]], [[src-implementation-plan]]
- Concepts: [[tech-stack]], [[srs-v1.6-changes]], [[domain-dependencies]], [[known-follow-ups]]
- Entities: [[diagnosis]], [[share-link-entity]]
