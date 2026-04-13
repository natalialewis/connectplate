import { MyRecipesView } from "@/components/recipes/MyRecipesView";
import type { MyRecipeRow } from "@/components/recipes/MyRecipesView";
import { RecipesFab } from "@/components/recipes/RecipesFab";
import { createSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RecipesPage() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // `proxy` already sends anonymous users to /login; this covers tests or a relaxed matcher.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: recipeRows } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, is_public")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const recipes = (recipeRows ?? []) as MyRecipeRow[];
  const publicRecipes = recipes.filter((r) => r.is_public);
  const privateRecipes = recipes.filter((r) => !r.is_public);

  const nameParts = [profile?.first_name, profile?.last_name]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  const displayName = nameParts.join(" ");
  const heading = displayName ? `${displayName}'s Recipes` : "Your Recipes";

  return (
    <div className="relative min-h-full bg-background py-8 sm:py-10 md:py-12">
      {/* Match header: max-w-[90rem] + padding; bar full-bleed on xs, ~80% capped on lg */}
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6">
        <div className="mx-auto w-full lg:mx-auto lg:w-4/5 lg:max-w-[min(72rem,calc(90rem-3rem))]">
          <MyRecipesView
            heading={heading}
            publicRecipes={publicRecipes}
            privateRecipes={privateRecipes}
          />
        </div>
      </div>
      <RecipesFab />
    </div>
  );
}
