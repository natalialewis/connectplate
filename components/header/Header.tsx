"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "./AuthNav";
import { HeaderNavTabs } from "./HeaderNavTabs";
import { HeaderSearch } from "./HeaderSearch";

export function Header() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-white shadow-[0_2px_5px_rgba(0,0,0,0.12)] dark:bg-card"
      role="banner"
    >
      <div
        className={`mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-2 gap-y-3 px-4 py-3 sm:gap-x-4 sm:px-6 lg:h-12 lg:flex-nowrap lg:gap-y-0 lg:py-0 ${isAuthPage ? "justify-center" : ""}`}
      >
        {isAuthPage ? (
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1 rounded font-semibold text-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="h-7 w-7 shrink-0 rounded-full"
            />
            <span className="text-xl font-bold tracking-tight sm:text-2xl">ConnectPlate</span>
          </Link>
        ) : (
          <>
            <div className="order-1 flex shrink-0 items-center justify-start lg:order-1">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-1 rounded font-semibold text-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Image
                  src="/logo.png"
                  alt=""
                  width={40}
                  height={40}
                  priority
                  className="h-7 w-7 shrink-0 rounded-full"
                />
                <span className="text-xl font-bold tracking-tight sm:text-2xl">ConnectPlate</span>
              </Link>
            </div>

            <div className="order-3 flex w-full min-w-0 justify-center px-1 sm:px-2 lg:order-2 lg:max-w-none lg:flex-1 lg:justify-center">
              <HeaderSearch />
            </div>

            <div className="order-2 flex min-w-0 flex-1 items-center justify-end gap-4 sm:gap-5 md:gap-6 lg:order-3 lg:flex-none lg:shrink-0">
              <HeaderNavTabs />
              <AuthNav />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
