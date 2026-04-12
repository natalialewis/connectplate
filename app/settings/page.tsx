"use client";

import Link from "next/link";
import { type SubmitEvent, useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatDateTime, formatTimeZone } from "@/lib/date";
import { useProfile } from "@/lib/hooks/useProfile";
import { AccountSettingsSection } from "./components/AccountSettingsSection";
import { PreferencesSection } from "./components/PreferencesSection";
import { ProfileAvatar } from "./components/ProfileAvatar";
import { SettingsSectionHeader } from "./components/SettingsSectionHeader";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoadingUI, setShowLoadingUI] = useState(false);

  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    if (!isLoading) {
      setShowLoadingUI(false);
      return;
    }
    const id = window.setTimeout(() => setShowLoadingUI(true), 250);
    return () => window.clearTimeout(id);
  }, [isLoading]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
    }
  }, [profile]);

  const showForm = !isLoading && user && profile;

  function handleCancelProfileEdit() {
    if (!profile) return;
    setIsEditingProfile(false);
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setFormError(null);
  }

  async function handleProfileSubmit(e: SubmitEvent<HTMLFormElement>) {
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
    setIsEditingProfile(false);
  }

  return (
    <div className="h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto w-full max-w-2xl">
        <div className="mb-4 flex items-center sm:mb-6">
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
        </div>

        {(showLoadingUI || showForm) && (
          <>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">Settings</h1>
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
                  Created {formatDateTime(profile.created_at)} {formatTimeZone(profile.created_at)} · Last updated{" "}
                  {formatDateTime(profile.updated_at)} {formatTimeZone(profile.updated_at)}
                </p>

                <div className="mt-6 border-t border-border pt-8 sm:mt-8 sm:pt-10" />

                <section className="mt-0" aria-labelledby="profile-heading">
                  <SettingsSectionHeader
                    title="Profile"
                    sectionId="profile-heading"
                    showEditButton={!isEditingProfile}
                    onEdit={() => setIsEditingProfile(true)}
                    editAriaLabel="Edit profile"
                  />

                  <form onSubmit={handleProfileSubmit} className="space-y-5 sm:space-y-6" noValidate>
                    <ProfileAvatar />

                    <div>
                      <label htmlFor="settings-first-name" className="block text-sm font-medium text-foreground md:text-base">
                        First name
                      </label>
                      {isEditingProfile ? (
                        <input
                          id="settings-first-name"
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
                      <label htmlFor="settings-last-name" className="block text-sm font-medium text-foreground md:text-base">
                        Last name
                      </label>
                      {isEditingProfile ? (
                        <input
                          id="settings-last-name"
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

                    {isEditingProfile && (
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
                            onClick={handleCancelProfileEdit}
                            className="min-h-[2.75rem] rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background md:py-3 md:text-base"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                </section>

                <AccountSettingsSection
                  profileEmail={profile.email}
                  isEditingPassword={isEditingPassword}
                  onStartEditPassword={() => setIsEditingPassword(true)}
                  onCancelEditPassword={() => setIsEditingPassword(false)}
                />

                <PreferencesSection />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
