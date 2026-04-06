import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Admin-only callable that rejects a pending access request.
 *
 * Steps (in order):
 *  1. Verify the caller is authenticated and has ADMIN role.
 *  2. Fetch the accessRequest — guard against missing / already-actioned docs.
 *  3. Write a document to the `mail` collection so the "Trigger Email from
 *     Firestore" extension sends the decline notification. No reason is given
 *     in the email body to avoid leaking information.
 *  4. Delete the accessRequest document so the email address is unblocked and
 *     the user can submit a fresh request in the future.
 */
export const rejectAccessRequest = onCall(
  { region: "europe-north1" },
  async (request) => {
    // ── Auth guard ────────────────────────────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== "ADMIN") {
      throw new HttpsError("permission-denied", "Only ADMINs can reject requests.");
    }

    // ── Input validation ──────────────────────────────────────────────────────
    const { requestId } = request.data as { requestId?: unknown };
    if (typeof requestId !== "string" || !requestId) {
      throw new HttpsError("invalid-argument", "A valid `requestId` is required.");
    }

    const db = getFirestore();
    const requestRef = db.collection("accessRequests").doc(requestId);
    const snap = await requestRef.get();

    if (!snap.exists) {
      throw new HttpsError("not-found", "Access request not found.");
    }

    const data = snap.data() as { email: string; status: string };

    if (data.status !== "pending") {
      throw new HttpsError(
        "failed-precondition",
        `Request is already '${data.status}' and cannot be rejected.`
      );
    }

    const recipientEmail = data.email;

    // ── Send decline email (via Trigger Email from Firestore extension) ───────
    //
    // The "Trigger Email from Firestore" extension watches the `mail` collection
    // and delivers every document it finds there. We write here with the Admin
    // SDK so Firestore security rules are bypassed. The `mail` collection rules
    // deny all client reads/writes.
    await db.collection("mail").add({
      to: recipientEmail,
      message: {
        subject: "Update on your access request",
        text: [
          "Hello,",
          "",
          "We have reviewed your access request and unfortunately are unable",
          "to grant access at this time.",
          "",
          "You are welcome to submit a new request in the future.",
          "",
          "— The Pew Pew Wiki team",
        ].join("\n"),
        html: [
          "<p>Hello,</p>",
          "<p>We have reviewed your access request and unfortunately are unable",
          "to grant access at this time.</p>",
          "<p>You are welcome to submit a new request in the future.</p>",
          "<p>— The Pew Pew Wiki team</p>",
        ].join("\n"),
      },
      // Timestamp lets us query/clean up stale mail documents if needed.
      createdAt: FieldValue.serverTimestamp(),
    });

    // ── Delete the accessRequest so the email address is unblocked ────────────
    await requestRef.delete();
  }
);
