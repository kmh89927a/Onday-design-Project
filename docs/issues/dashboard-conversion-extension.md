---
title: "feat(playboard): insights → 전환관리 대시보드 확장 (DAU/WAU/MAU · AARRR 단계 · NSM)"
labels: [enhancement, observability, playboard]
priority: 🟢 높음 (발표 전/직후)
status: 계획 완료 — 구현 대기 (docs/CONVERSION_DASHBOARD_PLAN.md)
---

## 배경
머지된 `#251 /playboard/insights`는 11종 퍼널 + 전환율 3종 + UTM만 보여준다. 전환관리 대시보드로 쓰려면 **서비스 활성(DAU/WAU/MAU)** · **AARRR 단계 전환율** · **NSM(주간 진단완료) 추세**가 필요하다. 설계: `docs/CONVERSION_DASHBOARD_PLAN.md`.

## 작업 (additive, raw 직접 집계 — 크론 0)
- **E1** `getActivity()` — `event_logs`에서 익명 `visitorId` distinct로 DAU(일별 라인)·WAU(7일)·MAU(30일) + 카드 섹션.
- **E2** 데이터 소스 토글 — `getInsights(source)` + `?source=preview` → dev/preview 더미 데모, 기본 prod. 읽는 테이블만 교체(write 0).
- **E3** NSM 주간 추세(목표선 50→200, REQ-NF-026) + AARRR 단계 그룹 헤더/전환율.

## 수용 기준 (AC)
- [ ] DAU/WAU/MAU = distinct `visitorId`, null 제외 주석.
- [ ] NSM = 주간 `diagnosis_completed`(diagnosisId 중복제거, null이면 행 카운트 폴백).
- [ ] `getInsights(source?)` 기본값 prod → 기존 호출부 무변경(회귀 0).
- [ ] 데이터 0·preview/prod 양쪽 안전. 읽기 전용. 마이그레이션 0.

## ★ 안전·갭 (정직)
- `notFound`는 **production만** 차단 — **preview 배포는 렌더됨**(noindex만). preview까지 막으려면 [preview-access-block](preview-access-block.md).
- distinct 정규화·봇 제외는 [distinct-normalization](distinct-normalization.md).

## 의존
- 더미 데모 데이터: [preview-dummy-seeding](preview-dummy-seeding.md).
