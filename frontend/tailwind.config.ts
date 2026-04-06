import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#2563EB",
        "primary-hover": "#1D4ED8",
        "primary-light": "#E0E8FF",
        surface: "#F8FAFC",
        "surface-bright": "#FFFFFF",
        "surface-container": "#F1F5F9",
        "on-surface": "#0F172A",
        "on-surface-variant": "#64748B",
        outline: "#CBD5E1",
        "outline-variant": "#E2E8F0",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      fontFamily: {
        headline: ["Space Grotesk", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        "card-hover": "0 4px 12px rgba(15,23,42,0.08)",
        "btn-primary": "0 4px 14px -2px rgba(37,99,235,0.25)",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
