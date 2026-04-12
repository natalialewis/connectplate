"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

function oauthAvatarUrlFromUser(user: User): string | null {
  const meta = user.user_metadata;
  if (!meta || typeof meta !== "object") {
    return null;
  }
  const raw =
    (typeof meta.avatar_url === "string" ? meta.avatar_url : "") ||
    (typeof meta.picture === "string" ? meta.picture : "");
  const trimmed = raw.trim();
  return trimmed || null;
}

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
};

export type CompletePendingSignupParams = {
  firstName: string;
  lastName: string;
  username: string;
};

export function useSignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mapProfileError(rawMessage: string): string {
    const normalized = rawMessage.toLowerCase();
    if (
      normalized.includes("profiles_username_key") ||
      normalized.includes("duplicate key value") ||
      normalized.includes("database error saving new user")
    ) {
      return "Username already in use.";
    }
    return rawMessage;
  }

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
      setError(mapProfileError(rawMessage));
    } finally {
      setIsLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  async function completePendingSignup(params: CompletePendingSignupParams) {
    const { firstName, lastName, username } = params;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      if (!user) {
        throw new Error("Not signed in.");
      }

      const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
        },
      });
      if (updateUserError) {
        throw updateUserError;
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const oauthPic = oauthAvatarUrlFromUser(user);
      const hasExistingAvatar = Boolean(profileRow?.avatar_url?.trim());

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          signup_completed: true,
          ...(oauthPic && !hasExistingAvatar ? { avatar_url: oauthPic } : {}),
        })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      router.push("/");
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "An error occurred";
      setError(mapProfileError(rawMessage));
    } finally {
      setIsLoading(false);
    }
  }

  return { signUp, completePendingSignup, isLoading, error, clearError };
}