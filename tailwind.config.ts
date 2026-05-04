// halkgunu-web/tailwind.config.ts
// C · Bazaar palette — replace existing config wholesale.

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#c1272d",
          dark: "#a01e23",
          soft: "#fff1f0",
        },
        accent: {
          DEFAULT: "#eab308",
          dark: "#ca8a04",
          soft: "#fef3c7",
        },
        ink: {
          900: "#1c1410",
          700: "#3a2a20",
          500: "#78635a",
          300: "#d6c8bd",
        },
        paper: {
          bg: "#fef9ed",
          surface: "#ffffff",
          border: "#ecdfd0",
        },
        success: {
          DEFAULT: "#15803d",
          soft: "#dcfce7",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "18px",
        sheet: "28px",
      },
      boxShadow: {
        card: "0 2px 0 rgba(28,20,16,0.08), 0 6px 14px rgba(28,20,16,0.08)",
        sheet: "0 -8px 24px rgba(28,20,16,0.12)",
      },
      transitionTimingFunction: {
        bazaar: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        slideUp: "slideUp 280ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        fadeIn: "fadeIn 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
