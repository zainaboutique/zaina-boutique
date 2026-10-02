import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F8F9FA",
        card: "#FFFFFF",
        ink: "var(--brand-ink, #111111)",
        accent: "var(--brand-accent, #EF4444)",
      },
      fontFamily: {
        sans: ["var(--brand-font, var(--font-inter))", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        dock: "0 8px 24px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
