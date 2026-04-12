"use client";

import Link from "next/link";

export function RecipesFab() {
  return (
    <Link
      href="/recipes/new"
      className="fixed bottom-7 right-7 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl font-light leading-none text-primary-foreground shadow-sm transition-[background-color,box-shadow,color,filter] duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:shadow-primary/25 hover:ring-2 hover:ring-primary/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-card sm:bottom-11 sm:right-11"
      aria-label="Create recipe"
    >
      +
    </Link>
  );
}
