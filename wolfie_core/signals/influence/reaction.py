from typing import Dict

from wolfie_core.common import provenance


class MarketReactionAnalyzer:
    REQUIRED = ["previous_close", "last", "volume", "average_volume", "bid", "ask"]

    def analyze(self, market_data: Dict) -> Dict:
        missing = [field for field in self.REQUIRED if market_data.get(field) in (None, "", "UNKNOWN")]
        source_mode = market_data.get("source_mode", "SIM_REPLAY_DATA")
        if missing:
            return {
                "market_confirmation": False,
                "status": "UNKNOWN",
                "missing_inputs": missing,
                "source_mode": source_mode,
                "provenance": provenance("MarketReactionAnalyzer") | {"source_mode": source_mode},
            }
        return_pct = round(((market_data["last"] - market_data["previous_close"]) / market_data["previous_close"]) * 100, 2)
        relative_volume = round(market_data["volume"] / market_data["average_volume"], 4) if market_data["average_volume"] else "UNKNOWN"
        spread_bps = round(((market_data["ask"] - market_data["bid"]) / market_data["last"]) * 10000, 2)
        market_confirmation = relative_volume != "UNKNOWN" and relative_volume >= 1.2 and abs(return_pct) >= 1 and spread_bps <= 75
        if market_confirmation and return_pct > 0:
            reaction_type = "confirmed_bullish"
        elif market_confirmation and return_pct < 0:
            reaction_type = "confirmed_bearish"
        elif abs(return_pct) < 1:
            reaction_type = "muted"
        else:
            reaction_type = "unconfirmed"
        return {
            "return_pct": return_pct,
            "relative_volume": relative_volume,
            "spread_bps": spread_bps,
            "market_confirmation": market_confirmation,
            "reaction_type": reaction_type,
            "status": "calculated",
            "source_mode": source_mode,
            "provenance": provenance("MarketReactionAnalyzer") | {"source_mode": source_mode},
        }
