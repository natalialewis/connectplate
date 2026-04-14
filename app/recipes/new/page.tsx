import { CreateRecipeForm } from "@/components/recipes/CreateRecipeForm";
import { createSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewRecipePage() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto w-full max-w-2xl">
        <div className="mb-4 flex items-center sm:mb-6">
          <Link
            href="/recipes"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Back to recipes"
          >
            <svg
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-medium sm:text-base">Back to recipes</span>
          </Link>
        </div>

        <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">New Recipe</h1>

        <div className="mt-6 sm:mt-8">
          <CreateRecipeForm />
        </div>
      </main>
    </div>
  );
}
