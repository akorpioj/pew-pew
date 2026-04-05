import { onCall, HttpsError } from "firebase-functions/v2/https";
import { ai } from "./genkit";
import { searchWiki, type SearchResult } from "./searchWiki";

const TEXT_EMBEDDING_004 = "googleai/text-embedding-004";

/**
 * HTTPS-callable: Step 1 of the client-side RAG pipeline.
 *
 * Accepts `{ question: string }`, embeds the question server-side
 * (the client cannot embed — Vector input is not serialisable by the
 * Data Connect client SDK), and returns the top-3 most relevant published
 * wiki articles as `{ articles: SearchResult[] }`.
 *
 * The caller then passes these articles to the `ragAnswer` callable (Step 2)
 * along with the original question to generate a grounded answer.
 *
 * Access: any authenticated user with a verified email.
 */
export const searchWikiByQuery = onCall(
  { region: "europe-north1" },
  async (request): Promise<{ articles: SearchResult[] }> => {
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

    // Embed the question into a 768-dim vector.
    const embeddings = await ai.embed({
      embedder: TEXT_EMBEDDING_004,
      content: question,
    });
    const vector = embeddings[0]?.embedding;
    if (!vector?.length) {
      throw new HttpsError("internal", "Embedding API returned an empty vector.");
    }

    // Vector-search published articles via the Admin SDK (server-side only).
    const articles = await searchWiki(vector, 3);
    return { articles };
  }
);
