from __future__ import annotations


class TradeSetupClassifier:
    SETUP_TYPES = {
        "RSI_MEAN_REVERSION",
        "MOVING_AVERAGE_CROSSOVER",
        "BREAKOUT_20D",
        "VWAP_RECLAIM",
        "OPENING_RANGE_BREAKOUT",
        "RELATIVE_STRENGTH_CONTINUATION",
        "NO_TRADE",
        "UNKNOWN",
    }

    def classify(self, setup_type: str | None) -> str:
        return setup_type if setup_type in self.SETUP_TYPES else "UNKNOWN"
