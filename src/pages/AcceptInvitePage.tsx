import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { umConfig } from "@/lib/umConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMAIL_STORAGE_KEY = umConfig.emailStorageKey;

/** Firebase error codes that mean the link is expired, already used, or invalid. */
const EXPIRED_CODES = new Set([
  "auth/expired-action-code",
  "auth/invalid-action-code",
]);

type Stage =
  | { kind: "detecting" }
  | { kind: "needs-email" }
  | { kind: "signing-in" }
  | { kind: "needs-password"; user: User }
  | { kind: "setting-password"; user: User }
  | { kind: "expired" }
  | { kind: "error"; message: string };

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const href = window.location.href;
  const [stage, setStage] = useState<Stage>({ kind: "detecting" });
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Holds the resolved email used for signInWithEmailLink.
  const resolvedEmail = useRef("");

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, href)) {
      // Not a sign-in link at all — send to login.
      navigate(umConfig.routes.login, { replace: true });
      return;
    }

    // The Firebase recommended pattern is to store the email in localStorage
    // when the sign-in flow begins in the same browser. Because users may open
    // the link in a different browser / device, we fall back to asking them.
    const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (stored) {
      resolvedEmail.current = stored;
      void attemptSignIn(stored);
    } else {
      setStage({ kind: "needs-email" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function attemptSignIn(email: string) {
    setStage({ kind: "signing-in" });
    try {
      const credential = await signInWithEmailLink(auth, email, href);
      localStorage.removeItem(EMAIL_STORAGE_KEY);
      setStage({ kind: "needs-password", user: credential.user });
    } catch (err) {
      if (err instanceof FirebaseError && EXPIRED_CODES.has(err.code)) {
        setStage({ kind: "expired" });
      } else {
        setStage({
          kind: "error",
          message:
            err instanceof FirebaseError
              ? err.message
              : "Sign-in failed. Please try again.",
        });
      }
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    resolvedEmail.current = email;
    void attemptSignIn(email);
  };

  const handlePasswordSubmit = async (e: React.FormEvent, user: User) => {
    e.preventDefault();
    setFieldError(null);

    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Passwords do not match.");
      return;
    }

    setStage({ kind: "setting-password", user });
    try {
      await updatePassword(user, password);
      navigate(umConfig.routes.appHome, { replace: true });
    } catch (err) {
      setStage({ kind: "needs-password", user });
      setFieldError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to set password. Please try again."
      );
    }
  };

  // ── Loading / signing-in splash ──────────────────────────────────────────
  if (stage.kind === "detecting" || stage.kind === "signing-in") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Verifying your invite link…</p>
      </div>
    );
  }

  // ── Expired / already-used link ──────────────────────────────────────────
  if (stage.kind === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Invite link expired
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            This invite link has expired or has already been used. Invite links
            are valid for 72 hours.
          </p>
        </div>
        <Link to={umConfig.routes.requestAccess}>
          <Button>Request a new invite</Button>
        </Link>
        <Link
          to={umConfig.routes.login}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  // ── Generic error ────────────────────────────────────────────────────────
  if (stage.kind === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {stage.message}
        </p>
        <Link to={umConfig.routes.login}>
          <Button variant="outline">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  // ── Email confirmation (different device / browser) ──────────────────────
  if (stage.kind === "needs-email") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Accept your invite
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the email address where you received the invite.
          </p>
        </div>
        <form
          onSubmit={handleEmailSubmit}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <Input
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    );
  }

  // ── Set password ─────────────────────────────────────────────────────────
  const user = stage.user;
  const isSettingPassword = stage.kind === "setting-password";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a password to complete your account setup.
        </p>
      </div>
      <form
        onSubmit={(e) => handlePasswordSubmit(e, user)}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <Input
          type="password"
          placeholder="New password (min. 8 characters)"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSettingPassword}
        />
        <Input
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSettingPassword}
        />
        {fieldError && (
          <p role="alert" className="text-sm text-destructive">
            {fieldError}
          </p>
        )}
        <Button type="submit" disabled={isSettingPassword} className="w-full">
          {isSettingPassword ? "Setting password…" : "Set password & continue"}
        </Button>
      </form>
    </div>
  );
}
