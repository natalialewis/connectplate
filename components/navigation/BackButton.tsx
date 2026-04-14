"use client";

import { useRouter } from "next/navigation";

type Props = {
  fallbackHref?: string;
  label?: string;
  ariaLabel?: string;
};

export function BackButton({
  fallbackHref = "/",
  label = "Back",
  ariaLabel = "Go back",
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="flex items-center gap-2 rounded-lg px-2 py-2 text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={ariaLabel}
    >
      <svg
        className="h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
      <span className="text-sm font-medium sm:text-base">{label}</span>
    </button>
  );
}
