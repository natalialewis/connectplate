"use client";

import { useClientTheme } from "@/lib/hooks/useClientTheme";

/**
 * Pill switch for light/dark — same behavior as {@link ThemeToggle} (shared `useClientTheme`).
 */
export function ThemeSwitch() {
  const { theme, toggleTheme } = useClientTheme();

  if (theme === null) {
    return <div className="h-8 w-14 shrink-0 animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Dark mode on, switch to light mode" : "Light mode on, switch to dark mode"}
      onClick={toggleTheme}
      className={`flex h-8 w-14 shrink-0 items-center rounded-full border border-charcoal-muted px-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isDark ? "justify-end bg-primary" : "justify-start bg-muted"
      }`}
    >
      <span className="pointer-events-none block h-6 w-6 rounded-full bg-card shadow-sm ring-1 ring-charcoal/15" />
    </button>
  );
}
