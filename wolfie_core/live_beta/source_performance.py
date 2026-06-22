from __future__ import annotations

from typing import Dict


class SourcePerformanceEngine:
    def __init__(self):
        self.performance: Dict[str, dict] = {}

    def record_claim_outcome(self, source_id: str, outcome: str, market_impact_1d: float = 0.0) -> dict:
        row = self.performance.setdefault(source_id, {
            "source_id": source_id,
            "claims_total": 0,
            "claims_confirmed": 0,
            "claims_partially_confirmed": 0,
            "claims_contradicted": 0,
            "claims_unresolved": 0,
            "average_market_impact_1d": 0.0,
            "false_positive_rate": 0.0,
            "useful_signal_rate": 0.0,
        })
        row["claims_total"] += 1
        key = {
            "confirmed": "claims_confirmed",
            "partial": "claims_partially_confirmed",
            "contradicted": "claims_contradicted",
        }.get(outcome, "claims_unresolved")
        row[key] += 1
        total = row["claims_total"]
        row["average_market_impact_1d"] = round(((row["average_market_impact_1d"] * (total - 1)) + market_impact_1d) / total, 4)
        row["false_positive_rate"] = round(row["claims_contradicted"] / total, 4)
        row["useful_signal_rate"] = round((row["claims_confirmed"] + row["claims_partially_confirmed"] * 0.5) / total, 4)
        return {"status": "SOURCE_AVAILABLE", "performance": row}

    def list_performance(self) -> dict:
        return {"status": "SOURCE_AVAILABLE", "sources": list(self.performance.values())}
