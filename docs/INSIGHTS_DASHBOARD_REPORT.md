# Insights 대시보드 — 결과 · 테스트 · 직접 테스트 시나리오

> 대상: `/playboard/insights` (event_logs raw 직접 집계 대시보드).
> ★ 발표 전 **유일 구현**. 크론·share_signup·distinct는 이슈 초안만(`docs/issues/`).
> 근거: 실제 코드 + 라이브 `event_logs` 실측(48행). 작성일 2026-06-23.

---

## A. 결과 보고서

### A-1. 구현물
| 파일 | 역할 |
|------|------|
| `src/app/playboard/insights/page.tsx` | RSC 대시보드 — prod 차단·force-dynamic·robots noindex, 퍼널/전환율/UTM 렌더 |
| `src/lib/playboard/insights.ts` | 데이터 계층 — `event_logs` 직접 집계(SELECT only), 11종 카운트·전환율 3종·UTM 채널 |

### A-2. 화면 구성
1. **헤더** — 총 이벤트 수·UTM 부착 수·적재 구간(실측 배지). prod 차단·읽기전용 안내.
2. **전환 퍼널(11종)** — 7 funnel(Acquisition→Activation/Aha) + 4 referral/retention. 막대(단계별 색)·카운트·랜딩 대비 %.
3. **핵심 전환율 3종** — 입력완료율·제출성공률·공유생성률(AARRR §3-2 수식 + 분자/분모 실값).
4. **UTM 채널별 전환율** — `utm_source`별 landing→completed 표.
5. **정직 푸터** — 이벤트 단위(비-distinct)·크론 미구현·distinct 후속 명시.

### A-3. 집계 방식
- **크론 0** — 페이지 요청 시점에 `prisma.eventLog` groupBy/count/findMany/aggregate. 인덱스(`event_name`/`timestamp`) 활용, 소량(수십~수백 행)에서 sub-second.
- 데이터 소스 = `event_logs`(prod 적재분). dev/preview에서 열어도 같은 Supabase의 prod 행을 읽음.

### A-4. 미구현 갭 (정직)
| 항목 | 상태 |
|------|------|
| 가집계/최종집계 크론 | ❌ 이슈 초안만([cron-aggregation](issues/cron-aggregation.md)) |
| `share_link_signup` | ❌ 미배선([share-link-signup](issues/share-link-signup.md)) |
| distinct 정규화·봇 제외 | ❌ 이슈 초안만([distinct-normalization](issues/distinct-normalization.md)) |
| 입력완료율 distinct | ⚠️ 현재 raw count(카드 인라인 주의 표기) |

---

## B. 테스트 보고서

| 항목 | 방법 | 결과 |
|------|------|------|
| 타입 | `tsc --noEmit` | ✅ 통과 |
| 린트 | `eslint`(2파일) | ✅ No warnings or errors |
| 렌더(dev) | `GET /playboard/insights` | ✅ HTTP 200 |
| 데이터 반영 | HTML 검증 | ✅ 총 48 이벤트·UTM 부착 9·instagram·퍼널·전환율 카드 렌더 |
| 전환율 산출 | submitSuccess | ✅ `started 4 ÷ submit_clicked 4 = 100%` 표시 |
| 읽기 전용 | 코드 검토(aztks) | ✅ groupBy/count/findMany/aggregate만 — write 0 |
| prod 차단 | 코드 검토 | ✅ `getDeploymentEnv()==="production" → notFound` (logging-test 동일 패턴) |
| 빈 상태 | 코드 검토 | ✅ `total===0` 배너 + `pct` divide-by-zero→null→"—" 가드 |
| PII 0 | aztks 검증 | ✅ utm_source·카운트·timestamp만. route `sanitizeProps`로 utm 5종 외 차단 |
| 기존 무변경 | additive | ✅ 신규 파일 2개만. 마이그레이션 0. Mixpanel/Sentry/퍼널/진단/로거 무변경 |

**aztks-ai-peer:** VERDICT **GO** · `A:P Z:P T:P K:P S:P` · TOP_FIX(선택) = 입력완료율 카드 인라인 주의 → **적용 완료**.

---

## C. 사용자 직접 테스트 시나리오 (리뷰 아웃라인)

> ★ Draft PR 브랜치를 로컬에서 띄워 확인. production 배포 화면에는 **안 보임**(prod 차단 — 정상).

### C-1. 준비
```bash
git checkout feat/playboard-insights-dashboard
cd onday-app && npm run dev   # http://localhost:3000
```

### C-2. 시나리오
| # | 행동 | 기대 결과 |
|---|------|-----------|
| 1 | `/playboard/insights` 접속 | 200, 대시보드 렌더. 상단 배지에 총 이벤트·UTM·구간 표시 |
| 2 | 퍼널 섹션 확인 | landing_viewed→…→diagnosis_completed 막대·카운트, 랜딩 대비 % |
| 3 | 핵심 전환율 카드 | 입력완료율·제출성공률·공유생성률 + 분자/분모 실값. 분모 0이면 "—" |
| 4 | UTM 표 확인 | `instagram` 행 + landing/completed/전환율. (없으면 안내문) |
| 5 | `/landing?utm_source=naver&utm_medium=cpc` 진입 → 진단 1회 완료 | 잠시 후 `/playboard/insights` 새로고침 시 `naver` 채널 행 추가 |
| 6 | 푸터 확인 | 이벤트 단위·distinct 미적용·크론 후속 주의 노출 |
| 7 | (선택) prod 차단 검증 | `VERCEL_ENV=production` 빌드/배포 시 `/playboard/insights` → 404 |

### C-3. 리뷰 체크포인트
- [ ] 숫자가 Mixpanel 퍼널 추세와 방향성 일치하는가(절대값 아닌 구조).
- [ ] 빈 상태(데이터 0)에서 깨지지 않는가 — 새 preview DB로 확인 가능.
- [ ] 개인정보(주소·역명·이메일·토큰)가 화면에 **전혀** 없는가.
- [ ] 기존 진단/공유/랜딩 흐름이 그대로인가(대시보드는 별도 경로).

### C-4. 합격 기준
A·B 전 항목 ✅ + C-2 시나리오 1~6 기대결과 일치 → 머지 후보. (머지·이슈 발행은 사용자 직접.)
