import { IngredientNutritionToggle } from "@/components/recipes/IngredientNutritionToggle";
import { BackButton } from "@/components/navigation/BackButton";
import { RecipePdfDownloadButton } from "@/components/recipes/RecipePdfDownloadButton";
import { RecipeNutritionSummary } from "@/components/recipes/RecipeNutritionSummary";
import type { IngredientNutritionJson } from "@/lib/recipes/nutrition";
import { createSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RecipeRow = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  is_public: boolean;
  nutrition_total: Record<string, unknown> | null;
};

type StepRow = { step_order: number; body: string };
type IngRow = {
  id: string;
  sort_order: number;
  raw_line: string;
  nutrition: unknown;
};

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipe, error } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();

  if (error || !recipe) {
    notFound();
  }

  const r = recipe as RecipeRow;

  const { data: steps } = await supabase
    .from("recipe_steps")
    .select("step_order, body")
    .eq("recipe_id", id)
    .order("step_order", { ascending: true });

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("id, sort_order, raw_line, nutrition")
    .eq("recipe_id", id)
    .order("sort_order", { ascending: true });

  const stepList = (steps ?? []) as StepRow[];
  const ingList = (ingredients ?? []) as IngRow[];

  return (
    <div className="min-h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <BackButton fallbackHref="/recipes" label="Back" ariaLabel="Back" />
          {user ? <RecipePdfDownloadButton recipeId={id} /> : null}
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{r.title}</h1>
          {r.description ? <p className="text-muted-foreground">{r.description}</p> : null}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {r.servings != null ? <span>Servings: {r.servings}</span> : null}
            {r.prep_time_minutes != null ? <span>Prep: {r.prep_time_minutes} min</span> : null}
            {r.cook_time_minutes != null ? <span>Cook: {r.cook_time_minutes} min</span> : null}
            <span>{r.is_public ? "Public" : "Private"}</span>
          </div>
        </header>

        {r.notes ? (
          <section>
            <h2 className="text-lg font-semibold text-foreground">Notes</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.notes}</p>
          </section>
        ) : null}

        <section>
          <h2 className="text-lg font-semibold text-foreground">Ingredients</h2>
          <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm text-foreground">
            {ingList.map((ing) => {
              const nut = ing.nutrition as IngredientNutritionJson | null;
              return (
                <li key={ing.id} className="pl-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span>{ing.raw_line}</span>
                    <IngredientNutritionToggle nutrition={nut} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-foreground">
            {stepList.map((s) => (
              <li key={s.step_order} className="pl-1">
                {s.body}
              </li>
            ))}
          </ol>
        </section>

        <RecipeNutritionSummary total={r.nutrition_total} />
      </main>
    </div>
  );
}
