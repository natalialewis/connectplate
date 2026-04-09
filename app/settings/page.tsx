import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto w-full max-w-2xl">
        <div className="mb-4 h-full flex items-center justify-between sm:mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Back to home"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-medium sm:text-base">Back</span>
          </Link>
        </div>

        <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base md:text-lg">
          Options can be added here.
        </p>
      </main>
    </div>
  );
}
