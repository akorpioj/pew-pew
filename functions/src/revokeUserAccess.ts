import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { writeAuditLog } from "./auditLog";
import { umConfig } from "./umConfig";

/**
 * Admin-only callable that disables a Firebase Auth account (soft delete).
 *
 * - Sets `disabled: true` on the Auth account — the user can no longer sign in.
 * - Revokes all active refresh tokens, forcing immediate sign-out on all devices.
 * - Does NOT delete the Auth account, User row, or any authored articles.
 *
 * The disabled status is the source of truth (no separate DC field). The
 * `listUsers` callable already reads `disabled` from Firebase Auth directly.
 *
 * Guards:
 *  - Caller must be ADMIN.
 *  - Admin cannot revoke their own access.
 */
export const revokeUserAccess = onCall(
  { region: umConfig.region },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== umConfig.roles.admin) {
      throw new HttpsError("permission-denied", "Only ADMINs can revoke access.");
    }

    const { uid } = request.data as { uid?: unknown };
    if (typeof uid !== "string" || !uid) {
      throw new HttpsError("invalid-argument", "A valid `uid` is required.");
    }

    if (uid === request.auth.uid) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot revoke your own access."
      );
    }

    const auth = getAuth();

    // Verify the target user actually exists before acting.
    await auth.getUser(uid);

    // Disable the account and invalidate all existing sessions simultaneously.
    await Promise.all([
      auth.updateUser(uid, { disabled: true }),
      auth.revokeRefreshTokens(uid),
    ]);

    await writeAuditLog(request.auth.uid, uid, "access_revoked");
  }
);

/**
 * Admin-only callable that re-enables a previously disabled Firebase Auth account.
 *
 * Guards:
 *  - Caller must be ADMIN.
 */
export const restoreUserAccess = onCall(
  { region: umConfig.region },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== umConfig.roles.admin) {
      throw new HttpsError("permission-denied", "Only ADMINs can restore access.");
    }

    const { uid } = request.data as { uid?: unknown };
    if (typeof uid !== "string" || !uid) {
      throw new HttpsError("invalid-argument", "A valid `uid` is required.");
    }

    const auth = getAuth();
    await auth.getUser(uid);
    await auth.updateUser(uid, { disabled: false });

    await writeAuditLog(request.auth.uid, uid, "access_restored");
  }
);
