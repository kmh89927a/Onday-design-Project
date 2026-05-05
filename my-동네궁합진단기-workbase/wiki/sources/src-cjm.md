---
title: "고객 여정 지도 (CJM)"
category: sources
tags: [사용자]
sources: []
created: 2026-04-23
updated: 2026-04-23
status: active
---

# 고객 여정 지도 (Customer Journey Map)

## 문서 정보

| 항목 | 값 |
|---|---|
| 원본 파일 | `raw/assets/8_customer-journey-map.md` |
| 크기 | 16,163 bytes / 81 lines |

## 핵심 요약

Core User 5명(김지영·박상민·최유리·정우진·이수현)의 5단계 고객 여정(문제인식→탐색→발견·결제→사용→유지)을 상세 매핑. 각 단계별 행동·생각·감정·Pain Point·개선 기회를 표로 정리.

## 주요 Pain Point 패턴 (Cross-persona)

| 단계 | 공통 Pain Point | 서비스 대응 |
|---|---|---|
| 문제인식 | 두 동선 동시 계산 도구 부재 | F1 교차 진단 |
| 탐색 | 학군·교통·매물 정보 분산 | 통합 화면 |
| 발견·결제 | 배우자 설득 근거 부재 | F2 공유 링크 + 데이터 배지 |
| 사용 | 학교 배정/학원 셔틀 미통합 | 레이어 토글 (v1.5) |
| 유지 | 재방문 트리거 없음 + 입력값 미저장 | F5 저장 + 알림 |

## 페르소나별 핵심 인사이트

- **①김지영**: "남편 설득용 데이터 리포트" 필요 → 공유 링크 결정적
- **②박상민**: "중개사마다 말이 달라" → 공공 데이터 기반 중립 스코어
- **③최유리**: "수치 근거가 뭔지" → 데이터 출처 투명성
- **④정우진**: "2달 안에 못 구하면 비상" → 데드라인 모드 핵심 가치
- **⑤이수현**: "또 이사, 변수 최소화" → 저장·재사용·미래 시뮬

## 관련 Wiki 페이지

- Entities: [[persona-spectrum]]
- Sources: [[src-persona]], [[src-jtbd]], [[src-aos-dos]]
- Concepts: [[two-route-intersection]], [[share-link]], [[deadline-mode]]

## 관련 도메인 (v1.6)

- [[domain-ui]] — CJM 기반 UI 여정 설계
- [[domain-diagnosis]] — 여정 핵심 터치포인트
