import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NonRetriableError } from "inngest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RecipePdfDocument } from "@/lib/recipes/pdf/recipe-pdf-document";
import type { RecipePdfIngredient, RecipePdfRecipe, RecipePdfStep } from "@/lib/recipes/pdf/types";
import { inngest } from "../client";

type PdfPayload = {
  jobId: string;
  recipeId: string;
  userId: string;
};

export const generateRecipePdf = inngest.createFunction(
  {
    id: "generate-recipe-pdf",
    name: "Generate recipe PDF",
    triggers: [{ event: "recipe/pdf.requested" }],
    onFailure: async ({ event, error }) => {
      const original = event.data.event as { data?: PdfPayload };
      const payload = original.data;
      if (!payload?.jobId || !payload.userId) {
        return;
      }
      const admin = createSupabaseAdminClient();
      await admin
        .from("recipe_pdf_jobs")
        .update({
          status: "failed",
          error: error.message ?? String(error),
        })
        .eq("id", payload.jobId)
        .eq("user_id", payload.userId);
    },
  },
  async ({ event, step, logger }) => {
    const { jobId, recipeId, userId } = event.data as PdfPayload;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      throw new NonRetriableError("SUPABASE_SERVICE_ROLE_KEY is missing; PDF export cannot run.");
    }

    const loaded = await step.run("load-recipe-data", async () => {
      logger.info("recipe-pdf: load-recipe-data start", { jobId, recipeId });
      const admin = createSupabaseAdminClient();

      await admin
        .from("recipe_pdf_jobs")
        .update({ status: "processing" })
        .eq("id", jobId)
        .eq("user_id", userId);

      const { data: recipeRow, error: recipeError } = await admin
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .maybeSingle();

      if (recipeError || !recipeRow) {
        throw new Error(recipeError?.message ?? "Recipe not found");
      }

      const recipe = recipeRow as RecipePdfRecipe & { owner_id: string; id: string };
      const canAccess = recipe.is_public || recipe.owner_id === userId;
      if (!canAccess) {
        throw new Error("Not allowed to export this recipe");
      }

      const { data: stepRows, error: stepsError } = await admin
        .from("recipe_steps")
        .select("step_order, body")
        .eq("recipe_id", recipeId)
        .order("step_order", { ascending: true });

      if (stepsError) {
        throw new Error(stepsError.message);
      }

      const { data: ingRows, error: ingError } = await admin
        .from("recipe_ingredients")
        .select("raw_line")
        .eq("recipe_id", recipeId)
        .order("sort_order", { ascending: true });

      if (ingError) {
        throw new Error(ingError.message);
      }

      const r: RecipePdfRecipe = {
        title: recipe.title,
        description: recipe.description,
        notes: recipe.notes,
        servings: recipe.servings,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        is_public: recipe.is_public,
        nutrition_total: recipe.nutrition_total as Record<string, unknown> | null,
      };

      logger.info("recipe-pdf: load-recipe-data done", {
        jobId,
        steps: (stepRows ?? []).length,
        ingredients: (ingRows ?? []).length,
      });
      return {
        recipe: r,
        steps: (stepRows ?? []) as RecipePdfStep[],
        ingredients: (ingRows ?? []) as RecipePdfIngredient[],
      };
    });

    await step.run("render-upload-finalize", async () => {
      logger.info("recipe-pdf: render-upload-finalize start", { jobId });
      const admin = createSupabaseAdminClient();
      const pdfBuffer = await renderToBuffer(
        <RecipePdfDocument
          recipe={loaded.recipe}
          steps={loaded.steps}
          ingredients={loaded.ingredients}
        />,
      );

      const path = `${userId}/${jobId}.pdf`;
      const { error: uploadError } = await admin.storage.from("recipe-pdfs").upload(path, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { error: updateError } = await admin
        .from("recipe_pdf_jobs")
        .update({ status: "ready", storage_path: path, error: null })
        .eq("id", jobId)
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      logger.info("recipe-pdf: render-upload-finalize done", { jobId, path });
      return { path };
    });

    return { ok: true as const };
  },
);
