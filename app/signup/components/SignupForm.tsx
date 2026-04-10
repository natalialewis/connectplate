"use client";

import Link from "next/link";
import { type SubmitEvent, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useSignUp } from "@/lib/hooks/useSignUp";
import { validateUsername } from "@/lib/validation/username";

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

function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [finishAccount, setFinishAccount] = useState(false);
  const [validationError, setValidationError] = useState("");
  const { signUp, isLoading, error: signUpError, clearError } = useSignUp();

  function handleCredentialsSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setValidationError("Email is required.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    if (!validatePassword(trimmedPassword)) {
      setValidationError(PASSWORD_ERROR);
      return;
    }

    setEmail(trimmedEmail);
    setPassword(trimmedPassword);
    setFinishAccount(true);
  }

  async function handleFinishAccountSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError("");

    const tFirst = firstName.trim();
    const tLast = lastName.trim();
    const tUser = username.trim();

    if (!tFirst || !tLast || !tUser) {
      setValidationError("Please fill out all fields.");
      return;
    }

    const userCheck = validateUsername(tUser);
    if (!userCheck.ok) {
      setValidationError(userCheck.message);
      return;
    }

    await signUp({
      email: email.trim(),
      password: password.trim(),
      firstName: tFirst,
      lastName: tLast,
      username: tUser,
    });
  }

  const displayedError = validationError || signUpError || "";

  const inputClassName =
    "mt-1 block h-11 w-full min-w-0 rounded-lg border border-charcoal/70 bg-background px-5 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";
  const cardClassName =
    "w-full max-w-[600px] rounded-2xl border border-border bg-card px-6 py-8 shadow-[0_5px_14px_rgba(0,0,0,0.12)] sm:px-8 sm:py-10";
  const panelClassName = "mx-auto mt-4 w-full max-w-[400px] sm:mt-5";

  return (
    <div className="relative grid min-h-[640px] w-full overflow-hidden px-2 py-3 sm:min-h-[600px] sm:px-3 sm:py-4">
      <div
        className={`col-start-1 row-start-1 transition-all duration-500 ease-in-out ${
          finishAccount ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
        }`}
        inert={finishAccount ? true : undefined}
        aria-hidden={finishAccount}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className={cardClassName}>
          <form onSubmit={handleCredentialsSubmit} className={panelClassName} noValidate>
            <h1 className="mb-6 text-center text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">Sign up</h1>

            {displayedError && !finishAccount ? (
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
                className={inputClassName}
                placeholder="you@example.com"
                required
                aria-required="true"
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
              />
            </div>

            <button
              type="submit"
              className="min-h-11 w-full rounded-lg bg-charcoal px-5 py-2.5 text-[1.0625rem] font-medium leading-snug text-white transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Sign up
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
          </div>
        </div>
      </div>

      <div
        className={`col-start-1 row-start-1 transition-all duration-500 ease-in-out ${
          finishAccount ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
        inert={!finishAccount ? true : undefined}
        aria-hidden={!finishAccount}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className={cardClassName}>
          <form onSubmit={handleFinishAccountSubmit} className={`${panelClassName} pb-10`} noValidate>
            <h1 className="mb-6 text-center text-[1.25rem] font-semibold leading-tight text-foreground sm:text-[1.45rem] md:text-2xl">
              Finish Creating Your Account
            </h1>

            {displayedError && finishAccount ? (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-6 w-full rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-center text-sm text-red-700"
              >
                {displayedError}
              </div>
            ) : null}

            <div className="mb-6">
              <label htmlFor="signup-username" className="block text-[15px] font-medium leading-snug text-foreground sm:text-base">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className={inputClassName}
                required
                aria-required="true"
                spellCheck={false}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="signup-first-name" className="block text-[15px] font-medium leading-snug text-foreground sm:text-base">
                First Name
              </label>
              <input
                id="signup-first-name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClassName}
                required
                aria-required="true"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="signup-last-name" className="block text-[15px] font-medium leading-snug text-foreground sm:text-base">
                Last Name
              </label>
              <input
                id="signup-last-name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClassName}
                required
                aria-required="true"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="min-h-11 w-full rounded-lg bg-charcoal px-5 py-2.5 text-[1.0625rem] font-medium leading-snug text-white transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Finish Creating Account"}
            </button>

            <p className="mt-6 text-center">
              <button
                type="button"
                className="text-base font-semibold text-primary underline underline-offset-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                onClick={() => {
                  setValidationError("");
                  clearError();
                  setFinishAccount(false);
                }}
              >
                Back
              </button>
            </p>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
