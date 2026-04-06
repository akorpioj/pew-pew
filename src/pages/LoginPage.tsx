import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Maps a Firebase Auth error code to a human-readable message.
 *
 * `account-exists-with-different-credential` fires when the user attempts
 * an OAuth (Google / Microsoft) sign-in but their email is already registered
 * with email + password. We scroll to and focus the email/password form so
 * they can act immediately.
 */
function mapAuthError(
  code: string,
  onExistingCredential?: () => void
): string {
  switch (code) {
    case "auth/account-exists-with-different-credential":
      onExistingCredential?.();
      return (
        "This email is already registered with a password. " +
        "Please sign in with email and password below."
      );
    case "auth/user-disabled":
      return "Your account has been disabled. Please contact an administrator.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return ""; // user dismissed — not an error worth surfacing
    default:
      // Errors from the beforeUserCreated blocking function arrive with code
      // 'auth/internal-error' or 'auth/admin-restricted-operation'; the
      // message contains the text we threw from the Cloud Function.
      if (code === "auth/admin-restricted-operation" || code === "auth/internal-error") {
        return (
          "This email address is not registered. " +
          "Please request access first."
        );
      }
      return "Sign-in failed. Please try again.";
  }
}

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithMicrosoft, signInWithEmailPassword } =
    useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "microsoft" | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already signed in
  useEffect(() => {
    if (user) navigate("/wiki", { replace: true });
  }, [user, navigate]);

  const focusEmailForm = () => {
    // Small delay so the error message renders before we scroll
    setTimeout(() => emailInputRef.current?.focus(), 50);
  };

  const handleOAuthSignIn = async (provider: "google" | "microsoft") => {
    setError(null);
    setOauthLoading(provider);
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithMicrosoft();
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        const msg = mapAuthError(err.code, focusEmailForm);
        if (msg) setError(msg);
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailLoading(true);
    try {
      await signInWithEmailPassword(email, password);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        const msg = mapAuthError(err.code);
        if (msg) setError(msg);
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Pew Pew Wiki</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue.
        </p>
      </div>

      {/* ── Email / password form ── */}
      <form
        onSubmit={handleEmailSignIn}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <Input
          ref={emailInputRef}
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={emailLoading}
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={emailLoading}
        />
        <Button type="submit" disabled={emailLoading} className="w-full">
          {emailLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* ── Divider ── */}
      <div className="flex w-full max-w-sm items-center gap-3">
        <hr className="flex-1 border-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <hr className="flex-1 border-border" />
      </div>

      {/* ── OAuth buttons ── */}
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => handleOAuthSignIn("google")}
          disabled={oauthLoading !== null}
          className="w-full gap-2"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {oauthLoading === "google" ? "Signing in…" : "Sign in with Google"}
        </Button>

        <Button
          variant="outline"
          onClick={() => handleOAuthSignIn("microsoft")}
          disabled={oauthLoading !== null}
          className="w-full gap-2"
        >
          {/* Microsoft logo mark */}
          <svg aria-hidden="true" viewBox="0 0 21 21" className="size-4" fill="currentColor">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          {oauthLoading === "microsoft" ? "Signing in…" : "Sign in with Microsoft"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="max-w-sm text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Don&apos;t have access?{" "}
        <Link to="/request-access" className="underline underline-offset-4 hover:text-primary">
          Request access
        </Link>
      </p>

      <p className="text-sm text-muted-foreground">
        <Link to="/forgot-password" className="underline underline-offset-4 hover:text-primary">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
