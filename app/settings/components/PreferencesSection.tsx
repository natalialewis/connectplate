"use client";

import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { useClientTheme } from "@/lib/hooks/useClientTheme";

export function PreferencesSection() {
  const { theme } = useClientTheme();

  const appearanceLabel =
    theme === null ? "…" : theme === "dark" ? "Dark mode" : "Light mode";

  return (
    <section className="mt-8 border-t border-border pt-8 sm:mt-10 sm:pt-10" aria-labelledby="preferences-heading">
      <h2 id="preferences-heading" className="text-lg font-semibold text-foreground sm:text-xl">
        Preferences
      </h2>

      <div className="mt-4 sm:mt-5">
        <span className="block text-sm font-medium text-foreground md:text-base">Appearance</span>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Switch between light and dark theme.</p>
        <div className="mt-3 flex items-center gap-3 sm:gap-4">
          <ThemeSwitch />
          <span className="text-sm text-muted-foreground">{appearanceLabel}</span>
        </div>
      </div>
    </section>
  );
}
