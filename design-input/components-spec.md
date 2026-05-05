# 동네궁합 — Components Spec

> 7개 화면(`login`, `diagnosis`, `result`, `detail`, `share`, `deadline`, `single`)에서 추출한 **재사용 가능한 UI 컴포넌트 명세**입니다. 각 컴포넌트는 ① 이름 ② Props (TypeScript) ③ 등장 화면 ④ 변형 ⑤ 상태 ⑥ 접근성 ⑦ 반응형 항목을 포함합니다.
>
> - 디자인 토큰은 `design-tokens.md` 참조 (`--primary`, `--card-border`, `--card-radius` 등).
> - 코드 식별자는 PascalCase, props는 camelCase, slot은 `children` / `leading` / `trailing` 컨벤션.
> - 모든 컴포넌트는 React + TypeScript + Tailwind/shadcn 기반으로 마이그레이션 가능하도록 명세.

## 컴포넌트 목록 (Index)

| # | 컴포넌트 | 카테고리 | 등장 화면 |
|---|---|---|---|
| 01 | `PhoneFrame` | Layout | (개발용) 전 화면 |
| 02 | `AppHeader` | Navigation | diagnosis, result, deadline |
| 03 | `IconButton` | Action | 전 화면 |
| 04 | `Button` | Action | 전 화면 |
| 05 | `OAuthButton` | Action | login |
| 06 | `StickyCTABar` | Action | diagnosis, share |
| 07 | `AddressInput` | Form | diagnosis |
| 08 | `SuggestList` | Form | diagnosis |
| 09 | `ModeSelector` | Form | diagnosis |
| 10 | `Tabs` (TimeTabs) | Form | result |
| 11 | `FilterChip` | Form | result |
| 12 | `FilterPanel` | Composite | result |
| 13 | `Pill` / `Badge` | Display | 전 화면 |
| 14 | `DataSourceBadge` | Display | share |
| 15 | `SafetyGradeBadge` | Display | single |
| 16 | `Stat` (Tile) | Display | result, detail, share, single |
| 17 | `CommuteChip` | Display | result, detail |
| 18 | `MapMarker` | Map | result, detail |
| 19 | `MapCanvas` | Map | result, detail |
| 20 | `CandidateCard` | Card | result |
| 21 | `ReportCard` | Card | share |
| 22 | `LockedCard` | Card | share |
| 23 | `SafetyCard` | Card | single |
| 24 | `BottomSheet` | Surface | detail |
| 25 | `DetailSheet` | Composite | detail |
| 26 | `DDayCounter` | Display | deadline |
| 27 | `MiniCalendar` | Display | deadline |
| 28 | `TimelineStep` | Display | deadline |
| 29 | `LegendBar` | Display | single |
| 30 | `SafetyBar` | Display | single |
| 31 | `ShareHero` | Composite | share |

---

## 01. PhoneFrame

데스크탑에서 모바일 화면을 폰 베젤로 감싸 보여주는 개발용 래퍼. ≤480px에서는 풀스크린으로 폴백.

```ts
interface PhoneFrameProps {
  children: React.ReactNode;
  /** status bar 톤 — 헤로가 어두울 때 'dark' */
  statusBarTone?: 'light' | 'dark';   // default 'light'
  /** screen 배경 (--surface | --bg | --surface-soft) */
  screenBackground?: 'surface' | 'bg' | 'soft';   // default 'surface'
  /** dev-only: 화면 라벨 (data-screen-label용) */
  screenLabel?: string;
}
```
- **등장 화면**: 전 화면 (개발 시안용; 프로덕션에서는 제거)
- **변형**: `tone` (light/dark statusbar), `background` (3종)
- **상태**: 정적 — 상태 없음
- **접근성**: 베젤은 `aria-hidden="true"`. 실제 컨텐츠는 `<main role="main">`이 별도로 가짐. 모바일 미디어쿼리(`max-width: 480px`)에서 베젤이 사라져 a11y에 영향 없음.
- **반응형**: 데스크탑 = 375×780 베젤 + 배경 그라디언트. 모바일 = 풀스크린, `border-radius: 0`, 베젤·island·home indicator 모두 `display: none`.

---

## 02. AppHeader

상단 네비게이션 바. 좌측 뒤로가기, 가운데 타이틀, 우측 액션을 가진다.

```ts
interface AppHeaderProps {
  /** 좌측 뒤로가기 — 없으면 빈 자리 유지 (정렬 안정) */
  onBack?: () => void;
  backHref?: string;
  /** 가운데 타이틀 (선택) */
  title?: React.ReactNode;
  /** 우측 액션 슬롯 — 1~2개 IconButton 또는 Button.sm 권장 */
  trailing?: React.ReactNode;
}
```
- **등장 화면**: diagnosis(이전 + 이전조건 불러오기), result(이전 + title + 공유), deadline(이전 + title)
- **변형**:
  - `back-only` — 좌측만 (login에서는 없음)
  - `back + trailing` — diagnosis
  - `back + title + trailing` — result, deadline
- **상태**: hover/focus는 자식 IconButton에 위임. `loading` prop은 가지지 않음.
- **접근성**:
  - 컨테이너: `role="banner"` 또는 native `<header>`
  - 뒤로가기: `aria-label="이전"` 또는 명시 라벨
  - 타이틀: `<h1>` 또는 `<h2>` 의미 부여 (페이지마다 한 번만)
- **반응형**: 모바일 동일. 데스크탑(폰 베젤)에서도 동일. height 48px 고정, padding `0 12px`.

---

## 03. IconButton

40×40 정사각 아이콘 액션 버튼. 보더 유무 2종.

```ts
interface IconButtonProps {
  icon: React.ReactNode;          // 16~20px SVG 권장
  onClick?: () => void;
  href?: string;                  // 링크 모드
  ariaLabel: string;              // 필수
  variant?: 'plain' | 'bordered'; // default 'plain'
  disabled?: boolean;
}
```
- **등장 화면**: 전 화면 (뒤로가기, 닫기, 메뉴, 줌, 캘린더 nav 등)
- **변형**: `plain` (배경 없음, hover 시 `--bg`), `bordered` (`1px solid --card-border`, 배경 #fff)
- **상태**:
  - default: 배경 transparent
  - hover: `background: var(--bg)`
  - focus-visible: `outline: 2px solid var(--primary); outline-offset: 2px`
  - active: `transform: translateY(1px)` 권장
  - disabled: `opacity: 0.4; pointer-events: none`
- **접근성**: `aria-label` 필수. 아이콘 SVG는 `aria-hidden="true"`. 링크 모드일 때 `<a role="button">` 대신 native `<a>` 사용.
- **반응형**: 동일. hit box 44px 확보(padding 포함).

---

## 04. Button

기본 액션 버튼. 7가지 variant + 3 size.

```ts
type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'kakao'    // /login 전용
  | 'naver';   // /login 전용

interface ButtonProps {
  variant?: ButtonVariant;        // default 'primary'
  size?: 'sm' | 'md' | 'lg';      // default 'md' (52px)
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leading?: React.ReactNode;      // SVG icon
  trailing?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit';
}
```
- **등장 화면**: 전 화면 (CTA, 액션, 사이즈sm은 topbar trailing)
- **변형**:
  - `primary` — `bg #2563EB / fg #fff`, 메인 CTA
  - `outline` — `bg #fff / border #E5E7EB / fg --ink`
  - `ghost` — `bg transparent / fg --ink-2`
  - `destructive` — `bg #EF4444 / fg #fff`
  - `kakao` — `bg #FEE500 / fg #191919` (login 한정)
  - `naver` — `bg #03C75A / fg #fff` (login 한정)
- **사이즈**:
  - `sm`: 36/10/12 (height/radius/font), `padding 0 12px`
  - `md`: 52/14/16, `padding 0 18px` ← 기본
  - `lg` (single-foot 변형): 44/12/13, `padding 0 14px`
- **상태**:
  - hover: `filter: brightness(0.97)`
  - active: `transform: translateY(1px)`
  - disabled: `bg #C7D2E5; cursor: not-allowed` (primary 한정 매핑; 그 외 `opacity 0.5`)
  - loading: 좌측 leading을 spinner로 교체, `aria-busy="true"`, click 차단
  - focus-visible: outline ring 2px primary
- **접근성**: `aria-busy` (loading), `aria-disabled` (disabled), 텍스트가 없는 아이콘 onlyButton은 `aria-label` 필수. 링크/버튼 시맨틱 분기.
- **반응형**: 동일. `fullWidth`일 때 양옆 padding은 부모가 책임.

---

## 05. OAuthButton

login 화면 전용. `Button` 위에 OAuth provider preset.

```ts
interface OAuthButtonProps {
  provider: 'kakao' | 'naver';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
```
- 내부 구현: `<Button variant={provider} fullWidth leading={<ProviderIcon>}>{label}</Button>`
- **라벨 매핑**:
  - kakao → "카카오로 1초 만에 시작"
  - naver → "네이버로 시작"
- **등장 화면**: login만
- **변형**: provider 2종
- **상태**: `Button`과 동일 (loading 시 spinner는 #191919 또는 #fff)
- **접근성**: `aria-label="카카오로 시작"` / `aria-label="네이버로 시작"`. 아이콘 `aria-hidden`.
- **반응형**: 동일.

> ⚠️ kakao/naver 컬러 토큰은 OAuthButton 외에 **사용 금지**.

---

## 06. StickyCTABar

화면 하단 고정 풀폭 CTA 영역. 메인 버튼 + 보조 hint 텍스트.

```ts
interface StickyCTABarProps {
  /** 메인 CTA — 풀폭 Button */
  cta: React.ReactNode;
  /** 보조 hint (선택) — 텍스트 또는 아이콘+텍스트 */
  hint?: React.ReactNode;
  /** 상단 보더 표시 (default true) */
  bordered?: boolean;
}
```
- **등장 화면**: diagnosis (`cta-bar`), share (`share-foot`)
- **변형**:
  - `with-hint` (diagnosis: 진단 시작 + "평균 4초 · 후보 6~8개")
  - `with-leading-hint` (share: 자물쇠 아이콘 + "나머지 4곳은 회원만")
- **상태**: 자식 Button에 위임.
- **접근성**: 컨테이너 native `<footer>` 또는 `role="contentinfo"`. iOS 노치/홈 인디케이터를 피해 `padding-bottom: env(safe-area-inset-bottom)` 더하기.
- **반응형**: 모바일 = `position: sticky; bottom: 0`, `padding 12 20 24`. 데스크탑(폰 베젤) = 동일. 모바일 풀스크린에서는 safe-area inset을 반드시 추가.

---

## 07. AddressInput

진단 단계의 주소 입력 필드. 좌측 태그(A/B), 인풋, 우측 상태 아이콘(체크 또는 검색).

```ts
interface AddressInputProps {
  tag: 'A' | 'B';                 // 시각 색상: A=primary, B=secondary
  label: string;                  // 외부 field-label
  value: string;
  onChange: (next: string) => void;
  onSelect?: (item: AddressSuggestion) => void;
  placeholder?: string;
  /** 자동완성 결과 — 비면 드롭다운 미표시 */
  suggestions?: AddressSuggestion[];
  loading?: boolean;
  verified?: boolean;             // 우측 체크 아이콘 표시
  disabled?: boolean;
}
interface AddressSuggestion {
  id: string;
  title: string;
  sub: string;
  kind: '지하철역' | '지역' | '회사' | '도로명' | '지번';
}
```
- **등장 화면**: diagnosis (필드 2개 — 내 직장 A, 배우자 직장 B)
- **변형**:
  - `verified` — 우측 그린 체크 (확인됨)
  - `searching` — 우측 search 아이콘
  - `with-suggestions` — 하단 `SuggestList` 펼침
- **상태**:
  - default: `border 1.5px var(--card-border)`
  - focus: `border-color var(--primary); box-shadow 0 0 0 4px rgba(37,99,235,0.10)`
  - error: `border-color var(--danger); box-shadow 0 0 0 4px rgba(239,68,68,0.10)` (확장)
  - disabled: `opacity 0.5; bg var(--bg); cursor not-allowed`
- **접근성**:
  - 외부 `<label>`로 묶기, `aria-controls` → SuggestList ID
  - `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`
  - tag 글자(A/B)는 `aria-hidden`이지만 라벨에 "내 직장(A)" 식으로 의미 포함
- **반응형**: 동일. 모바일 키보드 호출 시 SuggestList가 화면 잘림 방지 — 컨테이너 `scroll-into-view`.

---

## 08. SuggestList

`AddressInput` 하단의 자동완성 드롭다운.

```ts
interface SuggestListProps {
  items: AddressSuggestion[];
  highlightedId?: string;
  onSelect: (item: AddressSuggestion) => void;
  onHighlight?: (id: string) => void;
}
```
- **등장 화면**: diagnosis (AddressInput 내부 슬롯)
- **변형**: row의 `kind` 라벨에 따라 우측 chip 색만 다름 (모두 `--bg + --ink-3`).
- **상태**:
  - default: 흰 배경
  - hover/highlighted: `background: var(--bg)`
  - selected: 선택 즉시 닫힘 — selected 상태 미유지
- **접근성**:
  - 컨테이너 `role="listbox"`
  - row `role="option"`, `aria-selected` (highlighted)
  - 키보드: ↑↓ 이동, Enter 선택, Esc 닫기
- **반응형**: 동일. 모바일에서는 inputmode=`search` 권장.

---

## 09. ModeSelector

진단 모드(커플/싱글) 라디오 그룹. 2칸 그리드 카드 형태.

```ts
type ModeKey = 'couple' | 'single';
interface ModeSelectorProps {
  value: ModeKey;
  onChange: (next: ModeKey) => void;
  options?: ModeOption[];   // 기본 2개 preset
  disabled?: boolean;
}
interface ModeOption {
  key: ModeKey;
  emoji: string;
  title: string;
  sub: string;
}
```
- **등장 화면**: diagnosis
- **변형**: 2칸(현재) / 향후 3칸(커플/싱글/룸메이트) 확장 가능
- **상태**:
  - default: `border 1.5px var(--card-border); bg #fff`
  - active: `border-color var(--primary); bg var(--primary-soft)`, 우상단 체크 뱃지(18×18 primary)
  - hover: `border-color #C7D2E5`
  - disabled: `opacity 0.5`
- **접근성**:
  - 컨테이너 `role="radiogroup"`, `aria-label="진단 모드"`
  - 카드 `role="radio"`, `aria-checked`
  - 키보드: ←→ 이동, Space/Enter 선택
  - emoji는 `aria-hidden`, title이 의미 전달
- **반응형**: 모바일 2-col grid (gap 10). 데스크탑 동일 (모바일 폼팩터 유지).

---

## 10. Tabs (TimeTabs)

세그먼트 컨트롤 탭. 결과 화면의 출근시간대 선택.

```ts
interface TabsProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}
```
- **등장 화면**: result (07/08/09/10시)
- **변형**: 옵션 N개 (4개 권장; 5개 이상이면 가로 스크롤)
- **상태**:
  - container: `bg var(--bg); padding 3px; radius 10px`
  - tab default: `fg var(--ink-3); font 12/700`
  - tab active: `bg #fff; fg var(--ink); shadow 0 1px 3px rgba(0,0,0,0.06)`
  - hover: 약하게 `fg var(--ink-2)`
- **접근성**: `role="tablist"`, 각 tab `role="tab"` + `aria-selected`. 좌우 키보드 이동.
- **반응형**: 동일. 옵션 ≥5면 `overflow-x: auto; scroll-snap`.

---

## 11. FilterChip

라벨 + 값 형태의 필터 인디케이터. 클릭 시 슬라이더/시트 호출.

```ts
interface FilterChipProps {
  label: string;
  value: string;
  onClick?: () => void;
  active?: boolean;     // 사용자가 기본값에서 변경했는지
  ariaLabel?: string;
}
```
- **등장 화면**: result (통근시간/예산)
- **변형**:
  - default: `bg #fff; border 1px var(--card-border)`
  - active(변경됨): `border-color var(--primary)` (확장 권장)
- **상태**: hover `bg var(--bg)`, focus ring primary, disabled `opacity 0.5`.
- **접근성**: native `<button>`. `aria-label="${label} 필터, 현재값 ${value}"`.
- **반응형**: flex 1 (가로 균등 분배). 모바일 동일.

---

## 12. FilterPanel

`Tabs` + `FilterChip` 묶음. 결과 헤더 영역.

```ts
interface FilterPanelProps {
  time: string;
  onTimeChange: (next: string) => void;
  timeOptions: { value: string; label: string }[];
  filters: FilterChipProps[];
  onOpenAdvanced?: () => void;
}
```
- **등장 화면**: result (`result-head` 영역)
- **변형**: filter chip 0~3개 + 고급필터 IconButton 우측 부착
- **상태**: 자식에 위임
- **접근성**: 자식 위임. 컨테이너 `aria-label="후보 필터"`.
- **반응형**: chip은 flex 1; 모바일 가로 스크롤(필요 시).

---

## 13. Pill / Badge

작은 라벨. 6 variant.

```ts
type PillVariant = 'default' | 'solid' | 'ok' | 'neutral' | 'danger' | 'warning';
interface PillProps {
  variant?: PillVariant;   // default 'default' (primary-soft)
  children: React.ReactNode;
  leading?: React.ReactNode;
  size?: 'xs' | 'sm';      // default 'sm' (4/8 padding)
}
```
- **등장 화면**: 전 화면 (BEST, 매물 N건, 진행 중, 무료 미리보기, 놓치면 위약금 등)
- **변형 색상 매핑** (자세한 hex는 design-tokens.md §6.4):
  - `default` primary-soft
  - `solid` primary
  - `ok` success-soft + #047857
  - `neutral` bg + ink-2
  - `danger` danger-soft + danger
  - `warning` warning-soft + #A16207
- **상태**: 정적 정보. interactive 시 `<button>`으로 감싸 hover/focus 추가.
- **접근성**: 정적이면 `<span>`. interactive 시 `<button>` + `aria-pressed`/`aria-label`.
- **반응형**: 동일. 폰트 11px 고정.

---

## 14. DataSourceBadge

데이터 출처 + 갱신일 표기. share hero 전용.

```ts
type DataKind = 'official' | 'aggregated' | 'estimate';
interface DataSourceBadgeProps {
  kind: DataKind;
  source: string;        // ex. "카카오 모빌리티"
  updatedAt: string;     // ex. "2026.04.01"
}
```
- **등장 화면**: share (hero 영역). 향후 result/detail로 확장 권장.
- **변형 색상**:
  - `official` dot `#10B981` (success)
  - `aggregated` dot `#60A5FA` (info-light)
  - `estimate` dot `#EAB308` (warning)
  - 컨테이너는 동일 (`rgba(255,255,255,0.14)` on dark hero)
- **상태**: 정적.
- **접근성**: `<span role="img" aria-label="공식 출처: 카카오 모빌리티 갱신일 2026.04.01">`. dot은 `aria-hidden`.
- **반응형**: hero 어두운 배경 위에서만 사용. light 배경용 변형 추가 시 `bg var(--bg); border var(--line)`.

---

## 15. SafetyGradeBadge

야간 안전 등급(A~D) 뱃지. 글자 + 라벨.

```ts
type SafetyGrade = 'A' | 'B' | 'C' | 'D';
interface SafetyGradeBadgeProps {
  grade: SafetyGrade;
  label?: string;        // 기본 매핑: A=매우 안전, B=안전, C=주의, D=위험
}
```
- **등장 화면**: single (각 카드 우상단)
- **변형 색상** (파스텔, design-tokens.md §1.7):
  - A: `bg #D1FAE5 / fg #047857`
  - B: `bg #DBEAFE / fg #1D4ED8`
  - C: `bg #FEF3C7 / fg #A16207`
  - D: `bg #FEE2E2 / fg #B91C1C`
- **상태**: 정적.
- **접근성**: 색맹 대응 — **반드시 letter + label 함께 표시**. `<span aria-label="야간 안전 등급 A, 매우 안전">`. letter span은 `aria-hidden`.
- **반응형**: 동일.

---

## 16. Stat (Tile)

라벨 + 값 한 쌍의 작은 데이터 타일.

```ts
interface StatProps {
  label: string;
  value: React.ReactNode;
  sub?: string;          // detail의 metric에서 사용 (84㎡ 등)
  align?: 'left' | 'center';   // default 'left' (Stat) / 'center' (Metric)
  variant?: 'tile' | 'metric'; // tile: bg-bg / metric: 가운데 정렬, 구분선
}
```
- **등장 화면**: result(미사용), detail(`metrics`), share(`stats`), single(`stats`)
- **변형**:
  - `tile` — `bg var(--bg); padding 6 8; radius 8`. 카드 내부 1/2 분할에서 사용.
  - `metric` — 가로 3등분, 가운데 정렬, 우측 보더 분리. detail 전용.
- **상태**: 정적.
- **접근성**: `<dl>`로 묶기. `<dt>` = label, `<dd>` = value. 또는 `<div role="group" aria-label="...">`.
- **반응형**: 동일. `min-width: 0`로 flex shrink 허용.

---

## 17. CommuteChip

A/B 통근 시간 칩. 태그(색 사각형) + 모드 아이콘 + N분.

```ts
interface CommuteChipProps {
  tag: 'A' | 'B';
  mode: 'subway' | 'bus' | 'car' | 'walk';
  minutes: number;
  /** 환승 횟수 등 (CommuteRow에서 사용) */
  detail?: string;
}
```
- **등장 화면**: result (CandidateCard 내부), detail (CommuteRow의 인라인 변형)
- **변형**:
  - `chip` (result) — `bg #fff; border 1px var(--line-2); padding 6 10`. 컴팩트.
  - `row` (detail) — full width, `bg #fff; border 1px var(--card-border); shadow card`. 큰 터치 타깃.
- **상태**: 정적. 클릭 시 routing UI로 확장 가능 → hover `bg var(--bg)`.
- **접근성**: `aria-label="A 직장까지 지하철 18분, 환승 1회"`. tag 글자/아이콘은 `aria-hidden`.
- **반응형**: chip은 flex auto-fit. row는 full width + gap 12.

---

## 18. MapMarker

지도 위 후보 동네 마커. 순위/선택 상태에 따라 채움 변경.

```ts
interface MapMarkerProps {
  label: string;        // "마포", "성수" 등 짧은 텍스트
  selected?: boolean;
  rank?: number;        // 1=BEST 표시
  position: { x: number; y: number };  // SVG 좌표
  onClick?: () => void;
}
```
- **등장 화면**: result, detail (배경 dim)
- **변형**:
  - default: `fill #fff; stroke #2563EB 2px; text #2563EB`
  - selected/best: `fill #2563EB; stroke #fff 2px; text #fff`
- **상태**:
  - hover: `r 16` (확대)
  - active/focus: stroke 두께 3px + `outline: 2px solid var(--primary)` (focus ring 폴백)
- **접근성**: `<g role="button" tabindex="0" aria-label="마포동, 매칭 점수 92점, 1위">`. text는 `aria-hidden`.
- **반응형**: SVG `viewBox` 기반이라 자동 스케일. 모바일 hit area는 14px → tap layer 24px 권장(invisible circle).

---

## 19. MapCanvas

지도 placeholder/실제 카카오맵 컨테이너. 마커, 줌 컨트롤, 라벨 칩 슬롯.

```ts
interface MapCanvasProps {
  markers: MapMarkerProps[];
  /** 지도 SDK 미연결 시 placeholder SVG 표시 */
  placeholder?: boolean;
  height?: number;       // default 320px
  topRightSlot?: React.ReactNode;   // 내 위치 pill 등
  bottomRightSlot?: React.ReactNode; // 줌 컨트롤
  onMarkerClick?: (id: string) => void;
}
```
- **등장 화면**: result (interactive), detail (dim 배경 placeholder)
- **변형**:
  - `placeholder` — SVG 그리드/한강/마커
  - `live` — Kakao Maps SDK 또는 다른 SDK 컨테이너
  - `dim` — `::after { background: rgba(11,18,32,0.45) }` 오버레이 (detail에서 시트 뒤 배경)
- **상태**: dragging/zooming은 SDK에 위임.
- **접근성**: `role="application"` + `aria-label="후보 동네 지도"`. SDK는 키보드 접근 폴백 텍스트 리스트 제공.
- **반응형**: height 320 고정 (모바일). 데스크탑 wide layout 도입 시 50vh 등으로 확장 가능.

---

## 20. CandidateCard

결과 화면의 후보 동네 리스트 카드.

```ts
interface CandidateCardProps {
  name: string;
  score: number;
  rank?: number;                // 1이면 BEST 뱃지
  best?: boolean;               // 외부 강제
  commutes: { tag: 'A' | 'B'; mode: CommuteChipProps['mode']; minutes: number }[];
  price: string;                // "평균 9.2억"
  href?: string;                // 상세로 이동
  onClick?: () => void;
}
```
- **등장 화면**: result
- **변형**:
  - `default` — 흰 카드
  - `best` — `bg var(--primary-soft); border-color var(--primary)` + BEST 뱃지
- **상태**:
  - default: card-shadow
  - hover: `transform: translateY(-1px); shadow 0 6px 20px rgba(0,0,0,0.08)`
  - active: `transform: translateY(0)`
  - focus-visible: outline ring primary
- **접근성**: native `<a>`. `aria-label="마포구 공덕동, 매칭 점수 92점, 1위, A 통근 18분, B 통근 32분, 평균 시세 9.2억"`.
- **반응형**: full width (sheet 안). 모바일에서 한 칸씩, 태블릿+ 시 2-col grid 고려.

---

## 21. ReportCard

share 화면 후보 카드. 스코어 + 4개 stat 그리드.

```ts
interface ReportCardProps {
  name: string;
  score?: number;                   // locked일 때 노출
  stats: { label: string; value: string }[];   // 2x2 권장
  preview?: boolean;                // "무료 미리보기" pill
}
```
- **등장 화면**: share (1 free + 4 locked)
- **변형**:
  - `preview` — pill ok "무료 미리보기"
  - `locked` — `LockedCard`로 감싸 사용 (별도 컴포넌트)
- **상태**: 정적 (locked는 LockedCard 책임).
- **접근성**: heading은 `<h3>`. score는 `aria-label="매칭 점수 92점"`.
- **반응형**: full width. stats는 2x2 grid (`gap 6px`).

---

## 22. LockedCard

흐림 + 자물쇠 오버레이로 콘텐츠를 잠그는 래퍼.

```ts
interface LockedCardProps {
  children: React.ReactNode;        // 보통 ReportCard
  message?: string;                 // default "회원가입하면 전체 정보를 볼 수 있어요"
  blurStrength?: number;            // default 8 (px)
  onUnlock?: () => void;            // 클릭 시 가입 라우팅
}
```
- **등장 화면**: share (4개 잠금)
- **변형**: blur 강도, 메시지 커스텀
- **상태**:
  - default: `filter: blur(8px); opacity 0.95`, overlay `rgba(11,18,32,0.45)`
  - hover (clickable): overlay 살짝 밝게 → 가입 유도 강화
- **접근성**:
  - 자식 콘텐츠 `aria-hidden="true"` (스크린 리더에 노출 X)
  - 래퍼 `role="button" aria-label="${message}, 클릭해 회원가입"` 제공
  - 키보드 포커스 가능
- **반응형**: 동일.

---

## 23. SafetyCard

야간 안전 카드. SafetyGradeBadge + SafetyBar + Stats.

```ts
interface SafetyCardProps {
  name: string;
  sub: string;                          // "반경 1km · 인접 4개 동 기준"
  grade: SafetyGrade;
  gradeLabel: string;                   // "야간 매우 안전"
  metric: { label: string; value: string };  // "야간 범죄율" / "0.84건"
  barPercent: number;                   // 0–100
  stats: { label: string; value: string }[];  // 통근/시세/범죄
}
```
- **등장 화면**: single
- **변형**: grade에 따라 SafetyBar/SafetyGradeBadge 색상 자동 매핑
- **상태**: 정적. 클릭 시 detail 라우팅 → hover `transform: translateY(-1px)`.
- **접근성**: `<article>`. heading `<h3>`. bar는 `role="progressbar" aria-valuenow={barPercent} aria-valuemin={0} aria-valuemax={100} aria-label="야간 범죄율 ${value}, 등급 ${grade}"`.
- **반응형**: 동일. 모바일 1-col.

---

## 24. BottomSheet

화면 하단에서 올라오는 모달 시트 (재사용 가능한 primitive).

```ts
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** drag handle 표시 (default true) */
  showHandle?: boolean;
  /** 닫기 버튼 위치 (시트 위에 떠있는 floating close) */
  showFloatingClose?: boolean;
  /** 백드롭 클릭 시 닫기 (default true) */
  dismissOnBackdrop?: boolean;
  /** 시트 높이 — 'auto' (콘텐츠) | number(px) | 'full' */
  height?: 'auto' | number | 'full';
  children: React.ReactNode;
  ariaLabel: string;
}
```
- **등장 화면**: detail (DetailSheet의 베이스)
- **변형**:
  - `auto` (콘텐츠 높이)
  - `peek` (40vh 정도, 드래그 시 확장)
  - `full` (max 90vh)
- **상태**:
  - 진입: `transform: translateY(100% → 0)`, `duration 280ms`, `cubic-bezier(.32,.72,0,1)`
  - 백드롭: opacity `0 → 1`, `220ms`
  - 종료: 반대
  - dragging: 핸들 잡고 아래로 → close 트리거
- **접근성**:
  - `role="dialog"`, `aria-modal="true"`, `aria-label`
  - 포커스 트랩 + Esc 닫기
  - 배경 페이지 `aria-hidden="true"`
- **반응형**: 모바일 = 풀폭. 데스크탑(폰 베젤) = 동일. ≥768 데스크탑 네이티브에서는 가운데 모달로 폴백 권장.

---

## 25. DetailSheet

`BottomSheet` + 동네 상세 콘텐츠를 묶은 composite.

```ts
interface DetailSheetProps {
  open: boolean;
  onClose: () => void;
  candidate: {
    name: string;
    score: number;
    pills: { variant: PillVariant; label: string }[];
    lines: string;       // "3·5·6호선 · 경의중앙선 환승"
    commutes: CommuteRowItem[];
    metrics: { label: string; value: string; sub?: string }[];   // 3개
  };
  onLike?: () => void;
  onShare?: () => void;
  primaryCta: { label: string; href?: string; onClick?: () => void };
}
interface CommuteRowItem {
  tag: 'A' | 'B';
  dest: string;                // "강남구 테헤란로"
  mode: CommuteChipProps['mode'];
  modeLabel: string;           // "지하철"
  detail?: string;             // "환승 1회"
  minutes: number;
}
```
- **등장 화면**: detail
- **변형**: 향후 `compact` (단일 통근, 메트릭 2개) 가능
- **상태**: 자식 위임. 프라이머리 CTA loading 가능.
- **접근성**: 24번 BottomSheet 위임 + 컨텐츠는 `<section aria-label="동네 상세">`.
- **반응형**: 동일.

---

## 26. DDayCounter

큰 카운트다운 숫자 + 마감 날짜 카드.

```ts
interface DDayCounterProps {
  daysLeft: number;             // 30 → "D-30"
  targetDate: string;           // "2026년 5월 27일 (수)"
  caption?: string;             // default "MOVE-IN COUNTDOWN"
  /** 임박 단계 — 색상 강도 변화 */
  urgency?: 'normal' | 'soon' | 'critical';   // default 'normal'
}
```
- **등장 화면**: deadline
- **변형**:
  - `normal` — 그라디언트 `--primary-deep → --primary`
  - `soon` (D-7 이하) — 추가 글로우 또는 펄스 애니메이션
  - `critical` (D-1 이하) — `--danger` 그라디언트
- **상태**:
  - 정적 표시. 매 자정 자동 갱신 (timer hook).
- **접근성**: `<div role="timer" aria-live="polite" aria-label="이사까지 30일 남음, 마감일 2026년 5월 27일">`. 시각 글자는 `aria-hidden`.
- **반응형**: 모바일 = 카드 inset 12 20. 데스크탑 동일.

---

## 27. MiniCalendar

월 뷰 미니 캘린더. in-range, target, empty cell.

```ts
interface MiniCalendarProps {
  year: number;
  month: number;             // 1–12
  /** 강조해야 할 날짜들 */
  inRange?: number[];        // 진행중 일자
  target?: number;           // D-Day
  onPrev?: () => void;
  onNext?: () => void;
  onSelect?: (day: number) => void;
}
```
- **등장 화면**: deadline
- **변형**:
  - `readonly` (현재 시안)
  - `interactive` (날짜 클릭으로 D-Day 변경)
- **상태**:
  - cell default: `color var(--ink-2)`
  - in-range: `bg var(--primary-soft); fg var(--primary)`
  - target: `bg var(--primary); fg #fff; weight 800`
  - empty: 보이지 않음 (placeholder)
  - hover (interactive): `bg var(--bg)`
- **접근성**:
  - 그리드 `role="grid"`, weekday `role="columnheader"`, cell `role="gridcell"` + `aria-selected`
  - target은 `aria-current="date"`
  - prev/next IconButton `aria-label="이전 달"/"다음 달"`
- **반응형**: cell `height 28px`. 데스크탑에서도 동일 컴팩트 사이즈.

---

## 28. TimelineStep

수직 타임라인의 한 단계. 점 + 카드.

```ts
type StepStatus = 'done' | 'now' | 'todo';
interface TimelineStepProps {
  status: StepStatus;
  stage: string;             // "D-30", "D-Day"
  label: string;             // "매물 탐색"
  sub?: string;              // "후보 동네 압축, 실거래 리뷰"
  pill?: { variant: PillVariant; label: string };  // "진행 중", "놓치면 위약금"
  /** 첫/마지막 단계 — 라인 위/아래 마스킹 */
  position?: 'first' | 'middle' | 'last';
}
```
- **등장 화면**: deadline (5단계)
- **변형**:
  - `done` — 점 채움 primary, 체크 아이콘
  - `now` — 점 보더 primary + 글로우 + 카드 `bg var(--primary-soft)`
  - `todo` — 점 보더 line, 흰 배경
- **상태**: 정적. 클릭 시 단계 디테일 모달 호출 → hover `card shadow 강화`.
- **접근성**:
  - `<li>` 안에 `role="listitem"`. 부모는 `<ol role="list" aria-label="이사 체크리스트">`.
  - status는 `aria-current="step"` (now), `aria-label="완료" / "진행 중" / "예정"` 텍스트로 보강.
- **반응형**: 동일.

---

## 29. LegendBar

A~D 등급 가이드 칩 4개. 가로 1줄.

```ts
interface LegendBarProps {
  title: string;            // "야간 안전 등급 기준"
  meta?: string;            // "22:00–04:00 · 반경 1km"
  grades?: SafetyGrade[];   // default ['A','B','C','D']
}
```
- **등장 화면**: single (안전 카드 위)
- **변형**: grade 셋 커스텀 가능 (A~C only 등)
- **상태**: 정적.
- **접근성**: `<section aria-label="등급 가이드">`. 각 chip은 `<span aria-label="A등급, 매우 안전">`.
- **반응형**: 4-col flex 균등. 모바일/데스크탑 동일.

---

## 30. SafetyBar

값과 4분위 tick을 표시하는 가로 막대.

```ts
interface SafetyBarProps {
  value: number;            // 실제 값 (e.g. 0.84)
  unit: string;             // "건"
  label: string;            // "야간 범죄율 (10만명당)"
  percent: number;          // 0–100 (값을 정규화해 fill 길이로)
  grade: SafetyGrade;       // bar fill 색
  /** 4분위 표시 (default true) */
  showQuartiles?: boolean;
}
```
- **등장 화면**: single (각 카드 내부)
- **변형**: grade 4종으로 색만 변경
- **상태**: 정적. 애니메이션(0 → percent)은 IntersectionObserver 진입 시 380ms ease-out 권장.
- **접근성**: `role="progressbar"`. `aria-valuenow / valuemin=0 / valuemax=100 / aria-label="야간 범죄율 0.84건, A등급"`.
- **반응형**: 동일. height 6px 고정.

---

## 31. ShareHero

공유 리포트 상단 그라디언트 hero. 브랜드 + 익명칩 + 타이틀 + 데이터 출처 배지.

```ts
interface ShareHeroProps {
  brand: string;             // "동네궁합 · 공유 리포트"
  brandLogo?: React.ReactNode;
  expiryChip?: string;       // "익명 · 7일 한정"
  title: React.ReactNode;
  badges: DataSourceBadgeProps[];
}
```
- **등장 화면**: share
- **변형**: title 1~2줄, badges 0~3개
- **상태**: 정적.
- **접근성**: `<header>` + `<h1>`. expiry chip은 `aria-label="익명 7일 한정 공유"`.
- **반응형**: 모바일 padding 16 20 22. 데스크탑 동일.

---

## 컴포넌트 ↔ 화면 매핑 매트릭스

| 컴포넌트 | login | diagnosis | result | detail | share | deadline | single |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| PhoneFrame | ● | ● | ● | ● | ● | ● | ● |
| AppHeader |   | ● | ● |   |   | ● |   |
| IconButton | ● | ● | ● | ● | ● | ● | ● |
| Button | ● | ● | ● | ● | ● |   | ● |
| OAuthButton | ● |   |   |   |   |   |   |
| StickyCTABar |   | ● |   |   | ● |   |   |
| AddressInput |   | ● |   |   |   |   |   |
| SuggestList |   | ● |   |   |   |   |   |
| ModeSelector |   | ● |   |   |   |   |   |
| Tabs |   |   | ● |   |   |   |   |
| FilterChip |   |   | ● |   |   |   |   |
| FilterPanel |   |   | ● |   |   |   |   |
| Pill / Badge |   | ● | ● | ● | ● | ● | ● |
| DataSourceBadge |   |   |   |   | ● |   |   |
| SafetyGradeBadge |   |   |   |   |   |   | ● |
| Stat |   |   |   | ● | ● |   | ● |
| CommuteChip |   |   | ● | ● |   |   |   |
| MapMarker |   |   | ● | ● |   |   |   |
| MapCanvas |   |   | ● | ● |   |   |   |
| CandidateCard |   |   | ● |   |   |   |   |
| ReportCard |   |   |   |   | ● |   |   |
| LockedCard |   |   |   |   | ● |   |   |
| SafetyCard |   |   |   |   |   |   | ● |
| BottomSheet |   |   |   | ● |   |   |   |
| DetailSheet |   |   |   | ● |   |   |   |
| DDayCounter |   |   |   |   |   | ● |   |
| MiniCalendar |   |   |   |   |   | ● |   |
| TimelineStep |   |   |   |   |   | ● |   |
| LegendBar |   |   |   |   |   |   | ● |
| SafetyBar |   |   |   |   |   |   | ● |
| ShareHero |   |   |   |   | ● |   |   |

---

## 글로벌 인터랙션/접근성 규약

- **포커스 링**: 모든 interactive `outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 6px` (focus-visible only)
- **터치 타깃**: ≥44×44 (icon-btn은 시각 40px이지만 hit area 패딩으로 확보)
- **키보드 트랩**: BottomSheet/Modal 진입 시 inert 적용, Esc 닫기
- **prefers-reduced-motion**: 시트 애니메이션 280ms → 0ms로 폴백, 막대 애니메이션 비활성화
- **다크 모드**: 본 시안은 light only. 추후 다크 토큰 추가 시 `[data-theme="dark"]` 셀렉터로 분기 권장 (배경 `--bg → #0B1220`, surface `→ #1A2132` 등)

## 디렉터리 제안 (Next.js + shadcn)

```
components/
├── ui/                  # primitives — Button, IconButton, Pill, Tabs, BottomSheet, FilterChip
├── form/                # AddressInput, SuggestList, ModeSelector, FilterPanel
├── data/                # Stat, SafetyBar, LegendBar, DataSourceBadge, SafetyGradeBadge
├── card/                # CandidateCard, ReportCard, LockedCard, SafetyCard
├── map/                 # MapCanvas, MapMarker, CommuteChip
├── deadline/            # DDayCounter, MiniCalendar, TimelineStep
├── share/               # ShareHero
├── sheet/               # DetailSheet
└── layout/              # PhoneFrame (dev only), AppHeader, StickyCTABar
```

---

**제작 노트**: 모든 컴포넌트는 `design-tokens.md`의 `--primary`, `--card-border`, `--card-radius`, `--card-shadow` 등 토큰을 참조합니다. 토큰 변경 시 컴포넌트 코드를 건드리지 않고도 비주얼이 일괄 갱신되도록 구조화되어 있습니다.
