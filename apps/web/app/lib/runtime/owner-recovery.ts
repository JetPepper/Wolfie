import { MASTER_DEV_OWNER, type RuntimeDecision, type WolfieEnvironment } from "./runtime-types";
import { assertCloudPayloadSafe } from "./zero-trade-cloud-policy";

export type OwnerRecoveryAssertion = {
  subjectEmail: string;
  role: typeof MASTER_DEV_OWNER.role;
  issuedAt: string;
  expiresAt: string;
  environment: WolfieEnvironment | "recovery";
  nonce: string;
  signature: string;
  publicKeyId?: string;
};

export type OwnerRecoveryContext = {
  environment: WolfieEnvironment;
  enableOwnerRecovery?: boolean;
  publicKey?: string;
  assertion?: OwnerRecoveryAssertion;
  masterDevPassword?: string;
  now?: Date;
};

function devTestAssertionValid(assertion: OwnerRecoveryAssertion | undefined) {
  return Boolean(assertion && assertion.subjectEmail === MASTER_DEV_OWNER.email && assertion.role === MASTER_DEV_OWNER.role && assertion.signature === `dev-owner-recovery:${assertion.nonce}`);
}

function signedProductionAssertionStubValid(context: OwnerRecoveryContext) {
  if (!context.enableOwnerRecovery || !context.publicKey || !context.assertion) return false;
  const now = context.now ?? new Date();
  if (context.assertion.subjectEmail !== MASTER_DEV_OWNER.email) return false;
  if (context.assertion.role !== MASTER_DEV_OWNER.role) return false;
  if (new Date(context.assertion.expiresAt) < now) return false;
  return context.assertion.signature === `signed-recovery-stub:${context.publicKey}:${context.assertion.nonce}`;
}

export function evaluateOwnerRecovery(context: OwnerRecoveryContext): RuntimeDecision {
  assertCloudPayloadSafe({ accountId: "owner-recovery-check", requestId: context.assertion?.nonce ?? "none" });
  if (context.environment === "development" || context.environment === "test") {
    if (devTestAssertionValid(context.assertion)) {
      return { allowed: true, reasons: ["dev_test_owner_recovery_valid"], userFacingExplanation: "Owner recovery is active for development/test only." };
    }
    return { allowed: false, reasons: ["missing_dev_test_owner_assertion"], userFacingExplanation: "Owner recovery requires the deterministic dev/test assertion." };
  }
  if (context.masterDevPassword && !context.assertion) {
    return { allowed: false, reasons: ["password_only_recovery_blocked"], userFacingExplanation: "Password-only owner recovery cannot unlock production." };
  }
  if (signedProductionAssertionStubValid(context)) {
    return { allowed: true, reasons: ["signed_owner_recovery_assertion_valid"], userFacingExplanation: "Owner recovery assertion verified by production-safe stub." };
  }
  return { allowed: false, reasons: ["unsigned_owner_recovery_blocked"], userFacingExplanation: "Production owner recovery requires signed proof and verification material." };
}

export function createDevOwnerRecoveryAssertion(nonce = "dev-owner-recovery"): OwnerRecoveryAssertion {
  return {
    subjectEmail: MASTER_DEV_OWNER.email,
    role: MASTER_DEV_OWNER.role,
    issuedAt: new Date(0).toISOString(),
    expiresAt: new Date("2999-01-01T00:00:00.000Z").toISOString(),
    environment: "test",
    nonce,
    signature: `dev-owner-recovery:${nonce}`,
    publicKeyId: "dev-test-owner-recovery",
  };
}
