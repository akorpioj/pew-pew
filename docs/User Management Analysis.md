Here is a thorough analysis with specific, prioritised suggestions across security, UX, and completeness.

---

## Security Issues (OWASP)

### 1. Email Enumeration (Req. 1, 5)

**Req. 1** says "Only one request per email is accepted" — if the UI gives a distinct error when a duplicate is detected, an attacker can probe which emails already exist in the system.

**Req. 5** (password reset) has the same problem — a different response for a known vs unknown email leaks membership.

> **Suggested wording for both:**
> The system always returns the same neutral confirmation message regardless of whether the email is known (e.g. *"If your request can be fulfilled, you will receive an email."*)

---

### 2. No Re-authentication Before Sensitive Changes (Req. 6)

Changing a password or email is a "sensitive action" under OWASP A07. Firebase itself enforces a `requires-recent-login` error for these operations, but the spec should reflect this.

> **Add:** *Before changing their email or password, the user must re-authenticate (confirm current password).*

---

### 3. No OAuth Account Linking Rule (Req. 2)

If a user registered with `email/password` and then tries Google login with the same email, Firebase will by default prevent this with an `account-exists-with-different-credential` error. The current spec doesn't address this, leaving it undefined behaviour.

> **Add:** *If a user already has an email/password account and attempts Google/Microsoft sign-in with the same address, the UI should prompt them to log in with email/password instead.*

---

### 4. Admin Privilege Escalation (Req. 4)

Admin granting the ADMIN role to another user is a privilege escalation event. Best practice requires either a super-admin tier, or a confirmation/second-factor step.

> **Add:** *Granting ADMIN rights requires a confirmation dialog. An admin cannot remove their own ADMIN role. The system must prevent the last admin account from being demoted.*

---

### 5. Admin Password Reset Wording (Req. 4)

*"reset the user's password"* is ambiguous — an admin should **never set or view a plain-text password**. The intent is almost certainly to **send a reset email** to the user.

> **Change to:** *The admin can trigger a password-reset email to be sent to the user. The admin at no point sets or views a password.*

---

## Missing Requirements

### 6. Invite / Reset Link Expiry (Req. 3, 5)

Neither invite links nor password reset links have an expiry defined. Stale links are a security risk.

> **Add:** *Access invite links expire after 72 hours. Password reset links expire after 1 hour. Expired links instruct the user to restart the flow.*

---

### 7. No Audit Log

Admin actions (role changes, access revocations, accepted invites) have no logging requirement — essential for a private, role-controlled system.

> **Add:** *All admin actions (invite sent/accepted, role change, access revocation) are logged with actor UID, target UID, action type, and timestamp.*

---

### 8. Revoke vs Delete Ambiguity (Req. 4)

"Revoke the access of a user" is vague. Deleting the Firebase Auth account would orphan their articles in Data Connect.

> **Change to:** *Revoking access disables the user's Firebase Auth account (soft delete). Their authored articles remain. A disabled user cannot log in but their content is preserved.*

---

### 9. New Email Verification (Req. 6)

Changing to an email address without verification allows a user to lock themselves out or hijack a display identity.

> **Add:** *When a user changes their email address, a verification link is sent to the new address. The change is not applied until the new address is verified.*

---

### 10. OAuth Users and Password Fields (Req. 6)

Google/Microsoft users don't have a password. The profile page should handle this gracefully.

> **Add:** *The "change password" option is only shown for email/password accounts. OAuth users' profiles display their provider (Google / Microsoft) with no password section.*

---

## UX / Completeness Gaps

### 11. What Happens to a Rejected or Expired Request (Req. 1)

The spec says "only one request per email is accepted" but says nothing about rejection. Can a user re-apply after being rejected?

> **Add:** *If an admin rejects a request, the user's email is unblocked for future requests. The user receives an email informing them their request was declined (without specifying the reason).*

---

### 12. Rate Limiting / Abuse Protection (Req. 1, 5)

The access request and password reset forms have no mention of rate limiting, making them viable spam/abuse vectors.

> **Add:** *The request-access and password-reset forms are protected by rate limiting (e.g. 3 attempts per IP per 10 minutes). Firebase App Check further prevents automated abuse.*

---

### 13. First Login Password-Set Mechanism (Req. 3)

"Must set it when logging in the first time" is under-specified. In Firebase this is done via an **email sign-in link** (passwordless) or **password reset link** — the invite email effectively doubles as a first-time password setup link.

> **Clarify:** *The invite email contains a one-time sign-in link. When the user follows it, they are prompted to set their password before proceeding to the app.*

---

### 14. No Account Deletion / GDPR Right to Erasure (Req. 6)

A profile page that only allows changing email/password has no self-service account deletion, which is a standard user expectation and GDPR requirement.

> **Consider adding:** *The user can request account deletion from their profile page. This disables their Firebase Auth account and queues a data deletion request for admin review.*

---

## Summary Table

| # | Requirement | Category | Priority |
|---|---|---|----------|
| 1 | Neutral response for duplicate/unknown email | Security (enumeration) | High |
| 2 | Re-auth before email/password change | Security (OWASP A07) | High |
| 3 | Account linking rule for OAuth + email collisions | Security / UX | High |
| 4 | Admin role escalation guard + last-admin protection | Security | High |
| 5 | Clarify admin password reset = sends email only | Security | High |
| 6 | Define expiry for invite and reset links | Security | Medium |
| 7 | Audit log for admin actions | Compliance | Medium |
| 8 | Revoke = disable (soft delete), not delete | Data integrity | Medium |
| 9 | Verify new email before applying change | Security / UX | Medium |
| 10 | Hide password section for OAuth users | UX | Low |
| 11 | Define what happens after rejection | UX | Low |
| 12 | Rate limiting on request/reset forms | Security | Medium |
| 13 | Specify first-login password-set mechanism | Clarity | Low |
| 14 | Self-service account deletion (GDPR) | Compliance | Low |