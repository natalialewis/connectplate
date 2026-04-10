"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
};

export function useSignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(params: SignUpParams) {
    const { email, password, firstName, lastName, username } = params;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: username.trim(),
          },
        },
      });
      if (signUpError) throw signUpError;
      // When the user signs up successfully, they are redirected to the home feed shell.
      router.push("/");
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "An error occurred";
      const normalized = rawMessage.toLowerCase();
      if (
        normalized.includes("profiles_username_key") ||
        normalized.includes("duplicate key value") ||
        normalized.includes("database error saving new user")
      ) {
        setError("Username already in use.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return { signUp, isLoading, error, clearError };
}