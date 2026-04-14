"use client";

import type { IngredientNutritionJson } from "@/lib/recipes/nutrition";
import { useEffect, useRef, useState } from "react";

type Props = {
  nutrition: IngredientNutritionJson | null;
};

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

export function IngredientNutritionToggle({ nutrition }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  if (!nutrition?.nutrients?.length) {
    return null;
  }

  const top = [...nutrition.nutrients]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 12);

  return (
    <div ref={wrapperRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-xs font-semibold text-primary hover:bg-muted"
        aria-expanded={open}
        aria-label="Show nutrition for this ingredient"
        title="Nutrition for this ingredient"
      >
        i
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 max-h-64 min-w-[260px] max-w-[min(100vw-2rem,320px)] overflow-auto rounded-lg border border-border bg-card p-3 text-left text-xs shadow-lg">
          {nutrition.estimation_note ? (
            <p className="mb-2 text-muted-foreground">{nutrition.estimation_note}</p>
          ) : null}
          <p className="mb-1 font-medium text-foreground">
            ~{formatNum(nutrition.grams_estimate)} g estimated · top nutrients
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {top.map((n) => (
              <li key={n.nutrient_id} className="flex justify-between gap-2">
                <span className="truncate text-foreground">{n.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatNum(n.amount)} {n.unit_name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
