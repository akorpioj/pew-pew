import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetCallable } from "@/lib/functions";
import { umConfig } from "@/lib/umConfig";

const NEUTRAL_MESSAGE =
  "If an account exists for that email, you will receive a reset link.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordResetCallable({ email });
    } catch {
      // Intentionally swallowed — always show neutral message to prevent
      // email enumeration and avoid exposing backend errors (including rate
      // limit responses) to the client.
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email address for your account.
        </p>
      </div>

      {submitted ? (
        <p
          role="status"
          className="max-w-sm text-center text-sm text-muted-foreground"
        >
          {NEUTRAL_MESSAGE}
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <Input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
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
