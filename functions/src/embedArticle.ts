import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getDataConnect } from "firebase-admin/data-connect";
import { ai, z } from "./genkit";
import { flattenBlocks } from "./flattenBlocks";

// String-form embedder ID — avoids the typed model-name union restriction in
// googleAI.embedder() while still routing through the Google AI plugin.
const TEXT_EMBEDDING_004 = "googleai/text-embedding-004";

const connectorConfig = {
  location: "europe-north1",
  serviceId: "pew-pew",
  connector: "pew-pew-connector",
};

/**
 * Genkit flow: flatten BlockNote JSON → embed via text-embedding-004 →
 * write the 768-dim vector back to the Article.embedding column.
 *
 * This is the core "write path" for semantic search. It is intentionally
 * a separate step from UpsertArticle so that:
 *  - Upsert stays fast and always succeeds even when the AI API is slow/down.
 *  - Embedding can be retried independently without re-saving content.
 */
const embedArticleFlow = ai.defineFlow(
  {
    name: "embedArticle",
    inputSchema: z.object({
      articleId: z.string().describe("UUID of the article to embed"),
      content: z.array(z.any()).describe("BlockNote Block[] JSON array"),
    }),
    outputSchema: z.void(),
  },
  async ({ articleId, content }) => {
    // 1. Flatten BlockNote JSON to plain text
    const text = flattenBlocks(content);
    if (!text) return; // nothing to embed (empty article)

    // 2. Generate 768-dim embedding via Google AI text-embedding-004
    const embeddings = await ai.embed({
      embedder: TEXT_EMBEDDING_004,
      content: text,
    });
    const vector = embeddings[0]?.embedding;
    if (!vector?.length) {
      throw new Error("Embedding API returned an empty vector.");
    }

    // 3. Write the vector back to the Article row via the Data Connect Admin SDK.
    //    The Admin SDK bypasses @auth, so we call it directly without a claim check.
    const dc = getDataConnect(connectorConfig);
    await dc.executeGraphql(
      `mutation UpdateEmbedding($id: UUID!, $embedding: Vector!) {
          article_update(id: $id, data: { embedding: $embedding })
        }`,
      { variables: { id: articleId, embedding: vector } }
    );
  }
);

/**
 * HTTPS-callable Cloud Function wrapping the embedArticle Genkit flow.
 *
 * Access: EXPERT and ADMIN only — mirrors the UpsertArticle write-guard so
 * that a compromised VIEWER token cannot trigger spurious embedding writes.
 *
 * Client usage (ArticleEditorPage, B13):
 *   const embedArticle = httpsCallable(functions, "embedArticle");
 *   await embedArticle({ articleId, content });
 */
export const embedArticle = onCall(
  { region: "europe-north1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const role = request.auth.token["role"] as string | undefined;
    if (role !== "EXPERT" && role !== "ADMIN") {
      throw new HttpsError(
        "permission-denied",
        "Only EXPERT or ADMIN can trigger article embedding."
      );
    }

    await embedArticleFlow(request.data);
  }
);
