"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { userHasEmailPasswordIdentity } from "@/lib/auth/userIdentity";
import { useAuth } from "@/lib/hooks/useAuth";
import { NEW_PASSWORD_REQUIREMENTS, useChangePassword } from "@/lib/hooks/useChangePassword";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

type AccountSettingsSectionProps = {
  profileEmail: string;
  isEditingPassword: boolean;
  onStartEditPassword: () => void;
  onCancelEditPassword: () => void;
};

const readOnlyFieldClass =
  "mt-1 block w-full min-w-0 rounded-lg border border-border bg-muted px-3 py-2.5 text-base text-foreground md:py-3 md:text-lg";

/** Placeholder mask shown when password is not being edited (matches email field styling). */
const PASSWORD_MASK = "●●●●●●●";

export function AccountSettingsSection({
  profileEmail,
  isEditingPassword,
  onStartEditPassword,
  onCancelEditPassword,
}: AccountSettingsSectionProps) {
  const { user } = useAuth();
  const { changePassword, isLoading, error, success, clearMessages } = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const canChangePassword = userHasEmailPasswordIdentity(user);

  useEffect(() => {
    if (!success) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [success]);

  useEffect(() => {
    if (isEditingPassword) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLocalError(null);
    clearMessages();
  }, [isEditingPassword, clearMessages]);

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    clearMessages();

    if (!newPassword.trim() || !confirmPassword.trim() || !currentPassword) {
      setLocalError("Please fill out all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("New password and confirmation do not match.");
      return;
    }

    void changePassword(currentPassword, newPassword);
  }

  function handleDoneAfterSuccess() {
    onCancelEditPassword();
    clearMessages();
  }

  if (!user) {
    return null;
  }

  const displayedError = localError || error;

  return (
    <section className="mt-8 border-t border-border pt-8 sm:mt-10 sm:pt-10" aria-labelledby="account-heading">
      <SettingsSectionHeader
        title="Account"
        sectionId="account-heading"
        showEditButton={canChangePassword && !isEditingPassword}
        onEdit={onStartEditPassword}
        editAriaLabel="Edit password"
      />

      <div className="space-y-5 sm:space-y-6">
        <div>
          <label htmlFor="settings-account-email" className="block text-sm font-medium text-foreground md:text-base">
            Email
          </label>
          <div id="settings-account-email" className={readOnlyFieldClass}>
            {profileEmail}
          </div>
        </div>

        {!canChangePassword ? (
          <div>
            <span className="block text-sm font-medium text-foreground md:text-base">Password</span>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              You signed in with Google. Password sign-in is not set up for this account.
            </p>
          </div>
        ) : !isEditingPassword ? (
          <div>
            <span className="block text-sm font-medium text-foreground md:text-base">Password</span>
            <div
              className={`${readOnlyFieldClass} font-sans tracking-widest text-muted-foreground select-none`}
              aria-hidden
            >
              {PASSWORD_MASK}
            </div>
            <p className="sr-only">
              Password is hidden. Use the Account section edit button to change your password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
            <div>
              <label htmlFor="settings-current-password" className="block text-sm font-medium text-foreground md:text-base">
                Current password
              </label>
              <PasswordInput
                id="settings-current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 h-11 px-5"
                required
                aria-required="true"
                aria-invalid={!!displayedError}
              />
            </div>

            <div>
              <label htmlFor="settings-new-password" className="block text-sm font-medium text-foreground md:text-base">
                New password
              </label>
              <PasswordInput
                id="settings-new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 h-11 px-5"
                required
                minLength={8}
                aria-required="true"
                aria-invalid={!!displayedError}
              />
              <p className="mt-1 text-xs text-muted-foreground">{NEW_PASSWORD_REQUIREMENTS}</p>
            </div>

            <div>
              <label htmlFor="settings-confirm-password" className="block text-sm font-medium text-foreground md:text-base">
                Confirm new password
              </label>
              <PasswordInput
                id="settings-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 h-11 px-5"
                required
                minLength={8}
                aria-required="true"
                aria-invalid={!!displayedError}
              />
            </div>

            {success ? (
              <p className="text-sm text-green-700 dark:text-green-400" role="status">
                Password updated successfully.
              </p>
            ) : null}

            <div role="alert" aria-live="polite" className="min-h-[1.25rem] text-sm text-destructive">
              {displayedError}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              {success ? (
                <button
                  type="button"
                  onClick={handleDoneAfterSuccess}
                  className="min-h-[2.75rem] rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background md:py-3 md:text-base"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="min-h-[2.75rem] rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 md:py-3 md:text-base"
                  >
                    {isLoading ? "Updating…" : "Update password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCancelEditPassword();
                    }}
                    className="min-h-[2.75rem] rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background md:py-3 md:text-base"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
