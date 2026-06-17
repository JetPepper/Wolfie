from collections import defaultdict
from typing import Any, Dict, List

from wolfie_core.common import provenance


class InsiderLeaderboard:
    def rank(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        buyers = defaultdict(float)
        sellers = defaultdict(float)
        issuers = defaultdict(float)
        for event in events:
            key = event.get("owner_name", "UNKNOWN")
            value = float(event.get("dollar_value") or 0)
            if event.get("transaction_code") == "P":
                buyers[key] += value
                issuers[event.get("ticker", "UNKNOWN")] += value
            elif event.get("transaction_code") == "S":
                sellers[key] += value

        return {
            "label": "simulated/replay-derived",
            "top_buyers": self._rank_map(buyers, "owner_name"),
            "top_sellers": self._rank_map(sellers, "owner_name"),
            "cluster_buying_issuers": self._rank_map(issuers, "ticker"),
            "status": "simulated",
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("InsiderLeaderboard") | {"source_mode": "SIM_REPLAY_DATA"},
        }

    def _rank_map(self, values, key_name: str):
        return [
            {key_name: key, "total_dollar_value": round(value, 2), "status": "calculated"}
            for key, value in sorted(values.items(), key=lambda item: item[1], reverse=True)[:20]
        ]
