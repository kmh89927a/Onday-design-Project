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
> 각 항목: **용도 · variant 의미 · props/상태 · 실 사용 예시(file:line)**. 용례는 전부 실제 코드 근거.
>
> ⚠️ **primitive vs 도메인 인라인**: `ui/card.tsx`·`ui/input.tsx`·`ui/sheet.tsx`(shadcn 베이스)는 현재
> **`/dev` 쇼케이스에서만 import**되고, 실제 화면은 같은 토큰을 적용한 도메인 컴포넌트(CandidateCard·
> SafetyCard·AddressInput·BottomSheet)를 쓴다. 아래는 그 실사용을 정직하게 반영한다.

### Button — `src/components/ui/button.tsx`
- **용도**: 모든 클릭 액션. 주 CTA = `default`(primary), 보조 = `outline`/`ghost`.
- **variant 의미**(실사용):
  | variant | 스타일 | 실 용례 |
  |---|---|---|
  | `default`(primary) | `bg-primary text-primary-foreground` · disabled `bg-[hsl(220 30% 84%)]` | 진단 시작·랜딩 CTA |
  | `outline` | `bg-surface border-card-border` | 싱글 결과 "리포트 저장(PDF)" (`single-result-view.tsx:886,904`) |
  | `ghost` | `bg-transparent text-ink-2` | 저강조 액션 |
  | `destructive` | `bg-danger text-white` | 파괴적 액션 |
  | `secondary` | `bg-secondary text-secondary-foreground` | 보조 강조 |
  | `kakao`/`naver` | `bg-oauth-* text-oauth-*-ink` | OAuthButton 내부 |
  | `link` | `text-primary underline` | 인라인 링크형 |
- **size/props**: size `default`(=md, h52, rounded-2xl, px-18)·`sm`(h36)·`lg`(h44)·`single-foot`·`icon`(52²)·`icon-sm`(36²). props `leading`/`trailing`(아이콘), `loading`(→스피너 + `aria-busy` + 클릭 차단, `button.tsx:12,81`), `fullWidth`. hover `brightness-95`.
- **실 예시** — 진단 시작 CTA (`src/app/diagnosis/page.tsx:610`):
  ```tsx
  <Button fullWidth onClick={handleSubmit} loading={createDiagnosis.isPending}
          disabled={!canSubmit} trailing={<ArrowRight />}>진단 시작</Button>
  ```
  랜딩 1차 CTA (`landing-client.tsx:172`): `<Button fullWidth size="lg" trailing={<ArrowRight />}>`.

### Badge — `src/components/ui/badge.tsx`
- **용도**: 상태·등급·라벨 칩. base `rounded-sm border-transparent font-bold`, size `sm`(기본)·`xs`.
- **variant 의미**(실사용): `best`=후보 1위 강조, `solid`/`neutral`=순위 칩, `grade-a~d`=야간 안전(파스텔), `fatigue-*`=환승 피로도, 나머지(`ok`/`info`/`warning`/`danger`/`outline`)는 status 칩(대부분 `/dev` 쇼케이스).
  | variant | 스타일 |
  |---|---|
  | `default` | `bg-primary-soft text-primary` |
  | `best` | `bg-danger text-primary-foreground shadow-sm` (★ BEST) |
  | `solid` | `bg-primary text-primary-foreground` |
  | `grade-a~d` | 파스텔 `bg-[hsl(152 76% 90%)] text-[hsl(161 94% 24%)]` … (a/b/c/d) |
  | `fatigue-low/medium/high` | status-soft 배경 + `fatigue-*` 텍스트 |
  | `ok`/`info`/`warning`/`neutral`/`danger`/`outline` | 각 status soft/배경 |
- **실 예시** — BEST + 순위 칩 (`src/components/card/candidate-card.tsx:85,106`):
  ```tsx
  {isBest && <Badge variant="best">BEST</Badge>}           // isBest = rank === 1
  <Badge variant={isBest ? "solid" : "neutral"} size="xs">…</Badge>
  ```

### Card 패턴 — primitive `ui/card.tsx` + 도메인 인라인
- **용도**: 표면 컨테이너. base `rounded-lg border bg-surface shadow-card`.
- **primitive**(`ui/card.tsx`): variant `default`(border-card-border)·`accent`(border-primary + bg-primary-soft); size `default`(py-s-4)·`sm`·`lg`. **현재 import는 `/dev/page.tsx`뿐**.
- **도메인 실사용**(같은 패턴을 인라인 재현):
  - `CandidateCard` (`candidate-card.tsx:163`) — `<a>` 베이스, best 시 `primary-soft + border-primary`.
  - `SafetyCard` (`safety-card.tsx:95`) — `rounded-lg border border-card-border bg-surface p-s-4 shadow-card`.
- → Card 패턴을 새로 쓸 땐 위 클래스 조합(또는 `ui/card.tsx`)을 따른다.

### Input — `src/components/ui/input.tsx`
- **용도**: 단일 텍스트/날짜 필드. `h-14`(56px)·`border-[1.5px] border-card-border`·`rounded-lg`·`px-3.5`·`text-body`. **focus** `border-primary` + `ring-4 ring-primary/10`. disabled `bg-surface-soft opacity-60`.
- **실사용 범위**(정직): 도메인은 **데드라인 날짜 입력 1곳**(`src/app/deadline/page.tsx:181`)에서 사용. **주소 입력은 `ui/Input`이 아니라 별도 `AddressInput`**(combobox + 자동완성 + verified, `form/address-input.tsx`)을 쓴다.

### Sheet (도메인 = BottomSheet/DetailSheet) — `src/components/sheet/bottom-sheet.tsx`
- **용도**: 모바일 바텀 시트(후보 상세). 화면에서 카드/마커 클릭 시 하단에서 슬라이드업.
- **실체**: 도메인 바텀시트는 **`BottomSheet`**(Base UI `Dialog` 기반, `bottom-sheet.tsx:4`)이며, 후보 상세는 이를 감싼 **`DetailSheet`**(`sheet/detail-sheet.tsx`)다. shadcn `ui/sheet.tsx`(side bottom/top/left/right + `SheetHandle`)는 **`/dev` 쇼케이스 전용**.
- **스타일**: bottom `rounded-t-3xl` + shadow `sheet` + 진입/이탈 translate(data-starting/ending-style), 백드롭 + Close 버튼.
- **실 예시** — 후보 상세 (`src/app/diagnosis/result/[id]/result-content.tsx:613`):
  ```tsx
  <DetailSheet open={openId !== null} onClose={() => setOpenId(null)}
               candidate={{ name, score, pills: […] }} />
  ```
  싱글 결과도 동일 패턴(`single-result-view.tsx:773`).

### CandidateCard — `src/components/card/candidate-card.tsx`
- **용도**: 추천 동네 후보 1건 카드(결과 목록의 핵심 단위).
- **props**: `name · score · rank · best · commutes[{tag:'A'|'B', mode, minutes}]`. `best`(rank=1 또는 `best=true`) → **primary-soft + border-primary + BEST 뱃지**. 점수 티어 `scoreTier`: ≥90 / ≥80 / ≥70 (`candidate-card.tsx:20-30`). **aria-label** = 이름+점수+순위+통근 3중(`:75`).
- **실 예시** — 결과 목록 (`src/app/diagnosis/result/[id]/result-content.tsx:581`):
  ```tsx
  <CandidateCard name={`${c.gu} ${c.dong}`} score={c.score} rank={i+1}
                 best={i === 0} commutes={[{ tag:"A", mode, minutes:c.commuteA.time }, …]} />
  ```

### SafetyGradeBadge — `src/components/data/safety-grade-badge.tsx`
- **용도**: 야간 안전 등급 표기(싱글 모드 핵심). 등급 라벨 **A 매우 안전·B 안전·C 주의·D 위험**(`:21-24`). `null`(데이터 없음) → 중립 회색 "준비중"(letter "—", `:40-46`).
- **상태/색**: **letter + label + 색 3중 표기**(색 단독 금지). A·B = primary 파스텔, C·D = warning/danger soft(뱃지 grade-* 계열).
- **실 예시**: `SafetyCard` 우상단 (`safety-card.tsx:61`), 찜 목록 (`favorites-menu.tsx:159`):
  ```tsx
  <SafetyGradeBadge grade={grade} label={grade ? gradeLabel : undefined} />
  ```

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
