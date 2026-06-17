from __future__ import annotations

from typing import Dict

from wolfie_core.common import provenance


class RumorRiskFilter:
    def evaluate(self, event: Dict, market_context: Dict | None = None) -> Dict:
        market_context = market_context or {}
        text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
        flags = []
        score = 0
        if any(word in text for word in ["rumor", "unconfirmed", "could", "might"]):
            flags.append("unconfirmed_claim")
            score += 30
        if any(word in text for word in ["moon", "guaranteed", "pump", "100x"]):
            flags.append("pump_like_language")
            score += 35
        if event.get("source_type") in {"reddit", "stocktwits", "creator"} and not market_context.get("market_confirmation"):
            flags.append("social_only_no_confirmation")
            score += 25
        if market_context.get("relative_volume") in (None, "UNKNOWN"):
            flags.append("missing_volume_confirmation")
            score += 10
        if market_context.get("spread_bps") not in (None, "UNKNOWN") and market_context.get("spread_bps", 0) > 75:
            flags.append("wide_spread")
            score += 20
        score = min(100, score)
        if score >= 70:
            action = "ignore"
        elif score >= 40:
            action = "watchlist_only"
        else:
            action = "allow_scoring"
        return {
            "rumor_risk_score": score,
            "risk_flags": flags,
            "recommended_action": action,
            "status": "calculated",
            "source_mode": event.get("source_mode", "SIM_REPLAY_DATA"),
            "provenance": provenance("RumorRiskFilter") | {"source_mode": event.get("source_mode", "SIM_REPLAY_DATA")},
        }
