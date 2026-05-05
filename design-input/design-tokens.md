# 동네궁합 — Design Tokens

> 7개 화면(`login`, `diagnosis`, `result`, `detail`, `share`, `deadline`, `single`)에서 실제로 사용된 디자인 토큰을 정리한 문서입니다. Claude Code가 이 디자인을 정확히 재현할 수 있도록 **Tailwind config (JSON)**, **shadcn/ui CSS 변수**, **컴포넌트 토큰** 형식으로 모두 제공합니다.

- **베이스 그리드**: 모바일 375px 우선, 폰 베젤 ≤480px에서 풀스크린
- **폰트**: Pretendard (CDN: `cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9`)
- **모서리/그림자 통일**: 모든 카드는 동일한 `border + radius + shadow` 사용

---

## 1. 컬러 팔레트 (Color Palette)

### 1.1 표면 / Surfaces
화면 배경, 카드, 약한 배경 톤.

| Token | Hex | Role | 사용 화면 |
|---|---|---|---|
| `--bg` | `#F4F6FA` | 화면 기본 배경 (light gray-blue) | result, deadline, single |
| `--surface` | `#FFFFFF` | 카드/시트 표면 | 전 화면 |
| `--surface-soft` | `#F1F4F9` | 결과 화면 보조 배경 | result |

### 1.2 잉크 (Text) / Ink scale
한국어 가독성에 맞춰 3단 잉크 스케일을 사용. 순흑(`#000`)은 사용하지 않음.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0B1220` | 본문/타이틀 (primary text) |
| `--ink-2` | `#3D475A` | 보조 텍스트 (secondary text) |
| `--ink-3` | `#6B7689` | 캡션/메타 (muted text) |

### 1.3 라인 / Borders
| Token | Hex | Role |
|---|---|---|
| `--card-border` | `#E5E7EB` | 모든 카드 외곽선 (통일) |
| `--line` | `#E6E9F0` | 구분선, 디바이더 |
| `--line-2` | `#EEF1F6` | 약한 구분선, 인너 디바이더 |

### 1.4 브랜드 — 신뢰 블루 / Brand Blue
| Token | Hex | Role |
|---|---|---|
| `--primary` | `#2563EB` | 메인 CTA, 링크, 강조 |
| `--primary-soft` | `#EAF1FF` | 활성 카드 배경, 토큰 배경 |
| `--primary-deep` | `#1E3A8A` | 그라디언트 헤더 (deadline, share) |
| `--secondary` | `#7C3AED` | 보조 강조 (B 태그 — 배우자 직장) |

### 1.5 상태 / Status
| Role | Solid | Soft | 용도 |
|---|---|---|---|
| Success / OK | `#10B981` | `#E7F8F1` | 성공, official 데이터 출처 |
| Info | `#3B82F6` | `#E5EEFC` | 정보 알림 |
| Warning | `#EAB308` | `#FEF7CD` | 주의 |
| Destructive / Danger | `#EF4444` | `#FEE7E7` | 위험, 삭제, 잠금 해제 강조 |

### 1.6 OAuth (전용) — `/login`에만 사용
| Token | Hex | 비고 |
|---|---|---|
| `--kakao` | `#FEE500` | 카카오 노란색 |
| `--kakao-ink` | `#191919` | 카카오 텍스트 |
| `--naver` | `#03C75A` | 네이버 그린 |

> ⚠️ OAuth 컬러는 `/login` 외에 사용 금지.

### 1.7 야간 안전 등급 (파스텔) — `/single`
색상 단독으로 등급을 구분하지 않고 항상 `letter(A~D) + label`을 함께 사용.

| Grade | Background | Foreground (text) | Bar fill |
|---|---|---|---|
| A · 매우 안전 | `#D1FAE5` | `#047857` | `#6EE7B7` |
| B · 안전 | `#DBEAFE` | `#1D4ED8` | `#93C5FD` |
| C · 주의 | `#FEF3C7` | `#A16207` | `#FDE68A` |
| D · 위험 | `#FEE2E2` | `#B91C1C` | `#FCA5A5` |

### 1.8 Neutral 0~900 매핑
프로젝트는 명시적 0–900 스케일 대신 **bg / line / ink** 기반으로 운용하지만, Tailwind/shadcn 변환 시 다음 스케일에 매핑할 수 있습니다.

| Step | Hex | 매핑 (프로젝트 토큰) |
|---|---|---|
| neutral-0 | `#FFFFFF` | `--surface` |
| neutral-50 | `#F4F6FA` | `--bg` |
| neutral-100 | `#F1F4F9` | `--surface-soft` |
| neutral-150 | `#EEF1F6` | `--line-2` |
| neutral-200 | `#E6E9F0` | `--line` |
| neutral-300 | `#E5E7EB` | `--card-border` |
| neutral-400 | `#C7D2E5` | disabled bg |
| neutral-500 | `#6B7689` | `--ink-3` |
| neutral-700 | `#3D475A` | `--ink-2` |
| neutral-900 | `#0B1220` | `--ink` |

---

## 2. 타이포그래피 (Typography)

### 2.1 폰트 패밀리
```css
--font: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui,
        "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
```
- `font-feature-settings: "ss01", "cv01"` 활성 (한글 숫자 가독성)
- `-webkit-font-smoothing: antialiased`

### 2.2 타입 스케일
한국어 가독성을 위해 헤딩에 `letter-spacing: -0.02em ~ -0.03em` 적용.

| Token | Size | Weight | Line-height | Letter-spacing | 예시 사용 |
|---|---|---|---|---|---|
| `display` | 44px | 800 | 1.0 | -0.04em | `deadline-card__d` (D-카운트다운) |
| `h1` | 30px | 800 | 1.0 | -0.04em | `sheet__score` (상세 점수) |
| `h2` | 26px | 800 | 1.3 | -0.03em | `login__hero` (로그인 헤로) |
| `h3` | 24px | 800 | 1.3 | -0.03em | `diag-title` (진단 타이틀) |
| `h4` | 22px | 800 | 1.3 | -0.03em | `sheet__name`, `share-hero__title` |
| `h5` | 20px | 800 | 1.3 | -0.03em | `single-head__title` |
| `title-lg` | 18px | 800 | 1.2 | -0.02em | `cand-card__score`, `report-card__score-num` |
| `title-md` | 16px | 800 | 1.3 | -0.02em | `safety-card__name`, `report-card__name`, `btn` |
| `title-sm` | 15px | 800 | 1.3 | -0.02em | `result-head__title`, `cand-card__name` |
| `body` | 14px | 500 | 1.55 | -0.01em | 기본 본문, 입력 필드 |
| `body-sm` | 13px | 600 | 1.5 | -0.01em | `diag-sub`, `tl-row__label` |
| `label` | 12px | 700 | 1.4 | -0.01em | 폼 라벨, 탭, pill |
| `caption` | 11px | 700 | 1.4 | -0.01em | 메타, 칩, 스텝 표시 |
| `caption-xs` | 10px | 700 | 1.3 | 0.04em | 데이터 배지, weekday, 메트릭 라벨 |

> 슬라이드/프린트 최소 크기: **본문 11px, 메타 10px**. 그 이하 사용 금지.

### 2.3 줄간격 / 자간 가이드
- 헤딩(800): `line-height: 1.0 ~ 1.3`, `letter-spacing: -0.02em ~ -0.04em`
- 본문(500–600): `line-height: 1.4 ~ 1.55`, `letter-spacing: -0.01em` 또는 0
- 캡션 대문자(`UPPER`): `letter-spacing: 0.04em ~ 0.06em` (데이터 배지, 스텝 캡션)

---

## 3. 간격 시스템 (Spacing)

베이스 4px 그리드. 모바일/데스크탑 모두 동일 스케일을 사용하되, **세로 패딩은 모바일에서 더 컴팩트**합니다.

| Token | Value | 사용 예 |
|---|---|---|
| `--s-1` | `4px` | 칩 내 gap, 인라인 마진 |
| `--s-2` | `8px` | 버튼 내부 gap, 카드 간 미세 간격 |
| `--s-3` | `12px` | 카드 padding-y, list gap |
| `--s-4` | `16px` | 카드 간 세로 간격, 컨테이너 padding |
| `--s-5` | `20px` | 섹션 padding-x (기본) |
| `--s-6` | `24px` | 섹션 padding-y, 큰 hero |
| `--s-7` | `32px` | 섹션 분리, 푸터 |
| `--s-8` | `40px` | 큰 vertical rhythm |
| `s-9` | `48px` | (확장) 페이지 hero 간격 |
| `s-10` | `64px` | (확장) 데스크탑 wide rhythm |

### 3.1 컨테이너 패딩 규칙
| 화면 영역 | 모바일 (375) | 데스크탑 (≥481) |
|---|---|---|
| Page horizontal | 20px | 24px (login은 24) |
| Card inner | 12–14px | 14–18px |
| Topbar | 0 12px | 0 16px |
| CTA bar | 12 20 24 | 12 24 24 |
| Sheet inner | 12 20 32 | 동일 |

---

## 4. 라디우스 (Border Radius)

| Token | Value | 용도 |
|---|---|---|
| `radius-xs` | `4px` | bar 트랙, 미세 indicator |
| `radius-sm` | `6px` | pill, badge, 작은 chip |
| `radius-md` | `8px` | stat tile, commute chip, filter chip |
| `radius-lg` | `10px` | tab pill, icon-btn, 작은 카드 |
| `radius-xl` | `12px` | **카드 통일 (`--card-radius`)**, field, mode-card |
| `radius-2xl` | `14px` | 큰 버튼, login notice, 주요 카드 |
| `radius-3xl` | `18px` | deadline-card, hero card |
| `radius-sheet` | `20–22px` | bottom sheet 상단 |
| `radius-phone` | `32–44px` | phone bezel, screen mask |
| `radius-full` | `999px` | nav-rail tag, fully rounded |

> 모든 카드는 `--card-radius: 12px`로 통일. sheet/hero만 더 큰 라디우스 사용.

---

## 5. 그림자 (Shadow)

| Token | Value | 용도 |
|---|---|---|
| `shadow-card` (`--card-shadow`) | `0 4px 16px rgba(0,0,0,0.06)` | **모든 카드 통일** |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | 활성 탭 |
| `shadow-md` | `0 2px 6px rgba(0,0,0,0.10)` | map-pill, floating chip |
| `shadow-lg` | `0 2px 8px rgba(0,0,0,0.10)` | map-zoom 컨트롤 |
| `shadow-xl` | `0 4px 12px rgba(0,0,0,0.18)` | sheet-close (떠있는 닫기 버튼) |
| `shadow-sheet` | `0 -10px 30px rgba(0,0,0,0.15)` | bottom sheet (위로 떠오름) |
| `shadow-logo` | `0 6px 14px rgba(37,99,235,0.32)` | 로고 (브랜드 글로우) |
| `shadow-phone` | `0 40px 80px rgba(0,0,0,0.45)` | 데스크탑 폰 베젤 |
| `focus-ring` | `0 0 0 4px rgba(37,99,235,0.10)` | 인풋 포커스 |

---

## 6. 컴포넌트 토큰 (Component Tokens)

### 6.1 Button
| Variant | Background | Color | Border | Shadow |
|---|---|---|---|---|
| `primary` | `#2563EB` | `#FFF` | none | none |
| `primary[disabled]` | `#C7D2E5` | `#FFF` | none | none |
| `outline` | `#FFF` | `--ink` (`#0B1220`) | `1px solid #E5E7EB` | none |
| `ghost` | `transparent` | `--ink-2` (`#3D475A`) | none | none |
| `destructive` | `#EF4444` | `#FFF` | none | none |
| `kakao` (login only) | `#FEE500` | `#191919` | none | none |
| `naver` (login only) | `#03C75A` | `#FFF` | none | none |

**Sizes**
- `default`: `height 52px`, `radius 14px`, `padding 0 18px`, `font 16/700`, `gap 8px`
- `sm`: `height 36px`, `radius 10px`, `padding 0 12px`, `font 12/700`
- `single-foot`: `height 44px`, `radius 12px`, `padding 0 14px`, `font 13/700`, with `card-border` + `card-shadow`

**Interactions**: `hover { filter: brightness(0.97) }`, `active { transform: translateY(1px) }`, `focus-visible { outline: 2px solid var(--primary); outline-offset: 2px }`.

### 6.2 Card (통일)
```css
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 12px;          /* --card-radius */
box-shadow: 0 4px 16px rgba(0,0,0,0.06);   /* --card-shadow */
padding: 14px;                 /* default; 12–18 가변 */
```
Variants:
- `card--accent`: `background: #EAF1FF; border-color: #2563EB`
- `card--best` (cand-card.is-best): 위와 동일 + 점수 강조
- `report-card`: 위 베이스 + `padding 14px`
- `safety-card`: 위 베이스 + `padding 14px`

### 6.3 Input / Field
```css
border: 1.5px solid #E5E7EB;
border-radius: 12px;
background: #FFFFFF;
height: 56px;
padding: 0 14px;
font: 14px / 500 / -0.01em;
color: #0B1220;
```
- **Focus**: `border-color: #2563EB; box-shadow: 0 0 0 4px rgba(37,99,235,0.10)`
- **Placeholder**: `color: #6B7689`
- **Field row**: 가로 `display: flex; gap: 10px;` (tag + value + suffix)
- **Tag**: 24×24, radius 6, font 12/800/white. `--tag-a: #2563EB`, `--tag-b: #7C3AED`

### 6.4 Badge / Pill
```css
display: inline-flex;
align-items: center;
gap: 4px;
padding: 4px 8px;
border-radius: 6px;
font: 11px / 700 / -0.01em;
line-height: 1.2;
```
| Variant | Background | Foreground |
|---|---|---|
| `default` (primary-soft) | `#EAF1FF` | `#2563EB` |
| `solid` | `#2563EB` | `#FFF` |
| `ok` | `#E7F8F1` | `#047857` |
| `neutral` | `#F4F6FA` | `#3D475A` |
| `danger` | `#FEE7E7` | `#EF4444` |
| `grade-A/B/C/D` | 파스텔 (§1.7) | 파스텔 fg (§1.7) |

### 6.5 Tabs (Segmented)
```css
container { padding: 3px; background: #F4F6FA; border-radius: 10px; }
tab       { height: 30px; radius: 8px; font: 12/700; color: #6B7689; }
tab.active{ background: #FFF; color: #0B1220; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
```

### 6.6 Sheet / Modal
```css
position: fixed-bottom;
border-top-radius: 22px;        /* sheet 22, cards-sheet 20 */
background: #FFFFFF;
padding: 12px 20px 32px;
box-shadow: 0 -10px 30px rgba(0,0,0,0.15);
```
- **Overlay**: `background: rgba(11,18,32,0.45)` (ink 기반 dim)
- **Handle bar**: `36×4px`, `radius 2px`, `background: #E6E9F0`
- **Close button**: `36×36`, `radius 18`, `background: #FFF`, `shadow-xl`
- **Animation**: 권장 `transform: translateY(100% → 0)`, `duration 280ms`, `ease cubic-bezier(.32,.72,0,1)` (iOS-like)
- **Backdrop fade**: `opacity 0 → 1`, `220ms ease-out`

### 6.7 Stat Tile
```css
padding: 6px 8px;
radius: 8px;
background: #F4F6FA;
label: 10px / 600 / #6B7689
value: 12px / 800 / -0.02em / #0B1220
```

### 6.8 Logo Mark
- 28×28, radius 8, gradient `135deg #2563EB → #4F8CFF`, shadow `0 6px 14px rgba(37,99,235,0.32)`

---

## 7. Tailwind Config (변환용 JSON)

`tailwind.config.ts` → `theme.extend`에 그대로 병합 가능합니다.

```json
{
  "theme": {
    "extend": {
      "fontFamily": {
        "sans": ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "sans-serif"]
      },
      "colors": {
        "bg": "#F4F6FA",
        "surface": "#FFFFFF",
        "surface-soft": "#F1F4F9",
        "ink": {
          "DEFAULT": "#0B1220",
          "2": "#3D475A",
          "3": "#6B7689"
        },
        "line": {
          "DEFAULT": "#E6E9F0",
          "soft": "#EEF1F6",
          "card": "#E5E7EB"
        },
        "primary": {
          "DEFAULT": "#2563EB",
          "soft": "#EAF1FF",
          "deep": "#1E3A8A",
          "foreground": "#FFFFFF",
          "disabled": "#C7D2E5"
        },
        "secondary": {
          "DEFAULT": "#7C3AED",
          "foreground": "#FFFFFF"
        },
        "success": { "DEFAULT": "#10B981", "soft": "#E7F8F1", "fg": "#047857" },
        "info":    { "DEFAULT": "#3B82F6", "soft": "#E5EEFC" },
        "warning": { "DEFAULT": "#EAB308", "soft": "#FEF7CD", "fg": "#A16207" },
        "destructive": { "DEFAULT": "#EF4444", "soft": "#FEE7E7", "foreground": "#FFFFFF" },
        "kakao":  { "DEFAULT": "#FEE500", "ink": "#191919" },
        "naver":  { "DEFAULT": "#03C75A" },
        "grade": {
          "a-bg": "#D1FAE5", "a-fg": "#047857", "a-bar": "#6EE7B7",
          "b-bg": "#DBEAFE", "b-fg": "#1D4ED8", "b-bar": "#93C5FD",
          "c-bg": "#FEF3C7", "c-fg": "#A16207", "c-bar": "#FDE68A",
          "d-bg": "#FEE2E2", "d-fg": "#B91C1C", "d-bar": "#FCA5A5"
        }
      },
      "spacing": {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "7": "32px",
        "8": "40px",
        "9": "48px",
        "10": "64px"
      },
      "borderRadius": {
        "xs": "4px",
        "sm": "6px",
        "md": "8px",
        "lg": "10px",
        "xl": "12px",
        "2xl": "14px",
        "3xl": "18px",
        "sheet": "22px",
        "full": "9999px"
      },
      "boxShadow": {
        "card": "0 4px 16px rgba(0,0,0,0.06)",
        "sm":   "0 1px 3px rgba(0,0,0,0.06)",
        "md":   "0 2px 6px rgba(0,0,0,0.10)",
        "lg":   "0 2px 8px rgba(0,0,0,0.10)",
        "xl":   "0 4px 12px rgba(0,0,0,0.18)",
        "sheet":"0 -10px 30px rgba(0,0,0,0.15)",
        "logo": "0 6px 14px rgba(37,99,235,0.32)",
        "focus":"0 0 0 4px rgba(37,99,235,0.10)"
      },
      "fontSize": {
        "caption-xs": ["10px", { "lineHeight": "1.3", "letterSpacing": "0.04em", "fontWeight": "700" }],
        "caption":    ["11px", { "lineHeight": "1.4", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "label":      ["12px", { "lineHeight": "1.4", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "body-sm":    ["13px", { "lineHeight": "1.5", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "body":       ["14px", { "lineHeight": "1.55", "letterSpacing": "-0.01em", "fontWeight": "500" }],
        "title-sm":   ["15px", { "lineHeight": "1.3", "letterSpacing": "-0.02em", "fontWeight": "800" }],
        "title-md":   ["16px", { "lineHeight": "1.3", "letterSpacing": "-0.02em", "fontWeight": "800" }],
        "title-lg":   ["18px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "800" }],
        "h5":         ["20px", { "lineHeight": "1.3", "letterSpacing": "-0.03em", "fontWeight": "800" }],
        "h4":         ["22px", { "lineHeight": "1.3", "letterSpacing": "-0.03em", "fontWeight": "800" }],
        "h3":         ["24px", { "lineHeight": "1.3", "letterSpacing": "-0.03em", "fontWeight": "800" }],
        "h2":         ["26px", { "lineHeight": "1.3", "letterSpacing": "-0.03em", "fontWeight": "800" }],
        "h1":         ["30px", { "lineHeight": "1.0", "letterSpacing": "-0.04em", "fontWeight": "800" }],
        "display":    ["44px", { "lineHeight": "1.0", "letterSpacing": "-0.04em", "fontWeight": "800" }]
      }
    }
  }
}
```

---

## 8. shadcn/ui CSS 변수 (HSL 형식)

`app/globals.css`의 `:root`/`.dark` 블록에 그대로 사용 가능합니다. shadcn은 `hsl(<h s l>)` 토큰을 기대하므로 hex를 HSL로 변환해 둡니다.

```css
:root {
  /* Surfaces */
  --background:        220 33% 97%;   /* #F4F6FA */
  --foreground:        220 47% 8%;    /* #0B1220 */
  --card:              0 0% 100%;     /* #FFFFFF */
  --card-foreground:   220 47% 8%;    /* #0B1220 */
  --popover:           0 0% 100%;
  --popover-foreground:220 47% 8%;

  /* Brand */
  --primary:           221 83% 53%;   /* #2563EB */
  --primary-foreground:0 0% 100%;
  --primary-soft:      219 100% 96%;  /* #EAF1FF */
  --primary-deep:      224 64% 33%;   /* #1E3A8A */
  --secondary:         262 83% 58%;   /* #7C3AED */
  --secondary-foreground:0 0% 100%;

  /* Neutrals */
  --muted:             220 33% 97%;   /* #F4F6FA */
  --muted-foreground:  220 14% 47%;   /* #6B7689 */
  --accent:            219 100% 96%;  /* #EAF1FF */
  --accent-foreground: 221 83% 53%;
  --border:            220 13% 91%;   /* #E5E7EB */
  --input:             220 13% 91%;
  --ring:              221 83% 53%;   /* focus ring = primary */

  /* Status */
  --success:           160 84% 39%;   /* #10B981 */
  --success-foreground:0 0% 100%;
  --warning:           45 93% 47%;    /* #EAB308 */
  --warning-foreground:0 0% 100%;
  --destructive:       0 84% 60%;     /* #EF4444 */
  --destructive-foreground:0 0% 100%;
  --info:              217 91% 60%;   /* #3B82F6 */

  /* Ink scale */
  --ink:               220 47% 8%;
  --ink-2:             220 20% 30%;
  --ink-3:             220 14% 47%;

  /* Grade pastels */
  --grade-a-bg: 152 76% 90%;  --grade-a-fg: 161 94% 24%;  --grade-a-bar: 156 72% 67%;
  --grade-b-bg: 213 97% 87%;  --grade-b-fg: 224 76% 48%;  --grade-b-bar: 213 93% 78%;
  --grade-c-bg: 48 96% 89%;   --grade-c-fg: 35 92% 33%;   --grade-c-bar: 48 94% 76%;
  --grade-d-bg: 0 93% 94%;    --grade-d-fg: 0 74% 42%;    --grade-d-bar: 0 94% 82%;

  /* Radii */
  --radius: 0.75rem;       /* 12px — card 통일 */
}
```

> 사용 예: `bg-[hsl(var(--primary))]`, `text-[hsl(var(--ink-3))]`, `shadow-[var(--card-shadow)]`.

`tailwind.config.ts`에서 shadcn 컨벤션과 함께 쓰려면:
```ts
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
    soft: "hsl(var(--primary-soft))",
    deep: "hsl(var(--primary-deep))",
  },
  // ...
}
```

---

## 9. 상태/접근성 가이드

- **터치 타깃 ≥48px** (icon-btn 40px이지만 padding 포함 hit box 48px 이상)
- **포커스 링**: 모든 interactive 요소 `outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 6px`
- **색맹 대응**: 야간 안전 등급은 항상 `색 + 등급 문자(A~D) + 텍스트 라벨` 3중 표기
- **순흑/순백 금지**: 텍스트는 `--ink (#0B1220)` 사용, 배경은 `--bg`/`--surface`
- **모션**: 버튼 `120ms ease`, 시트 `280ms cubic-bezier(.32,.72,0,1)`, 페이드 `220ms ease-out`

---

## 10. 화면별 토큰 사용 매트릭스 (Cheat Sheet)

| 화면 | 핵심 색 | 특징 토큰 |
|---|---|---|
| 1. login | `--surface` 흰 배경 | `--kakao`, `--naver`, `--bg` (notice), btn 14px radius |
| 2. diagnosis | `--surface` 흰 배경 | `--primary-soft` (active mode-card), tag-a/b, focus-ring |
| 3. result | `--surface-soft` 결과 배경 | tabs (`--bg` track), map placeholder `#E5EAF2`, cand-card |
| 4. detail | dim overlay `rgba(11,18,32,0.45)` | sheet 22px radius, sheet-shadow, primary `--primary` 점수 |
| 5. share | `--primary-deep → --primary` 그라디언트 hero | `data-badge` (rgba white 0.14), locked overlay blur(8px) |
| 6. deadline | hero gradient, `--bg` 페이지 | calendar `--primary-soft`, timeline `--primary` rail |
| 7. single | `--bg` 페이지, 파스텔 | grade A~D 토큰 전부 사용, 막대 6px high |

---

**Migration 노트** — 이 토큰셋은 `styles.css`의 `:root` 블록과 1:1 대응됩니다. Tailwind/shadcn으로 옮길 때 §7, §8을 그대로 복사한 뒤, 화면별로 §10의 매트릭스를 참고해 색·간격·라디우스를 매핑하세요.
