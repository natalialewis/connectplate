import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="min-h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto w-full max-w-2xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Welcome{user ? `, ${user.user_metadata?.first_name} ${user.user_metadata?.last_name}` : ""}!
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg">Welcome to ConnectPlate.</p>
        <p className="mt-2 text-base text-muted-foreground sm:mt-3 sm:text-lg">
          <span className="font-medium">Authentication status:</span> {user ? "Logged In" : "Not Logged In"}
        </p>
        <div className="mt-6 flex flex-col justify-center items-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
          {user ? (
            <Link
              href="/profile"
              className="w-1/4 rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:w-auto"
            >
              Profile
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="w-1/4 rounded-lg border border-border bg-card px-5 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:w-auto"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="w-1/4 rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:w-auto"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
