"use server";

import { createSupabaseClient } from "@/lib/supabase/server";
import {
  buildIngredientNutrition,
  estimateGramsFromPortions,
  sumRecipeNutrients,
  type FdcNutrientRow,
  type FdcPortionRow,
  type IngredientNutritionJson,
} from "@/lib/recipes/nutrition";
import { revalidatePath } from "next/cache";
import { capitalizeFirstLetter } from "@/lib/recipes/text";

function normalizeNutrientRows(nRows: unknown): FdcNutrientRow[] {
  if (!Array.isArray(nRows)) {
    return [];
  }
  return nRows.map((row: Record<string, unknown>) => {
    let meta = row.fdc_nutrients as
      | { name: string; unit_name: string; rank?: number | null }
      | { name: string; unit_name: string; rank?: number | null }[]
      | null
      | undefined;
    if (Array.isArray(meta)) {
      meta = meta[0] ?? null;
    }
    return {
      nutrient_id: row.nutrient_id as number,
      amount: Number(row.amount),
      fdc_nutrients: meta ?? null,
    };
  });
}

export type SaveRecipeIngredientInput = {
  ingredientPhrase: string;
  rawLine: string;
  quantity: number | null;
  unit: string | null;
  usdaFdcId: number;
  usdaFoodDescription: string;
};

export type SaveRecipeInput = {
  title: string;
  description: string | null;
  notes: string | null;
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  isPublic: boolean;
  steps: string[];
  ingredients: SaveRecipeIngredientInput[];
};

export type SaveRecipeResult =
  | { ok: true; recipeId: string }
  | { ok: false; error: string };

function normalizeIngredientForSave(ing: SaveRecipeIngredientInput): SaveRecipeIngredientInput {
  const phrase = capitalizeFirstLetter(ing.ingredientPhrase.trim());
  const desc = capitalizeFirstLetter(ing.usdaFoodDescription.trim());
  const unitRaw = ing.unit?.trim() ?? "";
  const unit = unitRaw || null;
  const parts: string[] = [];
  if (ing.quantity != null && !Number.isNaN(ing.quantity) && ing.quantity > 0) {
    parts.push(String(ing.quantity));
  }
  if (unit) {
    parts.push(unit);
  }
  if (phrase) {
    parts.push(phrase);
  }
  const rawLine = parts.join(" ");
  return {
    ...ing,
    ingredientPhrase: phrase,
    usdaFoodDescription: desc,
    unit,
    rawLine,
  };
}

export async function saveRecipeAction(input: SaveRecipeInput): Promise<SaveRecipeResult> {
  const title = capitalizeFirstLetter(input.title?.trim() ?? "");
  if (!title) {
    return { ok: false, error: "Title is required." };
  }
  if (input.servings != null && (Number.isNaN(input.servings) || input.servings <= 0)) {
    return { ok: false, error: "Servings must be a positive number if set." };
  }
  if (input.prepTimeMinutes != null && (Number.isNaN(input.prepTimeMinutes) || input.prepTimeMinutes < 0)) {
    return { ok: false, error: "Prep time must be zero or greater." };
  }
  if (input.cookTimeMinutes != null && (Number.isNaN(input.cookTimeMinutes) || input.cookTimeMinutes < 0)) {
    return { ok: false, error: "Cook time must be zero or greater." };
  }
  const steps = input.steps.map((s) => capitalizeFirstLetter(s.trim())).filter(Boolean);
  if (steps.length === 0) {
    return { ok: false, error: "Add at least one instruction step." };
  }
  if (!input.ingredients?.length) {
    return { ok: false, error: "Add at least one ingredient." };
  }

  const description =
    input.description?.trim() ? capitalizeFirstLetter(input.description.trim()) : null;
  const notes = input.notes?.trim() ? capitalizeFirstLetter(input.notes.trim()) : null;

  const ingredientsNormalized = input.ingredients.map(normalizeIngredientForSave);
  for (const ing of ingredientsNormalized) {
    if (!ing.ingredientPhrase.trim()) {
      return { ok: false, error: "Each ingredient needs a display name." };
    }
    if (!ing.usdaFoodDescription.trim()) {
      return { ok: false, error: "Each ingredient needs a USDA food match." };
    }
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save a recipe." };
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      owner_id: user.id,
      title,
      description,
      notes,
      servings: input.servings ?? null,
      prep_time_minutes: input.prepTimeMinutes ?? null,
      cook_time_minutes: input.cookTimeMinutes ?? null,
      is_public: input.isPublic,
    })
    .select("id")
    .single();

  if (recipeError || !recipe) {
    return { ok: false, error: recipeError?.message ?? "Could not create recipe." };
  }

  const recipeId = recipe.id as string;

  const stepRows = steps.map((body, i) => ({
    recipe_id: recipeId,
    step_order: i,
    body,
  }));

  const { error: stepsError } = await supabase.from("recipe_steps").insert(stepRows);
  if (stepsError) {
    return { ok: false, error: stepsError.message };
  }

  const ingredientRows = ingredientsNormalized.map((ing, i) => ({
    recipe_id: recipeId,
    sort_order: i,
    raw_line: ing.rawLine.trim(),
    quantity: ing.quantity,
    unit: ing.unit?.trim() || null,
    ingredient_phrase: ing.ingredientPhrase.trim(),
    usda_fdc_id: ing.usdaFdcId,
    usda_food_description: ing.usdaFoodDescription.trim(),
  }));

  const { data: insertedIngs, error: ingError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredientRows)
    .select("id, sort_order, usda_fdc_id, quantity, unit");

  if (ingError || !insertedIngs?.length) {
    return { ok: false, error: ingError?.message ?? "Could not save ingredients." };
  }

  const insertedSorted = [...insertedIngs].sort(
    (a, b) => (a.sort_order as number) - (b.sort_order as number),
  );

  const snapshotAt = new Date().toISOString();
  const nutritionPayloads: IngredientNutritionJson[] = [];

  for (let i = 0; i < insertedSorted.length; i++) {
    const row = insertedSorted[i];
    const src = ingredientsNormalized[i];
    const fdcId = row.usda_fdc_id as number | null;
    if (fdcId == null) {
      continue;
    }

    const { data: portions } = await supabase
      .from("fdc_food_portions")
      .select("amount, gram_weight, measure_unit, portion_description, modifier")
      .eq("fdc_id", fdcId);

    const { data: nRows } = await supabase
      .from("fdc_food_nutrients")
      .select("nutrient_id, amount, fdc_nutrients ( name, unit_name, rank )")
      .eq("fdc_id", fdcId);

    const portionList = (portions ?? []) as FdcPortionRow[];
    const nutrientList = normalizeNutrientRows(nRows);

    const { grams, note } = estimateGramsFromPortions(
      portionList,
      src.quantity,
      src.unit,
    );
    const nutrients = buildIngredientNutrition(nutrientList, grams);
    const json: IngredientNutritionJson = {
      grams_estimate: grams,
      estimation_note: note,
      nutrients,
    };
    nutritionPayloads.push(json);

    await supabase
      .from("recipe_ingredients")
      .update({
        nutrition: json as unknown as Record<string, unknown>,
        nutrition_snapshot_at: snapshotAt,
      })
      .eq("id", row.id);
  }

  const total = sumRecipeNutrients(nutritionPayloads);
  await supabase
    .from("recipes")
    .update({
      nutrition_total: {
        nutrients: total,
        computed_at: snapshotAt,
      } as unknown as Record<string, unknown>,
      nutrition_total_at: snapshotAt,
    })
    .eq("id", recipeId);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  return { ok: true, recipeId };
}
