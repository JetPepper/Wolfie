import type { EntitlementAccessLevel } from "./runtime-types";

export type EntitlementTokenPayload = {
  sub: string;
  accountId: string;
  licenseId: string;
  deviceIdHash: string;
  accessLevel: EntitlementAccessLevel;
  issuedAt: string;
  expiresAt: string;
  offlineGraceExpiresAt: string;
  appChannel: "development" | "test" | "stable" | "beta";
  minimumAppVersion: string;
  entitlementVersion: number;
  issuer: "wolfie-cloud";
  audience: "wolfie-local-runtime";
  tokenId: string;
  revocationNonce?: string;
};

export type SignedEntitlementToken = {
  payload: EntitlementTokenPayload;
  signature: string;
  alg: "Ed25519";
  kid: string;
};

export type EntitlementValidationResult = {
  valid: boolean;
  reasonCodes: string[];
  entitlement?: EntitlementTokenPayload;
  withinOfflineGrace: boolean;
  productionVerificationUnavailable?: boolean;
};

export const FORBIDDEN_ENTITLEMENT_FIELDS = [
  "trade",
  "trades",
  "position",
  "positions",
  "balance",
  "balances",
  "pnl",
  "broker",
  "order",
  "orders",
  "mandate",
  "botConfig",
  "watchlist",
  "sourceWeights",
  "riskSettings",
  "decisionLog",
];
