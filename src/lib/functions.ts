import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import app from "./firebase";

const functions = getFunctions(app, "europe-north1");

// Point at the local emulator when running in development.
// The Functions emulator port is set to 5001 in firebase.json.
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}
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

/** UM-2: Submit an access request for a given email address. */
export const requestAccessCallable = httpsCallable<
  { email: string },
  { message: string }
>(functions, "requestAccess");

/** UM-2: Reject a pending access request (sets status, sends decline email, deletes doc). */
export const rejectAccessRequestCallable = httpsCallable<
  { requestId: string },
  void
>(functions, "rejectAccessRequest");

/**
 * UM-2/UM-3: Approve a pending access request.
 * Marks the request as approved and triggers the invite flow (sendInvite).
 */
export const approveAccessRequestCallable = httpsCallable<
  { requestId: string; email: string },
  void
>(functions, "approveAccessRequest");

/** UM-3: Send a direct invite to an email address (bypasses access-request flow). */
export const sendInviteCallable = httpsCallable<
  { email: string },
  void
>(functions, "sendInvite");

/** UM-4: List all Firebase Auth users with role and disabled status. */
export const listUsersCallable = httpsCallable<
  void,
  {
    users: {
      uid: string;
      email: string;
      displayName: string | null;
      role: string;
      disabled: boolean;
    }[];
  }
>(functions, "listUsers");

/** UM-4: Disable a user's Firebase Auth account and revoke all active sessions. */
export const revokeUserAccessCallable = httpsCallable<{ uid: string }, void>(
  functions,
  "revokeUserAccess"
);

/** UM-4: Re-enable a previously disabled Firebase Auth account. */
export const restoreUserAccessCallable = httpsCallable<{ uid: string }, void>(
  functions,
  "restoreUserAccess"
);

/** UM-4: Set a user's role (EXPERT / VIEWER for UM-4.3; ADMIN via UM-4.4). */
export const setUserRoleCallable = httpsCallable<
  { uid: string; role: "ADMIN" | "EXPERT" | "VIEWER" },
  { success: boolean; uid: string; role: string }
>(functions, "setUserRole");

/** UM-4: Trigger a password-reset email to be sent to a user (admin action). */
export const sendPasswordResetCallable = httpsCallable<{ uid: string }, void>(
  functions,
  "sendPasswordReset"
);

/** UM-5: Self-service password reset — rate-limited, always returns neutral response. */
export const requestPasswordResetCallable = httpsCallable<
  { email: string },
  { message: string }
>(functions, "requestPasswordReset");

/** UM-6: Disable user's own Auth account and queue a data deletion request. */
export const requestAccountDeletionCallable = httpsCallable<void, void>(
  functions,
  "requestAccountDeletion"
);
