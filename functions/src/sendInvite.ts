import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getDataConnect } from "firebase-admin/data-connect";
import { logger } from "firebase-functions";
import { writeAuditLog } from "./auditLog";

const connectorConfig = {
  location: "europe-north1",
  serviceId: "pew-pew",
  connector: "pew-pew-connector",
};

/**
 * APP_URL is the base URL of the deployed web app, e.g. https://pew-bab23.web.app
 * Set via:  firebase functions:secrets:set APP_URL   — or add to functions/.env
 */
const appUrl = defineString("APP_URL", { default: "http://localhost:5173" });

/**
 * Shared invite logic called by both the `sendInvite` callable (direct admin
 * invite) and `approveAccessRequest` (approve a pending access request).
 *
 * Steps:
 *  1. Create (or retrieve) the Firebase Auth account for the email.
 *  2. Upsert the User row in Data Connect with role VIEWER.
 *     (`syncUserOnSignup` also runs after `createUser`, but we upsert here too
 *      for resilience — upsert is idempotent.)
 *  3. Generate an email sign-in link pointing at /accept-invite.
 *     The link expires according to the Firebase Console → Auth → Templates
 *     setting (configure to 72 h there).
 *  4. Write a `mail` document so the Trigger Email extension sends the invite.
 */
export async function sendInviteInternal(email: string): Promise<void> {
  const auth = getAuth();
  const db = getFirestore();
  const dc = getDataConnect(connectorConfig);

  // ── 1. Create auth user (idempotent: reuse if already exists) ────────────
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    logger.info("sendInvite: reusing existing Auth user", { email, uid });
  } catch (err: unknown) {
    // @ts-expect-error -- Firebase Admin errors have a `code` property
    if (err?.code === "auth/user-not-found") {
      const created = await auth.createUser({ email, emailVerified: false });
      uid = created.uid;
      logger.info("sendInvite: created new Auth user", { email, uid });
    } else {
      throw err;
    }
  }

  // ── 2. Upsert User row in Data Connect ───────────────────────────────────
  try {
    await dc.upsert("user", { id: uid, email, role: "VIEWER" });
  } catch (err) {
    // Log but don't abort — syncUserOnSignup will also attempt this on first
    // sign-in, so a transient DC error here is recoverable.
    logger.error("sendInvite: failed to upsert User row in Data Connect", {
      uid,
      email,
      err,
    });
  }

  // ── 3. Generate email sign-in link ───────────────────────────────────────
  const continueUrl = `${appUrl.value()}/accept-invite`;
  const link = await auth.generateSignInWithEmailLink(email, {
    url: continueUrl,
    handleCodeInApp: true,
  });

  // ── 4. Queue invite email via Trigger Email extension ────────────────────
  await db.collection("mail").add({
    to: email,
    message: {
      subject: "You've been invited to Pew Pew Wiki",
      text: [
        "Hello,",
        "",
        "You have been granted access to Pew Pew Wiki.",
        "",
        "Click the link below to set up your account:",
        link,
        "",
        "This link expires in 72 hours. If it has expired, please contact",
        "an administrator for a new invite.",
        "",
        "— The Pew Pew Wiki team",
      ].join("\n"),
      html: [
        "<p>Hello,</p>",
        "<p>You have been granted access to Pew Pew Wiki.</p>",
        `<p><a href="${link}">Set up my account</a></p>`,
        "<p>This link expires in 72 hours. If it has expired, please contact",
        "an administrator for a new invite.</p>",
        "<p>— The Pew Pew Wiki team</p>",
      ].join("\n"),
    },
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Admin-only callable that sends a direct invite to an email address,
 * bypassing the access-request flow.
 *
 * Used by admins from the User Management page to invite users directly.
 */
export const sendInvite = onCall(
  { region: "europe-north1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== "ADMIN") {
      throw new HttpsError("permission-denied", "Only ADMINs can send invites.");
    }

    const { email } = request.data as { email?: unknown };
    if (typeof email !== "string" || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "A valid email address is required.");
    }

    await sendInviteInternal(email.trim().toLowerCase());

    // ── Audit log ─────────────────────────────────────────────────────────────
    try {
      const targetUser = await getAuth().getUserByEmail(email.trim().toLowerCase());
      await writeAuditLog(request.auth.uid, targetUser.uid, "invite_sent");
    } catch {
      // Non-fatal.
    }
  }
);
