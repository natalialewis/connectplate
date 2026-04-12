import type { User } from "@supabase/supabase-js";

/** True when the user can sign in with email and password (not Google-only OAuth). */
export function userHasEmailPasswordIdentity(user: User | null): boolean {
  if (!user?.identities?.length) {
    return false;
  }
  return user.identities.some((identity) => identity.provider === "email");
}
