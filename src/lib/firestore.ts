import {
  getFirestore,
  connectFirestoreEmulator,
  type Timestamp,
} from "firebase/firestore";
import app from "./firebase";

const firestore = getFirestore(app);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(firestore, "localhost", 8080);
}

export default firestore;

// ── Collection types ──────────────────────────────────────────────────────────

export type AccessRequestStatus = "pending" | "approved" | "rejected";

/** A document in the `accessRequests` Firestore collection. */
export interface AccessRequest {
  email: string;
  status: AccessRequestStatus;
  createdAt: Timestamp;
}

/** Collection path constant — use everywhere instead of a bare string. */
export const ACCESS_REQUESTS_COLLECTION = "accessRequests" as const;
export const ADMIN_AUDIT_LOG_COLLECTION = "adminAuditLog" as const;
