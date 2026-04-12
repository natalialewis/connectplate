"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createSupabaseClient } from "@/lib/supabase/client";

type FriendSearchRow = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  already_following: boolean;
};

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_LOADING_SHOW_MS = 500;
const FOLLOW_PLUS_SPIN_MS = 520;

export type AddFriendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Single add-friend popup; wire from `HomeAddFriendAction`, `AuthNav`, or any `open`/`onOpenChange` parent. */
export function AddFriendDialog({ open, onOpenChange }: AddFriendDialogProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendSearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRequestId = useRef(0);
  const searchLoadingTimerRef = useRef<{
    requestId: number;
    timerId: number;
  } | null>(null);
  const followRevealTimeoutRef = useRef<number | null>(null);
  const titleId = useId();
  const searchFieldId = `${useId()}-friend-search`;

  const close = useCallback(() => {
    if (followRevealTimeoutRef.current) {
      clearTimeout(followRevealTimeoutRef.current);
      followRevealTimeoutRef.current = null;
    }
    const pending = searchLoadingTimerRef.current;
    if (pending) {
      clearTimeout(pending.timerId);
      searchLoadingTimerRef.current = null;
    }
    setFollowBusyId(null);
    setQuery("");
    setResults([]);
    setSearchError(null);
    setSearching(false);
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) return;
    const pending = searchLoadingTimerRef.current;
    if (pending) {
      clearTimeout(pending.timerId);
      searchLoadingTimerRef.current = null;
    }
    if (followRevealTimeoutRef.current) {
      clearTimeout(followRevealTimeoutRef.current);
      followRevealTimeoutRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;

    const requestId = ++searchRequestId.current;
    const trimmed = query.trim();
    const delay = trimmed.length === 0 ? 0 : SEARCH_DEBOUNCE_MS;

    const handle = window.setTimeout(() => {
      if (searchRequestId.current !== requestId) return;

      if (trimmed.length === 0) {
        setResults([]);
        setSearching(false);
        setSearchError(null);
        return;
      }

      setSearching(false);
      setSearchError(null);

      const pending = searchLoadingTimerRef.current;
      if (pending) {
        clearTimeout(pending.timerId);
        searchLoadingTimerRef.current = null;
      }

      searchLoadingTimerRef.current = {
        requestId,
        timerId: window.setTimeout(() => {
          searchLoadingTimerRef.current = null;
          if (searchRequestId.current === requestId) {
            setSearching(true);
          }
        }, SEARCH_LOADING_SHOW_MS),
      };

      void (async () => {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase.rpc("search_profiles_for_friend", {
          p_query: trimmed,
        });

        const timerEntry = searchLoadingTimerRef.current;
        if (timerEntry?.requestId === requestId) {
          clearTimeout(timerEntry.timerId);
          searchLoadingTimerRef.current = null;
        }

        if (searchRequestId.current !== requestId) return;

        setSearching(false);
        if (error) {
          setSearchError(error.message);
          setResults([]);
          return;
        }
        setResults((data ?? []) as FriendSearchRow[]);
      })();
    }, delay);

    return () => {
      window.clearTimeout(handle);
      const pending = searchLoadingTimerRef.current;
      if (pending) {
        clearTimeout(pending.timerId);
        searchLoadingTimerRef.current = null;
      }
      setSearching(false);
    };
  }, [open, query, user]);

  const follow = useCallback(
    async (row: FriendSearchRow) => {
      if (!user || row.already_following) return;
      const startedAt = Date.now();
      setFollowBusyId(row.id);
      setSearchError(null);
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: row.id,
      });

      if (error) {
        setFollowBusyId(null);
        setSearchError(error.message);
        return;
      }

      const elapsed = Date.now() - startedAt;
      const waitMore = Math.max(0, FOLLOW_PLUS_SPIN_MS - elapsed);
      if (followRevealTimeoutRef.current) {
        clearTimeout(followRevealTimeoutRef.current);
      }
      followRevealTimeoutRef.current = window.setTimeout(() => {
        followRevealTimeoutRef.current = null;
        setFollowBusyId(null);
        setResults((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, already_following: true } : r)),
        );
      }, waitMore);
    },
    [user],
  );

  const unfollow = useCallback(
    async (row: FriendSearchRow) => {
      if (!user || !row.already_following) return;
      setFollowBusyId(row.id);
      setSearchError(null);
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", row.id);
      setFollowBusyId(null);
      if (error) {
        setSearchError(error.message);
        return;
      }
      setResults((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, already_following: false } : r)),
      );
    },
    [user],
  );

  if (!open || !user) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close add friend dialog"
        className="fixed inset-0 z-[100] cursor-default bg-foreground/20 backdrop-blur-[2px] transition-opacity dark:bg-black/50"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed left-1/2 top-1/2 z-[110] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary p-[2px] shadow-[0_8px_32px_rgba(35,34,37,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
      >
        <div className="relative overflow-hidden rounded-[14px] bg-white dark:bg-card">
          <div className="p-5 pt-6 sm:p-6 sm:pt-7">
            <h2
              id={titleId}
              className="text-center text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              Add Friend
            </h2>
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-card sm:right-4 sm:top-4 sm:h-9 sm:w-9"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mt-5">
              <label htmlFor={searchFieldId} className="block text-left text-sm font-medium text-foreground">
                Search by username or name
              </label>
              <input
                ref={searchInputRef}
                id={searchFieldId}
                type="search"
                autoComplete="off"
                placeholder="Type to search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-3 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-ring/40 dark:bg-muted/20 sm:py-2"
              />
            </div>

            <div className="mt-4 min-h-[8rem] space-y-2 sm:min-h-[7.5rem]">
              {searchError ? (
                <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-center text-sm text-destructive">
                  {searchError}
                </p>
              ) : null}
              {searching ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <span className="flex gap-1" aria-hidden>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                  </span>
                  <p className="text-sm text-muted-foreground">Searching</p>
                </div>
              ) : null}
              {!searching && query.trim().length === 0 ? (
                <p className="pb-1 pt-6 text-center text-sm text-muted-foreground">Start typing to find users</p>
              ) : null}
              {!searching && query.trim().length > 0 && results.length === 0 && !searchError ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No one matches that search.</p>
              ) : null}
              {!searching
                ? results.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/35 p-1.5 pr-2 shadow-sm hover:border-primary/25 hover:bg-muted/50 dark:bg-muted/25 dark:hover:bg-muted/40"
                    >
                      <Link
                        href={`/profile/${encodeURIComponent(row.username)}`}
                        onClick={close}
                        className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-0.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-card sm:min-h-0"
                      >
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-inner sm:h-10 sm:w-10">
                          {row.avatar_url ? (
                            <img
                              src={row.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span
                              className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground"
                              aria-hidden
                            >
                              {row.first_name
                                ? row.first_name.charAt(0).toUpperCase()
                                : row.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col justify-center">
                          <span className="truncate text-sm font-medium leading-snug text-foreground">
                            {row.first_name} {row.last_name}
                          </span>
                          <span className="truncate text-xs leading-snug text-muted-foreground">@{row.username}</span>
                        </span>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                        {row.already_following ? (
                          <>
                            <button
                              type="button"
                              disabled={followBusyId === row.id}
                              onClick={(e) => {
                                e.preventDefault();
                                void unfollow(row);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-muted/35 text-muted-foreground shadow-none outline-none appearance-none hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-muted/35 disabled:cursor-default disabled:opacity-50 dark:bg-muted/25 dark:text-charcoal-muted dark:hover:bg-muted/40 dark:hover:text-foreground dark:active:bg-muted/25 dark:focus-visible:ring-charcoal-muted/40 dark:focus-visible:ring-offset-card sm:h-7 sm:w-7"
                              aria-label={`Remove follow for ${row.username}`}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <span
                              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-muted text-primary-muted-foreground sm:h-10 sm:w-10"
                              aria-label={`Following ${row.username}`}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            </span>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={followBusyId === row.id}
                            aria-label={`Follow ${row.username}`}
                            onClick={(e) => {
                              e.preventDefault();
                              void follow(row);
                            }}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-[background-color,box-shadow,color,filter] duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:shadow-primary/25 hover:ring-2 hover:ring-primary/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-default disabled:opacity-95 disabled:hover:bg-primary disabled:hover:text-primary-foreground disabled:hover:shadow-sm disabled:hover:ring-0 dark:focus-visible:ring-offset-card sm:h-10 sm:w-10"
                          >
                            <svg
                              className={`h-5 w-5 ${followBusyId === row.id ? "connectplate-follow-plus-spin" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                              aria-hidden
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
