import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export interface UserRecord {
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  disabled: boolean;
}

/**
 * Admin-only callable that returns all Firebase Auth users enriched with their
 * custom `role` claim.
 *
 * Firebase Auth's `listUsers` is paginated (max 1000 per page). This function
 * iterates all pages and returns the full list. For wikis of this scale the
 * total is expected to be small (< few hundred), so returning everything in
 * one call is acceptable.
 */
export const listUsers = onCall(
  { region: "europe-north1" },
  async (request): Promise<{ users: UserRecord[] }> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== "ADMIN") {
      throw new HttpsError("permission-denied", "Only ADMINs can list users.");
    }

    const auth = getAuth();
    const users: UserRecord[] = [];
    let pageToken: string | undefined;

    do {
      const result = await auth.listUsers(1000, pageToken);
      for (const user of result.users) {
        users.push({
          uid: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? null,
          role: (user.customClaims?.["role"] as string | undefined) ?? "VIEWER",
          disabled: user.disabled,
        });
      }
      pageToken = result.pageToken;
    } while (pageToken);

    // Sort: active first, then alphabetically by email.
    users.sort((a, b) => {
      if (a.disabled !== b.disabled) return a.disabled ? 1 : -1;
      return a.email.localeCompare(b.email);
    });

    return { users };
  }
);
