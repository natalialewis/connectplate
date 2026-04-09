"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export type LoginParams = {
  email: string;
  password: string;
};

export function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(params: LoginParams) {
    const { email, password } = params;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      // When the user logs in successfully, they are redirected to home.
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}