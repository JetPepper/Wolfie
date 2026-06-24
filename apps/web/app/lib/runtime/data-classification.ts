export type DataClassification = "cloud_allowed_metadata" | "local_trading_private" | "local_security_secret";

export const LOCAL_ONLY_DATA = [
  "user trading data",
  "bot configuration",
  "Agent Mandates",
  "source weights",
  "risk settings",
  "broker credentials",
  "broker tokens",
  "positions",
  "trades",
  "balances",
  "P&L",
  "order intents",
  "execution results",
  "local learning history",
  "local decision logs",
];

export const CLOUD_ALLOWED_METADATA = [
  "account login",
  "subscription status",
  "billing status",
  "license entitlement issuance",
  "device activation hash",
  "signed release metadata",
  "app version",
];
