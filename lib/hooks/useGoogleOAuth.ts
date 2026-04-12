"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export function useGoogleOAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  }

  return { signInWithGoogle, isLoading, error };
}
