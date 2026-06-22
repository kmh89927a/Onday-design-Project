# OnDay 3단 집계 아키텍처 설계 (raw → 가집계 → 최종집계)

> 대상: AARRR_NSM_PROPOSAL.md A안 지표(감지 완비 이벤트)의 자체 집계 파이프라인.
> ★ 범위: **테이블 생성(스키마+마이그레이션)까지만**. 실제 로그 쌓기(API 수정)·집계 크론·대시보드는 **본 문서의 설계로만**(발표 전 무변경). 구현은 발표 후.
> ★ Mixpanel과 역할 구분(아래 §0).

---

## 0. 왜 별도 DB 파이프라인인가 — Mixpanel과 중복 아님

| | Mixpanel | 본 DB 3단 파이프라인 |
|---|----------|----------------------|
| 역할 | **실측정**(운영 funnel·리텐션) | **자체 집계 파이프라인 설계·학습**(부트캠프 과제) |
| 데이터 | SaaS 보관(외부) | 자사 Postgres 보관(원본 소유·컴플라이언스) |
| 강점 | 즉시 대시보드·funnel | raw 보존·커스텀 집계·SQL 자유 |

→ **중복 적재가 아니라 역할 분담**: 실 운영 지표는 Mixpanel, 본 파이프라인은 "원본 로그를 어떻게 단계적으로 집계하는가"의 구조 학습·자체 보관용. 같은 이벤트를 양쪽에 보내더라도 목적이 다르다(이중 비용은 발표 후 단일화 검토).

---

## 1. 3단 구조와 "왜 3단인가"

```
[① 상세로그 raw]  →  [② 가집계 rollup]  →  [③ 최종집계 aggregate]
 원본 이벤트 1행      주기별 중간 합산        H/D/W/M 시각화 단위
 (분석·컴플라이언스)   (1m/10m/1h, 성능)      (대시보드 간섭 최소)
```

- **① 상세로그(raw)** — 이벤트 1건 = 1행. 원본 그대로 보존(분석 재현·감사·컴플라이언스). 절대 집계로 덮어쓰지 않음.
- **② 가집계(rollup)** — raw를 짧은 주기(1분/10분/1시간)로 **지표 유형별 중간 합산**. 대시보드가 raw 수백만 행을 매번 스캔하지 않게 하는 **성능 계층**. 재집계(backfill) 시 raw에서 다시 만들 수 있음.
- **③ 최종집계(aggregate)** — 가집계를 **H/D/W/M** 단위로 굳힌 시각화 전용. 대시보드는 이 작은 테이블만 읽어 **운영 DB 간섭 최소**.

**왜 3단(2단이 아니라):** raw→대시보드 직결은 데이터 커지면 느리고(매 조회 풀스캔), raw→최종(H/D/W/M)만 두면 **세밀한 주기 재집계·이상 구간 디버깅**이 어렵다. 중간 가집계가 "성능 + 재집계 유연성"을 동시에 준다.

---

## 2. 단계별 테이블 스키마 (설계)

### ① 상세로그 — `event_logs` (+ `preview_event_logs`)
ErrorLog 프라이버시 패턴 답습(USER FK 없음·PII 없음). 11개 이벤트(리포트 3-1 ✅완비)를 **범용 1테이블**로 수용 — 이벤트마다 컬럼을 만들지 않고 공통 속성 컬럼 + props JSON.

| 컬럼 | 타입 | 근거(이벤트 속성) |
|------|------|-------------------|
| id | uuid PK | |
| eventName | String | 11개 이벤트명(`diagnosis_completed` 등) |
| timestamp | DateTime (index) | 전 이벤트 공통 |
| mode | String? | couple/single (input_viewed·submit_clicked·share_*·saved_search_loaded) |
| method | String? | kakao/guest/reviewer (login_entered) |
| count | Int? | 1/2 (address_verified) |
| daysLeft | Int? | (deadline_mode_activated) |
| diagnosisId | String? | 내부 uuid(started·completed·share_created) — **FK 미설정**(ErrorLog 답습) |
| visitorId | String? | 익명(localStorage) |
| props | String? | JSON 오버플로(향후 속성 유연 수용) |
| createdAt | DateTime | |

> ★ PII 0 — 주소·좌표·이메일·공유 토큰(uniqueUrl) 미수집. mixpanel.ts 속성과 동일 원칙.

### ② 가집계 — `metric_rollups` (+ `preview_metric_rollups`)
지표 유형 × 짧은 주기 버킷의 합산값.

| 컬럼 | 타입 | 의미 |
|------|------|------|
| id | uuid PK | |
| metricType | String | 지표 유형(예: `landing_viewed`, `submit_per_input`) |
| bucket | String | 주기 단위(`1m`/`10m`/`1h`) |
| bucketStart | DateTime (index) | 버킷 시작 시각 |
| value | Float | 집계값(카운트/비율) |
| numerator | Int? | 비율 지표 분자(선택) |
| denominator | Int? | 비율 지표 분모(선택) |
| createdAt | DateTime | |

### ③ 최종집계 — `metric_aggregates` (+ `preview_metric_aggregates`)
H/D/W/M 시각화 단위.

| 컬럼 | 타입 | 의미 |
|------|------|------|
| id | uuid PK | |
| metricType | String | 지표 유형 |
| grain | String | `H`/`D`/`W`/`M` |
| periodStart | DateTime (index) | 기간 시작 |
| value | Float | 최종 집계값 |
| numerator | Int? | 분자(선택) |
| denominator | Int? | 분모(선택) |
| createdAt | DateTime | |

---

## 3. 데이터 흐름 (설계 — 구현은 발표 후)

```
이벤트 발생(클라)
  └→ (발표 후 구현) /api/events 수집 → event_logs INSERT          ← ① raw
       └→ (발표 후 크론 1m/10m/1h) rollup upsert → metric_rollups  ← ② 가집계
            └→ (발표 후 크론 H/D/W/M) aggregate upsert → metric_aggregates ← ③ 최종
                 └→ (발표 후) Admin 대시보드가 ③만 read
```

- **preview_* 테이블**: 동일 구조의 **실험/검증용 사본**. prod 집계 로직을 본 테이블에 영향 없이 시험하거나, 개발 데이터를 prod 집계와 격리해 적재할 때 사용. (실 운영 적재는 발표 후 결정 — 본 과제는 **테이블만** 생성.)

---

## 4. 구현 범위 (정직 표기)

| 항목 | 본 과제 | 발표 후 |
|------|---------|---------|
| 6개 테이블 스키마+마이그레이션(CREATE) | ✅ | |
| db:studio 표시 | ✅ | |
| 이벤트 → event_logs 수집 API | ❌ 설계만 | 구현 |
| rollup/aggregate 집계 크론 | ❌ 설계만 | 구현 |
| Admin 대시보드 | ❌ 설계만(AARRR §3-3과 연계) | 구현 |

> ★ 본 과제로 생성되는 6개 테이블은 **전부 빈 테이블**이다. 로그 적재·집계는 발표 후 구현 — 발표 전 기존 동작·데이터 무변경.

---

## 5. 안전성

- 6개 테이블 전부 **신규 CREATE** — 기존 5개 테이블(users·diagnoses·share_links·saved_searches·error_logs) **무변경**(ALTER 0).
- USER 등과 **FK 없음** → 기존 데이터·제약 영향 0.
- 마이그레이션 = `error_log`(CREATE TABLE+INDEX only) 선례 답습 = additive.
- 롤백 = 6개 테이블 `DROP TABLE`(기존 데이터 무관).
