import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-background px-4 py-10">
      <main className="w-full max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Sign-in error</h1>
        <p className="mt-3 text-base text-muted-foreground">
          We could not complete sign-in with Google. The link may have expired, or something went wrong on the way back from Google.
        </p>
        <p className="mt-6">
          <Link
            href="/login"
            className="font-semibold text-primary underline underline-offset-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Return to log in
          </Link>
        </p>
      </main>
    </div>
  );
}
