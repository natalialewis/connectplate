"use client";

import { useRef } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { useProfileImageUpload } from "@/lib/hooks/useProfileImageUpload";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

/**
 * Profile picture UI: shows avatar image or first-name initial, with upload/change and remove.
 * Uses useProfile and useProfileImageUpload.
 */
export function ProfileAvatar() {
  const { profile, refetch } = useProfile();
  const { upload, deleteAvatar, uploading, deleting, error, uploadedUrl } =
    useProfileImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = uploadedUrl ?? profile?.avatar_url ?? null;
  const initial = profile?.first_name?.charAt(0).toUpperCase() ?? "";
  const busy = uploading || deleting;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void upload(file).then(() => refetch());
    e.target.value = "";
  }

  return (
    <div>
      <span className="block text-sm font-medium text-foreground md:text-base">
        Avatar
      </span>
      <div className="mt-2 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-charcoal-muted bg-muted">
          {busy ? (
            <span className="text-sm text-muted-foreground" aria-busy="true">
              {uploading ? "Uploading…" : "Removing…"}
            </span>
          ) : displayUrl ? (
            <img
              src={displayUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-medium text-muted-foreground">
              {initial}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label="Choose profile photo"
            onChange={handleFileChange}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
            aria-label={displayUrl ? "Change photo" : "Upload photo"}
          >
            <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>
          {displayUrl && (
            <button
              type="button"
              onClick={() => void deleteAvatar().then(() => refetch())}
              disabled={busy}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
              aria-label="Remove photo"
            >
              <svg className="h-5 w-5 shrink-0 -translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {error && (
        <div role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
