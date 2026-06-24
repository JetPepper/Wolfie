import type { EntitlementTokenPayload, SignedEntitlementToken } from "./entitlement-types";
import type { WolfieEnvironment } from "./runtime-types";

export function createDevFullWolfieEntitlement(options: {
  environment: WolfieEnvironment;
  subject: string;
  accountId: string;
  licenseId: string;
  deviceIdHash: string;
  now?: Date;
}): SignedEntitlementToken {
  if (options.environment === "production") {
    throw new Error("production blocks dev entitlement provider");
  }
  const now = options.now ?? new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const offlineGraceExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const payload: EntitlementTokenPayload = {
    sub: options.subject,
    accountId: options.accountId,
    licenseId: options.licenseId,
    deviceIdHash: options.deviceIdHash,
    accessLevel: "FULL_WOLFIE",
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    offlineGraceExpiresAt: offlineGraceExpiresAt.toISOString(),
    appChannel: options.environment,
    minimumAppVersion: "0.1.0",
    entitlementVersion: 1,
    issuer: "wolfie-cloud",
    audience: "wolfie-local-runtime",
    tokenId: `dev-token-${options.subject}`,
    revocationNonce: "dev-revocation-0",
  };
  return {
    payload,
    alg: "Ed25519",
    kid: "dev-test-deterministic-public-key",
    signature: `dev-signature:${payload.tokenId}`,
  };
}
