import { createHash } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { umConfig } from "./umConfig";

const NEUTRAL_RESPONSE = {
  message: "If your request can be fulfilled, you will receive an email.",
};

/**
 * Enforce a sliding-window rate limit per IP address.
 *
 * IP is hashed with SHA-256 before being used as a Firestore document ID
 * so no raw IP addresses are ever stored.
 *
 * Throws HttpsError("resource-exhausted") when the caller exceeds the limit.
 */
async function checkRateLimit(rawIp: string): Promise<void> {
  const ipHash = createHash("sha256").update(rawIp).digest("hex");
  const db = getFirestore();
  const ref = db.collection(umConfig.collections.rateLimits).doc(`requestAccess_${ipHash}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();

    if (!snap.exists) {
      tx.set(ref, { count: 1, windowStart: Timestamp.fromMillis(now) });
      return;
    }

    const data = snap.data() as { count: number; windowStart: Timestamp };
    const windowStart = data.windowStart.toMillis();

    if (now - windowStart > umConfig.rateLimit.windowMs) {
      // Window expired — reset
      tx.set(ref, { count: 1, windowStart: Timestamp.fromMillis(now) });
      return;
    }

    if (data.count >= umConfig.rateLimit.max) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many requests. Please wait a few minutes and try again."
      );
    }

    tx.update(ref, { count: FieldValue.increment(1) });
  });
}

export const requestAccess = onCall(
  { region: umConfig.region },
  async (request) => {
    // ── Rate limiting ──────────────────────────────────────────────────────────
    // Use x-forwarded-for (leftmost entry = original client) with a fallback.
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
      throw new HttpsError("invalid-argument", "A valid email address is required.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getFirestore();
    const col = db.collection(umConfig.collections.accessRequests);

    // Check for an existing document for this email with any non-rejected status.
    // We allow re-submission only if a previous request was rejected (email unblocked).
    const existing = await col
      .where("email", "==", normalizedEmail)
      .where("status", "in", ["pending", "approved"])
      .limit(1)
      .get();

    if (!existing.empty) {
      // Silently succeed — return neutral message without creating a duplicate.
      return NEUTRAL_RESPONSE;
    }

    // Upsert: if a rejected document exists for this email, reuse it; otherwise create.
    const rejectedSnap = await col
      .where("email", "==", normalizedEmail)
      .where("status", "==", "rejected")
      .limit(1)
      .get();

    if (!rejectedSnap.empty) {
      await rejectedSnap.docs[0].ref.update({
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      await col.add({
        email: normalizedEmail,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NEUTRAL_RESPONSE;
  }
);
