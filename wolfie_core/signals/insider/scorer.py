from __future__ import annotations

from typing import Any, Dict

from wolfie_core.common import provenance


IGNORED_CODES = {"A", "M", "F", "G", "D"}
REQUIRED_FIELDS = ["accession_number", "ticker", "owner_name", "transaction_date", "transaction_code"]


class InsiderSignalScorer:
    def score(
        self,
        event: Dict[str, Any],
        market_context: Dict[str, Any] | None = None,
        cluster: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        market_context = market_context or {}
        cluster = cluster or {}
        missing = [field for field in REQUIRED_FIELDS if event.get(field) in (None, "")]
        source_mode = event.get("source_mode", "SIM_REPLAY_DATA")
        code = event.get("transaction_code", "UNKNOWN")

        if missing:
            return self._result(0, "F", "log_only", event, missing, "UNKNOWN", "missing_required_inputs")
        if code == "UNKNOWN":
            return self._result(0, "F", "log_only", event, [], "rejected", "unknown_transaction_code")

        score = 0
        reasons = []
        if code == "P":
            score += 55
            reasons.append("open_market_purchase")
        elif code == "S":
            score += 25
            reasons.append("sale_downweighted")
        elif code in IGNORED_CODES:
            score += 8
            reasons.append("non_open_market_purchase_downweighted")
        else:
            return self._result(0, "F", "log_only", event, [], "rejected", "unsupported_transaction_code")

        role = str(event.get("owner_role", "")).lower()
        if any(term in role for term in ["ceo", "cfo", "director", "10%"]):
            score += 10
            reasons.append("senior_insider")

        dollar_value = event.get("dollar_value")
        if isinstance(dollar_value, (int, float)):
            if dollar_value >= 1_000_000:
                score += 15
                reasons.append("large_dollar_value")
            elif dollar_value >= 250_000:
                score += 8
                reasons.append("meaningful_dollar_value")

        if cluster.get("cluster_detected"):
            score += min(12, cluster.get("cluster_score", 0) / 8)
            reasons.append("cluster_buying")

        if market_context.get("market_confirmation"):
            score += 10
            reasons.append("market_confirmation")

        if event.get("is_10b5_1"):
            score -= 8
            reasons.append("10b5_1_downweight")

        score = max(0, min(100, round(score, 2)))
        grade = self._grade(score)
        return self._result(score, grade, self._action(score, code), event, [], "calculated", None, reasons, source_mode)

    def _result(
        self,
        score: float,
        grade: str,
        action: str,
        event: Dict[str, Any],
        missing: list[str],
        status: str,
        rejection_reason: str | None,
        reasons: list[str] | None = None,
        source_mode: str | None = None,
    ) -> Dict[str, Any]:
        source_mode = source_mode or event.get("source_mode", "SIM_REPLAY_DATA")
        return {
            "ticker": event.get("ticker", "UNKNOWN"),
            "owner_name": event.get("owner_name", "UNKNOWN"),
            "transaction_code": event.get("transaction_code", "UNKNOWN"),
            "insider_signal_score": score,
            "signal_grade": grade,
            "recommended_action": action,
            "explanation_json": {
                "reasons": reasons or [],
                "rejection_reason": rejection_reason,
                "source_note": "Simulated/replay Form 4 fixture only; not verified real-world insider data.",
            },
            "missing_inputs": missing,
            "status": status,
            "source_mode": source_mode,
            "provenance": provenance("InsiderSignalScorer") | {"source_mode": source_mode, "scenario_id": event.get("scenario_id")},
        }

    def _grade(self, score: float) -> str:
        if score >= 85:
            return "A"
        if score >= 70:
            return "B"
        if score >= 50:
            return "C"
        if score >= 25:
            return "D"
        return "F"

    def _action(self, score: float, code: str) -> str:
        if code != "P":
            return "watchlist_alert" if score >= 35 else "log_only"
        if score >= 85:
            return "high_conviction_paper_trade_signal"
        if score >= 75:
            return "paper_trade_signal"
        if score >= 60:
            return "trading_alert"
        if score >= 40:
            return "watchlist_alert"
        return "log_only"
