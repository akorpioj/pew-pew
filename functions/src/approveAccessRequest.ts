import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { sendInviteInternal } from "./sendInvite";
import { writeAuditLog } from "./auditLog";

/**
 * Admin-only callable that approves a pending access request.
 *
 * Steps:
 *  1. Verify the caller is authenticated and has ADMIN role.
 *  2. Fetch the accessRequest — guard against missing / already-actioned docs.
 *  3. Mark the request as `approved` so it no longer appears in the pending list.
 *  4. Delegate to `sendInviteInternal` which creates the Auth account, upserts
 *     the Data Connect User row, generates the email sign-in link, and queues
 *     the invite email.
 */
export const approveAccessRequest = onCall(
  { region: "europe-north1" },
  async (request) => {
    // ── Auth guard ────────────────────────────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== "ADMIN") {
      throw new HttpsError("permission-denied", "Only ADMINs can approve requests.");
    }

    // ── Input validation ──────────────────────────────────────────────────────
    const { requestId, email } = request.data as {
      requestId?: unknown;
      email?: unknown;
    };
    if (typeof requestId !== "string" || !requestId) {
      throw new HttpsError("invalid-argument", "A valid `requestId` is required.");
    }
    if (typeof email !== "string" || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "A valid `email` is required.");
    }

    const db = getFirestore();
    const requestRef = db.collection("accessRequests").doc(requestId);
    const snap = await requestRef.get();

    if (!snap.exists) {
      throw new HttpsError("not-found", "Access request not found.");
    }

    const data = snap.data() as { status: string };
    if (data.status !== "pending") {
      throw new HttpsError(
        "failed-precondition",
        `Request is already '${data.status}' and cannot be approved.`
      );
    }

    // ── Mark as approved ──────────────────────────────────────────────────────
    await requestRef.update({
      status: "approved",
      approvedAt: FieldValue.serverTimestamp(),
    });

    // ── Delegate to the invite flow ───────────────────────────────────────────
    await sendInviteInternal(email.trim().toLowerCase());

    // ── Audit log ─────────────────────────────────────────────────────────────
    // Resolve target UID for the log entry (created by sendInviteInternal).
    try {
      const targetUser = await getAuth().getUserByEmail(email.trim().toLowerCase());
      await writeAuditLog(request.auth.uid, targetUser.uid, "invite_approved");
    } catch {
      // Non-fatal: audit failure must not roll back the approval.
    }
  }
);
