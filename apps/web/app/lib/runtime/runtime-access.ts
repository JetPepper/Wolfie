import type { EntitlementValidationResult } from "./entitlement-types";
import type { RuntimeDecision, AccessState } from "./runtime-types";

export type WolfieAccessContext = {
  entitlement: EntitlementValidationResult;
  ownerRecovery: RuntimeDecision;
  wantsFullRuntime: boolean;
};

export function getWolfieAccessState(context: WolfieAccessContext): AccessState {
  if (!context.wantsFullRuntime) return "LOCAL_EXPLORE";
  if (context.entitlement.valid && context.entitlement.entitlement?.accessLevel === "FULL_WOLFIE") return "FULL_LICENSED";
  if (context.ownerRecovery.allowed) return "OWNER_RECOVERY_DEV";
  if (!context.entitlement.valid) return "LOCAL_EXPLORE";
  return "BLOCKED";
}

export function assertFullRuntimeAllowed(accessState: AccessState): void {
  if (accessState !== "FULL_LICENSED" && accessState !== "OWNER_RECOVERY_DEV") {
    throw new Error(`Full Wolfie runtime blocked for access state: ${accessState}`);
  }
}

export function isAllOrNothingLicensed(accessState: AccessState): boolean {
  return accessState === "FULL_LICENSED" || accessState === "OWNER_RECOVERY_DEV";
}
