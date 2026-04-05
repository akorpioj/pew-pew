import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export type UserRole = "ADMIN" | "EXPERT" | "VIEWER";

interface SetUserRoleRequest {
  uid: string;
  role: UserRole;
}

/**
 * HTTPS-callable function that sets a custom role claim on a Firebase Auth user.
 *
 * Security rules:
 *  - Caller must be authenticated.
 *  - Caller's own JWT must carry `role: 'ADMIN'` — only ADMINs can promote/demote others.
 *
 * Usage from the client:
 *   const setUserRole = httpsCallable(functions, "setUserRole");
 *   await setUserRole({ uid: "<target-uid>", role: "EXPERT" });
 */
export const setUserRole = onCall(
  { region: "europe-north1" },
  async (request) => {
    // 1. Caller must be authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    // 2. Caller must be ADMIN
    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== "ADMIN") {
      throw new HttpsError(
        "permission-denied",
        "Only ADMINs can change user roles."
      );
    }

    // 3. Validate request body
    const { uid, role } = request.data as SetUserRoleRequest;

    if (!uid || typeof uid !== "string") {
      throw new HttpsError("invalid-argument", "A valid `uid` is required.");
    }

    const validRoles: UserRole[] = ["ADMIN", "EXPERT", "VIEWER"];
    if (!validRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid role. Must be one of: ${validRoles.join(", ")}`
      );
    }

    // 4. Set the custom claim
    await getAuth().setCustomUserClaims(uid, { role });

    return { success: true, uid, role };
  }
);
