---
title: "싱글 모드 (F4)"
category: concepts
tags: [mvp, 기술]
sources: [src-srs, src-prd]
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — SRS v1.6 / TASK_LIST v1.3 반영. DB-009(범죄 통계 캐시)/DB-010(학교 배정 Seed) 제거 → 앱 내 정적 JSON 에셋 직접 참조(public/data/crime-stats.json, facilities.json, cafes.json). 야간 안전 등급 A~D(정적 JSON 기반), 수도권 90% 커버리지(CI 빌드 검증), 학군·가족 항목 자동 숨김(REQ-FUNC-021), 리포트 저장 window.print()+CSS @media print(서버 호출 0건).

# 싱글 모드 (Single Mode)

## 정의

자녀 없는 싱글 사용자(이직 후 이사 등)를 위해 학군·가족 항목을 자동 숨기고, 야간 치안 등급·편의시설·카페 밀집도를 강조하는 간소화 진단 모드(F4).

## 상세

### 모드 분기

- `mode === 'single'` 조건부 렌더링 (REQ-FUNC-021)
- 학군·가족 항목: 0건 표시 (자동 숨김)
- 야간 치안 등급(A~D): 정적 JSON 기반 (public/data/crime-stats.json, 22~06시 범죄 건수)
- 편의시설·카페 밀집도 레이어: 기본 활성화

### 정적 JSON 에셋 (DB-009/DB-010 대체)

| 파일 | 내용 | 출처 |
|---|---|---|
| `public/data/crime-stats.json` | 경찰청 범죄 통계 (야간 등급 A~D 산출) | 경찰청 공공데이터 |
| `public/data/facilities.json` | 편의시설 데이터 | 공공데이터 포털 |
| `public/data/cafes.json` | 카페 밀집도 데이터 | 공공데이터 포털 |

> ⚠️ **정적 JSON 에셋 데이터 수집**은 아직 완료되지 않음 → [[known-follow-ups]] 참조

### 야간 안전 등급

| 등급 | 기준 | 표시 |
|---|---|---|
| A | 22~06시 범죄 건수 최하위 25% | 🟢 안전 |
| B | 하위 25~50% | 🟡 보통 |
| C | 상위 25~50% | 🟠 주의 |
| D | 상위 25% | 🔴 위험 |

### 리포트 저장

| 항목 | 구현 방식 |
|---|---|
| 렌더링 | **window.print()** + CSS `@media print` |
| 서버 호출 | **0건** (클라이언트 전용) |
| 의존성 | **브라우저 기본** (라이브러리 0) |
| 응답 시간 | **≤ 1초** (REQ-NF-010) |

### 비수도권 차단

- Client validation ≤ 500ms + 지원 지역 목록 표시
- 커버리지: 서울/경기/인천 (수도권 90%) — CI 빌드 시 검증

## 근거

- ⑥이준혁(이직 후 이사) Adjacent 페르소나의 "직장+여가 2거점" 니즈 ([[src-persona]])
- "싱글인데 학군 항목이 있으면 불필요" 피드백 ([[src-cjm]])

## MVP 구현 상태

- ✅ **MVP 포함** (Phase 5, Day 31-35)
- REQ-FUNC-021~024
- 관련 태스크: CMD-SINGLE-001, QRY-SINGLE-001, CMD-SINGLE-002

## 관련 페이지

- Entities: [[diagnosis]], [[user]], [[domain-single]]
- Sources: [[src-srs]], [[src-prd]], [[src-persona]]
- Concepts: [[two-route-intersection]], [[architecture-patterns]], [[srs-v1.6-changes]], [[known-follow-ups]]
