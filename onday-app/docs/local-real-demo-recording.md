# 로컬 real 데모 녹화 체크리스트 (경로 2)

> **목적**: 로컬을 real 모드로 띄워 **실제 경로선(🚇 대중교통 정거장선 + 🚗 자동차 도로선)** 을
> 화면 녹화 → 이력서/포트폴리오 첨부. **라이브 배포는 mock 유지(안정)**.

## 왜 경로 2인가

| | mock (현재 라이브) | 로컬 real (경로 2) | Vercel real 풀배포 (경로 1) |
|---|---|---|---|
| 경로선 | 직선 점선 | **실제 경로선** ✅ | 실제 경로선 |
| 대중교통(ODsay) | — | **동작** (집 IP 등록) ✅ | ⚠️ Vercel 동적 IP → 화이트리스트 불가(유료 고정 IP 필요) |
| 자동차(Kakao) | — | 동작 ✅ | 동작 (도메인 등록) |
| 비용/리스크 | 0 | **0** | ODsay 고정 IP(유료) + 도메인 등록 |
| 형태 | — | **영상** | 라이브 클릭 |

→ 화면은 경로 1과 **동일**. 차이는 "라이브 클릭 vs 영상"뿐이고, 로컬 real은 ODsay 화이트리스트가
집 IP로 간단히 풀려 **대중교통까지 완전**하다.

핵심 원리: `commuteACar`·`routePath`는 **real 모드(`run-real-diagnosis`)에서만 생성**된다.
mock(`runMockDiagnosis`)은 haversine 추정만 → 직선. (`NEXT_PUBLIC_USE_MOCK` 토글)

---

## STEP 1 — 집 공인 IP를 ODsay에 등록

ODsay Server 키는 **공인 IP 화이트리스트 강제**라, 내 IP를 등록해야 `/api/commute`가 동작한다.

```bash
# 내 현재 공인 IP 확인
curl ifconfig.me
```

1. [ODsay LAB 콘솔](https://lab.odsay.com) 로그인 → 내 API 키
2. **허용 IP**에 위에서 확인한 공인 IP 추가 → 저장
3. (IP가 바뀌면 — 공유기 재시작·망 변경 — 다시 확인 후 갱신)

> 자동차(Kakao)는 브라우저 직접 호출이라 IP 등록 불필요. 단, 카카오 키가 도메인 제한이면
> `localhost` 가 허용 도메인에 있어야 한다(보통 기본 포함). 401 나면 Kakao 콘솔 Web 도메인에
> `http://localhost:3000` 확인.

## STEP 2 — 키가 `.env.local`에 있는지 확인

`.env.local`에 아래 4개가 채워져 있어야 한다 (이미 있으면 그대로):

```
NEXT_PUBLIC_KAKAO_MAP_KEY=...        # 지도 타일 (JavaScript 키)
NEXT_PUBLIC_KAKAO_REST_API_KEY=...   # 자동차 길찾기 (REST 키, 브라우저 직접)
ODSAY_API_KEY=...                    # 대중교통 (Server 키, /api/commute)
# KAKAO_MOBILITY_API_KEY 는 코드 미사용 — 없어도 됨
```

> `.env.local`의 `NEXT_PUBLIC_USE_MOCK=true`는 **건드리지 않는다**. 아래 STEP 3에서
> 셸 인라인으로만 override → 평소 `npm run dev`는 mock 그대로 유지.

## STEP 3 — 로컬 real 모드로 띄우기

`.env.local` 파일을 수정하지 않고 **셸 인라인 override**로 real 전환 (mock 기본값 보존):

```bash
# 기존 dev 서버 종료 + 캐시 삭제 (mock 값이 인라인 박혀있던 stale 방지)
lsof -ti:3000 | xargs kill -9 2>/dev/null; rm -rf .next

# real 모드 + 로그인은 mock 유지(데모 진입 마찰 0)로 띄우기
NEXT_PUBLIC_USE_MOCK=false NEXT_PUBLIC_USE_MOCK_AUTH=true npm run dev
```

- `USE_MOCK=false` → 진단이 ODsay·Kakao 실 호출 (경로선 생성)
- `USE_MOCK_AUTH=true` → 로그인은 mock(게스트) → 녹화 중 OAuth 안 거침
- Next.js는 셸 env가 `.env.local`보다 우선 → 파일 안 건드림

## STEP 4 — 진단 후 검증 포인트

http://localhost:3000 → 진단(부부 또는 싱글) 입력 → 결과
(real이라 실 API 호출로 mock보다 몇 초 더 걸림)

- [ ] 메인 지도: 후보→직장 선이 **🚇 정거장 따라 / 🚗 도로 따라 꺾임** (직선 아님)
- [ ] 🚇/🚗 **토글 전환** 시 선 모양 바뀜
- [ ] 카드 탭 → 시트 **통근 정보**에 `대중교통` + `차량` **두 그룹 다** 표시
- [ ] (싱글) 직장A 파랑 + 여가거점 녹색 마커 + 카드 탭 상세
- [ ] 결과가 비면 → ODsay IP 미등록 신호 (STEP 1 재확인. commuteA 필수라 실패 시 후보 drop)

## STEP 5 — 화면 녹화 (macOS)

- **단축키**: `Cmd + Shift + 5` → 영역 선택 → 녹화 → 정지(메뉴바 ■)
- 모바일 비율로 보이게: 브라우저 창 좁히거나 반응형(375px) 뷰
- 녹화 시나리오 예: 진단 입력 → 결과 지도 → 🚇/🚗 토글 → 카드 탭 → 시트(통근 두 모드) → 찜 → 찜 목록

## 되돌리기 (mock 복귀)

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; rm -rf .next
npm run dev   # .env.local 기본값(USE_MOCK=true) → mock
```

라이브(Vercel)는 처음부터 손 안 댔으니 그대로 mock·안정.

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| 결과가 빔 / 후보 0개 | ODsay IP 미등록 → commuteA 실패 → 후보 전부 drop | STEP 1 (공인 IP 재확인·등록) |
| 지도 타일 안 뜨고 격자만 | Kakao Map JS 키 401 (도메인) | Kakao 콘솔 Web 도메인에 `http://localhost:3000` |
| 자동차 선만 직선 | Kakao REST 키 없음/실패 (자동차 best-effort) | `NEXT_PUBLIC_KAKAO_REST_API_KEY` 확인 |
| 토글 차량 행 안 나옴 | `commuteACar` 미생성 = mock 모드 | STEP 3 인라인 override 확인 (`USE_MOCK=false`) |
| 셸 종료해도 mock 안 돌아옴 | `.next` 캐시 stale | `rm -rf .next` 후 재시작 |

> 참고: 경로 1(Vercel 풀배포)은 `docs/` 외 별도 — ODsay 고정 출站 IP(Vercel Pro 유료) 해결이 전제.
