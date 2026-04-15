import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { inngest } from "@/inngest/client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: recipeId } = await context.params;
  if (!UUID_RE.test(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .maybeSingle();

  if (recipeError || !recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const { data: job, error: jobError } = await supabase
    .from("recipe_pdf_jobs")
    .insert({
      recipe_id: recipeId,
      user_id: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message ?? "Could not create export job" }, { status: 500 });
  }

  await inngest.send({
    name: "recipe/pdf.requested",
    data: {
      jobId: job.id,
      recipeId,
      userId: user.id,
    },
  });

  return NextResponse.json({ jobId: job.id });
}
