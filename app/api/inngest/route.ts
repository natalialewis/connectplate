import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateRecipePdf } from "@/inngest/functions/generate-recipe-pdf";

/** PDF layout + upload can exceed default serverless limits when deployed. */
export const maxDuration = 300;
export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateRecipePdf],
});
