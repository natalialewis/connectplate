"use client";

import { useCallback, useEffect, useId, useState } from "react";

type Props = {
  recipeId: string;
};

function SparklesIcon({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `ai-sparkle-grad-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="50%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="#e8b4a0" />
        </linearGradient>
      </defs>
      <path
        d="M10 20C10 15.5817 6.41828 12 2 12C6.41828 12 10 8.41828 10 4C10 8.41828 13.5817 12 18 12C13.5817 12 10 15.5817 10 20Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M19 11C19 9.34315 17.6569 8 16 8C17.6569 8 19 6.65685 19 5C19 6.65685 20.3431 8 22 8C20.3431 8 19 9.34315 19 11Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M20 21C20 20.1716 19.3284 19.5 18.5 19.5C19.3284 19.5 20 18.8284 20 18C20 18.8284 20.6716 19.5 21.5 19.5C20.6716 19.5 20 20.1716 20 21Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

export function RecipeAiModifyButton({ recipeId }: Props) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const submit = useCallback(async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 3 || loading) {
      return;
    }
    setLoading(true);
    setError(null);
    setReply(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/ai-modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; reply?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Request failed");
        return;
      }
      if (typeof data.reply === "string") {
        setReply(data.reply);
      } else {
        setError("Unexpected response");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [recipeId, prompt, loading]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setReply(null);
          setError(null);
          setPrompt("");
        }}
        className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 shadow-sm hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-950 sm:min-h-0"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        <SparklesIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
        Modify recipe
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close modify recipe dialog"
            className="fixed inset-0 z-[100] cursor-default bg-foreground/20 backdrop-blur-[2px] transition-opacity dark:bg-black/50"
            onClick={close}
          />
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            aria-busy={loading}
            className="fixed left-1/2 top-1/2 z-[110] w-[min(calc(100vw-2rem),42rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary p-[2px] shadow-[0_8px_32px_rgba(35,34,37,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          >
            <div className="flex max-h-[min(48rem,90vh)] flex-col overflow-hidden rounded-[14px] bg-white dark:bg-card">
              <div className="relative flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <h2 id={`${dialogId}-title`} className="pr-10 text-base font-semibold text-foreground">
                  Modify recipe
                </h2>
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-card sm:right-4"
                  aria-label="Close"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="min-h-[12rem] flex-1 overflow-y-auto px-4 py-4 sm:min-h-[14rem] sm:px-5">
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10" aria-live="polite">
                    <span className="flex gap-1" aria-hidden>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                    </span>
                    <p className="text-sm text-muted-foreground">Generating a suggestion…</p>
                  </div>
                ) : null}
                {reply ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{reply}</p> : null}
                {!loading && !reply && !error ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Ask the AI how you&apos;d like to change your recipe! Note: nutritional suggestions are for inspiration
                    only—please use them at your own discretion.
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 border-t border-border p-4 sm:p-5">
                <label className="sr-only" htmlFor={`${dialogId}-input`}>
                  Your question
                </label>
                <textarea
                  id={`${dialogId}-input`}
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  disabled={loading}
                  placeholder="e.g. How can I make this recipe have less sodium?"
                  className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-ring/40 dark:bg-muted/20 sm:py-2"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={loading || prompt.trim().length < 3}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
                  >
                    {loading ? "Sending…" : "Ask"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
