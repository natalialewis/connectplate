"use client";

import { useCallback, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

function validateNewPassword(value: string): boolean {
  if (value.length < 8) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

export const NEW_PASSWORD_REQUIREMENTS =
  "Password must be at least 8 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";

export function useChangePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  async function changePassword(currentPassword: string, newPassword: string) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      const email = user?.email?.trim();
      if (!email) {
        setError("Could not verify your account email.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        setError("Current password is incorrect.");
        return;
      }

      if (!validateNewPassword(newPassword)) {
        setError(NEW_PASSWORD_REQUIREMENTS);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return { changePassword, isLoading, error, success, clearMessages };
}
