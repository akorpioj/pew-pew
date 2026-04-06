1. If the user has not been registered yet (new user), they can request access. The user enters their email address and presses the 'Request Access' button. The request is shown to the admin in the admin's user management page. The system always returns the same neutral confirmation message regardless of whether the email is known (e.g. "If your request can be fulfilled, you will receive an email."). If an admin rejects a request, the user's email is unblocked for future requests. The user receives an email informing them their request was declined (without specifying the reason). The request-access and password-reset forms are protected by rate limiting (e.g. 3 attempts per IP per 10 minutes). Firebase App Check further prevents automated abuse.
2. There are multiple methods for log in: email/password, Google, Microsoft. Google/Microsoft login must fail, if the user has not been registered with that email. In that case, the UI instructs the user to request access with their Google/Microsoft email address. If a user already has an email/password account and attempts Google/Microsoft sign-in with the same address, the UI should prompt them to log in with email/password instead.
3. The admin can accept access requests or send access invites. Accepting or sending an invite triggers creating a new user in the system and sending an email to the user, telling them that they can now log in. When the user follows it, they are prompted to set their password before proceeding to the app. Access invite links expire after 72 hours. Expired links instruct the user to restart the flow.
4. The admin can a) revoke the access of a user, b) grant/remove EXPERT/ADMIN rights, c) trigger a password-reset email to be sent to the user. The admin at no point sets or views a password. Revoking access disables the user's Firebase Auth account (soft delete). Their authored articles remain. A disabled user cannot log in but their content is preserved. Granting ADMIN rights requires a confirmation dialog. An admin cannot remove their own ADMIN role. The system must prevent the last admin account from being demoted. All admin actions (invite sent/accepted, role change, access revocation) are logged with actor UID, target UID, action type, and timestamp.
5. The user can request to reset their own password. The system then sends them an email with a link to password reset page. Password reset links expire after 1 hour. Expired links instruct the user to restart the flow. The request-access and password-reset forms are protected by rate limiting (e.g. 3 attempts per IP per 10 minutes). Firebase App Check further prevents automated abuse.
6. The user can see their data in their profile page. They can change their email address or password there. Before changing their email or password, the user must re-authenticate (confirm current password). When a user changes their email address, a verification link is sent to the new address. The change is not applied until the new address is verified. The "change password" option is only shown for email/password accounts. OAuth users' profiles display their provider (Google / Microsoft) with no password section. The user can request account deletion from their profile page. This disables their Firebase Auth account and queues a data deletion request for admin review.

---

## Implementation Task List

### UM-1 · Firebase Auth Setup
- [X] Enable Email/Password, Google, and Microsoft (Azure AD) providers in the Firebase Console
- [X] Configure the `syncUserOnSignup` Cloud Function trigger (`beforeUserCreated`) to create a `User` row in Data Connect with role `VIEWER`
- [X] Block unregistered OAuth sign-ins: in `syncUserOnSignup`, check if the email already exists in the `User` table; if not, surface an error to the client (the blocking trigger prevents account creation — no deletion needed)
- [X] Handle `account-exists-with-different-credential` on the client — prompt the user to log in with email/password when their email is already registered that way
- [ ] Enable App Check (reCAPTCHA v3 for web) and enforce it on all callable Functions and Data Connect operations

### UM-2 · Access Request Flow
- [X] Create a `Firestore` collection `accessRequests` with fields: `email`, `status` (`pending` | `approved` | `rejected`), `createdAt`
- [X] Build `RequestAccessPage`: email input + "Request Access" button
- [X] On submit, upsert a `pending` record — silently ignore duplicate emails at the backend; always return the neutral message *"If your request can be fulfilled, you will receive an email."*
- [X] Add rate limiting to the `requestAccess` callable Function (3 calls / IP / 10 min using a Firestore counter or Firebase App Check token budget)
- [X] Admin UI: display `accessRequests` where `status === 'pending'` in the User Management page (approve / reject actions)
- [X] On **reject**: set `status = 'rejected'`, send a decline email (no reason given), then delete the document so the email can be reused
- [X] On **approve**: delegate to the invite flow (UM-3)

### UM-3 · Invite & First-Login Flow
- [X] Create a `sendInvite` callable Function that:
  - Creates a Firebase Auth user with the given email (disabled = false)
  - Generates an email sign-in link (`generateSignInWithEmailLink`) with 72-hour expiry
  - Sends the link via email (Firebase Extensions → Trigger Email, or a direct SendGrid call)
  - Creates the `User` row in Data Connect with role `VIEWER`
- [X] On the client, detect a sign-in link in the URL (`isSignInWithEmailLink`); prompt the user to set a password before continuing
- [X] Show a friendly error page when an invite link has expired, with a "Request a new invite" CTA
- [X] Allow the admin to re-send an invite from the User Management page (re-generates the link without creating a duplicate Auth user)

### UM-4 · Admin User Management Page
- [X] Build a `UserManagementPage` (ADMIN only) with a data table showing all `User` rows: name / email, role, status (active / disabled)
- [X] **Revoke access**: call `admin.auth().updateUser(uid, { disabled: true })` via a `revokeUserAccess` callable Function; update `User.status` in Data Connect — do NOT delete the user or their articles
- [X] **Grant/remove EXPERT role**: update the `role` custom claim via `admin.auth().setCustomUserClaims()` + update the `User` row
- [X] **Grant ADMIN role**: same as above, but require a confirmation dialog on the client; guard the Function so it rejects if the actor is demoting themselves or removing the last ADMIN
- [X] **Trigger password reset**: call `admin.auth().generatePasswordResetLink(email)` and send it via email — the Function never receives or returns a raw password
- [X] **Audit log**: write an `adminAuditLog` Firestore document for every action: `{ actorUid, targetUid, action, timestamp }`

### UM-5 · Password Reset (Self-Service)
- [ ] Build a `ForgotPasswordPage`: email input + "Send Reset Link" button
- [ ] On submit, call `sendPasswordResetEmail()` (Firebase SDK client-side); always display the neutral message regardless of whether the email exists (prevents enumeration)
- [ ] Password reset links expire after 1 hour (Firebase default; confirm in Firebase Console → Auth → Templates)
- [ ] Show an "Link expired — request a new one" page when the user lands on a stale reset link
- [ ] Apply the same rate limiting as UM-2

### UM-6 · User Profile Page
- [ ] Build a `ProfilePage` showing: display name, email, auth provider badge (Email / Google / Microsoft)
- [ ] **Re-authentication gate**: before showing the change-email or change-password form, call `reauthenticateWithCredential()` and require the current password; surface a meaningful error if it fails
- [ ] **Change email**: call `verifyBeforeUpdateEmail(newEmail)` — Firebase sends a verification link to the new address; do not apply the change until the user clicks the link
- [ ] **Change password** (email/password accounts only): call `updatePassword(newPassword)` after re-auth; hide this section entirely for Google/Microsoft accounts and display the provider name instead
- [ ] **Account deletion**: show a "Delete my account" option that disables the Auth account and writes a `deletionRequest` Firestore document for admin review; confirm with the user via a dialog before proceeding