import Image from "next/image";
import Link from "next/link";
import { AuthNav } from "./AuthNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo and name */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded font-semibold text-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full"
          />
          <span>ConnectPlate</span>
        </Link>

        {/* Auth and theme toggle */}
        <div className="flex items-center gap-3">
          <AuthNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
