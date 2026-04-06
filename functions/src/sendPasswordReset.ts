import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { writeAuditLog } from "./auditLog";

const appUrl = defineString("APP_URL", { default: "http://localhost:5173" });

/**
 * Admin-only callable that generates a password-reset link for a given user
 * and delivers it via the "Trigger Email from Firestore" extension.
 *
 * - The Function never receives or returns a raw password.
 * - `generatePasswordResetLink` includes an `actionCodeSettings.url` so the
 *   user is redirected back to the app after completing the reset.
 * - Writing to the `mail` collection is done with the Admin SDK, bypassing
 *   Firestore security rules (the `mail` collection denies all client writes).
 *
 * Guards:
 *  - Caller must be ADMIN.
 *  - Target user must exist in Firebase Auth.
 */
export const sendPasswordReset = onCall(
  { region: "europe-north1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const callerRole = request.auth.token["role"] as string | undefined;
    if (callerRole !== "ADMIN") {
      throw new HttpsError(
        "permission-denied",
        "Only ADMINs can trigger password resets."
      );
    }

    const { uid } = request.data as { uid?: unknown };
    if (typeof uid !== "string" || !uid) {
      throw new HttpsError("invalid-argument", "A valid `uid` is required.");
    }

    const auth = getAuth();

    // Fetch the user to get their email (and confirm they exist).
    const targetUser = await auth.getUser(uid);
    const email = targetUser.email;

    if (!email) {
      throw new HttpsError(
        "failed-precondition",
        "This user has no email address on record."
      );
    }

    // Generate the reset link — the user is returned to the app's login page
    // after completing the reset (Firebase appends the oobCode to the URL).
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: `${appUrl.value()}/login`,
    });

    const db = getFirestore();
    await db.collection("mail").add({
      to: email,
      message: {
        subject: "Reset your password",
        text: [
          "Hello,",
          "",
          "An admin has requested a password reset for your account.",
          "Click the link below to choose a new password:",
          "",
          resetLink,
          "",
          "This link expires in 1 hour. If you did not expect this email,",
          "you can safely ignore it — your password will not change.",
          "",
          "— The Pew Pew Wiki team",
        ].join("\n"),
        html: [
          "<p>Hello,</p>",
          "<p>An admin has requested a password reset for your account.</p>",
          `<p><a href="${resetLink}">Reset your password</a></p>`,
          "<p>This link expires in 1 hour. If you did not expect this email,",
          "you can safely ignore it — your password will not change.</p>",
          "<p>— The Pew Pew Wiki team</p>",
        ].join("\n"),
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    await writeAuditLog(request.auth.uid, uid, "password_reset_sent");
  }
);
