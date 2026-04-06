import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  getAuth,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { umConfig } from "@/lib/umConfig";

type State =
  | "verifying"
  | "ready"
  | "submitting"
  | "success"
  | "expired"
  | "error";

const EXPIRED_CODES = new Set([
  "auth/expired-action-code",
  "auth/invalid-action-code",
]);

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get("oobCode") ?? "";

  const [state, setState] = useState<State>("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Verify the oob code on mount.
  useEffect(() => {
    if (!oobCode) {
      setState("expired");
      return;
    }

    const auth = getAuth();
    verifyPasswordResetCode(auth, oobCode)
      .then(() => setState("ready"))
      .catch((err: unknown) => {
        if (
          err instanceof FirebaseError &&
          EXPIRED_CODES.has(err.code)
        ) {
          setState("expired");
        } else {
          setState("error");
        }
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError(null);
    setState("submitting");

    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode, password);
      setState("success");
    } catch (err) {
      if (
        err instanceof FirebaseError &&
        EXPIRED_CODES.has(err.code)
      ) {
        setState("expired");
      } else {
        setError(
          err instanceof FirebaseError
            ? err.message
            : "Something went wrong. Please try again."
        );
        setState("ready");
      }
    }
  };

  // ── Expired / invalid link ────────────────────────────────────────────────
  if (state === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            This password reset link has expired or already been used. Reset
            links are valid for 1 hour.
          </p>
        </div>
        <Button asChild>
          <Link to={umConfig.routes.forgotPassword}>Request a new link</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          <Link to={umConfig.routes.login} className="underline underline-offset-4 hover:text-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  // ── Generic error ─────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            We couldn&apos;t validate this link. Please request a new one.
          </p>
        </div>
        <Button asChild>
          <Link to={umConfig.routes.forgotPassword}>Request a new link</Link>
        </Button>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been changed. You can now sign in.
          </p>
        </div>
        <Button onClick={() => navigate(umConfig.routes.login, { replace: true })}>
          Sign in
        </Button>
      </div>
    );
  }

  // ── Verifying / form ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter a new password for your account.
        </p>
      </div>

      {state === "verifying" ? (
        <p className="text-sm text-muted-foreground">Verifying link…</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <Input
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={state === "submitting"}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={state === "submitting"}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={state === "submitting"}>
            {state === "submitting" ? "Saving…" : "Set new password"}
          </Button>
        </form>
      )}

      <p className="text-sm text-muted-foreground">
        <Link to={umConfig.routes.login} className="underline underline-offset-4 hover:text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
