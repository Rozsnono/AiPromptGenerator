import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      boxShadow: {
        "subtle-card": "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)",
        "subtle-glow": "0 0 20px -5px rgba(56, 189, 248, 0.15)",
        "subtle-accent": "0 0 25px -5px rgba(168, 85, 247, 0.12)",
        "neon-cyan": "0 0 15px -2px rgba(34, 211, 238, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
