"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLogout } from "@/lib/hooks/useLogout";
import { useProfile } from "@/lib/hooks/useProfile";

export function AuthNav() {
  const { user: authUser, loading } = useAuth();
  const { profile } = useProfile();
  const { logout } = useLogout();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openedByKeyboardRef = useRef(false);

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);

  // Handles various ways of closing the dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, closeDropdown]);

  // Focus first focusable item only when dropdown was opened with keyboard (tab + Enter/Space)
  useEffect(() => {
    if (!dropdownOpen || !dropdownRef.current || !openedByKeyboardRef.current) return;
    const focusable = dropdownRef.current.querySelector<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    focusable?.focus();
    openedByKeyboardRef.current = false;
  }, [dropdownOpen]);

  const user = authUser
    ? {
        firstName:
          profile?.first_name ??
          (authUser.user_metadata?.first_name as string) ??
          "",
        avatarUrl: profile?.avatar_url ?? undefined,
      }
    : null;

  if (loading) {
    return (
      <div className="h-9 w-9 min-w-[2.25rem] animate-pulse rounded-full bg-muted sm:min-w-0" aria-hidden />
    );
  }

  // If the user is logged in, display the avatar with the dropdown menu
  if (user) {
    return (
      <div className="relative flex items-center gap-2 sm:gap-3">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              openedByKeyboardRef.current = true;
            }
          }}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse") {
              openedByKeyboardRef.current = false;
            }
          }}
          className="flex h-9 w-9 min-w-[2.25rem] items-center justify-center overflow-hidden rounded-full border-1 border-charcoal-muted bg-muted transition-transform duration-150 ease-out active:scale-95 ring-offset-2 ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-controls="user-menu"
          id="user-menu-trigger"
          title="Open account menu"
        >
          {/* If the user has an avatar, display it, if not, display the first letter of the first name */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground"
              aria-hidden
            >
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : "?"}
            </span>
          )}
        </button>
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            id="user-menu"
            role="menu"
            aria-labelledby="user-menu-trigger"
            className="absolute right-0 top-full z-50 mt-2 w-[min(12rem,calc(100vw-2rem))] min-w-40 rounded-lg border border-border bg-card py-1 shadow-lg sm:w-48 sm:min-w-0"
          >
            <Link
              href="/settings"
              role="menuitem"
              className="block min-h-[2.75rem] px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-none sm:min-h-0 sm:py-2 md:text-base"
              onClick={closeDropdown}
            >
              Settings
            </Link>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              role="menuitem"
              className="block w-full min-h-[2.75rem] px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-none sm:min-h-0 sm:py-2 md:text-base"
              onClick={() => {
                closeDropdown();
                logout();
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  // If the user is not logged in, display the login and sign up links
  return (
    <nav aria-label="Authentication">
      <ul className="flex items-center gap-1.5 sm:gap-2">
        <li>
          <Link
            href="/login"
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:py-2 md:text-base"
          >
            Log in
          </Link>
        </li>
        <li>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:py-2 md:text-base"
          >
            Sign up
          </Link>
        </li>
      </ul>
    </nav>
  );
}
