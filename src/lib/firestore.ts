import {
  getFirestore,
  connectFirestoreEmulator,
  type Timestamp,
} from "firebase/firestore";
import app from "./firebase";
import { umConfig } from "./umConfig";

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

/** Collection path constants — sourced from umConfig so they stay in sync. */
export const ACCESS_REQUESTS_COLLECTION = umConfig.collections.accessRequests;
export const ADMIN_AUDIT_LOG_COLLECTION = umConfig.collections.adminAuditLog;
