"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { RecipeListPlaceholderImage } from "@/components/recipes/RecipeListPlaceholderImage";

export type MyRecipeRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_public: boolean;
};

type TabId = "public" | "private" | "saved";

type Props = {
  heading: string;
  publicRecipes: MyRecipeRow[];
  privateRecipes: MyRecipeRow[];
};

function tabBtnClass(active: boolean): string {
  return [
    "relative px-4 py-3 text-sm font-semibold transition-colors sm:px-5 sm:text-base",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-t-md",
    active
      ? "text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
      : "text-muted-foreground hover:text-foreground",
  ].join(" ");
}

function RecipeRow({ recipe }: { recipe: MyRecipeRow }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex min-h-[5.25rem] gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/25 hover:bg-muted/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-transparent">
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
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-bold text-foreground">{recipe.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">Description: </span>
          {recipe.description?.trim()
            ? recipe.description.trim()
            : "None"}
        </p>
      </div>
    </Link>
  );
}

export function MyRecipesView({ heading, publicRecipes, privateRecipes }: Props) {
  const [tab, setTab] = useState<TabId>("public");

  const tabs: { id: TabId; label: string }[] = [
    { id: "public", label: "Public" },
    { id: "private", label: "Private" },
    { id: "saved", label: "Saved" },
  ];

  return (
    <div className="w-full">
      <h1 className="mb-4 text-center text-2xl font-semibold text-foreground sm:mb-5 sm:text-3xl">
        {heading}
      </h1>

      <div className="w-full rounded-xl border border-border bg-card shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
        <div
          role="tablist"
          aria-label="Recipe collections"
          className="flex border-b border-border"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tabBtnClass(tab === t.id)}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5" role="tabpanel">
          {tab === "public" && (
            <div className="space-y-3">
              {publicRecipes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground sm:text-base">
                  Add a public recipe to see it here!
                </p>
              ) : (
                publicRecipes.map((r) => <RecipeRow key={r.id} recipe={r} />)
              )}
            </div>
          )}
          {tab === "private" && (
            <div className="space-y-3">
              {privateRecipes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground sm:text-base">
                  Add a private recipe to see it here!
                </p>
              ) : (
                privateRecipes.map((r) => <RecipeRow key={r.id} recipe={r} />)
              )}
            </div>
          )}
          {tab === "saved" && (
            <p className="py-8 text-center text-sm text-muted-foreground sm:text-base">
              Save a recipe from a fellow user to see it here!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
