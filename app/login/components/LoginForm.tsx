"use client";

import Link from "next/link";
import { type SubmitEvent, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useLogin } from "@/lib/hooks/useLogin";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useLogin();

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await login({ email: email.trim(), password });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-4 w-full max-w-[400px] sm:mt-5" noValidate>
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 w-full rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-center text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="mb-6">
        <label htmlFor="login-email" className="block text-[15px] font-medium leading-snug text-foreground sm:text-base">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block h-11 w-full min-w-0 rounded-lg border border-charcoal/70 bg-background px-5 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          placeholder="you@example.com"
          required
          aria-required="true"
          aria-invalid={error === "Email is required."}
        />
      </div>
      <div className="mb-6">
        <label htmlFor="login-password" className="block text-[15px] font-medium leading-snug text-foreground sm:text-base">
          Password
        </label>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 h-11 px-5"
          required
          aria-required="true"
          aria-invalid={error === "Password is required."}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="min-h-11 w-full rounded-lg bg-charcoal px-5 py-2.5 text-[1.0625rem] font-medium leading-snug text-white transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
      >
        {isLoading ? "Signing in…" : "Log in"}
      </button>

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex items-center gap-2" role="separator" aria-label="or log in with">
          <div className="h-px flex-1 bg-charcoal" />
          <span className="text-[15px] font-semibold text-charcoal sm:text-base">or log in with</span>
          <div className="h-px flex-1 bg-charcoal" />
        </div>

        <button
          type="button"
          className="min-h-11 w-full rounded-lg bg-charcoal px-5 py-2.5 text-[1.0625rem] font-medium leading-snug text-white transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Log in with Google"
        >
          Google
        </button>

        <p className="text-center text-base font-semibold text-foreground">
          <Link
            href="/signup"
            className="rounded px-1 font-medium underline underline-offset-2 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Create an Account
          </Link>
        </p>
      </div>
    </form>
  );
}
