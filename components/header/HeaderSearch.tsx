"use client";

import { type FormEvent, useState } from "react";

/**
 * Search UI only; submit is a no-op until search is implemented.
 */
export function HeaderSearch() {
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-none"
      role="search"
      aria-label="Site search"
    >
      <div className="flex h-8 w-full min-w-0 overflow-hidden rounded-lg border-2 border-charcoal/55 bg-muted/40 shadow-sm dark:border-charcoal-muted/80 dark:bg-muted/30 sm:h-9">
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes or users"
          className="min-h-0 min-w-0 flex-1 border-0 bg-transparent px-2.5 py-0 text-sm leading-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/45 dark:focus-visible:ring-primary/55 sm:px-3"
          autoComplete="off"
          aria-label="Search recipes or users"
        />
        <button
          type="submit"
          className="flex min-h-0 shrink-0 items-center justify-center border-l-2 border-charcoal/40 bg-charcoal px-2.5 text-white transition hover:bg-charcoal/90 focus:outline-none focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80 focus-visible:ring-offset-0 dark:border-charcoal-muted/50 dark:bg-foreground/20 dark:text-foreground dark:hover:bg-foreground/30 dark:focus-visible:ring-accent sm:px-3"
          aria-label="Search"
        >
          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
