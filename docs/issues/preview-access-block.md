---
title: "chore(playboard): 운영자 도구 preview 배포 접근 차단 검토 (notFound 조건 확장)"
labels: [security, observability, playboard]
priority: ⚪ 낮음 (선택)
status: 미구현 — 결정 대기
---

## 배경
`/playboard/insights`(및 `logging-test`)는 `getDeploymentEnv()==="production" → notFound`로 **production만** 차단한다. 따라서 **Vercel preview 배포 URL에서는 대시보드가 렌더된다**(`robots noindex`만, 접근 차단 아님). 운영자 전용 지표·더미 데이터가 preview URL을 아는 사람에게 노출될 수 있다.

## 작업 (결정 후)
- 차단 조건을 `getDeploymentEnv() !== "development"`로 확장(preview도 notFound) — 단, preview에서 데모해야 하면 충돌 → 트레이드오프.
- 또는 preview는 허용하되 간단한 운영자 게이트(헤더/쿼리 토큰) 추가.

## ★ 트레이드오프 (정직)
- preview 차단 = 안전하나 preview 데모 불가. preview 허용 = 데모 가능하나 노출.
- 발표 데모를 preview로 한다면 **차단하지 말 것**. 데모를 로컬(dev)로만 한다면 차단 권장.

## 수용 기준 (AC)
- [ ] 결정: preview 차단 여부 + 사유 문서화.
- [ ] 선택 시 `logging-test`도 동일 정책 적용(일관성).
