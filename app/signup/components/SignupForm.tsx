"use client";

import Link from "next/link";
import { type SubmitEvent, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useSignUp } from "@/lib/hooks/useSignUp";

// Handles password validation so users are forced to create a strong password
function validatePassword(value: string): boolean {
  if (value.length < 8) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

const PASSWORD_ERROR =
  "Password must be at least 8 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const { signUp, isLoading, error: signUpError } = useSignUp();

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear any previous validation errors
    setValidationError("");

    // Trim form fields to remove whitespace
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validate form fields
    if (!trimmedEmail) {
      setValidationError("Email is required.");
      return;
    }
    if (!validatePassword(trimmedPassword)) {
      setValidationError(PASSWORD_ERROR);
      return;
    }

    // Sign up the user
    await signUp({ email: trimmedEmail, password: trimmedPassword });
  }

  // Display both validation and sign up errors
  const displayedError = validationError || signUpError || "";

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-4 w-full max-w-[400px] sm:mt-5" noValidate>
      {displayedError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 w-full rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-center text-sm text-red-700"
        >
          {displayedError}
        </div>
      ) : null}

      <div className="mb-6">
        <label htmlFor="signup-email" className="block text-[15px] font-medium leading-snug text-foreground sm:text-base">
          Email Address
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block h-11 w-full min-w-0 rounded-lg border border-charcoal/70 bg-background px-5 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          placeholder="you@example.com"
          required
          aria-required="true"
          aria-invalid={validationError === "Email is required."}
        />
      </div>
      <div className="mb-6">
        <label htmlFor="signup-password" className="block text-[15px] font-medium leading-snug text-foreground sm:text-base">
          Password
        </label>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 h-11 px-5"
          required
          minLength={8}
          aria-required="true"
          aria-invalid={!!validationError}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="min-h-11 w-full rounded-lg bg-charcoal px-5 py-2.5 text-[1.0625rem] font-medium leading-snug text-white transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
      >
        {isLoading ? "Creating account..." : "Sign up"}
      </button>

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex items-center gap-2" role="separator" aria-label="or sign up with">
          <div className="h-px flex-1 bg-charcoal" />
          <span className="text-[15px] font-semibold text-charcoal sm:text-base">or sign up with</span>
          <div className="h-px flex-1 bg-charcoal" />
        </div>

        <button
          type="button"
          className="min-h-11 w-full rounded-lg bg-charcoal px-5 py-2.5 text-[1.0625rem] font-medium leading-snug text-white transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Sign up with Google"
        >
          Google
        </button>

        <p className="text-center text-base font-semibold text-foreground">
          <Link
            href="/login"
            className="rounded px-1 font-medium underline underline-offset-2 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Log In to Existing Account
          </Link>
        </p>
      </div>
    </form>
  );
}
