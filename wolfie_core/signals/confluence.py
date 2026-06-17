from __future__ import annotations

from typing import Any, Dict

from wolfie_core.common import provenance


class ConfluenceScorer:
    formula_version = "confluence_v1"

    def score(self, signal: Dict[str, Any], market_context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        market_context = market_context or {}
        missing = []
        base = signal.get("confidence_score", 0)
        if signal.get("status") in {"UNKNOWN", "rejected"}:
            base = min(base, 25)
            missing.append("valid_signal")
        if not market_context.get("volume"):
            base -= 5
            missing.append("volume")
        if market_context.get("spread_bps") in (None, "UNKNOWN"):
            base -= 5
            missing.append("spread_bps")
        if not market_context.get("cost_available"):
            base -= 5
            missing.append("cost_available")
        if not market_context.get("risk_reward_available"):
            base -= 5
            missing.append("risk_reward_available")
        score = max(0, min(100, int(base)))
        action = "ignore"
        if score >= 85:
            action = "high_conviction_paper_trade_signal"
        elif score >= 75:
            action = "paper_trade_signal"
        elif score >= 65:
            action = "alert"
        elif score >= 50:
            action = "watchlist"
        return {
            "score": score,
            "action": action,
            "components_json": {"base_confidence": signal.get("confidence_score", 0), "adjusted_score": score},
            "missing_inputs": missing,
            "status": "calculated" if not missing else "UNKNOWN",
            "formula_version": self.formula_version,
            "provenance": provenance("ConfluenceScorer"),
        }
