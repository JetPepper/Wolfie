import type { EntitlementValidationResult, SignedEntitlementToken } from "./entitlement-types";
import { FORBIDDEN_ENTITLEMENT_FIELDS } from "./entitlement-types";
import type { WolfieEnvironment } from "./runtime-types";

export type EntitlementValidatorContext = {
  environment: WolfieEnvironment;
  now?: Date;
  deviceIdHash: string;
  publicVerificationKey?: string;
  allowDevDeterministicSignatures?: boolean;
};

function hasForbiddenFields(value: unknown): string[] {
  const found = new Set<string>();
  function visit(item: unknown) {
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item as Record<string, unknown>)) {
      if (FORBIDDEN_ENTITLEMENT_FIELDS.includes(key)) found.add(key);
      visit(child);
    }
  }
  visit(value);
  return Array.from(found).sort();
}

function isDevSignatureValid(token: SignedEntitlementToken) {
  return token.signature === `dev-signature:${token.payload.tokenId}`;
}

export function validateEntitlementToken(token: SignedEntitlementToken | null | undefined, context: EntitlementValidatorContext): EntitlementValidationResult {
  if (!token) return { valid: false, reasonCodes: ["missing_entitlement"], withinOfflineGrace: false };
  const forbiddenFields = hasForbiddenFields(token.payload);
  if (forbiddenFields.length) return { valid: false, reasonCodes: forbiddenFields.map((field) => `forbidden_entitlement_field:${field}`), withinOfflineGrace: false };

  const now = context.now ?? new Date();
  const expiresAt = new Date(token.payload.expiresAt);
  const offlineGraceExpiresAt = new Date(token.payload.offlineGraceExpiresAt);
  const withinOfflineGrace = now <= offlineGraceExpiresAt;
  const reasonCodes: string[] = [];

  if (token.payload.accessLevel !== "FULL_WOLFIE") reasonCodes.push("wrong_access_level");
  if (token.payload.deviceIdHash !== context.deviceIdHash) reasonCodes.push("wrong_device_binding");
  if (token.payload.audience !== "wolfie-local-runtime") reasonCodes.push("wrong_audience");
  if (token.payload.issuer !== "wolfie-cloud") reasonCodes.push("wrong_issuer");
  if (now > expiresAt && now > offlineGraceExpiresAt) reasonCodes.push("expired_entitlement");
  if (now > expiresAt && now <= offlineGraceExpiresAt) reasonCodes.push("offline_grace");

  if (context.environment === "production") {
    if (!context.publicVerificationKey) {
      return {
        valid: false,
        reasonCodes: ["production_verification_unavailable"],
        withinOfflineGrace,
        productionVerificationUnavailable: true,
      };
    }
    reasonCodes.push("production_signature_verifier_stub_fails_closed");
  } else if (!context.allowDevDeterministicSignatures || !isDevSignatureValid(token)) {
    reasonCodes.push("invalid_signature");
  }

  const blockingReasons = reasonCodes.filter((reason) => reason !== "offline_grace");
  return {
    valid: blockingReasons.length === 0,
    reasonCodes,
    entitlement: blockingReasons.length === 0 ? token.payload : undefined,
    withinOfflineGrace,
  };
}
