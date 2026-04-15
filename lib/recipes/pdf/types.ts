export type RecipePdfRecipe = {
  title: string;
  description: string | null;
  notes: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  is_public: boolean;
  nutrition_total: Record<string, unknown> | null;
};

export type RecipePdfStep = { step_order: number; body: string };
export type RecipePdfIngredient = { raw_line: string };
