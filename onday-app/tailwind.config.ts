import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },
    extend: {
      // ───────── Colors ─────────
      colors: {
        bg: "hsl(var(--bg))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          soft: "hsl(var(--surface-soft))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          2: "hsl(var(--ink-2))",
          3: "hsl(var(--ink-3))",
        },
        line: {
          DEFAULT: "hsl(var(--line))",
          2: "hsl(var(--line-2))",
        },
        "card-border": "hsl(var(--card-border))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          soft: "hsl(var(--primary-soft))",
          pastel: "hsl(var(--primary-pastel))",
          deep: "hsl(var(--primary-deep))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          soft: "hsl(var(--success-soft))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          soft: "hsl(var(--info-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          soft: "hsl(var(--warning-soft))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          soft: "hsl(var(--danger-soft))",
        },
        safety: {
          a: "hsl(var(--safety-a))",
          b: "hsl(var(--safety-b))",
          c: "hsl(var(--safety-c))",
          d: "hsl(var(--safety-d))",
        },
        oauth: {
          kakao: "#FEE500",
          "kakao-ink": "#191600",
          naver: "#03C75A",
          "naver-ink": "#FFFFFF",
        },
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--ink))",
        border: "hsl(var(--card-border))",
        input: "hsl(var(--card-border))",
        ring: "hsl(var(--primary))",
        muted: {
          DEFAULT: "hsl(var(--surface-soft))",
          foreground: "hsl(var(--ink-3))",
        },
        accent: {
          DEFAULT: "hsl(var(--primary-soft))",
          foreground: "hsl(var(--primary))",
        },
        destructive: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--ink))",
        },
        popover: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--ink))",
        },
      },

      // ───────── Typography ─────────
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-1": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-2": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        h1: ["28px", { lineHeight: "36px", letterSpacing: "-0.015em", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        h3: ["20px", { lineHeight: "28px", letterSpacing: "-0.005em", fontWeight: "600" }],
        h4: ["18px", { lineHeight: "26px", fontWeight: "600" }],
        title: ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px" }],
        body: ["14px", { lineHeight: "22px" }],
        "body-sm": ["13px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "18px" }],
        "caption-xs": ["11px", { lineHeight: "16px", letterSpacing: "0.02em" }],
        tabular: ["14px", { lineHeight: "20px" }],
        "mono-sm": ["12px", { lineHeight: "18px" }],
      },

      // ───────── Spacing ─────────
      spacing: {
        "s-1": "4px",
        "s-2": "8px",
        "s-3": "12px",
        "s-4": "16px",
        "s-5": "20px",
        "s-6": "24px",
        "s-7": "32px",
        "s-8": "40px",
        "s-9": "48px",
        "s-10": "64px",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },

      // ───────── Radii ─────────
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
        chip: "9999px",
        phone: "44px",
      },

      // ───────── Shadows ─────────
      boxShadow: {
        card: "0 1px 2px rgba(11, 18, 32, 0.04), 0 1px 3px rgba(11, 18, 32, 0.06)",
        "card-hover": "0 2px 6px rgba(11, 18, 32, 0.06), 0 8px 24px rgba(11, 18, 32, 0.08)",
        sheet: "0 -8px 24px rgba(11, 18, 32, 0.10)",
        floating: "0 8px 24px rgba(11, 18, 32, 0.12)",
        "focus-ring": "0 0 0 2px hsl(var(--primary) / 0.4)",
        marker: "0 2px 8px rgba(37, 99, 235, 0.32)",
        "marker-hover": "0 4px 12px rgba(37, 99, 235, 0.45)",
        elevated: "0 12px 32px rgba(11, 18, 32, 0.14)",
      },

      // ───────── Animation ─────────
      transitionTimingFunction: {
        sheet: "cubic-bezier(0.32, 0.72, 0, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "120": "120ms",
        "180": "180ms",
        "220": "220ms",
        "280": "280ms",
        "380": "380ms",
      },
      keyframes: {
        "sheet-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "sheet-down": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "modal-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "safety-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-target, 100%)" },
        },
      },
      animation: {
        "sheet-up": "sheet-up 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        "sheet-down": "sheet-down 240ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 220ms ease-out",
        "modal-in": "modal-in 200ms ease-out",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        "safety-fill": "safety-fill 380ms ease-out forwards",
      },

      // ───────── Data attributes (Base UI / shadcn base-nova) ─────────
      // Base UI는 상태를 짧은 data-* 속성으로 노출 (data-active, data-orientation 등)
      // Tailwind v3 단축 modifier (`data-active:` 등) 가 인식되도록 등록
      data: {
        active: "active",
        selected: "selected",
        disabled: "disabled",
        open: "open",
        closed: "closed",
        hidden: "hidden",
        pressed: "pressed",
        "starting-style": "starting-style",
        "ending-style": "ending-style",
        horizontal: 'orientation="horizontal"',
        vertical: 'orientation="vertical"',
      },

      // ───────── Z-index ─────────
      zIndex: {
        nav: "40",
        sticky: "50",
        "sheet-backdrop": "90",
        sheet: "100",
        modal: "110",
        toast: "120",
        tooltip: "130",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
