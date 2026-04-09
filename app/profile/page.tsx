"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatDateTime, formatTimeZone } from "@/lib/date";
import { useProfile } from "@/lib/hooks/useProfile";
import { ProfileAvatar } from "./components/ProfileAvatar";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoadingUI, setShowLoadingUI] = useState(false);

  const isLoading = authLoading || profileLoading;

  // Only show the loading skeleton after a short delay to avoid flash on fast loads
  useEffect(() => {
    if (!isLoading) {
      setShowLoadingUI(false);
      return;
    }
    const id = window.setTimeout(() => setShowLoadingUI(true), 250);
    return () => window.clearTimeout(id);
  }, [isLoading]);

  // If the user is not authenticated, redirect to the login page
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // If the profile is loaded, set the first and last name
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
    }
  }, [profile]);

  // Redirect when we know the user is not authenticated
  if (!authLoading && !user) {
    return null;
  }

  const showForm = !isLoading && user && profile;

  // Reset the form when the user cancels the edit to what is in the database
  function handleCancelEdit() {
    if (!profile) return;
    setIsEditing(false);
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setFormError(null);
  }

  // Handle the form submission
  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;
    setFormError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst) {
      setFormError("First name is required.");
      return;
    }
    if (!trimmedLast) {
      setFormError("Last name is required.");
      return;
    }

    setIsSaving(true);
    const supabase = createSupabaseClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ first_name: trimmedFirst, last_name: trimmedLast })
      .eq("id", profile.id);

    setIsSaving(false);
    if (updateError) {
      setFormError(updateError.message);
      return;
    }
    await refetch();
    setIsEditing(false);
  }

  return (
    <div className="h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto w-full max-w-2xl">
        {/* Top row: purple back arrow (left), edit icon (right) — always visible */}
        <div className="mb-4 h-full flex items-center justify-between sm:mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Back to home"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-medium sm:text-base">Back</span>
          </Link>
          {/* If the form is shown and the user is not editing, show the edit button */}
          {showForm && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Edit profile"
            >
              <svg className="h-7 w-7 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}
        </div>

        {(showLoadingUI || showForm) && (
          <>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">Profile</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base md:text-lg">
              View and update your profile information below.
            </p>

            {showLoadingUI && (
              <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6" aria-hidden>
                <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
                <div className="h-4 w-full max-w-sm animate-pulse rounded bg-muted" />
              </div>
            )}

            {showForm && profile && (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              Created {formatDateTime(profile.created_at)} {formatTimeZone(profile.created_at)} · Last updated {formatDateTime(profile.updated_at)} {formatTimeZone(profile.updated_at)}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-8 sm:space-y-6" noValidate>
          <ProfileAvatar />

          <div>
            <label htmlFor="profile-first-name" className="block text-sm font-medium text-foreground md:text-base">
              First name
            </label>
            {isEditing ? (
              <input
                id="profile-first-name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring md:py-3"
                placeholder="First name"
                required
                aria-required="true"
                aria-invalid={!!formError}
              />
            ) : (
              <div className="mt-1 block w-full min-w-0 rounded-lg border border-border bg-muted px-3 py-2.5 text-base text-foreground md:py-3 md:text-lg">
                {profile.first_name}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="profile-last-name" className="block text-sm font-medium text-foreground md:text-base">
              Last name
            </label>
            {isEditing ? (
              <input
                id="profile-last-name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring md:py-3"
                placeholder="Last name"
                required
                aria-required="true"
                aria-invalid={!!formError}
              />
            ) : (
              <div className="mt-1 block w-full min-w-0 rounded-lg border border-border bg-muted px-3 py-2.5 text-base text-foreground md:py-3 md:text-lg">
                {profile.last_name}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-foreground md:text-base">
              Email
            </label>
            <div className="mt-1 block w-full min-w-0 rounded-lg border border-border bg-muted px-3 py-2.5 text-base text-foreground md:py-3 md:text-lg">
              {profile.email}
            </div>
          </div>

          {isEditing && (
            <>
              <div role="alert" aria-live="polite" className="min-h-[1.5rem] text-sm text-destructive">
                {formError}
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[2.75rem] rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 md:py-3 md:text-base"
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="min-h-[2.75rem] rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background md:py-3 md:text-base"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
            </form>
          </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
