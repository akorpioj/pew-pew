# Auth Portal — Implementation Guide

## 1. What You Are Building

The Auth Portal is a **standalone web application** that owns all user identity for one or more
consumer applications. Consumer apps — a private wiki, a Cloud Run service, or anything else
on the same Firebase project — do not contain any login pages of their own. They hold Firebase
tokens and read a `role` custom claim from the JWT; everything else happens here.

### Responsibilities

| Concern | Owner |
|---|---|
| Sign-in UI (email, Google, Microsoft) | Auth Portal |
| Access request flow | Auth Portal |
| Invite / first-login password setup | Auth Portal |
| Self-service password reset | Auth Portal |
| User profile (email / password change, delete account) | Auth Portal |
| Admin user management table | Auth Portal |
| All UM Cloud Functions | Auth Portal (deployed to shared Firebase project) |
| Verifying tokens, reading `role` claim | Each consumer app independently |
| Business content (wiki articles, documents, etc.) | Consumer apps independently |

### What this app does NOT contain

- Any business content or data.
- Firebase Data Connect, pgvector, or any database other than Firestore and Firebase Auth.
- Any wiki-specific UI, editor, or AI assistant.

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│  auth.yourdomain.com  (Auth Portal — Firebase Hosting)     │
│  /login  /request-access  /accept-invite  /forgot-password │
│  /reset-password  /profile  /admin/users                   │
└─────────────────────────┬──────────────────────────────────┘
                          │ Firebase Auth  (project: pew-bab23)
             ┌────────────┴─────────────────┐
             ▼                              ▼
  pew-pew.yourdomain.com          app2.run.app  (or any other domain)
  (same registrable domain)       (different domain — token bridge required)
  → token shared via IndexedDB    → /auth/callback?token=<customToken>
```

**Firebase project:** `pew-bab23` is the shared project. The Auth Portal is a **second web app**
registered inside it — different `appId`, same `projectId`, `apiKey`, and `authDomain`.

**Roles:** Three roles are stored as a Firebase custom claim `role`:

| Value | Meaning |
|---|---|
| `VIEWER` | Default. Can read content in consumer apps. |
| `EXPERT` | Can create/edit content (app-specific). |
| `ADMIN` | Full access + user management in the Auth Portal. |

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19+ / Vite / TypeScript |
| UI | Shadcn/ui (Tailwind CSS) |
| Auth | Firebase Authentication |
| Database | Firestore (for UM state only) |
| Functions | Firebase Cloud Functions v2 (Node 20 / TypeScript) |
| Routing | React Router v6 |
| Hosting | Firebase Hosting (second site in the shared project) |

---

## 4. Repository Bootstrap

### 4.1 Scaffold the app

```bash
npm create vite@latest auth-portal -- --template react-ts
cd auth-portal
npm install
```

### 4.2 Install dependencies

```bash
# Firebase
npm install firebase

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init

# Router
npm install react-router-dom

# Functions (inside functions/ sub-directory)
mkdir functions && cd functions
npm init -y
npm install firebase-admin firebase-functions
npm install -D typescript
```

### 4.3 Register as a new Firebase web app

1. Firebase Console → **Project settings** → **Your apps** → **Add app** → **Web**.
2. Name it `auth-portal`. Copy the `firebaseConfig` object — it has the same `projectId` and
   `apiKey` as any other app in this project, but a **new `appId`**.
3. Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add
   `auth.yourdomain.com` (and `localhost` for development).

---

## 5. Source File Structure

```
auth-portal/
├── src/
│   ├── lib/
│   │   ├── firebase.ts          # SDK init — see §6.1
│   │   ├── firestore.ts         # Firestore init — see §6.2
│   │   ├── functions.ts         # Callable references — see §6.3
│   │   └── umConfig.ts          # All hardcoded UM values — see §6.4
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth state + role — see §6.5
│   ├── components/
│   │   ├── ProtectedRoute.tsx   # Redirect unauthenticated to /login
│   │   └── AdminRoute.tsx       # Redirect non-admins to /
│   ├── pages/
│   │   ├── LoginPage.tsx            # §8.1
│   │   ├── RequestAccessPage.tsx    # §8.2
│   │   ├── AcceptInvitePage.tsx     # §8.3
│   │   ├── ForgotPasswordPage.tsx   # §8.4
│   │   ├── ResetPasswordPage.tsx    # §8.5
│   │   ├── ProfilePage.tsx          # §8.6
│   │   └── UserManagementPage.tsx   # §8.7
│   └── App.tsx                  # Routing — see §7
├── functions/
│   └── src/
│       ├── index.ts             # Function exports — see §9.1
│       ├── umConfig.ts          # Server-side UM constants — see §9.2
│       ├── rateLimit.ts         # Rate-limiting helper — see §9.3
│       ├── auditLog.ts          # Audit-log helper — see §9.4
│       ├── requestAccess.ts
│       ├── sendInvite.ts
│       ├── acceptInvite.ts
│       ├── setUserRole.ts
│       ├── revokeUserAccess.ts
│       ├── sendPasswordReset.ts
│       ├── requestDeletion.ts
│       └── generateSignInToken.ts   # Cross-domain token bridge — see §10.2
├── firestore.rules              # Moved from pew-pew — see §18
├── .env.development
├── .env.production
└── firebase.json
```

---

## 6. Library Files

### 6.1 `src/lib/firebase.ts`

```ts
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "...",                    // same as pew-pew
  authDomain:        "auth.yourdomain.com",   // MUST match across all apps — see §11
  projectId:         "pew-bab23",
  storageBucket:     "pew-bab23.firebasestorage.app",
  messagingSenderId: "...",
  appId:             "...",                    // NEW appId — from §4.3
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
}

export default app;
```

> **Critical:** `authDomain` must be set to `auth.yourdomain.com` (the Auth Portal's own domain)
> in **every app** in the project — Auth Portal, pew-pew, and any Cloud Run frontend.
> This is what allows Firebase to share the IndexedDB token store across subdomains.
> Do **not** use the default `pew-bab23.firebaseapp.com` value.

### 6.2 `src/lib/firestore.ts`

```ts
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import app from "./firebase";

const firestore = getFirestore(app);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(firestore, "localhost", 8080);
}

export default firestore;
```

### 6.3 `src/lib/functions.ts`

```ts
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import app from "./firebase";
import type { Role } from "./umConfig";

const functions = getFunctions(app, "europe-north1");

if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export const requestAccessCallable = httpsCallable<{ email: string }, void>(
  functions, "requestAccess"
);

export const sendInviteCallable = httpsCallable<{ email: string; appKey?: string }, void>(
  functions, "sendInvite"
);

export const setUserRoleCallable = httpsCallable<{ uid: string; role: Role }, void>(
  functions, "setUserRole"
);

export const revokeUserAccessCallable = httpsCallable<{ uid: string }, void>(
  functions, "revokeUserAccess"
);

export const sendPasswordResetCallable = httpsCallable<{ uid: string }, void>(
  functions, "sendPasswordReset"
);

export const requestDeletionCallable = httpsCallable<void, void>(
  functions, "requestDeletion"
);

export const generateSignInTokenCallable = httpsCallable<void, { token: string }>(
  functions, "generateSignInToken"
);
```

### 6.4 `src/lib/umConfig.ts`

Centralise every hardcoded constant so pages and functions reference one place.

```ts
export const umConfig = {
  // Role values — must match the custom claim set by setUserRole
  roles: ["ADMIN", "EXPERT", "VIEWER"] as const,

  // Firestore collection names
  collections: {
    accessRequests:   "accessRequests",
    adminAuditLog:    "adminAuditLog",
    rateLimits:       "_rateLimits",
    mail:             "mail",
    deletionRequests: "deletionRequests",
  },

  // Auth provider IDs
  providers: {
    google:    "google.com",
    microsoft: "microsoft.com",
  },

  // Internal routes for the Auth Portal itself
  routes: {
    login:          "/login",
    requestAccess:  "/request-access",
    acceptInvite:   "/accept-invite",
    forgotPassword: "/forgot-password",
    resetPassword:  "/reset-password",
    profile:        "/profile",
    adminUsers:     "/admin/users",
  },

  // After successful login, redirect here.
  // Reads from env so each deployment can point at the right consumer app.
  appHomeUrl: import.meta.env.VITE_APP_HOME_URL ?? "http://localhost:5173/wiki",
} as const;

export type UmConfig = typeof umConfig;
export type Role = UmConfig["roles"][number];
```

### 6.5 `src/contexts/AuthContext.tsx`

```tsx
import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextValue {
  user:    User | null;
  role:    string | null;   // 'ADMIN' | 'EXPERT' | 'VIEWER' | null
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [role,    setRole]    = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult();
        setRole((token.claims["role"] as string) ?? null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut: () => signOut(auth) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
```

---

## 7. Routing (`src/App.tsx`)

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute    from "@/components/AdminRoute";
import { umConfig }  from "@/lib/umConfig";

import LoginPage           from "@/pages/LoginPage";
import RequestAccessPage   from "@/pages/RequestAccessPage";
import AcceptInvitePage    from "@/pages/AcceptInvitePage";
import ForgotPasswordPage  from "@/pages/ForgotPasswordPage";
import ResetPasswordPage   from "@/pages/ResetPasswordPage";
import ProfilePage         from "@/pages/ProfilePage";
import UserManagementPage  from "@/pages/UserManagementPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path={umConfig.routes.login}          element={<LoginPage />} />
          <Route path={umConfig.routes.requestAccess}  element={<RequestAccessPage />} />
          <Route path={umConfig.routes.acceptInvite}   element={<AcceptInvitePage />} />
          <Route path={umConfig.routes.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={umConfig.routes.resetPassword}  element={<ResetPasswordPage />} />

          {/* Requires sign-in */}
          <Route element={<ProtectedRoute />}>
            <Route path={umConfig.routes.profile} element={<ProfilePage />} />

            {/* Requires ADMIN role */}
            <Route element={<AdminRoute />}>
              <Route path={umConfig.routes.adminUsers} element={<UserManagementPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={umConfig.routes.login} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

**`ProtectedRoute`** — if `auth.currentUser` is null, redirect to `/login`.  
**`AdminRoute`** — if `role !== 'ADMIN'`, redirect to `/`.

---

## 8. Pages

### 8.1 `LoginPage.tsx`

**Flows to implement:**

1. **Email / password** — `signInWithEmailAndPassword(auth, email, password)`.
2. **Google** — `signInWithPopup(auth, googleProvider)`.
3. **Microsoft** — `signInWithPopup(auth, microsoftProvider)`.

**After successful sign-in:** redirect to `umConfig.appHomeUrl`.

**Error handling:**
- `auth/wrong-password`, `auth/user-not-found` → show a generic "Invalid credentials" message
  (do not distinguish between the two — prevents user enumeration).
- `auth/user-disabled` → "Your account has been suspended. Contact your administrator."
- `auth/account-exists-with-different-credential` → "An account with this email already exists.
  Please sign in with email and password instead."

**Links:** "Request access" → `/request-access`. "Forgot password" → `/forgot-password`.

### 8.2 `RequestAccessPage.tsx`

**Flow:** Single email input. On submit, call `requestAccessCallable({ email })`.

**Always display:** *"If your request can be fulfilled, you will receive an email."*
— regardless of whether the email is already known, already pending, or rejected.
This prevents email enumeration.

**Rate limiting** is enforced server-side in the Cloud Function (see §9.3).
The UI does not need to track attempts — just disable the button during the request.

### 8.3 `AcceptInvitePage.tsx`

This page is reached via an email link. The URL contains a sign-in link.

**Flow:**
1. On mount, check `isSignInWithEmailLink(auth, window.location.href)`.
2. If true, call `signInWithEmailLink(auth, email, window.location.href)`.
   - The email may need to come from `localStorage` if the user opened the link on a different device.
   - Prompt the user to re-enter their email address if it is not in `localStorage`.
3. After sign-in succeeds, prompt the user to **set a password** via `updatePassword(currentUser, newPassword)`.
   - Require the password to be at least 8 characters.
4. On completion, redirect to `umConfig.appHomeUrl`.

**Expired link (`auth/invalid-action-code`):** Show a message with instructions to ask the admin
to re-send the invite.

### 8.4 `ForgotPasswordPage.tsx`

**Flow:** Single email input. On submit, call `sendPasswordResetEmail(auth, email)`.

**Always display:** *"If that email is in our system, a reset link has been sent."*
— regardless of whether the email exists (prevents enumeration).

Rate limiting is enforced server-side via App Check and the same IP counter used in §8.2.

### 8.5 `ResetPasswordPage.tsx`

Reached via a link in the password reset email. The URL contains an `oobCode` parameter.

**Flow:**
1. On mount, call `verifyPasswordResetCode(auth, oobCode)` to validate the link.
2. If valid, show a "new password" form.
3. On submit, call `confirmPasswordReset(auth, oobCode, newPassword)`.
4. Redirect to `/login` with a success message.

**Expired code (`auth/invalid-action-code` or `auth/expired-action-code`):** Show an
"This link has expired" message with a link back to `/forgot-password`.

### 8.6 `ProfilePage.tsx`

Display: display name, email, and auth provider badge (Email / Google / Microsoft).

**Change email** (all account types):
1. Show a "Change Email" form only after the user re-authenticates successfully.
2. Re-authentication: call `reauthenticateWithCredential(currentUser, credential)`.
   For email/password accounts, build the credential with `EmailAuthProvider.credential(email, currentPassword)`.
3. Call `verifyBeforeUpdateEmail(currentUser, newEmail)`.
4. Show: *"A verification link has been sent to the new address. The change takes effect after you click it."*

**Change password** (email/password accounts only — hide this section for OAuth users):
1. After re-authentication (same gate as above), call `updatePassword(currentUser, newPassword)`.

**Delete account:**
1. Show a confirmation dialog.
2. After confirmation, call `revokeUserAccessCallable({ uid: currentUser.uid })` (disables the
   Firebase Auth account) and `requestDeletionCallable()` (creates a Firestore `deletionRequests`
   document for admin review).
3. Sign out and redirect to `/login`.

### 8.7 `UserManagementPage.tsx`

Accessible to `ADMIN` role only.

**Display:** A data table listing all users. Columns: email, role (badge), status (Active / Disabled).

**Actions per row:**

| Action | Cloud Function | Client confirmation? |
|---|---|---|
| Approve access request | `sendInviteCallable({ email })` | No |
| Reject access request | `rejectAccessCallable({ requestId })` | No |
| Re-send invite | `sendInviteCallable({ email })` | No |
| Grant / remove EXPERT | `setUserRoleCallable({ uid, role })` | No |
| Grant ADMIN | `setUserRoleCallable({ uid, role: 'ADMIN' })` | **Yes — confirmation dialog** |
| Remove ADMIN | `setUserRoleCallable({ uid, role: 'EXPERT' })` | **Yes — confirmation dialog** |
| Revoke access | `revokeUserAccessCallable({ uid })` | No |
| Trigger password reset | `sendPasswordResetCallable({ uid })` | No |

**Guards (enforced by the Cloud Functions, not only the UI):**
- An admin cannot demote themselves.
- The last ADMIN account cannot be demoted.

**Access requests tab:** List all Firestore documents in `accessRequests` where `status === 'pending'`,
with Approve and Reject buttons.

---

## 9. Cloud Functions

All Cloud Functions live in `functions/src/` and are deployed to the same Firebase project
(`pew-bab23`). They are the **only** Cloud Functions in the project — there is no second
functions package.

### 9.1 `functions/src/index.ts`

```ts
import { initializeApp } from "firebase-admin/app";
initializeApp();

export { requestAccess }       from "./requestAccess";
export { sendInvite }          from "./sendInvite";
export { acceptInvite }        from "./acceptInvite";
export { setUserRole }         from "./setUserRole";
export { revokeUserAccess }    from "./revokeUserAccess";
export { sendPasswordReset }   from "./sendPasswordReset";
export { requestDeletion }     from "./requestDeletion";
export { generateSignInToken } from "./generateSignInToken";
```

### 9.2 `functions/src/umConfig.ts`

```ts
import { defineString } from "firebase-functions/params";

export const APP_URL_PEW_PEW = defineString("APP_URL_PEW_PEW");
export const APP_URL_APP2    = defineString("APP_URL_APP2", { default: "" });

export const umConfig = {
  region: "europe-north1",

  roles: ["ADMIN", "EXPERT", "VIEWER"] as const,

  collections: {
    accessRequests:   "accessRequests",
    adminAuditLog:    "adminAuditLog",
    rateLimits:       "_rateLimits",
    mail:             "mail",
    deletionRequests: "deletionRequests",
  },

  appHomeUrls: {
    "pew-pew": APP_URL_PEW_PEW,
    "app2":    APP_URL_APP2,
  } as Record<string, ReturnType<typeof defineString>>,

  rateLimit: {
    windowMs:    10 * 60 * 1000,  // 10 minutes
    maxAttempts: 3,
  },
};

export type Role = typeof umConfig.roles[number];
```

### 9.3 Rate limiting helper (`functions/src/rateLimit.ts`)

```ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { umConfig } from "./umConfig";

export async function checkRateLimit(ip: string, action: string): Promise<void> {
  const db    = getFirestore();
  const key   = `${action}:${ip}`;
  const ref   = db.collection(umConfig.collections.rateLimits).doc(key);
  const now   = Date.now();
  const limit = umConfig.rateLimit;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data()! : { count: 0, windowStart: now };

    if (now - data.windowStart > limit.windowMs) {
      tx.set(ref, { count: 1, windowStart: now });
      return;
    }
    if (data.count >= limit.maxAttempts) {
      throw new HttpsError("resource-exhausted", "Too many attempts. Try again later.");
    }
    tx.update(ref, { count: FieldValue.increment(1) });
  });
}
```

### 9.4 Audit log helper (`functions/src/auditLog.ts`)

```ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { umConfig } from "./umConfig";

export async function writeAuditLog(
  actorUid:  string,
  targetUid: string,
  action:    string,
): Promise<void> {
  await getFirestore()
    .collection(umConfig.collections.adminAuditLog)
    .add({ actorUid, targetUid, action, timestamp: FieldValue.serverTimestamp() });
}
```

### 9.5 Key function contracts

**`requestAccess`** — callable, public (no auth required)
- Input: `{ email: string }`
- Rate-limits by IP.
- Upserts a Firestore `accessRequests` document `{ email, status: 'pending', createdAt }`.
  If a pending document already exists, does nothing silently.
- Always returns `void` (neutral response — no enumeration).

**`sendInvite`** — callable, ADMIN only
- Input: `{ email: string; appKey?: string }`
- Creates a Firebase Auth user if one does not already exist with that email.
- Calls `admin.auth().generateSignInWithEmailLink(email, actionCodeSettings)` with a 72-hour expiry.
- Sends the link via the `mail` Firestore collection (Trigger Email extension) or direct SendGrid.
- Writes an `adminAuditLog` entry.

**`setUserRole`** — callable, ADMIN only
- Input: `{ uid: string; role: Role }`
- Validates: actor is not demoting themselves; enough admins remain.
- Calls `admin.auth().setCustomUserClaims(uid, { role })`.
- Writes an `adminAuditLog` entry.

**`revokeUserAccess`** — callable, ADMIN only or self (for account deletion)
- Input: `{ uid: string }`
- Calls `admin.auth().updateUser(uid, { disabled: true })`.
- Does **not** delete the user or any authored content.
- Writes an `adminAuditLog` entry.

**`sendPasswordReset`** — callable, ADMIN only
- Input: `{ uid: string }`
- Reads the user's email via `admin.auth().getUser(uid)`.
- Calls `admin.auth().generatePasswordResetLink(email)` and sends it via email.
- Writes an `adminAuditLog` entry.
- The function never receives, returns, or stores a plain-text password.

**`requestDeletion`** — callable, authenticated user only
- Input: none (uses `request.auth.uid`)
- Disables the calling user's Auth account.
- Creates a `deletionRequests` Firestore document for admin review.

---

## 10. Cross-App Token Sharing

### 10.1 Pattern A — Same registrable domain (e.g., pew-pew)

Both apps share `*.yourdomain.com`. No extra work needed: Firebase persists the
session token in IndexedDB under the shared `authDomain`. When the user lands on pew-pew
after a login on the Auth Portal, `onAuthStateChanged()` fires immediately.

**Required:** both apps must have identical `authDomain: "auth.yourdomain.com"` in their
`firebaseConfig`. See §6.1.

### 10.2 Pattern B — Different domain (Cloud Run or external app)

Firebase's token store is per-origin. A Cloud Run app on `app2.run.app` cannot read the
Auth Portal's IndexedDB session. Use the **custom token bridge**:

**Login redirect from consumer app:**
```
auth.yourdomain.com/login?app=app2&returnTo=%2Fdashboard
```

**Auth Portal post-login handler:**
1. Read `?app` and `?returnTo` query params after successful sign-in.
2. Validate `returnTo` against an allowlist of known consumer app origins (prevent open redirect).
3. Call `generateSignInTokenCallable()` — returns a short-lived Firebase custom token.
4. Redirect to `app2.run.app/auth/callback?token=<customToken>&returnTo=<path>`.

**`generateSignInToken` Cloud Function:**
```ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { umConfig } from "./umConfig";

export const generateSignInToken = onCall(
  { region: umConfig.region },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const customToken = await getAuth().createCustomToken(request.auth.uid);
    return { token: customToken };
  },
);
```

**Consumer app `/auth/callback` route:**
```ts
const { token, returnTo } = parseQueryParams();
await signInWithCustomToken(auth, token);
history.replaceState({}, "", returnTo ?? "/");   // remove token from URL immediately
navigate(returnTo ?? "/");
```

**Security properties:**
- The token is generated server-side for the already-authenticated user.
- Custom tokens expire after 1 hour and can only be used once.
- The `returnTo` URL must be validated against an allowlist before the redirect is issued.
- Remove `?token=` from the URL as soon as `signInWithCustomToken()` completes.

### 10.3 Cloud Run backend — verifying tokens

If the Cloud Run service has a protected API (not just a frontend SPA), verify every request:

```python
# Python — Firebase Admin SDK
import firebase_admin
from firebase_admin import auth, credentials

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred, { "projectId": "pew-bab23" })

def verify_token(id_token: str) -> dict:
    return auth.verify_id_token(id_token)   # raises if invalid or expired
```

The decoded token includes `decoded["role"]` — the same custom claim set by `setUserRole`.

**IAM requirement:** Grant the Cloud Run service account the **Firebase Authentication Viewer**
role (`roles/firebaseauth.viewer`) on the `pew-bab23` Google Cloud project.

### 10.4 Custom claims on the client

Both pew-pew and the Cloud Run app read `auth.currentUser.getIdTokenResult()` to access
`claims.role`. No changes needed — the claim is set by the same `setUserRole` function in
the shared Firebase project.

---

## 11. `authDomain` — Critical Cross-App Setting

Firebase Auth stores tokens keyed by `authDomain`. For the Auth Portal's tokens to be readable
by pew-pew — without a custom token bridge — **every single app** must declare the same value.

| App | `authDomain` value |
|---|---|
| Auth Portal | `auth.yourdomain.com` |
| pew-pew | `auth.yourdomain.com` |
| Any other same-domain app | `auth.yourdomain.com` |
| Cloud Run app | `auth.yourdomain.com` (but still needs the bridge — different registrable domain) |

**Steps to configure:**
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add `auth.yourdomain.com`.
2. Set `authDomain: "auth.yourdomain.com"` in the `firebaseConfig` of every app.
3. Firebase Hosting → configure `auth.yourdomain.com` to point to the Auth Portal's Hosting site.

---

## 12. Environment Variables

### Auth Portal (`.env.development` / `.env.production`)

| Variable | Dev value | Prod value |
|---|---|---|
| `VITE_APP_HOME_URL` | `http://localhost:5173/wiki` | `https://pew-pew.yourdomain.com/wiki` |

### Functions (set as Firebase function params)

| Param | Value |
|---|---|
| `APP_URL_PEW_PEW` | `https://pew-pew.yourdomain.com` |
| `APP_URL_APP2` | `https://app2.run.app` (empty until needed) |

---

## 13. Firestore Collections

The Auth Portal owns all of these. Consumer apps do not read them directly.

| Collection | Purpose | Key fields |
|---|---|---|
| `accessRequests` | Access request queue | `email`, `status` (`pending`/`approved`/`rejected`), `createdAt` |
| `adminAuditLog` | Immutable admin action log | `actorUid`, `targetUid`, `action`, `timestamp` |
| `_rateLimits` | IP-based rate limit counters | `count`, `windowStart` |
| `mail` | Outbound email queue (Trigger Email extension) | `to`, `message.subject`, `message.html` |
| `deletionRequests` | Queued account deletions for admin review | `uid`, `email`, `requestedAt` |

---

## 14. Firebase Hosting — Multi-Site Setup

The shared Firebase project hosts two sites: pew-pew (existing) and auth-portal (new).

### 14.1 Register the second Hosting site

Firebase Console → **Hosting** → **Add another site** → name it `auth-portal`.

### 14.2 `firebase.json`

```json
{
  "hosting": [
    {
      "target": "pew-pew",
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "auth-portal",
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ],
  "firestore": {
    "rules": "firestore.rules"
  },
  "functions": [
    { "source": "functions", "codebase": "default", "ignore": ["node_modules", "lib"] }
  ]
}
```

### 14.3 `.firebaserc`

```json
{
  "projects": { "default": "pew-bab23" },
  "targets": {
    "pew-bab23": {
      "hosting": {
        "pew-pew":     ["<pew-pew-site-id>"],
        "auth-portal": ["<auth-portal-site-id>"]
      }
    }
  }
}
```

### 14.4 Deploy commands

```bash
# Deploy only the Auth Portal frontend
npm run build && firebase deploy --only hosting:auth-portal

# Deploy only Cloud Functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy everything
npm run build && firebase deploy
```

---

## 15. Consumer App Integration Checklist

Any app that consumes the Auth Portal needs these changes only — no identity UI of its own:

- [ ] Set `authDomain: "auth.yourdomain.com"` in `firebaseConfig`.
- [ ] Add `VITE_AUTH_PORTAL_URL` env variable pointing to `https://auth.yourdomain.com`.
- [ ] `ProtectedRoute`: redirect unauthenticated users to `AUTH_PORTAL_URL + "/login"` (full URL, `window.location.href`) instead of a local route.
- [ ] Any "Login" link → `AUTH_PORTAL_URL + "/login"`.
- [ ] Any "Profile" link → `AUTH_PORTAL_URL + "/profile"`.
- [ ] `AuthContext.tsx`: `onAuthStateChanged` + read `role` from `getIdTokenResult().claims["role"]`.
- [ ] If on a different registrable domain: implement `/auth/callback` route that calls `signInWithCustomToken()` (Pattern B, §10.2).

---

## 16. Local Development Setup

```bash
# 1. Start the Firebase emulator suite (Auth + Firestore + Functions)
firebase emulators:start

# Emulator ports (default):
#   Auth:        9099
#   Firestore:   8080
#   Functions:   5001
#   Hosting:     5000
#   Emulator UI: 4000

# 2. Start the Auth Portal Vite dev server
npm run dev   # typically http://localhost:5174

# 3. (Optional) Start pew-pew dev server to test cross-app token sharing
cd ../pew-pew && npm run dev   # http://localhost:5173
```

Both `firebase.ts` files check `import.meta.env.DEV` and connect to the emulators automatically.
No production credentials are used during local development.

---

## 17. Acceptance Checklist

### Identity flows
- [ ] Email/password login works; invalid credentials show a generic error.
- [ ] Google sign-in works; fails gracefully for unregistered email.
- [ ] Microsoft sign-in works; fails gracefully for unregistered email.
- [ ] Attempting Google/Microsoft sign-in for an email with an existing email/password account shows the correct prompt.
- [ ] Request Access submits; always shows the neutral confirmation regardless of email status.
- [ ] Admin can approve a request → user receives an invite email.
- [ ] Admin can reject a request → user receives a decline email; email can be reused afterward.
- [ ] Invite link opens AcceptInvitePage; user sets a password and is redirected to the consumer app.
- [ ] Expired invite link (>72 h) shows the expired-link message.
- [ ] Forgot Password submits; always shows the neutral confirmation.
- [ ] Password reset link opens ResetPasswordPage; user sets a new password and is redirected to login.
- [ ] Expired password reset link shows the expired-link message.

### Profile
- [ ] Profile page shows email and provider badge.
- [ ] Re-authentication gate is shown before change-email and change-password forms.
- [ ] Wrong current password shows an appropriate error from `reauthenticateWithCredential`.
- [ ] Change email sends a verification link; does not apply until verified.
- [ ] Change password is hidden for OAuth accounts.
- [ ] Delete account disables the Auth account and creates a `deletionRequests` document.

### Admin
- [ ] Non-admins cannot access `/admin/users` (redirect occurs in `AdminRoute`).
- [ ] Admin can grant/remove EXPERT role.
- [ ] Granting or removing ADMIN role requires a confirmation dialog.
- [ ] Admin cannot demote themselves.
- [ ] Admin cannot demote the last admin.
- [ ] Admin can trigger a password reset email; no password is ever visible to the admin.
- [ ] Admin can revoke access; the user's authored content is preserved.
- [ ] Every admin action produces an `adminAuditLog` Firestore document.

### Security
- [ ] Rate limiter blocks more than 3 requests per IP per 10 minutes on `requestAccess` and `forgotPassword`.
- [ ] Access-request and password-reset responses are identical whether or not the email exists.
- [ ] `generateSignInToken` returns an error when called unauthenticated.
- [ ] `returnTo` URL validated against allowlist before redirect (no open redirect).
- [ ] Custom token removed from URL immediately after `signInWithCustomToken()` completes.

### Cross-app
- [ ] After Auth Portal login, `onAuthStateChanged` fires in pew-pew without a second login
  (Pattern A — requires both apps to share the same `authDomain`).
- [ ] `role` custom claim is readable in pew-pew after Auth Portal login.
- [ ] Pattern B: Cloud Run frontend signs in via `/auth/callback?token=...` successfully.

---

## 18. Taking Over `firestore.rules` from pew-pew

Until the Auth Portal exists, `firestore.rules` lives in the pew-pew repository and is deployed by
pew-pew's `firebase.json`. This is a temporary ownership situation — pew-pew does not read or write
Firestore itself (all wiki data goes through Data Connect); every rule in that file protects UM
collections that belong here.

**When the Auth Portal is ready to deploy for the first time:**

1. Copy `firestore.rules` verbatim from the pew-pew repository into the root of this repository.
2. Ensure `firebase.json` in this repository includes:
   ```json
   "firestore": { "rules": "firestore.rules" }
   ```
   (Already included in the template above — see §14.2.)
3. Deploy from this repository to take ownership: `firebase deploy --only firestore:rules`.
4. In pew-pew, remove the `"firestore"` key from `firebase.json` and **delete `firestore.rules`**.
5. Also delete `src/lib/firestore.ts` from pew-pew — it is dead code (the Firestore client is
   initialised there but nothing in pew-pew's source imports it after the UM extraction).

> **Do not remove `firestore.rules` from pew-pew before the Auth Portal deploys its own copy.**
> There is only one active rules set per Firebase project — leaving it empty would switch the
> database to deny-all and break the Auth Portal's Cloud Functions that write to Firestore via the
> Admin SDK (which bypasses rules) but also any direct reads the Admin UI performs.
