# Implementation Plan: Extracting User Management into a Shared Service

## Overview

The user management system built for pew-pew is already refactored into two central config files (`functions/src/umConfig.ts` and `src/lib/umConfig.ts`). The next step is to extract it into a standalone **Auth Portal** — a separate web app and Firebase project that handles identity for multiple applications (pew-pew and any future apps).

```
┌─────────────────────────────────────────────────────────────┐
│                     auth.yourdomain.com                      │
│            (Auth Portal — Firebase Hosting)                  │
│  Login · Request Access · Accept Invite · Reset Password     │
│  Profile · Admin: User Management                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ Firebase Auth (shared project: pew-bab23)
              ┌────────────┴────────────────┐
              ▼                             ▼
   pew-pew.yourdomain.com         app2.run.app (or custom domain)
   (Wiki — Firebase Hosting)      (Cloud Run — different GCP project)
        same-domain token              cross-domain: custom token bridge
        sharing works natively         required (see Phase 5)
```

**Key architectural decision:** Firebase Auth is shared across apps via a single Firebase project. Each client app verifies the same JWT. The Auth Portal owns all identity UI and Cloud Functions. Client apps are pure consumers — they call `getAuth()`, check `auth.currentUser`, and read the `role` custom claim, but never render a login page of their own.

**Impact of Cloud Run on a different domain:** Firebase's built-in token persistence works transparently only when both apps share the same registrable domain (e.g. `*.yourdomain.com`). A Cloud Run app on `app2.run.app` or even `app2.otherdomain.com` cannot share the Auth Portal's IndexedDB token store. A **custom token bridge** (Phase 5.3) is required for that app. This does not affect pew-pew, which can remain on the same primary domain.

---

## Phase 1 · Create the Auth Portal Repository

**Goal:** Bootstrap the new standalone app with the same stack.

### 1.1 Create a new repository

- Create a new Git repository: `auth-portal` (or equivalent name).
- Scaffold with Vite + React + TypeScript: `npm create vite@latest auth-portal -- --template react-ts`
- Install Shadcn/ui, React Router, and the same Firebase SDK versions used in pew-pew.

### 1.2 Decide on the Firebase project strategy

Two options — pick one before proceeding:

| Option | Description | Trade-offs |
|--------|-------------|------------|
| **A — Shared project** (recommended) | Auth Portal and pew-pew use the same Firebase project. Auth tokens are valid in both apps without any cross-project plumbing. | One Firebase quota; all apps appear under one project. |
| **B — Dedicated Auth project** | Auth Portal has its own Firebase project and acts as a custom identity provider for other projects via OIDC federation. | Full isolation; significantly higher complexity (OIDC token exchange, cross-project custom claims). |

**Recommendation: Option A.** The Auth Portal is co-tenant on the existing `pew-bab23` Firebase project. This is the standard multi-app pattern Firebase is designed for.

**Note on Cloud Run in a different GCP project:** A Firebase project is not the same as a Google Cloud project — they are linked but separate. A Cloud Run service in a different GCP project can still use `pew-bab23` as its Firebase project by registering as a web app and initializing the Firebase SDK with `pew-bab23`'s config. The Cloud Run backend can verify Firebase Auth tokens using the Firebase Admin SDK, initialised with a service account that has the `Firebase Auth Viewer` IAM role on `pew-bab23`. No cross-project federation or Option B complexity is needed.

### 1.3 Register the Auth Portal as a new web app

- In the Firebase Console → Project Settings → Your apps → Add app → Web.
- Give it the name `auth-portal`. Note the new `firebaseConfig` object (different `appId` from pew-pew, but same `projectId`, `apiKey`, and `authDomain`).
- Register the Auth Portal's domain (e.g. `auth.yourdomain.com`) under Firebase Console → Authentication → Settings → Authorized domains.

---

## Phase 2 · Move Cloud Functions

**Goal:** Functions serve both apps, so they stay in the shared Firebase project but are updated to support per-app routing.

### 2.1 Copy `functions/src/umConfig.ts`

- Copy the file verbatim to the auth-portal repository's `functions/src/umConfig.ts`.
- The pew-pew copy becomes the source of truth only for pew-pew's data (connector IDs, app name). If both share one functions deploy, there is only one copy — in a shared `functions/` package for the project.

### 2.2 Update `sendInvite` and email functions with per-app URLs

Currently `APP_URL` is a single `defineString` param. With multiple apps, the invite/reset links must point to the correct app's origin:

- Add a `clientAppUrl` field to `umConfig` (or use a separate `defineString` per app, e.g. `APP_URL_PEW_PEW`, `APP_URL_APP2`).
- The `sendInvite` callable should accept an optional `appKey` argument so the admin can specify which app the invite belongs to — the function resolves the correct base URL from config.
- **Auth Portal URL** (e.g. `https://auth.yourdomain.com`) is used for invite and password reset links, since all identity flows live there.

### 2.3 No other function changes required

All other functions (`requestAccess`, `setUserRole`, `revokeUserAccess`, etc.) are app-agnostic — they operate on Firebase Auth and Firestore only, with no app-specific routing.

---

## Phase 3 · Move Client Pages and Components

**Goal:** Transplant all identity UI from pew-pew's `src/pages/` into the Auth Portal.

### 3.1 Pages to move (verbatim)

Copy these files from `pew-pew/src/pages/` to `auth-portal/src/pages/`:

| File | Purpose |
|------|---------|
| `LoginPage.tsx` | Email/password + Google/Microsoft sign-in |
| `RequestAccessPage.tsx` | Public access request form |
| `AcceptInvitePage.tsx` | Email link sign-in + password setup |
| `ForgotPasswordPage.tsx` | Self-service password reset request |
| `ResetPasswordPage.tsx` | Password reset confirmation |
| `ProfilePage.tsx` | User profile, email/password change, delete account |
| `UserManagementPage.tsx` | Admin-only user table |

### 3.2 Shared library files to move

Copy these from pew-pew's `src/lib/` and `src/contexts/`:

- `src/lib/umConfig.ts` — Update `appHome` route to point to pew-pew's URL (full URL, not a path, since it's a cross-origin redirect after login).
- `src/lib/firebase.ts` — Update with the Auth Portal's `firebaseConfig` (same `projectId`, new `appId`).
- `src/lib/firestore.ts` — No changes needed.
- `src/lib/functions.ts` — No changes needed.
- `src/contexts/AuthContext.tsx` — No changes needed.

### 3.3 Update `appHome` to cross-origin redirect

In `src/lib/umConfig.ts` for the Auth Portal, change:

```ts
// Before (same-origin path):
appHome: "/wiki",

// After (cross-origin full URL, read from env):
appHome: import.meta.env.VITE_APP_HOME_URL ?? "http://localhost:5173/wiki",
```

After successful login / password setup, the Auth Portal redirects the user to the target application's URL instead of a local route.

---

## Phase 4 · Update pew-pew

**Goal:** Strip all identity UI from pew-pew and replace it with redirects to the Auth Portal.

### 4.1 Remove pages from pew-pew

Delete these files from `pew-pew/src/pages/`:

- `LoginPage.tsx`
- `RequestAccessPage.tsx`
- `AcceptInvitePage.tsx`
- `ForgotPasswordPage.tsx`
- `ResetPasswordPage.tsx`
- `ProfilePage.tsx`
- `UserManagementPage.tsx`

### 4.2 Update `App.tsx` routing

Replace the routes for the removed pages with a single redirect guard:

```tsx
// In the route that was /login:
<Route path="/login" element={<Navigate to={AUTH_PORTAL_URL + "/login"} replace />} />
```

Add `VITE_AUTH_PORTAL_URL` to `.env` files.

### 4.3 Update the auth guard

The `AuthContext` / `ProtectedRoute` in pew-pew should redirect unauthenticated users to the Auth Portal's login page (full URL) instead of the local `/login` route:

```ts
// Before:
navigate("/login", { replace: true });

// After:
window.location.href = import.meta.env.VITE_AUTH_PORTAL_URL + "/login";
```

### 4.4 Update WikiLayout

- Remove the `navigate(umConfig.routes.adminUsers)` button — admin user management is now in the Auth Portal.
- Update the Profile button to redirect to `AUTH_PORTAL_URL + "/profile"` (cross-origin).
- Alternatively, keep the Profile button as a link (`<a href={...}>`) rather than a `navigate()` call.

### 4.5 Remove UM-specific firestore.ts exports

The `ACCESS_REQUESTS_COLLECTION` and `ADMIN_AUDIT_LOG_COLLECTION` constants are only needed in the Auth Portal after this migration. Remove them from pew-pew's `firestore.ts`.

---

## Phase 5 · Authentication Flow Across Apps

**Goal:** Ensure all consumer apps accept tokens issued by the Auth Portal.

Two distinct patterns apply depending on whether the consumer app shares the same registrable domain as the Auth Portal.

### 5.1 Pattern A — Same registrable domain (pew-pew)

Applies when both apps are on `*.yourdomain.com`.

1. User logs in at `auth.yourdomain.com` (Auth Portal).
2. Firebase Auth persists the token in IndexedDB, keyed to the `authDomain` value.
3. The user is redirected to `pew-pew.yourdomain.com/wiki`.
4. pew-pew initialises the Firebase SDK with the same `authDomain`. `onAuthStateChanged()` fires immediately with the existing user — **no second login required**.

**Critical:** Both apps must declare identical `authDomain` values in their `firebaseConfig`. Set this to your custom Auth Portal domain (e.g. `auth.yourdomain.com`) rather than the default `pew-bab23.firebaseapp.com`.

### 5.2 Pattern B — Different domain (Cloud Run app)

Applies to any app that is not on the same registrable domain as the Auth Portal (e.g. `app2.run.app`, or a custom domain on a completely separate TLD).

Firebase's IndexedDB token store is scoped per origin, so the Cloud Run app cannot read the token the Auth Portal wrote. A **custom token bridge** is required:

**Login flow:**
1. User visits the Cloud Run app unauthenticated → redirected to `auth.yourdomain.com/login?app=app2&returnTo=<encoded-path>`.
2. User authenticates normally in the Auth Portal.
3. Auth Portal calls a new `generateSignInToken` Cloud Function (see below), which returns a short-lived Firebase custom token.
4. Auth Portal redirects to `app2.run.app/auth/callback?token=<customToken>&returnTo=<path>`.
5. The Cloud Run app's frontend calls `signInWithCustomToken(token)` — Firebase exchanges it for a full session.
6. The user is forwarded to their original destination.

**`generateSignInToken` Cloud Function (new — add to functions):**
```ts
// Callable by authenticated users only. Returns a custom token for the caller.
export const generateSignInToken = onCall(
  { region: umConfig.region },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");
    const customToken = await getAuth().createCustomToken(request.auth.uid);
    return { token: customToken };
  }
);
```

**Security properties of this flow:**
- The custom token is generated server-side for the already-authenticated user — no credentials are passed in the redirect.
- Custom tokens expire after 1 hour and can only be used once to establish a session.
- The `returnTo` URL must be validated server-side against an allowlist of known app domains before the redirect is issued, to prevent open redirect attacks.
- The `token` query parameter should be removed from the URL immediately after `signInWithCustomToken()` completes (use `history.replaceState`).

### 5.3 Cloud Run backend — verifying tokens

If the Cloud Run service exposes an API that must be protected (not just a static SPA), the backend must verify Firebase ID tokens on each request:

1. The Cloud Run app's frontend attaches the Firebase ID token to API requests: `Authorization: Bearer <idToken>`.
2. The Cloud Run backend initialises the Firebase Admin SDK pointed at `pew-bab23`:
   ```python
   # Python example
   import firebase_admin
   from firebase_admin import auth, credentials
   cred = credentials.ApplicationDefault()  # Works if Cloud Run SA has Firebase Auth Viewer role on pew-bab23
   firebase_admin.initialize_app(cred, { 'projectId': 'pew-bab23' })
   ```
3. On each request: `decoded = auth.verify_id_token(id_token)` — this validates the JWT signature against Firebase's public keys and checks expiry.
4. The `role` custom claim is available as `decoded['role']`.

**IAM requirement:** Grant the Cloud Run service account the **Firebase Authentication Viewer** role (`roles/firebaseauth.viewer`) on the `pew-bab23` Google Cloud project.

### 5.4 Custom claims on the client

Both pew-pew and the Cloud Run app read `auth.currentUser.getIdTokenResult()` to access `claims.role`. No changes needed — the claim is set by the same `setUserRole` function in the shared Firebase project.

---

## Phase 6 · Deployment

**Goal:** Deploy the Auth Portal as a separate Firebase Hosting site in the same project.

### 6.1 Add a second Hosting site

In Firebase Console → Hosting → Add another site. Name it `auth-portal` (this gives you `auth-portal.web.app` for staging).

### 6.2 Update `firebase.json`

In the shared `firebase.json` (or in the auth-portal repo's own `firebase.json` if it's a separate repo):

```json
{
  "hosting": [
    {
      "target": "wiki",
      "public": "dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "auth-portal",
      "public": "auth-portal/dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

### 6.3 Set environment variables

For each app, create a separate `.env.production` file:

**Auth Portal:**
```
VITE_APP_HOME_URL_PEW_PEW=https://pew-pew.yourdomain.com/wiki
```

**pew-pew:**
```
VITE_AUTH_PORTAL_URL=https://auth.yourdomain.com
```

---

## Phase 7 · Adding the Cloud Run Application

**Goal:** Onboard the Cloud Run app as a second consumer of the Auth Portal.

### 7.1 Register the Cloud Run app in the Firebase project

- Firebase Console → Project Settings → Your apps → Add app → Web.
- Note the new `appId`. The `projectId`, `apiKey`, and `authDomain` are identical to the Auth Portal's config.
- Add the Cloud Run app's domain to Firebase Console → Authentication → Settings → Authorized domains.

### 7.2 Register the app in umConfig

In the Auth Portal's `src/lib/umConfig.ts`, extend the `appHomeUrls` map:

```ts
appHomeUrls: {
  "pew-pew": import.meta.env.VITE_APP_HOME_URL_PEW_PEW,
  "app2":    import.meta.env.VITE_APP_HOME_URL_APP2,   // e.g. https://app2.run.app
},
```

### 7.3 Implement the `?app=` query parameter

When the Cloud Run app redirects an unauthenticated user to the Auth Portal, it appends `?app=app2&returnTo=<encoded-path>`. After login, the Auth Portal:
1. Reads `app` from the query string and looks up the home URL in `appHomeUrls`.
2. Validates the resolved URL is in the allowlist (guards against open redirect).
3. Calls `generateSignInToken` to obtain a custom token.
4. Redirects to `<appHomeUrl>/auth/callback?token=<customToken>&returnTo=<path>`.

### 7.4 Add the custom token receiver to the Cloud Run app

Add a `/auth/callback` route to the Cloud Run app's frontend:

```ts
// auth/callback route — runs once on load
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const returnTo = params.get("returnTo") ?? "/";

if (token) {
  // Remove token from URL immediately before async work
  window.history.replaceState({}, "", returnTo);
  await signInWithCustomToken(getAuth(), token);
}
// onAuthStateChanged will now fire with the authenticated user
```

### 7.5 Add the `generateSignInToken` Cloud Function

Add this function to the Auth Portal's `functions/src/` (see Phase 5.2 for the full implementation) and export it from `index.ts`.

### 7.6 Configure backend token verification

- Grant the Cloud Run service account the **Firebase Authentication Viewer** role on `pew-bab23`.
- Initialise the Firebase Admin SDK in the Cloud Run backend with `projectId: 'pew-bab23'` (see Phase 5.3).
- Add `verify_id_token` middleware to all protected API routes.

---

## Work Item Checklist

### Phase 1 — Bootstrap Auth Portal
- [ ] Create `auth-portal` Git repository
- [ ] Scaffold Vite + React + TypeScript
- [ ] Install dependencies (Firebase, React Router, Shadcn/ui, Tailwind)
- [ ] Register Auth Portal web app in Firebase Console (same project)
- [ ] Add Auth Portal domain to Firebase Auth authorized domains

### Phase 2 — Functions
- [ ] Decide single vs. shared `functions/` package (mono-repo vs. separate deploy)
- [ ] Update `umConfig.ts` to support per-app invite/reset URLs
- [ ] Update `sendInvite` to accept `appKey` and resolve the correct redirect URL
- [ ] Update `APP_URL` param to be per-app (rename + add second param)

### Phase 3 — Port Auth Portal UI
- [ ] Copy all 7 identity pages to auth-portal
- [ ] Copy `lib/` and `contexts/` files
- [ ] Update `umConfig.ts` — `appHome` to cross-origin `VITE_APP_HOME_URL`
- [ ] Update `firebase.ts` with Auth Portal `appId`
- [ ] Set up `App.tsx` routing (same routes as pew-pew currently has for auth)
- [ ] Verify Auth Portal works end-to-end against the emulator

### Phase 4 — Strip pew-pew
- [ ] Delete 7 identity pages from pew-pew
- [ ] Update `App.tsx` — replace auth routes with redirects to Auth Portal
- [ ] Update `ProtectedRoute` / `AuthContext` to redirect to Auth Portal URL
- [ ] Update `WikiLayout` — Profile button links to Auth Portal, remove admin nav
- [ ] Remove UM-specific constants from `firestore.ts`
- [ ] Add `VITE_AUTH_PORTAL_URL` to `.env` and `.env.production`

### Phase 5 — Cross-App Token Sharing
- [ ] Confirm both Auth Portal and pew-pew use identical `authDomain` in `firebaseConfig`
- [ ] Test login via Auth Portal → redirect to pew-pew → `onAuthStateChanged` fires (Pattern A)
- [ ] Confirm custom claims (`role`) are readable in pew-pew after Auth Portal login
- [ ] Implement `generateSignInToken` Cloud Function
- [ ] Implement `?app=` query param and redirect logic in Auth Portal post-login handler
- [ ] Validate `returnTo` URL against allowlist before issuing the redirect (open redirect guard)

### Phase 6 — Deployment
- [ ] Add `auth-portal` as a second Hosting site in the Firebase project
- [ ] Update `firebase.json` with multi-site hosting targets
- [ ] Configure production environment variables for both apps
- [ ] Set up CI/CD deploy steps for the Auth Portal site

### Phase 7 — Cloud Run App Onboarding
- [ ] Register Cloud Run app as a Firebase web app in `pew-bab23`
- [ ] Add Cloud Run app domain to Firebase Auth authorized domains
- [ ] Add `app2` entry to `umConfig.appHomeUrls` + set `VITE_APP_HOME_URL_APP2`
- [ ] Implement `/auth/callback` route in Cloud Run frontend (custom token receiver)
- [ ] Grant Cloud Run service account `Firebase Authentication Viewer` role on `pew-bab23`
- [ ] Add `verify_id_token` middleware to Cloud Run backend API routes
- [ ] Export `generateSignInToken` from `functions/src/index.ts`
