/**
 * Scale USDA per-100g nutrient rows using estimated grams for one ingredient line.
 * Portion matching is heuristic (MVP) — uses fdc_food_portions text fields + gram_weight.
 */

export type FdcPortionRow = {
  amount: number | null;
  gram_weight: number | null;
  measure_unit: string | null;
  portion_description: string | null;
  modifier: string | null;
};

export type FdcNutrientRow = {
  nutrient_id: number;
  amount: number;
  fdc_nutrients: { name: string; unit_name: string; rank?: number | null } | null;
};

export type IngredientNutritionJson = {
  grams_estimate: number;
  estimation_note: string | null;
  nutrients: Array<{
    nutrient_id: number;
    name: string;
    unit_name: string;
    rank: number | null;
    amount: number;
  }>;
};

export function estimateGramsFromPortions(
  portions: FdcPortionRow[],
  quantity: number | null,
  unit: string | null,
): { grams: number; note: string | null } {
  if (quantity == null || quantity <= 0 || !unit?.trim()) {
    return {
      grams: 100,
      note: "No quantity/unit — showing nutrients per 100 g (FDC default).",
    };
  }

  const q = quantity;
  const u = unit.trim().toLowerCase();

  const scoreRow = (p: FdcPortionRow): number => {
    const parts = [p.measure_unit, p.modifier, p.portion_description]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());
    let best = 0;
    for (const part of parts) {
      if (part === u) {
        best = Math.max(best, 100);
      } else if (part.includes(u) || u.includes(part)) {
        best = Math.max(best, 50);
      } else if (u.length >= 3 && part.includes(u.slice(0, Math.min(u.length, 8)))) {
        best = Math.max(best, 25);
      }
    }
    return best;
  };

  let best: { p: FdcPortionRow; score: number } | null = null;
  for (const p of portions) {
    const gw = p.gram_weight;
    if (gw == null || Number(gw) <= 0) {
      continue;
    }
    const score = scoreRow(p);
    if (score > 0 && (!best || score > best.score)) {
      best = { p, score };
    }
  }

  if (best) {
    const p = best.p;
    const amt = p.amount != null && Number(p.amount) > 0 ? Number(p.amount) : 1;
    const gw = Number(p.gram_weight);
    const grams = q * (gw / amt);
    return {
      grams,
      note:
        best.score >= 100
          ? null
          : "Matched a USDA portion heuristically; verify against the food label if needed.",
    };
  }

  return {
    grams: 100,
    note: "No matching portion row — using per 100 g. Add a clearer unit (e.g. cup, tbsp) or check USDA portions for this food.",
  };
}

export function buildIngredientNutrition(
  nutrientRows: FdcNutrientRow[],
  grams: number,
): IngredientNutritionJson["nutrients"] {
  const factor = grams / 100;
  return nutrientRows.map((row) => ({
    nutrient_id: row.nutrient_id,
    name: row.fdc_nutrients?.name ?? `Nutrient ${row.nutrient_id}`,
    unit_name: row.fdc_nutrients?.unit_name ?? "",
    rank: row.fdc_nutrients?.rank ?? null,
    amount: Number(row.amount) * factor,
  }));
}

export function sumRecipeNutrients(
  perIngredient: IngredientNutritionJson[],
): Array<{ nutrient_id: number; name: string; unit_name: string; rank: number | null; amount: number }> {
  const map = new Map<
    number,
    { nutrient_id: number; name: string; unit_name: string; rank: number | null; amount: number }
  >();
  for (const ing of perIngredient) {
    for (const n of ing.nutrients) {
      const prev = map.get(n.nutrient_id);
      if (prev) {
        prev.amount += n.amount;
        if (prev.rank == null && n.rank != null) {
          prev.rank = n.rank;
        }
      } else {
        map.set(n.nutrient_id, { ...n });
      }
    }
  }
  return [...map.values()].sort((a, b) => {
    const ar = a.rank ?? Number.POSITIVE_INFINITY;
    const br = b.rank ?? Number.POSITIVE_INFINITY;
    if (ar !== br) {
      return ar - br;
    }
    return a.name.localeCompare(b.name);
  });
}
