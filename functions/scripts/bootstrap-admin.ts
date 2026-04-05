/**
 * One-time bootstrap script: promote a Firebase Auth user to ADMIN.
 *
 * Run ONCE locally before any Cloud Functions are deployed:
 *
 *   npx ts-node --project ../tsconfig.json scripts/bootstrap-admin.ts <uid>
 *
 * Or compile first:
 *
 *   npx tsc --project tsconfig.json
 *   node lib/scripts/bootstrap-admin.js <uid>
 *
 * The UID can be found in the Firebase Console → Authentication → Users.
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { resolve } from "path";

const uid = process.argv[2];
if (!uid) {
  console.error("Usage: bootstrap-admin.ts <firebase-auth-uid>");
  process.exit(1);
}

// Load service account key — download from Firebase Console →
// Project Settings → Service Accounts → Generate new private key
// Save as scripts/service-account-key.json (NEVER commit this file)
const serviceAccountPath = resolve(__dirname, "service-account-key.json");

let serviceAccount: ServiceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8")) as ServiceAccount;
} catch {
  console.error(
    `Service account key not found at: ${serviceAccountPath}\n` +
    "Download it from Firebase Console → Project Settings → Service Accounts."
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });

(async () => {
  try {
    await getAuth().setCustomUserClaims(uid, { role: "ADMIN" });
    const user = await getAuth().getUser(uid);
    console.log(`✓ ADMIN claim set on user: ${user.email} (${uid})`);
    console.log("  Force-refresh the client token to pick up the new claim.");
  } catch (err) {
    console.error("Failed to set claim:", err);
    process.exit(1);
  }
})();
