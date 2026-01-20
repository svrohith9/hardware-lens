import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        ink: "#0c0d10",
        paper: "#f7f4ef",
        ember: "#ef3d36",
        moss: "#1b7f5b",
        fog: "#c6c3bf"
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        "glow-red": "0 0 30px rgba(239, 61, 54, 0.45)",
        "soft": "0 12px 30px rgba(12, 13, 16, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
