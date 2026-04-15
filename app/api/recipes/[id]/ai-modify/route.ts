import OpenAI from "openai";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MODEL = "gpt-4o-mini";

function buildRecipeContext(input: {
  title: string;
  description: string | null;
  notes: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  ingredients: { raw_line: string }[];
  steps: { step_order: number; body: string }[];
}): string {
  const lines: string[] = [];
  lines.push(`Title: ${input.title}`);
  if (input.description) {
    lines.push(`Description: ${input.description}`);
  }
  if (input.notes) {
    lines.push(`Notes: ${input.notes}`);
  }
  if (input.servings != null) {
    lines.push(`Servings: ${input.servings}`);
  }
  if (input.prep_time_minutes != null) {
    lines.push(`Prep time (min): ${input.prep_time_minutes}`);
  }
  if (input.cook_time_minutes != null) {
    lines.push(`Cook time (min): ${input.cook_time_minutes}`);
  }
  lines.push("");
  lines.push("Ingredients:");
  for (const ing of input.ingredients) {
    lines.push(`- ${ing.raw_line}`);
  }
  lines.push("");
  lines.push("Instructions:");
  const ordered = [...input.steps].sort((a, b) => a.step_order - b.step_order);
  ordered.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.body}`);
  });
  return lines.join("\n");
}

export async function POST(req: NextRequest, routeContext: { params: Promise<{ id: string }> }) {
  const { id: recipeId } = await routeContext.params;
  if (!UUID_RE.test(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI is not configured on the server." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt =
    typeof body === "object" && body !== null && "prompt" in body && typeof (body as { prompt: unknown }).prompt === "string"
      ? (body as { prompt: string }).prompt.trim()
      : "";

  if (prompt.length < 3) {
    return NextResponse.json({ error: "Please enter a question (at least a few characters)." }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: "Question is too long." }, { status: 400 });
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: recipe, error: recipeError } = await supabase.from("recipes").select("*").eq("id", recipeId).maybeSingle();
  if (recipeError || !recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const { data: steps } = await supabase
    .from("recipe_steps")
    .select("step_order, body")
    .eq("recipe_id", recipeId)
    .order("step_order", { ascending: true });

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("raw_line")
    .eq("recipe_id", recipeId)
    .order("sort_order", { ascending: true });

  const recipeContext = buildRecipeContext({
    title: recipe.title as string,
    description: (recipe.description as string | null) ?? null,
    notes: (recipe.notes as string | null) ?? null,
    servings: recipe.servings as number | null,
    prep_time_minutes: recipe.prep_time_minutes as number | null,
    cook_time_minutes: recipe.cook_time_minutes as number | null,
    ingredients: (ingredients ?? []) as { raw_line: string }[],
    steps: (steps ?? []) as { step_order: number; body: string }[],
  });

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful cooking assistant. The user will send a full home recipe and a question about how to change or improve it (e.g. less sodium, vegan swap, scale servings). " +
            "Give practical, food-safe suggestions. Be concise but specific. If you lack critical info, say what you'd need. " +
            "This is not medical or dietary prescription advice—encourage consulting professionals for strict diets or health conditions.",
        },
        {
          role: "user",
          content: `Here is the recipe:\n\n${recipeContext}\n\n---\n\nQuestion:\n${prompt}`,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "No response from the model." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
