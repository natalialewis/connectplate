"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  recipeId: string;
};

export function RecipePdfDownloadButton({ recipeId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  const onClick = useCallback(async () => {
    setError(null);
    setLoading(true);
    cancelled.current = false;

    try {
      const res = await fetch(`/api/recipes/${recipeId}/pdf`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { error?: string; jobId?: string };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not start export");
        return;
      }
      const jobId = body.jobId;
      if (!jobId) {
        setError("Invalid response from server");
        return;
      }

      const maxAttempts = 80;
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled.current) {
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
        if (cancelled.current) {
          return;
        }

        const jr = await fetch(`/api/recipes/pdf-jobs/${jobId}`);
        const j = (await jr.json()) as {
          status?: string;
          error?: string;
          downloadUrl?: string;
          filename?: string;
        };

        if (j.status === "failed") {
          setError(typeof j.error === "string" ? j.error : "Export failed");
          return;
        }

        if (j.status === "ready" && j.downloadUrl) {
          const fileRes = await fetch(j.downloadUrl);
          if (!fileRes.ok) {
            setError("Could not download file");
            return;
          }
          const blob = await fileRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = j.filename ?? "recipe.pdf";
          a.rel = "noopener";
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
      }

      setError("Timed out waiting for PDF");
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={loading}
        className="min-h-[2.75rem] shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted/60 disabled:opacity-60 sm:min-h-0"
        aria-busy={loading}
      >
        {loading ? "Preparing PDF…" : "Download PDF"}
      </button>
      {error ? <p className="max-w-[14rem] text-right text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
