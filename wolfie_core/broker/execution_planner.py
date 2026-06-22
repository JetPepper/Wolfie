from __future__ import annotations

from typing import Any, Dict

from wolfie_core.broker.environment import EXECUTION_ENGINE, SOURCE_MODE
from wolfie_core.common import new_id, now_iso, provenance
from wolfie_core.costs.cost_model import CostModel
from wolfie_core.mcp.contract_adapter import MCPContractAdapter
from wolfie_core.risk.risk_manager import RiskManager


class ExecutionPlanner:
    def __init__(self, adapter: MCPContractAdapter, risk_manager: RiskManager, cost_model: CostModel):
        self.adapter = adapter
        self.risk_manager = risk_manager
        self.cost_model = cost_model

    def create_plan(self, signal: Dict[str, Any], order_type: str, limit_price: float, quantity: float, stop_price: float | None, take_profit_price: float | None = None) -> Dict[str, Any]:
        side = signal.get("side", "BUY")
        symbol = signal.get("symbol")
        if not symbol:
            return {
                "plan_id": new_id("plan"),
                "signal_id": signal.get("signal_id"),
                "status": "rejected",
                "submission_status": "missing_symbol",
                "risk_result": {"passed": False, "reason_code": "missing_symbol"},
                "live_order_submitted": False,
                "execution_engine": EXECUTION_ENGINE,
                "source_mode": SOURCE_MODE,
                "provenance": provenance("ExecutionPlanner"),
            }
        cost = self.cost_model.preview(symbol, side, limit_price, take_profit_price or limit_price, quantity)
        risk = self.risk_manager.check(
            {
                "symbol": symbol,
                "side": side,
                "order_type": order_type,
                "price": limit_price,
                "spread_bps": 5,
                "volume": 1,
                "cost_preview": cost,
                "asset_type": "equity",
            }
        )
        status = "planned" if risk["passed"] and order_type == "limit" and side in {"BUY", "SELL"} else "rejected"
        if order_type != "limit":
            risk = self.risk_manager.check({"symbol": symbol, "side": side, "order_type": "market"})
            status = "rejected"
        return {
            "plan_id": new_id("plan"),
            "signal_id": signal.get("signal_id"),
            "symbol": symbol,
            "side": side,
            "order_type": "limit" if order_type == "limit" else order_type,
            "limit_price": limit_price,
            "quantity": quantity,
            "stop_price": stop_price,
            "take_profit_price": take_profit_price,
            "cost_preview": cost,
            "risk_result": risk,
            "status": status,
            "created_at": now_iso(),
            "source_mode": SOURCE_MODE,
            "execution_engine": EXECUTION_ENGINE,
            "live_order_submitted": False,
            "provenance": provenance("ExecutionPlanner"),
        }

    def submit_paper(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        if plan.get("status") != "planned" or not plan.get("risk_result", {}).get("passed"):
            return {**plan, "status": "rejected", "submission_status": "risk_blocked", "live_order_submitted": False, "execution_engine": EXECUTION_ENGINE}
        preview = self.adapter.call("preview_order", symbol=plan["symbol"], side=plan["side"].lower(), order_type="limit", quantity=plan["quantity"], limit_price=plan["limit_price"])
        placed = self.adapter.call("place_order", symbol=plan["symbol"], side=plan["side"].lower(), order_type="limit", quantity=plan["quantity"], limit_price=plan["limit_price"])
        return {**placed, "plan_id": plan["plan_id"], "preview": preview, "live_order_submitted": False, "execution_engine": EXECUTION_ENGINE}
