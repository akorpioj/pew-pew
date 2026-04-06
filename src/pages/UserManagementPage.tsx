import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import firestore, {
  type AccessRequest,
  ACCESS_REQUESTS_COLLECTION,
} from "@/lib/firestore";
import {
  approveAccessRequestCallable,
  rejectAccessRequestCallable,
  sendInviteCallable,
} from "@/lib/functions";

type PendingRequest = AccessRequest & { id: string };

export default function UserManagementPage() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actingOn, setActingOn] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Re-send / direct invite state ────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const inviteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(firestore, ACCESS_REQUESTS_COLLECTION),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setRequests(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as AccessRequest),
          }))
        );
        setLoadingData(false);
      },
      (err) => {
        console.error("Failed to load access requests:", err);
        setLoadingData(false);
      }
    );

    return unsubscribe;
  }, []);

  const setActing = (id: string, on: boolean) =>
    setActingOn((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const handleApprove = async (req: PendingRequest) => {
    setActionError(null);
    setActing(req.id, true);
    try {
      await approveAccessRequestCallable({ requestId: req.id, email: req.email });
    } catch (err) {
      setActionError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to approve request. Please try again."
      );
    } finally {
      setActing(req.id, false);
    }
  };

  const handleReject = async (req: PendingRequest) => {
    setActionError(null);
    setActing(req.id, true);
    try {
      await rejectAccessRequestCallable({ requestId: req.id });
    } catch (err) {
      setActionError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to reject request. Please try again."
      );
    } finally {
      setActing(req.id, false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteResult(null);
    setInviteSending(true);
    try {
      await sendInviteCallable({ email: inviteEmail.trim().toLowerCase() });
      setInviteResult({
        kind: "success",
        message: `Invite sent to ${inviteEmail.trim()}.`,
      });
      setInviteEmail("");
    } catch (err) {
      setInviteResult({
        kind: "error",
        message:
          err instanceof FirebaseError
            ? err.message
            : "Failed to send invite. Please try again.",
      });
    } finally {
      setInviteSending(false);
      inviteInputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Review and action pending access requests.
        </p>
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium">
          Pending Access Requests
          {!loadingData && requests.length > 0 && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal tabular-nums">
              {requests.length}
            </span>
          )}
        </h2>

        {loadingData ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="rounded-lg border">
            {requests.map((req, index) => {
              const isActing = actingOn.has(req.id);
              const date = req.createdAt
                ?.toDate()
                .toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              return (
                <div
                  key={req.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3${
                    index < requests.length - 1 ? " border-b" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{req.email}</p>
                    {date && (
                      <p className="text-xs text-muted-foreground">{date}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isActing}
                      onClick={() => handleApprove(req)}
                    >
                      {isActing ? "…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isActing}
                      onClick={() => handleReject(req)}
                    >
                      {isActing ? "…" : "Reject"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Send / re-send invite ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium">Send or re-send an invite</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Re-sending to an existing account generates a fresh link without
          creating a duplicate user.
        </p>
        <form onSubmit={handleSendInvite} className="flex max-w-sm gap-2">
          <Input
            ref={inviteInputRef}
            type="email"
            placeholder="Email address"
            autoComplete="off"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            disabled={inviteSending}
          />
          <Button type="submit" disabled={inviteSending}>
            {inviteSending ? "Sending…" : "Send invite"}
          </Button>
        </form>
        {inviteResult && (
          <p
            role={inviteResult.kind === "error" ? "alert" : "status"}
            className={`mt-2 text-sm ${
              inviteResult.kind === "error"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {inviteResult.message}
          </p>
        )}
      </section>
    </div>
  );
}
