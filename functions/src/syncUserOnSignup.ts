import { beforeUserCreated } from "firebase-functions/v2/identity";
import { getDataConnect } from "firebase-admin/data-connect";
import { logger } from "firebase-functions";

const connectorConfig = {
  location: "europe-north1",
  serviceId: "pew-pew",
  connector: "pew-pew-connector",
};

/**
 * Blocking Auth trigger that fires before every new user account is created.
 *
 * 1. Sets `{ role: 'VIEWER' }` as the default custom claim so that
 *    `auth.token.role` is immediately available in @auth expressions.
 * 2. Upserts a `User` row in Data Connect so the FK from `Article.author`
 *    can always be resolved.
 */
export const syncUserOnSignup = beforeUserCreated(
  { region: "europe-north1" },
  async (event) => {
    const uid = event.data?.uid;
    const email = event.data?.email ?? "";

    if (!uid) {
      return;
    }

    // Upsert the User row — errors are caught so they don't block sign-up
    try {
      const dc = getDataConnect(connectorConfig);
      await dc.upsert("user", {
        id: uid,
        email: email ?? "",
        role: "VIEWER",
      });
    } catch (err) {
      logger.error("syncUserOnSignup: failed to upsert User row", { uid, err });
    }

    // Return the default claim; no extra setCustomUserClaims call needed
    return { customClaims: { role: "VIEWER" } };
  }
);
