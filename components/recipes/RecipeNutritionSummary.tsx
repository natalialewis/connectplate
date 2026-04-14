"use client";

import { useMemo, useState } from "react";

type TotalNutrient = {
  nutrient_id: number;
  name: string;
  unit_name: string;
  rank?: number | null;
  amount: number;
};

type NutritionTotal = {
  nutrients?: TotalNutrient[];
  computed_at?: string;
};

function asNutritionTotal(raw: unknown): NutritionTotal | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const nutrients = o.nutrients;
  if (!Array.isArray(nutrients)) {
    return { nutrients: [], computed_at: typeof o.computed_at === "string" ? o.computed_at : undefined };
  }
  return {
    nutrients: nutrients as TotalNutrient[],
    computed_at: typeof o.computed_at === "string" ? o.computed_at : undefined,
  };
}

function formatNum(n: number): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  const a = Math.abs(n);
  if (a >= 1000) {
    return n.toFixed(0);
  }
  if (a >= 10) {
    return n.toFixed(1);
  }
  return n.toFixed(2);
}

function priorityName(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("energy") || n.includes("calorie")) {
    return 0;
  }
  if (n === "protein") {
    return 1;
  }
  if (n.includes("carbohydrate")) {
    return 2;
  }
  if (n.includes("total lipid") || n === "fat") {
    return 3;
  }
  if (n.includes("fiber")) {
    return 4;
  }
  if (n.includes("sodium")) {
    return 5;
  }
  return 100;
}

export function RecipeNutritionSummary({ total }: { total: unknown }) {
  const [showAll, setShowAll] = useState(false);
  const parsed = asNutritionTotal(total);
  const nutrients = parsed?.nutrients;
  if (!nutrients?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No recipe-level nutrition total was stored (check ingredient FDC links and data load).
      </p>
    );
  }

  const sorted = useMemo(
    () =>
      [...nutrients].sort((a, b) => {
        const ar = a.rank ?? Number.POSITIVE_INFINITY;
        const br = b.rank ?? Number.POSITIVE_INFINITY;
        if (ar !== br) {
          return ar - br;
        }
        const pa = priorityName(a.name);
        const pb = priorityName(b.name);
        if (pa !== pb) {
          return pa - pb;
        }
        return a.name.localeCompare(b.name);
      }),
    [nutrients],
  );

  const defaultVisibleCount = 24;
  const display = showAll ? sorted : sorted.slice(0, defaultVisibleCount);
  const hasMore = sorted.length > defaultVisibleCount;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Nutrition (whole recipe)</h2>
      {parsed?.computed_at ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Computed {new Date(parsed.computed_at).toLocaleString()}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Sum of ingredient lines using USDA per-100 g data and portion heuristics — for testing only.
      </p>
      <ul className="mt-3 divide-y divide-border text-sm">
        {display.map((n) => (
          <li key={n.nutrient_id} className="flex justify-between gap-3 py-2">
            <span className="text-foreground">{n.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatNum(n.amount)} {n.unit_name}
            </span>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          {showAll
            ? "Show fewer nutrients"
            : `See all nutrients (${sorted.length - defaultVisibleCount} more)`}
        </button>
      ) : null}
    </div>
  );
}
