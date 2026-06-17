from __future__ import annotations

from typing import Any, Dict

from wolfie_core.common import provenance


class CostModel:
    formula_version = "cost_model_v1"

    def __init__(
        self,
        commission_per_order: float = 0,
        slippage_bps: float = 1,
        spread_bps: float = 0,
        sec_fee_bps: float = 0,
        taf_fee_per_share: float = 0,
        minimum_net_edge_required: float = 0,
    ):
        self.settings = {
            "commission_per_order": commission_per_order,
            "slippage_bps": slippage_bps,
            "spread_bps": spread_bps,
            "sec_fee_bps": sec_fee_bps,
            "taf_fee_per_share": taf_fee_per_share,
            "minimum_net_edge_required": minimum_net_edge_required,
        }

    def preview(self, symbol: str, side: str, entry_price: float | None, exit_price: float | None, quantity: float | None) -> Dict[str, Any]:
        if entry_price is None or quantity is None:
            unknown = self._field("UNKNOWN", "UNKNOWN")
            outputs = {
                "estimated_commission": unknown,
                "estimated_spread_cost": unknown,
                "estimated_slippage": unknown,
                "estimated_regulatory_fees": unknown,
                "total_estimated_cost": unknown,
                "break_even_price": unknown,
                "gross_pnl": unknown,
                "net_pnl_after_costs": unknown,
                "minimum_required_price_move": unknown,
            }
            return {"symbol": symbol, "status": "UNKNOWN", "formula_version": self.formula_version, "outputs": outputs, **outputs, "provenance": provenance("CostModel")}

        notional = entry_price * quantity
        commission = self.settings["commission_per_order"]
        spread_cost = notional * self.settings["spread_bps"] / 10000
        slippage = notional * self.settings["slippage_bps"] / 10000
        regulatory = notional * self.settings["sec_fee_bps"] / 10000 + quantity * self.settings["taf_fee_per_share"]
        total = round(commission + spread_cost + slippage + regulatory, 4)
        direction = 1 if side.upper() == "BUY" else -1
        gross = 0 if exit_price is None else (exit_price - entry_price) * quantity * direction
        break_even = entry_price + (total / quantity * direction)
        minimum_move = (total + self.settings["minimum_net_edge_required"]) / quantity
        outputs = {
            "estimated_commission": self._field(round(commission, 4), "simulated"),
            "estimated_spread_cost": self._field(round(spread_cost, 4), "calculated"),
            "estimated_slippage": self._field(round(slippage, 4), "estimated"),
            "estimated_regulatory_fees": self._field(round(regulatory, 4), "estimated"),
            "total_estimated_cost": self._field(total, "estimated"),
            "break_even_price": self._field(round(break_even, 4), "calculated"),
            "gross_pnl": self._field(round(gross, 4), "calculated" if exit_price is not None else "UNKNOWN"),
            "net_pnl_after_costs": self._field(round(gross - total, 4), "estimated" if exit_price is not None else "UNKNOWN"),
            "minimum_required_price_move": self._field(round(minimum_move, 4), "calculated"),
        }
        return {"symbol": symbol, "status": "estimated", "formula_version": self.formula_version, "outputs": outputs, **outputs, "provenance": provenance("CostModel")}

    def update_settings(self, values: Dict[str, Any]) -> Dict[str, Any]:
        for key in self.settings:
            if key in values and values[key] is not None:
                self.settings[key] = values[key]
        return self.get_settings()

    def get_settings(self) -> Dict[str, Any]:
        return {"status": "simulated", "settings": dict(self.settings), "provenance": provenance("CostModel")}

    def _field(self, value: Any, status: str) -> Dict[str, Any]:
        return {"value": value, "status": status, "formula_version": self.formula_version, "provenance": provenance("CostModel")}
