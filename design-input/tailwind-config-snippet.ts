/**
 * Onday — Tailwind Config Snippet
 *
 * design-tokens.md의 토큰을 Tailwind v3 config로 변환한 코드입니다.
 * 그대로 `tailwind.config.ts`의 `theme.extend`에 병합하거나, 파일 전체를
 * 프로젝트 루트의 tailwind.config.ts로 복사해서 사용하세요.
 *
 * 사용 전 체크:
 * 1. `globals-css-snippet.css`를 globals.css에 import (CSS 변수 정의)
 * 2. shadcn/ui를 사용한다면 components.json의 cssVariables: true 확인
 * 3. content 경로는 프로젝트 구조에 맞게 조정
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
    extend: {
      // ───────── Colors ─────────
      colors: {
        // Surfaces
        bg: 'hsl(var(--bg))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          soft: 'hsl(var(--surface-soft))',
        },

        // Ink / Text
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          2: 'hsl(var(--ink-2))',
          3: 'hsl(var(--ink-3))',
        },

        // Lines
        line: {
          DEFAULT: 'hsl(var(--line))',
          2: 'hsl(var(--line-2))',
        },
        'card-border': 'hsl(var(--card-border))',

        // Brand
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          soft: 'hsl(var(--primary-soft))',
          deep: 'hsl(var(--primary-deep))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        // Status
        success: {
          DEFAULT: 'hsl(var(--success))',
          soft: 'hsl(var(--success-soft))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          soft: 'hsl(var(--info-soft))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          soft: 'hsl(var(--warning-soft))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          soft: 'hsl(var(--danger-soft))',
        },

        // Safety grades (안전등급 — letter+label+color 3중 표기 강제)
        safety: {
          a: 'hsl(var(--safety-a))', // 매우 안전
          b: 'hsl(var(--safety-b))', // 안전
          c: 'hsl(var(--safety-c))', // 보통
          d: 'hsl(var(--safety-d))', // 주의
        },

        // OAuth (로그인 외 사용 금지)
        oauth: {
          kakao: '#FEE500',
          'kakao-ink': '#191600',
          naver: '#03C75A',
          'naver-ink': '#FFFFFF',
        },

        // shadcn/ui 호환 별칭 (기존 컴포넌트가 사용)
        background: 'hsl(var(--bg))',
        foreground: 'hsl(var(--ink))',
        border: 'hsl(var(--card-border))',
        input: 'hsl(var(--card-border))',
        ring: 'hsl(var(--primary))',
        muted: {
          DEFAULT: 'hsl(var(--surface-soft))',
          foreground: 'hsl(var(--ink-3))',
        },
        accent: {
          DEFAULT: 'hsl(var(--primary-soft))',
          foreground: 'hsl(var(--primary))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: 'hsl(var(--surface))',
          foreground: 'hsl(var(--ink))',
        },
        popover: {
          DEFAULT: 'hsl(var(--surface))',
          foreground: 'hsl(var(--ink))',
        },
      },

      // ───────── Typography ─────────
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing }]
        'display-1': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-2': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1': ['28px', { lineHeight: '36px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3': ['20px', { lineHeight: '28px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'title': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        'body': ['14px', { lineHeight: '22px' }],
        'body-sm': ['13px', { lineHeight: '20px' }],
        'caption': ['12px', { lineHeight: '18px' }],
        'caption-xs': ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        'tabular': ['14px', { lineHeight: '20px', fontFeatureSettings: '"tnum"' }],
        'mono-sm': ['12px', { lineHeight: '18px' }],
      },

      // ───────── Spacing (custom token scale) ─────────
      // Tailwind 기본 spacing은 그대로 두고, 디자인 토큰명을 별도로 추가
      spacing: {
        's-1': '4px',
        's-2': '8px',
        's-3': '12px',
        's-4': '16px',
        's-5': '20px',
        's-6': '24px',
        's-7': '32px',
        's-8': '40px',
        's-9': '48px',
        's-10': '64px',
        // 모바일 안전영역
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },

      // ───────── Radii ─────────
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px', // --radius (카드 통일)
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        chip: '9999px',
        phone: '44px', // 폰 베젤
      },

      // ───────── Shadows ─────────
      boxShadow: {
        card: '0 1px 2px rgba(11, 18, 32, 0.04), 0 1px 3px rgba(11, 18, 32, 0.06)',
        'card-hover': '0 2px 6px rgba(11, 18, 32, 0.06), 0 8px 24px rgba(11, 18, 32, 0.08)',
        sheet: '0 -8px 24px rgba(11, 18, 32, 0.10)',
        floating: '0 8px 24px rgba(11, 18, 32, 0.12)',
        'focus-ring': '0 0 0 2px hsl(var(--primary) / 0.4)',
        marker: '0 2px 8px rgba(37, 99, 235, 0.32)',
        'marker-hover': '0 4px 12px rgba(37, 99, 235, 0.45)',
        elevated: '0 12px 32px rgba(11, 18, 32, 0.14)',
      },

      // ───────── Animation ─────────
      transitionTimingFunction: {
        sheet: 'cubic-bezier(0.32, 0.72, 0, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
        '220': '220ms',
        '280': '280ms',
        '380': '380ms',
      },
      keyframes: {
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'sheet-down': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'safety-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--bar-target, 100%)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up 280ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-down': 'sheet-down 240ms cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 220ms ease-out',
        'modal-in': 'modal-in 200ms ease-out',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
        'safety-fill': 'safety-fill 380ms ease-out forwards',
      },

      // ───────── Z-index scale ─────────
      zIndex: {
        nav: '40',
        sticky: '50',
        'sheet-backdrop': '90',
        sheet: '100',
        modal: '110',
        toast: '120',
        tooltip: '130',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // 추가 권장: @tailwindcss/forms, @tailwindcss/typography
  ],
};

export default config;
