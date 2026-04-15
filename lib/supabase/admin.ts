import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the service role key. Use only in trusted
 * server code (API routes, Inngest functions), never in client components.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  // Cloud / older local: service_role JWT (three dot-separated segments). Newer CLI local: `sb_secret_...` (not a JWT).
  const looksLikeJwt = serviceRoleKey.split(".").length === 3;
  const looksLikeSecretKey = serviceRoleKey.startsWith("sb_secret_");
  if (!looksLikeJwt && !looksLikeSecretKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be either the full service_role JWT (hosted projects) or the local " +
        "`Secret` value from `npx supabase status` (starts with sb_secret_). " +
        "Do not paste the Publishable key here.",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
