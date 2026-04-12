"use client";

import { useCallback, useEffect, useState } from "react";

export type ClientTheme = "light" | "dark";

const THEME_EVENT = "connectplate-theme-change";

function readThemeFromDom(): ClientTheme {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyClientTheme(next: ClientTheme): void {
  localStorage.setItem("theme", next);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(next);
  window.dispatchEvent(new Event(THEME_EVENT));
}

/**
 * Client-only theme aligned with `document.documentElement` and localStorage.
 * Multiple hook instances stay in sync via THEME_EVENT.
 */
export function useClientTheme() {
  const [theme, setThemeState] = useState<ClientTheme | null>(null);

  useEffect(() => {
    function sync() {
      setThemeState(readThemeFromDom());
    }
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  const setTheme = useCallback((next: ClientTheme) => {
    applyClientTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = readThemeFromDom();
    const next = current === "dark" ? "light" : "dark";
    applyClientTheme(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme, toggleTheme };
}
