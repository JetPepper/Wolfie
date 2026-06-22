from __future__ import annotations

from typing import Any, Dict, List

from wolfie_core.common import provenance


class RiskManager:
    def __init__(
        self,
        max_daily_loss: float = 1000,
        max_trade_risk_pct: float = 0.01,
        max_position_notional: float = 5000,
        max_open_positions: int = 5,
        max_trades_per_day: int = 20,
        max_symbol_exposure: float = 5000,
        max_sector_exposure: float = 10000,
        allowed_symbols: List[str] | None = None,
    ):
        self.settings = {
            "max_daily_loss": max_daily_loss,
            "max_trade_risk_pct": max_trade_risk_pct,
            "max_position_notional": max_position_notional,
            "max_open_positions": max_open_positions,
            "max_trades_per_day": max_trades_per_day,
            "max_symbol_exposure": max_symbol_exposure,
            "max_sector_exposure": max_sector_exposure,
            "allowed_symbols": allowed_symbols or [],
            "no_market_orders": True,
            "no_options": True,
            "no_margin": True,
            "no_shorting": True,
            "reject_missing_price": True,
            "reject_missing_spread": True,
            "reject_missing_volume": True,
            "reject_missing_cost": True,
            "reject_stale_data": True,
        }

    def check(self, candidate: Dict[str, Any]) -> Dict[str, Any]:
        required = ["symbol", "side", "order_type", "price", "spread_bps", "volume", "cost_preview"]
        missing = [key for key in required if candidate.get(key) in (None, "", "UNKNOWN")]
        failed = []
        reason = None

        if self.settings["allowed_symbols"] and candidate.get("symbol") and candidate["symbol"] not in self.settings["allowed_symbols"]:
            reason = "symbol_not_allowed"
        elif candidate.get("order_type") == "market" and self.settings["no_market_orders"]:
            reason = "market_orders_disabled"
        elif candidate.get("asset_type") == "option" and self.settings["no_options"]:
            reason = "options_disabled"
        elif candidate.get("uses_margin") and self.settings["no_margin"]:
            reason = "margin_disabled"
        elif candidate.get("side") == "SELL_SHORT" and self.settings["no_shorting"]:
            reason = "shorting_disabled"
        elif missing:
            reason = "missing_required_input"

        if reason:
            failed.append(reason)
        return {
            "passed": reason is None,
            "severity": "none" if reason is None else "block",
            "reason_code": "passed" if reason is None else reason,
            "human_readable_reason": "Risk check passed." if reason is None else reason.replace("_", " "),
            "failed_rules": failed,
            "required_inputs": required,
            "missing_inputs": missing,
            "status": "calculated" if reason is None else "rejected",
            "provenance": provenance("RiskManager"),
        }

    def update_settings(self, values: Dict[str, Any]) -> Dict[str, Any]:
        for key in self.settings:
            if key in values and values[key] is not None:
                self.settings[key] = values[key]
        return self.get_settings()

    def get_settings(self) -> Dict[str, Any]:
        return {"status": "PAPER_ONLY_EXECUTION", "settings": dict(self.settings), "provenance": provenance("RiskManager")}
