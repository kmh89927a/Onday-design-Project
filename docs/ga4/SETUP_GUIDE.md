# OnDay — GA4 설정 가이드 (T2)

> 단계: **S1 (설정 가이드)** · 코드 0 · 사용자가 직접 GA4 콘솔에서 키 발급
> 산출물 종류: 교육/운영 문서 · 최신 GA4 공식 UI 기준 (2025~2026)
> 관련: 계획·결정 = `docs/loop/ga4-decision-log.md` · 다음 = S2(클라 gtag 마운트)

---

## 0. 먼저 — OnDay 에서 GA4 의 역할 (꼭 읽기)

OnDay 는 **이미 측정 도구 2개**를 운영 중이다. GA4 는 **3번째**이고, 목적이 다르다.

| 도구 | 이미 있음? | 역할 |
|---|---|---|
| **Mixpanel** | ✅ 운영 중 | 퍼널·리텐션·p50 (운영 분석 UI) |
| **자체 DB** (`event_logs` + `/playboard/insights`) | ✅ 운영 중 | raw 원본 소유 + 자체 대시보드 |
| **GA4** (지금 설정) | ⬜ 신규 | **학습 + 표준 분석(BigQuery 무료 익스포트)** |

**즉 GA4 는 Mixpanel·자체DB 를 대체하지 않는다.** 같은 이벤트를 보되 "업계 표준 도구 숙련 + BigQuery SQL 확장" 목적의 **추가 sink** 다. (중복 정당화 상세: 결정 로그 §0)

### ★★ 이 가이드에서 "하지 말 것" — 설치 스니펫 따라하기 금지
GA4 콘솔/공식 문서는 데이터 스트림을 만들면 **"이 코드를 `<head>`에 붙여넣으세요"** 라며 gtag.js 스니펫을 준다.

> ❌ **그 스니펫을 OnDay 코드에 붙여넣지 말 것.**
> ✅ OnDay 는 **S2 단계에서 `next/script` 로 직접 마운트**한다(기존 map-canvas-kakao 패턴, 중복·이중로딩 방지).
> **이 가이드(S1)에서 당신이 할 일은 오직 "키(Measurement ID) 발급"까지.** 코드는 우리가 S2에서 붙인다.

(Mixpanel·Sentry 도입 때와 동일한 방식 — 콘솔에서 키만 받아 `.env` 에 넣고, 마운트는 우리 코드가 통제.)

---

## 1. GA4 계정·속성이 이미 있는지 확인

1. <https://analytics.google.com> 접속 (OnDay 운영 구글 계정으로 로그인).
2. 화면이 뜨는 형태로 판단:
   - **대시보드(보고서)가 바로 보이면** → 이미 계정+속성 있음. → **2번은 건너뛰고 §1-1 로**.
   - **"측정 시작"/"Start measuring" 환영 화면이면** → 계정 없음. → **§2 로**.
3. 좌측 하단 **⚙️ 관리(Admin)** 클릭 → 상단에 **계정(Account)** / **속성(Property)** 2개 열이 보인다.

### §1-1. 기존 속성이 OnDay 용인지 확인
- **속성(Property)** 열의 드롭다운에서 속성 목록 확인.
- OnDay 전용 속성이 없고 다른 프로젝트만 있으면 → **새 속성만 생성**(§2-2 부터, 계정 생성은 생략).
- ⚠️ **GA4 속성인지 확인**: 속성 설정에 "데이터 스트림(Data Streams)" 메뉴가 있으면 GA4. (구 Universal Analytics 는 2023.7 종료 — 신규는 전부 GA4.)

---

## 2. (없으면) GA4 계정·속성 생성

> GA4 콘솔 UI 는 자주 바뀐다. 아래는 2025~2026 기준 흐름. 버튼 명칭이 조금 달라도 순서는 동일.

### §2-1. 계정 생성 (계정이 아예 없을 때만)
1. ⚙️ **관리(Admin)** → 계정 열의 **+ 만들기(Create)** → **계정(Account)**.
2. **계정 이름**: 예) `OnDay`.
3. 데이터 공유 설정: 기본값 유지(원하면 해제) → **다음**.

### §2-2. 속성 생성
1. **속성 이름**: 예) `OnDay (온데이)`.
2. **보고 시간대**: `대한민국 (GMT+09:00) 서울`.
3. **통화**: `대한민국 원 (₩)`.
4. **다음** → 비즈니스 정보(업종/규모) 적당히 선택 → 비즈니스 목표 선택(예: "사용자 행동 검토") → **만들기**.
5. 약관 동의(국가=대한민국) → 동의.

### §2-3. 플랫폼 선택 → 웹
- 속성 생성 직후 "데이터 수집 시작 / 플랫폼 선택" 화면이 뜬다 → **웹(Web)** 선택. → 바로 §3(데이터 스트림)로 이어진다.

---

## 3. 웹 데이터 스트림 설정 (OnDay 도메인)

> 데이터 스트림 = "이 웹사이트에서 들어오는 데이터 통로". 여기서 **Measurement ID 가 발급**된다.

1. (자동으로 안 떴다면) ⚙️ **관리** → **데이터 스트림(Data streams)** → **스트림 추가 → 웹**.
2. **웹사이트 URL**: `https://onday-design-project.vercel.app`
   (Vercel 프로덕션 도메인. 커스텀 도메인 있으면 그걸로. preview 도메인은 등록 불필요 — 우리 코드가 env 로 제어.)
3. **스트림 이름**: 예) `OnDay Web (prod)`.
4. **향상된 측정(Enhanced measurement)**: 기본 ON 유지(페이지뷰·스크롤 등 자동). OnDay 핵심 11종 이벤트는 S2에서 우리가 직접 보낸다.
5. **스트림 만들기(Create stream)**.

> ⚠️ 스트림 생성 후 **"태그 설치 안내 / gtag.js 스니펫"** 화면이 나온다 → **§0의 경고대로 무시**. 스니펫 복사 ❌. **Measurement ID 만** 다음 단계에서 복사.

---

## 4. Measurement ID (G-XXXXXXXXXX) 찾기·복사

1. ⚙️ **관리** → **데이터 스트림** → 방금 만든 **웹 스트림** 클릭.
2. 스트림 상세 화면 **우측 상단**에 `측정 ID(Measurement ID)` = **`G-` 로 시작하는 10자리** (예: `G-ABCD123XYZ`).
3. 옆의 **복사 아이콘** 클릭 → 복사.

> 이 값이 우리가 필요한 **유일한 필수 키**다. (`G-...` = 공개값 — 클라 번들에 노출돼도 안전. Mixpanel `NEXT_PUBLIC_*` 토큰과 동일 성격.)

---

## 5. (선택·미리) Measurement Protocol API secret — S4 용

S4(더미 로그 → GA4 서버 전송) 에서 필요하다. 지금 같이 받아두면 편하다.

1. 같은 **웹 스트림 상세** 화면 → 아래로 스크롤 → **Measurement Protocol API secrets**.
2. **만들기(Create)** → 별칭(예: `onday-server`) → 생성.
3. 표시되는 **secret 값**을 복사(서버 전용 비밀 — 절대 클라/깃에 노출 금지).

> S4 전까지는 안 써도 된다. 라이브 이벤트는 클라 gtag 만 보내고(결정 D1), 이 secret 은 **더미 백필/서버 예비** 용이다.

---

## 6. DebugView 위치 (나중 검증용)

S2 마운트 후 "이벤트가 진짜 GA4 에 도착하나" 를 **실시간** 확인하는 화면.

- ⚙️ **관리** → **DebugView**. (또는 좌측 보고서 영역 하단)
- 지금은 **위치만 기억**하면 된다. 데이터는 아직 안 들어온다(코드 미마운트).
- S2 에서 우리가 **개발 환경에 `debug_mode` 를 켜서** 보내므로, S2 검증 때 이 화면에 OnDay 이벤트(`diagnosis_completed` 등)가 흐르는 걸 보게 된다.
- (참고) 실시간 전체 트래픽은 **보고서 → 실시간(Realtime)** 에서도 확인 가능.

---

## 7. env 설정 — Mixpanel·Sentry 와 동일 패턴

발급한 Measurement ID 를 **2곳**에 넣는다. (Mixpanel `NEXT_PUBLIC_MIXPANEL_TOKEN`, Sentry DSN 넣던 방식 그대로.)

### 7-1. 로컬 — `onday-app/.env.local`
```bash
# GA4 (학습 + BigQuery 목적 · S2에서 next/script로 마운트)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ABCD123XYZ

# (선택, S4용 — 서버 Measurement Protocol)
GA4_API_SECRET=여기에_secret_붙여넣기
```

### 7-2. 프로덕션 — Vercel
- Vercel 프로젝트 → **Settings → Environment Variables**.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-...` 추가 → 환경 **Production**(원하면 Preview 도 ) 체크.
- (선택) `GA4_API_SECRET` 추가 — 환경에서 **Production** 만(서버 비밀).
- ⚠️ **`NEXT_PUBLIC_*` 는 빌드타임 inline** → 추가/변경 후 **반드시 Redeploy** 해야 반영(기존 Mixpanel·Supabase 키 교훈과 동일).

> ✅ **키 미설정 = 안전 기본값**: S2 코드는 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 가 없으면 gtag 를 아예 마운트하지 않는다(noop). 즉 키를 안 넣으면 GA4 만 꺼질 뿐 **앱·Mixpanel·자체DB·진단 전부 그대로**. 회귀 0.

---

## 8. (선택) BigQuery 연결 — 분석은 S5

GA4 의 가장 큰 가치(무료 raw 익스포트). 지금 연결만 해두면 데이터가 쌓이기 시작한다.

1. ⚙️ **관리** → **제품 링크(Product links)** → **BigQuery 링크** → **연결(Link)**.
2. 구글 클라우드 프로젝트 선택(없으면 무료 GCP 프로젝트 생성) → 위치 `대한민국`/`미국` → 빈도 **매일(Daily)**(샌드박스 무료) → 제출.
3. **상세 스키마·SQL 분석은 S5(T3 가이드)** 에서 다룬다. 여기선 연결만.

> 연결 직후엔 익스포트가 없고, 다음 날부터 `events_YYYYMMDD` 테이블이 생긴다. 그래서 **연결을 일찍** 해두는 게 좋다.

---

## 9. 완료 체크리스트

- [ ] analytics.google.com 접속 가능(OnDay 운영 구글 계정)
- [ ] GA4 **속성** 존재(OnDay 용) — 데이터 스트림 메뉴 확인
- [ ] **웹 데이터 스트림** 생성(URL = Vercel 프로덕션 도메인)
- [ ] **Measurement ID `G-...`** 복사함
- [ ] (선택) **MP API secret** 복사함(S4용)
- [ ] **DebugView** 위치 확인함
- [ ] `.env.local` 에 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 추가
- [ ] Vercel 에 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 추가(+ Redeploy 예정)
- [ ] (선택) BigQuery 링크 연결
- [ ] ⛔ gtag.js 설치 스니펫은 **붙여넣지 않음**(S2가 처리)

---

## 10. 다음 단계 — S2 예고 (클라 gtag 마운트)

S1 에서 키만 발급했다. S2 에서 **코드로** 연결한다(전부 additive·env-guarded noop):

- 신규 `src/components/analytics/google-analytics.tsx` — `next/script` 로 gtag.js 로드. `NEXT_PUBLIC_GA_MEASUREMENT_ID` 없으면 **렌더 0**.
- 신규 `src/lib/analytics/ga-event.ts` — `gaEvent(name, params)` thin wrapper(best-effort no-op, PII 0).
- `src/lib/analytics/mixpanel.ts` 중앙 트래커 11종에 `gaEvent(...)` **1줄씩 추가**(기존 라인 무수정).
- `src/app/layout.tsx` 에 `<GoogleAnalytics />` 마운트.
- 개발 환경 `debug_mode` → DebugView 로 도착 검증.

→ **S2 는 별도 승인 후 시작.** (이 가이드 단계는 여기서 멈춤.)
