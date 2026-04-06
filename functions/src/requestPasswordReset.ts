import { createHash } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const appUrl = defineString("APP_URL", { default: "http://localhost:5173" });

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Enforce a per-IP rate limit using the same sliding-window pattern as
 * `requestAccess` (SHA-256 hashed IP, Firestore counter in `_rateLimits`).
 */
async function checkRateLimit(rawIp: string): Promise<void> {
  const ipHash = createHash("sha256").update(rawIp).digest("hex");
  const db = getFirestore();
  const ref = db.collection("_rateLimits").doc(`passwordReset_${ipHash}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();

    if (!snap.exists) {
      tx.set(ref, { count: 1, windowStart: Timestamp.fromMillis(now) });
      return;
    }

    const data = snap.data() as { count: number; windowStart: Timestamp };
    const windowStart = data.windowStart.toMillis();

    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
      tx.set(ref, { count: 1, windowStart: Timestamp.fromMillis(now) });
      return;
    }

    if (data.count >= RATE_LIMIT_MAX) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many requests. Please wait a few minutes and try again."
      );
    }

    tx.update(ref, { count: FieldValue.increment(1) });
  });
}

/**
 * Public callable that triggers a self-service password reset email.
 *
 * - Rate limited: 3 calls / IP / 10 min (same window as `requestAccess`).
 * - Always returns the same neutral response to prevent email enumeration.
 * - Uses `generatePasswordResetLink` (Admin SDK) so the reset URL points back
 *   to the app's `/reset-password` page where the user can set a new password
 *   and we can handle the expired-link case gracefully.
 * - The raw password is never received or returned by this Function.
 * - No authentication required — this is a public endpoint.
 */
export const requestPasswordReset = onCall(
  { region: "europe-north1" },
  async (request) => {
    // ── Rate limiting ──────────────────────────────────────────────────────────
    const rawIp =
      (request.rawRequest.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        .trim() ??
      request.rawRequest.socket?.remoteAddress ??
      "unknown";
    await checkRateLimit(rawIp);

    // ── Input validation ───────────────────────────────────────────────────────
    const { email } = request.data as { email?: unknown };
    if (typeof email !== "string" || !email.includes("@")) {
      // Return neutral response — even invalid input should not surface info.
      return { message: "If an account exists for that email, you will receive a reset link." };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Generate and send the reset link ──────────────────────────────────────
    // We silently swallow user-not-found so the response is always neutral.
    try {
      const auth = getAuth();
      const resetLink = await auth.generatePasswordResetLink(normalizedEmail, {
        url: `${appUrl.value()}/login`,
      });

      const db = getFirestore();
      await db.collection("mail").add({
        to: normalizedEmail,
        message: {
          subject: "Reset your password",
          text: [
            "Hello,",
            "",
            "We received a request to reset the password for your account.",
            "Click the link below to choose a new password:",
            "",
            resetLink,
            "",
            "This link expires in 1 hour. If you did not request a password",
            "reset, you can safely ignore this email.",
            "",
            "— The Pew Pew Wiki team",
          ].join("\n"),
          html: [
            "<p>Hello,</p>",
            "<p>We received a request to reset the password for your account.</p>",
            `<p><a href="${resetLink}">Reset your password</a></p>`,
            "<p>This link expires in 1 hour. If you did not request a password",
            "reset, you can safely ignore this email.</p>",
            "<p>— The Pew Pew Wiki team</p>",
          ].join("\n"),
        },
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch {
      // Swallow auth/user-not-found and any other errors — always neutral.
    }

    return {
      message: "If an account exists for that email, you will receive a reset link.",
    };
  }
);
