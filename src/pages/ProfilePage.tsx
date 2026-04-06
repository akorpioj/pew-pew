import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { requestAccountDeletionCallable } from "@/lib/functions";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  "password": "Email / Password",
  "google.com": "Google",
  "microsoft.com": "Microsoft",
};

function getProvider(user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
  return user.providerData[0]?.providerId ?? "password";
}

function isEmailPasswordAccount(
  user: NonNullable<ReturnType<typeof useAuth>["user"]>
) {
  return getProvider(user) === "password";
}

function mapError(err: unknown): string {
  if (!(err instanceof FirebaseError)) return "Something went wrong. Please try again.";
  switch (err.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/email-already-in-use":
      return "That email is already in use by another account.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/requires-recent-login":
      return "Please re-authenticate before making this change.";
    default:
      return err.message;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // ── Re-auth gate ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [reauthing, setReauthing] = useState(false);
  const [reauthed, setReauthed] = useState(false);
  const [reAuthError, setReAuthError] = useState<string | null>(null);

  // ── Change email ──────────────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  // ── Change password ───────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordResult, setPasswordResult] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  // ── Account deletion ──────────────────────────────────────────────────────
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) return null;

  const isEmailPassword = isEmailPasswordAccount(user);
  const provider = getProvider(user);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleReAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setReAuthError(null);
    setReauthing(true);
    try {
      const credential = EmailAuthProvider.credential(user.email ?? "", currentPassword);
      await reauthenticateWithCredential(user, credential);
      setReauthed(true);
      setCurrentPassword("");
    } catch (err) {
      setReAuthError(mapError(err));
    } finally {
      setReauthing(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailResult(null);
    setEmailSubmitting(true);
    try {
      await verifyBeforeUpdateEmail(user, newEmail.trim().toLowerCase());
      setEmailResult({
        kind: "success",
        message: `A verification link has been sent to ${newEmail.trim()}. The change will take effect once you click the link.`,
      });
      setNewEmail("");
    } catch (err) {
      setEmailResult({ kind: "error", message: mapError(err) });
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResult(null);

    if (newPassword !== confirmPassword) {
      setPasswordResult({ kind: "error", message: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordResult({
        kind: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }

    setPasswordSubmitting(true);
    try {
      // `auth.currentUser` is always non-null here (guard at top of component).
      await updatePassword(auth.currentUser!, newPassword);
      setPasswordResult({ kind: "success", message: "Password updated." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordResult({ kind: "error", message: mapError(err) });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await requestAccountDeletionCallable();
      // Account is now disabled; sign out and redirect.
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to submit deletion request. Please try again."
      );
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details.
        </p>
      </div>

      {/* ── Account info ── */}
      <section className="flex flex-col gap-3 rounded-lg border p-5">
        <h2 className="text-sm font-medium">Account information</h2>
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground">Email</span>
          <span>{user.email ?? "—"}</span>
          {user.displayName && (
            <>
              <span className="text-muted-foreground">Name</span>
              <span>{user.displayName}</span>
            </>
          )}
          <span className="text-muted-foreground">Sign-in method</span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            {PROVIDER_LABELS[provider] ?? provider}
          </span>
        </div>
      </section>

      {/* ── Email/password sections ── */}
      {isEmailPassword && (
        <>
          {/* Re-auth gate */}
          {!reauthed && (
            <section className="flex flex-col gap-3 rounded-lg border p-5">
              <h2 className="text-sm font-medium">Confirm your password</h2>
              <p className="text-xs text-muted-foreground">
                Enter your current password to unlock account changes.
              </p>
              <form onSubmit={handleReAuth} className="flex flex-col gap-3">
                <Input
                  type="password"
                  placeholder="Current password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={reauthing}
                />
                {reAuthError && (
                  <p role="alert" className="text-sm text-destructive">
                    {reAuthError}
                  </p>
                )}
                <Button type="submit" disabled={reauthing} className="self-start">
                  {reauthing ? "Verifying…" : "Confirm"}
                </Button>
              </form>
            </section>
          )}

          {/* Change email — only shown after re-auth */}
          {reauthed && (
            <section className="flex flex-col gap-3 rounded-lg border p-5">
              <h2 className="text-sm font-medium">Change email</h2>
              <p className="text-xs text-muted-foreground">
                A verification link will be sent to your new address. The change
                is applied only after you click the link.
              </p>
              <form onSubmit={handleChangeEmail} className="flex flex-col gap-3">
                <Input
                  type="email"
                  placeholder="New email address"
                  autoComplete="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={emailSubmitting}
                />
                {emailResult && (
                  <p
                    role={emailResult.kind === "error" ? "alert" : "status"}
                    className={`text-sm ${
                      emailResult.kind === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {emailResult.message}
                  </p>
                )}
                <Button type="submit" disabled={emailSubmitting} className="self-start">
                  {emailSubmitting ? "Sending…" : "Send verification link"}
                </Button>
              </form>
            </section>
          )}

          {/* Change password — only shown after re-auth */}
          {reauthed && (
            <section className="flex flex-col gap-3 rounded-lg border p-5">
              <h2 className="text-sm font-medium">Change password</h2>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                <Input
                  type="password"
                  placeholder="New password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordSubmitting}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={passwordSubmitting}
                />
                {passwordResult && (
                  <p
                    role={passwordResult.kind === "error" ? "alert" : "status"}
                    className={`text-sm ${
                      passwordResult.kind === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {passwordResult.message}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="self-start"
                >
                  {passwordSubmitting ? "Saving…" : "Update password"}
                </Button>
              </form>
            </section>
          )}
        </>
      )}

      {/* ── Danger zone ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-5">
        <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
        <p className="text-xs text-muted-foreground">
          Deleting your account disables your access immediately and queues a
          data deletion request for admin review. Your authored articles will not
          be deleted automatically.
        </p>
        {deleteError && (
          <p role="alert" className="text-sm text-destructive">
            {deleteError}
          </p>
        )}
        <Button
          variant="destructive"
          className="self-start"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete my account
        </Button>
      </section>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!open) setShowDeleteDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your account will be disabled immediately and all your sessions
              terminated. A deletion request will be submitted for admin review.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDeleteAccount}>
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
