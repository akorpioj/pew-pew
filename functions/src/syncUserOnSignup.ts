import { beforeUserCreated, HttpsError } from "firebase-functions/v2/identity";
import { getDataConnect } from "firebase-admin/data-connect";
import { logger } from "firebase-functions";
import { umConfig } from "./umConfig";

/** OAuth provider IDs that require a pre-existing invitation. */
const OAUTH_PROVIDER_IDS = new Set(["google.com", "microsoft.com"]);

/**
 * Blocking Auth trigger that fires before every new user account is created.
 *
 * 1. Blocks unregistered OAuth sign-ins (Google / Microsoft): the email must
 *    already exist in the User table (placed there by the admin invite flow).
 *    Throwing an HttpsError here prevents the Auth account from being created
 *    at all — no manual deletion is needed.
 * 2. For email/password and admin-SDK-created accounts: upserts the User row
 *    in Data Connect and sets `{ role: 'VIEWER' }` as the default custom claim
 *    so that `auth.token.role` is immediately available in @auth expressions.
 */
export const syncUserOnSignup = beforeUserCreated(
  { region: umConfig.region },
  async (event) => {
    const uid = event.data?.uid;
    const email = event.data?.email ?? "";
    const providerData = event.data?.providerData ?? [];

    if (!uid) {
      return;
    }

    const dc = getDataConnect(umConfig.connector);
    const isOAuthSignup = providerData.some((p) =>
      OAUTH_PROVIDER_IDS.has(p.providerId)
    );

    if (isOAuthSignup) {
      // Gate: the email must have been pre-registered by an admin invite before
      // an OAuth account can be created for it.
      let userExists = false;
      try {
        const result = await dc.executeGraphqlRead<
          { users: { id: string }[] },
          { email: string }
        >(
          `query CheckUserByEmail($email: String!) {
            users(where: { email: { eq: $email } }, limit: 1) { id }
          }`,
          { variables: { email } }
        );
        userExists = (result.data?.users?.length ?? 0) > 0;
      } catch (err) {
        // Fail closed: a transient Data Connect error must not be exploitable
        // to bypass the registration gate.
        logger.error(
          "syncUserOnSignup: failed to verify registration for OAuth sign-in",
          { email, err }
        );
        throw new HttpsError(
          "internal",
          "Unable to verify registration status. Please try again."
        );
      }

      if (!userExists) {
        logger.info("syncUserOnSignup: blocked unregistered OAuth sign-in", {
          email,
          provider: providerData[0]?.providerId,
        });
        throw new HttpsError(
          "permission-denied",
          "This email address is not registered. Please request access first."
        );
      }

      // Pre-registered email: the User row already exists from the invite flow,
      // so no upsert is needed. Just confirm the VIEWER claim.
      logger.info(
        "syncUserOnSignup: OAuth sign-in allowed for pre-registered email",
        { email }
      );
      return { customClaims: { role: umConfig.roles.viewer } };
    }

    // Email/password or Admin-SDK-created account: upsert the User row.
    try {
      await dc.upsert("user", {
        id: uid,
        email,
        role: umConfig.roles.viewer,
      });
    } catch (err) {
      logger.error("syncUserOnSignup: failed to upsert User row", { uid, err });
    }

    return { customClaims: { role: umConfig.roles.viewer } };
  }
);
