import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wolfie: {
          background: "#080A0F",
          surface: "#10141C",
          surfaceElevated: "#151B26",
          textPrimary: "#F4F7FA",
          textSecondary: "#9BA6B2",
          muted: "#5F6B7A",
          accent: "#6EE7F9",
          accent2: "#A78BFA",
          warning: "#FBBF24",
          profit: "#38D996",
          loss: "#FF5C7A",
          unknown: "#8B95A1"
        }
      },
      fontFamily: {
        display: ["Space Grotesk", "Satoshi", "Inter", "sans-serif"],
        sans: ["Geist", "Satoshi", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;

