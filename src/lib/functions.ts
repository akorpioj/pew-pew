import { getFunctions, httpsCallable } from "firebase/functions";
import app from "./firebase";

const functions = getFunctions(app, "europe-north1");

/**
 * HTTPS-callable reference to the `embedArticle` Cloud Function.
 * Called fire-and-forget after a successful UpsertArticle to populate
 * the Article.embedding vector column for semantic search.
 */
export const embedArticleCallable = httpsCallable<
  { articleId: string; content: unknown[] },
  void
>(functions, "embedArticle");

/**
 * HTTPS-callable reference to the `askWiki` Cloud Function.
 * Full RAG pipeline: embeds the question, searches the wiki, and returns
 * a Gemini-generated answer grounded in the top-3 matching articles.
 */
export const askWikiCallable = httpsCallable<
  { question: string },
  { answer: string }
>(functions, "askWiki");

/** B20 Step 1: embed question + vector-search → returns top matching articles. */
export const searchWikiByQueryCallable = httpsCallable<
  { question: string },
  { articles: { id: string; title: string; slug: string; content: unknown }[] }
>(functions, "searchWikiByQuery");

/** B20 Step 2: grounded answer generation from pre-retrieved context articles. */
export const ragAnswerCallable = httpsCallable<
  { question: string; contextArticles: { title: string; content: unknown }[] },
  { answer: string }
>(functions, "ragAnswer");
