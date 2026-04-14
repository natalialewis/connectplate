"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useProfileImageUpload } from "@/lib/hooks/useProfileImageUpload";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type ProfileCardData = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_self: boolean;
  already_following: boolean;
};

type Props = {
  profile: ProfileCardData;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

export function ProfileCard({ profile }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyFollowing, setAlreadyFollowing] = useState(profile.already_following);
  const [form, setForm] = useState({
    username: profile.username,
    firstName: profile.first_name,
    lastName: profile.last_name,
    bio: profile.bio ?? "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, uploadedUrl } = useProfileImageUpload();

  const displayAvatarUrl = uploadedUrl ?? profile.avatar_url;
  const fullName = `${form.firstName} ${form.lastName}`.trim();

  const save = async () => {
    setBusy(true);
    setError(null);
    const supabase = createSupabaseClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: form.username.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        bio: form.bio.trim() || null,
      })
      .eq("id", profile.id);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditing(false);
    router.refresh();
  };

  const follow = async () => {
    if (alreadyFollowing || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createSupabaseClient();
    const { error: followError } = await supabase.from("follows").insert({
      following_id: profile.id,
    });
    setBusy(false);
    if (followError) {
      setError(followError.message);
      return;
    }
    setAlreadyFollowing(true);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                {(form.firstName || form.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {editing ? (
              <>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.username}
                  onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                  placeholder="username"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.firstName}
                    onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
                    placeholder="First name"
                  />
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.lastName}
                    onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
                <textarea
                  className="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.bio}
                  onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
                  placeholder="Add a short bio"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void upload(file).then(() => router.refresh());
                      }
                      e.target.value = "";
                    }}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                  >
                    {uploading ? "Uploading..." : "Change photo"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="truncate text-lg font-semibold text-foreground">@{form.username}</p>
                <p className="truncate text-sm text-foreground">{fullName || " "}</p>
                <p className="text-sm text-muted-foreground">{form.bio?.trim() || "No bio yet."}</p>
              </>
            )}
          </div>
        </div>

        {profile.is_self ? (
          <button
            type="button"
            onClick={() => {
              if (editing) {
                void save();
              } else {
                setEditing(true);
              }
            }}
            disabled={busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
            aria-label={editing ? "Save profile" : "Edit profile"}
          >
            {editing ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
              </svg>
            )}
          </button>
        ) : alreadyFollowing ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary-muted-foreground">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void follow()}
            disabled={busy}
            aria-label={`Follow ${profile.username}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setForm({
                username: profile.username,
                firstName: profile.first_name,
                lastName: profile.last_name,
                bio: profile.bio ?? "",
              });
              setError(null);
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
