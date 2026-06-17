from __future__ import annotations

from typing import Any, Dict

from wolfie_core.common import provenance


class DynamicPositionSizer:
    def __init__(self, max_trade_risk_pct: float = 0.01, max_position_notional: float = 5000, max_symbol_exposure: float = 5000):
        self.max_trade_risk_pct = max_trade_risk_pct
        self.max_position_notional = max_position_notional
        self.max_symbol_exposure = max_symbol_exposure

    def size(self, account_size: float, buying_power: float, entry_price: float | None, stop_price: float | None, signal_score: float) -> Dict[str, Any]:
        if entry_price is None or stop_price is None:
            return {"quantity": "UNKNOWN", "status": "UNKNOWN", "reason": "missing_entry_or_stop", "provenance": provenance("DynamicPositionSizer")}
        risk_per_share = abs(entry_price - stop_price)
        if risk_per_share == 0:
            return {"quantity": "UNKNOWN", "status": "UNKNOWN", "reason": "zero_risk_per_share", "provenance": provenance("DynamicPositionSizer")}
        account_risk = account_size * self.max_trade_risk_pct * max(min(signal_score, 100), 0) / 100
        quantity = account_risk / risk_per_share
        quantity = min(quantity, self.max_position_notional / entry_price, self.max_symbol_exposure / entry_price, buying_power / entry_price)
        return {"quantity": int(max(quantity, 0)), "status": "calculated", "provenance": provenance("DynamicPositionSizer")}
