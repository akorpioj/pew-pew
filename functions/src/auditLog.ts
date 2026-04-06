import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { umConfig } from "./umConfig";

export type AuditAction =
  | "invite_sent"
  | "invite_approved"
  | "role_changed"
  | "access_revoked"
  | "access_restored"
  | "password_reset_sent";

/**
 * Writes a single document to the `adminAuditLog` Firestore collection.
 *
 * Called exclusively from Cloud Functions using the Admin SDK, so Firestore
 * security rules (which deny all client writes) are bypassed.
 *
 * @param actorUid  UID of the admin performing the action.
 * @param targetUid UID of the user being acted upon.
 * @param action    One of the defined AuditAction string literals.
 * @param extra     Optional additional fields (e.g. `{ role: "EXPERT" }`).
 */
export async function writeAuditLog(
  actorUid: string,
  targetUid: string,
  action: AuditAction,
  extra?: Record<string, unknown>
): Promise<void> {
  const db = getFirestore();
  await db.collection(umConfig.collections.adminAuditLog).add({
    actorUid,
    targetUid,
    action,
    timestamp: FieldValue.serverTimestamp(),
    ...extra,
  });
}
