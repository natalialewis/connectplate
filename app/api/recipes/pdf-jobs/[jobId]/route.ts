import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  if (!UUID_RE.test(jobId)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from("recipe_pdf_jobs")
    .select("id, status, storage_path, error, recipe_id")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status === "failed") {
    return NextResponse.json({
      status: "failed",
      error: job.error ?? "Unknown error",
    });
  }

  if (job.status !== "ready" || !job.storage_path) {
    return NextResponse.json({
      status: job.status,
    });
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("title")
    .eq("id", job.recipe_id)
    .maybeSingle();

  const title = typeof recipe?.title === "string" ? recipe.title : "recipe";
  const safeName =
    title
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "recipe";

  const { data: signed, error: signError } = await supabase.storage
    .from("recipe-pdfs")
    .createSignedUrl(job.storage_path, 300);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: signError?.message ?? "Could not create download link" }, { status: 500 });
  }

  return NextResponse.json({
    status: "ready",
    downloadUrl: signed.signedUrl,
    filename: `${safeName}.pdf`,
  });
}
