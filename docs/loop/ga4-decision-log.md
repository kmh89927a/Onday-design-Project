# GA4 연동 파이프라인 — 결정 로그 + 구현 계획

> 상태: **1단계(계획 수립) 완료 · 구현 대기(사용자 승인 후 단계별)**
> 작성: 2026-06-25 · 통제 모드: 발표/제출 임박 → 단계별 멈춤·사용자 승인·additive·회귀 0
> SSoT 정합: `docs/EVENT_LOGGER_UTM_PLAN.md §0`(측정 도구 역할 분담), `docs/LOG_IMPLEMENTATION_OUTLINE.md`

---

## 0. 목적 · 3중 수집 정당화 (정직)

OnDay 는 이미 **2개 측정 경로**를 운영 중이다. GA4 는 **3번째**다. 중복을 숨기지 않고 역할로 분리한다.

| 경로 | 수집 위치 | 역할 | 강점 | 한계 |
|---|---|---|---|---|
| **Mixpanel** | `mixpanel.ts` 클라 track | 운영 퍼널·리텐션·p50(REQ-NF-008) | 퍼널/코호트 UI 즉시 | 무료 한도·로우데이터 접근 제한 |
| **자체 DB** (`event_logs`) | `/api/events` → Prisma | raw 원본 보관 + `/playboard/insights` 대시보드 | 완전 소유·SQL 자유·PII 0 통제 | 운영자 도구 한정·BI 미연동 |
| **GA4** (신규) | gtag(클라) + MP(서버) | **학습 + 표준 분석(BigQuery)** | 업계 표준·**BigQuery 무료 익스포트**·DebugView | 샘플링·스키마 학습곡선 |

**3중 정당화:** ① GA4 는 **부트캠프 학습 목표**(표준 도구 숙련). ② **BigQuery 네이티브 익스포트**로 자체 DB SQL 역량을 GA4 데이터에도 확장(T3). ③ Mixpanel·자체 DB 는 **그대로 유지** — GA4 는 **추가 sink** 일 뿐 대체 아님. 셋 다 **동일 11종 이벤트**를 보되 목적이 다르다(운영/소유/학습+표준).

> ⚠️ 중복 비용 인지: 같은 이벤트가 3곳에 적재된다. GA4 는 무료 한도(월 1천만 이벤트 + BigQuery 샌드박스) 내라 추가 비용 0 예상. 정당화 안 되면 GA4 도입 자체를 보류하는 게 정직한 선택지임도 명시.

---

## 1. 코드베이스 앵커 (현재, 무변경 대상)

| 앵커 | 경로 | 역할 | GA4 가 닿는 방식 |
|---|---|---|---|
| **중앙 트래커 (fan-out)** | `src/lib/analytics/mixpanel.ts` | 11종 `trackXxx()` = `logEvent()`(DB) → `mixpanel.track()` | ★ **여기에 3번째 sink `gaEvent()` 추가**(additive) |
| 클라 emitter | `src/lib/logging/log-event.ts` | `/api/events` sendBeacon | 무변경 |
| 서버 insert | `src/lib/logging/log-event-server.ts` | `event_logs`/`preview_event_logs` | 무변경 |
| 수집기 | `src/app/api/events/route.ts` | enum-gate + PII-0 sanitize → **현재 DB insert 전용(미러 없음)** | ★ (신규·선택) 서버 MP 미러 분기 추가 지점 — 현재 없음 |
| 대시보드 | `src/lib/playboard/insights.ts` · `.../insights/page.tsx` | 자체 DB 집계 | 무변경 (T3 SQL 이 GA4 측 동등물) |
| 루트 레이아웃 | `src/app/layout.tsx` | 현재 analytics 마운트 0 | ★ gtag `<Script>` 마운트 지점 |
| env 검증 | `src/lib/env.ts` | NEXT_PUBLIC 분리 | ★ GA4 키 (선택) 추가 |

**핵심 설계 원칙:** 중앙 트래커(`mixpanel.ts`)가 이미 "1 호출 → N sink" 구조다. GA4 는 **N+1 sink** 로 끼우면 호출부(컴포넌트) 전부 무변경. 회귀 표면 최소.

---

## 2. 4종 산출물 — 풀버전 스펙

### T-APP (코드, critical path) — gtag 마운트 + 서버 미러링
2단계로 분할.

- **T-APP-A · 클라 gtag (실시간 클라 이벤트)**
  - 신규 `src/components/analytics/google-analytics.tsx` — `next/script`(map-canvas-kakao 패턴 계승)로 gtag.js 로드. `NEXT_PUBLIC_GA_MEASUREMENT_ID` 미설정 시 **렌더 0 = noop**(Mixpanel `ensureInit` 철학 동일).
  - 신규 `src/lib/analytics/ga-event.ts` — `gaEvent(name, params)` thin wrapper. `window.gtag` 부재·키 부재 시 best-effort no-op. PII 0(기존 화이트리스트 속성만 전달).
  - `mixpanel.ts` 각 `trackXxx()` 에 `gaEvent(...)` **1줄 추가**(logEvent·mixpanel.track 다음, additive). 기존 라인 무수정.
  - `src/app/layout.tsx` 에 `<GoogleAnalytics />` 마운트(1줄).
  - 대안: `@next/third-parties/google` 의 `<GoogleAnalytics>` — 공식이나 신규 의존성. **기본은 무의존 next/script 권장**(1인 MVP·완전 통제).

- **T-APP-B · 서버 미러링 (Measurement Protocol)**
  - 신규 `src/lib/analytics/ga-measurement-protocol.ts` — `sendGa4Event(clientId, name, params)` → `POST https://www.google-analytics.com/mp/collect?measurement_id=...&api_secret=...`. `GA4_API_SECRET`·`NEXT_PUBLIC_GA_MEASUREMENT_ID` 미설정 시 no-op. best-effort(throw 0). `client_id` = 익명 `visitorId` 재사용(PII 0).
  - ★ **이중 수집(double-count) 결정 필요** — 라이브 이벤트를 클라 gtag + 서버 MP **둘 다** 보내면 GA4 가 2배 집계(기본 dedup 없음). → **권장: 라이브는 gtag(클라)만, MP util 은 (1) T1 더미 백필 (2) 향후 진짜 서버 전용 이벤트 용으로 보유.** `/api/events` 에 라이브 미러 와이어링은 **기본 보류**(이중집계 회피). 전체 서버 미러를 원하면 gtag 이벤트 전송을 끄고 MP 단일화하는 별도 결정으로.
  - → **§5 미결 결정 D1** 에서 사용자 선택.

### T1 (스크립트) — 더미 로그 GA4 전송 (preview 더미 활용)
- 신규 `scripts/send-preview-events-to-ga4.ts` — `preview_event_logs` 의 `seed_` 행을 읽어 **MP util 로 GA4 전송**(읽기 전용 SELECT, DB write 0). `seed-preview-events.ts` 격리 패턴 계승.
- 목적: **실 트래픽 전에 파이프라인 E2E 검증** — GA4 DebugView/Realtime 에서 이벤트·파라미터(method/mode/count…) 도착 확인.
- 안전: prod `event_logs` 미접근. 키 미설정 시 안내 후 종료.

### T2 (문서) — GA4 설정 교육 가이드
- 신규 `docs/ga4/SETUP_GUIDE.md` — ① GA4 속성·데이터 스트림 생성 ② `Measurement ID(G-XXXX)` + `Measurement Protocol API secret` 발급 ③ env 등록(`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `GA4_API_SECRET` — **사용자가 설정**, Mixpanel·Sentry 동일) ④ DebugView 검증 ⑤ BigQuery 링크(무료 익스포트) 설정. 스크린샷 자리표시 + 단계별 체크리스트.

### T3 (문서) — GA4→BigQuery 분석 가이드 + SQL
- 신규 `docs/ga4/BIGQUERY_ANALYSIS.md` — GA4 BigQuery 익스포트 스키마(`events_YYYYMMDD`, `event_params` nested) 설명 + **SQL 세트**:
  - NSM: 주간 `diagnosis_completed` 수(자체 insights NSM 동등물)
  - 퍼널: 11종 단계별 카운트 + 전환율
  - 세그먼트: `method`(kakao/guest/reviewer)·`mode`(couple/single)별 분해 — `UNNEST(event_params)` 패턴
  - DAU/WAU/MAU: `user_pseudo_id` distinct
- 자체 `insights.ts` 로직을 GA4 SQL 로 옮긴 **1:1 대조표**(소유 DB ↔ GA4 표준) — 학습 가치 핵심.

---

## 3. 구현 로드맵 (안전 순서 · 단계별 멈춤)

> 각 단계: 구현 → tsc/lint → **멈춤·사용자 보고** → aztks EVALUATE(검토) → 사용자 승인 → 다음.
> 커밋·푸시·이슈·머지 = **사용자 직접**. 나는 working-tree 변경 + (승인 시) Draft PR 준비까지.

| 단계 | 산출물 | 코드 위험 | 이유(순서) |
|---|---|---|---|
| **S0 (현재)** | 본 계획 + aztks EVALUATE + 결정 로그 | 0 (문서) | 방향 확정 먼저 |
| **S1** | T2 설정 가이드 문서 | 0 (문서) | 키 발급이 모든 코드의 선행 조건. 가장 안전 |
| **S2** | T-APP-A 클라 gtag | 낮음 (env unset=noop) | 단일 sink 추가, 회귀 표면 최소. 라이브 검증 가능 |
| **S3** | T-APP-B 서버 MP util | 낮음 (util만, 미와이어) | 능력만 추가, 라이브 미러 보류(이중집계 회피) |
| **S4** | T1 더미 전송 스크립트 | 낮음 (읽기전용 스크립트) | MP util 검증 + DebugView E2E |
| **S5** | T3 BigQuery 분석 가이드+SQL | 0 (문서) | 데이터 도착 후 분석. 마지막 |

**안전 근거:** 문서(S1)→noop 가능한 클라 코드(S2)→격리 util(S3)→읽기전용 스크립트(S4)→문서(S5). **위험 오름차순이 아니라 의존성 순**이며, 코드 변경은 전부 env-guarded noop/additive 라 키 미설정 prod 에 **회귀 0**.

---

## 4. 환경 변수 (사용자가 설정 — Mixpanel·Sentry 동일)

| 키 | 용도 | 공개 | 미설정 시 |
|---|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | gtag + MP measurement_id (G-XXXX) | 클라(inline) | gtag 미마운트·MP no-op |
| `GA4_API_SECRET` | Measurement Protocol 인증 | 서버 전용 | MP no-op |

> 키 미설정이 **기본 안전 상태**: 모든 GA4 경로 noop → 기존 동작 완전 보존. env.ts 검증 추가는 **optional**(필수화하면 키 없는 환경 깨짐 → required 금지, optional 만).

---

## 5. 결정 확정 (2026-06-25, 사용자 승인 완료)

- **D4 — GA4 도입: ✅ 진행** (학습 + BigQuery 목적, 3중 중복 정당화 수용).
- **D1 — 서버 미러링: ✅ (a) gtag(클라) 라이브 + MP 는 T1 더미/향후 서버전용 예비.** 라이브 이중집계 0. `/api/events` 라이브 미러 와이어링은 안 함.
- **D2 — gtag 마운트: ✅ (a) 무의존 `next/script` 래퍼** (map-canvas-kakao 패턴 계승, 신규 의존성 0).
- **D3 — env.ts: ✅ optional 추가만** (required 금지 — 키 없는 환경 무회귀).

→ S2(T-APP-A): `next/script` 래퍼 + `ga-event.ts` + `mixpanel.ts` fan-out. S3(T-APP-B): MP util 격리(미와이어). 확정 반영.

---

## 6. 안전·정직 체크리스트 (전 단계 공통)

- [ ] 기존 Mixpanel·자체DB·진단·로거·대시보드 **코드 무변경**(additive only, 라인 무수정)
- [ ] GA4 전 경로 **env-guarded noop** — 키 미설정 시 회귀 0
- [ ] PII 0 — 기존 화이트리스트 속성만(주소·좌표·토큰·이메일 0). `client_id`=익명 visitorId
- [ ] best-effort — GA4 실패가 앱/기존 track 영향 0 (throw 0)
- [ ] 단계별 멈춤·사용자 승인 · 병렬 자동 EXECUTE 금지 · TURN 자동 재개 금지
- [ ] 커밋·푸시·이슈·머지 = 사용자 직접
- [ ] 3중 수집 중복 정직 명시(본 문서 §0)

---

## 7. aztks EVALUATE 결과 (S0, 2026-06-25)

**판정: GO** — 단계별 구현 진행 가능. FAIL 축 0.

| 축 | 점수 | 요지 |
|---|---|---|
| A 알아서 | 5 | 4종 산출물 + 단계(S0~S5) + env + 위험 + 미결결정(D1~D4) + 보류옵션 전부 커버 |
| Z 잘 | 5 | N+1 sink fan-out 정확, 이중집계 위험 명시 + 건전한 기본값, noop/best-effort 가드가 기존 패턴 계승 |
| T 딱 | 4 | 앵커가 실제 코드와 일치. 1건 drift(아래 fix) 교정함 |
| K 깔끔 | 5 | 섹션별 표·위험순 로드맵·★마커로 skimmable |
| S 센스 | 5 | 3중 중복 정직(보류가 정직 포함)·단계별 멈춤·키 사용자설정·PII0 체크리스트 = 즉시 실행가능 |

**적용한 단일 최고레버리지 fix:** §1 `/api/events` 행이 서버 MP 미러가 이미 "분기"하는 것처럼 읽힘 → 현재 DB insert 전용(미러 없음)임을 명시(무회귀 baseline 정확화, S3 "미와이어"와 정합). ✅ 반영 완료.

검증 근거: fan-out `mixpanel.ts:34-41`, 수집기 DB-only `api/events/route.ts:53-63`, layout analytics 0, env.ts GA4 키 0, `seed-preview-events.ts` 존재 — 전부 확인됨.
