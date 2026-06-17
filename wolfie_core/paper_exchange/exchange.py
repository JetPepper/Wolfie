from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from wolfie_core.broker.environment import EXECUTION_ENGINE, MCP_SERVER_NAME, SOURCE_MODE, TRUTH_STATE


TERMINAL_STATUSES = {"filled", "cancelled", "rejected", "expired", "replaced"}


class PaperExchange:
    def __init__(self, starting_cash: float = 25000, simulated_liquidity: float = 50):
        self.starting_cash = float(starting_cash)
        self.cash = float(starting_cash)
        self.realized_pnl = 0.0
        self.day_pnl = 0.0
        self.simulated_liquidity = float(simulated_liquidity)
        self.positions: Dict[str, Dict[str, Any]] = {}
        self.orders: List[Dict[str, Any]] = []

    def account(self) -> Dict[str, Any]:
        positions = self.list_positions()
        equity = self.cash + sum(position["market_value"] for position in positions)
        return {
            "account_id": "PAPER-LOCAL-001",
            "cash": round(self.cash, 2),
            "buying_power": round(self.cash, 2),
            "equity": round(equity, 2),
            "realized_pnl": round(self.realized_pnl, 2),
            "unrealized_pnl": round(sum(position["unrealized_pnl"] for position in positions), 2),
            "day_pnl": round(self.day_pnl, 2),
            "positions": positions,
            "open_orders": [order for order in self.orders if order["status"] not in TERMINAL_STATUSES],
            "closed_orders": [order for order in self.orders if order["status"] in TERMINAL_STATUSES],
            "status": "simulated",
            "source_mode": SOURCE_MODE,
            "execution_engine": EXECUTION_ENGINE,
            **TRUTH_STATE,
        }

    def list_positions(self) -> List[Dict[str, Any]]:
        return [self._position_with_market_fields(position) for position in self.positions.values()]

    def preview_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        limit_price: float,
        quote: Dict[str, Any],
    ) -> Dict[str, Any]:
        decision = self._evaluate_order(symbol, side, order_type, quantity, limit_price, quote)
        now = self._now()
        return {
            "order_id": None,
            "client_order_id": None,
            "symbol": symbol,
            "side": side,
            "order_type": order_type,
            "limit_price": limit_price,
            "requested_quantity": quantity,
            "filled_quantity": decision["filled_quantity"],
            "remaining_quantity": quantity - decision["filled_quantity"],
            "avg_fill_price": decision["fill_price"],
            "status": decision["preview_status"],
            "data_status": decision["data_status"],
            "rejection_reason": decision["rejection_reason"],
            "estimated_notional": None if decision["fill_price"] is None else round(decision["fill_price"] * decision["filled_quantity"], 2),
            "created_at": now,
            "updated_at": now,
            "submitted_at": None,
            "filled_at": None,
            "cancelled_at": None,
            "replaced_by_order_id": None,
            **self._order_truth(),
        }

    def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        limit_price: float,
        quote: Dict[str, Any],
    ) -> Dict[str, Any]:
        now = self._now()
        order = self._base_order(symbol, side, order_type, quantity, limit_price, now)
        decision = self._evaluate_order(symbol, side, order_type, quantity, limit_price, quote)

        order["status"] = "accepted"
        order["submitted_at"] = now
        order["data_status"] = decision["data_status"]
        order["rejection_reason"] = decision["rejection_reason"]

        if decision["rejection_reason"]:
            order["status"] = "rejected"
        elif decision["filled_quantity"] == 0:
            order["status"] = "pending"
        elif decision["filled_quantity"] < quantity:
            order["status"] = "partially_filled"
            order["filled_at"] = now
        else:
            order["status"] = "filled"
            order["filled_at"] = now

        order["filled_quantity"] = decision["filled_quantity"]
        order["remaining_quantity"] = round(quantity - decision["filled_quantity"], 8)
        order["avg_fill_price"] = decision["fill_price"]

        if decision["filled_quantity"] > 0 and decision["fill_price"] is not None:
            self._apply_fill(symbol, side, decision["filled_quantity"], decision["fill_price"])

        self.orders.append(order)
        return order

    def cancel_order(self, order_id: str) -> Dict[str, Any]:
        order = self.get_order(order_id)
        if order is None:
            return self._missing_order(order_id)
        if order["status"] in TERMINAL_STATUSES:
            return order
        now = self._now()
        order["status"] = "cancelled"
        order["updated_at"] = now
        order["cancelled_at"] = now
        return order

    def replace_order(self, order_id: str, quantity: Optional[float], limit_price: Optional[float], quote: Dict[str, Any]) -> Dict[str, Any]:
        original = self.get_order(order_id)
        if original is None:
            return self._missing_order(order_id)
        if original["status"] in TERMINAL_STATUSES:
            return original

        replacement_quantity = original["remaining_quantity"] if quantity is None else quantity
        replacement_limit = original["limit_price"] if limit_price is None else limit_price
        replacement = self.place_order(
            original["symbol"],
            original["side"],
            original["order_type"],
            replacement_quantity,
            replacement_limit,
            quote,
        )
        original["status"] = "replaced"
        original["updated_at"] = self._now()
        original["replaced_by_order_id"] = replacement["order_id"]
        replacement["replaces_order_id"] = original["order_id"]
        return replacement

    def expire_order(self, order_id: str) -> Dict[str, Any]:
        order = self.get_order(order_id)
        if order is None:
            return self._missing_order(order_id)
        if order["status"] in TERMINAL_STATUSES:
            return order
        order["status"] = "expired"
        order["updated_at"] = self._now()
        return order

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        return next((order for order in self.orders if order["order_id"] == order_id), None)

    def list_orders(self) -> List[Dict[str, Any]]:
        return self.orders

    def _evaluate_order(self, symbol: str, side: str, order_type: str, quantity: float, limit_price: float, quote: Dict[str, Any]) -> Dict[str, Any]:
        rejection = self._rejection_reason(symbol, side, order_type, quantity, limit_price, quote)
        if rejection:
            return {
                "filled_quantity": 0,
                "fill_price": None,
                "preview_status": "rejected",
                "data_status": "UNKNOWN" if rejection in {"missing_quote", "stale_quote"} else "rejected",
                "rejection_reason": rejection,
            }

        fill_price = self._fill_price(side=side, limit_price=limit_price, quote=quote)
        if fill_price is None:
            return {
                "filled_quantity": 0,
                "fill_price": None,
                "preview_status": "pending",
                "data_status": "simulated",
                "rejection_reason": None,
            }

        filled_quantity = min(quantity, self.simulated_liquidity)
        return {
            "filled_quantity": filled_quantity,
            "fill_price": fill_price,
            "preview_status": "filled" if filled_quantity == quantity else "partially_filled",
            "data_status": "simulated",
            "rejection_reason": None,
        }

    def _rejection_reason(self, symbol: str, side: str, order_type: str, quantity: float, limit_price: float, quote: Dict[str, Any]) -> Optional[str]:
        if not symbol or not side or not order_type or quantity is None or limit_price is None:
            return "missing_required_field"
        if quote.get("status") == "UNKNOWN":
            return "missing_quote"
        if quote.get("status") == "stale":
            return "stale_quote"
        if not quote.get("tradeable", True):
            return "symbol_not_tradeable"
        if quote.get("halted", False):
            return "halted_symbol"
        if order_type != "limit":
            return "invalid_order_type"
        bid = quote.get("bid")
        ask = quote.get("ask")
        if bid is None or ask is None:
            return "missing_quote"
        if ask <= 0 or bid <= 0:
            return "missing_quote"
        spread_bps = ((ask - bid) / quote.get("last", ask)) * 10000
        if spread_bps > 100:
            return "wide_spread"
        market_reference = ask if side == "buy" else bid
        if abs(limit_price - market_reference) / market_reference > 0.2:
            return "limit_price_too_far_from_market"
        if side == "buy" and limit_price >= ask and ask * quantity > self.cash:
            return "insufficient_buying_power"
        if quantity > self.simulated_liquidity * 10:
            return "order_size_too_large"
        if quote.get("volume", 0) <= 0:
            return "liquidity_too_low"
        return None

    def _fill_price(self, side: str, limit_price: float, quote: Dict[str, Any]) -> Optional[float]:
        if side == "buy" and limit_price >= quote["ask"]:
            return quote["ask"]
        if side == "sell" and limit_price <= quote["bid"]:
            return quote["bid"]
        return None

    def _base_order(self, symbol: str, side: str, order_type: str, quantity: float, limit_price: float, now: str) -> Dict[str, Any]:
        order_id = f"paper_{uuid4().hex}"
        return {
            "id": order_id,
            "order_id": order_id,
            "client_order_id": f"wolfie_{uuid4().hex}",
            "symbol": symbol,
            "side": side,
            "order_type": order_type,
            "limit_price": limit_price,
            "quantity": quantity,
            "requested_quantity": quantity,
            "filled_quantity": 0,
            "remaining_quantity": quantity,
            "avg_fill_price": None,
            "filled_price": None,
            "status": "created",
            "data_status": "simulated",
            "created_at": now,
            "updated_at": now,
            "submitted_at": None,
            "filled_at": None,
            "cancelled_at": None,
            "replaced_by_order_id": None,
            "replaces_order_id": None,
            "rejection_reason": None,
            **self._order_truth(),
        }

    def _missing_order(self, order_id: str) -> Dict[str, Any]:
        now = self._now()
        return {
            "order_id": order_id,
            "status": "UNKNOWN",
            "data_status": "UNKNOWN",
            "rejection_reason": "missing_required_field",
            "created_at": now,
            "updated_at": now,
            **self._order_truth(),
        }

    def _apply_fill(self, symbol: str, side: str, quantity: float, price: float):
        notional = quantity * price
        current = self.positions.get(
            symbol,
            {
                "symbol": symbol,
                "quantity": 0,
                "avg_entry_price": 0,
                "market_price": price,
                "realized_pnl": 0,
                "updated_at": self._now(),
                "status": "simulated",
                "source_mode": SOURCE_MODE,
            },
        )

        if side == "buy":
            previous_quantity = current["quantity"]
            new_quantity = previous_quantity + quantity
            total_cost = current["avg_entry_price"] * previous_quantity + notional
            current["quantity"] = new_quantity
            current["avg_entry_price"] = round(total_cost / new_quantity, 2)
            self.cash -= notional
        elif side == "sell":
            sell_quantity = min(quantity, current["quantity"])
            self.realized_pnl += (price - current["avg_entry_price"]) * sell_quantity
            current["quantity"] = max(0, current["quantity"] - sell_quantity)
            self.cash += sell_quantity * price

        current["market_price"] = price
        current["updated_at"] = self._now()
        self.positions[symbol] = current

    def _position_with_market_fields(self, position: Dict[str, Any]) -> Dict[str, Any]:
        market_value = position["quantity"] * position["market_price"]
        unrealized = (position["market_price"] - position["avg_entry_price"]) * position["quantity"]
        return {
            **position,
            "average_price": position["avg_entry_price"],
            "last_price": position["market_price"],
            "market_value": round(market_value, 2),
            "unrealized_pnl": round(unrealized, 2),
            "realized_pnl": round(position.get("realized_pnl", 0), 2),
        }

    def _order_truth(self) -> Dict[str, Any]:
        return {
            "source_mode": SOURCE_MODE,
            "mcp_server": MCP_SERVER_NAME,
            "execution_engine": EXECUTION_ENGINE,
            "live_order_submitted": False,
            "real_robinhood_connected": False,
            "real_money_at_risk": False,
        }

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()
