# OnDay — DESIGN.md (디자인 시스템)

OnDay의 **실제 구현 디자인 시스템**을 단일 문서로 정리한다. 새 프로젝트/기능에 일관 적용·재현하기 위한 레퍼런스다.

- **출처(SSoT)**: `src/app/globals.css`(CSS 변수 실제 값) + `tailwind.config.ts`(구조 토큰) + `src/components/**`(컴포넌트).
- **원칙**: 본 문서의 모든 값은 위 코드에서 **1:1 추출**. 판단이 갈리는 항목은 [`AGENT_ARBITRARY_DECISIONS.md`](AGENT_ARBITRARY_DECISIONS.md)에 분리 기록.
- **컬러 표기**: 구현 `hsl`(H S% L%)이 정본. 일부 참고용 hex 병기는 원본 스펙 기재값(결정 #2).

---

## 1. 개요

- **폰트**: Pretendard (CDN import — `globals.css:1`), system 폴백.
- **테마**: **light-first** (다크모드는 reserved·미사용 — 결정 #4).
- **레이아웃**: 모바일 우선. 반응형 컨테이너(§6).
- **색 모델**: 모든 시맨틱 색은 `--token` CSS 변수(hsl) → Tailwind 색 이름으로 매핑.

---

## 2. 디자인 토큰

### 2.1 색 (globals.css `:root`, light)

**Surfaces** (`globals.css:9-12`)
| 토큰 | hsl | 의미 |
|---|---|---|
| `--bg` | `220 27% 97%` | 페이지 배경 |
| `--surface` | `0 0% 100%` | 카드/표면 (흰색) |
| `--surface-soft` | `220 27% 96%` | 소프트 표면(hover 등) |

**Ink — 텍스트** (`globals.css:14-17`)
| 토큰 | hsl | 의미 |
|---|---|---|
| `--ink` | `222 36% 9%` | 본문/타이틀 (참고 hex `#0B1220`) |
| `--ink-2` | `220 19% 30%` | 보조 텍스트 |
| `--ink-3` | `220 12% 48%` | 캡션/placeholder |

**Lines / Borders** (`globals.css:19-22`)
| 토큰 | hsl |
|---|---|
| `--card-border` | `220 13% 91%` |
| `--line` | `220 22% 92%` |
| `--line-2` | `220 28% 95%` |

**Brand — 신뢰 블루** (`globals.css:24-34`)
| 토큰 | hsl | 의미 |
|---|---|---|
| `--primary` | `221 83% 53%` | 메인 CTA·링크·강조 (참고 hex `#2563EB`) |
| `--primary-pastel` | `221 83% 90%` | 큰 면적 배경 강조(DDayCounter 등) |
| `--primary-soft` | `221 83% 95%` | 활성/소프트 배경(Card.accent 등, 참고 hex `#EAF1FF`) |
| `--primary-deep` | `221 83% 35%` | 그라디언트 헤더(참고 hex `#1E3A8A`) |
| `--primary-foreground` | `0 0% 100%` | primary 위 텍스트 |
| `--secondary` | `262 83% 58%` | 보조(B/배우자 톤) |
| `--secondary-foreground` | `0 0% 100%` | |

**Status** (`globals.css:36-44`)
| 토큰 | hsl | / soft |
|---|---|---|
| `--success` | `160 84% 39%` | `--success-soft 152 60% 94%` |
| `--info` | `217 91% 60%` | `--info-soft 215 80% 95%` |
| `--warning` | `38 92% 50%` | `--warning-soft 48 96% 92%` |
| `--danger` | `0 84% 60%` | `--danger-soft 0 86% 96%` |

**Safety — 야간 안전 등급 (solid)** (`globals.css:51-55`)
| 토큰 | hsl | 등급 |
|---|---|---|
| `--safety-a` | `160 84% 39%` | A 매우 안전(emerald) |
| `--safety-b` | `217 91% 60%` | B 안전(blue) |
| `--safety-c` | `38 92% 50%` | C 주의(amber) |
| `--safety-d` | `0 84% 60%` | D 위험(red) |

> ⚠️ 안전등급 색은 **2종 병존**(결정 #1): 위 solid `--safety-*`(SafetyBar 등) + 뱃지용 파스텔 `grade-*`(§4 Badge). §3 참조.

**Fatigue — 환승 피로도 텍스트색** (`globals.css:46-49`)
| 토큰 | hsl |
|---|---|
| `--fatigue-low` | `160 50% 32%` |
| `--fatigue-medium` | `28 78% 40%` |
| `--fatigue-high` | `0 62% 48%` |

**OAuth (리터럴, `tailwind.config.ts:79-84`)**
| 토큰 | 값 |
|---|---|
| `oauth-kakao` | `#FEE500` / ink `#191600` |
| `oauth-naver` | `#03C75A` / ink `#FFFFFF` |

### 2.2 타이포그래피 (14단, `tailwind.config.ts:125-140`)

| 토큰 | size | line-height | letter-spacing | weight |
|---|---|---|---|---|
| `display-1` | 40px | 48px | -0.02em | 700 |
| `display-2` | 32px | 40px | -0.02em | 700 |
| `h1` | 28px | 36px | -0.015em | 700 |
| `h2` | 24px | 32px | -0.01em | 700 |
| `h3` | 20px | 28px | -0.005em | 600 |
| `h4` | 18px | 26px | — | 600 |
| `title` | 16px | 24px | — | 600 |
| `body-lg` | 16px | 24px | — | — |
| `body` | 14px | 22px | — | — |
| `body-sm` | 13px | 20px | — | — |
| `caption` | 12px | 18px | — | — |
| `caption-xs` | 11px | 16px | 0.02em | — |
| `tabular` | 14px | 20px | — | (tabular-nums) |
| `mono-sm` | 12px | 18px | — | — |

- 폰트 패밀리: `Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif` (`tailwind.config.ts:113-124`).
- `body` 기본: `font-feature-settings: "ss01","cv11"` (`globals.css:140`).

### 2.3 간격 (`tailwind.config.ts:143-155`)

`s-1` 4px · `s-2` 8 · `s-3` 12 · `s-4` 16 · `s-5` 20 · `s-6` 24 · `s-7` 32 · `s-8` 40 · `s-9` 48 · `s-10` 64 · `safe-bottom` = `env(safe-area-inset-bottom)`

### 2.4 Radius (`tailwind.config.ts:158-168`)

`xs` 4px · `sm` 6 · `md` 8 · `lg` 12 · `xl` 16 · `2xl` 20 · `3xl` 24 · `chip` 9999 · `phone` 44

### 2.5 Shadow (`tailwind.config.ts:171-180`)

| 토큰 | 값 |
|---|---|
| `card` | `0 1px 2px rgba(11,18,32,.04), 0 1px 3px rgba(11,18,32,.06)` |
| `card-hover` | `0 2px 6px rgba(11,18,32,.06), 0 8px 24px rgba(11,18,32,.08)` |
| `sheet` | `0 -8px 24px rgba(11,18,32,.10)` |
| `floating` | `0 8px 24px rgba(11,18,32,.12)` |
| `focus-ring` | `0 0 0 2px hsl(var(--primary) / .4)` |
| `marker` | `0 2px 8px rgba(37,99,235,.32)` |
| `marker-hover` | `0 4px 12px rgba(37,99,235,.45)` |
| `elevated` | `0 12px 32px rgba(11,18,32,.14)` |

### 2.6 Motion (`tailwind.config.ts:183-227`)

- **Easing**: `sheet` `cubic-bezier(.32,.72,0,1)` · `smooth` `cubic-bezier(.4,0,.2,1)`
- **Duration**: 120 · 180 · 220 · 280 · 380 (ms)
- **Animations**: `sheet-up`(280) · `sheet-down`(240) · `fade-in`(220) · `modal-in`(200) · `pulse-soft`(1.6s infinite) · `safety-fill`(380)

### 2.7 Z-index (`tailwind.config.ts:247-255`)

`nav` 40 · `sticky` 50 · `sheet-backdrop` 90 · `sheet` 100 · `modal` 110 · `toast` 120 · `tooltip` 130

---

## 3. 색 의미 체계 (Semantic Map)

| 용도 | 토큰 |
|---|---|
| 메인 CTA·링크·강조 | `primary` (+ soft/pastel/deep) |
| 보조(B/배우자 마커) | `secondary` |
| 성공/완료 | `success` |
| 정보/중립 강조 | `info` |
| 경고 | `warning` |
| 위험/삭제 | `danger` |
| 야간 안전 등급 | `safety-a~d` (solid) · `grade-a~d` (뱃지 파스텔) |
| 환승 피로도 | `fatigue-low/medium/high` |
| OAuth 브랜드 | `oauth-kakao` / `oauth-naver` (리터럴) |
| 지도 마커 | A=primary 파랑 · B=warning 주황 · 여가거점=success 녹색 (`map-canvas-kakao.tsx:43-47`, 리터럴) |

> ★ **안전등급 색 이원화**(결정 #1): `SafetyBar` 등 막대 = **solid** `--safety-*`; `SafetyGradeBadge`/뱃지 = **파스텔** `grade-*`(soft 배경 + deep 텍스트). 용도별 2종을 의도적으로 병존.

---

## 4. 레퍼런스 컴포넌트

> 실제 구현된 핵심 컴포넌트만(결정 #6). 전체 31개 설계 스펙은 `design-input/components-spec.md` 참조.

### Button — `src/components/ui/button.tsx`
| variant | 스타일 |
|---|---|
| `default`(primary) | `bg-primary text-primary-foreground` · disabled `bg-hsl(220 30% 84%)` |
| `outline` | `bg-surface border-card-border` |
| `ghost` | `bg-transparent text-ink-2` |
| `destructive` | `bg-danger text-white` |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `kakao` / `naver` | `bg-oauth-* text-oauth-*-ink` |
| `link` | `text-primary underline` |

**size**: `default`(=`md`, h 52px, rounded-2xl, px-18) · `sm`(h36, rounded-lg) · `lg`(h44) · `single-foot`(lg + border + shadow) · `icon`(52²) · `icon-sm`(36²). hover `brightness-95`.

### Badge — `src/components/ui/badge.tsx`
base: `rounded-sm border-transparent font-bold`. **size**: `sm`(기본) · `xs`.
| variant | 스타일 |
|---|---|
| `default` | `bg-primary-soft text-primary` |
| `best` | `bg-danger text-primary-foreground shadow-sm` (★ BEST 뱃지) |
| `solid` | `bg-primary text-primary-foreground` |
| `secondary`/`ok`/`info`/`warning`/`neutral`/`danger`/`outline` | 각 status soft/배경 |
| `grade-a` | `bg-[hsl(152 76% 90%)] text-[hsl(161 94% 24%)]` |
| `grade-b` | `bg-[hsl(213 97% 87%)] text-[hsl(224 76% 48%)]` |
| `grade-c` | `bg-[hsl(48 96% 89%)] text-[hsl(35 92% 33%)]` |
| `grade-d` | `bg-[hsl(0 93% 94%)] text-[hsl(0 74% 42%)]` |
| `fatigue-low/medium/high` | status-soft 배경 + `fatigue-*` 텍스트 |

### Card — `src/components/ui/card.tsx`
base: `rounded-lg border bg-surface shadow-card`. **variant**: `default`(border-card-border) · `accent`(border-primary + bg-primary-soft). **size**: `default`(py-s-4) · `sm`(py-s-3) · `lg`(py-s-5).

### Input — `src/components/ui/input.tsx`
`h-14`(56px) · `border-[1.5px] border-card-border` · `rounded-lg` · `px-3.5` · `text-body`. **focus**: `border-primary` + `ring-4 ring-primary/10`. disabled `bg-surface-soft opacity-60`.

### Sheet (BottomSheet) — `src/components/ui/sheet.tsx`
**side** `bottom`(기본): `rounded-t-3xl px-s-5 pt-s-3 pb-s-7 max-h-[90vh]` + `SheetHandle`. `top`/`left`/`right` 폴백 제공. 진입/이탈 = translate (data-starting/ending-style). shadow `sheet`.

### CandidateCard — `src/components/card/candidate-card.tsx`
props: `name · score · rank · best · commutes[{tag A/B, minutes}]`. `best`(rank=1 또는 best=true) = **primary-soft + border-primary + BEST 뱃지**. 점수 티어: ≥90 / ≥80 / ≥70 (`scoreTier`). aria-label = 이름+점수+순위+통근 3중.

### SafetyGradeBadge — `src/components/data/safety-grade-badge.tsx`
등급 라벨: **A 매우 안전 · B 안전 · C 주의 · D 위험**. `null`(데이터 없음) → 중립 회색 "준비중"(letter "—"). **letter + label + 색 3중 표기**(색 단독 금지). A·B=primary 파스텔, C·D=warning/danger soft.

---

## 5. 접근성 (a11y)

- **Focus ring**: 모든 인터랙티브 요소 `outline: 2px solid hsl(var(--primary)); outline-offset: 2px; border-radius: var(--radius-sm)` (`globals.css:144-148`).
- **Reduced motion**: `prefers-reduced-motion: reduce` 시 모든 애니메이션/트랜지션 `0.01ms` (`globals.css:151-160`).
- **안전등급 3중 표기**: 색 단독 금지 — letter + label + color 동시(`safety-grade-badge.tsx`, `globals.css:51` 주석).
- **Tabular numbers**: 시세/점수 정렬용 `.tabular { font-variant-numeric: tabular-nums }` (`globals.css:163-165`).
- **Print (PDF 저장 — /single·/share)**: A4 `@page`, 색 보존(`print-color-adjust: exact`), 흑백 대응 등급 경계 보존, `.no-print`/`.print-page-break` (`globals.css:169-217`).

---

## 6. 반응형

컨테이너 중앙 정렬 + 패딩 1rem, breakpoints (`tailwind.config.ts:13-22`):

| bp | min-width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

---

## 부록. 원본 스펙과의 드리프트

`design-input/`(2026-04, 구현 이전 스펙)과 현재 구현 사이 차이는 **코드를 정본**으로 한다. 판단이 갈린 6개 항목은 [`AGENT_ARBITRARY_DECISIONS.md`](AGENT_ARBITRARY_DECISIONS.md)에 결정·사유·근거(file:line)로 기록.

| 드리프트 | 정본 |
|---|---|
| 안전등급 색 이원화(solid vs 파스텔) | 2종 병존(결정 #1) |
| hex(스펙) vs hsl(구현) | hsl(결정 #2) |
| 타이포 weight(스펙 800 vs 구현 600) | 구현 600(결정 #3) |
| 다크모드 | reserved·미사용(결정 #4) |
| 인라인 색(마커·disabled·grade) | 현황 기록만(결정 #5) |
| 컴포넌트 범위 | 구현 핵심만(결정 #6) |
