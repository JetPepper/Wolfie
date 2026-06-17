from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Any, Dict, List

from wolfie_core.common import provenance


class ClusterBuyingDetector:
    def __init__(self, window_days: int = 10):
        self.window_days = window_days

    def detect(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        purchases = [event for event in events if event.get("transaction_code") == "P" and event.get("ticker")]
        by_ticker = defaultdict(list)
        for event in purchases:
            by_ticker[event["ticker"]].append(event)

        best = None
        for ticker, ticker_events in by_ticker.items():
            dated = [event for event in ticker_events if self._parse_date(event.get("transaction_date"))]
            dated.sort(key=lambda item: item["transaction_date"])
            for index, start in enumerate(dated):
                start_date = self._parse_date(start["transaction_date"])
                window = [
                    event
                    for event in dated[index:]
                    if (self._parse_date(event["transaction_date"]) - start_date).days <= self.window_days
                ]
                if len(window) >= 2 and (best is None or len(window) > len(best)):
                    best = window

        if not best:
            return {
                "cluster_detected": False,
                "ticker": "UNKNOWN",
                "insiders": [],
                "total_dollar_value": 0,
                "cluster_window": self.window_days,
                "cluster_score": 0,
                "status": "simulated",
                "source_mode": "SIM_REPLAY_DATA",
                "provenance": provenance("ClusterBuyingDetector") | {"source_mode": "SIM_REPLAY_DATA"},
            }

        total = round(sum(event.get("dollar_value", 0) or 0 for event in best), 2)
        score = min(100, round(len(best) * 22 + total / 100_000, 2))
        return {
            "cluster_detected": True,
            "ticker": best[0]["ticker"],
            "insiders": [event.get("owner_name", "UNKNOWN") for event in best],
            "total_dollar_value": total,
            "cluster_window": self.window_days,
            "cluster_score": score,
            "status": "simulated",
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("ClusterBuyingDetector") | {"source_mode": "SIM_REPLAY_DATA"},
        }

    def _parse_date(self, value: str | None):
        if not value:
            return None
        return date.fromisoformat(value[:10])
