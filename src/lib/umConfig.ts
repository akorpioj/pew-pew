/**
 * Central configuration for the client-side User Management system.
 *
 * When adapting this system to a different application, this is the ONLY file
 * that needs to change on the client layer. Update:
 *
 *   - `appName`        Displayed in UI where the app is named
 *   - `roles`          Role key→value map (must match custom claims & server config)
 *   - `roleLabels`     Human-readable display labels for each role
 *   - `routes`         All route path constants used across UM pages
 *   - `emailStorageKey` localStorage key used in the accept-invite flow
 *   - `collections`    Firestore collection names used by client queries
 */
export const umConfig = {
  /** Human-readable application name. */
  appName: "Pew Pew Wiki",

  /**
   * Role string values — must match the custom claims set by `setUserRole`
   * and the `roles` config in `functions/src/umConfig.ts`.
   */
  roles: {
    admin: "ADMIN",
    expert: "EXPERT",
    viewer: "VIEWER",
  },

  /** Display labels shown in the UI for each role value. */
  roleLabels: {
    ADMIN: "Admin",
    EXPERT: "Expert",
    VIEWER: "Viewer",
  } as Record<string, string>,

  /** Route path constants used across all UM pages and layouts. */
  routes: {
    login: "/login",
    requestAccess: "/request-access",
    acceptInvite: "/accept-invite",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    profile: "/profile",
    adminUsers: "/admin/users",
    appHome: "/wiki",
  },

  /**
   * localStorage key used to persist the invite email across browser tabs /
   * devices during the accept-invite sign-in flow.
   */
  emailStorageKey: "emailForSignIn",

  /** Firestore collection names queried directly from the client. */
  collections: {
    accessRequests: "accessRequests",
    adminAuditLog: "adminAuditLog",
  },
};
