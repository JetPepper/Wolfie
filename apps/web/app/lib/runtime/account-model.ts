import type { AccessState, EntitlementAccessLevel } from "./runtime-types";
import type { EntitlementValidationResult } from "./entitlement-types";
import { assertCloudPayloadSafe } from "./zero-trade-cloud-policy";

export type UserAccount = {
  id: string;
  email: string;
  displayName: string;
  role: "USER" | "MASTER_DEV_OWNER";
  createdAt: string;
  status: "active" | "disabled" | "pending";
};

export type WolfieAccount = {
  accountId: string;
  ownerUserId: string;
  billingCustomerId?: string;
  subscriptionStatus: "active" | "past_due" | "canceled" | "trialing" | "none";
  licenseStatus: "active" | "expired" | "revoked" | "none";
  createdAt: string;
};

export type License = {
  licenseId: string;
  accountId: string;
  status: "active" | "expired" | "revoked" | "pending";
  accessLevel: EntitlementAccessLevel;
  validFrom: string;
  validUntil: string;
  maxDevices: number;
  revokedAt?: string;
  revocationReason?: string;
};

export type DeviceActivationRecord = {
  deviceIdHash: string;
  accountId: string;
  licenseId: string;
  activatedAt: string;
  lastSeenAt: string;
  status: "active" | "revoked" | "expired" | "pending";
  deviceLabel?: string;
};

export type LocalRuntimeIdentity = {
  localInstallId: string;
  localOperatorLabel: string;
  activeAccountId?: string;
  activeLicenseId?: string;
  activeDeviceIdHash?: string;
  accessState: AccessState;
};

export type CommercialAccountContext = {
  userAccount?: UserAccount;
  wolfieAccount?: WolfieAccount;
  license?: License;
  deviceActivation?: DeviceActivationRecord;
  localRuntimeIdentity: LocalRuntimeIdentity;
  entitlement: EntitlementValidationResult;
};

export type CommercialAccountAccessResult = {
  accessState: AccessState;
  allowed: boolean;
  reasons: string[];
};

export const BILLING_INTEGRATION_STUB = {
  provider: "future_billing_provider",
  implemented: false,
  note: "Billing customer id is a placeholder; no Stripe or billing provider integration is implemented.",
} as const;

export function createLocalRuntimeIdentity(localInstallId: string, localOperatorLabel = "Local Operator"): LocalRuntimeIdentity {
  return { localInstallId, localOperatorLabel, accessState: "LOCAL_EXPLORE" };
}

export function assertAccountRecordSafe(record: UserAccount | WolfieAccount | License | DeviceActivationRecord): void {
  assertCloudPayloadSafe(record);
}

export function evaluateCommercialAccountAccess(context: CommercialAccountContext): CommercialAccountAccessResult {
  const reasons: string[] = [];
  const { userAccount, wolfieAccount, license, deviceActivation, entitlement } = context;

  if (!userAccount) reasons.push("missing_user_account");
  if (!wolfieAccount) reasons.push("missing_wolfie_account");
  if (!license) reasons.push("missing_license");
  if (!deviceActivation) reasons.push("missing_device_activation");
  if (!entitlement.valid || entitlement.entitlement?.accessLevel !== "FULL_WOLFIE") reasons.push("missing_valid_full_wolfie_entitlement");
  if (userAccount && userAccount.status !== "active") reasons.push("user_account_not_active");
  if (wolfieAccount && wolfieAccount.subscriptionStatus !== "active") reasons.push("subscription_not_active");
  if (wolfieAccount && wolfieAccount.licenseStatus !== "active") reasons.push("account_license_not_active");
  if (license && license.status !== "active") reasons.push("license_not_active");
  if (license && license.accessLevel !== "FULL_WOLFIE") reasons.push("license_access_not_full_wolfie");
  if (deviceActivation && deviceActivation.status !== "active") reasons.push("device_activation_not_active");
  if (wolfieAccount && userAccount && wolfieAccount.ownerUserId !== userAccount.id) reasons.push("account_owner_mismatch");
  if (license && wolfieAccount && license.accountId !== wolfieAccount.accountId) reasons.push("license_account_mismatch");
  if (deviceActivation && license && deviceActivation.licenseId !== license.licenseId) reasons.push("device_license_mismatch");
  if (deviceActivation && wolfieAccount && deviceActivation.accountId !== wolfieAccount.accountId) reasons.push("device_account_mismatch");
  if (deviceActivation && entitlement.entitlement && deviceActivation.deviceIdHash !== entitlement.entitlement.deviceIdHash) reasons.push("device_entitlement_mismatch");

  const allowed = reasons.length === 0;
  return { accessState: allowed ? "FULL_LICENSED" : "LOCAL_EXPLORE", allowed, reasons };
}
