---
title: "페르소나별 도메인 흐름 매핑"
category: concepts
tags: [사용자, mvp]
sources: [src-persona, src-cjm, src-jtbd, src-aos-dos]
created: 2026-04-26
updated: 2026-04-26
status: active
---

# 페르소나별 도메인 흐름 매핑

## 정의

[[persona-spectrum]]의 핵심 페르소나 3명이 어떤 도메인 시나리오를 어떻게 이용하는지 매핑. [[src-cjm]]의 일반적 여정을 73개 태스크 단위로 구체화.

## 페르소나 1: 맞벌이 부부 김지영 (C-01)

> "두 직장 통근 거리 중간이면서 아이 학군도 괜찮은 동네를 찾아야 해요"

### Trigger

- 전세 만료 D-3개월, 두 직장 통근 거리 중간 동네 찾기
- 배우자와 학군·통근 조건 갈등

### Flow

1. **[[domain-auth]]** — 카카오 OAuth 로그인 (CMD-AUTH-001)
2. **[[domain-diagnosis]]** — 두 직장 주소 입력 → 교집합 3곳+ 산출 (CMD-DIAG-001~002)
3. **[[domain-diagnosis]]** — AI 스코어링으로 후보 순위화 (CMD-DIAG-003)
4. **[[domain-deadline]]** — 이사 마감일 D+90 설정 → 타임라인 ≥5단계 (CMD-DL-001)
5. **[[domain-sharelink]]** — 공유 링크 생성 → 카카오톡 전송 (CMD-SHARE-001)
6. **배우자** → 무료 미리보기 1곳 열람 → 잠금 2곳+ 클릭 → 회원가입 유도 모달 (UI-008)
7. **[[domain-savedsearch]]** — 다음 방문 시 이전 조건 자동 불러오기 (QRY-SAVE-001)

### Pain Point 해결

| Pain Point (AOS) | 해결 도메인 | 해결 방식 |
|---|---|---|
| 두 동선 동시 계산 도구 부재 (5.0) | [[domain-diagnosis]] | Promise.allSettled 병렬 교차 연산 |
| 배우자 설득 도구 부재 (4.0) | [[domain-sharelink]] | 데이터 리포트 + OG 미리보기 |
| 정보 분산 (4.2) | [[domain-diagnosis]] | 학군+교통+매물 통합 지도 |

### JTBD 충족

- **Functional**: "두 사람의 통근 시간을 동시에 줄이면서 아이 학군도 유지하는 동네를 찾는다" — [[src-jtbd]]
- **Emotional**: "이사 결정에 대한 확신을 얻고 배우자와의 갈등을 줄인다"

---

## 페르소나 2: 30대 싱글 이준혁 (A-01)

> "이직했는데, 새 직장 근처면서 퇴근 후 즐길 곳 많은 동네 어디지?"

### Trigger

- 이직 후 직장+여가 2거점 최적화 필요
- 학군 정보는 불필요, 야간 치안이 중요

### Flow

1. **[[domain-auth]]** — 네이버 OAuth 로그인 (CMD-AUTH-002)
2. **[[domain-diagnosis]]** — **싱글 모드 선택** → 직장+여가 주소 입력 (CMD-SINGLE-001)
3. **[[domain-single]]** — 학군 자동 숨김 + 야간 안전 등급 A~D 표시 (QRY-SINGLE-001)
4. **[[domain-single]]** — window.print() 리포트 저장 (CMD-SINGLE-002)
5. **[[domain-savedsearch]]** — 다음 방문 시 이전 조건 자동 불러오기 (QRY-SAVE-001)

### Pain Point 해결

| Pain Point | 해결 도메인 | 해결 방식 |
|---|---|---|
| "싱글인데 학군 항목 불필요" | [[domain-single]] | mode==='single' 조건부 렌더링 |
| 야간 치안 정보 부재 | [[domain-single]] | 정적 JSON 기반 A~D 등급 |
| 리포트 저장 번거로움 | [[domain-single]] | window.print() (서버 호출 0건) |

---

## 페르소나 3: 긴급 이사자 박준호 (C-03)

> "계약 만료까지 2개월밖에 안 남았는데, 급매물 있는 동네 빨리 알려주세요"

### Trigger

- 전세 만료 D-2개월, 시간 극도로 부족
- 급매물 정보가 즉시 필요

### Flow

1. **[[domain-auth]]** — 카카오 OAuth 로그인 (CMD-AUTH-001)
2. **[[domain-diagnosis]]** — 두 주소 입력 → 교집합 산출 (CMD-DIAG-001~002)
3. **[[domain-deadline]]** — 이사 마감일 D+60 설정 → 타임라인 ≥5단계 (CMD-DL-001)
4. **[[domain-deadline]]** — 네이버 부동산 아웃링크로 급매물 확인 (CMD-DL-002)
5. **[[domain-deadline]]** — 매물 0건 시 조건 완화 ≥3개 제안 (CMD-DL-003)
6. **[[domain-deadline]]** — 30분 요약 카드 확인 (QRY-DL-002)
7. **[[domain-sharelink]]** — 공유 링크 → 배우자 확인 (CMD-SHARE-001)

### Pain Point 해결

| Pain Point (AOS) | 해결 도메인 | 해결 방식 |
|---|---|---|
| 긴급 이사 시 시간 부족 (5.0) | [[domain-deadline]] | 계약 역산 타임라인 |
| 매물 정보 분산 | [[domain-deadline]] | 네이버 부동산 아웃링크 |
| "30분 안에 결론" 니즈 | [[domain-deadline]] | 30분 요약 카드 |

---

## 페르소나 ↔ 도메인 매핑 매트릭스

| 도메인 | 김지영 (맞벌이) | 이준혁 (싱글) | 박준호 (긴급) |
|---|---|---|---|
| [[domain-auth]] | ✅ 카카오 | ✅ 네이버 | ✅ 카카오 |
| [[domain-diagnosis]] | ✅ couple 모드 | ✅ single 모드 | ✅ couple 모드 |
| [[domain-deadline]] | ✅ D+90 | — | ✅ D+60 |
| [[domain-sharelink]] | ✅ 핵심 | — | ✅ 보조 |
| [[domain-single]] | — | ✅ 핵심 | — |
| [[domain-savedsearch]] | ✅ 재방문 | ✅ 재방문 | — |
| [[domain-ui]] | ✅ 전체 | ✅ 싱글 화면 | ✅ 데드라인 화면 |

## 관련 페이지

- Entities: [[persona-spectrum]], [[domain-auth]], [[domain-diagnosis]], [[domain-sharelink]], [[domain-deadline]], [[domain-single]], [[domain-savedsearch]], [[domain-ui]]
- Sources: [[src-persona]], [[src-cjm]], [[src-jtbd]], [[src-aos-dos]]
- Concepts: [[two-route-intersection]], [[share-link]], [[deadline-mode]], [[single-mode]]
