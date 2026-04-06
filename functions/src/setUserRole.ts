import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getDataConnect } from "firebase-admin/data-connect";
import { writeAuditLog } from "./auditLog";

export type UserRole = "ADMIN" | "EXPERT" | "VIEWER";

const connectorConfig = {
  location: "europe-north1",
  serviceId: "pew-pew",
  connector: "pew-pew-connector",
};

/**
 * Admin-only callable that updates a user's role custom claim and syncs the
 * `role` field in the Data Connect `User` table.
 *
 * Guards:
 *  - Caller must be ADMIN.
 *  - `role` must be one of: ADMIN, EXPERT, VIEWER.
 *
 * Note: granting ADMIN role is additionally guarded on the client (confirmation
 * dialog + last-admin check — see UM-4.4). The function itself accepts all
 * valid roles so the same endpoint can be reused.
 */
export const setUserRole = onCall(
  { region: "europe-north1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== "ADMIN") {
      throw new HttpsError(
        "permission-denied",
        "Only ADMINs can change user roles."
      );
    }

    const { uid, role } = request.data as { uid?: unknown; role?: unknown };

    if (typeof uid !== "string" || !uid) {
      throw new HttpsError("invalid-argument", "A valid `uid` is required.");
    }

    const validRoles: UserRole[] = ["ADMIN", "EXPERT", "VIEWER"];
    if (!validRoles.includes(role as UserRole)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid role. Must be one of: ${validRoles.join(", ")}`
      );
    }

    const auth = getAuth();

    // Verify target exists and get their email for the DC upsert.
    const targetUser = await auth.getUser(uid);
    const targetCurrentRole =
      (targetUser.customClaims?.["role"] as string | undefined) ?? "VIEWER";

    // Guard: admin cannot demote themselves.
    if (uid === request.auth.uid && targetCurrentRole === "ADMIN" && role !== "ADMIN") {
      throw new HttpsError(
        "failed-precondition",
        "You cannot remove your own ADMIN role."
      );
    }

    // Guard: prevent removing the last ADMIN.
    if (targetCurrentRole === "ADMIN" && role !== "ADMIN") {
      // Count remaining admins (excluding the target being demoted).
      let adminCount = 0;
      let nextPageToken: string | undefined;
      do {
        const result = await auth.listUsers(1000, nextPageToken);
        for (const u of result.users) {
          if (
            u.uid !== uid &&
            (u.customClaims?.["role"] as string | undefined) === "ADMIN" &&
            !u.disabled
          ) {
            adminCount++;
          }
        }
        nextPageToken = result.pageToken;
      } while (nextPageToken);

      if (adminCount === 0) {
        throw new HttpsError(
          "failed-precondition",
          "Cannot demote the last ADMIN account."
        );
      }
    }

    // Update the custom claim (takes effect on next token refresh / force-refresh).
    await auth.setCustomUserClaims(uid, { role });

    // Sync the role field in Data Connect so the User table stays consistent.
    const dc = getDataConnect(connectorConfig);
    await dc.upsert("user", {
      id: uid,
      email: targetUser.email ?? "",
      role: role as UserRole,
    });

    // ── Audit log ─────────────────────────────────────────────────────────────
    await writeAuditLog(request.auth.uid, uid, "role_changed", {
      previousRole: targetCurrentRole,
      newRole: role,
    });

    return { success: true, uid, role };
  }
);
