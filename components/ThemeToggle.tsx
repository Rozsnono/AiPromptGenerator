"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { LOCAL_STORAGE_KEYS } from "../app/constants";

type Theme = "light" | "dark";

/**
 * Világos/sötét téma váltó. A kezdő témát az `app/layout.tsx` inline scriptje állítja be
 * (mentett érték vagy rendszerbeállítás); itt csak olvassuk és váltjuk a `data-theme` attribútumot.
 */
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, next);
    } catch (err) {
      console.warn("A téma mentése nem sikerült:", err);
    }
  };

  const label = theme === "dark" ? "Váltás világos témára" : "Váltás sötét témára";
  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-sky-400 hover:border-zinc-700 transition-colors"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
