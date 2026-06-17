from fastapi.testclient import TestClient

from apps.api.main import app
from wolfie_core.data_integrity.service import DataIntegrityService
from wolfie_core.mcp.robinhood_sim import RobinhoodSimMCPServer


client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_app_starts_without_robinhood_login_or_broker_credentials():
    response = client.get("/api/environment")

    assert response.status_code == 200
    body = response.json()
    assert body["environment"] == "SIMULATED_LIVE_MCP_LOCAL"
    assert body["broker_interface"] == "Robinhood-compatible MCP simulation"
    assert body["execution"] == "PaperExchange"
    assert body["real_robinhood_connected"] is False
    assert body["robinhood_login_required"] is False
    assert body["live_order_submitted"] is False
    assert body["real_money_at_risk"] is False
    assert "credential" not in body
    assert "token" not in body


def test_simulated_quote_is_labeled_simulated():
    response = client.get("/api/market/quote/AAPL")

    assert response.status_code == 200
    quote = response.json()
    assert quote["symbol"] == "AAPL"
    assert quote["status"] == "simulated"
    assert quote["source_name"] == "RobinhoodSimMCPServer"
    assert quote["provenance"]["source_mode"] == "simulated"
    assert quote["provenance"]["mcp_server"] == "RobinhoodSimMCPServer"


def test_missing_required_values_return_unknown():
    service = DataIntegrityService()

    labeled = service.require_fields(
        {"symbol": "AAPL", "bid": None},
        required_fields=["symbol", "bid", "ask"],
        source_name="unit-test",
    )

    assert labeled["status"] == "UNKNOWN"
    assert labeled["missing_fields"] == ["bid", "ask"]
    assert labeled["provenance"]["source_name"] == "unit-test"


def test_simulated_place_order_updates_paper_positions():
    payload = {
        "symbol": "AAPL",
        "side": "buy",
        "order_type": "limit",
        "quantity": 2,
        "limit_price": 200,
    }

    response = client.post("/api/orders/place", json=payload)

    assert response.status_code == 200
    order = response.json()
    assert order["status"] == "filled"
    assert order["data_status"] == "simulated"
    assert order["live_order_submitted"] is False
    assert order["execution_engine"] == "PaperExchange"
    assert order["source_mode"] == "simulated"

    positions = client.get("/api/paper/positions").json()
    aapl = next(position for position in positions if position["symbol"] == "AAPL")
    assert aapl["quantity"] >= 2
    assert aapl["status"] == "simulated"


def test_simulated_place_order_never_submits_live_order():
    server = RobinhoodSimMCPServer()

    order = server.place_order(
        symbol="AAPL",
        side="buy",
        order_type="limit",
        quantity=1,
        limit_price=200,
    )

    assert order["live_order_submitted"] is False
    assert order["real_robinhood_connected"] is False
    assert order["real_money_at_risk"] is False
    assert order["execution_engine"] == "PaperExchange"


def test_live_order_submitted_is_always_false_for_order_routes():
    preview = client.post(
        "/api/orders/preview",
        json={
            "symbol": "AAPL",
            "side": "buy",
            "order_type": "limit",
            "quantity": 1,
            "limit_price": 200,
        },
    ).json()
    placed = client.post(
        "/api/orders/place",
        json={
            "symbol": "AAPL",
            "side": "sell",
            "order_type": "limit",
            "quantity": 1,
            "limit_price": 100,
        },
    ).json()

    assert preview["live_order_submitted"] is False
    assert placed["live_order_submitted"] is False


def test_audit_log_records_simulated_order_placement():
    client.post(
        "/api/orders/place",
        json={
            "symbol": "AAPL",
            "side": "buy",
            "order_type": "limit",
            "quantity": 1,
            "limit_price": 200,
        },
    )

    response = client.get("/api/audit")

    assert response.status_code == 200
    events = response.json()
    assert any(event["event_type"] == "simulated_order_placement" for event in events)
    assert any(event["event_type"] == "paper_fill" for event in events)
    order_events = [
        event
        for event in events
        if event["event_type"] in {"simulated_order_placement", "paper_fill"}
    ]
    assert all(event["live_order_submitted"] is False for event in order_events)
    assert all(event["execution_engine"] == "PaperExchange" for event in order_events)


def test_simulated_data_is_never_labeled_verified():
    service = DataIntegrityService()

    labeled = service.label_simulated(
        {"symbol": "AAPL", "status": "verified"},
        source_name="RobinhoodSimMCPServer",
    )

    assert labeled["status"] == "simulated"
    assert labeled["provenance"]["source_mode"] == "simulated"
