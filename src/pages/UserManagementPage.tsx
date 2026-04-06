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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  listUsersCallable,
  revokeUserAccessCallable,
  restoreUserAccessCallable,
  setUserRoleCallable,
  sendPasswordResetCallable,
} from "@/lib/functions";
import { useAuth } from "@/contexts/AuthContext";

type PendingRequest = AccessRequest & { id: string };

interface UserRow {
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  disabled: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  EXPERT: "Expert",
  VIEWER: "Viewer",
};

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();

  // ── Confirm-grant-admin dialog state ───────────────────────────────────
  const [confirmAdminTarget, setConfirmAdminTarget] = useState<UserRow | null>(null);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actingOn, setActingOn] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  // ── All users table state ─────────────────────────────────────────────────
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [actingOnUser, setActingOnUser] = useState<Set<string>>(new Set());
  const [userActionError, setUserActionError] = useState<string | null>(null);

  // ── Re-send / direct invite state ────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const inviteInputRef = useRef<HTMLInputElement>(null);

  const refreshUsers = () => {
    setLoadingUsers(true);
    listUsersCallable()
      .then((res) => {
        setUsers(res.data.users);
        setLoadingUsers(false);
      })
      .catch((err) => {
        setUsersError(
          err instanceof FirebaseError ? err.message : "Failed to load users."
        );
        setLoadingUsers(false);
      });
  };

  // Load all users once on mount (admin SDK call — not real-time).
  useEffect(() => { refreshUsers(); }, []);

  const setActingOnUserFlag = (uid: string, on: boolean) =>
    setActingOnUser((prev) => {
      const next = new Set(prev);
      on ? next.add(uid) : next.delete(uid);
      return next;
    });

  const handleRevokeAccess = async (uid: string) => {
    setUserActionError(null);
    setActingOnUserFlag(uid, true);
    try {
      await revokeUserAccessCallable({ uid });
      refreshUsers();
    } catch (err) {
      setUserActionError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to revoke access. Please try again."
      );
    } finally {
      setActingOnUserFlag(uid, false);
    }
  };

  const handleRestoreAccess = async (uid: string) => {
    setUserActionError(null);
    setActingOnUserFlag(uid, true);
    try {
      await restoreUserAccessCallable({ uid });
      refreshUsers();
    } catch (err) {
      setUserActionError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to restore access. Please try again."
      );
    } finally {
      setActingOnUserFlag(uid, false);
    }
  };

  const handleSetRole = async (
    uid: string,
    role: "EXPERT" | "VIEWER"
  ) => {
    setUserActionError(null);
    setActingOnUserFlag(uid, true);
    try {
      await setUserRoleCallable({ uid, role });
      refreshUsers();
    } catch (err) {
      setUserActionError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to update role. Please try again."
      );
    } finally {
      setActingOnUserFlag(uid, false);
    }
  };

  const handleGrantAdmin = async (row: UserRow) => {
    setConfirmAdminTarget(null);
    setUserActionError(null);
    setActingOnUserFlag(row.uid, true);
    try {
      await setUserRoleCallable({ uid: row.uid, role: "ADMIN" });
      refreshUsers();
    } catch (err) {
      setUserActionError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to grant ADMIN role. Please try again."
      );
    } finally {
      setActingOnUserFlag(row.uid, false);
    }
  };

  const handleRemoveAdmin = async (uid: string) => {
    setUserActionError(null);
    setActingOnUserFlag(uid, true);
    try {
      await setUserRoleCallable({ uid, role: "VIEWER" });
      refreshUsers();
    } catch (err) {
      setUserActionError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to remove ADMIN role. Please try again."
      );
    } finally {
      setActingOnUserFlag(uid, false);
    }
  };

  const handleSendPasswordReset = async (uid: string) => {
    setUserActionError(null);
    setActingOnUserFlag(uid, true);
    try {
      await sendPasswordResetCallable({ uid });
    } catch (err) {
      setUserActionError(
        err instanceof FirebaseError
          ? err.message
          : "Failed to send password reset. Please try again."
      );
    } finally {
      setActingOnUserFlag(uid, false);
    }
  };

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
      {/* ── Grant Admin confirmation dialog ── */}
      <Dialog
        open={confirmAdminTarget !== null}
        onOpenChange={(open) => { if (!open) setConfirmAdminTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant ADMIN role?</DialogTitle>
            <DialogDescription>
              You are about to grant full admin rights to{" "}
              <strong>{confirmAdminTarget?.email}</strong>. They will be able to
              manage all users, roles, and content. This cannot be undone
              without another admin account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAdminTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmAdminTarget !== null && actingOnUser.has(confirmAdminTarget.uid)}
              onClick={() => confirmAdminTarget && handleGrantAdmin(confirmAdminTarget)}
            >
              Grant Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

      {/* ── All users table ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium">
          All Users
          {!loadingUsers && users.length > 0 && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal tabular-nums">
              {users.length}
            </span>
          )}
        </h2>
        {userActionError && (
          <p role="alert" className="mb-2 text-sm text-destructive">
            {userActionError}
          </p>
        )}

        {usersError ? (
          <p role="alert" className="text-sm text-destructive">
            {usersError}
          </p>
        ) : loadingUsers ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Display name</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr
                    key={u.uid}
                    className={`${index < users.length - 1 ? "border-b" : ""} ${
                      u.disabled ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium">{u.email}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {u.displayName ?? <span className="italic">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : u.role === "EXPERT"
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.disabled
                            ? "bg-destructive/10 text-destructive"
                            : "bg-green-500/10 text-green-700 dark:text-green-400"
                        }`}
                      >
                        {u.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-2">
                        {/* Role toggle — EXPERT ↔ VIEWER only; ADMIN is handled below */}
                        {u.role === "VIEWER" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingOnUser.has(u.uid)}
                            onClick={() => handleSetRole(u.uid, "EXPERT")}
                          >
                            {actingOnUser.has(u.uid) ? "…" : "Make Expert"}
                          </Button>
                        )}
                        {u.role === "EXPERT" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actingOnUser.has(u.uid)}
                              onClick={() => handleSetRole(u.uid, "VIEWER")}
                            >
                              {actingOnUser.has(u.uid) ? "…" : "Remove Expert"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actingOnUser.has(u.uid)}
                              onClick={() => setConfirmAdminTarget(u)}
                            >
                              Make Admin
                            </Button>
                          </>
                        )}
                        {u.role === "ADMIN" && u.uid !== currentUser?.uid && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingOnUser.has(u.uid)}
                            onClick={() => handleRemoveAdmin(u.uid)}
                          >
                            {actingOnUser.has(u.uid) ? "…" : "Remove Admin"}
                          </Button>
                        )}
                        {/* Access revoke / restore */}
                        {u.disabled ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingOnUser.has(u.uid)}
                            onClick={() => handleRestoreAccess(u.uid)}
                          >
                            {actingOnUser.has(u.uid) ? "\u2026" : "Restore"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actingOnUser.has(u.uid)}
                            onClick={() => handleRevokeAccess(u.uid)}
                          >
                            {actingOnUser.has(u.uid) ? "\u2026" : "Revoke"}
                          </Button>
                        )}
                        {/* Password reset — only for email/password accounts (no provider data available here;
                            the button is shown for all users and the CF handles edge cases gracefully) */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actingOnUser.has(u.uid)}
                          onClick={() => handleSendPasswordReset(u.uid)}
                        >
                          {actingOnUser.has(u.uid) ? "\u2026" : "Send Reset"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
