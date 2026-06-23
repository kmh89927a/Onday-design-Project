---
title: "chore(logging): 전환율 distinct 정규화 + 봇·내부 트래픽 제외"
labels: [enhancement, observability, data-quality]
priority: ⚪ 낮음 (발표 후)
status: 미구현
---

## 배경
현재 전환율은 **이벤트 단위 카운트**(세션·방문자 distinct 미적용)라, 소표본에서 `login_entered(13) > landing_viewed(8)` 같은 분모<분자 역전이 보인다(다회 발화). 신뢰 가능한 비율을 위해 정규화 필요(`AARRR_NSM_PROPOSAL.md §3-2 공통 관리방침`, `LOG_IMPLEMENTATION_OUTLINE.md §3 주의`).

## 작업
- distinct 기준: 로그인 유저=`user_id`, 게스트=익명 `visitor_id`(이미 적재 중).
- 봇·내부 트래픽 제외(내부 IP·UA 필터 — 단 IP는 미수집이라 UA/패턴 기반).
- 전환율 분모/분자를 distinct 기준으로 재정의 → 대시보드 반영.

## 수용 기준 (AC)
- [ ] 입력완료율·제출성공률 등 distinct 기준 산출.
- [ ] 분모<분자 역전 해소.
- [ ] PII 0 유지(IP 미수집 원칙 — distinct는 익명 visitor_id 기준).

## 의존
- 대시보드([dashboard-insights](dashboard-insights.md)) 집계 로직 확장.
- 데이터 축적(현 48행/17분은 표본 부족).
