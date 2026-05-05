---
name: Feature Task
title: "[Feature] INFRA-004: Tailwind CSS + shadcn/ui 디자인 시스템 초기 설정"
labels: ['feature', 'priority:H', 'epic:Infra', 'wave:1']
assignees: []
---

## 1. 🎯 Summary

- **기능명:** [INFRA-004] Tailwind CSS + shadcn/ui 디자인 시스템 초기 설정
- **목적 (Why):**
  - **비즈니스:** UI-001~014 14개 프론트엔드 태스크의 공통 디자인 기반을 확립한다. shadcn/ui + Radix UI 기반으로 접근성(a11y) 우수한 컴포넌트 라이브러리를 구성하고, Pretendard 한국어 폰트 + 브랜드 컬러 토큰으로 일관된 디자인 시스템을 제공한다.
  - **사용자 가치:** 한국어에 최적화된 타이포그래피와 일관된 UI 컴포넌트로 전문적이고 신뢰감 있는 서비스 경험을 제공한다.
- **범위 (What):**
  - ✅ 만드는 것: shadcn/ui 초기화, 핵심 컴포넌트 ≥6개 설치 (Button/Card/Input/Label/Dialog/Toast), 디자인 토큰 (컬러/폰트/스페이싱), Pretendard 웹폰트, CSS Variables 기반 다크모드, `@/components/ui/*` 경로 확립
  - ❌ 만들지 않는 것: 개별 페이지 UI(UI-001~014 범위), 비즈니스 로직, NextAuth.js, 결제 UI
- **복잡도:** L
- **Wave:** 1 (인프라 트랙)

---

## 2. 🔗 References (Spec & Context)

### SRS 인용 (REQ ID + 본문 발췌)

- **CON-12** (§1.2.3): "UI/스타일링은 Tailwind CSS + shadcn/ui를 사용하여 일관된 디자인 시스템을 강제한다."
- **CON-09** (§1.2.3): "모든 서비스는 Next.js (App Router) 기반의 단일 풀스택 프레임워크로 구현한다."
- **REQ-NF-002** (§4.2.1): "일반 페이지 로딩 시간 — p95 ≤ 1,500ms (3G 모바일 환경 기준)"

### §6.6 Component Diagram 인용 (Client Components)

```
Client["🖥️ Client Components — Tailwind CSS + shadcn/ui (C-TEC-004)"]
```

### 선행 태스크 산출물

| 선행 Task ID | 제공 산출물 | 본 태스크에서의 사용처 |
|---|---|---|
| INFRA-001 ✅ | Next.js 프로젝트 + `--tailwind` 옵션으로 Tailwind 기본 설치 | Tailwind 기본 설정 위에 디자인 토큰 확장 |

### Unblock 표 (배치 7 신규)

| 본 ISSUE 완성 시 Unblock되는 후속 ISSUE | 효과 |
|---|---|
| UI-001 (소셜 로그인 UI) | `@/components/ui/button` import 가능 |
| UI-002 (주소 입력 UI) | `@/components/ui/input`, `@/components/ui/label` import 가능 |
| UI-003 (진단 결과 지도 UI) | `@/components/ui/card`, `@/components/ui/toast` import 가능 |
| UI-004~014 (전체 14개) | 모든 shadcn/ui 컴포넌트 + 디자인 토큰 사용 가능 |

---

## 3. 🛠️ Task Breakdown (실행 체크리스트)

- [ ] **3.1** shadcn/ui CLI 초기화
  ```bash
  npx shadcn-ui@latest init
  ```
  - 설정 옵션:
    - Style: **New York** (모던한 디자인)
    - Base color: **Slate** (중성적 기본 컬러)
    - CSS variables: **Yes** (다크모드 호환)
    - `tailwind.config.ts` 자동 갱신 확인
    - `components.json` 생성 확인

- [ ] **3.2** 핵심 shadcn/ui 컴포넌트 6개 이상 설치
  ```bash
  npx shadcn-ui@latest add button card input label dialog toast
  npx shadcn-ui@latest add dropdown-menu separator skeleton
  ```
  - 생성 경로: `components/ui/button.tsx`, `components/ui/card.tsx` 등
  - 총 설치 컴포넌트: ≥9개 (Button, Card, Input, Label, Dialog, Toast, DropdownMenu, Separator, Skeleton)

- [ ] **3.3** Pretendard 한국어 웹폰트 설정
  ```bash
  npm install pretendard
  ```
  ```typescript
  // app/layout.tsx
  import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className="font-sans antialiased">
          {children}
        </body>
      </html>
    );
  }
  ```

- [ ] **3.4** `tailwind.config.ts`에 디자인 토큰 정의
  ```typescript
  import type { Config } from 'tailwindcss';

  const config: Config = {
    darkMode: ['class'],
    content: [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './lib/**/*.{ts,tsx}',
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
        },
        colors: {
          // shadcn/ui CSS Variables 기반 — globals.css에서 정의
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          primary: {
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--secondary))',
            foreground: 'hsl(var(--secondary-foreground))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))',
          },
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
        },
      },
    },
    plugins: [require('tailwindcss-animate')],
  };
  export default config;
  ```

- [ ] **3.5** `app/globals.css`에 CSS Variables 기반 테마 토큰 정의
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer base {
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --primary: 221.2 83.2% 53.3%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96.1%;
      --secondary-foreground: 222.2 47.4% 11.2%;
      --muted: 210 40% 96.1%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96.1%;
      --accent-foreground: 222.2 47.4% 11.2%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 221.2 83.2% 53.3%;
      --radius: 0.5rem;
    }

    .dark {
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
      --primary: 217.2 91.2% 59.8%;
      --primary-foreground: 222.2 47.4% 11.2%;
      --secondary: 217.2 32.6% 17.5%;
      --secondary-foreground: 210 40% 98%;
      --muted: 217.2 32.6% 17.5%;
      --muted-foreground: 215 20.2% 65.1%;
      --accent: 217.2 32.6% 17.5%;
      --accent-foreground: 210 40% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 210 40% 98%;
      --border: 217.2 32.6% 17.5%;
      --input: 217.2 32.6% 17.5%;
      --ring: 224.3 76.3% 48%;
    }
  }
  ```

- [ ] **3.6** `lib/utils.ts`에 shadcn/ui 유틸리티 함수 작성
  ```typescript
  // lib/utils.ts
  import { type ClassValue, clsx } from 'clsx';
  import { twMerge } from 'tailwind-merge';

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```
  ```bash
  npm install clsx tailwind-merge tailwindcss-animate
  ```

- [ ] **3.7** `components/ui/toaster.tsx` + Toast Provider 설정
  ```typescript
  // app/layout.tsx에 Toaster 추가
  import { Toaster } from '@/components/ui/toaster';

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className="font-sans antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    );
  }
  ```

- [ ] **3.8** 다크모드 토글 컴포넌트 작성 (next-themes)
  ```bash
  npm install next-themes
  ```
  ```typescript
  // components/theme-provider.tsx
  'use client';
  import { ThemeProvider as NextThemesProvider } from 'next-themes';
  import { type ThemeProviderProps } from 'next-themes/dist/types';

  export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
  }
  ```

- [ ] **3.9** `components.json` 설정 확인
  ```json
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": true,
    "tsx": true,
    "tailwind": {
      "config": "tailwind.config.ts",
      "css": "app/globals.css",
      "baseColor": "slate",
      "cssVariables": true
    },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils"
    }
  }
  ```

- [ ] **3.10** 디자인 시스템 검증 페이지 작성 — `app/design-system/page.tsx`
  ```typescript
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';

  export default function DesignSystemPage() {
    return (
      <main className="container mx-auto p-8 space-y-8">
        <h1 className="text-4xl font-bold">디자인 시스템</h1>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Button</h2>
          <div className="flex gap-4">
            <Button>기본 버튼</Button>
            <Button variant="secondary">보조 버튼</Button>
            <Button variant="destructive">삭제 버튼</Button>
            <Button variant="outline">외곽선 버튼</Button>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Card + Input</h2>
          <Card className="max-w-md">
            <CardHeader><CardTitle>주소 입력</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="addr1">직장 주소 A</Label><Input id="addr1" placeholder="주소를 입력하세요" /></div>
              <div><Label htmlFor="addr2">직장 주소 B</Label><Input id="addr2" placeholder="주소를 입력하세요" /></div>
              <Button className="w-full">진단 시작</Button>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }
  ```

- [ ] **3.11** Pretendard 폰트 로드 검증
  ```typescript
  // __tests__/ui/font-load.spec.ts (Playwright)
  import { test, expect } from '@playwright/test';

  test('Pretendard 폰트가 로드된다', async ({ page }) => {
    await page.goto('/design-system');
    const fontFamily = await page.evaluate(() =>
      window.getComputedStyle(document.body).fontFamily
    );
    expect(fontFamily).toContain('Pretendard');
  });
  ```

- [ ] **3.12** 빌드 검증 및 타입 검증
  ```bash
  npx tsc --noEmit  # TypeScript 에러 0건
  npm run build     # 빌드 성공
  npm run dev       # /design-system 페이지 정상 렌더링
  ```

---

## 4. ✅ Acceptance Criteria (GWT 패턴, BDD)

**AC-1 (정상):** shadcn/ui 컴포넌트 렌더링 성공
- **Given** shadcn/ui init 완료 + Button/Card/Input/Label/Dialog/Toast 컴포넌트 설치
- **When** `/design-system` 페이지에서 각 컴포넌트 렌더링
- **Then** 모든 컴포넌트가 스타일링과 함께 정상 렌더링, React 에러 0건

**AC-2 (정상):** Pretendard 한국어 폰트 로드 확인
- **Given** `pretendard` npm 패키지 설치 + `app/layout.tsx`에서 import
- **When** 페이지 로드 후 `getComputedStyle(body).fontFamily` 확인
- **Then** `fontFamily`에 `Pretendard` 포함

**AC-3 (경계):** 다크모드 토글 동작
- **Given** `next-themes` ThemeProvider가 `app/layout.tsx`에 적용
- **When** `html` 태그에 `class="dark"` 추가/제거
- **Then** CSS Variables가 다크모드 값으로 전환, 모든 컴포넌트 색상 변경

**AC-4 (예외):** 미설치 컴포넌트 import 시 빌드 에러
- **Given** 설치하지 않은 shadcn/ui 컴포넌트 (예: `Accordion`)
- **When** `import { Accordion } from '@/components/ui/accordion'` 시도
- **Then** `Module not found` 빌드 에러 발생 (명확한 에러 메시지)

**AC-5 (정합성):** UI-001~014가 import 가능한 경로 확립
- **Given** `components/ui/button.tsx`, `components/ui/card.tsx` 등 존재
- **When** `import { Button } from '@/components/ui/button'` 수행
- **Then** import 성공, TypeScript 타입 추론 정상

**AC-6 (a11y):** Radix UI 기반 접근성 자동 충족
- **Given** shadcn/ui 컴포넌트 (Dialog, DropdownMenu 등)
- **When** 키보드 네비게이션 (Tab, Enter, Escape) 수행
- **Then** focus 관리, aria-* 속성이 자동 적용, WCAG 2.1 AA 기본 충족

---

## 5. ⚙️ Non-Functional Constraints (NFR 강제 인용)

| NFR ID | SRS 본문 인용 | 본 태스크에서의 검증 방법 |
|---|---|---|
| CON-12 | "UI/스타일링은 Tailwind CSS + shadcn/ui를 사용하여 일관된 디자인 시스템을 강제한다." (§1.2.3) | shadcn/ui init + 컴포넌트 ≥9개 설치. CSS Variables 기반 테마 토큰으로 일관성 강제 |
| REQ-NF-002 | "일반 페이지 로딩 시간 — p95 ≤ 1,500ms (3G)" (§4.2.1) | Pretendard dynamic subset (가변 폰트) 사용으로 폰트 로드 시간 최소화. Tailwind CSS purge로 미사용 CSS 제거 |
| (a11y) | shadcn/ui는 Radix UI 기반 — WCAG 2.1 AA 자동 충족 | Dialog/DropdownMenu 등에서 키보드 네비게이션, aria-* 자동 적용. Playwright 키보드 테스트로 검증 |

---

## 6. 📦 Deliverables (산출물 명시)

- `components.json` (shadcn/ui 설정)
- `components/ui/button.tsx` (+ 8개 이상 컴포넌트)
- `components/theme-provider.tsx` (다크모드 Provider)
- `tailwind.config.ts` (디자인 토큰 확장)
- `app/globals.css` (CSS Variables 라이트/다크 토큰)
- `lib/utils.ts` (cn 유틸리티)
- `app/layout.tsx` 수정 (Pretendard + Toaster + ThemeProvider)
- `app/design-system/page.tsx` (검증 페이지)
- `__tests__/ui/font-load.spec.ts` (Playwright 폰트 테스트)

---

## 7. 🔗 Dependencies (의존성 — 양방향)

### 선행:
- **INFRA-001 ✅:** Next.js 프로젝트 + `--tailwind` 기본 Tailwind CSS 설치

### 후행 (본 ISSUE 완성 시 unblock — 14개):
- **UI-001~UI-014:** 모든 프론트엔드 UI 컴포넌트가 `@/components/ui/*` 경로의 shadcn/ui 컴포넌트를 import하여 개발 가능

---

## 8. 🧪 Test Plan (검증 절차)

- **Playwright:** `__tests__/ui/font-load.spec.ts` — Pretendard 폰트 로드 검증
- **시각 검증:** `/design-system` 페이지에서 9개 컴포넌트 렌더링 확인
- **다크모드:** `html.dark` 클래스 토글 시 CSS Variables 전환 확인
- **빌드 검증:** `npm run build` — 에러 0건
- **타입 검증:** `npx tsc --noEmit` — 에러 0건
- **a11y 검증:** Dialog, DropdownMenu에서 키보드 네비게이션 (Tab/Enter/Escape) 동작

---

## 9. 🚧 Open Questions / Risks (보류 사항)

1. **디자인 시스템 컬러 토큰 확정:** 현재 shadcn/ui 기본 Slate 팔레트 사용. 브랜드 컬러가 확정되면 `globals.css`의 `--primary` 등 CSS Variables 값 갱신 필요 — UI 디자이너 협업 후 결정.
2. **Tailwind CSS v3 vs v4:** INFRA-001의 `create-next-app --tailwind`가 설치하는 버전에 따라 설정 파일 구조 차이. v4일 경우 `@config` 지시어 사용으로 변경 필요.
3. **Pretendard 폰트 라이선스:** Pretendard는 SIL Open Font License 1.1 — 상업적 사용 가능.
4. **shadcn/ui 추가 컴포넌트:** UI-001~014 개발 진행 시 필요에 따라 `npx shadcn-ui@latest add [component]`로 추가 가능. 본 ISSUE에서는 핵심 9개만 설치.
