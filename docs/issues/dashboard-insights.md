---
title: "feat(playboard): Insights 대시보드 — event_logs 퍼널·UTM 전환율 (raw 직접 집계)"
labels: [enhancement, observability, playboard]
priority: 🟢 높음 (발표 전)
status: 구현됨 — Draft PR 연결 예정
---

## 배경
로깅 구현(#248·#249·#250)으로 `event_logs`에 11종 이벤트가 적재되나, 이를 보는 **운영자 화면이 없다**(AARRR G4). Mixpanel 퍼널과 같은 구조를 **자체 DB(raw)** 로 시각화한다.

## 작업
- `/playboard/insights` RSC 페이지 신설 (`logging-test` prod-차단 패턴 답습).
- `event_logs` **요청 시점 직접 집계**(크론 0): 11종 퍼널 + 핵심 전환율 3종 + UTM 채널별 전환율.
- 데이터 소스 = `prisma.eventLog` groupBy/count/findMany/aggregate (**SELECT only**).

## 수용 기준 (AC)
- [x] 11종 퍼널(7 funnel + 4 referral/retention) 카운트·막대 표시.
- [x] 핵심 전환율 3종(입력완료율·제출성공률·공유생성률, AARRR §3-2 수식).
- [x] UTM 채널별 landing→completed 전환율 표.
- [x] `event_logs` 0행이어도 안전(빈 상태 메시지).
- [x] production 차단(`getDeploymentEnv()==="production" → notFound`), `robots: noindex`.

## 안전
- additive(신규 파일 2개), 읽기 전용, 마이그레이션 0, 기존 동작 무변경.

## 미해결/후속
- distinct(세션·방문자) 정규화·봇 제외 → [distinct-normalization](distinct-normalization.md).
- 대규모 시 raw 직접 집계 → 가집계 크론 전환 → [cron-aggregation](cron-aggregation.md).

## 구현
- 파일: `src/app/playboard/insights/page.tsx`, `src/lib/playboard/insights.ts`.
- **Draft PR**(이 이슈가 닫음) — 발행 시 `Closes #<번호>` 연결.
