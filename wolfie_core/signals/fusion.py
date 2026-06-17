from __future__ import annotations

from typing import Any, Dict, List

from wolfie_core.audit.log import AuditLog
from wolfie_core.common import new_id, now_iso, provenance


class SignalFusionEngine:
    def __init__(self, audit_log: AuditLog | None = None):
        self.audit_log = audit_log or AuditLog()
        self.fused_signals: List[Dict[str, Any]] = []

    def fuse(
        self,
        insider_signal: Dict[str, Any] | None = None,
        cluster_signal: Dict[str, Any] | None = None,
        influence_signal: Dict[str, Any] | None = None,
        technical_signal: Dict[str, Any] | None = None,
        market_context: Dict[str, Any] | None = None,
        cost_risk_context: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        insider_signal = insider_signal or {}
        cluster_signal = cluster_signal or {}
        influence_signal = influence_signal or {}
        technical_signal = technical_signal or {}
        market_context = market_context or {}
        cost_risk_context = cost_risk_context or {}
        all_inputs = [insider_signal, cluster_signal, influence_signal, technical_signal, market_context, cost_risk_context]

        if any(payload.get("live_order_submitted") is True for payload in all_inputs if isinstance(payload, dict)):
            return self._reject("live_order_submitted_true", all_inputs)

        risk = cost_risk_context.get("risk", {})
        if risk and risk.get("passed") is False:
            return self._reject(risk.get("reason_code", "risk_manager_blocked"), all_inputs)

        quote_status = market_context.get("quote_status", market_context.get("status"))
        if quote_status in {"UNKNOWN", "stale"}:
            return self._reject(f"{quote_status.lower()}_quote", all_inputs)

        spread_bps = market_context.get("spread_bps")
        if spread_bps in (None, "", "UNKNOWN"):
            return self._reject("missing_spread", all_inputs)
        if isinstance(spread_bps, (int, float)) and spread_bps > 75:
            return self._reject("wide_spread", all_inputs)

        score = 0
        reasons = []
        if insider_signal:
            score += insider_signal.get("insider_signal_score", 0) * 0.35
            reasons.append("insider_signal")
        if cluster_signal.get("cluster_detected"):
            score += cluster_signal.get("cluster_score", 0) * 0.15
            reasons.append("cluster_buying")
        if influence_signal:
            score += influence_signal.get("influence_score", 0) * 0.3
            reasons.append("influence_signal")
        if technical_signal:
            score += technical_signal.get("confidence_score", technical_signal.get("score", 0)) * 0.2
            reasons.append("technical_confirmation")
        if market_context.get("market_confirmation"):
            score += 10
            reasons.append("market_confirmation")

        rumorish = influence_signal.get("recommended_action") in {"ignore", "watchlist"} and not market_context.get("market_confirmation")
        if rumorish:
            score = min(score, 35)
            reasons.append("social_or_rumor_downweight")

        score = max(0, min(100, round(score, 2)))
        signal_type = self._signal_type(insider_signal, cluster_signal, influence_signal, technical_signal)
        action = self._action(score)
        result = {
            "fused_signal_id": new_id("fused"),
            "signal_type": signal_type,
            "fused_score": score,
            "recommended_action": action,
            "explanation_json": {"reasons": reasons, "risk_wins": True},
            "missing_inputs": [],
            "status": "calculated",
            "source_mode": "SIM_REPLAY_DATA",
            "generated_at": now_iso(),
            "live_order_submitted": False,
            "real_robinhood_connected": False,
            "real_money_at_risk": False,
            "provenance": provenance("SignalFusionEngine") | {"source_mode": "SIM_REPLAY_DATA"},
        }
        self.fused_signals.append(result)
        self.audit_log.record("signal_fused", f"Fused simulated signal {signal_type}", result)
        return result

    def list_fused(self) -> Dict[str, Any]:
        return {
            "signals": self.fused_signals,
            "status": "simulated",
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("SignalFusionEngine") | {"source_mode": "SIM_REPLAY_DATA"},
        }

    def _reject(self, reason: str, inputs: List[Dict[str, Any]]) -> Dict[str, Any]:
        result = {
            "fused_signal_id": new_id("fused"),
            "signal_type": "NO_TRADE",
            "fused_score": 0,
            "recommended_action": "no_trade",
            "rejection_reason": reason,
            "explanation_json": {"reason": reason, "risk_wins": True},
            "missing_inputs": [reason] if reason.startswith("missing") else [],
            "status": "rejected",
            "source_mode": "SIM_REPLAY_DATA",
            "generated_at": now_iso(),
            "live_order_submitted": False,
            "real_robinhood_connected": False,
            "real_money_at_risk": False,
            "provenance": provenance("SignalFusionEngine") | {"source_mode": "SIM_REPLAY_DATA"},
        }
        self.fused_signals.append(result)
        self.audit_log.record("signal_fusion_rejected", f"Rejected simulated fused signal: {reason}", {"result": result, "inputs": inputs})
        return result

    def _signal_type(self, insider, cluster, influence, technical):
        if insider and influence and cluster.get("cluster_detected"):
            return "INSIDER_PLUS_NEWS"
        if insider and influence:
            return "INSIDER_PLUS_NEWS"
        if insider and technical:
            return "INSIDER_PLUS_TECHNICAL"
        if influence and technical:
            return "NEWS_PLUS_TECHNICAL"
        if insider:
            return "INSIDER_PURCHASE_CLUSTER" if cluster.get("cluster_detected") else "INSIDER_STANDALONE"
        if influence:
            return "INFLUENCE_STANDALONE"
        return "TECHNICAL_STANDALONE" if technical else "NO_TRADE"

    def _action(self, score):
        if score >= 85:
            return "high_conviction_paper_trade_signal"
        if score >= 65:
            return "paper_trade_signal"
        if score >= 45:
            return "watchlist_alert"
        return "log_only"
