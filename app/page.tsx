import Image from "next/image";
import Link from "next/link";
import { HomeAddFriendAction } from "@/components/friends/HomeAddFriendAction";
import { RecipeListPlaceholderImage } from "@/components/recipes/RecipeListPlaceholderImage";
import { capitalizeFirstLetter } from "@/lib/recipes/text";
import { createSupabaseClient } from "@/lib/supabase/server";

const homeAddFriendButtonClassName =
  "w-1/4 rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:w-auto sm:min-h-0 sm:py-2 md:text-base";

export default async function HomePage() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "";
  let lastName = "";
  let feedRecipes: Array<{
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
    owner_id: string;
    owner_username: string | null;
  }> = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();
    firstName =
      typeof profile?.first_name === "string" ? capitalizeFirstLetter(profile.first_name) : "";
    lastName =
      typeof profile?.last_name === "string" ? capitalizeFirstLetter(profile.last_name) : "";

    const { data: feedRows } = await supabase.rpc("get_follow_feed_recent", {
      max_age_days: 30,
      max_results: 100,
    });
    feedRecipes = (feedRows ?? []) as typeof feedRecipes;
  }

  return (
    <div className="min-h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto w-full max-w-2xl text-center">
        {user ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome{firstName || lastName ? `, ${firstName} ${lastName}` : ""}!
            </h1>
            <p className="mt-2 text-base text-muted-foreground sm:mt-3 sm:text-lg">
              Recent public recipes from people you follow will display below.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
              <HomeAddFriendAction buttonClassName={homeAddFriendButtonClassName} />
            </div>

            <section className="mt-8 rounded-xl border border-border bg-card p-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
              {feedRecipes.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground sm:text-base">
                  No public recipes have been posted by people you follow in the last month.
                </p>
              ) : (
                <div className="space-y-3">
                  {feedRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex min-h-[5.25rem] gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/25 hover:bg-muted/35"
                    >
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Open recipe ${recipe.title}`}
                      >
                        {recipe.image_url ? (
                          <Image
                            src={recipe.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized
                          />
                        ) : (
                          <RecipeListPlaceholderImage />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1 py-0.5">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="font-bold text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {recipe.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <Link
                            href={`/profile/${encodeURIComponent(recipe.owner_username || "unknown")}`}
                            className="font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            @{recipe.owner_username || "unknown"}
                          </Link>{" "}
                          · {new Date(recipe.created_at).toLocaleDateString()}
                        </p>
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="mt-1 block text-sm text-muted-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {recipe.description?.trim() ? recipe.description.trim() : "No description"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Welcome!</h1>
            <p className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg">Welcome to ConnectPlate.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
              <Link
                href="/login"
                className="w-1/4 rounded-lg border border-border bg-card px-5 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:w-auto"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="w-1/4 rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:w-auto"
              >
                Sign up
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
