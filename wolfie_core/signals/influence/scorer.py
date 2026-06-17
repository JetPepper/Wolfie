from typing import Dict

from wolfie_core.common import provenance


class InfluenceScorer:
    def score(self, event: Dict, sentiment: Dict, engagement: Dict, reaction: Dict, rumor_risk: Dict) -> Dict:
        source_mode = event.get("source_mode", "SIM_REPLAY_DATA")
        missing = []
        for name, payload in {"sentiment": sentiment, "engagement": engagement, "reaction": reaction}.items():
            if payload.get("status") == "UNKNOWN":
                missing.append(name)

        score = 0
        if event.get("source_type") == "simulated_news":
            score += 25
        elif event.get("source_type") in {"reddit", "stocktwits", "creator"}:
            score += 10
        score += max(0, sentiment.get("sentiment_score", 0)) * 0.25
        score += engagement.get("mentions_per_minute", 0) if engagement.get("mentions_per_minute") != "UNKNOWN" else 0
        if reaction.get("market_confirmation"):
            score += 25
        score -= rumor_risk.get("rumor_risk_score", 0) * 0.45
        score = max(0, min(100, round(score, 2)))

        social_rumor_block = "social_only_no_confirmation" in rumor_risk.get("risk_flags", []) and rumor_risk.get("rumor_risk_score", 0) >= 40
        action = self._action(score)
        if social_rumor_block:
            action = "ignore" if rumor_risk.get("rumor_risk_score", 0) >= 70 else "watchlist"

        return {
            "ticker": event.get("ticker") or (event.get("tickers") or ["UNKNOWN"])[0],
            "influence_score": score,
            "signal_type": "paper_trade_signal" if action in {"paper_trade_signal", "high_conviction"} else action,
            "recommended_action": action,
            "explanation_json": {
                "source_type": event.get("source_type", "UNKNOWN"),
                "sentiment": sentiment.get("bullish_bearish_neutral", "UNKNOWN"),
                "catalyst_type": sentiment.get("catalyst_type", "unknown"),
                "rumor_flags": rumor_risk.get("risk_flags", []),
                "source_note": "Simulated/replay influence fixture only; not verified real-world news or social data.",
            },
            "missing_inputs": missing,
            "status": "calculated" if not missing else "UNKNOWN",
            "source_mode": source_mode,
            "provenance": provenance("InfluenceScorer") | {"source_mode": source_mode, "scenario_id": event.get("scenario_id")},
        }

    def _action(self, score: float) -> str:
        if score >= 85:
            return "high_conviction"
        if score >= 70:
            return "paper_trade_signal"
        if score >= 50:
            return "alert"
        if score >= 25:
            return "watchlist"
        return "ignore"
