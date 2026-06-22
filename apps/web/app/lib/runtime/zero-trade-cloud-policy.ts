const DIRECT_FORBIDDEN_KEYS = new Set([
  "trade",
  "trades",
  "order",
  "orders",
  "orderIntent",
  "orderIntents",
  "position",
  "positions",
  "portfolio",
  "balance",
  "balances",
  "pnl",
  "profit",
  "loss",
  "broker",
  "robinhood",
  "accountNumber",
  "account_number",
  "token",
  "accessToken",
  "refreshToken",
  "mandate",
  "agentMandate",
  "botConfig",
  "botSettings",
  "risk",
  "riskSettings",
  "watchlist",
  "sourceWeights",
  "strategy",
  "decisionLog",
  "executionResult",
  "fill",
  "fills",
  "quantity",
  "shares",
]);

const TRADING_CONTEXT_KEYS = new Set([
  "trade",
  "trades",
  "order",
  "orders",
  "orderIntent",
  "orderIntents",
  "position",
  "positions",
  "portfolio",
  "executionResult",
  "fill",
  "fills",
]);

const CLOUD_ALLOWED_TOP_LEVEL_KEYS = new Set([
  "login",
  "email",
  "accountId",
  "subscriptionStatus",
  "billingStatus",
  "deviceIdHash",
  "appVersion",
  "appChannel",
  "releaseChannel",
  "entitlementTokenId",
  "licenseId",
  "requestId",
  "clientTime",
]);

export type CloudPayloadSafety = {
  safe: boolean;
  rejectedKeys: string[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scan(value: unknown, tradingContext: boolean, rejected: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((item) => scan(item, tradingContext, rejected));
    return;
  }
  if (!isObject(value)) return;
  const keys = Object.keys(value);
  const nextTradingContext = tradingContext || keys.some((key) => TRADING_CONTEXT_KEYS.has(key));
  for (const key of keys) {
    if (DIRECT_FORBIDDEN_KEYS.has(key)) rejected.add(key);
    if (nextTradingContext && (key === "symbol" || key === "price")) rejected.add(key);
    scan(value[key], nextTradingContext, rejected);
  }
}

export function inspectCloudPayloadSafety(payload: unknown): CloudPayloadSafety {
  const rejected = new Set<string>();
  scan(payload, false, rejected);
  return { safe: rejected.size === 0, rejectedKeys: Array.from(rejected).sort() };
}

export function assertCloudPayloadSafe(payload: unknown): void {
  const result = inspectCloudPayloadSafety(payload);
  if (!result.safe) {
    throw new Error(`Wolfie Cloud payload rejected: ${result.rejectedKeys.join(", ")}`);
  }
}

export function assertAllowedCloudMetadataShape(payload: Record<string, unknown>): void {
  assertCloudPayloadSafe(payload);
  const unknown = Object.keys(payload).filter((key) => !CLOUD_ALLOWED_TOP_LEVEL_KEYS.has(key));
  if (unknown.length) throw new Error(`Wolfie Cloud metadata contains unapproved keys: ${unknown.join(", ")}`);
}
