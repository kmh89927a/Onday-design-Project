---
title: "chore(playboard): preview_event_logs 더미 이벤트 시딩 스크립트 (데모/테스트)"
labels: [tooling, observability, playboard]
priority: 🟢 높음 (발표 전 — 데모용)
status: 구현됨 — Draft PR 연결 예정 (scripts/seed-preview-events.ts)
---

## 배경
전환관리 대시보드 데모/개발 테스트에 쓸 **개연성 있는 더미 이벤트**가 필요하다. prod `event_logs`(실데이터)는 절대 오염하면 안 되므로 격리 사본 `preview_event_logs`에만 적재한다.

## 작업
- `scripts/seed-preview-events.ts` — 방문자 80명, ~350행, funnel drop-off + UTM 채널 + 30일 분산.
- **고정 시드 PRNG(mulberry32)** → 재실행 시 동일 분포(데모 재현성, `started > completed` 결정적).
- 재실행 안전: `visitorId` 프리픽스 `seed_` 행만 삭제 후 재생성.

## 수용 기준 (AC)
- [x] `previewEventLog`에만 write — prod `event_logs` 미접근(`eventLog.count()`만 읽음).
- [x] PII 0 — props=utm 5종만, visitorId/diagnosisId 익명 합성(`seed_*`).
- [x] 11종 이벤트 분포·30 고유일자(DAU/WAU/MAU 산출 가능).
- [x] 재실행 결정적(2회 동일 확인).

## ★ 안전
- 격리(preview 전용)·PII 0·재현성. 실행: `npx tsx scripts/seed-preview-events.ts`. 정리: seed_ 행 deleteMany.

## 검토
- 1차 aztks evaluate: GO (TOP_FIX=시드 PRNG 반영 완료).
