import type { EntitlementValidationResult } from "./entitlement-types";
import type { BrokerConnectorReadiness } from "./broker-connector";
import type { RuntimeDecision, RuntimeIdentity, RuntimeRoute, TradingMode } from "./runtime-types";

export type ExecutionGuardInput = {
  identity: RuntimeIdentity;
  deviceIdHash: string;
  entitlement: EntitlementValidationResult;
  requestedMode: TradingMode;
  brokerConnector: BrokerConnectorReadiness;
  botId: string;
  botActive: boolean;
  mandateId?: string;
  mandateVersion?: string;
  killSwitchActive: boolean;
  intendedAction: "paper_review" | "live_order";
  ticker?: string;
  side?: "BUY" | "SELL" | "SELL_SHORT" | "COVER";
  quantityOrNotional?: number;
  riskPassed: boolean;
  route: RuntimeRoute;
};

export type ExecutionGuardResult = RuntimeDecision & {
  auditEvent: {
    type: "execution_guard";
    allowed: boolean;
    reasons: string[];
    route: RuntimeRoute;
    mode: TradingMode;
  };
  requiredState: string[];
  requiredEntitlement: "FULL_WOLFIE";
};

export function evaluateExecutionGuard(input: ExecutionGuardInput): ExecutionGuardResult {
  const reasons: string[] = [];
  if (!input.entitlement.valid) reasons.push("missing_or_invalid_full_entitlement");
  if (input.entitlement.entitlement?.accessLevel !== "FULL_WOLFIE") reasons.push("full_wolfie_entitlement_required");
  if (!input.brokerConnector.localReady) reasons.push("local_broker_connector_not_ready");
  if (input.killSwitchActive) reasons.push("kill_switch_active");
  if (!input.botActive) reasons.push("bot_inactive");
  if (!input.mandateId) reasons.push("mandate_missing");
  if (!input.riskPassed) reasons.push("risk_limit_breach");
  if (input.route === "cloud") reasons.push("cloud_order_route_blocked");
  if (input.requestedMode === "Paper" && input.intendedAction === "live_order") reasons.push("paper_mode_blocks_live_execution");
  if (input.requestedMode === "Live" && !input.entitlement.valid) reasons.push("live_mode_requires_valid_entitlement");

  const allowed = reasons.length === 0 && input.requestedMode === "Live" && input.route === "local";
  return {
    allowed,
    reasons,
    userFacingExplanation: allowed
      ? "Local live execution guard passed. Real broker submission remains subject to connector implementation."
      : "Live execution is blocked until full entitlement, local broker readiness, active bot mandate, risk, and local route checks pass.",
    auditEvent: {
      type: "execution_guard",
      allowed,
      reasons,
      route: input.route,
      mode: input.requestedMode,
    },
    requiredState: ["FULL_LICENSED", "Live mode", "local broker ready", "active bot", "valid mandate", "risk passed", "kill switch off", "local route"],
    requiredEntitlement: "FULL_WOLFIE",
  };
}
