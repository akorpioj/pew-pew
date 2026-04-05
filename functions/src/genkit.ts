import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

/**
 * Shared Genkit instance for all Cloud Function flows.
 *
 * Auth: set GEMINI_API_KEY in the Cloud Function environment (Secret Manager
 * recommended — see Phase 5 deployment notes).
 *
 * Default model: gemini-2.5-flash (used by ragAnswer).
 * Embedding model: text-embedding-004 (768-dim, used by embedArticle).
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash"),
});

export { z };
