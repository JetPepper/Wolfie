from typing import Any, Dict

from wolfie_core.common import provenance


class InsiderMarketContextAnalyzer:
    REQUIRED = ["bid", "ask", "last", "volume", "average_volume", "vwap"]

    def analyze(self, event: Dict[str, Any], quote: Dict[str, Any]) -> Dict[str, Any]:
        missing = [field for field in self.REQUIRED if quote.get(field) in (None, "", "UNKNOWN")]
        if missing:
            return {
                "ticker": event.get("ticker", "UNKNOWN"),
                "market_confirmation": False,
                "missing_inputs": missing,
                "status": "UNKNOWN",
                "source_mode": quote.get("source_mode", "SIM_REPLAY_DATA"),
                "provenance": provenance("InsiderMarketContextAnalyzer") | {"source_mode": quote.get("source_mode", "SIM_REPLAY_DATA")},
            }
        spread_bps = quote.get("spread_bps")
        if spread_bps in (None, "UNKNOWN"):
            spread_bps = round(((quote["ask"] - quote["bid"]) / quote["last"]) * 10000, 2)
        relative_volume = round(quote["volume"] / quote["average_volume"], 4) if quote["average_volume"] else "UNKNOWN"
        market_confirmation = relative_volume != "UNKNOWN" and relative_volume >= 1 and quote["last"] >= quote["vwap"] and spread_bps <= 50
        return {
            "ticker": event.get("ticker", "UNKNOWN"),
            "last": quote["last"],
            "volume": quote["volume"],
            "relative_volume": relative_volume,
            "spread_bps": spread_bps,
            "vwap": quote["vwap"],
            "market_confirmation": market_confirmation,
            "missing_inputs": [],
            "status": "calculated",
            "source_mode": quote.get("source_mode", "SIM_REPLAY_DATA"),
            "provenance": provenance("InsiderMarketContextAnalyzer") | {"source_mode": quote.get("source_mode", "SIM_REPLAY_DATA")},
        }
