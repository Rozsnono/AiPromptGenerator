import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

/**
 * Téma-támogatás: a kódban használt színcsaládok (zinc, sky, …) árnyalatai CSS változókra
 * mutatnak. Sötét témában a Tailwind alapértékeket kapják, világos témában
 * (`<html data-theme="light">`) a skála "megfordul" (pl. zinc-950 → világos, zinc-50 → sötét),
 * így a komponenseknek nem kell külön világos osztályokat tartalmazniuk.
 */
const FAMILIES = ["zinc", "sky", "indigo", "emerald", "amber", "rose"] as const;
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
type Shade = (typeof SHADES)[number];

/** Világos témában melyik (sötét téma-beli) árnyalat értékét kapja az adott árnyalat. */
const LIGHT_SHADE_MAP: Record<"zinc" | "accent", Record<Shade, Shade>> = {
  zinc: { 50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500, 600: 400, 700: 300, 800: 200, 900: 100, 950: 50 },
  // Az akcentszíneknél a 400/500/600 a világos háttéren is olvasható / kitöltő marad.
  accent: { 50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 600, 600: 700, 700: 300, 800: 200, 900: 100, 950: 50 },
};

const hexToChannels = (hex: string): string => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
};

const palette = (family: (typeof FAMILIES)[number], shade: Shade): string =>
  hexToChannels((colors[family] as Record<string, string>)[String(shade)]);

const buildVars = (theme: "dark" | "light") => {
  const vars: Record<string, string> = {};
  for (const family of FAMILIES) {
    const map = LIGHT_SHADE_MAP[family === "zinc" ? "zinc" : "accent"];
    for (const shade of SHADES) {
      vars[`--c-${family}-${shade}`] = palette(family, theme === "dark" ? shade : map[shade]);
    }
  }
  return vars;
};

const themedColors = Object.fromEntries(
  FAMILIES.map((family) => [
    family,
    Object.fromEntries(SHADES.map((shade) => [shade, `rgb(var(--c-${family}-${shade}) / <alpha-value>)`])),
  ])
);

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
        ...themedColors,
        background: "rgb(var(--bg-rgb) / <alpha-value>)",
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
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": buildVars("dark"),
        ':root[data-theme="light"]': buildVars("light"),
      });
    }),
  ],
};
export default config;
