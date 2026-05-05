# 동네궁합(Onday) — Claude Code 핸드오프 번들

> **한국 프롭테크 — 동네 궁합 진단기.** 두 사람의 출퇴근지·예산·선호 시간대를 입력하면 통근시간, 안전등급, 편의시설을 종합해 살기 좋은 동네를 추천하는 모바일 우선 웹앱.

이 번들은 디자인 → 개발 핸드오프 패키지입니다. Claude Code 또는 Antigravity가 이 폴더 하나로 production 코드를 자율적으로 작성할 수 있도록, 토큰·컴포넌트·인터랙션·레퍼런스 화면·Tailwind/shadcn 코드 스니펫을 모두 담았습니다.

---

## 📦 번들 구성

```
handoff-bundle/
├── README.md                    ← 지금 보고 있는 파일 (번들 개요 + 디자인 결정 사항)
├── BUILD_INSTRUCTIONS.md        ← Claude Code에 그대로 복붙할 첫 명령
├── design-tokens.md             ← 컬러·타입·간격·그림자 + Tailwind/shadcn 변환 가이드
├── components-spec.md           ← 31개 React 컴포넌트 명세 (TS Props · 상태 · a11y · 반응형)
├── interactions-spec.md         ← 라우팅 맵 + 인터랙션 + 상태 관리 (App Router · Zustand · TanStack Query)
├── tailwind-config-snippet.ts   ← design-tokens.md → Tailwind v3 config 변환 코드 (그대로 사용 가능)
├── globals-css-snippet.css      ← shadcn/ui 호환 :root CSS 변수 (HSL 채널)
└── screens/                     ← 디자인 레퍼런스 — 시각적 truth
    ├── index.html               — 7개 화면 그리드 (목차)
    ├── login.html               — /login (OAuth · 게스트 진입)
    ├── diagnosis.html           — /diagnosis (주소·시간·모드 입력)
    ├── result.html              — /diagnosis/result (지도+카드 비교)
    ├── detail.html              — /diagnosis/result/[id] (BottomSheet 상세)
    ├── share.html               — /share/[uuid] (블러 잠금 + 가입 유도)
    ├── deadline.html            — /deadline (D-Day + 캘린더 + 타임라인)
    ├── single.html              — /single (싱글모드 안전 위주)
    ├── styles.css               — 토큰이 실제로 적용된 CSS (참고)
    └── script.js                — 데모용 인터랙션 JS
```

---

## 🎯 사용 방법

### 1. Claude Code / Antigravity에 가져갈 때

```bash
unzip handoff-bundle.zip
cd <project-root>
# tasks/와 SRS/를 상위에 두는 권장 구조:
# repo-root/
# ├── handoff-bundle/         ← 이 번들
# ├── tasks/                  ← UI-XXX, CMD-XXX, QRY-XXX 명세
# └── SRS-from-PRD-동네궁합진단기/
```

### 2. 첫 명령

`BUILD_INSTRUCTIONS.md` 안의 코드블록 전체를 복사해서 Claude Code 첫 메시지로 붙여넣으세요. 분석 6단계가 끝나고 동의를 받으면 자율 빌드가 시작됩니다.

### 3. 토큰 적용 흐름

```
design-tokens.md         (사람이 읽는 명세)
    ↓
globals-css-snippet.css  (CSS :root 변수 — 그대로 src/app/globals.css에 복사)
    ↓
tailwind-config-snippet.ts (Tailwind theme.extend — 그대로 tailwind.config.ts에 복사)
    ↓
shadcn/ui 컴포넌트가 자동으로 토큰 사용
    ↓
components-spec.md 기반 31개 커스텀 컴포넌트 빌드
```

---

## 🎨 디자인 결정 사항 (Why)

### 컬러
- **신뢰 블루 `#2563EB`를 메인 브랜드 컬러로** — 부동산·금융 도메인의 신뢰감, 한국 사용자에게 친숙한 톤. 보라계 `#7C3AED`는 "B 태그(배우자)" 등 보조 강조에만 한정.
- **순흑(`#000`) 사용 금지** — 한국어 본문에서 명도 대비가 과해 피로감 누적. 잉크는 `#0B1220` 기반 3단 스케일.
- **OAuth 색은 로그인 외 사용 금지** — 카카오 `#FEE500`, 네이버 `#03C75A`는 브랜드 가이드라인 준수.
- **안전등급은 색 + 글자 + 라벨 3중 표기** — 색맹 사용자도 A/B/C/D를 구분할 수 있도록 컴포넌트 레벨에서 강제.

### 타이포그래피
- **Pretendard** — 한국어/영문/숫자 동시 가독성. CDN 무료, 사내 호스팅도 가능.
- **숫자는 tabular-nums** — 통근시간·D-Day·가격 등 비교 UI에서 자릿수 정렬 보장.

### 간격
- **`--s-1`(4px) ~ `--s-10`(64px) 10단계** — 모바일 우선 8px 베이스. Tailwind 기본 spacing은 그대로 두고 `s-N` 별칭 추가 → 디자인 토큰명을 그대로 클래스에 쓸 수 있음 (`p-s-3` 등).

### 카드 / 라디우스 / 그림자
- **카드 통일**: `bg-surface + border-card-border + radius-lg(12px) + shadow-card` — 7개 화면 어디서든 동일.
- **`shadow-sheet`는 위쪽으로 떨어지는 그림자** — 바텀시트가 화면 하단에서 올라올 때만 사용.
- **포커스 링은 모든 인터랙티브 요소에 자동 적용** — `globals-css-snippet.css`의 `:where(...) :focus-visible` 룰로 베이스 강제.

### 컴포넌트 구조
- **`BottomSheet`(primitive)와 `DetailSheet`(composite) 분리** — 시트 셸은 재사용, 컨텐츠는 화면별 조립.
- **`MapMarker` / `MapCanvas` 분리** — placeholder ↔ Kakao Map SDK 교체 시 컴포넌트 시그니처 유지.
- **`/diagnosis/result/[id]`는 parallel + intercepted route** — 카드/마커 클릭 시 바텀시트, 새로고침/공유 진입 시 fullscreen 페이지로 폴백.
- **상태 우선순위: URL → 글로벌 store → localStorage → useState** — 필터·선택을 URL에 두면 북마크/공유 가능.

### 모션
- **시트 280ms `cubic-bezier(0.32, 0.72, 0, 1)`** — iOS native 시트와 동일한 곡선. 사용자 손가락 따라가는 느낌.
- **모달 200ms 페이드 + 0.96→1 scale** — 가벼운 confirm 다이얼로그용.
- **`prefers-reduced-motion` 시 모든 애니메이션 0.01ms로 단축** — globals.css에서 일괄 처리.

---

## ⚠️ 미해결 이슈 (빌드 단계에서 처리)

| # | 이슈 | 처리 방향 |
|---|---|---|
| 1 | **Kakao Map SDK 통합** — placeholder로 디자인됨 | `react-kakao-maps-sdk` 도입, `MapCanvas` 컴포넌트 내부만 교체. API 키는 env. |
| 2 | **Supabase OAuth (카카오/네이버)** — Mock으로 디자인됨 | `@supabase/ssr` + httpOnly cookie. 카카오·네이버 OAuth provider는 Supabase 대시보드에서 설정. 게스트 세션은 별도 cookie로 관리. |
| 3 | **통근시간 계산 데이터** — 시드 데이터로 가짜 표시 중 | 카카오 길찾기 API 또는 자체 데이터. Mock 단계에서는 candidate-id별 고정값. |
| 4 | **안전 격자 데이터** — 가상 격자만 표시 | 공공데이터 (경찰청 5대 범죄 격자, CCTV 위치) 통합 필요. SafetyGrade 매핑 알고리즘 별도 정의 필요. |
| 5 | **공유 URL 만료** — 7일 정책 디자인됨 | DB row의 `expires_at` 컬럼 + 410 응답 + `/share/expired` 폴백 페이지. |
| 6 | **PDF 저장 (/single, /share)** — `window.print()` 가정 | 인쇄 stylesheet 작성 필요. 차트 SVG는 print에서도 깨지지 않도록. |
| 7 | **모바일 키보드 + 바텀시트 충돌** — iOS Safari `visualViewport` 처리 필요 | `BottomSheet` 컴포넌트에서 `visualViewport.resize` 리스너로 `bottom` 재계산. |
| 8 | **Pretendard 폰트 로딩 전 FOUT** | `next/font` 또는 self-host. `font-display: optional` 권장. |

---

## 🛡️ 디자인 보존 규칙 (Critical)

- `screens/*.html`이 **시각적 truth**입니다. 픽셀·간격·컬러·radius를 임의로 바꾸지 마세요.
- 토큰 이름은 `design-tokens.md` 명명 그대로 옮기세요 (`--primary`, `--s-3`, `--shadow-card` 등).
- **Pretendard**가 기본 한글 폰트 — `globals-css-snippet.css`에 CDN 포함됨.
- **OAuth 컬러**(카카오 `#FEE500`, 네이버 `#03C75A`)는 로그인 외 사용 금지.
- **안전등급 뱃지**는 letter + label + 색의 3중 표기 (색맹 대응).
- **포커스 링**은 모든 인터랙티브 요소에 2px 브랜드 컬러 + 2px offset 필수 (globals.css에서 자동).

---

## 📞 핸드오프 메타

- **Source of truth**: `screens/*.html` (디자인) + 3개 spec 문서 (구조)
- **Tech Stack 확정**: Next.js 14 App Router · TypeScript strict · Tailwind · shadcn/ui · Zustand · TanStack Query · react-hook-form + Zod · `react-kakao-maps-sdk` · Supabase Auth (`@supabase/ssr`) · Prisma · Sentry · Playwright + Vitest + axe
- **Out of scope (이번 빌드)**: 실 백엔드 API, 결제, 관리자 대시보드
- **빌드 우선순위**: SRS > tasks > 이 번들 (충돌 시)

> 이 번들로 막히면 `BUILD_INSTRUCTIONS.md` 마지막의 "에이전트 질문 가이드"를 참고하세요.
