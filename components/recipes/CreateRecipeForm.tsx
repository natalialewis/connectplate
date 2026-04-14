"use client";

import { saveRecipeAction } from "@/app/recipes/actions";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type FdcFoodRow = {
  fdc_id: number | string;
  data_type: string;
  description: string;
};

type FdcPortionRow = {
  amount: number | null;
  gram_weight: number | null;
  measure_unit: string | null;
  portion_description: string | null;
  modifier: string | null;
};

type DraftIngredient = {
  ingredientPhrase: string;
  rawLine: string;
  quantity: number | null;
  unit: string | null;
  usdaFdcId: number;
  usdaFoodDescription: string;
};

function buildPortionUnitOptions(rows: FdcPortionRow[]): { value: string; label: string }[] {
  const cleanPart = (v: string | null | undefined): string => {
    if (!v) {
      return "";
    }
    return v
      .replace(/\bundetermined\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const byKey = new Map<string, string>();
  for (const p of rows) {
    const gw = p.gram_weight;
    if (gw == null || Number(gw) <= 0) {
      continue;
    }
    const portionDescription = cleanPart(p.portion_description);
    const modifier = cleanPart(p.modifier);
    const measureUnit = cleanPart(p.measure_unit);

    const value = portionDescription || modifier || measureUnit || "";
    if (!value) {
      continue;
    }
    const key = value.toLowerCase();
    const amt = p.amount != null && Number(p.amount) > 0 ? Number(p.amount) : 1;
    const labelParts = [
      amt !== 1 ? `${amt} ` : "",
      portionDescription,
      modifier,
      measureUnit,
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const label = labelParts || value;
    const prev = byKey.get(key);
    if (!prev || label.length > prev.length) {
      byKey.set(key, label);
    }
  }
  return [...byKey.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function CreateRecipeForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [servings, setServings] = useState<string>("4");
  const [prepM, setPrepM] = useState<string>("");
  const [cookM, setCookM] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);

  const [steps, setSteps] = useState<string[]>([]);
  const [stepDraft, setStepDraft] = useState("");

  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);

  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<FdcFoodRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<FdcFoodRow | null>(null);
  const [portionRows, setPortionRows] = useState<FdcPortionRow[]>([]);
  const [portionsLoading, setPortionsLoading] = useState(false);
  const [ingQty, setIngQty] = useState<string>("1");
  const [ingUnit, setIngUnit] = useState<string>("");
  const [ingUnitCustom, setIngUnitCustom] = useState("");
  const [ingDisplayName, setIngDisplayName] = useState("");

  const portionOptions = useMemo(() => buildPortionUnitOptions(portionRows), [portionRows]);
  const usePortionSelect = portionOptions.length > 0;

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      void Promise.resolve().then(() => {
        setHits([]);
        setSearching(false);
      });
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        const supabase = createSupabaseClient();
        if (!cancelled) {
          setSearching(true);
        }
        const { data, error: rpcErr } = await supabase.rpc("search_fdc_foods", {
          search_term: q,
          max_results: 5,
        });
        if (cancelled) {
          return;
        }
        setSearching(false);
        if (rpcErr) {
          setHits([]);
          return;
        }
        setHits((data as FdcFoodRow[]) ?? []);
      })();
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [search]);

  useEffect(() => {
    if (!picked) {
      setPortionRows([]);
      setPortionsLoading(false);
      return;
    }

    const fdcNum = typeof picked.fdc_id === "string" ? Number(picked.fdc_id) : picked.fdc_id;
    if (!Number.isFinite(fdcNum)) {
      setPortionRows([]);
      return;
    }

    let cancelled = false;
    setPortionsLoading(true);
    void (async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from("fdc_food_portions")
        .select("amount, gram_weight, measure_unit, portion_description, modifier")
        .eq("fdc_id", fdcNum);
      if (cancelled) {
        return;
      }
      setPortionRows((data as FdcPortionRow[]) ?? []);
      setPortionsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [picked]);

  useEffect(() => {
    if (!picked) {
      setIngUnit("");
      setIngUnitCustom("");
      return;
    }
    if (portionOptions.length > 0) {
      setIngUnit((u) => (u && portionOptions.some((o) => o.value === u) ? u : portionOptions[0].value));
      setIngUnitCustom("");
    } else {
      setIngUnit("");
    }
  }, [picked, portionOptions]);

  const addStep = useCallback(() => {
    const b = stepDraft.trim();
    if (!b) {
      return;
    }
    setSteps((s) => [...s, b]);
    setStepDraft("");
  }, [stepDraft]);

  const removeStep = useCallback((i: number) => {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }, []);

  const pickFood = useCallback((row: FdcFoodRow) => {
    setPicked(row);
    setSearch("");
    setHits([]);
  }, []);

  const clearFoodSelection = useCallback(() => {
    setPicked(null);
    setPortionRows([]);
    setHits([]);
    setIngQty("1");
    setIngUnit("");
    setIngUnitCustom("");
  }, []);

  const addIngredient = useCallback(() => {
    const display = ingDisplayName.trim();
    if (!picked || !display) {
      return;
    }
    const unitResolved = usePortionSelect
      ? ingUnit.trim()
      : ingUnitCustom.trim() || ingUnit.trim();
    const qtyParsed = ingQty.trim() === "" ? null : Number.parseFloat(ingQty);
    const quantity =
      qtyParsed != null && !Number.isNaN(qtyParsed) && qtyParsed > 0 ? qtyParsed : null;
    const unit = unitResolved === "" ? null : unitResolved;
    const parts: string[] = [];
    if (quantity != null) {
      parts.push(String(quantity));
    }
    if (unit) {
      parts.push(unit);
    }
    parts.push(display);
    const rawLine = parts.join(" ");

    const fdcNum = typeof picked.fdc_id === "string" ? Number(picked.fdc_id) : picked.fdc_id;
    if (!Number.isFinite(fdcNum)) {
      return;
    }
    setIngredients((list) => [
      ...list,
      {
        ingredientPhrase: display,
        rawLine,
        quantity,
        unit,
        usdaFdcId: fdcNum,
        usdaFoodDescription: picked.description,
      },
    ]);
    setIngDisplayName("");
    clearFoodSelection();
    setSearch("");
  }, [
    picked,
    ingDisplayName,
    ingQty,
    ingUnit,
    ingUnitCustom,
    usePortionSelect,
    clearFoodSelection,
  ]);

  const removeIngredient = useCallback((i: number) => {
    setIngredients((list) => list.filter((_, idx) => idx !== i));
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const servParsed = servings.trim() === "" ? null : Number.parseFloat(servings);
      const prepParsed = prepM.trim() === "" ? null : Number.parseInt(prepM, 10);
      const cookParsed = cookM.trim() === "" ? null : Number.parseInt(cookM, 10);
      const result = await saveRecipeAction({
        title,
        description: description.trim() || null,
        notes: notes.trim() || null,
        servings: servParsed != null && !Number.isNaN(servParsed) ? servParsed : null,
        prepTimeMinutes: prepParsed != null && !Number.isNaN(prepParsed) ? prepParsed : null,
        cookTimeMinutes: cookParsed != null && !Number.isNaN(cookParsed) ? cookParsed : null,
        isPublic,
        steps,
        ingredients,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/recipes/${result.recipeId}`);
    });
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const searchInputClass =
    "mt-1 w-full rounded-full border border-dashed border-primary/40 bg-muted/40 px-4 py-2.5 pl-10 text-sm text-foreground shadow-inner placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const canAddIngredient = Boolean(picked && ingDisplayName.trim());

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Title *
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Weeknight lentil soup"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Description
          <textarea
            className={`${inputClass} min-h-[80px]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Cream-based soup originally made by my Grandma Smith."
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Notes
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Pre-soaking the lentils can speed up the cook time."
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium text-foreground">
            Servings
            <input
              className={inputClass}
              type="number"
              min={1}
              step={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-foreground">
            Prep (min)
            <input
              className={inputClass}
              type="number"
              min={0}
              value={prepM}
              onChange={(e) => setPrepM(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-foreground">
            Cook (min)
            <input
              className={inputClass}
              type="number"
              min={0}
              value={cookM}
              onChange={(e) => setCookM(e.target.value)}
            />
          </label>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
          />
          Public recipe
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Ingredients</h2>
        <p className="text-sm text-muted-foreground">Add one ingredient at a time.</p>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Ingredient name
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                (as you want it to appear on your recipe)
              </span>
              <input
                className={inputClass}
                value={ingDisplayName}
                onChange={(e) => setIngDisplayName(e.target.value)}
                required={false}
                placeholder="e.g. Yukon gold potatoes"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Search ingredients
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                (more scientific; used for nutrition calculation)
              </span>
            </label>
            <div className="relative mt-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
              </svg>
              <input
                className={searchInputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type at least 2 characters…"
                autoComplete="off"
                disabled={Boolean(picked)}
                aria-label="Search USDA foods for nutrition"
              />
            </div>
            {!picked && searching ? (
              <p className="mt-2 text-xs text-muted-foreground">Searching…</p>
            ) : null}
            {!picked && !searching && hits.length > 0 ? (
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background">
                {hits.map((h) => (
                  <li key={String(h.fdc_id)}>
                    <button
                      type="button"
                      onClick={() => pickFood(h)}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/60"
                    >
                      <span className="text-foreground">{h.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {picked ? (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm text-foreground">
                Selected: <span className="font-medium">{picked.description}</span>
              </p>
              {portionsLoading ? (
                <p className="text-xs text-muted-foreground">Loading measures…</p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-foreground">
                  Quantity
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    step={1}
                    value={ingQty}
                    onChange={(e) => setIngQty(e.target.value)}
                    placeholder="e.g. 2"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Unit
                  {usePortionSelect ? (
                    <select
                      className={`${inputClass} appearance-none pr-10`}
                      value={ingUnit}
                      onChange={(e) => setIngUnit(e.target.value)}
                    >
                      {portionOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={inputClass}
                      value={ingUnitCustom}
                      onChange={(e) => setIngUnitCustom(e.target.value)}
                      placeholder="e.g. cup, tbsp, g"
                    />
                  )}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addIngredient}
                  disabled={!canAddIngredient}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  Add ingredient
                </button>
                <button
                  type="button"
                  onClick={clearFoodSelection}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/50"
                >
                  Clear selection
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {ingredients.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
            {ingredients.map((ing, i) => (
              <li key={`${ing.usdaFdcId}-${i}`} className="pl-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>{ing.rawLine}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No ingredients yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
        <p className="text-sm text-muted-foreground">Add one step at a time.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 text-sm font-medium text-foreground">
            <span className="sr-only">Instruction step</span>
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={stepDraft}
              onChange={(e) => setStepDraft(e.target.value)}
              placeholder="Describe one step…"
              aria-label="Instruction step"
            />
          </label>
          <button
            type="button"
            onClick={addStep}
            className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
          >
            Add step
          </button>
        </div>
        {steps.length > 0 ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
            {steps.map((s, i) => (
              <li key={i} className="pl-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="min-w-0 flex-1">{s}</span>
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="shrink-0 text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No steps yet.</p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#4a1d5c] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#3c1849] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Recipe"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-5 py-2.5 text-sm text-foreground hover:bg-muted/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
