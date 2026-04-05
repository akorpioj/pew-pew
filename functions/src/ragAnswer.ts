import { onCall, HttpsError } from "firebase-functions/v2/https";
import { ai, z } from "./genkit";
import { flattenBlocks } from "./flattenBlocks";
import type { SearchResult } from "./searchWiki";

/**
 * Genkit flow: given a question and a set of pre-retrieved wiki articles,
 * build a grounded prompt and call Gemini to produce an answer.
 *
 * Separating this from the `askWiki` orchestrator means the generation step
 * can be unit-tested and called independently (e.g. from a Genkit Dev UI).
 */
export const ragAnswerFlow = ai.defineFlow(
  {
    name: "ragAnswer",
    inputSchema: z.object({
      question: z.string().describe("The user's original question"),
      contextArticles: z
        .array(
          z.object({
            title: z.string(),
            content: z.unknown().describe("Raw BlockNote Block[] JSON"),
          })
        )
        .describe("Top articles retrieved by vector search"),
    }),
    outputSchema: z.object({
      answer: z.string(),
    }),
  },
  async ({ question, contextArticles }) => {
    // Flatten each article's BlockNote JSON into plain text and build context.
    let contextText = "";
    for (const article of contextArticles) {
      if (article.content) {
        const bodyText = flattenBlocks(
          article.content as Parameters<typeof flattenBlocks>[0]
        );
        if (bodyText) {
          contextText += `## ${article.title}\n${bodyText}\n\n`;
        }
      }
    }

    const prompt = contextText.trim()
      ? `You are an expert assistant for a private knowledge wiki. Answer ONLY using the wiki context below. If the answer is not covered by the context, say "I don't have enough information in the wiki to answer that."

Wiki context:
${contextText.trim()}

Question: ${question}`
      : `The wiki search returned no relevant articles for this topic. Politely tell the user you could not find relevant information in the wiki for: ${question}`;

    const { text } = await ai.generate(prompt);
    return { answer: text };
  }
);

/**
 * HTTPS-callable wrapper for the ragAnswer flow.
 *
 * Accepts `{ question, contextArticles }` directly — callers are responsible
 * for retrieving context articles before calling this (see `askWiki` for the
 * combined embed → search → answer pipeline).
 *
 * Access: any authenticated user with a verified email.
 */
export const ragAnswer = onCall(
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

    const data = request.data as {
      question: string;
      contextArticles: Pick<SearchResult, "title" | "content">[];
    };
    if (!data.question?.trim()) {
      throw new HttpsError("invalid-argument", "Question must not be empty.");
    }

    return ragAnswerFlow({
      question: data.question,
      contextArticles: data.contextArticles ?? [],
    });
  }
);
