# 동네궁합 — Interactions Spec

> 7개 화면의 **라우팅 맵**, **인터랙션 동작**, **상태 관리**를 정리한 문서입니다. React 개발자가 이 문서만 보고도 `useState`/`Context`/router 구조를 그대로 옮길 수 있도록 작성했습니다.
>
> - 디자인 토큰: `design-tokens.md`
> - 컴포넌트 명세: `components-spec.md`
> - 라우팅: Next.js App Router 기준 (`/diagnosis/result/[id]`는 parallel + intercepted route 권장)

---

## 1. 라우팅 맵 (Routing Map)

### 1.1 전체 화면 그래프

```
/login ──┬─▶ /diagnosis ──▶ /diagnosis/result ──┬─▶ /diagnosis/result/[id]  (BottomSheet 모달)
         │                  ▲                   │
         │                  │                   └─▶ /share/[uuid]   (CTA: 매물 N건 보기)
         │                  │                            │
         └────── 비회원 체험 ┘                            ▼
                                              /login (CTA: 회원가입)

/diagnosis (싱글모드 선택 시) ──▶ /single
/single (체크리스트 진입 시)   ──▶ /deadline
/deadline ◀────────────────── 회원 마이페이지 (out of scope)
```

### 1.2 라우팅 액션 표

| # | From | Trigger | Action | To | 조건/상태 변경 |
|---|---|---|---|---|---|
| 1 | `/login` | 카카오 버튼 click | OAuth 시작 (kakao popup) | `/diagnosis` | `session.user` 설정 · `auth.provider="kakao"` |
| 2 | `/login` | 네이버 버튼 click | OAuth 시작 (naver popup) | `/diagnosis` | `session.user` 설정 · `auth.provider="naver"` |
| 3 | `/login` | "로그인 없이 체험하기" click | guest 세션 발급 | `/diagnosis` | `session.guest=true`, `session.expiresAt` 24h |
| 4 | `/login` | 약관 링크 click | 외부 페이지 | `/terms` 또는 `/privacy` | none |
| 5 | `/diagnosis` | topbar 뒤로가기 | router.back() | `/login` | none |
| 6 | `/diagnosis` | "이전 조건 불러오기" click | localStorage `lastDiagnosis` 로드 | (same) | form 필드 hydrate |
| 7 | `/diagnosis` | AddressInput suggest 선택 | 자동완성 적용 | (same) | `form.addrA/B` 갱신 |
| 8 | `/diagnosis` | ModeSelector "커플" 클릭 | 모드 변경 | (same) | `form.mode = "couple"` |
| 9 | `/diagnosis` | ModeSelector "싱글" 클릭 | 모드 변경 | (same) | `form.mode = "single"` |
| 10 | `/diagnosis` | "진단 시작" CTA (mode=couple) | submit + 분석 | `/diagnosis/result?addrA=...&addrB=...&time=08:00` | URL query 전달 + `lastDiagnosis` 저장 |
| 11 | `/diagnosis` | "진단 시작" CTA (mode=single) | submit + 분석 | `/single?addr=...` | URL query 전달 |
| 12 | `/diagnosis/result` | 뒤로가기 | router.back() | `/diagnosis` | form 상태 유지 (uncontrolled persist) |
| 13 | `/diagnosis/result` | TimeTabs 클릭 | 시간대 변경 | (same) | `filters.time` 갱신 → 통근 재계산 |
| 14 | `/diagnosis/result` | FilterChip 통근시간 click | filter 모달/시트 | (same) | `filters.commuteMax` 갱신 |
| 15 | `/diagnosis/result` | FilterChip 예산 click | filter 모달/시트 | (same) | `filters.priceRange` 갱신 |
| 16 | `/diagnosis/result` | 고급 필터 IconButton click | 풀시트 모달 | (same) | `ui.advancedFilterOpen=true` |
| 17 | `/diagnosis/result` | 공유 IconButton click | 공유 시트 + URL 발급 | (same) | `share.uuid` 생성 + `Web Share API` |
| 18 | `/diagnosis/result` | MapMarker click | shallow route (intercepted) | `/diagnosis/result/[id]` | `selectedCandidate.id` 설정 + sheet open |
| 19 | `/diagnosis/result` | CandidateCard click | shallow route (intercepted) | `/diagnosis/result/[id]` | `selectedCandidate.id` 설정 |
| 20 | `/diagnosis/result/[id]` | sheet handle drag-down 또는 X click | sheet close | `/diagnosis/result` (intercept 해제) | `selectedCandidate=null` |
| 21 | `/diagnosis/result/[id]` | 백드롭 click | sheet close | `/diagnosis/result` | 위와 동일 |
| 22 | `/diagnosis/result/[id]` | Esc key | sheet close | `/diagnosis/result` | 위와 동일 |
| 23 | `/diagnosis/result/[id]` | "찜" IconButton click | toggle | (same) | `favorites[id]` push/remove + toast |
| 24 | `/diagnosis/result/[id]` | "공유" IconButton click | share API | (same) | `Web Share API` 또는 fallback 모달 |
| 25 | `/diagnosis/result/[id]` | "매물 N건 보기" CTA | full nav | `/share/[uuid]` (또는 `/listings/[id]`) | `share.uuid` 생성 |
| 26 | `/share/[uuid]` | LockedCard click (게스트) | nav | `/login?redirect=/share/[uuid]` | redirect 쿼리 보존 |
| 27 | `/share/[uuid]` | "회원가입하고 전체 보기" CTA | nav | `/login?redirect=/share/[uuid]` | 위와 동일 |
| 28 | `/share/[uuid]` | LockedCard click (회원) | unlock | (same) | `unlocked[id]=true` (블러 해제) |
| 29 | `/deadline` | 뒤로가기 | router.back() | `/diagnosis/result` 또는 `/single` | none |
| 30 | `/deadline` | 캘린더 prev/next | 월 변경 | (same) | `cal.month` ±1 |
| 31 | `/deadline` | 캘린더 cell click (interactive) | D-Day 변경 | (same) | `targetDate` 갱신 → DDayCounter 재계산 |
| 32 | `/deadline` | TimelineStep click | step 디테일 시트 | (same) | `ui.stepDetailOpen=stepId` |
| 33 | `/single` | SafetyCard click | nav | `/diagnosis/result/[id]` (single context) | `selectedCandidate.id` |
| 34 | `/single` | filter IconButton click | filter 시트 | (same) | `filters.safetyMin` 등 |
| 35 | `/single` | "리포트 저장 (PDF)" click | print dialog | (same) | `window.print()` 또는 PDF API |

> **Intercepted route**: `/diagnosis/result/[id]`는 `@modal/(.)diagnosis/result/[id]`로 만들어 카드/마커 클릭 시 BottomSheet로 열고, **새로고침/공유 URL로 직접 진입 시**에는 fullscreen 페이지로 폴백하는 패턴 권장.

---

## 2. 인터랙션 명세 (In-screen Interactions)

### 2.1 AddressInput · 자동완성 (`/diagnosis`)

| 항목 | 동작 |
|---|---|
| Trigger | `onFocus` + `onChange` (≥1자) |
| Debounce | **240ms** (입력 멈춘 후) |
| API | `GET /api/address/search?q={query}&limit=5` (카카오 로컬 또는 자체) |
| 결과 형식 | `{ id, title, sub, kind: '지하철역'|'지역'|'회사'|'도로명'|'지번' }` |
| 표시 위치 | 인풋 하단 (border-top, 같은 카드 내부) |
| 키보드 | ↑↓ highlight, Enter 선택, Esc 닫기, Tab 닫고 다음 필드 |
| 선택 동작 | `form.addrA = item.title`, dropdown 닫힘, focus 다음 필드로 이동, `verified=true` 마커 표시 |
| 빈 결과 | "검색 결과 없음" placeholder row (선택 불가) |
| 에러 | inline retry — "잠시 후 다시 시도해주세요" + 재시도 버튼 |
| 로딩 | 우측 search 아이콘을 spinner로 교체 (≥400ms 시) |

### 2.2 ModeSelector · 라디오 토글 (`/diagnosis`)

- 클릭 시 즉시 `form.mode` 변경 (controlled)
- 시각 피드백: 활성 카드 `bg → primary-soft`, 우상단 체크 뱃지 fade-in `120ms ease-out`
- 모드 전환 시 결과 라우트가 달라짐(라우팅 표 #10/11)
- 키보드: ←→로 이동, Space/Enter 선택

### 2.3 TimeTabs · 시간대 (`/diagnosis/result`)

- 클릭 즉시 `filters.time` 변경
- **통근 시간 재계산 트리거** — 200ms 디바운스 후 `recalculateCommutes(filters)` 호출
- 카드/마커는 데이터 갱신되는 동안 `opacity 0.6` + skeleton bar 유지
- URL 동기화: `router.replace({ query: { ...query, time } })`

### 2.4 FilterChip + Slider 시트 (`/diagnosis/result`)

| 단계 | 동작 |
|---|---|
| 진입 | chip click → BottomSheet `peek(40vh)` 열림 (220ms ease-out) |
| 슬라이더 변경 | onChange는 즉시(시각용), **API 호출은 200ms 디바운스** |
| 결과 반영 | candidates 배열 갱신 → 카드/마커 fade-cross 280ms |
| 닫기 | 핸들 drag-down · Esc · 백드롭 click |
| 적용 | 닫힐 때 chip 라벨 갱신 + URL query 동기화 |

### 2.5 BottomSheet · 일반 (`/diagnosis/result/[id]`, filters)

| 동작 | 스펙 |
|---|---|
| 진입 애니메이션 | `transform: translateY(100% → 0)` · `280ms cubic-bezier(.32,.72,0,1)` |
| 백드롭 | `opacity 0 → 1` · `220ms ease-out` · `bg rgba(11,18,32,0.45)` |
| 종료 | 진입 반대 (`240ms`) |
| Drag-to-dismiss | 핸들 또는 시트 상단 잡고 ↓ ≥120px 또는 velocity ≥0.5 → close |
| 닫기 트리거 | (a) X 버튼 (b) Esc (c) 백드롭 click (d) drag-down (e) 뒤로가기 |
| 포커스 | 진입 시 첫 interactive에 포커스, 종료 시 트리거 요소로 복귀 |
| 배경 | `aria-hidden="true"`, `inert` 속성으로 키보드 진입 차단 |
| reduced-motion | 애니메이션 없이 즉시 표시/제거 |

### 2.6 모달 (탑업/공유) — 페이드 모달

- 진입: `opacity 0 → 1` + `scale 0.96 → 1` · **200ms ease-out**
- 종료: 반대 · 160ms
- 닫기 시 **미리보기 화면으로 복귀** — `selectedCandidate`만 null로 리셋, 스크롤 위치/필터 유지

### 2.7 카드/마커 호버 (`/diagnosis/result`)

| 인터랙션 | 동작 |
|---|---|
| Card hover | `transform: translateY(-1px)` + shadow 강화 (180ms) |
| Card focus-visible | outline 2px primary + offset 2px |
| Marker hover | 반지름 14 → 16 (140ms) + tooltip 라벨 |
| Marker click 시 | (1) marker 선택 채움 변경 (2) sheet 열림 (3) 카드 리스트 자동 스크롤 → 해당 카드 highlight 600ms |

### 2.8 LockedCard · 잠금 (`/share/[uuid]`)

- hover: 오버레이 `bg rgba(11,18,32,0.40)` (살짝 밝게) — 가입 유도
- click (게스트): `/login?redirect=` 이동
- click (회원): blur 0으로 380ms ease-out, 오버레이 fade-out 200ms

### 2.9 DDayCounter · 자동 갱신 (`/deadline`)

- mount 시 + 매 자정에 `daysLeft` 재계산 (`setInterval` 또는 `setTimeout` 다음 자정까지)
- urgency 자동 매핑: ≤7 → `soon` (글로우 펄스 1.6s loop), ≤1 → `critical` (danger 그라디언트)
- reduced-motion 시 펄스 비활성화

### 2.10 MiniCalendar · 월 이동 (`/deadline`)

- prev/next click → 월 변경, grid `opacity 0.4 → 1` 160ms cross-fade
- target cell 클릭 시(인터랙티브 모드): `targetDate` 갱신 → DDayCounter 동기화, toast "이사일이 5월 27일로 변경되었어요"
- 키보드: ←→ 일 이동, ↑↓ 주 이동, PageUp/Down 월 이동

### 2.11 TimelineStep · 진행 (`/deadline`)

- 시각 status는 `today` 시점 기준 자동 계산 (D-N 비교)
- click → step 디테일 시트 열림 (체크리스트 항목, 첨부 등)
- 진행 라인 fill (`timeline__line-fill`) 높이 = `(현재 step index / 전체 step) * 100%`

### 2.12 SafetyBar · 등급 막대 (`/single`)

- IntersectionObserver `threshold: 0.4`로 viewport 진입 시 `width 0 → percent` 380ms ease-out
- reduced-motion 시 즉시 표시
- tick 4분위 (25/50/75) 항상 표시

### 2.13 StickyCTABar (`/diagnosis`, `/share`)

- 스크롤 시 항상 하단 고정 (`position: sticky`)
- 키보드 호출 시 `viewport-fit=cover` + `padding-bottom: env(safe-area-inset-bottom)` 유지
- iOS Safari 키보드 떴을 때 자동 가려짐 → `visualViewport.resize` 리스너로 `bottom` 재계산

### 2.14 토스트 (Toast)

- 위치: 화면 상단 중앙, 24px below safe-area
- 진입: `translateY(-12px) → 0` + opacity, 200ms
- 종료: 자동 3.5s, 또는 swipe-up 즉시
- variant: `success` (ok green), `info`, `warning`, `error`

---

## 3. 상태 관리 명세 (State Management)

### 3.1 글로벌 상태 (Context / Zustand 권장)

```ts
// stores/session.ts
interface SessionState {
  user: { id: string; nickname: string; provider: 'kakao' | 'naver' } | null;
  guest: boolean;
  expiresAt: number | null;
  setUser: (u: SessionState['user']) => void;
  startGuest: () => void;
  signOut: () => void;
}

// stores/favorites.ts
interface FavoritesState {
  ids: Record<string, true>;        // candidateId → true
  toggle: (id: string) => void;
}

// stores/ui.ts (글로벌 UI 플래그)
interface UIState {
  toast: { kind: ToastKind; message: string } | null;
  showToast: (t: UIState['toast']) => void;
}
```

### 3.2 화면별 로컬 상태

#### `/login`
```ts
// React state — Server Component이면 form action 사용
const [loading, setLoading] = useState<'kakao' | 'naver' | 'guest' | null>(null);
const [error, setError] = useState<string | null>(null);
```
- 외부 의존: `SessionState.setUser` / `startGuest`
- URL: `?redirect=/share/abc` 보존 → 로그인 성공 시 redirect 우선

#### `/diagnosis`
```ts
// react-hook-form 권장
type DiagnosisForm = {
  addrA: AddressSuggestion | null;
  addrB: AddressSuggestion | null;     // 싱글 모드면 무시
  mode: 'couple' | 'single';
  preferredTime: '07:00' | '08:00' | '09:00' | '10:00';
};

// 자동완성 — 필드별로 hook
const { suggestions, loading } = useAddressSuggest(query, { debounce: 240 });

// localStorage 영속
useEffect(() => {
  const last = JSON.parse(localStorage.getItem('lastDiagnosis') ?? 'null');
  if (last) reset(last);
}, []);
```
- submit 시: `localStorage.setItem('lastDiagnosis', JSON.stringify(values))` + `router.push('/diagnosis/result?...')`
- mode가 `single`이면 `addrB` validation skip

#### `/diagnosis/result`
```ts
// URL = source of truth (shallow routing)
type ResultQuery = {
  addrA: string;
  addrB: string;
  time: '07:00' | '08:00' | '09:00' | '10:00';
  commuteMax?: number;        // 분
  priceMin?: number;          // 억
  priceMax?: number;
  sort?: 'score' | 'commute' | 'price';
};

// fetch
const { data, isLoading } = useQuery({
  queryKey: ['candidates', query],
  queryFn: () => fetchCandidates(query),
  keepPreviousData: true,     // 슬라이더 변경 시 깜빡임 방지
});

// 클라이언트 ephemeral
const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null); // intercept route 사용 시 URL로 대체
const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
```
- **소스 오브 트루스**: 필터/시간은 URL query (북마크/공유 가능). selectedCandidate는 intercepted route(`/diagnosis/result/[id]`)로 URL에 반영.
- 디바운스: 슬라이더 onChange는 React state 즉시 / URL `router.replace`는 200ms 후

#### `/diagnosis/result/[id]` (DetailSheet)
```ts
// 라우트 파라미터에서 id 추출
const { id } = useParams();
const { data: candidate } = useQuery({
  queryKey: ['candidate', id],
  queryFn: () => fetchCandidate(id),
});

// 좋아요 — 글로벌 FavoritesState에서 조회/토글
const liked = useFavorites(s => !!s.ids[id]);
```
- close handler = `router.back()` (intercepted route 자동 해제)

#### `/share/[uuid]`
```ts
type ShareState = {
  uuid: string;
  isAuthenticated: boolean;       // session.user !== null
  isPasswordVerified: boolean;    // (옵션) 비공개 공유 시
  unlocked: Record<string, boolean>;   // 회원이라도 카드별 unlock 트래킹
};

const { data: report } = useQuery({
  queryKey: ['share', uuid],
  queryFn: () => fetchSharedReport(uuid),
});

const isAuthenticated = useSession(s => s.user !== null);
```
- 게스트일 때 LockedCard 클릭 → `/login?redirect=/share/{uuid}` 라우팅 (`unlocked` 무관)
- 회원일 때 mount 시 모든 카드 `unlocked=true`로 일괄 설정 가능 (자동 언락 정책)
- `expiresAt` 초과 시 `/share/expired` 폴백

#### `/deadline`
```ts
type DeadlineState = {
  targetDate: string;             // ISO date "2026-05-27"
  cal: { year: number; month: number };  // 캘린더 표시 월
  steps: TimelineStepData[];      // 서버에서 fetch
  currentStepId: string | null;   // (이번주 진행 중인 step)
};

// derived
const daysLeft = useMemo(
  () => differenceInDays(parseISO(targetDate), startOfDay(new Date())),
  [targetDate]
);
const urgency = daysLeft <= 1 ? 'critical' : daysLeft <= 7 ? 'soon' : 'normal';

// auto-tick 매 자정
useEffect(() => {
  const timer = scheduleNextMidnight(() => forceRerender());
  return () => clearTimeout(timer);
}, []);
```
- 서버 동기화: `currentStepId`는 마지막 체크된 step (서버 상태)

#### `/single`
```ts
type SingleState = {
  filters: {
    safetyMin: SafetyGrade;        // 'A'|'B'|'C'|'D' 이상
    commuteMax: number;
    priceRange: [number, number];
  };
  // 지도 레이어 토글 (확장)
  layerToggles: {
    safety: boolean;       // 야간 안전 격자
    convenience: boolean;  // 편의시설 (CU/GS 등)
    cafe: boolean;
    pharmacy: boolean;
  };
};

const { data: candidates } = useQuery(['single-candidates', filters], fetchSingle);
```
- PDF 저장: `window.print()` + 전용 print stylesheet (헤로/푸터 hide, 카드 page-break-inside: avoid)

### 3.3 상태 저장 위치 매트릭스

| 상태 | 저장 위치 | 영속 |
|---|---|---|
| `session.user`, `session.guest` | global store + httpOnly cookie | 30일 (회원), 24h (게스트) |
| `favorites.ids` | global store + 회원 시 서버 동기화 | 영구 |
| `lastDiagnosis` | localStorage | 영구 (수동 삭제까지) |
| `filters` (result/single) | URL query | 세션 (북마크/공유 가능) |
| `selectedCandidate` | URL pathname (intercepted route) | 라우트 |
| `advancedFilterOpen`, `stepDetailOpen` 등 UI 플래그 | local useState | 라우트 |
| toast | global store | 3.5초 |
| `targetDate` (deadline) | 서버 + `?date=` query 폴백 | 영구 |
| `expiresAt` (share) | 서버 응답 | 7일 |

---

## 4. URL 디자인 규약

```
/login?redirect=<encoded-url>              # 로그인 후 돌려보낼 곳
/diagnosis                                  # form은 localStorage hydrate
/diagnosis/result?addrA=...&addrB=...&time=08:00&commuteMax=45&priceMin=7&priceMax=12
/diagnosis/result/[id]                      # intercepted modal
/share/[uuid]                               # 7일 한정 공유
/deadline?date=2026-05-27                   # ?date 폴백 (회원이면 서버 우선)
/single?addr=...&time=08:00
/terms, /privacy                            # 정적
```

- 모든 query 변경은 `router.replace` (history 누적 방지)
- 카드/마커 클릭 → `router.push` (뒤로가기로 모달 close 가능)
- 공유 URL은 항상 `https://onday.app/share/[uuid]` 형식, 7일 후 410 응답

---

## 5. 키보드 / 단축키 매트릭스

| 컨텍스트 | Key | Action |
|---|---|---|
| 전역 | `Esc` | 최상위 BottomSheet/Modal 닫기 |
| 전역 | `?` (Shift+/) | 단축키 도움말 (개발자용 토글) |
| AddressInput | `↑/↓` | suggest highlight |
| AddressInput | `Enter` | 선택 |
| AddressInput | `Esc` | dropdown 닫기 |
| AddressInput | `Tab` | dropdown 닫고 다음 필드 |
| ModeSelector | `←/→` | 모드 변경 |
| ModeSelector | `Space/Enter` | 선택 |
| TimeTabs | `←/→` | 탭 이동 |
| MapMarker | `Tab` | 마커 순회 |
| MapMarker | `Enter` | 시트 열기 |
| MiniCalendar | `←/→` | 일 이동 |
| MiniCalendar | `↑/↓` | 주 이동 |
| MiniCalendar | `PageUp/Down` | 월 이동 |
| MiniCalendar | `Enter` | 날짜 선택 |
| BottomSheet | `Esc` | 닫기 |
| BottomSheet | `Tab` | 트랩 (시트 내부 순회) |

---

## 6. 데이터 페칭 / 캐싱 (TanStack Query 권장)

| Key | TTL | 갱신 |
|---|---|---|
| `['candidates', resultQuery]` | 5분 | 필터 변경 시 즉시 |
| `['candidate', id]` | 5분 | sheet 열릴 때 |
| `['address', q]` | 1분 | 240ms debounce |
| `['share', uuid]` | 5분 | mount 시 1회 |
| `['deadline-steps']` | 1분 | mount + 자정 |
| `['single-candidates', filters]` | 5분 | 필터 변경 시 |

- `keepPreviousData: true` — 슬라이더/탭 전환 깜빡임 방지
- mutation(좋아요, 가입 후 unlock 등): optimistic update + rollback

---

## 7. 에러 / 빈 상태 / 로딩 상태

| 화면 | 로딩 | 빈 상태 | 에러 |
|---|---|---|---|
| `/diagnosis/result` | 카드 4개 skeleton (180ms 후 표시) + 지도 회색 | "조건에 맞는 동네가 없어요" + 필터 완화 CTA | inline 토스트 + retry |
| `/diagnosis/result/[id]` | sheet 안 skeleton 3행 | (없음 — id 잘못이면 404) | 시트 내 retry |
| `/share/[uuid]` | hero placeholder + locked card 4개 그대로 | (없음) | "리포트가 만료되었어요" + 새 리포트 만들기 CTA |
| `/deadline` | 카운터 "—" 표시 | (없음) | "데드라인을 불러오지 못했어요" + retry |
| `/single` | 카드 skeleton 4개 | "조건에 맞는 동네가 없어요" | inline 토스트 |

- skeleton 진입 지연 180ms — 빠른 응답일 때 깜빡임 방지
- 모든 에러는 토스트 + inline 메시지 둘 다 (스크린리더 announce는 토스트만)

---

## 8. 분석/측정 이벤트 (Telemetry)

| Event | Trigger | Payload |
|---|---|---|
| `auth_signin` | OAuth 성공 | `{ provider }` |
| `auth_guest` | 비회원 시작 | `{}` |
| `diagnosis_submit` | 진단 시작 CTA | `{ mode, time, addrA_hash, addrB_hash }` |
| `result_view` | result mount | `{ candidateCount, time }` |
| `result_filter_change` | chip/슬라이더 변경 | `{ kind, value }` |
| `candidate_open` | 카드/마커 click | `{ id, rank, source: 'card'|'marker' }` |
| `candidate_like` | 찜 click | `{ id, action: 'add'|'remove' }` |
| `share_create` | 공유 click | `{ candidateCount, uuid }` |
| `share_unlock_click` | LockedCard click | `{ uuid, isAuthenticated }` |
| `signup_complete` | 회원가입 완료 | `{ provider, redirect }` |

---

## 9. 권한 / 게이팅 매트릭스

| 기능 | 게스트 | 회원 |
|---|:-:|:-:|
| /diagnosis 진단 | ● | ● |
| /diagnosis/result 보기 (top 1) | ● | ● |
| /diagnosis/result 후보 전체 | ● (5개) | ● (전체) |
| /diagnosis/result/[id] 상세 | ● | ● |
| 찜 | (세션 한정) | ● 영구 |
| /share/[uuid] 발급 | ● (24h) | ● (7일) |
| /share/[uuid] LockedCard 해제 |   | ● |
| /deadline | (로컬만) | ● |
| /single | ● | ● |
| PDF 저장 | ● | ● |

---

**제작 노트**: 모든 라우팅은 Next.js App Router 기준이며, 모달은 parallel + intercepted route로 구현하면 카드/마커 클릭 시 바텀시트가 열리고 새로고침/공유 URL로 직접 진입 시 fullscreen 페이지로 폴백됩니다. 상태는 (1) URL query (2) global store (Zustand 권장) (3) localStorage (4) component-local 순으로 우선순위를 두고, 가능한 한 URL을 source of truth로 사용하세요.
