---
title: "feat(logging): 가집계·최종집계 크론 — metric_rollups / metric_aggregates 채우기"
labels: [enhancement, observability, deferred]
priority: 🟡 중 (발표 후)
status: 미구현 — 설계만 (EVENT_LOGGER_UTM_PLAN.md §4)
---

## 배경
3단 집계 파이프라인 중 **① raw `event_logs`만 가동**. ②가집계(`metric_rollups`)·③최종집계(`metric_aggregates`) 테이블은 생성됐으나(마이그레이션 `20260622…`) **비어 있다**. 대시보드가 raw 직접 집계로 충분한 현 규모를 넘어서면 성능 계층으로 전환.

## 작업
- `/api/cron/rollup` — `event_logs` → `metric_rollups` upsert(1h 버킷 기준선).
- `/api/cron/aggregate` — rollups → `metric_aggregates`(H/D/W/M) upsert.
- 멱등 upsert용 **UNIQUE 제약 추가 마이그레이션**(신규 테이블 대상 — additive): rollups `(metric_type,bucket,bucket_start)`, aggregates `(metric_type,grain,period_start)`.
- 크론 엔드포인트 `CRON_SECRET` 보호.

## ★ 위험·제약 (발표 후인 이유)
- **Vercel 크론 플랜 제약**: Hobby = 하루 1회 상한 → 1m/10m 가집계 불가. Pro 또는 외부 스케줄러 필요. **현 플랜 미확인** → 1h/D/W/M 기준선으로 시작.
- raw 직접 집계 대비 복잡도·실패 지점 증가 → 발표 전 도입 금지.

## 수용 기준 (AC)
- [ ] rollup/aggregate 잡 멱등(재실행 중복 0).
- [ ] raw 무손실 → 임의 구간 backfill 가능.
- [ ] 기존 5+6 테이블 무변경(신규 제약만 additive).

## 의존
- 대시보드([dashboard-insights](dashboard-insights.md))를 rollups/aggregates 소스로 전환(선택).
