---
title: "AOS/DOS 기회 분석"
category: sources
tags: [비즈니스, 사용자]
sources: []
created: 2026-04-23
updated: 2026-04-23
status: active
---

# AOS/DOS 기회 분석

## 문서 정보

| 항목 | 값 |
|---|---|
| 원본 파일 | `raw/assets/9_aos-dos-analysis.md` |
| 크기 | 12,772 bytes / 189 lines |

## 핵심 요약

20개 Pain Point에 대한 AOS(기회 점수)와 DOS(수요·기회·공급) 이중 분석. Market Relevance를 곱한 DOS가 실행 가능한 우선순위를 더 정확히 반영함을 입증. Q2·Q4가 완전히 비어있어 시장 진입 공백을 수치로 증명.

## 주요 내용

### AOS Top 6 (혁신 기회, AOS ≥ 3.0)

| # | Pain Point | AOS |
|---|---|---|
| 1 | 두 동선 동시 교차 계산 | **4.00** |
| 3 | 학원 셔틀 종점 DB | **4.00** |
| 2 | 긴급 이사 데드라인 모드 | **3.80** |
| 4 | 광역버스 착석·환승 데이터 | 3.36 |
| 5 | 학원 셔틀 노선 데이터 | 3.20 |
| 6 | 배우자·가족 공유 링크 | 3.04 |

### DOS Top 5 (실행 가성비 순)

| # | Pain Point | DOS |
|---|---|---|
| 1 | 두 동선 동시 교차 계산 | **4.00** |
| 2 | 긴급 이사 데드라인 모드 | **2.66** |
| 3 | 배우자·가족 공유 링크 | **2.52** |
| 4 | 광역버스 착석·환승 데이터 | 2.24 |
| 5 | 이전 입력값 저장·재방문 | 2.08 |

### 핵심 인사이트: AOS vs DOS 순위 변동

- **학원 셔틀 DB**: AOS 공동 1위 → DOS 8위 (데이터 확보 난이도 높아 MR↓)
- **배우자 공유 링크**: AOS 6위 → DOS 3위 (구현 단순 + 결제·바이럴 직결)
- **추천 리워드**: DOS 유일 음수(-0.13) — 이미 자발적 추천 발생 중

### MVP 즉시 구현 (AOS ≥ 3.5)

1. 두 동선 교차 계산 (서비스 정체성)
2. 긴급 데드라인 모드
3. 배우자 공유 링크

## 관련 Wiki 페이지

- Sources: [[src-jtbd]], [[src-persona]], [[src-cjm]]
- Concepts: [[two-route-intersection]], [[share-link]], [[deadline-mode]]

## 관련 도메인 (v1.6)

- [[domain-diagnosis]] — AOS 1위 Pain Point 해결
- [[domain-deadline]] — AOS 2위 긴급 이사
- [[domain-sharelink]] — DOS 3위 배우자 공유
