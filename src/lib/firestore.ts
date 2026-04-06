import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import app from "./firebase";

const firestore = getFirestore(app);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(firestore, "localhost", 8080);
}

export default firestore;

// ── Collection types ──────────────────────────────────────────────────────────

