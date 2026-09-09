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
        "neon-cyan": "0 0 15px -2px rgba(34, 211, 238, 0.4), 0 0 6px -2px rgba(34, 211, 238, 0.2)",
        "neon-fuchsia": "0 0 15px -2px rgba(217, 70, 239, 0.4), 0 0 6px -2px rgba(217, 70, 239, 0.2)",
        "neon-glow": "0 0 25px -3px rgba(34, 211, 238, 0.25), 0 0 10px -2px rgba(217, 70, 239, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
