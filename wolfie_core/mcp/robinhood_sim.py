import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from wolfie_core.audit.log import AuditLog
from wolfie_core.broker.environment import EXECUTION_ENGINE, MARKET_DATA_MODE, MCP_SERVER_NAME, SOURCE_MODE
from wolfie_core.data_integrity.service import DataIntegrityService
from wolfie_core.paper_exchange.exchange import PaperExchange


class RobinhoodSimMCPServer:
    TOOLS = [
        "get_account",
        "get_positions",
        "get_quote",
        "get_market_data",
        "get_historical_candles",
        "get_instrument",
        "get_trading_hours",
        "get_fee_schedule",
        "preview_order",
        "place_order",
        "cancel_order",
        "replace_order",
        "get_order",
        "list_orders",
    ]

    def __init__(
        self,
        fixture_path: Optional[Path] = None,
        candles_path: Optional[Path] = None,
        paper_exchange: Optional[PaperExchange] = None,
        audit_log: Optional[AuditLog] = None,
    ):
        root = Path(__file__).resolve().parents[2]
        self.fixture_path = fixture_path or root / "fixtures" / "quotes" / "AAPL.json"
        self.candles_path = candles_path or root / "fixtures" / "candles" / "AAPL_1d.json"
        self.data_integrity = DataIntegrityService()
        self.paper_exchange = paper_exchange or PaperExchange()
        self.audit_log = audit_log or AuditLog()
        self.market_data_mode = MARKET_DATA_MODE
        self.scenario_data = None

    def set_market_data_mode(self, mode: str, scenario_data: Optional[Dict[str, Any]] = None):
        if mode not in {"SIM_STATIC_FIXTURE", "SIM_REPLAY_DATA", "SIM_SYNTHETIC_DATA"}:
            raise ValueError(f"Unsupported market data mode: {mode}")
        self.market_data_mode = mode
        self.scenario_data = scenario_data
        self.audit_log.record("market_data_mode_changed", f"Market data mode set to {mode}", {"market_data_mode": mode, "status": "simulated"})
        return {"market_data_mode": mode, "status": "simulated", "source_mode": mode}

    def capabilities(self) -> Dict[str, Any]:
        return self._with_provenance(
            {
                "status": "simulated",
                "capabilities": {
                    "mode": "SIMULATED_LIVE_MCP_LOCAL",
                    "order_preview": True,
                    "order_placement": True,
                    "order_cancel": True,
                    "order_replace": True,
                    "paper_execution_only": True,
                    "real_robinhood_connected": False,
                    "live_order_submitted": False,
                    "real_money_at_risk": False,
                    "market_data_mode": self.market_data_mode,
                },
            }
        )

    def tools(self) -> Dict[str, Any]:
        return self._with_provenance({"status": "simulated", "tools": self.TOOLS})

    def get_quote(self, symbol: str) -> Dict[str, Any]:
        quote = self._load_quote(symbol)
        required = ["symbol", "bid", "ask", "last", "volume", "timestamp"]
        checked = self.data_integrity.require_fields(
            quote,
            required_fields=required,
            source_name=MCP_SERVER_NAME,
        )
        if checked["status"] == "UNKNOWN":
            result = self._with_provenance({**checked, "symbol": symbol.upper(), "source_name": MCP_SERVER_NAME})
            self.audit_log.record("missing_data", f"Missing quote data for {symbol}", result)
            return result
        checked["source_name"] = MCP_SERVER_NAME
        result = self._with_provenance(checked)
        self.audit_log.record("mcp_tool_call", f"get_quote {symbol}", result)
        self.audit_log.record("simulated_quote_request", f"Simulated quote request for {symbol}", result)
        return result

    def get_market_data(self, symbol: str) -> Dict[str, Any]:
        quote = self.get_quote(symbol)
        if quote["status"] == "UNKNOWN":
            return quote
        result = self._with_provenance(
            {
                "symbol": quote["symbol"],
                "quote": quote,
                "bid": quote["bid"],
                "ask": quote["ask"],
                "last": quote["last"],
                "volume": quote["volume"],
                "status": "simulated",
            }
        )
        self.audit_log.record("mcp_tool_call", f"get_market_data {symbol}", result)
        return result

    def get_historical_candles(self, symbol: str, timeframe: str = "1d") -> Dict[str, Any]:
        if symbol.upper() != "AAPL" or not self.candles_path.exists():
            result = self._with_provenance(
                {"symbol": symbol.upper(), "timeframe": timeframe, "candles": [], "status": "UNKNOWN", "missing_fields": ["candles"]}
            )
            self.audit_log.record("missing_data", f"Missing candle data for {symbol}", result)
            return result
        with self.candles_path.open() as handle:
            payload = json.load(handle)
        result = self._with_provenance(payload)
        self.audit_log.record("mcp_tool_call", f"get_historical_candles {symbol}", result)
        return result

    def get_instrument(self, symbol: str) -> Dict[str, Any]:
        symbol = symbol.upper()
        tradeable = symbol == "AAPL"
        result = self._with_provenance(
            {
                "symbol": symbol,
                "name": "Apple Inc." if symbol == "AAPL" else "UNKNOWN",
                "asset_type": "equity" if symbol == "AAPL" else "UNKNOWN",
                "tradeable": tradeable,
                "marginable": False,
                "shortable": False,
                "options_enabled": False,
                "status": "simulated" if tradeable else "UNKNOWN",
            }
        )
        self.audit_log.record("mcp_tool_call", f"get_instrument {symbol}", result)
        return result

    def get_trading_hours(self) -> Dict[str, Any]:
        result = self._with_provenance(
            {
                "market_open": "09:30:00",
                "market_close": "16:00:00",
                "is_open": True,
                "timezone": "America/New_York",
                "status": "simulated",
            }
        )
        self.audit_log.record("mcp_tool_call", "get_trading_hours", result)
        return result

    def get_fee_schedule(self, symbol: str = "AAPL") -> Dict[str, Any]:
        quote = self._load_quote(symbol)
        spread_bps = "UNKNOWN"
        spread_status = "UNKNOWN"
        if quote.get("bid") and quote.get("ask") and quote.get("last"):
            spread_bps = round(((quote["ask"] - quote["bid"]) / quote["last"]) * 10000, 4)
            spread_status = "calculated"
        result = self._with_provenance(
            {
                "symbol": symbol.upper(),
                "commission_per_order": {"value": 0, "status": "simulated"},
                "slippage_bps": {"value": 1, "status": "estimated"},
                "spread_bps": {"value": spread_bps, "status": spread_status},
                "sec_fee_bps": {"value": "UNKNOWN", "status": "UNKNOWN"},
                "taf_fee_per_share": {"value": "UNKNOWN", "status": "UNKNOWN"},
                "status": "simulated",
            }
        )
        self.audit_log.record("mcp_tool_call", f"get_fee_schedule {symbol}", result)
        return result

    def get_account(self) -> Dict[str, Any]:
        result = self._with_provenance(self.paper_exchange.account())
        self.audit_log.record("mcp_tool_call", "get_account", result)
        return result

    def get_positions(self) -> Dict[str, Any]:
        result = self._with_provenance({"positions": self.paper_exchange.list_positions(), "status": "simulated"})
        self.audit_log.record("mcp_tool_call", "get_positions", result)
        return result

    def preview_order(self, symbol: str, side: str, order_type: str, quantity: float, limit_price: float):
        quote = self.get_quote(symbol)
        if quote["status"] == "UNKNOWN":
            result = self._order_rejection(symbol, side, order_type, quantity, limit_price, "missing_quote", "UNKNOWN")
        else:
            result = self.paper_exchange.preview_order(symbol.upper(), side, order_type, quantity, limit_price, quote)
            result = self._with_provenance(result, order_related=True)
        self.audit_log.record("mcp_tool_call", f"preview_order {symbol}", result, True)
        self.audit_log.record("order_preview", f"Previewed simulated {side} order for {symbol}", result, True)
        return result

    def place_order(self, symbol: str, side: str, order_type: str, quantity: float, limit_price: float):
        quote = self.get_quote(symbol)
        if quote["status"] == "UNKNOWN":
            order = self._order_rejection(symbol, side, order_type, quantity, limit_price, "missing_quote", "UNKNOWN")
            self.audit_log.record("order_rejected", f"Rejected simulated {side} order for {symbol}", order, True)
            return order

        order = self.paper_exchange.place_order(symbol.upper(), side, order_type, quantity, limit_price, quote)
        order = self._with_provenance(order, order_related=True)
        self.audit_log.record("mcp_tool_call", f"place_order {symbol}", order, True)
        self.audit_log.record("simulated_order_placement", f"Placed simulated {side} order for {symbol}", order, True)
        if order["status"] in {"accepted", "pending", "partially_filled", "filled"}:
            self.audit_log.record("order_accepted", f"Accepted simulated {side} order for {symbol}", order, True)
        if order["status"] == "partially_filled":
            self.audit_log.record("order_partially_filled", f"Partially filled paper order for {symbol}", order, True)
        if order["status"] == "filled":
            self.audit_log.record("order_filled", f"Filled paper order for {symbol}", order, True)
            self.audit_log.record("paper_fill", f"Paper fill for {symbol}", order, True)
        if order["status"] == "rejected":
            self.audit_log.record("order_rejected", f"Rejected simulated {side} order for {symbol}", order, True)
        return order

    def cancel_order(self, order_id: str):
        order = self._with_provenance(self.paper_exchange.cancel_order(order_id), order_related=True)
        self.audit_log.record("mcp_tool_call", f"cancel_order {order_id}", order, True)
        if order["status"] == "cancelled":
            self.audit_log.record("order_cancelled", f"Cancelled simulated order {order_id}", order, True)
        return order

    def replace_order(self, order_id: str, quantity: Optional[float] = None, limit_price: Optional[float] = None):
        original = self.paper_exchange.get_order(order_id)
        if original is None:
            order = self._with_provenance(self.paper_exchange.cancel_order(order_id), order_related=True)
            self.audit_log.record("missing_data", f"Missing order {order_id}", order, True)
            return order
        quote = self.get_quote(original["symbol"])
        replacement = self._with_provenance(self.paper_exchange.replace_order(order_id, quantity, limit_price, quote), order_related=True)
        self.audit_log.record("mcp_tool_call", f"replace_order {order_id}", replacement, True)
        self.audit_log.record("order_replaced", f"Replaced simulated order {order_id}", replacement, True)
        return replacement

    def get_order(self, order_id: str):
        order = self.paper_exchange.get_order(order_id)
        if order is None:
            result = self._with_provenance({"order_id": order_id, "status": "UNKNOWN", "data_status": "UNKNOWN"}, order_related=True)
            self.audit_log.record("missing_data", f"Missing order {order_id}", result, True)
            return result
        result = self._with_provenance(order, order_related=True)
        self.audit_log.record("mcp_tool_call", f"get_order {order_id}", result, True)
        return result

    def list_orders(self) -> Dict[str, Any]:
        orders = self.paper_exchange.list_orders()
        result = self._with_provenance(
            {
                "orders": orders,
                "open_orders": [order for order in orders if order["status"] not in {"filled", "cancelled", "rejected", "expired", "replaced"}],
                "closed_orders": [order for order in orders if order["status"] in {"filled", "cancelled", "rejected", "expired", "replaced"}],
                "status": "simulated",
            },
            order_related=True,
        )
        self.audit_log.record("mcp_tool_call", "list_orders", result, True)
        return result

    def _load_quote(self, symbol: str) -> Dict[str, Any]:
        if self.scenario_data:
            quote = self.scenario_data.get("simulated_market_data", {}).get("quote")
            if quote and quote.get("symbol") == symbol.upper():
                return {**quote, "source_mode": self.market_data_mode}
        if symbol.upper() != "AAPL" or not self.fixture_path.exists():
            return {"symbol": symbol.upper()}
        with self.fixture_path.open() as handle:
            return json.load(handle)

    def _order_rejection(self, symbol: str, side: str, order_type: str, quantity: float, limit_price: float, reason: str, data_status: str):
        now = self._now()
        return self._with_provenance(
            {
                "order_id": None,
                "client_order_id": None,
                "symbol": symbol.upper(),
                "side": side,
                "order_type": order_type,
                "limit_price": limit_price,
                "quantity": quantity,
                "requested_quantity": quantity,
                "filled_quantity": 0,
                "remaining_quantity": quantity,
                "avg_fill_price": None,
                "status": "rejected",
                "data_status": data_status,
                "created_at": now,
                "updated_at": now,
                "submitted_at": now,
                "filled_at": None,
                "cancelled_at": None,
                "replaced_by_order_id": None,
                "rejection_reason": reason,
            },
            order_related=True,
        )

    def _with_provenance(self, payload: Dict[str, Any], order_related: bool = False) -> Dict[str, Any]:
        result = dict(payload)
        result.setdefault("status", "simulated")
        result["source_mode"] = SOURCE_MODE
        result["mcp_server"] = MCP_SERVER_NAME
        result["generated_at"] = self._now()
        result["scenario_id"] = result.get("scenario_id")
        result["provenance"] = self.data_integrity.provenance(source_name=MCP_SERVER_NAME)
        if order_related:
            result["live_order_submitted"] = False
            result["execution_engine"] = EXECUTION_ENGINE
            result["real_robinhood_connected"] = False
            result["real_money_at_risk"] = False
        return result

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()
