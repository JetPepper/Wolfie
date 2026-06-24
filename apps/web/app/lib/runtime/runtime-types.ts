export type WolfieEnvironment = "development" | "test" | "production";
export type AccessState = "LOCAL_EXPLORE" | "FULL_LICENSED" | "OWNER_RECOVERY_DEV" | "BLOCKED";
export type EntitlementAccessLevel = "FULL_WOLFIE";
export type TradingMode = "Paper" | "Live";
export type RuntimeRoute = "local" | "cloud";

export type RuntimeIdentity = {
  userId?: string;
  accountId?: string;
  localOperatorId?: string;
  email?: string;
  role?: string;
};

export const MASTER_DEV_OWNER = {
  name: "Wolfie Master Dev Operator",
  email: "dev.operator@wolfie.local",
  role: "MASTER_DEV_OWNER",
} as const;

export type RuntimeDecision = {
  allowed: boolean;
  reasons: string[];
  userFacingExplanation: string;
};
