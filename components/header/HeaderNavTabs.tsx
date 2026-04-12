"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";

function tabClassName(active: boolean): string {
  return [
    "rounded-md px-1.5 py-1.5 text-sm font-medium transition-colors sm:px-2.5 md:text-base",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "bg-muted/90 text-foreground shadow-sm"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  ].join(" ");
}

function TabDivider() {
  return <span className="h-[1.125rem] w-px shrink-0 bg-border" aria-hidden />;
}

export function HeaderNavTabs() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || !user) {
    return null;
  }

  const feedActive = pathname === "/";
  const recipesActive = pathname === "/recipes" || pathname.startsWith("/recipes/");
  const profileHref = profile?.username ? `/profile/${profile.username}` : null;
  const profileActive =
    !!profileHref && (pathname === profileHref || pathname.startsWith(`${profileHref}/`));

  return (
    <nav className="flex items-center gap-2 sm:gap-3 md:gap-4" aria-label="Main navigation">
      <Link href="/" className={tabClassName(feedActive)}>
        Feed
      </Link>
      <TabDivider />
      <Link href="/recipes" className={tabClassName(recipesActive)}>
        Recipes
      </Link>
      {profileLoading ? (
        <>
          <TabDivider />
          <span
            className="rounded-md px-1.5 py-1.5 text-sm font-medium text-muted-foreground/70 sm:px-2.5 md:text-base"
            aria-hidden
          >
            Profile
          </span>
        </>
      ) : profileHref ? (
        <>
          <TabDivider />
          <Link href={profileHref} className={tabClassName(profileActive)}>
            Profile
          </Link>
        </>
      ) : null}
    </nav>
  );
}
