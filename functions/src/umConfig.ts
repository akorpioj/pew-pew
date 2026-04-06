/**
 * Central configuration for the User Management system.
 *
 * When adapting this system to a different application, this is the ONLY file
 * that needs to change for the functions layer. Update:
 *
 *   - `region`         Firebase Functions deployment region
 *   - `connector`      Data Connect service / connector identifiers
 *   - `appName`        Used in outgoing email signatures & subject lines
 *   - `appUrl`         Param name for the APP_URL Cloud Function param
 *   - `rateLimit`      Sliding-window rate limit for public endpoints
 *   - `collections`    Firestore collection names
 *   - `roles`          Role string constants matched against custom claims
 */
export const umConfig = {
  /** Firebase Functions deployment region. */
  region: "europe-north1" as const,

  /** Firebase Data Connect connector identifiers. */
  connector: {
    location: "europe-north1",
    serviceId: "pew-pew",
    connector: "pew-pew-connector",
  },

  /** Human-readable application name used in outgoing emails. */
  appName: "Pew Pew Wiki",

  /**
   * Rate limiting for public callable endpoints (requestAccess,
   * requestPasswordReset). Uses a Firestore sliding-window counter,
   * keyed by SHA-256-hashed caller IP.
   */
  rateLimit: {
    /** Maximum number of calls allowed per IP within the window. */
    max: 3,
    /** Window duration in milliseconds (default: 10 minutes). */
    windowMs: 10 * 60 * 1000,
  },

  /** Firestore collection name constants. */
  collections: {
    accessRequests: "accessRequests",
    rateLimits: "_rateLimits",
    mail: "mail",
    adminAuditLog: "adminAuditLog",
    deletionRequests: "deletionRequests",
  },

  /** Role string constants matched against Firebase Auth custom claims. */
  roles: {
    admin: "ADMIN",
    expert: "EXPERT",
    viewer: "VIEWER",
  },
} as const;
