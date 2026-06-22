from fastapi.testclient import TestClient

from apps.api.main import app
from wolfie_core.broker.environment import TRUTH_STATE


client = TestClient(app)


def test_live_beta_environment_is_paper_only_without_required_keys():
    status = TRUTH_STATE

    assert status["environment"] == "LIVE_AGENT_BETA_PAPER_ONLY"
    assert status["execution"] == "paper_only_execution"
    assert status["real_robinhood_connected"] is False
    assert status["market_data_mode"] == "ACQUISITION_LADDER"


def test_market_snapshot_without_symbols_does_not_seed_default_tickers():
    snapshot = client.get("/api/market/snapshot").json()

    assert snapshot["status"] == "SOURCE_UNAVAILABLE"
    assert snapshot["quotes"] == []
    assert "AAPL" not in str(snapshot)


def test_normal_fixture_ingestion_is_blocked_outside_dev_test_lab():
    response = client.post("/api/insiders/ingest-fixture", json={"fixture": "open_market_purchase_winner.json"}).json()

    assert response["status"] == "SOURCE_UNAVAILABLE"
    assert response["dev_test_lab_route"] == "/api/dev-test-lab/insiders/ingest-fixture"


def test_reasoning_trace_blocks_execution_when_source_data_is_missing():
    trace = client.get("/api/reasoning/trace", params={"symbol": "WOLF", "paper_capital": 1000}).json()

    assert trace["live_order_submitted"] is False
    assert trace["finalDecision"]["action"] == "block"
    assert "market_consensus" in trace["unavailableSources"]


def test_execution_planner_rejects_missing_symbol_without_default_ticker():
    from wolfie_core.broker.execution_planner import ExecutionPlanner
    from wolfie_core.costs.cost_model import CostModel
    from wolfie_core.risk.risk_manager import RiskManager

    plan = ExecutionPlanner(adapter=None, risk_manager=RiskManager(), cost_model=CostModel()).create_plan({}, "limit", 10, 1, None)

    assert plan["status"] == "rejected"
    assert plan["live_order_submitted"] is False
    assert plan["submission_status"] == "missing_symbol"
