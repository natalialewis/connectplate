"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "./AuthNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-white shadow-[0_2px_5px_rgba(0,0,0,0.12)] dark:bg-card"
      role="banner"
    >
      <div
        className={`mx-auto flex h-12 max-w-[90rem] items-center px-4 sm:px-6 ${isAuthPage ? "justify-center" : "justify-between"}`}
      >
        <Link
          href="/"
          className="flex items-center gap-1 rounded font-semibold text-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

        {!isAuthPage && (
          <div className="flex items-center gap-3">
            <AuthNav />
            <ThemeToggle />
          </div>
        )}
      </div>
    </header>
  );
}
