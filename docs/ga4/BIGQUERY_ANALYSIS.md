# OnDay — GA4 → BigQuery 분석 가이드 + SQL (T3 / S5)

> 단계: **S5 (마지막)** · 문서만 · 코드 0
> 목적: GA4 raw 익스포트를 BigQuery SQL 로 분석 — **자체 `insights.ts` 대시보드를 GA4 표준으로 1:1 재현**(학습 핵심)
> 관련: 설정 = `docs/ga4/SETUP_GUIDE.md` · 계획/결정 = `docs/loop/ga4-decision-log.md`

---

## 0. 왜 BigQuery 인가 (자체 DB ↔ GA4 역할, 정직)

OnDay 는 같은 11종 이벤트를 **3곳**에 적재한다. 분석 관점 비교:

| | 자체 DB (`event_logs`) | GA4 표준 보고서 | **GA4 → BigQuery** |
|---|---|---|---|
| 접근 | Prisma SELECT (`insights.ts`) | GA4 콘솔 UI | **표준 SQL(BigQuery)** |
| raw 행 | ✅ 완전 소유 | ❌ 집계만 | ✅ **이벤트 raw 전체** |
| 샘플링 | 없음 | 큰 데이터셋서 샘플링 가능 | **없음(raw)** |
| 비용 | 인프라 내 | 무료 | 무료(샌드박스 한도) |
| 가치 | 소유·통제 | 즉시 시각화 | **표준 SQL 역량·BI 연동·학습** |

> ★ 결론: BigQuery 는 자체 DB 를 대체하지 않는다. **"내 DB SQL 역량을 업계 표준(GA4) 위에서도 쓴다"** 가 목적. 본 문서의 SQL 은 의도적으로 `insights.ts` 와 같은 지표를 계산해 **대조 학습**한다.

---

## 1. BigQuery 익스포트 설정 (선택)

1. GA4 ⚙️ **관리 → 제품 링크 → BigQuery 링크 → 연결**. (상세: `SETUP_GUIDE.md §8`)
2. GCP 프로젝트 선택(없으면 무료 생성) · 빈도 **매일(Daily)**(샌드박스 무료) 또는 스트리밍.
3. 연결 **다음 날부터** 데이터셋 `analytics_<속성ID>` 에 테이블 생성:
   - `events_YYYYMMDD` — 날짜별 확정 익스포트
   - `events_intraday_YYYYMMDD` — 당일 실시간(스트리밍 시)
4. 속성 ID 찾기: GA4 ⚙️ 관리 → 속성 설정 → "속성 ID"(숫자). 데이터셋명 = `analytics_<그 숫자>`.

> 본 가이드 SQL 의 `` `PROJECT.analytics_PROPERTY.events_*` `` 를 본인 값으로 치환. `events_*` 와일드카드 + `_TABLE_SUFFIX` 로 날짜 범위 한정(스캔 비용↓).

---

## 2. GA4 익스포트 스키마 핵심

| 컬럼 | 의미 | OnDay 매핑 |
|---|---|---|
| `event_name` | 이벤트명 | `diagnosis_completed` 등 11종 |
| `event_timestamp` | 발생 micros(UTC) | `TIMESTAMP_MICROS(event_timestamp)` |
| `event_date` | `'YYYYMMDD'` 문자열 | 일자 집계 키 |
| `user_pseudo_id` | 익명 사용자 id | **gtag=GA 쿠키 id · MP 더미=`client_id`(우리 `visitorId`)** |
| `event_params` | `ARRAY<STRUCT<key, value STRUCT<string_value,int_value,double_value,float_value>>>` | 아래 파라미터 |

OnDay 가 보내는 파라미터(비식별, PII 0):

| param | 타입 | 추출 |
|---|---|---|
| `method` (kakao/guest/reviewer) | string | `value.string_value` |
| `mode` (couple/single) | string | `value.string_value` |
| `count` (1/2) | int | `value.int_value` |
| `days_left` | int | `value.int_value` |
| `diagnosis_id` | string | `value.string_value` |

**파라미터 추출 패턴** (모든 쿼리 공통):
```sql
(SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'method')   -- 문자열
(SELECT ep.value.int_value    FROM UNNEST(event_params) ep WHERE ep.key = 'count')    -- 정수
```

> 공통 날짜 변수(각 쿼리 상단에 둘 수 있음):
> ```sql
> DECLARE start_date STRING DEFAULT '20260601';
> DECLARE end_date   STRING DEFAULT FORMAT_DATE('%Y%m%d', CURRENT_DATE());
> ```

---

## 3. SQL 세트 — `insights.ts` 지표 재현

아래 `PROJECT.analytics_PROPERTY` 는 본인 값으로 치환.

### 3-1. 11종 전환 퍼널 (랜딩 대비 %) — ↔ `getInsights().counts`
```sql
WITH counts AS (
  SELECT event_name, COUNT(*) AS cnt
  FROM `PROJECT.analytics_PROPERTY.events_*`
  WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
    AND event_name IN (
      'landing_viewed','login_entered','diagnosis_input_viewed','address_verified',
      'diagnosis_submit_clicked','diagnosis_started','diagnosis_completed',
      'share_link_created','share_link_clicked','saved_search_loaded','deadline_mode_activated')
  GROUP BY event_name
)
SELECT
  event_name,
  cnt,
  ROUND(100 * cnt / NULLIF((SELECT cnt FROM counts WHERE event_name = 'landing_viewed'), 0), 1) AS pct_of_landing
FROM counts
ORDER BY cnt DESC;
```

### 3-2. NSM — 주간 진단 완료 수 — ↔ `getNsmTrend()`
```sql
SELECT
  DATE_TRUNC(DATE(TIMESTAMP_MICROS(event_timestamp)), WEEK(MONDAY)) AS week_start,
  -- insights 와 동일: diagnosis_id distinct + null 은 행 카운트 폴백
  COUNT(DISTINCT (SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'diagnosis_id'))
    + COUNTIF((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'diagnosis_id') IS NULL) AS completed
FROM `PROJECT.analytics_PROPERTY.events_*`
WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
  AND event_name = 'diagnosis_completed'
GROUP BY week_start
ORDER BY week_start;
```
> 목표선 50/주(3개월)·200/주(6개월) = REQ-NF-026 (콘솔/시트에서 오버레이).

### 3-3. 핵심 전환율 3종 — ↔ `getInsights().rates`
```sql
WITH c AS (
  SELECT
    COUNTIF(event_name='diagnosis_input_viewed') AS input_viewed,
    COUNTIF(event_name='address_verified'
      AND (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key='count') = 2) AS addr2,
    COUNTIF(event_name='diagnosis_submit_clicked') AS submit_clicked,
    COUNTIF(event_name='diagnosis_started') AS started,
    COUNTIF(event_name='diagnosis_completed') AS completed,
    COUNTIF(event_name='share_link_created') AS share_created
  FROM `PROJECT.analytics_PROPERTY.events_*`
  WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
)
SELECT
  ROUND(100*addr2/NULLIF(input_viewed,0),1)        AS input_completion_pct, -- 주소2건 입력완료율
  ROUND(100*started/NULLIF(submit_clicked,0),1)    AS submit_success_pct,   -- 제출 성공률
  ROUND(100*share_created/NULLIF(completed,0),1)   AS share_creation_pct    -- 공유 생성률
FROM c;
```

### 3-4. 로그인 방식 분포 — ↔ `getLoginMethods()`
```sql
SELECT
  COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key='method'), '(unknown)') AS method,
  COUNT(*) AS cnt
FROM `PROJECT.analytics_PROPERTY.events_*`
WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
  AND event_name = 'login_entered'
GROUP BY method
ORDER BY cnt DESC;
```

### 3-5. 세그먼트 — NSM 주간완료 × 로그인 방식 — ↔ `getSegmentAnalytics().nsmByMethod`
```sql
WITH ev AS (
  SELECT * FROM `PROJECT.analytics_PROPERTY.events_*`
  WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
),
-- ★ insights 와 동일한 귀속: diagnosis_completed 엔 method 가 없어 visitor→method(최초 login) 로 추론
visitor_method AS (
  SELECT user_pseudo_id,
    ANY_VALUE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key='method')) AS method
  FROM ev WHERE event_name = 'login_entered'
  GROUP BY user_pseudo_id
)
SELECT
  DATE_TRUNC(DATE(TIMESTAMP_MICROS(c.event_timestamp)), WEEK(MONDAY)) AS week_start,
  COALESCE(vm.method, '(unknown)') AS method,
  COUNT(DISTINCT (SELECT ep.value.string_value FROM UNNEST(c.event_params) ep WHERE ep.key='diagnosis_id')) AS completed
FROM ev c
LEFT JOIN visitor_method vm USING (user_pseudo_id)
WHERE c.event_name = 'diagnosis_completed'
GROUP BY week_start, method
ORDER BY week_start, method;
```

### 3-6. 세그먼트 — 퍼널 비교 × 모드 — ↔ `getSegmentAnalytics().funnelByMode`
```sql
WITH ev AS (
  SELECT * FROM `PROJECT.analytics_PROPERTY.events_*`
  WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
),
visitor_mode AS (
  SELECT user_pseudo_id,
    ANY_VALUE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key='mode')) AS mode
  FROM ev
  WHERE (SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key='mode') IS NOT NULL
  GROUP BY user_pseudo_id
)
SELECT
  COALESCE(vm.mode, '(unknown)') AS mode,
  e.event_name,
  COUNT(*) AS cnt
FROM ev e
LEFT JOIN visitor_mode vm USING (user_pseudo_id)
WHERE e.event_name IN ('login_entered','diagnosis_input_viewed','diagnosis_submit_clicked','diagnosis_completed','share_link_created')
GROUP BY mode, event_name
ORDER BY mode, cnt DESC;
```

### 3-7. DAU / WAU / MAU — ↔ `getActivity()`
```sql
-- 일별 DAU
SELECT event_date, COUNT(DISTINCT user_pseudo_id) AS dau
FROM `PROJECT.analytics_PROPERTY.events_*`
WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
GROUP BY event_date ORDER BY event_date;

-- WAU(최근 7일) / MAU(최근 30일) trailing
SELECT
  (SELECT COUNT(DISTINCT user_pseudo_id) FROM `PROJECT.analytics_PROPERTY.events_*`
     WHERE PARSE_DATE('%Y%m%d', event_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))  AS wau,
  (SELECT COUNT(DISTINCT user_pseudo_id) FROM `PROJECT.analytics_PROPERTY.events_*`
     WHERE PARSE_DATE('%Y%m%d', event_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) AS mau;
```

### 3-8. UTM 채널별 전환율 — ↔ `getInsights().utm`
> gtag 라이브 이벤트는 GA4 가 자체 `source`/`medium`/`campaign` 를 부여(traffic_source/collected). 자체 DB 의 `props` utm 과 의미가 비슷하나 출처가 다름 — 아래는 GA4 표준 채널 기준.
```sql
SELECT
  collected_traffic_source.manual_source AS utm_source,
  COUNTIF(event_name='landing_viewed')      AS landed,
  COUNTIF(event_name='diagnosis_completed') AS completed,
  ROUND(100*COUNTIF(event_name='diagnosis_completed')/NULLIF(COUNTIF(event_name='landing_viewed'),0),1) AS conv_pct
FROM `PROJECT.analytics_PROPERTY.events_*`
WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
GROUP BY utm_source ORDER BY landed DESC;
```
> `collected_traffic_source` 는 GA4 최신 익스포트 컬럼. 속성에 없으면 `event_params` 의 자체 `utm_*`(우리가 보낸 경우)로 대체.

---

## 4. `insights.ts` ↔ GA4 BigQuery SQL 1:1 대조표

| 지표 | `insights.ts` 함수 | GA4 SQL | 주의(차이) |
|---|---|---|---|
| 11종 퍼널 카운트 | `getInsights().counts` | §3-1 | 동일 |
| NSM 주간완료 | `getNsmTrend()` | §3-2 | null diagnosis_id 폴백까지 동일 구현 |
| 전환율 3종 | `getInsights().rates` | §3-3 | 동일 |
| 로그인 방식 분포 | `getLoginMethods()` | §3-4 | unknown 버킷 동일 |
| NSM×방식 (세그) | `getSegmentAnalytics().nsmByMethod` | §3-5 | visitor→method 귀속 동일 |
| 퍼널×모드 (세그) | `getSegmentAnalytics().funnelByMode` | §3-6 | visitor→mode 귀속 동일 |
| DAU/WAU/MAU | `getActivity()` | §3-7 | `visitorId` ↔ `user_pseudo_id` |
| UTM 채널 | `getInsights().utm` | §3-8 | 출처 다름(자체 props ↔ GA4 traffic_source) |

---

## 5. 정직한 차이·한계 (자체 DB vs GA4)

- **식별자 차이**: 자체 DB `visitorId`(우리 localStorage) ↔ GA4 `user_pseudo_id`. **gtag 라이브 사용자는 GA 쿠키 id**, **MP 더미(S4)는 `client_id`=우리 `visitorId`**. 둘이 섞이므로 distinct 수가 자체 DB 와 정확히 일치하지 않을 수 있음(정상).
- **귀속 한계 동일**: `diagnosis_completed` 에 `method`/`mode` 가 없어 visitor 추론으로 귀속 — 자체 `getSegmentAnalytics` 와 같은 한계(매핑 없으면 `(unknown)`).
- **샘플링**: GA4 표준 보고서엔 샘플링이 있을 수 있으나 **BigQuery raw 엔 없음**(BQ 가 더 정확).
- **백필 72h**: S4 더미를 원본 시각으로 보냈다면 ~72h 초과분은 GA4 에 미적재될 수 있음(S4는 기본 now 전송으로 회피).
- **이중집계 0**: 라이브는 gtag 만 → BQ 에 1회만. 더미는 별도 `seed_` 식별자라 라이브와 안 섞임.

---

## 6. GA4 전체 트랙 완료 요약 (S1~S5)

| 단계 | 산출물 | 상태 | PR |
|---|---|---|---|
| S0 | 계획 + aztks EVALUATE + 결정 로그 | ✅ `docs/loop/ga4-decision-log.md` | — |
| S1 | GA4 설정 교육 가이드 | ✅ `docs/ga4/SETUP_GUIDE.md` | — |
| S2 | 클라 gtag 마운트 + 11종 fan-out | ✅ 코드 | #265 |
| S3 | 서버 MP util (격리·미와이어) | ✅ 코드 | #266 |
| S4 | 더미 백필 스크립트 + E2E 검증 | ✅ 코드(실전송 ok 20) | #267 |
| S5 | BigQuery 분석 가이드 + SQL (본 문서) | ✅ `docs/ga4/BIGQUERY_ANALYSIS.md` | — |

**불변 원칙 (전 단계 공통, 달성):** 기존 Mixpanel·자체DB·진단·로거·대시보드 **무변경(additive only)** · GA4 전 경로 **env-guarded noop(회귀 0)** · **이중집계 0**(라이브 gtag 단일) · **PII 0** · **3중 수집 중복 정직**.
