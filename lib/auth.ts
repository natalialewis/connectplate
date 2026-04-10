import type { User } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Get the currently authenticated user on the server (Server Components, route handlers, server actions).
 * Returns null if not authenticated (does not redirect — use {@link requireUser} for protected pages).
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Same as {@link getUser}, but redirects to `/login` when there is no session.
 * Use in Server Components that must only run for authenticated users.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
