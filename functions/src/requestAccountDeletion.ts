import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { umConfig } from "./umConfig";

/**
 * Authenticated callable that allows a user to request deletion of their own
 * account.
 *
 * Steps:
 *  1. Verify the caller is authenticated.
 *  2. Disable the Auth account immediately so the user can no longer sign in.
 *  3. Revoke all active refresh tokens (forces sign-out on all devices).
 *  4. Write a `deletionRequests` document for admin review (the actual data
 *     deletion is a manual admin task — authored articles are NOT deleted here).
 *
 * The caller can only request deletion for their own account (uid from token).
 */
export const requestAccountDeletion = onCall(
  { region: umConfig.region },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email ?? "";

    const auth = getAuth();

    // Disable the account and revoke all sessions immediately.
    await Promise.all([
      auth.updateUser(uid, { disabled: true }),
      auth.revokeRefreshTokens(uid),
    ]);

    // Queue the deletion request for admin review.
    const db = getFirestore();
    await db.collection(umConfig.collections.deletionRequests).add({
      uid,
      email,
      requestedAt: FieldValue.serverTimestamp(),
      status: "pending",
    });
  }
);
