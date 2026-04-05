import { onCall, HttpsError } from "firebase-functions/v2/https";
import { ai } from "./genkit";
import { searchWiki } from "./searchWiki";
import { ragAnswerFlow } from "./ragAnswer";

const TEXT_EMBEDDING_004 = "googleai/text-embedding-004";

/**
 * HTTPS-callable that implements the full RAG pipeline for the AI assistant:
 *   1. Embed the user's question with text-embedding-004
 *   2. Vector-search published articles via searchWiki (server-side only)
 *   3. Build a grounded prompt from the top-3 results
 *   4. Generate an answer with Gemini 2.5 Flash
 *
 * Returns `{ answer: string }`. Sources are included for potential future
 * citation rendering but the UI currently only displays the answer text.
 *
 * Access: any authenticated user with a verified email (mirrors read-query
 * auth level so that users who can read the wiki can also ask questions).
 */
export const askWiki = onCall(
  { region: "europe-north1" },
  async (request): Promise<{ answer: string }> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    if (!request.auth.token.email_verified) {
      throw new HttpsError(
        "permission-denied",
        "Email must be verified to use the AI assistant."
      );
    }

    const { question } = request.data as { question: string };
    if (!question?.trim()) {
      throw new HttpsError("invalid-argument", "Question must not be empty.");
    }

    // Step 1: Embed the user's question into a 768-dim vector.
    const embeddings = await ai.embed({
      embedder: TEXT_EMBEDDING_004,
      content: question,
    });
    const vector = embeddings[0]?.embedding;
    if (!vector?.length) {
      throw new HttpsError("internal", "Embedding API returned an empty vector.");
    }

    // Step 2: Retrieve the top-3 most relevant published articles.
    const articles = await searchWiki(vector, 3);

    // Step 3+4: Build grounded prompt and generate answer (ragAnswerFlow).
    return ragAnswerFlow({ question, contextArticles: articles });
  }
);
