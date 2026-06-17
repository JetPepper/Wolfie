import pytest
from fastapi.testclient import TestClient

from apps.api.main import app
from wolfie_core.mcp.contract_adapter import MCPContractAdapter, ModeNotEnabled
from wolfie_core.mcp.robinhood_sim import RobinhoodSimMCPServer


client = TestClient(app)


def test_mcp_tools_list_includes_phase2_simulated_tools():
    response = client.get("/api/mcp/tools")

    assert response.status_code == 200
    body = response.json()
    tools = body["tools"]
    assert body["status"] == "simulated"
    assert body["source_mode"] == "simulated"
    assert "get_market_data" in tools
    assert "get_historical_candles" in tools
    assert "get_instrument" in tools
    assert "get_trading_hours" in tools
    assert "get_fee_schedule" in tools
    assert "cancel_order" in tools
    assert "replace_order" in tools
    assert "get_order" in tools


def test_phase2_api_routes_preserve_provenance_and_status():
    candles = client.get("/api/market/candles/AAPL").json()
    instrument = client.get("/api/instruments/AAPL").json()
    hours = client.get("/api/trading-hours").json()
    fees = client.get("/api/fees").json()

    assert candles["status"] == "simulated"
    assert candles["source_mode"] == "simulated"
    assert len(candles["candles"]) >= 1
    assert instrument["tradeable"] is True
    assert instrument["source_mode"] == "simulated"
    assert hours["status"] == "simulated"
    assert fees["commission_per_order"]["status"] == "simulated"
    assert fees["spread_bps"]["status"] == "calculated"


def test_phase2_api_order_lookup_cancel_and_replace_routes():
    pending = client.post(
        "/api/orders/place",
        json={"symbol": "AAPL", "side": "buy", "order_type": "limit", "quantity": 1, "limit_price": 190},
    ).json()
    looked_up = client.get(f"/api/orders/{pending['order_id']}").json()
    replaced = client.post(
        "/api/orders/replace",
        json={"order_id": pending["order_id"], "quantity": 1, "limit_price": 196},
    ).json()
    second_pending = client.post(
        "/api/orders/place",
        json={"symbol": "AAPL", "side": "buy", "order_type": "limit", "quantity": 1, "limit_price": 190},
    ).json()
    cancelled = client.post("/api/orders/cancel", json={"order_id": second_pending["order_id"]}).json()

    assert looked_up["order_id"] == pending["order_id"]
    assert replaced["source_mode"] == "simulated"
    assert replaced["live_order_submitted"] is False
    assert cancelled["status"] == "cancelled"
    assert cancelled["execution_engine"] == "PaperExchange"


def test_future_real_robinhood_modes_are_disabled_stubs():
    with pytest.raises(ModeNotEnabled):
        MCPContractAdapter(mode="ROBINHOOD_MCP_PAPER_ONLY")

    with pytest.raises(ModeNotEnabled):
        MCPContractAdapter(mode="ROBINHOOD_LIVE_APPROVAL")


def test_place_order_appears_live_like_but_never_submits_live_order():
    server = RobinhoodSimMCPServer()

    order = server.place_order("AAPL", "buy", "limit", 1, 200)

    assert order["status"] == "filled"
    assert order["order_id"].startswith("paper_")
    assert order["client_order_id"].startswith("wolfie_")
    assert order["live_order_submitted"] is False
    assert order["execution_engine"] == "PaperExchange"
    assert order["source_mode"] == "simulated"
    assert order["provenance"]["mcp_server"] == "RobinhoodSimMCPServer"


def test_buy_limit_fills_when_limit_price_is_at_or_above_ask():
    server = RobinhoodSimMCPServer()

    order = server.place_order("AAPL", "buy", "limit", 2, 195.2)

    assert order["status"] == "filled"
    assert order["filled_quantity"] == 2
    assert order["remaining_quantity"] == 0
    assert order["avg_fill_price"] == 195.2


def test_buy_limit_remains_pending_when_limit_price_is_below_ask():
    server = RobinhoodSimMCPServer()

    order = server.place_order("AAPL", "buy", "limit", 2, 190)

    assert order["status"] == "pending"
    assert order["filled_quantity"] == 0
    assert order["remaining_quantity"] == 2
    assert order["avg_fill_price"] is None


def test_sell_limit_fills_when_limit_price_is_at_or_below_bid():
    server = RobinhoodSimMCPServer()
    server.place_order("AAPL", "buy", "limit", 2, 200)

    order = server.place_order("AAPL", "sell", "limit", 1, 195.1)

    assert order["status"] == "filled"
    assert order["filled_quantity"] == 1
    assert order["avg_fill_price"] == 195.1


def test_insufficient_buying_power_rejects_order():
    server = RobinhoodSimMCPServer()

    order = server.place_order("AAPL", "buy", "limit", 1000, 200)

    assert order["status"] == "rejected"
    assert order["rejection_reason"] == "insufficient_buying_power"
    assert order["live_order_submitted"] is False


def test_missing_quote_returns_unknown_rejected_order():
    server = RobinhoodSimMCPServer()

    order = server.place_order("MSFT", "buy", "limit", 1, 100)

    assert order["status"] == "rejected"
    assert order["data_status"] == "UNKNOWN"
    assert order["rejection_reason"] == "missing_quote"
    assert order["live_order_submitted"] is False


def test_cancel_order_cancels_pending_order():
    server = RobinhoodSimMCPServer()
    pending = server.place_order("AAPL", "buy", "limit", 2, 190)

    cancelled = server.cancel_order(pending["order_id"])

    assert cancelled["status"] == "cancelled"
    assert cancelled["cancelled_at"] is not None
    assert cancelled["live_order_submitted"] is False


def test_replace_order_creates_replacement_relationship():
    server = RobinhoodSimMCPServer()
    pending = server.place_order("AAPL", "buy", "limit", 2, 190)

    replacement = server.replace_order(pending["order_id"], quantity=2, limit_price=196)
    original = server.get_order(pending["order_id"])

    assert original["status"] == "replaced"
    assert original["replaced_by_order_id"] == replacement["order_id"]
    assert replacement["status"] in {"accepted", "pending", "partially_filled", "filled"}
    assert replacement["client_order_id"].startswith("wolfie_")


def test_positions_and_buying_power_update_after_fill():
    server = RobinhoodSimMCPServer()
    before = server.get_account()

    order = server.place_order("AAPL", "buy", "limit", 3, 200)
    after = server.get_account()
    position = server.get_positions()["positions"][0]

    assert order["status"] == "filled"
    assert position["symbol"] == "AAPL"
    assert position["quantity"] == 3
    assert position["avg_entry_price"] == 195.2
    assert after["buying_power"] < before["buying_power"]


def test_audit_log_records_phase2_lifecycle_events():
    server = RobinhoodSimMCPServer()

    pending = server.place_order("AAPL", "buy", "limit", 1, 190)
    server.cancel_order(pending["order_id"])
    rejected = server.place_order("MSFT", "buy", "limit", 1, 100)

    event_types = [event["event_type"] for event in server.audit_log.list_events()]
    order_events = [
        event
        for event in server.audit_log.list_events()
        if event["event_type"].startswith("order_") or event["event_type"] in {"paper_fill", "missing_data"}
    ]

    assert "order_accepted" in event_types
    assert "order_cancelled" in event_types
    assert "order_rejected" in event_types
    assert rejected["rejection_reason"] == "missing_quote"
    assert all(event["live_order_submitted"] is False for event in order_events)
    assert all(event["source_mode"] == "simulated" for event in order_events)


def test_simulated_data_is_not_labeled_verified_in_phase2_tools():
    server = RobinhoodSimMCPServer()

    responses = [
        server.get_account(),
        server.get_positions(),
        server.get_quote("AAPL"),
        server.get_market_data("AAPL"),
        server.get_historical_candles("AAPL"),
        server.get_instrument("AAPL"),
        server.get_trading_hours(),
        server.get_fee_schedule("AAPL"),
    ]

    assert all(response["status"] != "verified" for response in responses)
    assert all(response["source_mode"] == "simulated" for response in responses)
