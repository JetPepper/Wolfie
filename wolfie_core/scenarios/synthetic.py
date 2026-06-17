from __future__ import annotations

import random
from typing import Any, Dict

from wolfie_core.audit.log import AuditLog
from wolfie_core.common import provenance


class SyntheticMarketGenerator:
    REGIMES = {"trend", "chop", "gap", "breakout", "reversal", "volume_spike", "spread_widening", "missing_data", "stale_data", "volatility_expansion", "market_panic"}

    def __init__(self, audit_log: AuditLog | None = None):
        self.audit_log = audit_log or AuditLog()

    def generate(self, seed: int, regime: str, symbol: str = "AAPL", points: int = 10) -> Dict[str, Any]:
        rng = random.Random(f"{seed}:{regime}:{symbol}:{points}")
        price = 100 + rng.random() * 20
        quotes = []
        candles = []
        for index in range(points):
            drift = self._drift(regime, index, rng)
            price = round(max(1, price + drift), 4)
            spread = round(0.05 + (rng.random() * (1.5 if regime == "spread_widening" else 0.1)), 4)
            bid = None if regime == "missing_data" and index == 0 else round(price - spread / 2, 4)
            ask = None if regime == "missing_data" and index == 0 else round(price + spread / 2, 4)
            timestamp = f"2026-06-16T14:{30 + index:02d}:00Z"
            volume = int(100000 * (3 if regime == "volume_spike" and index == points - 1 else 1) * (0.1 if regime == "market_panic" else 1))
            quotes.append({"timestamp": timestamp, "symbol": symbol, "bid": bid, "ask": ask, "last": price, "volume": volume, "spread": spread, "status": "simulated"})
            candles.append({"timestamp": timestamp, "open": price - drift, "high": price + abs(drift), "low": price - abs(drift), "close": price, "volume": volume, "status": "simulated"})
        result = {
            "symbol": symbol,
            "regime": regime,
            "seed": seed,
            "quotes": quotes,
            "candles": candles,
            "status": "simulated",
            "source_mode": "SIM_SYNTHETIC_DATA",
            "generated_at": "DETERMINISTIC_SYNTHETIC_OUTPUT",
            "provenance": {
                "source_name": "SyntheticMarketGenerator",
                "source_mode": "SIM_SYNTHETIC_DATA",
                "seed": seed,
                "generated_at": "DETERMINISTIC_SYNTHETIC_OUTPUT",
            },
        }
        self.audit_log.record("synthetic_data_generated", f"Generated {regime} synthetic data", result)
        return result

    def _drift(self, regime, index, rng):
        if regime in {"trend", "breakout"}:
            return 0.6 + rng.random()
        if regime in {"reversal", "market_panic"}:
            return -0.8 - rng.random()
        if regime == "gap" and index == 0:
            return 5
        return rng.uniform(-0.5, 0.5)
